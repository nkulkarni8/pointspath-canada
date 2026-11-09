"""Curated "legendary/excellent/good" award redemptions — editorial picks with
sourcing, distinct from the `/sweet-spots` endpoint's computed points-per-km
ranking over PointsPath's own route data. Only includes entries that directly
match a program PointsPath already covers (Aeroplan, MileagePlus, Hyatt, IHG) —
no entry is fabricated for a program without a sourced redemption.

Adapted from the MIT-licensed borski/travel-hacking-toolkit data/sweet-spots.json.
"""

SWEET_SPOTS_META = {"last_updated": "2026-03-21", "last_verified": "2026-07-20"}

CURATED_SWEET_SPOTS = [
    {
        "name": "Aeroplan Business to Europe",
        "tier": "good",
        "program": "Aeroplan",
        "kind": "flight",
        "cabin": "business",
        "cost_range": "60,000–70,000 miles one-way (US/Canada to Europe)",
        "why": "Aeroplan has the widest Star Alliance partner availability and can book "
               "Lufthansa First for 90-100K from the East Coast. Good for mixed-partner itineraries.",
        "transfer_partners": ["Amex Membership Rewards", "Chase Ultimate Rewards", "Capital One", "Bilt Rewards", "Citi ThankYou"],
        "caveats": ["Punitive per-person cancel fees", "Sometimes blocks partner availability when an Air Canada option exists"],
    },
    {
        "name": "United Business to Europe (no surcharges)",
        "tier": "good",
        "program": "MileagePlus",
        "kind": "flight",
        "cabin": "business",
        "cost_range": "80,000 miles one-way on United metal; 88,000 on partners",
        "why": "Higher mileage cost than most competitors, but zero fuel surcharges — a real advantage "
               "for Lufthansa/SWISS/Austrian metal, which carry $200-600 surcharges through other programs. "
               "Free changes and cancellations.",
        "transfer_partners": ["Chase Ultimate Rewards", "Bilt Rewards"],
        "caveats": ["Dynamic pricing — no published chart, treat as a typical rate, verify before transferring"],
    },
    {
        "name": "Hyatt Category 1-4 Properties",
        "tier": "excellent",
        "program": "World of Hyatt",
        "kind": "hotel",
        "cost_range": "5,000–15,000 points/night",
        "why": "Hyatt consistently delivers the best hotel points value — Category 1-4 properties "
               "routinely return 1.5-2.5¢/point, with no resort fees on award stays.",
        "transfer_partners": ["Chase Ultimate Rewards", "Bilt Rewards"],
        "caveats": ["Category changes are announced in advance — book before an increase"],
    },
    {
        "name": "Hyatt All-Inclusive (Ziva/Zilara)",
        "tier": "legendary",
        "program": "World of Hyatt",
        "kind": "hotel",
        "cost_range": "20,000–35,000 points/night",
        "why": "All-inclusive resorts where points cover everything — room, food, drinks, activities. "
               "Cash rates often run $500-800+/night, so at ~25K points that's 2.0-3.2¢/point.",
        "transfer_partners": ["Chase Ultimate Rewards", "Bilt Rewards"],
        "caveats": [],
    },
    {
        "name": "IHG PointBreaks / Low-Category",
        "tier": "good",
        "program": "IHG One Rewards",
        "kind": "hotel",
        "cost_range": "5,000–15,000 points/night (PointBreaks promos even lower)",
        "why": "IHG runs periodic PointBreaks promotions as low as 5,000 points/night, and even "
               "regular low-category hotels are cheap. Points are easy to earn and buy on sale.",
        "transfer_partners": ["Chase Ultimate Rewards", "Bilt Rewards"],
        "caveats": [],
    },
]


def curated_sweet_spots(program: str | None = None, kind: str | None = None):
    rows = CURATED_SWEET_SPOTS
    if program:
        rows = [r for r in rows if r["program"] == program]
    if kind:
        rows = [r for r in rows if r["kind"] == kind]
    return rows
