from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime, timedelta
import uvicorn
from sqlalchemy.orm import Session
from config import settings

# Import database models and session
from database import get_db, init_db, seed_database
from models import CreditCard as CreditCardModel, Route as RouteModel

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION
)

print(f"🚀 Starting {settings.API_TITLE}")
print(f"📍 Environment: {settings.ENVIRONMENT}")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"🌐 CORS enabled for: {settings.ALLOWED_ORIGINS}")
# ============================================================================
# PYDANTIC MODELS (Request/Response schemas)
# ============================================================================

class TripRequest(BaseModel):
    from_city: str
    to_city: str
    depart_date: date
    return_date: Optional[date] = None
    passengers: int = 1
    travel_class: str = "economy"

class PointsCalculation(BaseModel):
    total_points: int
    points_per_person: int
    route: str
    travel_class: str

class CreditCard(BaseModel):
    id: int
    name: str
    issuer: str
    program: str
    earn_rate: str
    annual_fee: int
    welcome_bonus: int
    categories: Optional[List[str]] = None

    class Config:
        from_attributes = True

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

class PointsGapResponse(BaseModel):
    points_gap: int
    monthly_points_target: int
    timeline_months: int
    strategies: List[GapStrategy]
    is_achievable: bool
    total_monthly_spend: int

# ============================================================================
# CARD EARNING RATES DATA
# ============================================================================

CARD_EARNING_RATES = {
    "American Express Platinum Card": {
        "travel": 1.25,
        "dining": 1.25,
        "gas": 1.25,
        "groceries": 1.25,
        "entertainment": 1.25,
        "general": 1.25
    },
    "TD Aeroplan Visa Infinite": {
        "groceries": 1.5,
        "gas": 1.5,
        "air_canada": 1.5,
        "dining": 1.0,
        "travel": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "CIBC Aeroplan Visa Infinite": {
        "groceries": 1.5,
        "gas": 1.5,
        "dining": 1.5,
        "travel": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "American Express Aeroplan Reserve": {
        "dining": 3.0,
        "groceries": 2.0,
        "gas": 2.0,
        "travel": 2.0,
        "entertainment": 2.0,
        "general": 2.0
    },
    "RBC Avion Visa Infinite": {
        "travel": 1.25,
        "groceries": 1.0,
        "gas": 1.0,
        "dining": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "Scotia Gold American Express": {
        "groceries": 5.0,
        "dining": 5.0,
        "entertainment": 5.0,
        "gas": 1.0,
        "travel": 1.0,
        "general": 1.0
    },
    "BMO Eclipse Visa Infinite": {
        "groceries": 5.0,
        "gas": 5.0,
        "transit": 5.0,
        "dining": 1.0,
        "travel": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "American Express Cobalt Card": {
        "groceries": 5.0,
        "dining": 5.0,
        "travel": 2.0,
        "transit": 2.0,
        "gas": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "RBC Ion+ Visa": {
        "groceries": 3.0,
        "dining": 2.0,
        "transit": 2.0,
        "gas": 1.0,
        "travel": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "TD First Class Travel Visa Infinite": {
        "travel": 3.0,
        "groceries": 1.5,
        "gas": 1.5,
        "dining": 1.5,
        "entertainment": 1.0,
        "general": 1.0
    },
    "CIBC Aventura Visa Infinite": {
        "travel": 2.0,
        "dining": 2.0,
        "groceries": 1.0,
        "gas": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "Scotia Passport Visa Infinite": {
        "travel": 5.0,
        "dining": 5.0,
        "entertainment": 5.0,
        "groceries": 5.0,
        "gas": 1.0,
        "general": 1.0
    },
    "TD Aeroplan Visa Infinite Privilege": {
        "groceries": 2.0,
        "gas": 2.0,
        "air_canada": 2.0,
        "dining": 2.0,
        "travel": 2.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "National Bank World Elite Mastercard": {
        "groceries": 5.0,
        "gas": 5.0,
        "transit": 5.0,
        "dining": 1.0,
        "travel": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "Scotiabank Platinum American Express": {
        "groceries": 5.0,
        "dining": 5.0,
        "entertainment": 5.0,
        "gas": 1.0,
        "travel": 1.0,
        "general": 1.0
    },
    "Scotiabank Scene+ Visa": {
        "groceries": 1.0,
        "dining": 1.0,
        "gas": 1.0,
        "travel": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "RBC Avion Visa Infinite Privilege": {
        "travel": 1.25,
        "groceries": 1.0,
        "gas": 1.0,
        "dining": 1.0,
        "entertainment": 1.0,
        "general": 1.0
    },
    "CIBC Costco Mastercard": {
        "gas": 3.0,
        "restaurants": 2.0,
        "costco": 1.0,
        "travel": 1.0,
        "general": 0.5
    }
}

# Average Canadian monthly spending by category
TYPICAL_MONTHLY_SPENDING = {
    "groceries": 800,
    "dining": 400,
    "gas": 200,
    "travel": 150,
    "entertainment": 150,
    "transit": 100,
    "air_canada": 100,
    "general": 1200
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_card_strategy(card: CreditCardModel, points_needed: int, months: int):
    """Calculate optimal spending strategy for a single card"""
    
    card_rates = CARD_EARNING_RATES.get(card.name, {"general": 1.0})
    monthly_points_needed = points_needed / months
    
    # Find best categories for this card (multiplier > 1.5)
    bonus_categories = {
        cat: mult for cat, mult in card_rates.items() 
        if mult >= 1.5
    }
    
    if not bonus_categories:
        # No bonus categories, use general spending
        avg_rate = 1.0
        monthly_spend = monthly_points_needed / avg_rate
        return {
            "card_name": card.name,
            "card_id": card.id,
            "avg_earn_rate": avg_rate,
            "monthly_spend_needed": int(monthly_spend),
            "total_spend_needed": int(monthly_spend * months),
            "monthly_points_earned": int(monthly_points_needed),
            "total_points_earned": int(points_needed),
            "category_breakdown": [
                CategorySpending(
                    category="general",
                    monthly_spend=int(monthly_spend),
                    multiplier=1.0,
                    monthly_points=int(monthly_points_needed)
                )
            ]
        }
    
    # Sort categories by multiplier (best first)
    sorted_categories = sorted(
        bonus_categories.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    # Calculate spending across top categories
    category_breakdown = []
    total_monthly_spend = 0
    total_monthly_points = 0
    
    for category, multiplier in sorted_categories[:3]:  # Top 3 categories
        typical_spend = TYPICAL_MONTHLY_SPENDING.get(category, 200)
        points_from_category = typical_spend * multiplier
        
        category_breakdown.append(
            CategorySpending(
                category=category.replace("_", " ").title(),
                monthly_spend=typical_spend,
                multiplier=multiplier,
                monthly_points=int(points_from_category)
            )
        )
        
        total_monthly_spend += typical_spend
        total_monthly_points += points_from_category
    
    # If we're short, add general spending
    if total_monthly_points < monthly_points_needed:
        remaining_points = monthly_points_needed - total_monthly_points
        general_rate = card_rates.get("general", 1.0)
        additional_spend = remaining_points / general_rate
        
        category_breakdown.append(
            CategorySpending(
                category="General",
                monthly_spend=int(additional_spend),
                multiplier=general_rate,
                monthly_points=int(remaining_points)
            )
        )
        
        total_monthly_spend += additional_spend
        total_monthly_points += remaining_points
    
    avg_rate = total_monthly_points / total_monthly_spend if total_monthly_spend > 0 else 1.0
    
    return {
        "card_name": card.name,
        "card_id": card.id,
        "avg_earn_rate": round(avg_rate, 2),
        "monthly_spend_needed": int(total_monthly_spend),
        "total_spend_needed": int(total_monthly_spend * months),
        "monthly_points_earned": int(total_monthly_points),
        "total_points_earned": int(total_monthly_points * months),
        "category_breakdown": category_breakdown
    }

# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    seed_database()

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {
        "message": "Points Optimizer Canada API",
        "version": "2.0.0",
        "flows": ["trip-planning", "points-gap-calculator"],
        "endpoints": [
            "/calculate-points",
            "/calculate-gap", 
            "/cards", 
            "/strategies", 
            "/routes"
        ]
    }

# ============================================================================
# FLOW 1: TRIP PLANNING ENDPOINTS
# ============================================================================

@app.post("/calculate-points", response_model=PointsCalculation)
async def calculate_points(trip: TripRequest, db: Session = Depends(get_db)):
    """Calculate points needed for a trip (Flow 1)"""
    
    # Normalize city names
    from_city = trip.from_city.strip().title()
    to_city = trip.to_city.strip().title()
    
    # Query database for route
    route = db.query(RouteModel).filter(
        RouteModel.from_city == from_city,
        RouteModel.to_city == to_city
    ).first()
    
    if not route:
        raise HTTPException(
            status_code=404,
            detail=f"Route not found: {from_city} to {to_city}. Available routes can be viewed at /routes"
        )
    
    # Get points for the selected class
    class_mapping = {
        "economy": route.economy_points,
        "premium_economy": route.premium_economy_points,
        "business": route.business_points,
        "first": route.first_points
    }
    
    travel_class = trip.travel_class.lower().replace(" ", "_")
    points_per_person = class_mapping.get(travel_class)
    
    if points_per_person is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid travel class: {trip.travel_class}"
        )
    
    total_points = points_per_person * trip.passengers
    
    return PointsCalculation(
        total_points=total_points,
        points_per_person=points_per_person,
        route=f"{from_city} to {to_city}",
        travel_class=trip.travel_class
    )

@app.post("/strategies", response_model=List[SpendingStrategy])
async def calculate_strategies(trip: TripRequest, db: Session = Depends(get_db)):
    """Calculate earning strategies to reach points goal (Flow 1)"""
    
    # First calculate total points needed
    from_city = trip.from_city.strip().title()
    to_city = trip.to_city.strip().title()
    
    route = db.query(RouteModel).filter(
        RouteModel.from_city == from_city,
        RouteModel.to_city == to_city
    ).first()
    
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    # Get points needed
    class_mapping = {
        "economy": route.economy_points,
        "premium_economy": route.premium_economy_points,
        "business": route.business_points,
        "first": route.first_points
    }
    
    travel_class = trip.travel_class.lower().replace(" ", "_")
    points_needed = class_mapping.get(travel_class, route.economy_points) * trip.passengers
    
    # Get top cards from database
    top_cards = db.query(CreditCardModel).filter(
        CreditCardModel.is_active == True
    ).order_by(CreditCardModel.welcome_bonus.desc()).limit(3).all()
    
    strategies = []
    
    for card in top_cards:
        bonus = card.welcome_bonus
        remaining = max(0, points_needed - bonus)
        
        # Estimate earn rate based on card
        if "Cobalt" in card.name or "Scotia Gold" in card.name or "Passport" in card.name:
            earn_rate = 3.5
        elif "Reserve" in card.name or "Privilege" in card.name:
            earn_rate = 2.5
        else:
            earn_rate = 1.5
        
        monthly_spend = 2500
        months = max(1, int(remaining / (monthly_spend * earn_rate))) if remaining > 0 else 1
        
        strategies.append(
            SpendingStrategy(
                cards=[card.name],
                monthly_spend=monthly_spend,
                earn_rate=earn_rate,
                months_needed=months,
                total_spend=monthly_spend * months,
                description=f"Get {bonus:,} welcome bonus + earn {earn_rate}x on spending. {card.earn_rate}"
            )
        )
    
    return strategies

# ============================================================================
# FLOW 2: POINTS GAP CALCULATOR ENDPOINTS
# ============================================================================

@app.post("/calculate-gap", response_model=PointsGapResponse)
async def calculate_points_gap(gap_request: PointsGapRequest, db: Session = Depends(get_db)):
    """Calculate how to bridge points gap with user's cards (Flow 2)"""
    
    points_gap = gap_request.points_needed - gap_request.points_current
    monthly_points_target = points_gap / gap_request.timeline_months
    
    if points_gap <= 0:
        raise HTTPException(
            status_code=400,
            detail="You already have enough points! No gap to calculate."
        )
    
    # Get user's cards from database
    user_cards = db.query(CreditCardModel).filter(
        CreditCardModel.id.in_(gap_request.card_ids)
    ).all()
    
    if not user_cards:
        raise HTTPException(
            status_code=400,
            detail="No valid cards selected"
        )
    
    # Calculate strategy for each card
    strategies = []
    for card in user_cards:
        strategy = calculate_card_strategy(
            card, 
            points_gap, 
            gap_request.timeline_months
        )
        strategies.append(GapStrategy(**strategy))
    
    # Sort by best earn rate
    strategies.sort(key=lambda x: x.avg_earn_rate, reverse=True)
    
    # Calculate if achievable with budget
    best_strategy = strategies[0] if strategies else None
    is_achievable = True
    total_monthly_spend = best_strategy.monthly_spend_needed if best_strategy else 0
    
    if gap_request.monthly_budget and best_strategy:
        is_achievable = best_strategy.monthly_spend_needed <= gap_request.monthly_budget
    
    return PointsGapResponse(
        points_gap=points_gap,
        monthly_points_target=int(monthly_points_target),
        timeline_months=gap_request.timeline_months,
        strategies=strategies,
        is_achievable=is_achievable,
        total_monthly_spend=total_monthly_spend
    )

# ============================================================================
# SHARED ENDPOINTS
# ============================================================================

@app.get("/cards", response_model=List[CreditCard])
async def get_cards(program: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all credit cards or filter by program"""
    
    query = db.query(CreditCardModel).filter(CreditCardModel.is_active == True)
    
    if program:
        query = query.filter(CreditCardModel.program.ilike(f"%{program}%"))
    
    cards = query.all()
    
    return cards

@app.get("/cards/{card_id}", response_model=CreditCard)
async def get_card(card_id: int, db: Session = Depends(get_db)):
    """Get specific credit card details"""
    
    card = db.query(CreditCardModel).filter(CreditCardModel.id == card_id).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return card

@app.get("/routes")
async def get_routes(db: Session = Depends(get_db)):
    """Get all available routes from database"""
    
    routes = db.query(RouteModel).all()
    
    routes_dict = {}
    for route in routes:
        key = f"{route.from_city.lower()}-{route.to_city.lower()}"
        routes_dict[key] = {
            "from": route.from_city,
            "to": route.to_city,
            "economy": route.economy_points,
            "premium_economy": route.premium_economy_points,
            "business": route.business_points,
            "first": route.first_points,
            "distance": route.distance_km,
            "type": route.route_type,
            "program": route.program
        }
    
    return routes_dict

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    import os
    
    # Use PORT from environment variable (Render sets this automatically)
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",  # Important for deployment
        port=port,
        reload=settings.ENVIRONMENT == "development"
    )