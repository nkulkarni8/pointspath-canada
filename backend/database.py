from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - use SQLite for local development, PostgreSQL for production
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./points_optimizer.db"  # Default to SQLite for easy local testing
)

# For PostgreSQL (when you're ready to deploy):
# DATABASE_URL = "postgresql://user:password@localhost/points_optimizer"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize database with tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def seed_database():
    """Seed database with initial data"""
    from models import CreditCard, Route, SpendingCategory
    
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(CreditCard).first():
        print("Database already seeded!")
        db.close()
        return
    
    # Seed Credit Cards
    cards = [
        CreditCard(
            name="TD Aeroplan Visa Infinite",
            issuer="TD",
            program="Aeroplan",
            earn_rate="1.5 pts per $1 on eligible purchases",
            annual_fee=139,
            welcome_bonus=40000,
            categories=["gas", "groceries", "air_canada"],
            transfer_partners=["Air Canada", "United Airlines"]
        ),
        CreditCard(
            name="CIBC Aeroplan Visa Infinite",
            issuer="CIBC",
            program="Aeroplan",
            earn_rate="1.5 pts per $1 on gas, groceries, dining",
            annual_fee=139,
            welcome_bonus=45000,
            categories=["gas", "groceries", "dining"],
            transfer_partners=["Air Canada", "United Airlines"]
        ),
        CreditCard(
            name="American Express Aeroplan Reserve",
            issuer="Amex",
            program="Aeroplan",
            earn_rate="3 pts per $1 on dining, 2 pts on everything",
            annual_fee=599,
            welcome_bonus=85000,
            categories=["dining", "general"],
            transfer_partners=["Air Canada", "United Airlines", "Lufthansa"]
        ),
        CreditCard(
            name="RBC Avion Visa Infinite",
            issuer="RBC",
            program="Avion",
            earn_rate="1.25 pts per $1 on travel, 1 pt elsewhere",
            annual_fee=120,
            welcome_bonus=35000,
            categories=["travel", "general"],
            transfer_partners=["British Airways", "American Airlines", "Cathay Pacific"]
        ),
        CreditCard(
            name="Scotia Gold American Express",
            issuer="Scotiabank",
            program="Scene+",
            earn_rate="5 pts per $1 on dining, entertainment, groceries",
            annual_fee=120,
            welcome_bonus=40000,
            categories=["dining", "entertainment", "groceries"],
            transfer_partners=[]
        )
    ]
    
    # Seed Routes
    routes = [
        Route(
            from_city="Toronto",
            to_city="London",
            distance_km=5700,
            route_type="long-haul",
            economy_points=60000,
            premium_economy_points=90000,
            business_points=120000,
            first_points=180000,
            program="Aeroplan"
        ),
        Route(
            from_city="Toronto",
            to_city="Vancouver",
            distance_km=3350,
            route_type="domestic",
            economy_points=25000,
            premium_economy_points=35000,
            business_points=50000,
            first_points=75000,
            program="Aeroplan"
        ),
        Route(
            from_city="Toronto",
            to_city="New York",
            distance_km=550,
            route_type="short-haul",
            economy_points=15000,
            premium_economy_points=20000,
            business_points=30000,
            first_points=45000,
            program="Aeroplan"
        ),
        Route(
            from_city="Toronto",
            to_city="Paris",
            distance_km=6000,
            route_type="long-haul",
            economy_points=60000,
            premium_economy_points=90000,
            business_points=120000,
            first_points=200000,
            program="Aeroplan"
        ),
        Route(
            from_city="Toronto",
            to_city="Tokyo",
            distance_km=10400,
            route_type="long-haul",
            economy_points=75000,
            premium_economy_points=110000,
            business_points=150000,
            first_points=220000,
            program="Aeroplan"
        )
    ]
    
    # Seed Spending Categories
    categories = [
        SpendingCategory(name="groceries", description="Grocery stores and supermarkets", typical_monthly_spend=800),
        SpendingCategory(name="dining", description="Restaurants and food delivery", typical_monthly_spend=500),
        SpendingCategory(name="gas", description="Gas stations and fuel", typical_monthly_spend=200),
        SpendingCategory(name="travel", description="Hotels, flights, car rentals", typical_monthly_spend=300),
        SpendingCategory(name="entertainment", description="Movies, concerts, streaming", typical_monthly_spend=150),
        SpendingCategory(name="general", description="All other purchases", typical_monthly_spend=1000)
    ]
    
    try:
        db.add_all(cards)
        db.add_all(routes)
        db.add_all(categories)
        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Seeding database...")
    seed_database()
    print("Done!")