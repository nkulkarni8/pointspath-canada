import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import CardsPage from "./CardsPage";
import HotelsPage from "./HotelsPage";
import SpotsPage from "./SpotsPage";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";

const json = (body) => Promise.resolve({ ok: true, json: async () => body });

const CARDS = [{ id: 1, name: "Test Card", issuer: "Bank", program: "Aeroplan", tier: "mid", welcome_bonus: 50000, annual_fee: 100, earn_rates: {} }];
const HOTELS = [
  { id: "marriott", name: "Marriott Bonvoy", logo: "M", description: "d", countries: ["CA"], points_value_cpp: { floor: 0.7, ceiling: 0.9 },
    categories: [{ tier: "Cat 1", label: "l", example: "e", points_per_night: 10000 }] },
  { id: "accor", name: "Accor ALL", logo: "A", description: "no chart", countries: ["CA"], categories: [], transfer_programs: ["Amex"] },
];

function setup({ valuation = null, alliance = null, picks = [] } = {}) {
  global.fetch = vi.fn((url) => {
    if (url.includes("/points-valuations")) return json(valuation);
    if (url.includes("/alliances")) return json(alliance);
    if (url.includes("/sweet-spots-curated")) return json(picks);
    if (url.includes("/cards")) return json(CARDS);
    if (url.includes("/hotels")) return json(HOTELS);
    if (url.includes("/cities")) return json({ from_cities: [], to_cities: [] });
    return json([]);
  });
}

const wrap = (ui) => render(
  <MemoryRouter initialEntries={["/x?country=CA"]}><AuthProvider><AppProvider>{ui}</AppProvider></AuthProvider></MemoryRouter>
);

describe("reference data on pages", () => {
  const orig = global.fetch;
  afterEach(() => { global.fetch = orig; });

  it("CardsPage shows a valuation chip when the API returns data", async () => {
    setup({ valuation: { name: "Aeroplan", floor: 1.5, ceiling: 2.1 } });
    wrap(<CardsPage />);
    expect(await screen.findByTestId("valuation-chip")).toHaveTextContent("≈1.5–2.1¢/pt");
  });

  it("CardsPage renders no chip when the API returns null", async () => {
    setup({ valuation: null });
    wrap(<CardsPage />);
    await screen.findByText("Test Card");
    await waitFor(() => expect(global.fetch.mock.calls.some(c => c[0].includes("/points-valuations"))).toBe(true));
    expect(screen.queryByTestId("valuation-chip")).toBeNull();
  });

  it("HotelsPage tolerates categories: [] and shows value chips only when present", async () => {
    setup();
    wrap(<HotelsPage />);
    expect(await screen.findByText("Accor ALL")).toBeInTheDocument();
    expect(screen.getByText("No published per-night chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("valuation-chip")).toHaveLength(1);
    expect(screen.getByTestId("valuation-chip")).toHaveTextContent("≈0.7–0.9¢/pt");
  });

  it("SpotsPage labels Editor's Picks and shows alliance badge only on a match", async () => {
    const picks = [{ name: "Aeroplan to Japan", tier: "legendary", program: "Aeroplan", kind: "flight", cost_range: "75k", why: "Great", transfer_partners: ["Amex"], caveats: ["Fees"] }];
    setup({ picks, alliance: { alliance: "Star Alliance", airline: "Air Canada" } });
    const { unmount } = wrap(<SpotsPage />);
    expect(await screen.findByText("Editor's Picks")).toBeInTheDocument();
    expect(screen.getByText(/not computed/i)).toBeInTheDocument();
    expect(await screen.findByTestId("alliance-badge")).toHaveTextContent("Star Alliance · Air Canada");
    unmount();

    setup({ picks, alliance: null });
    wrap(<SpotsPage />);
    await screen.findByText("Aeroplan to Japan");
    expect(screen.queryByTestId("alliance-badge")).toBeNull();
  });
});
