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
        
        # List of all routes to insert
        routes_data = [
            # DOMESTIC CANADA
            ('Toronto', 'Montreal', 504, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Montreal', 'Toronto', 504, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Toronto', 'Vancouver', 3356, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Vancouver', 'Toronto', 3356, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Toronto', 'Calgary', 2698, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Calgary', 'Toronto', 2698, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Toronto', 'Edmonton', 2700, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Edmonton', 'Toronto', 2700, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Toronto', 'Ottawa', 350, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Ottawa', 'Toronto', 350, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Toronto', 'Halifax', 1281, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Halifax', 'Toronto', 1281, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Montreal', 'Vancouver', 3682, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Vancouver', 'Montreal', 3682, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Montreal', 'Calgary', 2900, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Calgary', 'Montreal', 2900, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Montreal', 'Edmonton', 2850, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Edmonton', 'Montreal', 2850, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Montreal', 'Ottawa', 165, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Ottawa', 'Montreal', 165, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Montreal', 'Halifax', 800, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Halifax', 'Montreal', 800, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Vancouver', 'Calgary', 674, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Calgary', 'Vancouver', 674, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Vancouver', 'Edmonton', 820, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Edmonton', 'Vancouver', 820, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Vancouver', 'Ottawa', 3650, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Ottawa', 'Vancouver', 3650, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Vancouver', 'Halifax', 4600, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Halifax', 'Vancouver', 4600, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Calgary', 'Edmonton', 280, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Edmonton', 'Calgary', 280, 'domestic', 10000, 20000, 25000, None, 'Aeroplan'),
            ('Calgary', 'Ottawa', 2850, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Ottawa', 'Calgary', 2850, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Calgary', 'Halifax', 3750, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Halifax', 'Calgary', 3750, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Edmonton', 'Ottawa', 2950, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Ottawa', 'Edmonton', 2950, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Edmonton', 'Halifax', 3900, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Halifax', 'Edmonton', 3900, 'domestic', 15000, 35000, 50000, 70000, 'Aeroplan'),
            ('Ottawa', 'Halifax', 950, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            ('Halifax', 'Ottawa', 950, 'domestic', 12500, 25000, 30000, None, 'Aeroplan'),
            
            # CANADA TO USA
            ('Toronto', 'New York', 550, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('New York', 'Toronto', 550, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Toronto', 'Los Angeles', 3506, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Los Angeles', 'Toronto', 3506, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Toronto', 'San Francisco', 3660, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('San Francisco', 'Toronto', 3660, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Toronto', 'Boston', 690, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Boston', 'Toronto', 690, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Toronto', 'Miami', 2093, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Toronto', 2093, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Montreal', 'New York', 530, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('New York', 'Montreal', 530, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Montreal', 'Los Angeles', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Los Angeles', 'Montreal', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Montreal', 'San Francisco', 4100, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('San Francisco', 'Montreal', 4100, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Montreal', 'Boston', 400, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Boston', 'Montreal', 400, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Montreal', 'Miami', 2400, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Montreal', 2400, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Vancouver', 'New York', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('New York', 'Vancouver', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Vancouver', 'Los Angeles', 1740, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Los Angeles', 'Vancouver', 1740, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Vancouver', 'San Francisco', 1280, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('San Francisco', 'Vancouver', 1280, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Vancouver', 'Boston', 4200, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Boston', 'Vancouver', 4200, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Vancouver', 'Miami', 4400, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Vancouver', 4400, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Calgary', 'New York', 3400, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('New York', 'Calgary', 3400, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Calgary', 'Los Angeles', 1900, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Los Angeles', 'Calgary', 1900, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Calgary', 'San Francisco', 1700, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('San Francisco', 'Calgary', 1700, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Calgary', 'Boston', 3600, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Boston', 'Calgary', 3600, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Calgary', 'Miami', 3800, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Calgary', 3800, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Edmonton', 'New York', 3500, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('New York', 'Edmonton', 3500, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Edmonton', 'Los Angeles', 2000, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Los Angeles', 'Edmonton', 2000, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Edmonton', 'San Francisco', 1800, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('San Francisco', 'Edmonton', 1800, 'north_america', 12500, 35000, 50000, 80000, 'Aeroplan'),
            ('Edmonton', 'Boston', 3700, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Boston', 'Edmonton', 3700, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Edmonton', 'Miami', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Edmonton', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Ottawa', 'New York', 500, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('New York', 'Ottawa', 500, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Ottawa', 'Los Angeles', 3700, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Los Angeles', 'Ottawa', 3700, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Ottawa', 'San Francisco', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('San Francisco', 'Ottawa', 3900, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Ottawa', 'Boston', 600, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Boston', 'Ottawa', 600, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Ottawa', 'Miami', 2200, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Ottawa', 2200, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Halifax', 'New York', 900, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('New York', 'Halifax', 900, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Halifax', 'Los Angeles', 4500, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Los Angeles', 'Halifax', 4500, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Halifax', 'San Francisco', 4700, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('San Francisco', 'Halifax', 4700, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Halifax', 'Boston', 800, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Boston', 'Halifax', 800, 'north_america', 12500, 30000, 40000, None, 'Aeroplan'),
            ('Halifax', 'Miami', 2500, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            ('Miami', 'Halifax', 2500, 'north_america', 17500, 40000, 60000, 100000, 'Aeroplan'),
            
            # CANADA TO MEXICO
            ('Toronto', 'Cancun', 2480, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Cancun', 'Toronto', 2480, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Toronto', 'Mexico City', 3290, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Mexico City', 'Toronto', 3290, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Montreal', 'Cancun', 2650, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Cancun', 'Montreal', 2650, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Montreal', 'Mexico City', 3450, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Mexico City', 'Montreal', 3450, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Vancouver', 'Cancun', 3800, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Cancun', 'Vancouver', 3800, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Vancouver', 'Mexico City', 3600, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Mexico City', 'Vancouver', 3600, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Calgary', 'Cancun', 3400, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Cancun', 'Calgary', 3400, 'north_america', 20000, 45000, 70000, 110000, 'Aeroplan'),
            ('Calgary', 'Mexico City', 3200, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            ('Mexico City', 'Calgary', 3200, 'north_america', 25000, 55000, 80000, 130000, 'Aeroplan'),
            
            # CANADA TO EUROPE
            ('Toronto', 'London', 5719, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('London', 'Toronto', 5719, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Toronto', 'Paris', 6015, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Paris', 'Toronto', 6015, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Toronto', 'Frankfurt', 6331, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Frankfurt', 'Toronto', 6331, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Toronto', 'Rome', 6916, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Rome', 'Toronto', 6916, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Toronto', 'Amsterdam', 5919, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Amsterdam', 'Toronto', 5919, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Montreal', 'London', 5200, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('London', 'Montreal', 5200, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Montreal', 'Paris', 5511, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Paris', 'Montreal', 5511, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Montreal', 'Frankfurt', 5900, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Frankfurt', 'Montreal', 5900, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Montreal', 'Rome', 6500, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Rome', 'Montreal', 6500, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Montreal', 'Amsterdam', 5500, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Amsterdam', 'Montreal', 5500, 'international', 60000, 90000, 120000, 210000, 'Aeroplan'),
            ('Vancouver', 'London', 7590, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('London', 'Vancouver', 7590, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Vancouver', 'Paris', 7800, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Paris', 'Vancouver', 7800, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Vancouver', 'Frankfurt', 8100, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Frankfurt', 'Vancouver', 8100, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Vancouver', 'Rome', 8700, 'international', 75000, 110000, 150000, 260000, 'Aeroplan'),
            ('Rome', 'Vancouver', 8700, 'international', 75000, 110000, 150000, 260000, 'Aeroplan'),
            ('Vancouver', 'Amsterdam', 7700, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Amsterdam', 'Vancouver', 7700, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Calgary', 'London', 7000, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('London', 'Calgary', 7000, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Calgary', 'Paris', 7200, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Paris', 'Calgary', 7200, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Calgary', 'Frankfurt', 7500, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Frankfurt', 'Calgary', 7500, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Calgary', 'Rome', 8100, 'international', 75000, 110000, 150000, 260000, 'Aeroplan'),
            ('Rome', 'Calgary', 8100, 'international', 75000, 110000, 150000, 260000, 'Aeroplan'),
            ('Calgary', 'Amsterdam', 7100, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            ('Amsterdam', 'Calgary', 7100, 'international', 70000, 100000, 140000, 240000, 'Aeroplan'),
            
            # CANADA TO ASIA
            ('Toronto', 'Tokyo', 10350, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Tokyo', 'Toronto', 10350, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Toronto', 'Hong Kong', 12550, 'international', 80000, 130000, 170000, 300000, 'Aeroplan'),
            ('Hong Kong', 'Toronto', 12550, 'international', 80000, 130000, 170000, 300000, 'Aeroplan'),
            ('Toronto', 'Seoul', 10580, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Seoul', 'Toronto', 10580, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Toronto', 'Singapore', 15320, 'international', 90000, 145000, 190000, 340000, 'Aeroplan'),
            ('Singapore', 'Toronto', 15320, 'international', 90000, 145000, 190000, 340000, 'Aeroplan'),
            ('Vancouver', 'Tokyo', 7576, 'international', 60000, 100000, 130000, 230000, 'Aeroplan'),
            ('Tokyo', 'Vancouver', 7576, 'international', 60000, 100000, 130000, 230000, 'Aeroplan'),
            ('Vancouver', 'Hong Kong', 10080, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Hong Kong', 'Vancouver', 10080, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Vancouver', 'Seoul', 8300, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Seoul', 'Vancouver', 8300, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Vancouver', 'Singapore', 13500, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Singapore', 'Vancouver', 13500, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Calgary', 'Tokyo', 8000, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Tokyo', 'Calgary', 8000, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Calgary', 'Hong Kong', 10500, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Hong Kong', 'Calgary', 10500, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Calgary', 'Seoul', 8700, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Seoul', 'Calgary', 8700, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Calgary', 'Singapore', 14000, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Singapore', 'Calgary', 14000, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            
            # CANADA TO MIDDLE EAST
            ('Toronto', 'Dubai', 10720, 'international', 80000, 125000, 165000, 290000, 'Aeroplan'),
            ('Dubai', 'Toronto', 10720, 'international', 80000, 125000, 165000, 290000, 'Aeroplan'),
            ('Toronto', 'Tel Aviv', 9190, 'international', 75000, 115000, 150000, 265000, 'Aeroplan'),
            ('Tel Aviv', 'Toronto', 9190, 'international', 75000, 115000, 150000, 265000, 'Aeroplan'),
            ('Vancouver', 'Dubai', 12500, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Dubai', 'Vancouver', 12500, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Vancouver', 'Tel Aviv', 11000, 'international', 80000, 125000, 165000, 290000, 'Aeroplan'),
            ('Tel Aviv', 'Vancouver', 11000, 'international', 80000, 125000, 165000, 290000, 'Aeroplan'),
            
            # CANADA TO OCEANIA
            ('Toronto', 'Sydney', 15550, 'international', 100000, 160000, 210000, 370000, 'Aeroplan'),
            ('Sydney', 'Toronto', 15550, 'international', 100000, 160000, 210000, 370000, 'Aeroplan'),
            ('Toronto', 'Auckland', 13280, 'international', 90000, 145000, 190000, 340000, 'Aeroplan'),
            ('Auckland', 'Toronto', 13280, 'international', 90000, 145000, 190000, 340000, 'Aeroplan'),
            ('Vancouver', 'Sydney', 12070, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Sydney', 'Vancouver', 12070, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Vancouver', 'Auckland', 11000, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Auckland', 'Vancouver', 11000, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            
            # CANADA TO SOUTH AMERICA
            ('Toronto', 'Sao Paulo', 7670, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Sao Paulo', 'Toronto', 7670, 'international', 70000, 110000, 145000, 255000, 'Aeroplan'),
            ('Toronto', 'Buenos Aires', 8380, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Buenos Aires', 'Toronto', 8380, 'international', 75000, 120000, 155000, 275000, 'Aeroplan'),
            ('Vancouver', 'Sao Paulo', 10500, 'international', 80000, 125000, 165000, 290000, 'Aeroplan'),
            ('Sao Paulo', 'Vancouver', 10500, 'international', 80000, 125000, 165000, 290000, 'Aeroplan'),
            ('Vancouver', 'Buenos Aires', 11200, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            ('Buenos Aires', 'Vancouver', 11200, 'international', 85000, 135000, 175000, 310000, 'Aeroplan'),
            
            # CANADA TO CARIBBEAN
            ('Toronto', 'Barbados', 3350, 'international', 35000, 60000, 90000, 150000, 'Aeroplan'),
            ('Barbados', 'Toronto', 3350, 'international', 35000, 60000, 90000, 150000, 'Aeroplan'),
            ('Toronto', 'Jamaica', 2680, 'international', 30000, 55000, 80000, 135000, 'Aeroplan'),
            ('Jamaica', 'Toronto', 2680, 'international', 30000, 55000, 80000, 135000, 'Aeroplan'),
            ('Montreal', 'Barbados', 3450, 'international', 35000, 60000, 90000, 150000, 'Aeroplan'),
            ('Barbados', 'Montreal', 3450, 'international', 35000, 60000, 90000, 150000, 'Aeroplan'),
            ('Montreal', 'Jamaica', 2780, 'international', 30000, 55000, 80000, 135000, 'Aeroplan'),
            ('Jamaica', 'Montreal', 2780, 'international', 30000, 55000, 80000, 135000, 'Aeroplan'),
            ('Halifax', 'Barbados', 2800, 'international', 30000, 55000, 80000, 135000, 'Aeroplan'),
            ('Barbados', 'Halifax', 2800, 'international', 30000, 55000, 80000, 135000, 'Aeroplan'),
            ('Halifax', 'Jamaica', 2200, 'international', 25000, 50000, 75000, 125000, 'Aeroplan'),
            ('Jamaica', 'Halifax', 2200, 'international', 25000, 50000, 75000, 125000, 'Aeroplan'),
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