"""
Detailed earning rates for each credit card by spending category
This allows accurate calculation of "how to spend" with each card
"""

# Earning multipliers by card and category
CARD_EARNING_RATES = {
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
    }
}

# Average Canadian monthly spending by category (Statistics Canada estimates)
TYPICAL_MONTHLY_SPENDING = {
    "groceries": 800,
    "dining": 400,
    "gas": 200,
    "travel": 150,
    "entertainment": 150,
    "transit": 100,
    "general": 1200  # Everything else
}

def calculate_optimal_card_usage(cards_list, points_needed, months):
    """
    Calculate optimal spending strategy across multiple cards
    
    Args:
        cards_list: List of card names user owns
        points_needed: Total points to earn
        months: Timeline in months
    
    Returns:
        Detailed spending breakdown by card and category
    """
    monthly_points_needed = points_needed / months
    
    strategies = []
    
    for card_name in cards_list:
        if card_name not in CARD_EARNING_RATES:
            continue
            
        card_rates = CARD_EARNING_RATES[card_name]
        
        # Find best categories for this card
        best_categories = sorted(
            card_rates.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:3]  # Top 3 categories
        
        # Calculate spending needed for this card
        category_spending = {}
        total_points_from_card = 0
        total_spend_on_card = 0
        
        for category, multiplier in best_categories:
            if multiplier > 1.0:  # Only suggest if bonus category
                typical_spend = TYPICAL_MONTHLY_SPENDING.get(category, 0)
                points_from_category = typical_spend * multiplier
                
                category_spending[category] = {
                    "monthly_spend": typical_spend,
                    "multiplier": multiplier,
                    "points_earned": points_from_category
                }
                
                total_points_from_card += points_from_category
                total_spend_on_card += typical_spend
        
        # Calculate average earn rate
        avg_earn_rate = (
            total_points_from_card / total_spend_on_card 
            if total_spend_on_card > 0 
            else 1.0
        )
        
        strategies.append({
            "card": card_name,
            "categories": category_spending,
            "monthly_total_spend": total_spend_on_card,
            "monthly_points_earned": total_points_from_card,
            "average_multiplier": round(avg_earn_rate, 2),
            "months_to_goal": (
                months 
                if total_points_from_card > 0 
                else 999
            )
        })
    
    # Sort by best earning potential
    strategies.sort(key=lambda x: x["monthly_points_earned"], reverse=True)
    
    return strategies

def get_card_earning_breakdown(card_name):
    """Get detailed earning breakdown for a specific card"""
    if card_name not in CARD_EARNING_RATES:
        return None
    
    rates = CARD_EARNING_RATES[card_name]
    
    breakdown = []
    for category, multiplier in rates.items():
        typical_spend = TYPICAL_MONTHLY_SPENDING.get(category, 0)
        monthly_points = typical_spend * multiplier
        
        breakdown.append({
            "category": category,
            "multiplier": f"{multiplier}x",
            "typical_monthly_spend": typical_spend,
            "monthly_points_potential": monthly_points,
            "annual_points_potential": monthly_points * 12
        })
    
    # Sort by points potential
    breakdown.sort(key=lambda x: x["monthly_points_potential"], reverse=True)
    
    return breakdown