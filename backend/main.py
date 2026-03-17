from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import uvicorn, requests, os
from sqlalchemy.orm import Session
from config import settings
from database import get_db, init_db, seed_database
from models import CreditCard as CreditCardModel, Route as RouteModel

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION, description=settings.API_DESCRIPTION)

app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── Pydantic schemas ───────────────────────────────────────────────────────────

class TripRequest(BaseModel):
    from_city: str
    to_city: str
    depart_date: date
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

# ── Card earning rates (CA + US + IN) ─────────────────────────────────────────

CARD_EARNING_RATES = {
    # ── CANADA ────────────────────────────────────────────────────────────────
    "American Express Platinum Card":          {"travel":1.25,"dining":1.25,"gas":1.25,"groceries":1.25,"entertainment":1.25,"general":1.25},
    "TD Aeroplan Visa Infinite":               {"groceries":1.5,"gas":1.5,"air_canada":1.5,"dining":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "CIBC Aeroplan Visa Infinite":             {"groceries":1.5,"gas":1.5,"dining":1.5,"travel":1.0,"entertainment":1.0,"general":1.0},
    "American Express Aeroplan Reserve":       {"dining":3.0,"groceries":2.0,"gas":2.0,"travel":2.0,"entertainment":2.0,"general":2.0},
    "RBC Avion Visa Infinite":                 {"travel":1.25,"groceries":1.0,"gas":1.0,"dining":1.0,"entertainment":1.0,"general":1.0},
    "Scotiabank Gold American Express":        {"groceries":5.0,"dining":5.0,"entertainment":5.0,"gas":1.0,"travel":1.0,"general":1.0},
    "BMO Eclipse Visa Infinite":               {"groceries":5.0,"gas":5.0,"transit":5.0,"dining":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "American Express Cobalt Card":            {"groceries":5.0,"dining":5.0,"travel":2.0,"transit":2.0,"gas":1.0,"entertainment":1.0,"general":1.0},
    "RBC Ion+ Visa":                           {"groceries":3.0,"dining":2.0,"transit":2.0,"gas":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "TD First Class Travel Visa Infinite":     {"travel":3.0,"groceries":1.5,"gas":1.5,"dining":1.5,"entertainment":1.0,"general":1.0},
    "CIBC Aventura Visa Infinite":             {"travel":2.0,"dining":2.0,"groceries":1.0,"gas":1.0,"entertainment":1.0,"general":1.0},
    "Scotiabank Passport Visa Infinite":       {"travel":5.0,"dining":5.0,"entertainment":5.0,"groceries":5.0,"gas":1.0,"general":1.0},
    "TD Aeroplan Visa Infinite Privilege":     {"groceries":2.0,"gas":2.0,"air_canada":2.0,"dining":2.0,"travel":2.0,"entertainment":1.0,"general":1.0},
    "National Bank World Elite Mastercard":    {"groceries":5.0,"gas":5.0,"transit":5.0,"dining":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "Scotiabank Scene+ Visa":                  {"groceries":1.0,"dining":1.0,"gas":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "RBC Avion Visa Infinite Privilege":       {"travel":1.25,"groceries":1.0,"gas":1.0,"dining":1.0,"entertainment":1.0,"general":1.0},
    "CIBC Aeroplan Visa Infinite Privilege":   {"groceries":1.5,"gas":1.5,"dining":1.5,"travel":1.5,"entertainment":1.0,"general":1.0},
    "American Express Gold Rewards":           {"travel":2.0,"dining":2.0,"gas":2.0,"groceries":2.0,"entertainment":1.0,"general":1.0},
    "BMO Ascend World Elite Mastercard":       {"travel":5.0,"dining":5.0,"entertainment":5.0,"groceries":1.0,"gas":1.0,"general":1.0},
    "CIBC Dividend Visa Infinite":             {"groceries":4.0,"gas":2.0,"transit":2.0,"dining":1.0,"travel":1.0,"entertainment":1.0,"general":1.0},
    "RBC British Airways Visa Infinite":       {"british_airways":1.5,"travel":1.0,"dining":1.0,"groceries":1.0,"gas":1.0,"entertainment":1.0,"general":1.0},
    "Tangerine Money-Back Credit Card":        {"choice_categories":2.0,"general":0.5},
    # ── USA ───────────────────────────────────────────────────────────────────
    "Chase Sapphire Reserve":                  {"travel":3.0,"dining":3.0,"groceries":1.0,"gas":1.0,"entertainment":1.0,"general":1.0},
    "Chase Sapphire Preferred":                {"travel":2.0,"dining":3.0,"groceries":3.0,"streaming":3.0,"transit":2.0,"general":1.0},
    "Amex Platinum":                           {"travel":5.0,"dining":1.0,"groceries":1.0,"gas":1.0,"entertainment":1.0,"general":1.0},
    "Amex Gold":                               {"dining":4.0,"groceries":4.0,"travel":3.0,"gas":1.0,"entertainment":1.0,"general":1.0},
    "Capital One Venture X":                   {"travel":10.0,"hotels":5.0,"general":2.0},
    "Capital One Venture":                     {"travel":5.0,"general":2.0},
    "Citi Premier":                            {"travel":3.0,"dining":3.0,"groceries":3.0,"gas":3.0,"entertainment":1.0,"general":1.0},
    "Chase Freedom Unlimited":                 {"travel":3.0,"dining":3.0,"drugstore":3.0,"general":1.5},
    "Amex Blue Cash Preferred":                {"groceries":6.0,"streaming":6.0,"transit":3.0,"gas":3.0,"dining":1.0,"general":1.0},
    "Chase United Explorer":                   {"united":2.0,"dining":2.0,"hotel":2.0,"travel":1.0,"general":1.0},
    "Delta SkyMiles Gold Amex":                {"delta":2.0,"dining":2.0,"groceries":2.0,"travel":1.0,"general":1.0},
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
    # ── INDIA ─────────────────────────────────────────────────────────────────
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
}

# ── Helper ─────────────────────────────────────────────────────────────────────

def calculate_card_strategy(card, points_needed, months, user_monthly_budget=None):
    card_rates = CARD_EARNING_RATES.get(card.name, {"general": 1.0})
    monthly_points_needed = points_needed / months
    bonus_categories = {cat: mult for cat, mult in card_rates.items() if mult >= 1.5}

    if not bonus_categories:
        avg_rate = card_rates.get("general", 1.0)
        monthly_spend = monthly_points_needed / avg_rate
        budget_warning = None
        if user_monthly_budget and monthly_spend > user_monthly_budget:
            budget_warning = "❌ Exceeds your ${:,.0f} monthly budget by ${:,.0f}".format(user_monthly_budget, monthly_spend - user_monthly_budget)
        elif monthly_spend > 10000:
            budget_warning = "⚠️ Very high spending required — consider extending timeline"
        return {
            "card_name": card.name, "card_id": card.id, "avg_earn_rate": avg_rate,
            "monthly_spend_needed": int(monthly_spend), "total_spend_needed": int(monthly_spend * months),
            "monthly_points_earned": int(monthly_points_needed), "total_points_earned": int(points_needed),
            "category_breakdown": [CategorySpending(category="General", monthly_spend=int(monthly_spend), multiplier=avg_rate, monthly_points=int(monthly_points_needed))],
            "budget_warning": budget_warning
        }

    best_multiplier = max(bonus_categories.values())
    best_categories = [cat for cat, mult in bonus_categories.items() if mult == best_multiplier]
    num_categories = len(best_categories)
    spend_per_category = (monthly_points_needed / best_multiplier) / num_categories
    points_per_category = spend_per_category * best_multiplier
    category_breakdown = []
    total_monthly_spend = 0
    for category in best_categories:
        category_breakdown.append(CategorySpending(
            category=category.replace("_", " ").title(),
            monthly_spend=int(spend_per_category),
            multiplier=best_multiplier,
            monthly_points=int(points_per_category)
        ))
        total_monthly_spend += spend_per_category

    budget_warning = None
    if user_monthly_budget and total_monthly_spend > user_monthly_budget:
        budget_warning = "❌ Exceeds your ${:,.0f} monthly budget by ${:,.0f}".format(user_monthly_budget, total_monthly_spend - user_monthly_budget)
    elif total_monthly_spend > 10000:
        budget_warning = "⚠️ Very high spending required — consider extending timeline"

    return {
        "card_name": card.name, "card_id": card.id, "avg_earn_rate": round(best_multiplier, 2),
        "monthly_spend_needed": int(total_monthly_spend), "total_spend_needed": int(total_monthly_spend * months),
        "monthly_points_earned": int(monthly_points_needed), "total_points_earned": int(points_needed),
        "category_breakdown": category_breakdown, "budget_warning": budget_warning
    }

# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    init_db()
    seed_database()

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"name": "PointsPath API", "version": "3.0.0", "countries": ["CA", "US", "IN"]}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check(db: Session = Depends(get_db)):
    try:
        card_count  = db.query(CreditCardModel).count()
        route_count = db.query(RouteModel).count()
        return {"status": "healthy", "timestamp": datetime.now().isoformat(), "version": "3.0.0",
                "database": {"cards": card_count, "routes": route_count}}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "degraded", "error": str(e)})

@app.post("/subscribe-email")
async def subscribe_email(email: str):
    try:
        beehiiv_api_key = settings.BEEHIIV_API_KEY
        beehiiv_pub_id  = settings.BEEHIIV_PUB_ID
        if not beehiiv_api_key or not beehiiv_pub_id:
            return {"success": True, "message": "Subscribed (test mode)"}
        response = requests.post(
            f"https://api.beehiiv.com/v2/publications/{beehiiv_pub_id}/subscriptions",
            headers={"Authorization": f"Bearer {beehiiv_api_key}", "Content-Type": "application/json"},
            json={"email": email, "reactivate_existing": False, "send_welcome_email": True,
                  "utm_source": "pointspath", "utm_medium": "website"},
            timeout=10
        )
        if response.status_code in [200, 201]:
            return {"success": True, "message": "Subscribed successfully"}
        raise HTTPException(status_code=response.status_code, detail=f"Beehiiv error: {response.text}")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

@app.post("/calculate-points", response_model=PointsCalculation)
async def calculate_points(trip: TripRequest, db: Session = Depends(get_db)):
    from_city   = trip.from_city.strip().title()
    to_city     = trip.to_city.strip().title()
    country     = trip.country.upper()

    route = db.query(RouteModel).filter(
        RouteModel.from_city == from_city,
        RouteModel.to_city   == to_city,
        RouteModel.country   == country
    ).first()

    if not route:
        # Try reverse
        route = db.query(RouteModel).filter(
            RouteModel.from_city == to_city,
            RouteModel.to_city   == from_city,
            RouteModel.country   == country
        ).first()

    if not route:
        raise HTTPException(status_code=404, detail=f"Route not found: {from_city} → {to_city} ({country}). Check spelling — use full city names like 'Toronto', 'Mumbai', 'New York'.")

    class_mapping = {
        "economy": route.economy_points,
        "premium_economy": route.premium_economy_points,
        "business": route.business_points,
        "first": route.first_points
    }
    travel_class   = trip.travel_class.lower().replace(" ", "_")
    points_per_person = class_mapping.get(travel_class)
    if points_per_person is None:
        raise HTTPException(status_code=400, detail=f"Invalid travel class: {trip.travel_class}")

    total_points = points_per_person * trip.passengers
    if trip.return_date:
        total_points *= 2

    return PointsCalculation(total_points=total_points, points_per_person=points_per_person,
                              route=f"{from_city} to {to_city}", travel_class=trip.travel_class)

@app.post("/strategies", response_model=List[SpendingStrategy])
async def calculate_strategies(trip: TripRequest, db: Session = Depends(get_db)):
    from_city = trip.from_city.strip().title()
    to_city   = trip.to_city.strip().title()
    country   = trip.country.upper()

    route = db.query(RouteModel).filter(
        RouteModel.from_city == from_city, RouteModel.to_city == to_city,
        RouteModel.country == country
    ).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    class_mapping = {"economy": route.economy_points, "premium_economy": route.premium_economy_points,
                     "business": route.business_points, "first": route.first_points}
    travel_class  = trip.travel_class.lower().replace(" ", "_")
    points_needed = (class_mapping.get(travel_class, route.economy_points) or 0) * trip.passengers

    top_cards = db.query(CreditCardModel).filter(
        CreditCardModel.is_active == True, CreditCardModel.country == country
    ).order_by(CreditCardModel.welcome_bonus.desc()).limit(3).all()

    strategies = []
    for card in top_cards:
        bonus     = card.welcome_bonus or 0
        remaining = max(0, points_needed - bonus)
        earn_rate = 2.5 if any(k in card.name for k in ["Reserve","Privilege","Infinia","Magnus","Aspire"]) else 1.5
        monthly_spend = 2500
        months = max(1, int(remaining / (monthly_spend * earn_rate))) if remaining > 0 else 1
        strategies.append(SpendingStrategy(
            cards=[card.name], monthly_spend=monthly_spend, earn_rate=earn_rate,
            months_needed=months, total_spend=monthly_spend * months,
            description=f"Get {bonus:,} welcome bonus + earn {earn_rate}x on spending."
        ))
    return strategies

@app.post("/calculate-gap", response_model=PointsGapResponse)
async def calculate_points_gap(gap_request: PointsGapRequest, db: Session = Depends(get_db)):
    points_gap = gap_request.points_needed - gap_request.points_current
    if points_gap <= 0:
        raise HTTPException(status_code=400, detail="You already have enough points!")

    monthly_points_target = points_gap / gap_request.timeline_months
    user_cards = db.query(CreditCardModel).filter(CreditCardModel.id.in_(gap_request.card_ids)).all()
    if not user_cards:
        raise HTTPException(status_code=400, detail="No valid cards selected")

    strategies = []
    for card in user_cards:
        strategy = calculate_card_strategy(card, points_gap, gap_request.timeline_months, gap_request.monthly_budget)
        strategies.append(GapStrategy(**strategy))
    strategies.sort(key=lambda x: x.avg_earn_rate, reverse=True)

    best = strategies[0] if strategies else None
    is_achievable = True
    total_monthly_spend = best.monthly_spend_needed if best else 0
    calculated_budget = None
    budget_status = None

    if gap_request.monthly_budget:
        if best:
            is_achievable = best.monthly_spend_needed <= gap_request.monthly_budget
            if is_achievable:
                budget_status = f"✅ Achievable within your ${gap_request.monthly_budget:,} monthly budget"
            else:
                excess = best.monthly_spend_needed - gap_request.monthly_budget
                budget_status = f"⚠️ Exceeds budget by ${excess:,}/month"
    else:
        if best:
            calculated_budget = best.monthly_spend_needed
            if calculated_budget > 10000:
                budget_status = f"⚠️ Calculated spend: ${calculated_budget:,}/month — consider a longer timeline"
                is_achievable = False
            elif calculated_budget > 5000:
                budget_status = f"💡 Calculated spend: ${calculated_budget:,}/month — verify this fits your budget"
            else:
                budget_status = f"✅ Calculated spend: ${calculated_budget:,}/month — reasonable for most budgets"

    return PointsGapResponse(
        points_gap=points_gap, monthly_points_target=int(monthly_points_target),
        timeline_months=gap_request.timeline_months, strategies=strategies,
        is_achievable=is_achievable, total_monthly_spend=total_monthly_spend,
        calculated_budget=calculated_budget, budget_status=budget_status
    )

@app.get("/cards")
async def get_cards(country: Optional[str] = Query(None), program: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(CreditCardModel).filter(CreditCardModel.is_active == True)
    if country:
        query = query.filter(CreditCardModel.country == country.upper())
    if program:
        query = query.filter(CreditCardModel.program.ilike(f"%{program}%"))
    cards = query.all()
    return {"count": len(cards), "cards": [
        {"id": c.id, "name": c.name, "issuer": c.issuer, "program": c.program,
         "earn_rate": c.earn_rate, "annual_fee": c.annual_fee, "welcome_bonus": c.welcome_bonus,
         "country": c.country, "is_active": c.is_active} for c in cards
    ]}

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
    query = db.query(RouteModel)
    if country:
        query = query.filter(RouteModel.country == country.upper())
    routes = query.all()
    return {"count": len(routes), "routes": [
        {"from": r.from_city, "to": r.to_city, "economy": r.economy_points,
         "premium_economy": r.premium_economy_points, "business": r.business_points,
         "first": r.first_points, "distance": r.distance_km, "type": r.route_type,
         "program": r.program, "country": r.country} for r in routes
    ]}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=settings.ENVIRONMENT == "development")
