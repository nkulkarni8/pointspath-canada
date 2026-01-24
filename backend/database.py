from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Use DATABASE_URL from config (supports both SQLite and PostgreSQL)
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Create engine with appropriate settings
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    # SQLite-specific settings
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    print("✅ Using SQLite database (development mode)")
else:
    # PostgreSQL settings (for production)
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=settings.ENVIRONMENT == "development"
    )
    print("✅ Using PostgreSQL database (production mode)")

print(f"📂 Database: {SQLALCHEMY_DATABASE_URL[:40]}...")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database - create all tables"""
    # IMPORTANT: Import models here to register them with Base
    from models import CreditCard, Route
    
    # Now import Base from models
    from models import Base as ModelsBase
    
    # Create all tables
    ModelsBase.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

def seed_database():
    """Seed database with initial data"""
    from models import CreditCard, Route
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        if db.query(CreditCard).count() > 0:
            print("ℹ️  Database already contains data, skipping seed")
            return
        
        print("🌱 Seeding database with initial data...")
        
        # ===== CREDIT CARDS (All 22 Cards - January 2026) =====
        cards_data = [
            # TD Cards
            ("TD Aeroplan Visa Infinite", "TD", "Aeroplan", "1.5x Aeroplan on groceries, gas & Air Canada | 1x on everything else", 139, 50000),
            ("TD Aeroplan Visa Infinite Privilege", "TD", "Aeroplan", "1.5x Aeroplan on all purchases", 499, 90000),
            ("TD First Class Travel Visa Infinite", "TD", "TD Rewards", "3x on travel | 1.5x on groceries, gas & dining | 1x general", 120, 90000),
            
            # CIBC Cards
            ("CIBC Aeroplan Visa Infinite", "CIBC", "Aeroplan", "1.5x Aeroplan on groceries, gas & dining | 1x general", 139, 50000),
            ("CIBC Aeroplan Visa Infinite Privilege", "CIBC", "Aeroplan", "1.5x Aeroplan on all purchases", 499, 85000),
            ("CIBC Aventura Visa Infinite", "CIBC", "Aventura", "1.5x on all purchases", 139, 60000),
            ("CIBC Dividend Visa Infinite", "CIBC", "Cash Back", "4% groceries | 2% gas & transit | 1% general", 120, 10000),
            
            # American Express Cards
            ("American Express Cobalt Card", "American Express", "Membership Rewards", "5x on groceries & dining | 2x on travel & transit | 1x general", 156, 50000),
            ("American Express Aeroplan Reserve", "American Express", "Aeroplan", "3x dining | 2x on groceries, gas, travel & entertainment | 1x general", 599, 95000),
            ("American Express Gold Rewards", "American Express", "Membership Rewards", "2x on travel, dining, gas & groceries | 1x general", 150, 55000),
            ("American Express Platinum Card", "American Express", "Membership Rewards", "1.25x on all purchases", 799, 90000),
            
            # RBC Cards
            ("RBC Avion Visa Infinite", "RBC", "Avion", "1.25x on travel | 1x general", 120, 55000),
            ("RBC Avion Visa Infinite Privilege", "RBC", "Avion", "1.25x on all purchases", 399, 80000),
            ("RBC British Airways Visa Infinite", "RBC", "Avios", "1.5x on British Airways | 1x general", 165, 70000),
            ("RBC Ion+ Visa", "RBC", "Cash Back", "3% groceries | 2% dining & transit | 1x general", 0, 0),
            
            # Scotiabank Cards
            ("Scotiabank Gold American Express", "Scotiabank", "Scene+", "5x on groceries, dining & entertainment | 3x on gas & transit | 1x general", 120, 60000),
            ("Scotiabank Passport Visa Infinite", "Scotiabank", "Scene+", "5x on travel, dining, entertainment & groceries | 1x general", 139, 50000),
            ("Scotiabank Scene+ Visa", "Scotiabank", "Scene+", "5x at Cineplex & Swiss Chalet | 1x general", 0, 20000),
            
            # BMO Cards
            ("BMO Eclipse Visa Infinite", "BMO", "BMO Rewards", "5x on groceries, gas & transit | 1x general", 120, 50000),
            ("BMO Ascend World Elite Mastercard", "BMO", "BMO Rewards", "5x on travel, dining & entertainment | 1x general", 150, 60000),
            
            # National Bank
            ("National Bank World Elite Mastercard", "National Bank", "NBC Rewards", "5x on groceries, gas & transit | 2x on travel & dining | 1x general", 150, 70000),
            
            # Tangerine
            ("Tangerine Money-Back Credit Card", "Tangerine", "Cash Back", "2% on 3 categories of choice | 0.5% general", 0, 0),
        ]
        
        # Add all cards
        for card_data in cards_data:
            card = CreditCard(
                name=card_data[0],
                issuer=card_data[1],
                program=card_data[2],
                earn_rate=card_data[3],
                annual_fee=card_data[4],
                welcome_bonus=card_data[5],
                is_active=True
            )
            db.add(card)
        
        db.commit()
        print(f"✅ Added {len(cards_data)} credit cards")
        
        # ===== ROUTES (Sample) =====
        routes_data = [
            ("Toronto", "Montreal", 504, "domestic", 10000, 20000, 25000, None),
            ("Toronto", "Ottawa", 350, "domestic", 10000, 20000, 25000, None),
            ("Toronto", "Vancouver", 3356, "domestic", 15000, 35000, 50000, 70000),
            ("Toronto", "Calgary", 2698, "domestic", 15000, 35000, 50000, 70000),
            ("Toronto", "New York", 550, "north_america", 12500, 30000, 40000, None),
            ("Toronto", "Los Angeles", 3506, "north_america", 17500, 40000, 60000, 100000),
            ("Toronto", "London", 5719, "international", 60000, 90000, 120000, 210000),
            ("Toronto", "Paris", 6015, "international", 60000, 90000, 120000, 210000),
            ("Toronto", "Tokyo", 10350, "international", 75000, 120000, 155000, 275000),
        ]
        
        for route_data in routes_data:
            route = Route(
                from_city=route_data[0],
                to_city=route_data[1],
                distance_km=route_data[2],
                route_type=route_data[3],
                economy_points=route_data[4],
                premium_economy_points=route_data[5],
                business_points=route_data[6],
                first_points=route_data[7],
                program="Aeroplan"
            )
            db.add(route)
        
        db.commit()
        print(f"✅ Added {len(routes_data)} sample routes")
        print("💡 Add more routes in Neon SQL Console using the complete routes SQL")
        
        print("🎉 Database seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Initializing database...")
    init_db()
    seed_database()
    print("✅ Database setup complete!")