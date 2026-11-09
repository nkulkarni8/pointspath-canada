"""Airline alliance membership — which alliance a loyalty program's airline belongs
to, so Calculator/Spots results can explain *why* a program reaches a given airline.

Adapted from the MIT-licensed borski/travel-hacking-toolkit data/alliances.json.
"""

ALLIANCES_META = {"last_updated": "2026-03-31"}

# loyalty program name (as PointsPath stores it in routes.program / COUNTRY_CONFIG) -> alliance
PROGRAM_TO_ALLIANCE = {
    "Aeroplan": {"alliance": "Star Alliance", "airline": "Air Canada"},
    "MileagePlus": {"alliance": "Star Alliance", "airline": "United Airlines"},
    "Asia Miles": {"alliance": "oneworld", "airline": "Cathay Pacific"},
    "Air India Flying Returns": {"alliance": "Star Alliance", "airline": "Air India"},
    "Air India One": {"alliance": "Star Alliance", "airline": "Air India"},
    "AAdvantage": {"alliance": "oneworld", "airline": "American Airlines"},
    "Delta SkyMiles": {"alliance": "SkyTeam", "airline": "Delta Air Lines"},
    "Flying Blue": {"alliance": "SkyTeam", "airline": "Air France/KLM"},
    "Avios": {"alliance": "oneworld", "airline": "British Airways / Iberia / Qatar"},
    "Emirates Skywards": {"alliance": "none", "airline": "Emirates", "note": "Not in any alliance; extensive bilateral partnerships."},
}

ALLIANCE_MEMBERS = {
    "Star Alliance": ["Air Canada", "United Airlines", "Lufthansa", "ANA", "Singapore Airlines",
                       "Air India", "Turkish Airlines", "Air New Zealand", "Austrian Airlines", "SWISS"],
    "oneworld": ["American Airlines", "British Airways", "Cathay Pacific", "Qantas",
                 "Japan Airlines", "Qatar Airways", "Alaska Airlines", "Iberia"],
    "SkyTeam": ["Delta Air Lines", "Air France", "KLM", "Korean Air", "Virgin Atlantic", "Aeromexico"],
}


def get_alliance(program_name: str):
    """Look up alliance context for a PointsPath program name. None if not a known match."""
    if not program_name:
        return None
    return PROGRAM_TO_ALLIANCE.get(program_name.strip())
