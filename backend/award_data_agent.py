"""
award_data_agent.py — PointsPath Award Data Maintenance Agent
=============================================================

WHY THIS EXISTS
---------------
Airline award charts and hotel category rates change 1-3 times per year.
Manually hunting down changes across Aeroplan, Asia Miles, United MileagePlus,
Air India, Marriott, Hilton, Hyatt, and IHG is tedious and error-prone.

This script gives you a structured, auditable workflow:
  1. CHECK  — show current data from DB vs known published values
  2. DIFF   — flag any values that differ from the curated reference tables below
  3. APPLY  -- write approved changes to the database (routes table + hotel catalog)

APPROACH: Manual curation (not live scraping)
---------------------------------------------
We deliberately do NOT scrape airline / hotel sites automatically because:
  - Sites require JS rendering (Playwright/Selenium) which is fragile
  - Award charts are PDFs or dynamically loaded — hard to parse reliably
  - Airlines block bots aggressively (Aeroplan, United, Air India)
  - A wrong automated value is worse than a stale one

RECOMMENDED WORKFLOW (run monthly or after program devaluation news):
  1. Check FlyerTalk / The Points Guy / Rewards Canada for devaluation alerts
  2. Update the AWARD_DATA dict below with confirmed new values
  3. Run:  python award_data_agent.py --check    (see what would change)
  4. Run:  python award_data_agent.py --apply    (write changes to DB)
  5. Run:  python award_data_agent.py --report   (print full current state)

Usage
-----
  python award_data_agent.py            # show help
  python award_data_agent.py --check    # dry run: show proposed changes
  python award_data_agent.py --apply    # apply approved changes to SQLite DB
  python award_data_agent.py --report   # print full award data snapshot

Dependencies: sqlite3 (stdlib), json, datetime — no extra pip installs needed.
"""

import sqlite3
import json
import argparse
import sys
from datetime import date, datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "pointspath.db"

# ─── Curated Award Reference Data ─────────────────────────────────────────────
# Update these values when programs publish devaluations/revaluations.
# Source: program award charts (verify manually before updating)
# Last verified: 2026-03-22

AWARD_DATA = {
    # ── Airline routes: {(from, to, country): {economy, business, first, program}} ──
    # Format: economy points ONE-WAY per person
    "routes": [
        # ── AEROPLAN (Canada) ──
        # North America short-haul
        {"from": "Toronto",   "to": "Montreal",   "country": "CA", "economy": 6000,  "business": 15000, "program": "Aeroplan", "notes": "Zone 1 domestic"},
        {"from": "Toronto",   "to": "Vancouver",  "country": "CA", "economy": 15000, "business": 35000, "program": "Aeroplan", "notes": "Zone 2 transcontinental"},
        {"from": "Vancouver", "to": "Calgary",    "country": "CA", "economy": 6000,  "business": 15000, "program": "Aeroplan", "notes": "Zone 1 domestic"},
        # Transborder
        {"from": "Toronto",   "to": "New York",   "country": "CA", "economy": 6000,  "business": 25000, "program": "Aeroplan", "notes": "Zone 1 transborder"},
        {"from": "Vancouver", "to": "Los Angeles","country": "CA", "economy": 6000,  "business": 25000, "program": "Aeroplan", "notes": "Zone 1 transborder"},
        # Transatlantic
        {"from": "Toronto",   "to": "London",     "country": "CA", "economy": 35000, "business": 70000, "program": "Aeroplan", "notes": "Transatlantic — dynamic from 35k econ"},
        {"from": "Toronto",   "to": "Paris",      "country": "CA", "economy": 35000, "business": 70000, "program": "Aeroplan", "notes": "Transatlantic"},
        {"from": "Montreal",  "to": "Frankfurt",  "country": "CA", "economy": 35000, "business": 70000, "program": "Aeroplan", "notes": "Transatlantic"},
        # Transpacific
        {"from": "Vancouver", "to": "Tokyo",      "country": "CA", "economy": 35000, "business": 65000, "program": "Aeroplan", "notes": "Transpacific sweet spot"},
        {"from": "Vancouver", "to": "Hong Kong",  "country": "CA", "economy": 40000, "business": 75000, "program": "Aeroplan", "notes": "Transpacific"},

        # ── CHASE UR / UNITED MILEAGEPLUS (USA) ──
        {"from": "New York",      "to": "Los Angeles",  "country": "US", "economy": 12500, "business": 25000, "program": "United MileagePlus", "notes": "Saver domestic"},
        {"from": "Chicago",       "to": "London",       "country": "US", "economy": 30000, "business": 57500, "program": "United MileagePlus", "notes": "Transatlantic saver"},
        {"from": "San Francisco", "to": "Tokyo",        "country": "US", "economy": 35000, "business": 75000, "program": "United MileagePlus", "notes": "Transpacific saver"},
        {"from": "New York",      "to": "Paris",        "country": "US", "economy": 30000, "business": 57500, "program": "United MileagePlus", "notes": "Transatlantic"},
        {"from": "Los Angeles",   "to": "Sydney",       "country": "US", "economy": 40000, "business": 80000, "program": "United MileagePlus", "notes": "Transpacific"},

        # ── AIR INDIA FLYING RETURNS (India) ──
        {"from": "Mumbai",    "to": "Delhi",      "country": "IN", "economy": 2000,  "business": 4000,  "program": "Flying Returns", "notes": "Domestic"},
        {"from": "Delhi",     "to": "London",     "country": "IN", "economy": 20000, "business": 60000, "program": "Flying Returns", "notes": "Transatlantic via Air India One"},
        {"from": "Mumbai",    "to": "Dubai",      "country": "IN", "economy": 8000,  "business": 22000, "program": "Flying Returns", "notes": "Middle East zone"},
        {"from": "Delhi",     "to": "Singapore",  "country": "IN", "economy": 10000, "business": 30000, "program": "Flying Returns", "notes": "SE Asia"},
        {"from": "Bengaluru", "to": "Tokyo",      "country": "IN", "economy": 30000, "business": 80000, "program": "Flying Returns", "notes": "Transpacific via AI"},

        # ── ASIA MILES / CATHAY PACIFIC (Hong Kong) ──
        {"from": "Hong Kong", "to": "Tokyo",     "country": "HK", "economy": 10000, "business": 35000, "program": "Asia Miles", "notes": "Zone C short-haul"},
        {"from": "Hong Kong", "to": "Singapore", "country": "HK", "economy": 7500,  "business": 25000, "program": "Asia Miles", "notes": "Zone B short-haul"},
        {"from": "Hong Kong", "to": "London",    "country": "HK", "economy": 35000, "business": 67500, "program": "Asia Miles", "notes": "Transatlantic — CX J sweet spot"},
        {"from": "Hong Kong", "to": "New York",  "country": "HK", "economy": 40000, "business": 75000, "program": "Asia Miles", "notes": "Transpacific"},
        {"from": "Hong Kong", "to": "Sydney",    "country": "HK", "economy": 35000, "business": 60000, "program": "Asia Miles", "notes": "Zone D long-haul"},
        {"from": "Hong Kong", "to": "Bali",      "country": "HK", "economy": 7500,  "business": 25000, "program": "Asia Miles", "notes": "Zone B SE Asia"},
    ],

    # ── Hotel award categories ──
    "hotels": {
        "marriott": {
            "name": "Marriott Bonvoy",
            "last_verified": "2026-01-15",
            "categories": [
                {"tier": "Category 1", "pts_per_night": 7500,  "example": "Courtyard, Fairfield"},
                {"tier": "Category 2", "pts_per_night": 12500, "example": "Four Points, Aloft"},
                {"tier": "Category 3", "pts_per_night": 17500, "example": "Sheraton, Le Méridien"},
                {"tier": "Category 4", "pts_per_night": 25000, "example": "Westin, Renaissance"},
                {"tier": "Category 5", "pts_per_night": 35000, "example": "JW Marriott, Autograph"},
                {"tier": "Category 6", "pts_per_night": 50000, "example": "W Hotels, EDITION"},
                {"tier": "Category 7", "pts_per_night": 62500, "example": "Ritz-Carlton"},
                {"tier": "Category 8", "pts_per_night": 85000, "example": "St. Regis Maldives"},
            ],
        },
        "hilton": {
            "name": "Hilton Honors",
            "last_verified": "2026-01-15",
            "notes": "Hilton uses dynamic pricing — values are approximate minimums.",
            "categories": [
                {"tier": "Tier 1", "pts_per_night": 5000,   "example": "Hampton Inn, Tru"},
                {"tier": "Tier 2", "pts_per_night": 10000,  "example": "DoubleTree, Embassy Suites"},
                {"tier": "Tier 3", "pts_per_night": 30000,  "example": "Hilton Hotels & Resorts"},
                {"tier": "Tier 4", "pts_per_night": 60000,  "example": "Conrad Hotels"},
                {"tier": "Tier 5", "pts_per_night": 120000, "example": "Waldorf Astoria"},
            ],
        },
        "hyatt": {
            "name": "World of Hyatt",
            "last_verified": "2026-01-15",
            "notes": "Hyatt has the best fixed award chart. Category 1-4 = best value.",
            "categories": [
                {"tier": "Category 1", "pts_per_night": 3500,  "example": "Hyatt House, Hyatt Place"},
                {"tier": "Category 2", "pts_per_night": 8000,  "example": "Hyatt Regency Tier 2"},
                {"tier": "Category 3", "pts_per_night": 12000, "example": "Hyatt Centric"},
                {"tier": "Category 4", "pts_per_night": 18000, "example": "Grand Hyatt"},
                {"tier": "Category 5", "pts_per_night": 25000, "example": "Park Hyatt"},
                {"tier": "Category 6", "pts_per_night": 40000, "example": "Andaz, Alila"},
                {"tier": "Category 7", "pts_per_night": 55000, "example": "Park Hyatt Maldives"},
            ],
        },
        "ihg": {
            "name": "IHG One Rewards",
            "last_verified": "2026-01-15",
            "notes": "4th-night-free benefit makes multi-night stays very valuable.",
            "categories": [
                {"tier": "Tier 1", "pts_per_night": 10000,  "example": "Holiday Inn Express"},
                {"tier": "Tier 2", "pts_per_night": 25000,  "example": "Holiday Inn, Staybridge"},
                {"tier": "Tier 3", "pts_per_night": 40000,  "example": "Crowne Plaza"},
                {"tier": "Tier 4", "pts_per_night": 70000,  "example": "InterContinental, Kimpton"},
                {"tier": "Tier 5", "pts_per_night": 100000, "example": "Six Senses, Regent"},
            ],
        },
    },

    # ── Welcome bonus updates ──
    # Format: {card_name: new_bonus}  — update when issuers change public offers
    "welcome_bonuses": {
        # Canada
        "American Express Cobalt Card":          15000,
        "American Express Platinum Card":        80000,
        "TD Aeroplan Visa Infinite":             50000,
        "CIBC Aeroplan Visa Infinite":           50000,
        "American Express Aeroplan Reserve":     85000,
        "Scotiabank Gold American Express":      45000,
        "BMO Eclipse Visa Infinite":             60000,
        # USA
        "Chase Sapphire Reserve":                60000,
        "Chase Sapphire Preferred":              60000,
        "Amex Platinum":                        125000,
        "Amex Gold":                             60000,
        "Capital One Venture X":                 75000,
        # India
        "HDFC Infinia":                          12500,
        "Axis Magnus":                           25000,
        "HDFC Diners Club Black":                10000,
        # HK
        "Citi Prestige HK":                      50000,
        "American Express Platinum HK":          50000,
    },
}


# ─── DB Helpers ───────────────────────────────────────────────────────────────

def get_connection():
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found at {DB_PATH}")
        print("        Run the backend once to create it: uvicorn main:app")
        sys.exit(1)
    return sqlite3.connect(str(DB_PATH))


def fetch_routes(conn, country):
    cur = conn.execute(
        "SELECT from_city, to_city, economy_points, business_points, program FROM routes WHERE country = ?",
        (country,)
    )
    return {(r[0], r[1]): {"economy": r[2], "business": r[3], "program": r[4]} for r in cur.fetchall()}


def fetch_cards(conn, country):
    cur = conn.execute(
        "SELECT id, name, welcome_bonus FROM cards WHERE country = ?",
        (country,)
    )
    return {r[1]: {"id": r[0], "bonus": r[2]} for r in cur.fetchall()}


# ─── Actions ──────────────────────────────────────────────────────────────────

def check_routes(conn):
    """Diff curated AWARD_DATA routes against DB values."""
    changes = []
    countries = set(r["country"] for r in AWARD_DATA["routes"])
    for country in sorted(countries):
        db_routes = fetch_routes(conn, country)
        for ref in AWARD_DATA["routes"]:
            if ref["country"] != country:
                continue
            key = (ref["from"], ref["to"])
            if key not in db_routes:
                changes.append({
                    "action": "INSERT", "country": country,
                    "from": ref["from"], "to": ref["to"],
                    "economy": ref["economy"], "business": ref["business"],
                    "program": ref["program"], "notes": ref.get("notes", ""),
                })
            else:
                db = db_routes[key]
                if db["economy"] != ref["economy"] or db["business"] != ref["business"]:
                    changes.append({
                        "action": "UPDATE", "country": country,
                        "from": ref["from"], "to": ref["to"],
                        "old_economy": db["economy"], "new_economy": ref["economy"],
                        "old_business": db["business"], "new_business": ref["business"],
                        "program": ref["program"],
                    })
    return changes


def check_welcome_bonuses(conn):
    """Diff curated welcome_bonuses against DB card values."""
    changes = []
    for country in ["CA", "US", "IN", "HK"]:
        db_cards = fetch_cards(conn, country)
        for card_name, ref_bonus in AWARD_DATA["welcome_bonuses"].items():
            if card_name in db_cards:
                db_bonus = db_cards[card_name]["bonus"]
                if db_bonus != ref_bonus:
                    changes.append({
                        "action": "UPDATE_BONUS",
                        "card": card_name, "country": country,
                        "old": db_bonus, "new": ref_bonus,
                        "card_id": db_cards[card_name]["id"],
                    })
    return changes


def apply_changes(conn, route_changes, bonus_changes):
    """Write approved changes to DB. Wraps in a transaction."""
    with conn:
        today = date.today().isoformat()
        for c in route_changes:
            if c["action"] == "INSERT":
                conn.execute(
                    """INSERT INTO routes (country, from_city, to_city, economy_points, business_points, program, note)
                       VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (c["country"], c["from"], c["to"], c["economy"], c["business"], c["program"], c.get("notes", ""))
                )
                print(f"  [INSERT] {c['country']} {c['from']} → {c['to']} econ={c['economy']} biz={c['business']}")
            elif c["action"] == "UPDATE":
                conn.execute(
                    """UPDATE routes SET economy_points=?, business_points=?, updated_at=?
                       WHERE country=? AND from_city=? AND to_city=?""",
                    (c["new_economy"], c["new_business"], today, c["country"], c["from"], c["to"])
                )
                print(f"  [UPDATE] {c['country']} {c['from']} → {c['to']} econ: {c['old_economy']}→{c['new_economy']} biz: {c['old_business']}→{c['new_business']}")

        for b in bonus_changes:
            conn.execute(
                "UPDATE cards SET welcome_bonus=? WHERE id=?",
                (b["new"], b["card_id"])
            )
            print(f"  [BONUS]  {b['card']} ({b['country']}) {b['old']:,}→{b['new']:,} pts")

    print(f"\n✓ Applied {len(route_changes)} route changes + {len(bonus_changes)} bonus updates")


def print_report(conn):
    """Print a full snapshot of current DB state."""
    print("\n=== PointsPath Award Data Report ===")
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")

    for country in ["CA", "US", "IN", "HK"]:
        cur = conn.execute(
            "SELECT from_city, to_city, economy_points, business_points, program FROM routes WHERE country=? ORDER BY business_points DESC LIMIT 10",
            (country,)
        )
        rows = cur.fetchall()
        print(f"── Top routes [{country}] ──")
        for r in rows:
            print(f"  {r[0]:20s} → {r[1]:20s}  econ={r[2]:>6,}  biz={r[3]:>6,}  ({r[4]})")
        print()

    for country in ["CA", "US", "IN", "HK"]:
        cur = conn.execute(
            "SELECT name, welcome_bonus, annual_fee, tier FROM cards WHERE country=? ORDER BY welcome_bonus DESC",
            (country,)
        )
        rows = cur.fetchall()
        print(f"── Cards [{country}] ──")
        for r in rows:
            print(f"  {r[0]:45s}  bonus={r[1]:>7,}  fee={str(r[2]):>6}  tier={r[3]}")
        print()

    print("── Hotel award chart summary ──")
    for prog_id, prog in AWARD_DATA["hotels"].items():
        cats = prog["categories"]
        min_pts = cats[0]["pts_per_night"]
        max_pts = cats[-1]["pts_per_night"]
        print(f"  {prog['name']:30s}  {min_pts:>6,} – {max_pts:>7,} pts/night  (verified: {prog['last_verified']})")
    print()


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="PointsPath award data maintenance agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--check",  action="store_true", help="Dry run: show what would change")
    parser.add_argument("--apply",  action="store_true", help="Apply changes to SQLite DB")
    parser.add_argument("--report", action="store_true", help="Print full DB snapshot")
    args = parser.parse_args()

    if not (args.check or args.apply or args.report):
        parser.print_help()
        print("\nRecommended: python award_data_agent.py --check  (dry run first)")
        return

    conn = get_connection()

    if args.report:
        print_report(conn)
        return

    print("Scanning for changes...\n")
    route_changes  = check_routes(conn)
    bonus_changes  = check_welcome_bonuses(conn)
    total = len(route_changes) + len(bonus_changes)

    if total == 0:
        print("✓ All data is up to date — no changes needed.")
        return

    print(f"Found {len(route_changes)} route changes and {len(bonus_changes)} bonus updates:\n")

    for c in route_changes:
        if c["action"] == "INSERT":
            print(f"  + INSERT {c['country']} {c['from']} → {c['to']}  econ={c['economy']:,} biz={c['business']:,}  ({c.get('notes','')})")
        else:
            print(f"  ~ UPDATE {c['country']} {c['from']} → {c['to']}  econ: {c['old_economy']:,}→{c['new_economy']:,}  biz: {c['old_business']:,}→{c['new_business']:,}")

    for b in bonus_changes:
        print(f"  ~ BONUS  {b['card']} ({b['country']})  {b['old']:,} → {b['new']:,}")

    if args.apply:
        print(f"\nApplying {total} changes to {DB_PATH.name}...")
        apply_changes(conn, route_changes, bonus_changes)
    else:
        print(f"\nRun with --apply to write these {total} changes to the database.")

    conn.close()


if __name__ == "__main__":
    main()
