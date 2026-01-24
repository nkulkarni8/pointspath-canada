"""
Latest Canadian Credit Card Data - Updated January 2026
Source: Prince of Travel, Rewards Canada, Ratehub, NerdWallet Canada
Last Updated: January 22, 2026

Run this to update your database with latest card offers:
python latest_cards_data.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import CreditCard

DATABASE_URL = "sqlite:///./points_optimizer.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Latest Canadian Credit Card Data (January 2026)
LATEST_CARDS = [
    # === TD BANK ===
    {
        "name": "TD Aeroplan Visa Infinite",
        "issuer": "TD",
        "program": "Aeroplan",
        "earn_rate": "1.5 pts per $1 on gas, groceries, Air Canada",
        "annual_fee": 139,
        "welcome_bonus": 45000,  # Current: Up to 45K
        "categories": ["gas", "groceries", "air_canada"],
        "transfer_partners": ["Air Canada", "United"],
        "is_active": True
    },
    {
        "name": "TD First Class Travel Visa Infinite",
        "issuer": "TD",
        "program": "TD Rewards",
        "earn_rate": "6 pts per $1 on groceries/dining/transit, 2 pts general",
        "annual_fee": 139,
        "welcome_bonus": 165000,  # HIGHEST EVER! Up to 165K
        "categories": ["groceries", "dining", "transit", "travel"],
        "transfer_partners": [],
        "is_active": True
    },
    
    # === CIBC ===
    {
        "name": "CIBC Aeroplan Visa Infinite",
        "issuer": "CIBC",
        "program": "Aeroplan",
        "earn_rate": "1.5 pts per $1 on gas, groceries, dining",
        "annual_fee": 139,
        "welcome_bonus": 40000,  # Current: Up to 40K
        "categories": ["gas", "groceries", "dining"],
        "transfer_partners": ["Air Canada"],
        "is_active": True
    },
    {
        "name": "CIBC Aventura Visa Infinite",
        "issuer": "CIBC",
        "program": "Aventura",
        "earn_rate": "2 pts per $1 on travel/dining, 1.5 pts gas/groceries",
        "annual_fee": 139,
        "welcome_bonus": 60000,  # INCREASED! Now 60K (was 45K)
        "categories": ["travel", "dining", "gas", "groceries"],
        "transfer_partners": ["Aeroplan", "Cathay Pacific"],
        "is_active": True
    },
    {
        "name": "CIBC Dividend Visa Infinite",
        "issuer": "CIBC",
        "program": "Cash Back",
        "earn_rate": "4% groceries, 2% gas/transit, 1% general",
        "annual_fee": 120,
        "welcome_bonus": 25000,  # 10% back on $2500 = effective 25K pts
        "categories": ["groceries", "gas", "transit"],
        "transfer_partners": [],
        "is_active": True
    },
    
    # === AMERICAN EXPRESS ===
    {
        "name": "American Express Platinum Card",
        "issuer": "Amex",
        "program": "Membership Rewards",
        "earn_rate": "1.25 pts per $1 on all purchases",
        "annual_fee": 799,
        "welcome_bonus": 90000,  # High bonus for premium card
        "categories": ["travel", "general"],
        "transfer_partners": ["Aeroplan", "British Airways", "Marriott", "Cathay Pacific"],
        "is_active": True
    },
    {
        "name": "American Express Aeroplan Reserve",
        "issuer": "Amex",
        "program": "Aeroplan",
        "earn_rate": "3 pts per $1 dining, 2 pts general",
        "annual_fee": 599,
        "welcome_bonus": 85000,  # Premium card, high bonus
        "categories": ["dining", "travel", "general"],
        "transfer_partners": ["Air Canada", "Lufthansa"],
        "is_active": True
    },
    {
        "name": "American Express Cobalt Card",
        "issuer": "Amex",
        "program": "Membership Rewards",
        "earn_rate": "5 pts per $1 on food/drinks, 2 pts travel/transit",
        "annual_fee": 156,  # $13/month
        "welcome_bonus": 45000,  # 5K per month for 12 months
        "categories": ["groceries", "dining", "travel", "transit"],
        "transfer_partners": ["Aeroplan", "British Airways", "Marriott"],
        "is_active": True
    },
    {
        "name": "American Express Gold Rewards Card",
        "issuer": "Amex",
        "program": "Membership Rewards",
        "earn_rate": "2 pts per $1 on travel/dining/gas/groceries",
        "annual_fee": 250,
        "welcome_bonus": 60000,  # 5K per month for 12 months
        "categories": ["travel", "dining", "gas", "groceries"],
        "transfer_partners": ["Aeroplan", "British Airways"],
        "is_active": True
    },
    
    # === RBC ===
    {
        "name": "RBC Avion Visa Infinite",
        "issuer": "RBC",
        "program": "Avion",
        "earn_rate": "1.25 pts per $1 on travel, 1 pt general",
        "annual_fee": 120,
        "welcome_bonus": 35000,
        "categories": ["travel", "general"],
        "transfer_partners": ["British Airways", "American Airlines", "Cathay Pacific", "WestJet"],
        "is_active": True
    },
    {
        "name": "RBC British Airways Visa Infinite",
        "issuer": "RBC",
        "program": "British Airways Avios",
        "earn_rate": "1.25 Avios per $1, 2 Avios on British Airways",
        "annual_fee": 165,
        "welcome_bonus": 60000,  # Avios
        "categories": ["travel", "general"],
        "transfer_partners": ["British Airways", "Iberia", "Aer Lingus"],
        "is_active": True
    },
    {
        "name": "RBC Ion+ Visa",
        "issuer": "RBC",
        "program": "Avion",
        "earn_rate": "3 pts per $1 groceries, 2 pts dining/transit",
        "annual_fee": 0,  # NO FEE!
        "welcome_bonus": 15000,
        "categories": ["groceries", "dining", "transit"],
        "transfer_partners": ["British Airways", "Cathay Pacific"],
        "is_active": True
    },
    
    # === SCOTIABANK ===
    {
        "name": "Scotia Gold American Express",
        "issuer": "Scotiabank",
        "program": "Scene+",
        "earn_rate": "5 pts per $1 on groceries/dining/entertainment",
        "annual_fee": 120,
        "welcome_bonus": 50000,  # Currently 50K
        "categories": ["groceries", "dining", "entertainment"],
        "transfer_partners": [],
        "is_active": True
    },
    {
        "name": "Scotia Passport Visa Infinite",
        "issuer": "Scotiabank",
        "program": "Scene+",
        "earn_rate": "5 pts per $1 on travel/dining/entertainment/groceries",
        "annual_fee": 139,
        "welcome_bonus": 60000,  # INCREASED! Now 60K
        "categories": ["travel", "dining", "entertainment", "groceries"],
        "transfer_partners": [],
        "is_active": True
    },
    {
        "name": "Scotiabank Scene+ Visa",
        "issuer": "Scotiabank",
        "program": "Scene+",
        "earn_rate": "1-2 pts per $1 on purchases",
        "annual_fee": 0,  # NO FEE!
        "welcome_bonus": 10000,
        "categories": ["general"],
        "transfer_partners": [],
        "is_active": True
    },
    
    # === BMO ===
    {
        "name": "BMO Eclipse Visa Infinite",
        "issuer": "BMO",
        "program": "BMO Rewards",
        "earn_rate": "5 pts per $1 on gas, groceries, transit",
        "annual_fee": 120,
        "welcome_bonus": 35000,
        "categories": ["gas", "groceries", "transit"],
        "transfer_partners": [],
        "is_active": True
    },
    {
        "name": "BMO Ascend World Elite Mastercard",
        "issuer": "BMO",
        "program": "BMO Rewards",
        "earn_rate": "5 pts per $1 on travel, 3 pts dining, 1 pt general",
        "annual_fee": 150,
        "welcome_bonus": 90000,  # High bonus!
        "categories": ["travel", "dining", "general"],
        "transfer_partners": [],
        "is_active": True
    },
]

def update_cards():
    """Update database with latest card information"""
    
    print("🔄 Updating credit card database with latest offers...")
    print("=" * 70)
    
    updated = 0
    added = 0
    
    for card_data in LATEST_CARDS:
        # Check if card exists
        existing = db.query(CreditCard).filter(
            CreditCard.name == card_data["name"]
        ).first()
        
        if existing:
            # Update existing card
            old_bonus = existing.welcome_bonus
            existing.welcome_bonus = card_data["welcome_bonus"]
            existing.earn_rate = card_data["earn_rate"]
            existing.annual_fee = card_data["annual_fee"]
            existing.categories = card_data["categories"]
            existing.transfer_partners = card_data["transfer_partners"]
            
            if old_bonus != card_data["welcome_bonus"]:
                print(f"✏️  UPDATED: {card_data['name']}")
                print(f"   Bonus: {old_bonus:,} → {card_data['welcome_bonus']:,} pts")
            else:
                print(f"✓  Verified: {card_data['name']} ({card_data['welcome_bonus']:,} pts)")
            
            updated += 1
        else:
            # Add new card
            new_card = CreditCard(**card_data)
            db.add(new_card)
            print(f"✨ ADDED: {card_data['name']} ({card_data['welcome_bonus']:,} pts)")
            added += 1
    
    db.commit()
    
    print("=" * 70)
    print(f"\n📊 Summary:")
    print(f"   Updated: {updated} cards")
    print(f"   Added: {added} new cards")
    print(f"   Total cards in database: {db.query(CreditCard).count()}")
    print("\n✅ Database update complete!")
    print("\nℹ️  Source: Prince of Travel, Rewards Canada (January 2026)")
    print("💡 Next update recommended: Check r/churningcanada weekly")
    
    db.close()

if __name__ == "__main__":
    update_cards()