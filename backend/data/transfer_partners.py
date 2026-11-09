"""Structured bank → loyalty-program point transfer data.

Single source of truth for transfer ratios shown on the Hotels page and used
by the flight Calculator/Gap pages to suggest moving transferable bank points
into an airline program instead of only earning that program directly.

CA entries are PointsPath's own (Amex Canada's published transfer partners).
US entries are adapted from the MIT-licensed borski/travel-hacking-toolkit
data/transfer-partners.json (sourced from each bank's own transfer-partner
pages) — standard ratios only, not time-limited promotional bonuses.

Shape: {from_program, to_program, ratio, country, kind, note}
  ratio: how many `to_program` points one `from_program` point becomes (e.g. 1.25 means 1:1.25)
  kind:  "hotel" | "airline"
"""

TRANSFER_PARTNERS = [
    # ── Canada — Amex Membership Rewards ─────────────────────────────────────
    {"from_program": "Amex Membership Rewards", "to_program": "Marriott Bonvoy", "ratio": 1.25, "country": "CA", "kind": "hotel", "note": "Amex Canada MR → Marriott"},
    {"from_program": "Amex Membership Rewards", "to_program": "Aeroplan", "ratio": 1.0, "country": "CA", "kind": "airline", "note": "Amex Canada MR → Aeroplan, 1:1"},

    # ── US — Amex Membership Rewards ──────────────────────────────────────────
    {"from_program": "Amex Membership Rewards", "to_program": "Aeroplan", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Amex Membership Rewards", "to_program": "Delta SkyMiles", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Amex Membership Rewards", "to_program": "Asia Miles", "ratio": 0.8, "country": "US", "kind": "airline", "note": "1000 MR = 800 Asia Miles"},
    {"from_program": "Amex Membership Rewards", "to_program": "Emirates Skywards", "ratio": 0.8, "country": "US", "kind": "airline", "note": "1000 MR = 800 Skywards"},
    {"from_program": "Amex Membership Rewards", "to_program": "ANA Mileage Club", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Amex Membership Rewards", "to_program": "Marriott Bonvoy", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},
    {"from_program": "Amex Membership Rewards", "to_program": "Hilton Honors", "ratio": 2.0, "country": "US", "kind": "hotel", "note": "1000 MR = 2000 Hilton"},
    {"from_program": "Amex Membership Rewards", "to_program": "Choice Privileges", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},

    # ── US — Chase Ultimate Rewards ──────────────────────────────────────────
    {"from_program": "Chase Ultimate Rewards", "to_program": "Aeroplan", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Chase Ultimate Rewards", "to_program": "MileagePlus", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Chase Ultimate Rewards", "to_program": "Singapore KrisFlyer", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Chase Ultimate Rewards", "to_program": "World of Hyatt", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "Best-value UR hotel transfer, 1:1"},
    {"from_program": "Chase Ultimate Rewards", "to_program": "Marriott Bonvoy", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},
    {"from_program": "Chase Ultimate Rewards", "to_program": "IHG One Rewards", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},

    # ── US — Capital One Miles ───────────────────────────────────────────────
    {"from_program": "Capital One Miles", "to_program": "Aeroplan", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1, instant"},
    {"from_program": "Capital One Miles", "to_program": "Air France/KLM Flying Blue", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1, instant"},
    {"from_program": "Capital One Miles", "to_program": "Emirates Skywards", "ratio": 0.75, "country": "US", "kind": "airline", "note": "4:3 ratio"},
    {"from_program": "Capital One Miles", "to_program": "Singapore KrisFlyer", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1, instant"},
    {"from_program": "Capital One Miles", "to_program": "Turkish Airlines Miles&Smiles", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1, instant"},
    {"from_program": "Capital One Miles", "to_program": "Choice Privileges", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1, 24 hours"},
    {"from_program": "Capital One Miles", "to_program": "Wyndham Rewards", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1, instant"},
    {"from_program": "Capital One Miles", "to_program": "Accor Live Limitless", "ratio": 0.5, "country": "US", "kind": "hotel", "note": "2:1 ratio"},

    # ── US — Citi ThankYou Points ────────────────────────────────────────────
    {"from_program": "Citi ThankYou Rewards", "to_program": "American Airlines AAdvantage", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1 on premium Citi cards (added 2024)"},
    {"from_program": "Citi ThankYou Rewards", "to_program": "Air France/KLM Flying Blue", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Citi ThankYou Rewards", "to_program": "Asia Miles", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Citi ThankYou Rewards", "to_program": "Turkish Airlines Miles&Smiles", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Citi ThankYou Rewards", "to_program": "Choice Privileges", "ratio": 2.0, "country": "US", "kind": "hotel", "note": "1:2 on premium Citi cards"},
    {"from_program": "Citi ThankYou Rewards", "to_program": "Wyndham Rewards", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},

    # ── US — Bilt Rewards ────────────────────────────────────────────────────
    {"from_program": "Bilt Rewards", "to_program": "Aeroplan", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Bilt Rewards", "to_program": "MileagePlus", "ratio": 1.0, "country": "US", "kind": "airline", "note": "1:1"},
    {"from_program": "Bilt Rewards", "to_program": "Hilton Honors", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},
    {"from_program": "Bilt Rewards", "to_program": "World of Hyatt", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},
    {"from_program": "Bilt Rewards", "to_program": "Marriott Bonvoy", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},
    {"from_program": "Bilt Rewards", "to_program": "IHG One Rewards", "ratio": 1.0, "country": "US", "kind": "hotel", "note": "1:1"},
    {"from_program": "Bilt Rewards", "to_program": "Accor Live Limitless", "ratio": 0.667, "country": "US", "kind": "hotel", "note": "3:2 ratio (1500 Bilt = 1000 Accor)"},
]


def partners_for_program(to_program: str, country: str | None = None):
    """All transfer sources that feed into a given destination program (e.g. 'Marriott Bonvoy')."""
    rows = [p for p in TRANSFER_PARTNERS if p["to_program"] == to_program]
    if country:
        rows = [p for p in rows if p["country"] == country.upper()]
    return rows


def partners_from_program(from_program: str, country: str | None = None):
    """All transfer destinations reachable from a given source program (e.g. 'Amex Membership Rewards')."""
    rows = [p for p in TRANSFER_PARTNERS if p["from_program"] == from_program]
    if country:
        rows = [p for p in rows if p["country"] == country.upper()]
    return rows
