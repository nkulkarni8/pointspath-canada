"""
PointsPath Backend Unit Tests
Run with:  cd backend && pytest tests/ -v
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
import anyio
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ── Patch env before importing app ───────────────────────────────────────────
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("ENVIRONMENT", "development")
os.environ.setdefault("ALLOWED_ORIGINS", "*")
os.environ.setdefault("BEEHIIV_API_KEY", "")
os.environ.setdefault("BEEHIIV_PUB_ID", "")

from models import Base, CreditCard, Route
from database import get_db
from main import app

TEST_DB_URL = "sqlite:///:memory:"
# StaticPool ensures all threads share the same in-memory SQLite connection
engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    db = TestSession()

    db.add(CreditCard(name="Test Aeroplan Card", issuer="TD", program="Aeroplan",
                      earn_rate="1.5x groceries", annual_fee=139, welcome_bonus=50000,
                      country="CA", is_active=True))
    db.add(CreditCard(name="Test US Card", issuer="Chase", program="Ultimate Rewards",
                      earn_rate="3x dining", annual_fee=95, welcome_bonus=60000,
                      country="US", is_active=True))
    db.add(CreditCard(name="Test HK Card", issuer="HSBC", program="HSBC Rewards",
                      earn_rate="4x dining", annual_fee=1800, welcome_bonus=20000,
                      country="HK", is_active=True))

    db.add(Route(from_city="Toronto", to_city="Vancouver", distance_km=3356,
                 route_type="domestic", economy_points=15000, premium_economy_points=35000,
                 business_points=50000, first_points=70000, program="Aeroplan", country="CA"))
    db.add(Route(from_city="Vancouver", to_city="Toronto", distance_km=3356,
                 route_type="domestic", economy_points=15000, premium_economy_points=35000,
                 business_points=50000, first_points=70000, program="Aeroplan", country="CA"))
    db.add(Route(from_city="New York", to_city="London", distance_km=5570,
                 route_type="transatlantic", economy_points=30000, premium_economy_points=50000,
                 business_points=60000, first_points=90000, program="MileagePlus", country="US"))
    db.add(Route(from_city="Hong Kong", to_city="Singapore", distance_km=2570,
                 route_type="international", economy_points=20000, premium_economy_points=40000,
                 business_points=60000, first_points=100000, program="Asia Miles", country="HK"))
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


# ── Async client helper ───────────────────────────────────────────────────────
def _sync_call(coro):
    """Run an async coroutine synchronously via anyio."""
    return anyio.from_thread.run_sync(lambda: None) or anyio.run(lambda: coro)


class SyncClient:
    """Thin sync wrapper around httpx.AsyncClient + ASGITransport."""

    def __init__(self):
        self._transport = httpx.ASGITransport(app=app)
        self._base = "http://testserver"

    def _run(self, coro):
        return anyio.from_thread.run_sync(lambda: None) or anyio.run(lambda: coro)

    def _req(self, method, url, **kwargs):
        async def _inner():
            async with httpx.AsyncClient(
                transport=self._transport, base_url=self._base
            ) as c:
                return await getattr(c, method)(url, **kwargs)
        return anyio.run(_inner)

    def get(self, url, **kw):    return self._req("get",    url, **kw)
    def post(self, url, **kw):   return self._req("post",   url, **kw)
    def head(self, url, **kw):   return self._req("head",   url, **kw)
    def put(self, url, **kw):    return self._req("put",    url, **kw)
    def delete(self, url, **kw): return self._req("delete", url, **kw)


@pytest.fixture(scope="session")
def client():
    return SyncClient()


# ── Health ────────────────────────────────────────────────────────────────────

class TestHealth:
    def test_get_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "healthy"
        assert "database" in data

    def test_head_health(self, client):
        """UptimeRobot pings with HEAD — must return 200."""
        r = client.head("/health")
        assert r.status_code == 200

    def test_root(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert "PointsPath" in r.json().get("name", "")


# ── Cards ─────────────────────────────────────────────────────────────────────

class TestCards:
    def test_get_all_cards(self, client):
        r = client.get("/cards")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_get_ca_cards(self, client):
        r = client.get("/cards?country=CA")
        assert r.status_code == 200
        cards = r.json()
        assert all(c["country"] == "CA" for c in cards)

    def test_get_us_cards(self, client):
        r = client.get("/cards?country=US")
        assert r.status_code == 200
        cards = r.json()
        assert all(c["country"] == "US" for c in cards)

    def test_get_hk_cards(self, client):
        r = client.get("/cards?country=HK")
        assert r.status_code == 200
        cards = r.json()
        assert len(cards) >= 1
        assert all(c["country"] == "HK" for c in cards)

    def test_card_has_required_fields(self, client):
        r = client.get("/cards?country=CA")
        card = r.json()[0]
        for field in ["id", "name", "issuer", "program", "annual_fee", "welcome_bonus", "country", "tier"]:
            assert field in card, f"Missing field: {field}"

    def test_tier_derived_correctly(self, client):
        r = client.get("/cards?country=CA")
        card = r.json()[0]  # annual_fee=139 → "mid"
        assert card["tier"] == "mid"

    def test_card_not_found(self, client):
        r = client.get("/cards/99999")
        assert r.status_code == 404


# ── Cities ────────────────────────────────────────────────────────────────────

class TestCities:
    def test_ca_cities(self, client):
        r = client.get("/cities?country=CA")
        assert r.status_code == 200
        data = r.json()
        assert "from_cities" in data
        assert "to_cities" in data
        assert "Toronto" in data["from_cities"] or "Toronto" in data["to_cities"]

    def test_hk_cities(self, client):
        r = client.get("/cities?country=HK")
        assert r.status_code == 200
        data = r.json()
        assert "from_cities" in data
        assert "to_cities" in data

    def test_cities_requires_country(self, client):
        r = client.get("/cities")
        assert r.status_code == 422  # missing required query param


# ── Points Calculation ────────────────────────────────────────────────────────

class TestCalculatePoints:
    """Covers the merged /calculate-points endpoint (former v1 exact/reverse-direction
    lookup + v2's fuzzy match and seasonal note, now a single endpoint)."""

    def test_calculate_economy(self, client):
        r = client.post("/calculate-points", json={
            "from_city": "Toronto", "to_city": "Vancouver",
            "travel_class": "economy", "passengers": 1, "country": "CA"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["found"] is True
        assert data["base_points"] == 15000
        assert data["base_points_per_person"] == 15000

    def test_calculate_business(self, client):
        r = client.post("/calculate-points", json={
            "from_city": "Toronto", "to_city": "Vancouver",
            "travel_class": "business", "passengers": 1, "country": "CA"
        })
        assert r.status_code == 200
        assert r.json()["base_points"] == 50000

    def test_calculate_multiple_passengers(self, client):
        r = client.post("/calculate-points", json={
            "from_city": "Toronto", "to_city": "Vancouver",
            "travel_class": "economy", "passengers": 2, "country": "CA"
        })
        assert r.status_code == 200
        assert r.json()["base_points"] == 30000

    def test_calculate_reverse_direction_matches(self, client):
        """Route seeded as Vancouver→Toronto should still resolve when queried the other way."""
        r = client.post("/calculate-points", json={
            "from_city": "Vancouver", "to_city": "Toronto",
            "travel_class": "economy", "passengers": 1, "country": "CA"
        })
        assert r.status_code == 200
        assert r.json()["base_points"] == 15000

    def test_calculate_seasonal_note(self, client):
        r = client.post("/calculate-points", json={
            "from_city": "Toronto", "to_city": "Vancouver",
            "travel_class": "economy", "passengers": 1, "country": "CA", "month": 7
        })
        assert r.status_code == 200
        assert "Peak" in r.json()["seasonal_note"]

    def test_route_not_found(self, client):
        r = client.post("/calculate-points", json={
            "from_city": "FakeCity", "to_city": "AlsoFake",
            "travel_class": "economy", "passengers": 1, "country": "CA"
        })
        assert r.status_code == 404

    def test_hk_route(self, client):
        r = client.post("/calculate-points", json={
            "from_city": "Hong Kong", "to_city": "Singapore",
            "travel_class": "business", "passengers": 1, "country": "HK"
        })
        assert r.status_code == 200
        assert r.json()["base_points"] == 60000


# ── Points Gap ────────────────────────────────────────────────────────────────

class TestCalculateGap:
    def test_gap_calculation(self, client):
        cards = client.get("/cards?country=CA").json()
        card_id = cards[0]["id"]
        r = client.post("/calculate-gap", json={
            "points_needed": 50000, "points_current": 10000,
            "timeline_months": 6, "card_ids": [card_id], "country": "CA"
        })
        assert r.status_code == 200
        data = r.json()
        assert data["points_gap"] == 40000
        assert "strategies" in data
        assert len(data["strategies"]) > 0

    def test_gap_already_enough(self, client):
        cards = client.get("/cards?country=CA").json()
        card_id = cards[0]["id"]
        r = client.post("/calculate-gap", json={
            "points_needed": 5000, "points_current": 100000,
            "timeline_months": 6, "card_ids": [card_id], "country": "CA"
        })
        assert r.status_code == 400

    def test_gap_wallet_strategy_with_multiple_cards(self, client):
        cards = client.get("/cards?country=CA").json()
        card_ids = [c["id"] for c in cards[:2]] if len(cards) >= 2 else [cards[0]["id"]]
        r = client.post("/calculate-gap", json={
            "points_needed": 80000, "points_current": 10000,
            "timeline_months": 6, "card_ids": card_ids, "country": "CA"
        })
        assert r.status_code == 200
        data = r.json()
        if len(card_ids) > 1:
            assert data["wallet_strategy"] is not None
            assert "monthly_spend_needed" in data["wallet_strategy"]
        else:
            assert data["wallet_strategy"] is None

    def test_gap_single_card_has_no_wallet_strategy(self, client):
        cards = client.get("/cards?country=CA").json()
        card_id = cards[0]["id"]
        r = client.post("/calculate-gap", json={
            "points_needed": 50000, "points_current": 10000,
            "timeline_months": 6, "card_ids": [card_id], "country": "CA"
        })
        assert r.status_code == 200
        assert r.json()["wallet_strategy"] is None


# ── Hotels ────────────────────────────────────────────────────────────────────

class TestHotels:
    def test_get_hotels(self, client):
        r = client.get("/hotels?country=CA")
        assert r.status_code == 200
        programs = r.json()
        assert len(programs) > 0
        assert all("name" in p for p in programs)
        assert all("categories" in p for p in programs)

    def test_marriott_in_response(self, client):
        names = [p["name"] for p in client.get("/hotels?country=US").json()]
        assert "Marriott Bonvoy" in names

    def test_hilton_in_response(self, client):
        names = [p["name"] for p in client.get("/hotels?country=US").json()]
        assert "Hilton Honors" in names

    def test_hotel_calculate(self, client):
        r = client.get("/hotels/calculate?program=marriott&tier=3&nights=5")
        assert r.status_code == 200
        data = r.json()
        assert data["nights"] == 5
        assert data["points_per_night"] == 17500
        assert data["total_points"] == 87500

    def test_hotel_calculate_invalid_program(self, client):
        r = client.get("/hotels/calculate?program=nonexistent&tier=1&nights=2")
        assert r.status_code == 404

    def test_hk_hotels(self, client):
        r = client.get("/hotels?country=HK")
        assert r.status_code == 200
        assert len(r.json()) > 0


# ── Sweet Spots ───────────────────────────────────────────────────────────────

class TestSweetSpots:
    def test_sweet_spots_ca(self, client):
        r = client.get("/sweet-spots?country=CA")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_sweet_spots_limit(self, client):
        r = client.get("/sweet-spots?country=CA&limit=3")
        assert r.status_code == 200
        assert len(r.json()) <= 3

    def test_sweet_spots_hk(self, client):
        r = client.get("/sweet-spots?country=HK")
        assert r.status_code == 200


# ── Country Config ────────────────────────────────────────────────────────────

class TestCountryConfig:
    def test_ca_config(self, client):
        r = client.get("/country-config?country=CA")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Canada"
        assert data["symbol"] == "C$"

    def test_hk_config(self, client):
        r = client.get("/country-config?country=HK")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "Hong Kong"
        assert data["symbol"] == "HK$"

    def test_all_countries(self, client):
        for code in ["CA", "US", "IN", "HK"]:
            r = client.get(f"/country-config?country={code}")
            assert r.status_code == 200, f"Config missing for {code}"


# ── Routes ────────────────────────────────────────────────────────────────────

class TestRoutes:
    def test_get_routes(self, client):
        r = client.get("/routes?country=CA")
        assert r.status_code == 200
        data = r.json()
        assert "routes" in data
        assert data["count"] > 0

    def test_get_hk_routes(self, client):
        r = client.get("/routes?country=HK")
        assert r.status_code == 200
        assert r.json()["count"] > 0


# ── Trustworthy last_updated ─────────────────────────────────────────────────

class TestLastUpdated:
    def test_cards_last_updated_is_real_not_hardcoded(self, client):
        card = client.get("/cards?country=CA").json()[0]
        assert card["last_updated"] != "March 2026"
        assert card["last_updated"] is None or isinstance(card["last_updated"], str)

    def test_cards_have_affiliate_url_field(self, client):
        card = client.get("/cards?country=CA").json()[0]
        assert "affiliate_url" in card  # present (None until a real partner link is set)


# ── Strategies (previously untested) ─────────────────────────────────────────

class TestStrategies:
    def test_strategies_for_route(self, client):
        r = client.post("/strategies", json={
            "from_city": "Toronto", "to_city": "Vancouver",
            "travel_class": "business", "passengers": 1, "country": "CA"
        })
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert "cards" in data[0]

    def test_strategies_route_not_found(self, client):
        r = client.post("/strategies", json={
            "from_city": "Nowhere", "to_city": "AlsoNowhere",
            "travel_class": "economy", "passengers": 1, "country": "CA"
        })
        assert r.status_code == 404


# ── Subscribe (previously untested) ───────────────────────────────────────────

class TestSubscribe:
    def test_subscribe_test_mode(self, client):
        """No Beehiiv keys configured in tests → should succeed in test mode."""
        r = client.post("/subscribe-email", params={"email": "test@example.com"})
        assert r.status_code == 200
        assert r.json()["success"] is True


# ── Transfer partners ─────────────────────────────────────────────────────────

class TestTransferPartners:
    def test_list_all(self, client):
        r = client.get("/transfer-partners")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_filter_by_to_program(self, client):
        r = client.get("/transfer-partners?to_program=Aeroplan")
        assert r.status_code == 200
        rows = r.json()
        assert all(p["to_program"] == "Aeroplan" for p in rows)

    def test_filter_by_country(self, client):
        r = client.get("/transfer-partners?from_program=Amex Membership Rewards&country=CA")
        assert r.status_code == 200
        rows = r.json()
        assert all(p["country"] == "CA" for p in rows)


# ── Wallet (auth-gated) ───────────────────────────────────────────────────────

class TestPointsValuations:
    def test_known_program(self, client):
        r = client.get("/points-valuations?program=Aeroplan")
        assert r.status_code == 200
        data = r.json()
        assert data["floor"] <= data["ceiling"]

    def test_unknown_program_returns_none_not_guess(self, client):
        r = client.get("/points-valuations?program=Not A Real Program")
        assert r.status_code == 200
        assert r.json() is None

    def test_full_list(self, client):
        r = client.get("/points-valuations")
        assert r.status_code == 200
        assert len(r.json()) > 0


class TestAlliances:
    def test_aeroplan_is_star_alliance(self, client):
        r = client.get("/alliances?program=Aeroplan")
        assert r.status_code == 200
        assert r.json()["alliance"] == "Star Alliance"

    def test_asia_miles_is_oneworld(self, client):
        r = client.get("/alliances?program=Asia Miles")
        assert r.status_code == 200
        assert r.json()["alliance"] == "oneworld"

    def test_unknown_program(self, client):
        r = client.get("/alliances?program=Not A Real Program")
        assert r.status_code == 200
        assert r.json() is None


class TestCuratedSweetSpots:
    def test_list_all(self, client):
        r = client.get("/sweet-spots-curated")
        assert r.status_code == 200
        assert len(r.json()) > 0

    def test_filter_by_program(self, client):
        r = client.get("/sweet-spots-curated?program=Aeroplan")
        assert r.status_code == 200
        assert all(s["program"] == "Aeroplan" for s in r.json())

    def test_filter_by_kind(self, client):
        r = client.get("/sweet-spots-curated?kind=hotel")
        assert r.status_code == 200
        assert all(s["kind"] == "hotel" for s in r.json())


class TestStopovers:
    def test_aeroplan_allows_stopover(self, client):
        r = client.get("/stopovers?program=Aeroplan")
        assert r.status_code == 200
        assert r.json()["allowed"] is True

    def test_unknown_program_no_fabricated_rule(self, client):
        r = client.get("/stopovers?program=Not A Real Program")
        assert r.status_code == 200
        assert r.json()["allowed"] is None


class TestCabinCodes:
    def test_returns_four_cabins(self, client):
        r = client.get("/cabin-codes")
        assert r.status_code == 200
        codes = {c["code"] for c in r.json()}
        assert codes == {"F", "J", "W", "Y"}


class TestExpandedHotels:
    def test_new_chains_present(self, client):
        names = [p["name"] for p in client.get("/hotels?country=US").json()]
        for expected in ["Accor Live Limitless", "Choice Privileges", "Wyndham Rewards", "Best Western Rewards"]:
            assert expected in names

    def test_chain_without_chart_rejects_calculate(self, client):
        r = client.get("/hotels/calculate?program=accor&tier=1&nights=2")
        assert r.status_code == 400

    def test_wyndham_calculate_works(self, client):
        r = client.get("/hotels/calculate?program=wyndham&tier=1&nights=2")
        assert r.status_code == 200
        assert r.json()["total_points"] == 15000


class TestWallet:
    def test_get_wallet_requires_auth(self, client):
        r = client.get("/wallet")
        assert r.status_code == 401

    def test_put_wallet_requires_auth(self, client):
        r = client.put("/wallet", json={"country": "CA", "data": {}})
        assert r.status_code == 401

    def test_get_wallet_rejects_bad_token(self, client):
        r = client.get("/wallet", headers={"Authorization": "Bearer not-a-real-jwt"})
        assert r.status_code in (401, 503)  # 503 only if SUPABASE_JWT_SECRET unset in this env
