"""
Check which cards in database are missing from CARD_EARNING_RATES
Run: python check_missing_rates.py
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import CreditCard

# Import the earning rates from main.py
import sys
sys.path.insert(0, '.')
from main import CARD_EARNING_RATES

DATABASE_URL = "sqlite:///./points_optimizer.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def check_missing():
    print("\n" + "="*70)
    print("CHECKING FOR CARDS MISSING EARNING RATES")
    print("="*70 + "\n")
    
    all_cards = db.query(CreditCard).filter(CreditCard.is_active == True).all()
    
    missing = []
    configured = []
    
    for card in all_cards:
        if card.name in CARD_EARNING_RATES:
            rates = CARD_EARNING_RATES[card.name]
            # Check if it only has general rate (not properly configured)
            bonus_categories = [cat for cat, rate in rates.items() if cat != 'general' and rate > 1.0]
            
            if bonus_categories:
                configured.append({
                    'name': card.name,
                    'bonus_cats': bonus_categories
                })
                print(f"✅ {card.name}")
                print(f"   Bonus: {', '.join(bonus_categories)}")
            else:
                missing.append({
                    'name': card.name,
                    'earn_rate': card.earn_rate
                })
                print(f"⚠️  {card.name}")
                print(f"   Only general rate configured!")
                print(f"   Card description: {card.earn_rate}")
        else:
            missing.append({
                'name': card.name,
                'earn_rate': card.earn_rate
            })
            print(f"❌ {card.name}")
            print(f"   NOT in CARD_EARNING_RATES at all!")
            print(f"   Card description: {card.earn_rate}")
        print()
    
    print("="*70)
    print(f"\n📊 SUMMARY:")
    print(f"   Total cards: {len(all_cards)}")
    print(f"   Properly configured: {len(configured)}")
    print(f"   Missing or incomplete: {len(missing)}")
    
    if missing:
        print(f"\n⚠️  CARDS NEEDING ATTENTION:")
        print("-"*70)
        for card in missing:
            print(f"\n'{card['name']}': {{")
            
            # Parse the earn_rate to suggest categories
            earn_desc = card['earn_rate'].lower()
            
            if 'groceries' in earn_desc or 'grocery' in earn_desc:
                if '5' in earn_desc:
                    print(f"    'groceries': 5.0,")
                elif '3' in earn_desc:
                    print(f"    'groceries': 3.0,")
                else:
                    print(f"    'groceries': 1.5,")
            
            if 'dining' in earn_desc or 'restaurant' in earn_desc:
                if '5' in earn_desc:
                    print(f"    'dining': 5.0,")
                elif '3' in earn_desc:
                    print(f"    'dining': 3.0,")
                else:
                    print(f"    'dining': 1.5,")
            
            if 'gas' in earn_desc:
                if '5' in earn_desc:
                    print(f"    'gas': 5.0,")
                elif '3' in earn_desc:
                    print(f"    'gas': 3.0,")
                else:
                    print(f"    'gas': 1.5,")
            
            if 'travel' in earn_desc:
                if '5' in earn_desc:
                    print(f"    'travel': 5.0,")
                elif '3' in earn_desc:
                    print(f"    'travel': 3.0,")
                elif '2' in earn_desc:
                    print(f"    'travel': 2.0,")
                else:
                    print(f"    'travel': 1.5,")
            
            if 'entertainment' in earn_desc:
                print(f"    'entertainment': 5.0," if '5' in earn_desc else "    'entertainment': 1.5,")
            
            if 'transit' in earn_desc:
                print(f"    'transit': 5.0," if '5' in earn_desc else "    'transit': 2.0,")
            
            print(f"    'general': 1.0")
            print(f"}},")
            print(f"# From: {card['earn_rate']}")
    
    print("\n" + "="*70)
    print("\n💡 Copy the suggested code above and add to CARD_EARNING_RATES in main.py\n")
    
    db.close()

if __name__ == "__main__":
    check_missing()