"""Points/miles valuations (cents-per-point), sourced from published monthly
valuation guides. Floor = conservative (OMAAT/VFTW), ceiling = optimistic (TPG).
Default to floor for "is this a good redemption" decisions.

Adapted from the MIT-licensed borski/travel-hacking-toolkit data/points-valuations.json
(sources: The Points Guy, Upgraded Points, One Mile at a Time, View From The Wing).
"""

VALUATIONS_META = {
    "sources": {
        "tpg": "The Points Guy",
        "up": "Upgraded Points",
        "omaat": "One Mile at a Time",
        "vftw": "View From The Wing",
    },
    "last_updated": "2026-03-21",
    "methodology": "Floor = conservative (min across sources), ceiling = optimistic (max). "
                    "Default to floor for 'should I use points here' decisions.",
}

CREDIT_CARD_POINTS = {
    "amex_membership_rewards": {"name": "American Express Membership Rewards", "floor": 1.7, "ceiling": 2.2},
    "chase_ultimate_rewards":  {"name": "Chase Ultimate Rewards",               "floor": 1.7, "ceiling": 2.05},
    "citi_thankyou":           {"name": "Citi ThankYou Rewards",                "floor": 1.6, "ceiling": 1.9},
    "capital_one":             {"name": "Capital One Miles",                    "floor": 1.6, "ceiling": 1.85},
    "bilt_rewards":            {"name": "Bilt Rewards",                        "floor": 1.7, "ceiling": 2.2},
    "wells_fargo":             {"name": "Wells Fargo Rewards",                 "floor": 1.5, "ceiling": 1.65},
}

AIRLINE_MILES = {
    "aeroplan":        {"name": "Air Canada Aeroplan",        "floor": 1.4, "ceiling": 1.5},
    "united":          {"name": "United MileagePlus",         "floor": 1.1, "ceiling": 1.5, "note": "Dynamic pricing — wide spread between sources."},
    "cathay":          {"name": "Cathay Asia Miles",           "floor": 1.2, "ceiling": 1.3},
    "delta":           {"name": "Delta SkyMiles",              "floor": 1.0, "ceiling": 1.25, "note": "Dynamic pricing makes SkyMiles unpredictable."},
    "american":        {"name": "American Airlines AAdvantage","floor": 1.3, "ceiling": 1.7},
    "flying_blue":      {"name": "Air France/KLM Flying Blue",  "floor": 1.2, "ceiling": 1.3},
    "avios":            {"name": "Avios (British Airways / Iberia / Qatar)", "floor": 1.1, "ceiling": 1.4},
    "ana":              {"name": "ANA Mileage Club",            "floor": 1.4, "ceiling": 1.5},
    "singapore":        {"name": "Singapore KrisFlyer",         "floor": 1.3, "ceiling": 1.4},
    "turkish":          {"name": "Turkish Airlines Miles&Smiles","floor": 1.1, "ceiling": 1.3},
    "emirates":         {"name": "Emirates Skywards",           "floor": 1.1, "ceiling": 1.2},
}

HOTEL_POINTS = {
    "marriott": {"name": "Marriott Bonvoy",  "floor": 0.6, "ceiling": 0.7},
    "hilton":   {"name": "Hilton Honors",    "floor": 0.4, "ceiling": 0.5, "note": "Low cpp — often better to pay cash except for aspirational stays."},
    "hyatt":    {"name": "World of Hyatt",   "floor": 1.4, "ceiling": 1.7, "note": "Consistently the most valuable hotel currency."},
    "ihg":      {"name": "IHG One Rewards",  "floor": 0.5, "ceiling": 0.5},
    "accor":    {"name": "Accor Live Limitless", "floor": 2.0, "ceiling": 2.2},
    "choice":   {"name": "Choice Privileges", "floor": 0.6, "ceiling": 0.6},
    "wyndham":  {"name": "Wyndham Rewards",  "floor": 0.7, "ceiling": 1.1},
    "best_western": {"name": "Best Western Rewards", "floor": 0.5, "ceiling": 0.6},
}

ALL_VALUATIONS = {**CREDIT_CARD_POINTS, **AIRLINE_MILES, **HOTEL_POINTS}

# Aliases from PointsPath's own program strings (credit_cards.program, routes.program,
# hotel program ids) to the canonical keys above — never guess, only exact known names.
_ALIASES = {
    "aeroplan": "aeroplan", "mileageplus": "united", "air india flying returns": None,
    "asia miles": "cathay", "membership rewards": "amex_membership_rewards",
    "ultimate rewards": "chase_ultimate_rewards", "thankyou points": "citi_thankyou",
    "miles": "capital_one", "marriott bonvoy": "marriott", "hilton honors": "hilton",
    "world of hyatt": "hyatt", "ihg one rewards": "ihg",
    "accor live limitless": "accor", "choice privileges": "choice",
    "wyndham rewards": "wyndham", "best western rewards": "best_western",
}


def get_valuation(program_name: str):
    """Look up a floor/ceiling cpp valuation by PointsPath's own program name string.
    Returns None rather than guessing when there's no sourced match."""
    if not program_name:
        return None
    key = _ALIASES.get(program_name.strip().lower())
    if not key:
        return None
    return ALL_VALUATIONS.get(key)
