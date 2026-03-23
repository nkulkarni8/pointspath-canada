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
from models import CreditCard as CreditCardModel, Route as RouteModel

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

class PointsGapResponse(BaseModel):
    points_gap: int
    monthly_points_target: int
    timeline_months: int
    strategies: List[GapStrategy]
    is_achievable: bool
    total_monthly_spend: int
    calculated_budget: Optional[int] = None
    budget_status: Optional[str] = None

# ── Card earning rates ─────────────────────────────────────────────────────────
CARD_EARNING_RATES = {
    # CA
    "American Express Platinum Card":          {"travel":1.25,"dining":1.25,"gas":1.25,"groceries":1.25,"entertainment":1.25,"general":1.25},
    "TD Aeroplan Visa Infinite":               {"groceries":1.5,"gas":1.5,"air_canada":1.5,"dining":1.0,"travel":1.0,"general":1.0},
    "CIBC Aeroplan Visa Infinite":             {"groceries":1.5,"gas":1.5,"dining":1.5,"travel":1.0,"general":1.0},
    "American Express Aeroplan Reserve":       {"dining":3.0,"groceries":2.0,"gas":2.0,"travel":2.0,"entertainment":2.0,"general":2.0},
    "RBC Avion Visa Infinite":                 {"travel":1.25,"groceries":1.0,"gas":1.0,"dining":1.0,"general":1.0},
    "Scotiabank Gold American Express":        {"groceries":5.0,"dining":5.0,"entertainment":5.0,"gas":1.0,"travel":1.0,"general":1.0},
    "BMO Eclipse Visa Infinite":               {"groceries":5.0,"gas":5.0,"transit":5.0,"dining":1.0,"travel":1.0,"general":1.0},
    "American Express Cobalt Card":            {"groceries":5.0,"dining":5.0,"travel":2.0,"transit":2.0,"gas":1.0,"general":1.0},
    "RBC Ion+ Visa":                           {"groceries":3.0,"dining":2.0,"transit":2.0,"gas":1.0,"travel":1.0,"general":1.0},
    "TD First Class Travel Visa Infinite":     {"travel":3.0,"groceries":1.5,"gas":1.5,"dining":1.5,"general":1.0},
    "CIBC Aventura Visa Infinite":             {"travel":2.0,"dining":2.0,"groceries":1.0,"gas":1.0,"general":1.0},
    "Scotiabank Passport Visa Infinite":       {"travel":5.0,"dining":5.0,"entertainment":5.0,"groceries":5.0,"gas":1.0,"general":1.0},
    "TD Aeroplan Visa Infinite Privilege":     {"groceries":2.0,"gas":2.0,"air_canada":2.0,"dining":2.0,"travel":2.0,"general":1.0},
    "National Bank World Elite Mastercard":    {"groceries":5.0,"gas":5.0,"transit":5.0,"dining":1.0,"travel":1.0,"general":1.0},
    "Scotiabank Scene+ Visa":                  {"groceries":1.0,"dining":1.0,"gas":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "RBC Avion Visa Infinite Privilege":       {"travel":1.25,"groceries":1.0,"gas":1.0,"dining":1.0,"general":1.0},
    "CIBC Aeroplan Visa Infinite Privilege":   {"groceries":1.5,"gas":1.5,"dining":1.5,"travel":1.5,"general":1.0},
    "American Express Gold Rewards":           {"travel":2.0,"dining":2.0,"gas":2.0,"groceries":2.0,"general":1.0},
    "BMO Ascend World Elite Mastercard":       {"travel":5.0,"dining":5.0,"entertainment":5.0,"groceries":1.0,"gas":1.0,"general":1.0},
    "CIBC Dividend Visa Infinite":             {"groceries":4.0,"gas":2.0,"transit":2.0,"dining":1.0,"travel":1.0,"general":1.0},
    "RBC British Airways Visa Infinite":       {"british_airways":1.5,"travel":1.0,"dining":1.0,"groceries":1.0,"general":1.0},
    "Tangerine Money-Back Credit Card":        {"choice_categories":2.0,"general":0.5},
    # US
    "Chase Sapphire Reserve":                  {"travel":3.0,"dining":3.0,"groceries":1.0,"general":1.0},
    "Chase Sapphire Preferred":                {"travel":2.0,"dining":3.0,"groceries":3.0,"streaming":3.0,"transit":2.0,"general":1.0},
    "Amex Platinum":                           {"travel":5.0,"dining":1.0,"groceries":1.0,"general":1.0},
    "Amex Gold":                               {"dining":4.0,"groceries":4.0,"travel":3.0,"general":1.0},
    "Capital One Venture X":                   {"travel":10.0,"hotels":5.0,"general":2.0},
    "Capital One Venture":                     {"travel":5.0,"general":2.0},
    "Citi Premier":                            {"travel":3.0,"dining":3.0,"groceries":3.0,"gas":3.0,"general":1.0},
    "Chase Freedom Unlimited":                 {"travel":3.0,"dining":3.0,"drugstore":3.0,"general":1.5},
    "Amex Blue Cash Preferred":                {"groceries":6.0,"streaming":6.0,"transit":3.0,"gas":3.0,"general":1.0},
    "Chase United Explorer":                   {"united":2.0,"dining":2.0,"hotel":2.0,"general":1.0},
    "Delta SkyMiles Gold Amex":                {"delta":2.0,"dining":2.0,"groceries":2.0,"general":1.0},
    "Amex Hilton Honors Aspire":               {"hilton":14.0,"dining":7.0,"flights":7.0,"general":3.0},
    "Chase Ink Business Preferred":            {"travel":3.0,"shipping":3.0,"advertising":3.0,"telecom":3.0,"general":1.0},
    "Bank of America Premium Rewards":         {"travel":2.0,"dining":2.0,"general":1.5},
    "Wells Fargo Autograph":                   {"travel":3.0,"dining":3.0,"gas":3.0,"transit":3.0,"streaming":3.0,"phone":3.0,"general":1.0},
    "Bilt Mastercard":                         {"rent":1.0,"travel":2.0,"dining":3.0,"general":1.0},
    "Discover it Miles":                       {"general":1.5},
    "Amex EveryDay Preferred":                 {"groceries":4.5,"gas":1.5,"general":1.0},
    "Chase Freedom Flex":                      {"rotating":5.0,"travel":3.0,"dining":3.0,"drugstore":3.0,"general":1.0},
    "Citi Double Cash":                        {"general":2.0},
    "Amex Business Platinum":                  {"travel":5.0,"airlines":1.5,"general":1.0},
    "Chase Ink Business Cash":                 {"office":5.0,"telecom":5.0,"dining":2.0,"gas":2.0,"general":1.0},
    "Amex Marriott Bonvoy Brilliant":          {"marriott":6.0,"dining":3.0,"travel":3.0,"general":2.0},
    "US Bank Altitude Reserve":                {"travel":3.0,"mobile_pay":3.0,"dining":3.0,"general":1.0},
    # IN
    "HDFC Infinia":                            {"dining":5.0,"travel":5.0,"groceries":2.0,"gas":2.0,"general":1.5},
    "Axis Magnus":                             {"travel":12.0,"dining":2.0,"groceries":1.5,"general":1.0},
    "HDFC Diners Club Black":                  {"dining":5.0,"travel":5.0,"groceries":2.0,"gas":2.0,"general":1.5},
    "SBI Card PRIME":                          {"dining":5.0,"groceries":5.0,"travel":5.0,"entertainment":5.0,"general":2.0},
    "ICICI Emeralde":                          {"travel":4.0,"dining":3.0,"groceries":2.0,"gas":2.0,"general":2.0},
    "Amex Platinum India":                     {"travel":5.0,"dining":5.0,"shopping":2.0,"general":1.0},
    "HDFC Regalia":                            {"dining":5.0,"travel":5.0,"groceries":2.0,"general":1.5},
    "Axis Vistara Infinite":                   {"vistara":6.0,"dining":4.0,"travel":3.0,"general":2.0},
    "ICICI Sapphiro Amex":                     {"shopping":4.0,"dining":3.0,"travel":2.0,"general":2.0},
    "Citi Prestige India":                     {"travel":4.0,"dining":4.0,"hotel":4.0,"entertainment":3.0,"general":1.0},
    "Kotak Royale Signature":                  {"dining":4.0,"travel":3.0,"groceries":2.0,"general":1.0},
    "HDFC Millennia":                          {"online":5.0,"dining":2.5,"groceries":2.5,"general":1.0},
    "SBI Cashback Card":                       {"online":5.0,"offline":1.0,"general":1.0},
    "RBL Bank World Safari":                   {"travel":5.0,"dining":3.0,"general":2.0},
    "Yes First Exclusive":                     {"travel":12.0,"dining":6.0,"groceries":2.0,"general":2.0},
    "Amex SmartEarn India":                    {"amazon":10.0,"flipkart":10.0,"dining":5.0,"general":1.0},
    "IndusInd Iconia":                         {"dining":3.0,"entertainment":3.0,"travel":3.0,"general":1.5},
    "AU Bank Altura Plus":                     {"dining":3.0,"online":3.0,"travel":2.0,"general":1.5},
    # HK
    "HSBC Premier Mastercard HK":             {"dining":4.0,"travel":3.0,"shopping":2.0,"general":1.0},
    "Citi Prestige HK":                        {"travel":4.0,"dining":4.0,"hotel":4.0,"entertainment":3.0,"general":1.0},
    "Standard Chartered Visa Infinite HK":    {"travel":5.0,"dining":3.0,"shopping":2.0,"general":1.5},
    "American Express Platinum HK":           {"travel":5.0,"dining":5.0,"shopping":2.0,"general":1.0},
    "Hang Seng Visa Signature":               {"dining":5.0,"shopping":3.0,"travel":2.0,"general":1.0},
    "Bank of China Visa Infinite HK":         {"travel":4.0,"dining":3.0,"shopping":2.0,"general":1.5},
    "DBS Black World Mastercard HK":          {"dining":5.0,"travel":4.0,"shopping":3.0,"general":1.5},
    "OCBC Titanium Rewards HK":               {"shopping":4.0,"dining":2.0,"travel":2.0,"general":1.0},
    "Mox Credit Card":                         {"dining":2.0,"shopping":2.0,"travel":1.0,"general":1.0},
    "ZA Card HK":                              {"dining":3.0,"shopping":2.0,"general":1.5},
    "HSBC Red Credit Card HK":                {"dining":5.0,"shopping":3.0,"online":5.0,"general":0.5},
    "Citi Cash Back HK":                       {"dining":5.0,"grocery":3.0,"fuel":3.0,"general":0.5},
}

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
    from_city = trip.from_city.strip().title()
    to_city   = trip.to_city.strip().title()
    country   = trip.country.upper()

    route = db.query(RouteModel).filter(
        RouteModel.from_city == from_city,
        RouteModel.to_city   == to_city,
        RouteModel.country   == country
    ).first()

    if not route:
        # Try reverse direction
        route = db.query(RouteModel).filter(
            RouteModel.from_city == to_city,
            RouteModel.to_city   == from_city,
            RouteModel.country   == country
        ).first()

    if not route:
        raise HTTPException(status_code=404,
            detail=f"Route not found: {from_city} → {to_city} ({country}). Please select cities from the dropdown.")

    class_map = {"economy": route.economy_points, "premium_economy": route.premium_economy_points,
                 "business": route.business_points, "first": route.first_points}
    pts = class_map.get(trip.travel_class.lower().replace(" ", "_"))
    if pts is None:
        raise HTTPException(status_code=400, detail=f"Invalid travel class: {trip.travel_class}")

    total = pts * trip.passengers
    if trip.return_date:
        total *= 2

    return {"total_points": total, "points_per_person": pts,
            "route": f"{from_city} to {to_city}", "travel_class": trip.travel_class}

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
        timeline_months=gap_request.timeline_months, strategies=strategies, is_achievable=is_achievable,
        total_monthly_spend=total_monthly_spend, calculated_budget=calculated_budget, budget_status=budget_status)


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
            "last_updated": "March 2026",
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

    # Use only columns that exist in the routes table (no from_code, to_code, median_points_business, etc.)
    BASE_SQL = """
        SELECT from_city, to_city,
               economy_points, premium_economy_points, business_points, first_points,
               program, route_type
        FROM routes
        WHERE {where}
        ORDER BY economy_points
        LIMIT 1
    """

    # Try country-filtered lookup first
    route = db.execute(
        text(BASE_SQL.format(where="country = :c AND LOWER(from_city) LIKE :fc AND LOWER(to_city) LIKE :tc")),
        {"c": country, "fc": f"%{from_city.lower()}%", "tc": f"%{to_city.lower()}%"}
    ).fetchone()

    if not route:
        # Fallback: try any country (handles cross-country search like CA user picking IN cities)
        route = db.execute(
            text(BASE_SQL.format(where="LOWER(from_city) LIKE :fc AND LOWER(to_city) LIKE :tc")),
            {"fc": f"%{from_city.lower()}%", "tc": f"%{to_city.lower()}%"}
        ).fetchone()

    if not route:
        raise HTTPException(status_code=404, detail=f"Route '{from_city}' → '{to_city}' not found")

    # Positional mapping: 0=from_city, 1=to_city, 2=econ, 3=prem_econ, 4=biz, 5=first, 6=program, 7=route_type
    COL_IDX = {"economy_points": 2, "premium_economy_points": 3, "business_points": 4, "first_points": 5}
    pts = route[COL_IDX[col]]
    cabin_used = cabin
    if not pts:
        pts = route[2]  # economy fallback
        cabin_used = "economy"
    pts = pts or 0

    # Simple seasonal note based on month (no dynamic pricing column needed)
    seasonal_note = None
    if month:
        if month in PEAK_MONTHS:
            seasonal_note = f"Peak season (Jun–Aug / Dec) — expect higher award availability costs. Book early."
        elif month in SHOULDER_MONTHS:
            seasonal_note = f"Shoulder season — slight premium over base rates possible."
        else:
            seasonal_note = "Off-peak — best time to book. Lowest award rates typically available."

    return {
        "found": True,
        "route": f"{route[0]} → {route[1]}",
        "program": route[6] or "",
        "cabin": cabin_used,
        "base_points": pts * passengers,
        "base_points_per_person": pts,
        "median_points": None,
        "median_points_per_person": None,
        "seasonal_note": seasonal_note,
        "route_note": None,
        "route_type": route[7] or "",
        "passengers": passengers,
        "is_dynamic": False,
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


# ─── Hotel programs data ──────────────────────────────────────────────────────

HOTEL_PROGRAMS = [
    {
        "id": "marriott",
        "name": "Marriott Bonvoy",
        "logo": "🏨",
        "description": "30+ brands: Marriott, Sheraton, Westin, Ritz-Carlton, W Hotels, St. Regis",
        "categories": [
            {"tier": "Category 1", "label": "Budget",        "points_per_night": 7500,  "example": "Courtyard, Fairfield"},
            {"tier": "Category 2", "label": "Standard",      "points_per_night": 12500, "example": "Four Points, Aloft"},
            {"tier": "Category 3", "label": "Mid-Range",     "points_per_night": 17500, "example": "Sheraton, Le Méridien"},
            {"tier": "Category 4", "label": "Upper Mid",     "points_per_night": 25000, "example": "Westin, Renaissance"},
            {"tier": "Category 5", "label": "Upscale",       "points_per_night": 35000, "example": "JW Marriott, Autograph"},
            {"tier": "Category 6", "label": "Luxury",        "points_per_night": 50000, "example": "W Hotels, EDITION"},
            {"tier": "Category 7", "label": "Premium",       "points_per_night": 62500, "example": "Ritz-Carlton"},
            {"tier": "Category 8", "label": "Top Tier",      "points_per_night": 85000, "example": "St. Regis Maldives"},
        ],
        "earn_cards": {
            "CA": ["American Express Cobalt Card", "American Express Platinum Card"],
            "US": ["Amex Marriott Bonvoy Brilliant", "Chase Sapphire Reserve"],
            "IN": ["HDFC Infinia", "Amex Platinum India"],
            "HK": ["American Express Platinum HK", "Citi Prestige HK"],
        },
        "transfer_programs": ["Amex Membership Rewards → Marriott (1:1.25)", "Chase UR → Marriott (1:1)"],
        "sweet_spot": "Category 4-5 properties offer the best points value",
        "countries": ["CA", "US", "IN", "HK"],
    },
    {
        "id": "hilton",
        "name": "Hilton Honors",
        "logo": "🏩",
        "description": "18+ brands: Hilton, DoubleTree, Conrad, Waldorf Astoria, Curio Collection",
        "categories": [
            {"tier": "Tier 1", "label": "Budget",   "points_per_night": 5000,   "example": "Hampton Inn, Tru by Hilton"},
            {"tier": "Tier 2", "label": "Standard", "points_per_night": 10000,  "example": "DoubleTree, Embassy Suites"},
            {"tier": "Tier 3", "label": "Upscale",  "points_per_night": 30000,  "example": "Hilton Hotels & Resorts"},
            {"tier": "Tier 4", "label": "Luxury",   "points_per_night": 60000,  "example": "Conrad Hotels, Canopy"},
            {"tier": "Tier 5", "label": "Top Tier", "points_per_night": 120000, "example": "Waldorf Astoria"},
        ],
        "earn_cards": {
            "CA": ["American Express Platinum Card", "American Express Gold Rewards"],
            "US": ["Amex Hilton Honors Aspire", "Capital One Venture X"],
            "IN": ["Amex Platinum India", "HDFC Infinia"],
            "HK": ["American Express Platinum HK", "DBS Black World Mastercard HK"],
        },
        "transfer_programs": ["Amex Membership Rewards → Hilton (1:2)", "Capital One Miles → Hilton (1:2)"],
        "sweet_spot": "Tier 2-3 properties offer 0.5–0.7 cents/point value",
        "countries": ["CA", "US", "IN", "HK"],
    },
    {
        "id": "hyatt",
        "name": "World of Hyatt",
        "logo": "⭐",
        "description": "Hyatt, Grand Hyatt, Park Hyatt, Andaz, Alila, Thompson Hotels",
        "categories": [
            {"tier": "Category 1", "label": "Budget",         "points_per_night": 3500,  "example": "Hyatt House, Hyatt Place"},
            {"tier": "Category 2", "label": "Standard",       "points_per_night": 8000,  "example": "Hyatt Regency Tier 2"},
            {"tier": "Category 3", "label": "Mid-Range",      "points_per_night": 12000, "example": "Hyatt Centric"},
            {"tier": "Category 4", "label": "Upper Upscale",  "points_per_night": 18000, "example": "Grand Hyatt"},
            {"tier": "Category 5", "label": "Luxury",         "points_per_night": 25000, "example": "Park Hyatt"},
            {"tier": "Category 6", "label": "Prem. Luxury",   "points_per_night": 40000, "example": "Andaz, Alila"},
            {"tier": "Category 7", "label": "Ultra Premium",  "points_per_night": 55000, "example": "Park Hyatt Maldives"},
        ],
        "earn_cards": {
            "CA": ["Chase Sapphire Reserve"],
            "US": ["Chase Sapphire Reserve", "Chase Sapphire Preferred"],
            "IN": ["Axis Magnus", "HDFC Diners Club Black"],
            "HK": ["Citi Prestige HK", "Standard Chartered Visa Infinite HK"],
        },
        "transfer_programs": ["Chase UR → Hyatt (1:1) — best transfer rate", "Capital One Miles → Hyatt (1:1)"],
        "sweet_spot": "Hyatt has highest points value (~1.7 cents/point). Category 1-4 is exceptional.",
        "countries": ["CA", "US", "IN", "HK"],
    },
    {
        "id": "ihg",
        "name": "IHG One Rewards",
        "logo": "🏰",
        "description": "InterContinental, Holiday Inn, Crowne Plaza, Regent, Kimpton, Six Senses",
        "categories": [
            {"tier": "Tier 1", "label": "Budget",   "points_per_night": 10000,  "example": "Holiday Inn Express"},
            {"tier": "Tier 2", "label": "Standard", "points_per_night": 25000,  "example": "Holiday Inn, Staybridge"},
            {"tier": "Tier 3", "label": "Upscale",  "points_per_night": 40000,  "example": "Crowne Plaza"},
            {"tier": "Tier 4", "label": "Luxury",   "points_per_night": 70000,  "example": "InterContinental, Kimpton"},
            {"tier": "Tier 5", "label": "Top Tier", "points_per_night": 100000, "example": "Six Senses, Regent"},
        ],
        "earn_cards": {
            "CA": ["RBC Avion Visa Infinite", "American Express Platinum Card"],
            "US": ["Chase Sapphire Reserve", "Capital One Venture X"],
            "IN": ["HDFC Diners Club Black", "Axis Magnus"],
            "HK": ["HSBC Premier Mastercard HK", "Citi Prestige HK"],
        },
        "transfer_programs": ["Chase UR → IHG (1:1)", "Amex MR → IHG (1:1)", "Capital One → IHG (1:1)"],
        "sweet_spot": "4th-night-free benefit on points redemptions is the best deal",
        "countries": ["CA", "US", "IN", "HK"],
    },
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