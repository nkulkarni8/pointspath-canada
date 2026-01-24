"""
Simple script to view database contents
Run: python view_database.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import CreditCard, Route, SpendingCategory
import json

# Connect to database
DATABASE_URL = "sqlite:///./points_optimizer.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def view_credit_cards():
    """Display all credit cards"""
    print("\n" + "="*80)
    print("CREDIT CARDS")
    print("="*80)
    
    cards = db.query(CreditCard).all()
    
    if not cards:
        print("No credit cards found in database!")
        return
    
    for card in cards:
        print(f"\nID: {card.id}")
        print(f"Name: {card.name}")
        print(f"Issuer: {card.issuer}")
        print(f"Program: {card.program}")
        print(f"Earn Rate: {card.earn_rate}")
        print(f"Annual Fee: ${card.annual_fee}")
        print(f"Welcome Bonus: {card.welcome_bonus:,} points")
        print(f"Categories: {card.categories}")
        print(f"Active: {card.is_active}")
        print("-" * 80)
    
    print(f"\nTotal Cards: {len(cards)}")

def view_routes():
    """Display all routes"""
    print("\n" + "="*80)
    print("FLIGHT ROUTES")
    print("="*80)
    
    routes = db.query(Route).all()
    
    if not routes:
        print("No routes found in database!")
        return
    
    for route in routes:
        print(f"\nID: {route.id}")
        print(f"Route: {route.from_city} → {route.to_city}")
        print(f"Distance: {route.distance_km:,} km ({route.route_type})")
        print(f"Program: {route.program}")
        print(f"Points Required:")
        print(f"  Economy: {route.economy_points:,}")
        if route.premium_economy_points:
            print(f"  Premium Economy: {route.premium_economy_points:,}")
        if route.business_points:
            print(f"  Business: {route.business_points:,}")
        if route.first_points:
            print(f"  First Class: {route.first_points:,}")
        print("-" * 80)
    
    print(f"\nTotal Routes: {len(routes)}")

def view_categories():
    """Display all spending categories"""
    print("\n" + "="*80)
    print("SPENDING CATEGORIES")
    print("="*80)
    
    categories = db.query(SpendingCategory).all()
    
    if not categories:
        print("No categories found in database!")
        return
    
    for cat in categories:
        print(f"\nID: {cat.id}")
        print(f"Name: {cat.name}")
        print(f"Description: {cat.description}")
        print(f"Typical Monthly Spend: ${cat.typical_monthly_spend}")
        print("-" * 80)
    
    print(f"\nTotal Categories: {len(categories)}")

def view_stats():
    """Display database statistics"""
    print("\n" + "="*80)
    print("DATABASE STATISTICS")
    print("="*80)
    
    card_count = db.query(CreditCard).count()
    route_count = db.query(Route).count()
    category_count = db.query(SpendingCategory).count()
    
    print(f"\nCredit Cards: {card_count}")
    print(f"Routes: {route_count}")
    print(f"Spending Categories: {category_count}")
    print(f"\nDatabase: points_optimizer.db")
    print("="*80)

def export_to_json():
    """Export all data to JSON files"""
    print("\n" + "="*80)
    print("EXPORTING TO JSON")
    print("="*80)
    
    # Export cards
    cards = db.query(CreditCard).all()
    cards_data = []
    for card in cards:
        cards_data.append({
            "id": card.id,
            "name": card.name,
            "issuer": card.issuer,
            "program": card.program,
            "earn_rate": card.earn_rate,
            "annual_fee": card.annual_fee,
            "welcome_bonus": card.welcome_bonus,
            "categories": card.categories,
            "is_active": card.is_active
        })
    
    with open("cards_export.json", "w") as f:
        json.dump(cards_data, f, indent=2)
    print(f"✅ Exported {len(cards_data)} cards to cards_export.json")
    
    # Export routes
    routes = db.query(Route).all()
    routes_data = []
    for route in routes:
        routes_data.append({
            "id": route.id,
            "from_city": route.from_city,
            "to_city": route.to_city,
            "distance_km": route.distance_km,
            "route_type": route.route_type,
            "economy_points": route.economy_points,
            "premium_economy_points": route.premium_economy_points,
            "business_points": route.business_points,
            "first_points": route.first_points,
            "program": route.program
        })
    
    with open("routes_export.json", "w") as f:
        json.dump(routes_data, f, indent=2)
    print(f"✅ Exported {len(routes_data)} routes to routes_export.json")
    
    print("="*80)

if __name__ == "__main__":
    print("\n🎯 POINTS OPTIMIZER CANADA - DATABASE VIEWER\n")
    
    while True:
        print("\nWhat would you like to view?")
        print("1. Credit Cards")
        print("2. Routes")
        print("3. Spending Categories")
        print("4. Database Statistics")
        print("5. Export All to JSON")
        print("6. View Everything")
        print("0. Exit")
        
        choice = input("\nEnter choice (0-6): ").strip()
        
        if choice == "1":
            view_credit_cards()
        elif choice == "2":
            view_routes()
        elif choice == "3":
            view_categories()
        elif choice == "4":
            view_stats()
        elif choice == "5":
            export_to_json()
        elif choice == "6":
            view_stats()
            view_credit_cards()
            view_routes()
            view_categories()
        elif choice == "0":
            print("\n👋 Goodbye!\n")
            break
        else:
            print("Invalid choice. Please try again.")
    
    db.close()