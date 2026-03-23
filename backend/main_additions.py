"""
PointsPath v3 — New Endpoint Additions
=======================================
INSTRUCTIONS: Copy these endpoints into your existing backend/main.py
Add them AFTER your existing routes, before the end of the file.
Do NOT replace your existing endpoints — these are pure additions.

These endpoints support:
- /cities          → city dropdown for trip calculator
- /calculate-points-v2 → award chart aware calculation (returns base + median + note)
- /calculate-gap-v2    → gap calc with welcome bonus awareness
- /sweet-spots         → best value routes
- /country-config      → currency/flag info per country
"""

from fastapi import Query
from typing import Optional
import json

# ─── Country config ───────────────────────────────────────────────────────────

COUNTRY_CONFIG = {
    "CA": {"name": "Canada", "currency": "CAD", "symbol": "C$", "flag": "🇨🇦", "program": "Aeroplan"},
    "US": {"name": "United States", "currency": "USD", "symbol": "$", "flag": "🇺🇸", "program": "Chase UR / MileagePlus"},
    "IN": {"name": "India", "currency": "INR", "symbol": "₹", "flag": "🇮🇳", "program": "Air India Flying Returns"},
    "HK": {"name": "Hong Kong", "currency": "HKD", "symbol": "HK$", "flag": "🇭🇰", "program": "Cathay Asia Miles"},
}

PEAK_MONTHS = {6, 7, 8, 12}
SHOULDER_MONTHS = {4, 5}

# ─── /country-config ─────────────────────────────────────────────────────────

@app.get("/country-config")
def country_config_endpoint(country: str = Query("CA")):
    """Return display config (currency, flag, program) for a country code."""
    return COUNTRY_CONFIG.get(country.upper(), COUNTRY_CONFIG["CA"])


# ─── /cities ─────────────────────────────────────────────────────────────────

@app.get("/cities")
def get_cities(country: str = Query("CA"), db: Session = Depends(get_db)):
    """Return unique list of cities for route dropdowns, filtered by country."""
    country = country.upper()

    # Try filtering by country column (added in seed_v3.py)
    try:
        from_cities = db.execute(
            text("SELECT DISTINCT from_city FROM routes WHERE country = :c ORDER BY from_city"),
            {"c": country}
        ).fetchall()
        to_cities = db.execute(
            text("SELECT DISTINCT to_city FROM routes WHERE country = :c ORDER BY to_city"),
            {"c": country}
        ).fetchall()
        all_cities = sorted(set([r[0] for r in from_cities] + [r[0] for r in to_cities]))
    except Exception:
        # Fallback: return all cities if country column doesn't exist yet
        rows = db.execute(text("SELECT DISTINCT from_city FROM routes ORDER BY from_city")).fetchall()
        all_cities = [r[0] for r in rows]

    return all_cities


# ─── /calculate-points-v2 ────────────────────────────────────────────────────

@app.get("/calculate-points-v2")
def calculate_points_v2(
    country: str = Query("CA"),
    from_city: str = Query(...),
    to_city: str = Query(...),
    cabin: str = Query("economy"),   # economy | premium_economy | business | first
    passengers: int = Query(1, ge=1, le=9),
    month: Optional[int] = Query(None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    """
    Award-chart-aware points calculation.
    Returns base points, median (for AC dynamic routes), seasonal note, and expert tip.
    """
    country = country.upper()

    CABIN_COL = {
        "economy": "economy_points",
        "premium_economy": "premium_economy_points",
        "business": "business_points",
        "first": "first_points",
    }
    col = CABIN_COL.get(cabin, "economy_points")

    # Try country-filtered lookup first, fall back to unfiltered
    try:
        route = db.execute(
            text("""
                SELECT from_city, from_code, to_city, to_code,
                       economy_points, premium_economy_points, business_points, first_points,
                       median_points_business, is_dynamic, peak_multiplier,
                       note, program, route_type
                FROM routes
                WHERE country = :c
                  AND LOWER(from_city) LIKE :fc
                  AND LOWER(to_city) LIKE :tc
                LIMIT 1
            """),
            {"c": country, "fc": f"%{from_city.lower()}%", "tc": f"%{to_city.lower()}%"}
        ).fetchone()
    except Exception:
        route = None

    if not route:
        # Fallback without country filter
        route = db.execute(
            text("""
                SELECT from_city, from_code, to_city, to_code,
                       economy_points, premium_economy_points, business_points, first_points,
                       NULL as median_points_business, FALSE as is_dynamic, 1.0 as peak_multiplier,
                       NULL as note, program, route_type
                FROM routes
                WHERE LOWER(from_city) LIKE :fc AND LOWER(to_city) LIKE :tc
                LIMIT 1
            """),
            {"fc": f"%{from_city.lower()}%", "tc": f"%{to_city.lower()}%"}
        ).fetchone()

    if not route:
        raise HTTPException(status_code=404, detail=f"Route '{from_city}' → '{to_city}' not found")

    # Get points for requested cabin; fall back to economy
    col_idx = {"economy_points": 4, "premium_economy_points": 5, "business_points": 6, "first_points": 7}
    pts = route[col_idx[col]]
    cabin_used = cabin
    if not pts:
        pts = route[4]  # economy fallback
        cabin_used = "economy"

    pts = pts or 0
    median_pts = route[8]  # median_points_business

    # Seasonal note (only for dynamic/AC routes)
    seasonal_note = None
    is_dynamic = bool(route[9]) if route[9] is not None else False
    peak_mult = float(route[10]) if route[10] else 1.0

    if is_dynamic and month:
        if month in PEAK_MONTHS:
            adj = int(pts * peak_mult)
            seasonal_note = f"Peak season — realistic cost closer to {adj:,} pts (+{int((peak_mult-1)*100)}%). Book early for best rates."
        elif month in SHOULDER_MONTHS:
            adj = int(pts * 1.1)
            seasonal_note = f"Shoulder season — slight premium expected (~{adj:,} pts)"
        else:
            seasonal_note = "Off-peak — best time to book. Lowest points rates available."

    return {
        "found": True,
        "route": f"{route[0]} ({route[1] or ''}) → {route[2]} ({route[3] or ''})",
        "program": route[12] or "",
        "cabin": cabin_used,
        "base_points": pts * passengers,
        "base_points_per_person": pts,
        "median_points": (median_pts * passengers) if median_pts and cabin_used == "business" else None,
        "median_points_per_person": median_pts if cabin_used == "business" else None,
        "seasonal_note": seasonal_note,
        "route_note": route[11],
        "route_type": route[13] or "",
        "passengers": passengers,
        "is_dynamic": is_dynamic,
        "last_updated": "March 2026",
    }


# ─── /calculate-gap-v2 ───────────────────────────────────────────────────────

@app.get("/calculate-gap-v2")
def calculate_gap_v2(
    country: str = Query("CA"),
    points_needed: int = Query(..., ge=0),
    points_current: int = Query(..., ge=0),
    timeline: int = Query(6, ge=1, le=60),
    card_id: int = Query(...),
    db: Session = Depends(get_db),
):
    """
    Gap calculation aware of welcome bonuses and earn rates.
    card_id: the database ID of the credit card.
    """
    card = db.execute(
        text("SELECT * FROM credit_cards WHERE id = :id"),
        {"id": card_id}
    ).fetchone()

    if not card:
        raise HTTPException(status_code=404, detail=f"Card id={card_id} not found")

    card_dict = dict(card._mapping)
    welcome = card_dict.get("welcome_bonus", 0) or 0
    gap = max(0, points_needed - points_current)
    remaining = max(0, gap - welcome)

    # Parse earn rates
    earn_rates_raw = card_dict.get("earn_rates", "{}")
    try:
        earn_map = json.loads(earn_rates_raw) if isinstance(earn_rates_raw, str) else (earn_rates_raw or {})
    except Exception:
        earn_map = {}

    if earn_map:
        rates = sorted(earn_map.values(), reverse=True)
        # Weighted avg: top rate 40%, 2nd 30%, rest 30%
        if len(rates) >= 2:
            avg_rate = rates[0] * 0.4 + rates[1] * 0.3 + sum(rates[2:]) * 0.3 / max(len(rates) - 2, 1)
        else:
            avg_rate = rates[0]
    else:
        avg_rate = 1.5

    avg_rate = round(avg_rate, 2)
    monthly_spend = round(remaining / timeline / avg_rate) if remaining > 0 and timeline > 0 and avg_rate > 0 else 0

    return {
        "card_id": card_id,
        "card_name": card_dict.get("name", ""),
        "card_issuer": card_dict.get("issuer", ""),
        "card_program": card_dict.get("program", ""),
        "annual_fee": card_dict.get("annual_fee"),
        "currency": card_dict.get("currency", "CAD"),
        "points_needed": points_needed,
        "points_current": points_current,
        "gap": gap,
        "welcome_bonus": welcome,
        "remaining_after_bonus": remaining,
        "avg_earn_rate": avg_rate,
        "timeline_months": timeline,
        "monthly_spend_needed": monthly_spend,
        "already_has_enough": gap <= 0,
        "bonus_covers_gap": welcome >= gap,
        "last_updated": "March 2026",
    }


# ─── /sweet-spots ────────────────────────────────────────────────────────────

@app.get("/sweet-spots")
def sweet_spots(
    country: str = Query("CA"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Return top value routes sorted by points-per-km (business class)."""
    country = country.upper()

    try:
        rows = db.execute(
            text("""
                SELECT from_city, from_code, to_city, to_code,
                       economy_points, business_points, first_points,
                       distance_km, route_type, note, program,
                       median_points_business
                FROM routes
                WHERE country = :c
                  AND business_points IS NOT NULL
                  AND distance_km IS NOT NULL
                  AND note IS NOT NULL
                ORDER BY (business_points::float / distance_km) ASC
                LIMIT :lim
            """),
            {"c": country, "lim": limit}
        ).fetchall()
    except Exception:
        rows = db.execute(
            text("""
                SELECT from_city, from_code, to_city, to_code,
                       economy_points, business_points, first_points,
                       distance_km, route_type, NULL as note, program, NULL as median_points_business
                FROM routes
                WHERE business_points IS NOT NULL AND distance_km IS NOT NULL
                ORDER BY (business_points::float / distance_km) ASC
                LIMIT :lim
            """),
            {"lim": limit}
        ).fetchall()

    return [
        {
            "from_city": r[0], "from_code": r[1],
            "to_city": r[2], "to_code": r[3],
            "economy_points": r[4],
            "business_points": r[5],
            "first_points": r[6],
            "distance_km": r[7],
            "route_type": r[8],
            "note": r[9],
            "program": r[10],
            "median_points_business": r[11],
            "value_score": round(r[5] / r[7], 2) if r[7] else None,
        }
        for r in rows
    ]
