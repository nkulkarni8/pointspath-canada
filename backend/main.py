from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import uvicorn, requests, os
from sqlalchemy.orm import Session
from sqlalchemy import text
from config import settings
from database import get_db, init_db, seed_database
from models import CreditCard as CreditCardModel, Route as RouteModel, SavedWallet as SavedWalletModel
from data.countries import COUNTRY_CONFIG, PEAK_MONTHS, SHOULDER_MONTHS
from data.earning_rates import CARD_EARNING_RATES
from data.hotels import HOTEL_PROGRAMS
from data.transfer_partners import TRANSFER_PARTNERS, partners_for_program, partners_from_program
from data.points_valuations import get_valuation
from data.alliances import get_alliance
from data.sweet_spots_curated import curated_sweet_spots
from data.stopovers import get_stopover_rule
from data.cabin_codes import CABIN_CODES
from auth import get_current_user_id

from contextlib import asynccontextmanager
import json

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed_database()
    yield

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION, lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Schemas ────────────────────────────────────────────────────────────────────

class TripRequest(BaseModel):
    from_city: str
    to_city: str
    depart_date: Optional[date] = None
    return_date: Optional[date] = None
    passengers: int = 1
    travel_class: str = "economy"
    country: str = "CA"
    month: Optional[int] = None  # 1-12, optional seasonal hint independent of depart_date

class PointsCalculation(BaseModel):
    total_points: int
    points_per_person: int
    route: str
    travel_class: str

class SpendingStrategy(BaseModel):
    cards: List[str]
    monthly_spend: int
    earn_rate: float
    months_needed: int
    total_spend: int
    description: str

class PointsGapRequest(BaseModel):
    points_needed: int
    points_current: int
    timeline_months: int
    card_ids: List[int]
    monthly_budget: Optional[int] = None
    country: str = "CA"

class CategorySpending(BaseModel):
    category: str
    monthly_spend: int
    multiplier: float
    monthly_points: int

class GapStrategy(BaseModel):
    card_name: str
    card_id: int
    avg_earn_rate: float
    monthly_spend_needed: int
    total_spend_needed: int
    monthly_points_earned: int
    total_points_earned: int
    category_breakdown: List[CategorySpending]
    budget_warning: Optional[str] = None

class WalletCategoryAllocation(CategorySpending):
    best_card_name: str
    best_card_id: int

class WalletStrategy(BaseModel):
    """Combined plan across every held card — each category uses whichever
    held card earns it the highest multiplier, instead of picking one 'best' card."""
    card_names: List[str]
    avg_earn_rate: float
    monthly_spend_needed: int
    total_spend_needed: int
    monthly_points_earned: int
    total_points_earned: int
    category_breakdown: List[WalletCategoryAllocation]
    budget_warning: Optional[str] = None

class PointsGapResponse(BaseModel):
    points_gap: int
    monthly_points_target: int
    timeline_months: int
    strategies: List[GapStrategy]
    wallet_strategy: Optional[WalletStrategy] = None
    is_achievable: bool
    total_monthly_spend: int
    calculated_budget: Optional[int] = None
    budget_status: Optional[str] = None

class WalletPayload(BaseModel):
    country: Optional[str] = None
    data: dict

# ── Helper ─────────────────────────────────────────────────────────────────────

def calculate_card_strategy(card, points_needed, months, user_monthly_budget=None):
    card_rates = CARD_EARNING_RATES.get(card.name, {"general": 1.0})
    monthly_points_needed = points_needed / months
    bonus_categories = {cat: mult for cat, mult in card_rates.items() if mult >= 1.5}

    if not bonus_categories:
        avg_rate = card_rates.get("general", 1.0)
        monthly_spend = monthly_points_needed / avg_rate
        bw = None
        if user_monthly_budget and monthly_spend > user_monthly_budget:
            bw = "❌ Exceeds your ${:,.0f} budget by ${:,.0f}".format(user_monthly_budget, monthly_spend - user_monthly_budget)
        elif monthly_spend > 10000:
            bw = "⚠️ Very high spending required — consider extending timeline"
        return {"card_name": card.name, "card_id": card.id, "avg_earn_rate": avg_rate,
                "monthly_spend_needed": int(monthly_spend), "total_spend_needed": int(monthly_spend * months),
                "monthly_points_earned": int(monthly_points_needed), "total_points_earned": int(points_needed),
                "category_breakdown": [CategorySpending(category="General", monthly_spend=int(monthly_spend),
                    multiplier=avg_rate, monthly_points=int(monthly_points_needed))],
                "budget_warning": bw}

    best_mult = max(bonus_categories.values())
    best_cats = [cat for cat, mult in bonus_categories.items() if mult == best_mult]
    spend_per = (monthly_points_needed / best_mult) / len(best_cats)
    pts_per   = spend_per * best_mult
    breakdown = []
    total_spend = 0
    for cat in best_cats:
        breakdown.append(CategorySpending(category=cat.replace("_"," ").title(),
            monthly_spend=int(spend_per), multiplier=best_mult, monthly_points=int(pts_per)))
        total_spend += spend_per

    bw = None
    if user_monthly_budget and total_spend > user_monthly_budget:
        bw = "❌ Exceeds your ${:,.0f} budget by ${:,.0f}".format(user_monthly_budget, total_spend - user_monthly_budget)
    elif total_spend > 10000:
        bw = "⚠️ Very high spending required — consider extending timeline"

    return {"card_name": card.name, "card_id": card.id, "avg_earn_rate": round(best_mult, 2),
            "monthly_spend_needed": int(total_spend), "total_spend_needed": int(total_spend * months),
            "monthly_points_earned": int(monthly_points_needed), "total_points_earned": int(points_needed),
            "category_breakdown": breakdown, "budget_warning": bw}


def calculate_wallet_strategy(cards, points_needed, months, user_monthly_budget=None):
    """Combine every held card into one plan: for each spend category seen across
    the whole wallet, route spend to whichever held card earns that category best."""
    if not cards:
        return None

    # best multiplier per category across the whole wallet
    best_per_category = {}  # cat -> (rate, card)
    for card in cards:
        rates = CARD_EARNING_RATES.get(card.name, {"general": 1.0})
        for cat, mult in rates.items():
            if mult < 1.5 and cat != "general":
                continue
            current = best_per_category.get(cat)
            if not current or mult > current[0]:
                best_per_category[cat] = (mult, card)

    if not best_per_category:
        return None

    monthly_points_needed = points_needed / months
    cats = sorted(best_per_category.items(), key=lambda kv: kv[1][0], reverse=True)
    best_mult = cats[0][1][0]
    best_cats = [(cat, rate, card) for cat, (rate, card) in cats if rate == best_mult]

    spend_per = (monthly_points_needed / best_mult) / len(best_cats)
    breakdown, total_spend, card_names = [], 0, []
    for cat, rate, card in best_cats:
        pts_per = spend_per * rate
        breakdown.append(WalletCategoryAllocation(
            category=cat.replace("_", " ").title(), monthly_spend=int(spend_per),
            multiplier=rate, monthly_points=int(pts_per),
            best_card_name=card.name, best_card_id=card.id))
        total_spend += spend_per
        if card.name not in card_names:
            card_names.append(card.name)

    bw = None
    if user_monthly_budget and total_spend > user_monthly_budget:
        bw = "❌ Exceeds your ${:,.0f} budget by ${:,.0f}".format(user_monthly_budget, total_spend - user_monthly_budget)
    elif total_spend > 10000:
        bw = "⚠️ Very high spending required — consider extending timeline"

    return WalletStrategy(
        card_names=card_names, avg_earn_rate=round(best_mult, 2),
        monthly_spend_needed=int(total_spend), total_spend_needed=int(total_spend * months),
        monthly_points_earned=int(monthly_points_needed), total_points_earned=int(points_needed),
        category_breakdown=breakdown, budget_warning=bw)

# ── Startup ────────────────────────────────────────────────────────────────────



# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"name": "PointsPath API", "version": "4.0.0", "countries": ["CA", "US", "IN", "HK"]}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check(db: Session = Depends(get_db)):
    try:
        return {"status": "healthy", "timestamp": datetime.now().isoformat(), "version": "4.0.0",
                "database": {"cards": db.query(CreditCardModel).count(),
                             "routes": db.query(RouteModel).count()}}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "degraded", "error": str(e)})

# ── NEW: Cities endpoint — powers the dropdown selectors ──────────────────────
@app.get("/cities")
async def get_cities(
    country: str = Query(..., description="Country code: CA, US, IN, HK"),
    db: Session = Depends(get_db)
):
    """
    Returns all origin/destination cities and a routes_map for the given country.
    routes_map: { from_city: [to_city, ...] } — used by frontend to filter
    To dropdown based on selected From city (prevents 404 on invalid pairs).
    """
    country = country.upper()

    # Fetch all route pairs for this country
    pairs = db.execute(
        text("SELECT from_city, to_city FROM routes WHERE country = :c ORDER BY from_city, to_city"),
        {"c": country}
    ).fetchall()

    routes_map: dict = {}
    for fc, tc in pairs:
        routes_map.setdefault(fc, [])
        if tc not in routes_map[fc]:
            routes_map[fc].append(tc)

    from_cities = sorted(routes_map.keys())
    to_cities   = sorted(set(tc for tcs in routes_map.values() for tc in tcs))

    return {
        "country": country,
        "from_cities": from_cities,
        "to_cities": to_cities,
        "routes_map": routes_map,
    }

@app.post("/subscribe-email")
async def subscribe_email(email: str):
    try:
        if not settings.BEEHIIV_API_KEY or not settings.BEEHIIV_PUB_ID:
            return {"success": True, "message": "Subscribed (test mode)"}
        response = requests.post(
            f"https://api.beehiiv.com/v2/publications/{settings.BEEHIIV_PUB_ID}/subscriptions",
            headers={"Authorization": f"Bearer {settings.BEEHIIV_API_KEY}", "Content-Type": "application/json"},
            json={"email": email, "reactivate_existing": False, "send_welcome_email": True,
                  "utm_source": "pointspath", "utm_medium": "website"},
            timeout=10
        )
        if response.status_code in [200, 201]:
            return {"success": True, "message": "Subscribed successfully"}
        raise HTTPException(status_code=response.status_code, detail=f"Beehiiv error: {response.text}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

@app.post("/calculate-points")
async def calculate_points(trip: TripRequest, db: Session = Depends(get_db)):
    """
    Award-chart-aware points calculation (merges the former v1 exact/reverse-direction
    lookup with v2's fuzzy match and seasonal note — one endpoint, one source of truth).
    """
    from_city = trip.from_city.strip()
    to_city   = trip.to_city.strip()
    country   = trip.country.upper()
    cabin     = trip.travel_class.lower().replace(" ", "_")

    CABIN_COL = {"economy": RouteModel.economy_points, "premium_economy": RouteModel.premium_economy_points,
                 "business": RouteModel.business_points, "first": RouteModel.first_points}
    if cabin not in CABIN_COL:
        raise HTTPException(status_code=400, detail=f"Invalid travel class: {trip.travel_class}")

    def _find(exact: bool):
        q = db.query(RouteModel).filter(RouteModel.country == country)
        if exact:
            q = q.filter(RouteModel.from_city == from_city.title(), RouteModel.to_city == to_city.title())
        else:
            q = q.filter(RouteModel.from_city.ilike(f"%{from_city}%"), RouteModel.to_city.ilike(f"%{to_city}%"))
        route = q.first()
        if route:
            return route
        q = db.query(RouteModel).filter(RouteModel.country == country)
        if exact:
            q = q.filter(RouteModel.from_city == to_city.title(), RouteModel.to_city == from_city.title())
        else:
            q = q.filter(RouteModel.from_city.ilike(f"%{to_city}%"), RouteModel.to_city.ilike(f"%{from_city}%"))
        return q.first()

    route = _find(exact=True) or _find(exact=False)
    if not route:
        raise HTTPException(status_code=404,
            detail=f"Route not found: {from_city} → {to_city} ({country}). Please select cities from the dropdown.")

    pts = getattr(route, CABIN_COL[cabin].key) or route.economy_points or 0
    cabin_used = cabin if getattr(route, CABIN_COL[cabin].key) else "economy"
    total = pts * trip.passengers

    seasonal_note = None
    if trip.month:
        if trip.month in PEAK_MONTHS:
            seasonal_note = "Peak season (Jun–Aug / Dec) — expect higher award availability costs. Book early."
        elif trip.month in SHOULDER_MONTHS:
            seasonal_note = "Shoulder season — slight premium over base rates possible."
        else:
            seasonal_note = "Off-peak — best time to book. Lowest award rates typically available."

    return {
        "found": True,
        "route": f"{route.from_city} → {route.to_city}",
        "program": route.program or "",
        "cabin": cabin_used,
        "base_points": total,
        "base_points_per_person": pts,
        "median_points": None,
        "median_points_per_person": None,
        "seasonal_note": seasonal_note,
        "route_note": None,
        "route_type": route.route_type or "",
        "passengers": trip.passengers,
        "is_dynamic": False,
        "last_updated": route.updated_at.strftime("%B %Y") if route.updated_at else None,
    }

@app.post("/strategies")
async def calculate_strategies(trip: TripRequest, db: Session = Depends(get_db)):
    from_city = trip.from_city.strip().title()
    to_city   = trip.to_city.strip().title()
    country   = trip.country.upper()

    route = db.query(RouteModel).filter(
        RouteModel.from_city == from_city, RouteModel.to_city == to_city,
        RouteModel.country == country).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    class_map = {"economy": route.economy_points, "premium_economy": route.premium_economy_points,
                 "business": route.business_points, "first": route.first_points}
    pts = (class_map.get(trip.travel_class.lower().replace(" ", "_")) or route.economy_points) * trip.passengers

    top_cards = db.query(CreditCardModel).filter(
        CreditCardModel.is_active == True, CreditCardModel.country == country
    ).order_by(CreditCardModel.welcome_bonus.desc()).limit(3).all()

    strategies = []
    for card in top_cards:
        bonus     = card.welcome_bonus or 0
        remaining = max(0, pts - bonus)
        earn_rate = 2.5 if any(k in card.name for k in ["Reserve","Privilege","Infinia","Magnus","Aspire","Infinite"]) else 1.5
        monthly_spend = 2500
        months = max(1, int(remaining / (monthly_spend * earn_rate))) if remaining > 0 else 1
        strategies.append({"cards": [card.name], "monthly_spend": monthly_spend, "earn_rate": earn_rate,
            "months_needed": months, "total_spend": monthly_spend * months,
            "description": f"Get {bonus:,} welcome bonus + earn {earn_rate}x on spending."})
    return strategies

@app.post("/calculate-gap")
async def calculate_points_gap(gap_request: PointsGapRequest, db: Session = Depends(get_db)):
    points_gap = gap_request.points_needed - gap_request.points_current
    if points_gap <= 0:
        raise HTTPException(status_code=400, detail="You already have enough points!")

    user_cards = db.query(CreditCardModel).filter(CreditCardModel.id.in_(gap_request.card_ids)).all()
    if not user_cards:
        raise HTTPException(status_code=400, detail="No valid cards selected")

    monthly_pts_target = points_gap / gap_request.timeline_months
    strategies = []
    for card in user_cards:
        s = calculate_card_strategy(card, points_gap, gap_request.timeline_months, gap_request.monthly_budget)
        strategies.append(GapStrategy(**s))
    strategies.sort(key=lambda x: x.avg_earn_rate, reverse=True)

    wallet_strategy = (calculate_wallet_strategy(user_cards, points_gap, gap_request.timeline_months,
                                                  gap_request.monthly_budget) if len(user_cards) > 1 else None)

    best = strategies[0] if strategies else None
    is_achievable = True
    total_monthly_spend = best.monthly_spend_needed if best else 0
    calculated_budget = None
    budget_status = None

    if gap_request.monthly_budget:
        if best:
            is_achievable = best.monthly_spend_needed <= gap_request.monthly_budget
            budget_status = (f"✅ Achievable within your ${gap_request.monthly_budget:,} monthly budget"
                            if is_achievable else
                            f"⚠️ Exceeds budget by ${best.monthly_spend_needed - gap_request.monthly_budget:,}/month")
    else:
        if best:
            calculated_budget = best.monthly_spend_needed
            budget_status = (f"⚠️ ${calculated_budget:,}/month — consider a longer timeline" if calculated_budget > 10000
                            else f"💡 ${calculated_budget:,}/month — verify this fits your budget" if calculated_budget > 5000
                            else f"✅ ${calculated_budget:,}/month — reasonable for most budgets")
            is_achievable = calculated_budget <= 10000

    return PointsGapResponse(points_gap=points_gap, monthly_points_target=int(monthly_pts_target),
        timeline_months=gap_request.timeline_months, strategies=strategies, wallet_strategy=wallet_strategy,
        is_achievable=is_achievable, total_monthly_spend=total_monthly_spend,
        calculated_budget=calculated_budget, budget_status=budget_status)


@app.get("/cards")
async def get_cards(country: Optional[str] = Query(None), program: Optional[str] = None,
                    db: Session = Depends(get_db)):
    q = db.query(CreditCardModel).filter(CreditCardModel.is_active == True)
    if country: q = q.filter(CreditCardModel.country == country.upper())
    if program: q = q.filter(CreditCardModel.program.ilike(f"%{program}%"))
    cards = q.all()

    def _tier(fee):
        if fee and fee >= 400: return "premium"
        if fee and fee >= 100: return "mid"
        return "entry"

    return [
        {
            "id": c.id,
            "name": c.name,
            "issuer": c.issuer,
            "program": c.program,
            "earn_rate": c.earn_rate,
            "earn_rates": CARD_EARNING_RATES.get(c.name, {}),
            "annual_fee": c.annual_fee,
            "welcome_bonus": c.welcome_bonus,
            "country": c.country,
            "is_active": c.is_active,
            "tier": _tier(c.annual_fee),
            "affiliate_url": c.affiliate_url,
            "last_updated": c.updated_at.strftime("%B %Y") if c.updated_at else None,
        }
        for c in cards
    ]

@app.get("/cards/{card_id}")
async def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(CreditCardModel).filter(CreditCardModel.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"id": card.id, "name": card.name, "issuer": card.issuer, "program": card.program,
            "earn_rate": card.earn_rate, "annual_fee": card.annual_fee, "welcome_bonus": card.welcome_bonus,
            "country": card.country, "is_active": card.is_active}

@app.get("/routes")
async def get_routes(country: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(RouteModel)
    if country: q = q.filter(RouteModel.country == country.upper())
    routes = q.all()
    return {"count": len(routes), "routes": [
        {"from": r.from_city, "to": r.to_city, "economy": r.economy_points,
         "premium_economy": r.premium_economy_points, "business": r.business_points,
         "first": r.first_points, "distance": r.distance_km, "type": r.route_type,
         "program": r.program, "country": r.country} for r in routes]}

# ─── /country-config ─────────────────────────────────────────────────────────

@app.get("/country-config")
def country_config_endpoint(country: str = Query("CA")):
    """Return display config (currency, flag, program) for a country code."""
    return COUNTRY_CONFIG.get(country.upper(), COUNTRY_CONFIG["CA"])




# ─── /transfer-partners ──────────────────────────────────────────────────────

@app.get("/transfer-partners")
def get_transfer_partners(
    to_program: Optional[str] = Query(None, description="e.g. 'Aeroplan', 'Marriott Bonvoy'"),
    from_program: Optional[str] = Query(None, description="e.g. 'Amex Membership Rewards'"),
    country: Optional[str] = Query(None),
):
    """Standard (non-promotional) bank → loyalty-program transfer ratios."""
    if to_program:
        return partners_for_program(to_program, country)
    if from_program:
        return partners_from_program(from_program, country)
    rows = TRANSFER_PARTNERS
    if country:
        rows = [p for p in rows if p["country"] == country.upper()]
    return rows


# ─── /points-valuations ──────────────────────────────────────────────────────

@app.get("/points-valuations")
def points_valuations(program: Optional[str] = Query(None, description="e.g. 'Aeroplan', 'Membership Rewards'")):
    """Floor/ceiling cents-per-point valuation for a loyalty program, sourced from
    published monthly valuation guides. Returns null when we have no sourced match —
    never a guessed number."""
    if program:
        return get_valuation(program)
    from data.points_valuations import ALL_VALUATIONS
    return ALL_VALUATIONS


# ─── /alliances ──────────────────────────────────────────────────────────────

@app.get("/alliances")
def alliances(program: Optional[str] = Query(None, description="e.g. 'Aeroplan', 'MileagePlus'")):
    """Which airline alliance a program's airline belongs to — explains why a
    program's chart reaches a given partner airline."""
    if program:
        return get_alliance(program)
    from data.alliances import PROGRAM_TO_ALLIANCE
    return PROGRAM_TO_ALLIANCE


# ─── /sweet-spots-curated ────────────────────────────────────────────────────

@app.get("/sweet-spots-curated")
def sweet_spots_curated_endpoint(
    program: Optional[str] = Query(None),
    kind: Optional[str] = Query(None, description="flight | hotel"),
):
    """Editorial 'legendary/excellent/good' redemptions with sourcing — distinct
    from /sweet-spots, which is computed from PointsPath's own route data."""
    return curated_sweet_spots(program, kind)


# ─── /stopovers ──────────────────────────────────────────────────────────────

@app.get("/stopovers")
def stopovers(program: str = Query(..., description="e.g. 'Aeroplan'")):
    rule = get_stopover_rule(program)
    if not rule:
        return {"allowed": None, "note": "No sourced stopover rule for this program yet."}
    return rule


# ─── /cabin-codes ────────────────────────────────────────────────────────────

@app.get("/cabin-codes")
def cabin_codes():
    return CABIN_CODES


# ─── /wallet — server-side saved journey, replaces device-only localStorage ──

@app.get("/wallet")
def get_wallet(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    wallet = db.query(SavedWalletModel).filter(SavedWalletModel.supabase_user_id == user_id).first()
    if not wallet:
        return {"country": None, "data": {}}
    return {"country": wallet.country, "data": json.loads(wallet.data), "updated_at": wallet.updated_at.isoformat()}


@app.put("/wallet")
def put_wallet(payload: WalletPayload, db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id)):
    wallet = db.query(SavedWalletModel).filter(SavedWalletModel.supabase_user_id == user_id).first()
    data_str = json.dumps(payload.data)
    if wallet:
        wallet.country = payload.country
        wallet.data = data_str
    else:
        wallet = SavedWalletModel(supabase_user_id=user_id, country=payload.country, data=data_str)
        db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return {"country": wallet.country, "data": json.loads(wallet.data), "updated_at": wallet.updated_at.isoformat()}


# ─── /sweet-spots ────────────────────────────────────────────────────────────

@app.get("/sweet-spots")
def sweet_spots(
    country: str = Query("CA"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Return top value routes sorted by points-per-km (business class)."""
    country = country.upper()

    # Use CAST(... AS REAL) which works on both SQLite and PostgreSQL
    rows = db.execute(
        text("""
            SELECT from_city, NULL as from_code, to_city, NULL as to_code,
                   economy_points, business_points, first_points,
                   distance_km, route_type, NULL as note, program, NULL as median_points_business
            FROM routes
            WHERE country = :c
              AND business_points IS NOT NULL
              AND distance_km IS NOT NULL
            ORDER BY CAST(business_points AS REAL) / CAST(distance_km AS REAL) ASC
            LIMIT :lim
        """),
        {"c": country, "lim": limit}
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


@app.get("/hotels")
def get_hotels(country: str = Query("CA")):
    """Return hotel loyalty programs with earn strategies for the given country."""
    country = country.upper()
    programs = [p for p in HOTEL_PROGRAMS if country in p.get("countries", [])]
    # Attach country-specific card recommendations
    for p in programs:
        p = dict(p)
    return programs


# ─── Calculate hotel points needed ───────────────────────────────────────────

@app.get("/hotels/calculate")
def calculate_hotel_points(
    program: str = Query(..., description="marriott | hilton | hyatt | ihg"),
    tier: int = Query(..., ge=1, description="Category/tier number (1-based)"),
    nights: int = Query(1, ge=1, le=30),
):
    """Return points needed for a hotel stay."""
    prog = next((p for p in HOTEL_PROGRAMS if p["id"] == program.lower()), None)
    if not prog:
        raise HTTPException(status_code=404, detail=f"Program '{program}' not found")
    cats = prog["categories"]
    if not cats:
        raise HTTPException(status_code=400,
            detail=f"{prog['name']} has no published per-night award chart in our data — books by the night or by brand tier instead.")
    idx = min(tier - 1, len(cats) - 1)
    cat = cats[idx]
    base = cat["points_per_night"]
    total = base * nights
    return {
        "program": prog["name"],
        "tier": cat["tier"],
        "tier_label": cat["label"],
        "example_hotels": cat["example"],
        "points_per_night": base,
        "nights": nights,
        "total_points": total,
        "sweet_spot": prog["sweet_spot"],
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=settings.ENVIRONMENT == "development")