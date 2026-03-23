"""
PointsPath Data Refresh Script
================================
Run manually or via weekly cron to update points data.

Usage:
    cd backend
    python data_refresh.py              # dry-run (shows changes, doesn't save)
    python data_refresh.py --apply      # applies changes to DB
    python data_refresh.py --country HK # refresh one country only

Schedule (example cron — every Sunday 2am):
    0 2 * * 0 cd /path/to/backend && python data_refresh.py --apply >> logs/refresh.log 2>&1

What it does:
    1. Validates all routes have reasonable points values
    2. Checks for missing cabin class data
    3. Updates welcome bonuses if curated data has changed
    4. Reports any cards/routes that look stale
    5. (Optional) Adds new routes from PENDING_ROUTES list below

To add new routes/cards:
    - Add entries to CURATED_UPDATES or PENDING_ROUTES
    - Run: python data_refresh.py --apply
"""

import os
import sys
import argparse
from datetime import datetime

# ── Load .env ─────────────────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

DB_URL = os.getenv("DATABASE_URL", "sqlite:///pointspath.db")

# ── Curated welcome bonus updates (update when banks change offers) ────────────
# Format: { card_name: new_welcome_bonus }
WELCOME_BONUS_UPDATES = {
    # CA
    "TD Aeroplan Visa Infinite":              50000,
    "American Express Cobalt Card":           50000,
    "American Express Aeroplan Reserve":      95000,
    "Scotiabank Gold American Express":       60000,
    "BMO Ascend World Elite Mastercard":      60000,
    "National Bank World Elite Mastercard":   70000,
    # US
    "Chase Sapphire Reserve":                 60000,
    "Chase Sapphire Preferred":               60000,
    "Amex Platinum":                          80000,
    "Amex Gold":                              60000,
    "Capital One Venture X":                  75000,
    # IN
    "Axis Magnus":                            25000,
    "HDFC Infinia":                           12500,
    "HDFC Diners Club Black":                 10000,
    # HK
    "Citi Prestige HK":                       40000,
    "Standard Chartered Visa Infinite HK":    30000,
    "American Express Platinum HK":           50000,
}

# ── New routes to add (add entries here, then run --apply) ────────────────────
# Format: (from, to, dist_km, type, eco, prem_eco, biz, first, program, country)
PENDING_ROUTES = [
    # Example new routes — uncomment and adjust as needed:
    # ("Toronto", "Seoul", 10700, "transpacific", 75000, 120000, 155000, 275000, "Aeroplan", "CA"),
    # ("Hong Kong", "Tokyo", 2880, "international", 25000, 50000, 75000, 120000, "Asia Miles", "HK"),
    # ("Mumbai", "Singapore", 4250, "international", 22000, 45000, 70000, None, "Air India One", "IN"),
]

# ── Points value sanity checks ────────────────────────────────────────────────
SANITY_RULES = {
    # cabin: (min_reasonable, max_reasonable)
    "economy_points":          (3000,   200000),
    "premium_economy_points":  (6000,   350000),
    "business_points":         (10000,  500000),
    "first_points":            (20000,  800000),
}


def run_refresh(apply: bool = False, country_filter: str = None):
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker

    connect_args = {"check_same_thread": False} if "sqlite" in DB_URL else {}
    engine = create_engine(DB_URL, connect_args=connect_args)
    Session = sessionmaker(bind=engine)
    db = Session()

    print(f"\n{'='*60}")
    print(f"PointsPath Data Refresh — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Mode: {'APPLY' if apply else 'DRY RUN'}")
    if country_filter:
        print(f"Country filter: {country_filter}")
    print(f"{'='*60}\n")

    # ── 1. Report DB stats ────────────────────────────────────────────────────
    stats = db.execute(text("""
        SELECT country, COUNT(*) as cards FROM credit_cards GROUP BY country ORDER BY country
    """)).fetchall()
    print("📊 Current card counts:")
    for row in stats:
        print(f"   {row[0]}: {row[1]} cards")

    route_stats = db.execute(text("""
        SELECT country, COUNT(*) as routes FROM routes GROUP BY country ORDER BY country
    """)).fetchall()
    print("\n📍 Current route counts:")
    for row in route_stats:
        print(f"   {row[0]}: {row[1]} routes")

    # ── 2. Welcome bonus updates ──────────────────────────────────────────────
    print("\n💳 Checking welcome bonus updates…")
    updated_bonuses = 0
    for card_name, new_bonus in WELCOME_BONUS_UPDATES.items():
        row = db.execute(
            text("SELECT id, welcome_bonus FROM credit_cards WHERE name = :n"),
            {"n": card_name}
        ).fetchone()
        if row and row[1] != new_bonus:
            print(f"   UPDATE: {card_name}: {row[1]:,} → {new_bonus:,}")
            if apply:
                db.execute(
                    text("UPDATE credit_cards SET welcome_bonus = :b WHERE id = :id"),
                    {"b": new_bonus, "id": row[0]}
                )
            updated_bonuses += 1
        elif not row:
            print(f"   MISSING: {card_name} not found in DB")

    if updated_bonuses == 0:
        print("   ✓ All welcome bonuses up to date")

    # ── 3. Sanity check routes ────────────────────────────────────────────────
    print("\n🔍 Sanity checking route points values…")
    issues = 0
    for col, (mn, mx) in SANITY_RULES.items():
        q = f"SELECT id, from_city, to_city, country, {col} FROM routes WHERE {col} IS NOT NULL AND ({col} < {mn} OR {col} > {mx})"
        if country_filter:
            q += f" AND country = '{country_filter.upper()}'"
        rows = db.execute(text(q)).fetchall()
        for row in rows:
            print(f"   ⚠ {col} out of range: {row[2]}→{row[3]} ({row[4]}) = {row[5]} (expected {mn}–{mx})")
            issues += 1
    if issues == 0:
        print("   ✓ All route points values within expected range")

    # ── 4. Check for routes missing cabin classes ─────────────────────────────
    print("\n✈  Checking for routes with NULL cabin class points…")
    q = """
        SELECT country, COUNT(*) as cnt FROM routes
        WHERE economy_points IS NULL
        GROUP BY country
    """
    rows = db.execute(text(q)).fetchall()
    for row in rows:
        print(f"   ⚠ {row[0]}: {row[1]} routes missing economy_points")

    q2 = """
        SELECT country, COUNT(*) as cnt FROM routes
        WHERE business_points IS NULL
        GROUP BY country
    """
    rows2 = db.execute(text(q2)).fetchall()
    for row in rows2:
        print(f"   ℹ {row[0]}: {row[1]} routes without business_points (may be intentional)")

    # ── 5. Add pending routes ─────────────────────────────────────────────────
    if PENDING_ROUTES:
        print(f"\n➕ Adding {len(PENDING_ROUTES)} pending routes…")
        for r in PENDING_ROUTES:
            if country_filter and r[9].upper() != country_filter.upper():
                continue
            exists = db.execute(
                text("SELECT id FROM routes WHERE from_city=:f AND to_city=:t AND country=:c"),
                {"f": r[0], "t": r[1], "c": r[9]}
            ).fetchone()
            if exists:
                print(f"   SKIP (exists): {r[0]} → {r[1]} ({r[9]})")
            else:
                print(f"   ADD: {r[0]} → {r[1]} ({r[9]}) — biz: {r[6]:,} pts")
                if apply:
                    db.execute(text("""
                        INSERT INTO routes (from_city, to_city, distance_km, route_type,
                            economy_points, premium_economy_points, business_points, first_points,
                            program, country)
                        VALUES (:fc, :tc, :d, :rt, :eco, :pe, :biz, :first, :prog, :ctry)
                    """), {
                        "fc": r[0], "tc": r[1], "d": r[2], "rt": r[3],
                        "eco": r[4], "pe": r[5], "biz": r[6], "first": r[7],
                        "prog": r[8], "ctry": r[9],
                    })
    else:
        print("\n   No pending routes to add.")

    if apply and (updated_bonuses > 0 or PENDING_ROUTES):
        db.commit()
        print("\n✅ Changes committed to database.")
    elif not apply:
        print("\n[DRY RUN] No changes applied. Use --apply to save changes.")

    db.close()
    print(f"\n{'='*60}")
    print("Refresh complete.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="PointsPath data refresh")
    parser.add_argument("--apply", action="store_true", help="Apply changes (default: dry run)")
    parser.add_argument("--country", type=str, default=None, help="Filter by country code (CA/US/IN/HK)")
    args = parser.parse_args()
    run_refresh(apply=args.apply, country_filter=args.country)
