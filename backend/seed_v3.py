"""
PointsPath v3 Database Seeder
Adds new routes and cards to the existing Neon PostgreSQL database.

SAFE: Only INSERTs new records. Does not modify or delete existing data.
Run ONCE after deploying the v3 backend changes.

Usage:
    cd backend
    python seed_v3.py

Requires:
    DATABASE_URL env var pointing to Neon PostgreSQL
    (same .env used by main.py)
"""

import os
import sys
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not set. Add it to backend/.env")
    sys.exit(1)

# Use psycopg2 directly to avoid SQLAlchemy model conflicts
import psycopg2
from psycopg2.extras import execute_values

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("✅ Connected to Neon PostgreSQL")

# ─── Check existing state ─────────────────────────────────────────────────────
cur.execute("SELECT COUNT(*) FROM credit_cards")
existing_cards = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM routes")
existing_routes = cur.fetchone()[0]
print(f"   Existing: {existing_cards} cards, {existing_routes} routes")

# Get existing route pairs to avoid duplicates
cur.execute("SELECT LOWER(from_city), LOWER(to_city), COALESCE(country,'CA') FROM routes")
existing_route_pairs = set((r[0], r[1], r[2]) for r in cur.fetchall())

# Get existing card names to avoid duplicates
cur.execute("SELECT LOWER(name) FROM credit_cards")
existing_card_names = set(r[0] for r in cur.fetchall())

print(f"   Loaded {len(existing_route_pairs)} existing route pairs")

# ─── Check schema — does routes table have country column? ────────────────────
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'country'
""")
routes_has_country = cur.fetchone() is not None

cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'note'
""")
routes_has_note = cur.fetchone() is not None

cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'routes' AND column_name = 'median_points_business'
""")
routes_has_median = cur.fetchone() is not None

print(f"   routes.country: {'yes' if routes_has_country else 'NO - will add'}")
print(f"   routes.note: {'yes' if routes_has_note else 'NO - will add'}")
print(f"   routes.median_points_business: {'yes' if routes_has_median else 'NO - will add'}")

# ─── Schema migrations (additive only) ───────────────────────────────────────
print("\n── Schema migrations ──────────────────────────────────────────────────────")

if not routes_has_country:
    cur.execute("ALTER TABLE routes ADD COLUMN country VARCHAR(2) DEFAULT 'CA'")
    cur.execute("UPDATE routes SET country = 'CA' WHERE country IS NULL")
    print("   ✅ Added routes.country column")

if not routes_has_note:
    cur.execute("ALTER TABLE routes ADD COLUMN note TEXT")
    print("   ✅ Added routes.note column")

if not routes_has_median:
    cur.execute("ALTER TABLE routes ADD COLUMN median_points_business INTEGER")
    cur.execute("ALTER TABLE routes ADD COLUMN is_dynamic BOOLEAN DEFAULT FALSE")
    cur.execute("ALTER TABLE routes ADD COLUMN peak_multiplier FLOAT DEFAULT 1.0")
    print("   ✅ Added routes.median_points_business, is_dynamic, peak_multiplier columns")

# Check credit_cards for country and last_updated
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'credit_cards' AND column_name = 'country'
""")
cards_has_country = cur.fetchone() is not None

cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'credit_cards' AND column_name = 'last_updated'
""")
cards_has_last_updated = cur.fetchone() is not None

cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'credit_cards' AND column_name = 'tier'
""")
cards_has_tier = cur.fetchone() is not None

if not cards_has_country:
    cur.execute("ALTER TABLE credit_cards ADD COLUMN country VARCHAR(2) DEFAULT 'CA'")
    cur.execute("UPDATE credit_cards SET country = 'CA' WHERE country IS NULL")
    print("   ✅ Added credit_cards.country column")

if not cards_has_last_updated:
    cur.execute("ALTER TABLE credit_cards ADD COLUMN last_updated VARCHAR(20) DEFAULT 'March 2026'")
    cur.execute("UPDATE credit_cards SET last_updated = 'March 2026'")
    print("   ✅ Added credit_cards.last_updated column")

if not cards_has_tier:
    cur.execute("ALTER TABLE credit_cards ADD COLUMN tier VARCHAR(20)")
    print("   ✅ Added credit_cards.tier column")

conn.commit()
print("   Schema migrations committed")

# ─── New Canada routes ────────────────────────────────────────────────────────
print("\n── Canada routes ──────────────────────────────────────────────────────────")

CANADA_NEW_ROUTES = [
    # Canada → India (high priority diaspora routes)
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 12560, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Via LHR/FRA/IST. Air India partner 95K biz fixed. Turkish Airlines via IST often 95K biz. Factor in $39 CAD partner fee.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "Delhi", "to_code": "DEL",
        "distance_km": 11666, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India direct YYZ-DEL (partner). Turkish via IST excellent alternative. Via Europe hubs.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "Bangalore", "to_code": "BLR",
        "distance_km": 13380, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 100000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Usually via DEL or BOM connection. Slightly higher pts for extra distance.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "Ahmedabad", "to_code": "AMD",
        "distance_km": 12100, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Via BOM or DEL connection. Gujarati diaspora route. Air India most common.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Vancouver", "from_code": "YVR",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 13320, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 100000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Pacific routing via NRT/HKG or Atlantic via LHR. Routing choice matters.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Vancouver", "from_code": "YVR",
        "to_city": "Delhi", "to_code": "DEL",
        "distance_km": 11300, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India YVR-DEL direct exists seasonally. Excellent via HKG/NRT too.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Montreal", "from_code": "YUL",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 12800, "route_type": "long_haul_india", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Via CDG or LHR. Air France/KLM competitive. Turkish via IST also good option.",
        "program": "Aeroplan",
    },
    # Canada transatlantic with median values (Feb 2026 quarterly update)
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "London", "to_code": "LHR",
        "distance_km": 5700, "route_type": "transatlantic", "country": "CA",
        "economy_points": 35000, "premium_economy_points": 55000,
        "business_points": 70000, "first_points": 90000,
        "median_points_business": 107500, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "SWEET SPOT: Turkish Airlines biz 70K fixed. AC biz median now 107,500 pts (Feb 2026 +34% surge). Book partner airlines for value.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "Paris", "to_code": "CDG",
        "distance_km": 6000, "route_type": "transatlantic", "country": "CA",
        "economy_points": 35000, "premium_economy_points": 55000,
        "business_points": 70000, "first_points": 90000,
        "median_points_business": 107500, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air France/KLM partner rates 70K biz fixed. AC median 107,500. Flying Blue Promo Awards can beat both monthly.",
        "program": "Aeroplan",
    },
    # ANA Tokyo sweet spot
    {
        "from_city": "Vancouver", "from_code": "YVR",
        "to_city": "Tokyo", "to_code": "NRT",
        "distance_km": 7560, "route_type": "transpacific", "country": "CA",
        "economy_points": 35000, "premium_economy_points": 55000,
        "business_points": 55000, "first_points": 88000,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "SWEET SPOT: ANA Business Class 55K Aeroplan = exceptional value. ANA 'The Room' seat product. Book via Air Canada site with ANA partner.",
        "program": "Aeroplan",
    },
    {
        "from_city": "Toronto", "from_code": "YYZ",
        "to_city": "Dubai", "to_code": "DXB",
        "distance_km": 11200, "route_type": "long_haul", "country": "CA",
        "economy_points": 65000, "premium_economy_points": 95000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Emirates now on dynamic pricing via Aeroplan. Turkish via IST = 95K biz fixed and excellent product.",
        "program": "Aeroplan",
    },
]

# ─── USA routes ───────────────────────────────────────────────────────────────
USA_NEW_ROUTES = [
    {
        "from_city": "New York", "from_code": "JFK",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 12543, "route_type": "long_haul_india", "country": "US",
        "economy_points": 45000, "premium_economy_points": 75000,
        "business_points": 90000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India EWR-BOM direct. Via FRA/LHR alternatives. Aeroplan 65K economy better value from US too.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "New York", "from_code": "EWR",
        "to_city": "Delhi", "to_code": "DEL",
        "distance_km": 11754, "route_type": "long_haul_india", "country": "US",
        "economy_points": 45000, "premium_economy_points": 75000,
        "business_points": 88000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India EWR-DEL direct. Key US-India corridor. Turkish via IST competitive for business.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "New York", "from_code": "JFK",
        "to_city": "Bangalore", "to_code": "BLR",
        "distance_km": 13350, "route_type": "long_haul_india", "country": "US",
        "economy_points": 50000, "premium_economy_points": 80000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Tech hub route. Usually via DEL or BOM. Air India/Turkish both competitive. High demand from NYC Indian tech community.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "New York", "from_code": "JFK",
        "to_city": "Ahmedabad", "to_code": "AMD",
        "distance_km": 12050, "route_type": "long_haul_india", "country": "US",
        "economy_points": 45000, "premium_economy_points": 75000,
        "business_points": 90000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Via BOM or DEL. Gujarati diaspora high-demand route from NY metro area. Air India most common option.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "Chicago", "from_code": "ORD",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 13450, "route_type": "long_haul_india", "country": "US",
        "economy_points": 50000, "premium_economy_points": 80000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Via FRA or LHR. United ORD hub. Air India code share. Large Indian community in Chicago.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "Chicago", "from_code": "ORD",
        "to_city": "Delhi", "to_code": "DEL",
        "distance_km": 12400, "route_type": "long_haul_india", "country": "US",
        "economy_points": 45000, "premium_economy_points": 75000,
        "business_points": 88000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Via European hubs. Air India or Turkish Airlines most common routing from ORD.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "Los Angeles", "from_code": "LAX",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 14150, "route_type": "long_haul_india", "country": "US",
        "economy_points": 55000, "premium_economy_points": 85000,
        "business_points": 100000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Can route via Tokyo (Pacific) or London (Atlantic). Large Indian diaspora in LA/SoCal.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "Los Angeles", "from_code": "LAX",
        "to_city": "Delhi", "to_code": "DEL",
        "distance_km": 13000, "route_type": "long_haul_india", "country": "US",
        "economy_points": 50000, "premium_economy_points": 80000,
        "business_points": 95000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India LAX-DEL direct (partner). Best option for West Coast to North India.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "San Francisco", "from_code": "SFO",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 14200, "route_type": "long_haul_india", "country": "US",
        "economy_points": 55000, "premium_economy_points": 85000,
        "business_points": 100000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India SFO-BOM direct exists. Large Indian tech community in Bay Area. High demand year-round.",
        "program": "United MileagePlus / Aeroplan",
    },
    {
        "from_city": "San Francisco", "from_code": "SFO",
        "to_city": "Bangalore", "to_code": "BLR",
        "distance_km": 14800, "route_type": "long_haul_india", "country": "US",
        "economy_points": 60000, "premium_economy_points": 90000,
        "business_points": 110000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Tech hub to tech hub. Air India SFO-BLR direct is the key route. Very high demand from Silicon Valley.",
        "program": "United MileagePlus / Aeroplan",
    },
    # USA domestic
    {
        "from_city": "New York", "from_code": "JFK",
        "to_city": "Los Angeles", "to_code": "LAX",
        "distance_km": 3983, "route_type": "domestic", "country": "US",
        "economy_points": 10000, "premium_economy_points": 20000,
        "business_points": 30000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.3,
        "note": "Most popular transcontinental. United Polaris business class good product. Dynamic pricing applies.",
        "program": "United MileagePlus",
    },
    {
        "from_city": "Los Angeles", "from_code": "LAX",
        "to_city": "Honolulu", "to_code": "HNL",
        "distance_km": 4100, "route_type": "domestic", "country": "US",
        "economy_points": 13000, "premium_economy_points": 25000,
        "business_points": 35000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.4,
        "note": "Hawaii peak pricing Jun-Aug, Dec. Polaris Business to Hawaii = excellent experience.",
        "program": "United MileagePlus",
    },
    # USA transatlantic
    {
        "from_city": "New York", "from_code": "JFK",
        "to_city": "London", "to_code": "LHR",
        "distance_km": 5541, "route_type": "transatlantic", "country": "US",
        "economy_points": 30000, "premium_economy_points": 55000,
        "business_points": 57500, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "SWEET SPOT: Aeroplan via Chase UR transfer 60K biz. United 57.5K also competitive. Lufthansa First via Aeroplan 90K.",
        "program": "United MileagePlus",
    },
    {
        "from_city": "New York", "from_code": "JFK",
        "to_city": "Paris", "to_code": "CDG",
        "distance_km": 5837, "route_type": "transatlantic", "country": "US",
        "economy_points": 30000, "premium_economy_points": 55000,
        "business_points": 57500, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air France Flying Blue Promo Awards can be cheaper (20-25K econ). Check FB monthly flash sales.",
        "program": "United MileagePlus",
    },
]

# ─── India routes ─────────────────────────────────────────────────────────────
INDIA_NEW_ROUTES = [
    {
        "from_city": "Delhi", "from_code": "DEL",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 1148, "route_type": "domestic", "country": "IN",
        "economy_points": 7500, "premium_economy_points": 12000,
        "business_points": 15000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.3,
        "note": "Busiest domestic India route. Air India direct. Frequent departures daily.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Delhi", "from_code": "DEL",
        "to_city": "Bangalore", "to_code": "BLR",
        "distance_km": 1738, "route_type": "domestic", "country": "IN",
        "economy_points": 8000, "premium_economy_points": 13000,
        "business_points": 16000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Delhi-Bangalore tech corridor. Multiple airlines.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Mumbai", "from_code": "BOM",
        "to_city": "Bangalore", "to_code": "BLR",
        "distance_km": 846, "route_type": "domestic", "country": "IN",
        "economy_points": 6000, "premium_economy_points": 10000,
        "business_points": 13000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Short hop. Frequent business travel corridor.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Mumbai", "from_code": "BOM",
        "to_city": "Ahmedabad", "to_code": "AMD",
        "distance_km": 524, "route_type": "domestic", "country": "IN",
        "economy_points": 5000, "premium_economy_points": 8000,
        "business_points": 11000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.15,
        "note": "Short Gujarat corridor. Very frequent service.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Delhi", "from_code": "DEL",
        "to_city": "London", "to_code": "LHR",
        "distance_km": 6728, "route_type": "transatlantic", "country": "IN",
        "economy_points": 40000, "premium_economy_points": 65000,
        "business_points": 80000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India direct DEL-LHR. Business Suite product is excellent on newer aircraft.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Mumbai", "from_code": "BOM",
        "to_city": "London", "to_code": "LHR",
        "distance_km": 7184, "route_type": "transatlantic", "country": "IN",
        "economy_points": 40000, "premium_economy_points": 65000,
        "business_points": 80000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India BOM-LHR direct. Strong business class product on this route.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Delhi", "from_code": "DEL",
        "to_city": "Toronto", "to_code": "YYZ",
        "distance_km": 11666, "route_type": "long_haul", "country": "IN",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 100000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India DEL-YYZ direct launched. Very popular with Indian diaspora visiting Canada.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Delhi", "from_code": "DEL",
        "to_city": "New York", "to_code": "JFK",
        "distance_km": 11754, "route_type": "long_haul", "country": "IN",
        "economy_points": 65000, "premium_economy_points": 90000,
        "business_points": 100000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India DEL-JFK/EWR. Key India-US corridor. High demand.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Mumbai", "from_code": "BOM",
        "to_city": "Dubai", "to_code": "DXB",
        "distance_km": 1934, "route_type": "regional", "country": "IN",
        "economy_points": 15000, "premium_economy_points": 25000,
        "business_points": 35000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Busiest India-Gulf route. Multiple airlines. Air India and IndiGo frequent.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Delhi", "from_code": "DEL",
        "to_city": "Singapore", "to_code": "SIN",
        "distance_km": 4151, "route_type": "regional", "country": "IN",
        "economy_points": 20000, "premium_economy_points": 35000,
        "business_points": 50000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Air India/Singapore Airlines. Good SQ availability for Star Alliance partner bookings.",
        "program": "Air India Flying Returns",
    },
    {
        "from_city": "Bangalore", "from_code": "BLR",
        "to_city": "Singapore", "to_code": "SIN",
        "distance_km": 3375, "route_type": "regional", "country": "IN",
        "economy_points": 18000, "premium_economy_points": 30000,
        "business_points": 45000, "first_points": None,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Singapore Airlines direct BLR-SIN. Excellent product. Popular for tech travellers.",
        "program": "Air India Flying Returns",
    },
]

# ─── HK routes ────────────────────────────────────────────────────────────────
HK_NEW_ROUTES = [
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "London", "to_code": "LHR",
        "distance_km": 9650, "route_type": "transatlantic", "country": "HK",
        "economy_points": 40000, "premium_economy_points": 65000,
        "business_points": 75000, "first_points": 110000,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Cathay Pacific direct. Business Class Premier excellent. First Class is a world-class product.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "New York", "to_code": "JFK",
        "distance_km": 12976, "route_type": "long_haul", "country": "HK",
        "economy_points": 55000, "premium_economy_points": 85000,
        "business_points": 100000, "first_points": 140000,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Cathay direct HKG-JFK. Outstanding business class. One of the best transpacific products.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Mumbai", "to_code": "BOM",
        "distance_km": 4436, "route_type": "regional", "country": "HK",
        "economy_points": 20000, "premium_economy_points": 35000,
        "business_points": 45000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Cathay/Air India. Popular India-HKG corridor. Strong demand from diaspora. High season Oct-Jan.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Delhi", "to_code": "DEL",
        "distance_km": 3776, "route_type": "regional", "country": "HK",
        "economy_points": 18000, "premium_economy_points": 30000,
        "business_points": 42000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Cathay direct or Air India. Frequent service HKG-DEL.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Bangalore", "to_code": "BLR",
        "distance_km": 4093, "route_type": "regional", "country": "HK",
        "economy_points": 20000, "premium_economy_points": 35000,
        "business_points": 45000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Via BOM or direct. Tech community route. Cathay or Air India.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Ahmedabad", "to_code": "AMD",
        "distance_km": 3700, "route_type": "regional", "country": "HK",
        "economy_points": 18000, "premium_economy_points": 30000,
        "business_points": 42000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Via BOM. Gujarati diaspora key route from HKG.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Toronto", "to_code": "YYZ",
        "distance_km": 12560, "route_type": "long_haul", "country": "HK",
        "economy_points": 55000, "premium_economy_points": 85000,
        "business_points": 100000, "first_points": 140000,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Cathay direct or via YVR. Large HK community in Toronto. Very popular route.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Vancouver", "to_code": "YVR",
        "distance_km": 9637, "route_type": "transpacific", "country": "HK",
        "economy_points": 40000, "premium_economy_points": 65000,
        "business_points": 75000, "first_points": 110000,
        "median_points_business": None, "is_dynamic": False, "peak_multiplier": 1.0,
        "note": "Cathay direct HKG-YVR. Large Chinese Canadian community. High demand around CNY.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Singapore", "to_code": "SIN",
        "distance_km": 2581, "route_type": "regional", "country": "HK",
        "economy_points": 10000, "premium_economy_points": 18000,
        "business_points": 25000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.2,
        "note": "Short regional hop. Cathay or SQ. Frequent departures.",
        "program": "Cathay Asia Miles",
    },
    {
        "from_city": "Hong Kong", "from_code": "HKG",
        "to_city": "Tokyo", "to_code": "NRT",
        "distance_km": 2887, "route_type": "regional", "country": "HK",
        "economy_points": 12000, "premium_economy_points": 20000,
        "business_points": 28000, "first_points": None,
        "median_points_business": None, "is_dynamic": True, "peak_multiplier": 1.3,
        "note": "Popular leisure route. Peak pricing during cherry blossom season (Mar-Apr) and Golden Week.",
        "program": "Cathay Asia Miles",
    },
]

# ─── New cards ─────────────────────────────────────────────────────────────────
NEW_CARDS_US = [
    {
        "name": "Chase Sapphire Reserve",
        "issuer": "Chase", "program": "Chase Ultimate Rewards",
        "annual_fee": 795, "currency": "USD",
        "welcome_bonus": 125000,
        "welcome_bonus_description": "125,000 Ultimate Rewards pts after $6,000 spend in first 3 months. ~$2,563 value (TPG March 2026).",
        "earn_rates": '{"chase_travel": 8.0, "flights_hotels_direct": 4.0, "dining": 3.0, "other": 1.0}',
        "transfer_partners": "United MileagePlus, Aeroplan, Hyatt, Marriott Bonvoy, British Airways Avios, Singapore KrisFlyer",
        "highlights": "$300 travel credit, Sapphire Lounge access, 1:1 transfer to 14 partners",
        "country": "US", "tier": "premium", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "Chase Sapphire Preferred Card",
        "issuer": "Chase", "program": "Chase Ultimate Rewards",
        "annual_fee": 95, "currency": "USD",
        "welcome_bonus": 75000,
        "welcome_bonus_description": "75,000 Ultimate Rewards pts after $5,000 spend in first 3 months",
        "earn_rates": '{"chase_travel_lyft": 5.0, "dining_streaming_groceries": 3.0, "travel": 2.0, "other": 1.0}',
        "transfer_partners": "United MileagePlus, Aeroplan, Hyatt, Marriott Bonvoy, British Airways Avios",
        "highlights": "Same 1:1 transfer partners as Reserve, $50 hotel credit, best entry premium card",
        "country": "US", "tier": "mid", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "The Platinum Card from American Express",
        "issuer": "American Express", "program": "Amex Membership Rewards",
        "annual_fee": 695, "currency": "USD",
        "welcome_bonus": 175000,
        "welcome_bonus_description": "Up to 175,000 MR pts after $8,000 spend in 6 months (targeted; public 100K)",
        "earn_rates": '{"flights_amex_travel": 5.0, "hotels_amex_travel": 5.0, "other": 1.0}',
        "transfer_partners": "Aeroplan, Delta SkyMiles, British Airways Avios, Singapore KrisFlyer, Air France Flying Blue",
        "highlights": "Centurion Lounge, $200 airline credit, $200 hotel credit, $189 CLEAR Plus",
        "country": "US", "tier": "premium", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "American Express Gold Card",
        "issuer": "American Express", "program": "Amex Membership Rewards",
        "annual_fee": 325, "currency": "USD",
        "welcome_bonus": 100000,
        "welcome_bonus_description": "100,000 MR pts after $6,000 spend in first 6 months",
        "earn_rates": '{"restaurants_worldwide": 4.0, "us_supermarkets": 4.0, "flights": 3.0, "other": 1.0}',
        "transfer_partners": "Aeroplan, Delta SkyMiles, British Airways Avios, Air France Flying Blue",
        "highlights": "$120 dining credit, $120 Uber Cash, best dining & grocery earn rate",
        "country": "US", "tier": "mid", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "Capital One Venture X Rewards Credit Card",
        "issuer": "Capital One", "program": "Capital One Miles",
        "annual_fee": 395, "currency": "USD",
        "welcome_bonus": 75000,
        "welcome_bonus_description": "75,000 miles after $4,000 spend in first 3 months",
        "earn_rates": '{"capital_one_travel_portal": 10.0, "hotels_rental_cars_portal": 5.0, "other": 2.0}',
        "transfer_partners": "Air Canada Aeroplan, Turkish Miles&Smiles, Air France Flying Blue, Singapore KrisFlyer",
        "highlights": "$300 annual travel credit, 10K anniversary miles, Priority Pass + Capital One Lounges",
        "country": "US", "tier": "premium", "last_updated": "March 2026", "is_active": True,
    },
]

NEW_CARDS_IN = [
    {
        "name": "HDFC Bank Infinia Credit Card",
        "issuer": "HDFC Bank", "program": "HDFC Reward Points",
        "annual_fee": 12500, "currency": "INR",
        "welcome_bonus": 12500,
        "welcome_bonus_description": "12,500 reward points on joining (worth ~₹12,500 on SmartBuy at 1:1)",
        "earn_rates": '{"all_spends": 5.0, "smartbuy_hdfc": 10.0}',
        "transfer_partners": "Air India Flying Returns (1:1), InterMiles, Singapore KrisFlyer",
        "highlights": "Unlimited lounge access, 5x on all spends, ₹10K annual gift voucher",
        "country": "IN", "tier": "premium", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "Axis Bank Atlas Credit Card",
        "issuer": "Axis Bank", "program": "EDGE Miles",
        "annual_fee": 5000, "currency": "INR",
        "welcome_bonus": 2500,
        "welcome_bonus_description": "2,500 EDGE Miles on first transaction within 30 days",
        "earn_rates": '{"travel_spends": 5.0, "other": 2.0}',
        "transfer_partners": "Air India Flying Returns (2:1), InterMiles (2:1), Singapore KrisFlyer (5:4)",
        "highlights": "Best travel-focused card in India, multiple airline transfer partners, milestone bonuses",
        "country": "IN", "tier": "mid", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "SBI Card ELITE",
        "issuer": "SBI Card", "program": "Reward Points",
        "annual_fee": 4999, "currency": "INR",
        "welcome_bonus": 5000,
        "welcome_bonus_description": "5,000 bonus reward points on joining",
        "earn_rates": '{"dining_movies": 10.0, "online": 5.0, "other": 2.0}',
        "transfer_partners": "InterMiles (4:1), Air India Flying Returns (4:1)",
        "highlights": "Priority Pass (6 visits/year), movie benefits, milestone rewards",
        "country": "IN", "tier": "mid", "last_updated": "March 2026", "is_active": True,
    },
]

NEW_CARDS_HK = [
    {
        "name": "HSBC Premier Mastercard",
        "issuer": "HSBC Hong Kong", "program": "Asia Miles",
        "annual_fee": 0, "currency": "HKD",
        "welcome_bonus": 20000,
        "welcome_bonus_description": "20,000 Asia Miles on first purchase within 30 days",
        "earn_rates": '{"overseas_dining": 4.0, "local_dining": 2.0, "other": 1.0}',
        "transfer_partners": "Cathay Asia Miles, Avios",
        "highlights": "No annual fee, strong overseas earn, Asia Miles for Cathay Pacific",
        "country": "HK", "tier": "mid", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "Citi Prestige Card Hong Kong",
        "issuer": "Citibank Hong Kong", "program": "Asia Miles",
        "annual_fee": 3800, "currency": "HKD",
        "welcome_bonus": 60000,
        "welcome_bonus_description": "60,000 Asia Miles on HK$30,000 spend within 3 months",
        "earn_rates": '{"overseas": 3.0, "dining": 3.0, "other": 1.0}',
        "transfer_partners": "Cathay Asia Miles",
        "highlights": "Priority Pass unlimited lounge, 4th night free at hotels, strong international earn",
        "country": "HK", "tier": "premium", "last_updated": "March 2026", "is_active": True,
    },
    {
        "name": "American Express Cathay Pacific Elite Card",
        "issuer": "American Express Hong Kong", "program": "Asia Miles",
        "annual_fee": 2400, "currency": "HKD",
        "welcome_bonus": 40000,
        "welcome_bonus_description": "40,000 Asia Miles on HK$20,000 spend within 90 days",
        "earn_rates": '{"cathay_pacific": 5.0, "overseas": 3.0, "dining": 3.0, "other": 1.5}',
        "transfer_partners": "Cathay Asia Miles",
        "highlights": "Best card for Cathay Pacific flyers, accelerated status points, lounge vouchers",
        "country": "HK", "tier": "mid", "last_updated": "March 2026", "is_active": True,
    },
]

# ─── Insert routes ─────────────────────────────────────────────────────────────
print("\n── Inserting routes ───────────────────────────────────────────────────────")

all_new_routes = CANADA_NEW_ROUTES + USA_NEW_ROUTES + INDIA_NEW_ROUTES + HK_NEW_ROUTES
inserted_routes = 0
skipped_routes = 0

# Build column list based on what's available
route_cols = ["from_city", "from_code", "to_city", "to_code", "distance_km",
              "route_type", "economy_points", "premium_economy_points",
              "business_points", "first_points", "program"]
if routes_has_country or True:  # we added it above
    route_cols.append("country")
if routes_has_note or True:
    route_cols.append("note")
if routes_has_median or True:
    route_cols += ["median_points_business", "is_dynamic", "peak_multiplier"]

for r in all_new_routes:
    key = (r["from_city"].lower(), r["to_city"].lower(), r.get("country", "CA"))
    if key in existing_route_pairs:
        skipped_routes += 1
        continue

    values = (
        r["from_city"], r.get("from_code", ""), r["to_city"], r.get("to_code", ""),
        r.get("distance_km"), r.get("route_type"), r.get("economy_points"),
        r.get("premium_economy_points"), r.get("business_points"), r.get("first_points"),
        r.get("program", ""), r.get("country", "CA"), r.get("note"),
        r.get("median_points_business"), r.get("is_dynamic", False), r.get("peak_multiplier", 1.0),
    )
    cur.execute("""
        INSERT INTO routes (from_city, from_code, to_city, to_code, distance_km,
            route_type, economy_points, premium_economy_points,
            business_points, first_points, program,
            country, note, median_points_business, is_dynamic, peak_multiplier)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, values)
    inserted_routes += 1

print(f"   Inserted: {inserted_routes} routes")
print(f"   Skipped (already exist): {skipped_routes} routes")

# ─── Insert cards ──────────────────────────────────────────────────────────────
print("\n── Inserting cards ────────────────────────────────────────────────────────")

all_new_cards = NEW_CARDS_US + NEW_CARDS_IN + NEW_CARDS_HK
inserted_cards = 0
skipped_cards = 0

# Discover actual columns in credit_cards
cur.execute("""
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'credit_cards'
    ORDER BY ordinal_position
""")
card_columns = set(r[0] for r in cur.fetchall())
print(f"   credit_cards columns: {sorted(card_columns)}")

for card in all_new_cards:
    name_lower = card["name"].lower()
    if name_lower in existing_card_names:
        skipped_cards += 1
        continue

    # Build insert dynamically based on available columns
    insert_data = {}
    col_map = {
        "name": card["name"],
        "issuer": card.get("issuer"),
        "program": card.get("program"),
        "annual_fee": card.get("annual_fee", 0),
        "welcome_bonus": card.get("welcome_bonus", 0),
        "transfer_partners": card.get("transfer_partners", ""),
        "is_active": card.get("is_active", True),
    }
    # Optional columns
    if "country" in card_columns:
        col_map["country"] = card.get("country", "CA")
    if "tier" in card_columns:
        col_map["tier"] = card.get("tier")
    if "last_updated" in card_columns:
        col_map["last_updated"] = card.get("last_updated", "March 2026")
    if "earn_rates" in card_columns:
        col_map["earn_rates"] = card.get("earn_rates", "{}")
    if "highlights" in card_columns:
        col_map["highlights"] = card.get("highlights", "")
    if "welcome_bonus_description" in card_columns:
        col_map["welcome_bonus_description"] = card.get("welcome_bonus_description", "")
    if "currency" in card_columns:
        col_map["currency"] = card.get("currency", "USD")

    # Filter to only columns that exist
    filtered = {k: v for k, v in col_map.items() if k in card_columns}
    cols = list(filtered.keys())
    vals = list(filtered.values())

    placeholders = ", ".join(["%s"] * len(cols))
    col_str = ", ".join(cols)
    cur.execute(f"INSERT INTO credit_cards ({col_str}) VALUES ({placeholders})", vals)
    inserted_cards += 1

print(f"   Inserted: {inserted_cards} cards")
print(f"   Skipped (already exist): {skipped_cards} cards")

# ─── Update existing Canada cards with last_updated and tier ──────────────────
print("\n── Updating existing Canada card metadata ─────────────────────────────────")
if "last_updated" in card_columns:
    cur.execute("UPDATE credit_cards SET last_updated = 'March 2026' WHERE country = 'CA' OR country IS NULL")
    print(f"   Updated last_updated = 'March 2026' for all CA cards")

if "tier" in card_columns:
    # Set tiers for known premium CA cards
    premium_cards = ["%reserve%", "%privilege%", "%platinum%"]
    mid_cards = ["%infinite%", "%gold%", "%cobalt%", "%passport%", "%elite%", "%world elite%"]
    for pattern in premium_cards:
        cur.execute("UPDATE credit_cards SET tier = 'premium' WHERE LOWER(name) LIKE %s AND tier IS NULL", (pattern,))
    for pattern in mid_cards:
        cur.execute("UPDATE credit_cards SET tier = 'mid' WHERE LOWER(name) LIKE %s AND tier IS NULL", (pattern,))
    cur.execute("UPDATE credit_cards SET tier = 'entry' WHERE tier IS NULL")
    print("   Set tier values for existing cards")

# ─── Update transatlantic median values on existing routes ────────────────────
print("\n── Updating transatlantic median values ───────────────────────────────────")
if routes_has_median or True:
    transatlantic_medians = [
        ("Toronto", "London", 107500),
        ("Toronto", "Paris", 107500),
        ("Toronto", "Frankfurt", 107500),
        ("Montreal", "Paris", 107500),
        ("Montreal", "London", 107500),
        ("Vancouver", "London", 120000),
    ]
    updated_medians = 0
    for from_c, to_c, median in transatlantic_medians:
        cur.execute("""
            UPDATE routes SET median_points_business = %s
            WHERE LOWER(from_city) LIKE %s AND LOWER(to_city) LIKE %s AND median_points_business IS NULL
        """, (median, f"%{from_c.lower()}%", f"%{to_c.lower()}%"))
        updated_medians += cur.rowcount
    print(f"   Updated median_points_business on {updated_medians} transatlantic routes")

# ─── Commit ────────────────────────────────────────────────────────────────────
conn.commit()
cur.close()
conn.close()

# ─── Final summary ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("✅ Seed v3 complete!")
print(f"   Routes inserted: {inserted_routes}")
print(f"   Cards inserted:  {inserted_cards}")
print()
print("Next steps:")
print("  1. Deploy backend/main.py (add new endpoints)")
print("  2. Deploy frontend/src/App.jsx (add HK tab, seasonal, medians)")
print("  3. Run: curl https://your-api.onrender.com/health")
print("     Verify route and card counts increased")
print("="*60)
