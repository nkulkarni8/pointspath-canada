"""Country display configuration and award-season definitions."""

COUNTRY_CONFIG = {
    "CA": {"name": "Canada", "currency": "CAD", "symbol": "C$", "flag": "🇨🇦", "program": "Aeroplan"},
    "US": {"name": "United States", "currency": "USD", "symbol": "$", "flag": "🇺🇸", "program": "Chase UR / MileagePlus"},
    "IN": {"name": "India", "currency": "INR", "symbol": "₹", "flag": "🇮🇳", "program": "Air India Flying Returns"},
    "HK": {"name": "Hong Kong", "currency": "HKD", "symbol": "HK$", "flag": "🇭🇰", "program": "Cathay Asia Miles"},
}

SUPPORTED_COUNTRIES = list(COUNTRY_CONFIG.keys())

PEAK_MONTHS = {6, 7, 8, 12}
SHOULDER_MONTHS = {4, 5}
