import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CalculatorPage from "./CalculatorPage";
import { AppProvider } from "../context/AppContext";
import { AuthProvider } from "../context/AuthContext";

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

const CITIES = { from_cities: ["Toronto"], to_cities: ["Tokyo"], routes_map: { Toronto: ["Tokyo"] } };

function mockFetch() {
  global.fetch = vi.fn((url, opts) => {
    if (opts?.method === "POST" && url.includes("/calculate-points")) {
      return Promise.resolve(jsonResponse({
        found: true, route: "Toronto → Tokyo", program: "Aeroplan", cabin: "economy",
        base_points: 75000, base_points_per_person: 75000, median_points: 85000,
        seasonal_note: null, route_note: null, route_type: "transpacific",
        passengers: 1, is_dynamic: false, last_updated: "October 2026",
      }));
    }
    if (url.includes("/cities")) return Promise.resolve(jsonResponse(CITIES));
    if (url.includes("/cards")) return Promise.resolve(jsonResponse([]));
    if (url.includes("/sweet-spots")) return Promise.resolve(jsonResponse([]));
    if (url.includes("/hotels")) return Promise.resolve(jsonResponse([]));
    return Promise.resolve(jsonResponse({}));
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/calculator?country=CA"]}>
      <AuthProvider>
        <AppProvider>
          <CalculatorPage />
        </AppProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("CalculatorPage", () => {
  const origFetch = global.fetch;

  beforeEach(() => mockFetch());
  afterEach(() => { global.fetch = origFetch; });

  it("searches for points and renders the result", async () => {
    renderPage();

    const fromSelect = await waitFor(() => screen.getByLabelText("From"));
    const toSelect = screen.getByLabelText(/^To/);

    fireEvent.change(fromSelect, { target: { value: "Toronto" } });
    fireEvent.change(toSelect, { target: { value: "Tokyo" } });

    const searchButton = screen.getByRole("button", { name: /search points/i });
    fireEvent.click(searchButton);

    await waitFor(() => expect(screen.getByText("Toronto → Tokyo")).toBeInTheDocument());
    expect(screen.getByText("75,000")).toBeInTheDocument();
  });
});
