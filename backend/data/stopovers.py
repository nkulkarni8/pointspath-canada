"""Per-program stopover rules for award redemptions — a stopover turns one award
ticket into multi-city travel for the same mileage price. Only programs with a
hand-verified source are included.

Adapted from the MIT-licensed borski/travel-hacking-toolkit data/stopovers.json.
"""

STOPOVERS_META = {"last_updated": "2026-04-29"}

STOPOVER_RULES = {
    "Aeroplan": {
        "allowed": True,
        "max_stopovers_one_way": 1,
        "max_stopovers_round_trip": 2,
        "max_duration_days": 45,
        "surcharge_points": 5000,
        "restrictions": "Not permitted within Canada or within the US — must be on an international "
                         "itinerary. Layovers under 24 hours don't count as a stopover.",
        "best_uses": ["Adding a European city before your final destination", "Pacific routes via an Asian hub"],
    },
}


def get_stopover_rule(program_name: str):
    if not program_name:
        return None
    return STOPOVER_RULES.get(program_name.strip())
