import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchCountryData } from "./api";
import { FALLBACK_HOTELS } from "../data/fallbackHotels";

function jsonResponse(body, ok = true) {
  return { ok, json: async () => body };
}

describe("fetchCountryData", () => {
  const origFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    global.fetch = origFetch;
  });

  it("falls back to FALLBACK_HOTELS when the hotels endpoint fails", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/hotels")) return Promise.resolve(jsonResponse([], false));
      if (url.includes("/cards")) return Promise.resolve(jsonResponse([{ id: 1, name: "Card" }]));
      if (url.includes("/cities")) return Promise.resolve(jsonResponse({ from_cities: [], to_cities: [] }));
      if (url.includes("/sweet-spots")) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse({}));
    });

    const result = await fetchCountryData("CA");
    expect(result.hotels.length).toBeGreaterThan(0);
    expect(result.hotels).toEqual(FALLBACK_HOTELS.filter(h => h.countries.includes("CA")));
  });

  it("handles a non-ok cards response gracefully (empty cards array, no throw)", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/cards")) return Promise.resolve(jsonResponse(null, false));
      if (url.includes("/hotels")) return Promise.resolve(jsonResponse([{ id: "h1", countries: ["CA"] }]));
      if (url.includes("/cities")) return Promise.resolve(jsonResponse({ from_cities: [], to_cities: [] }));
      if (url.includes("/sweet-spots")) return Promise.resolve(jsonResponse([]));
      return Promise.resolve(jsonResponse({}));
    });

    const result = await fetchCountryData("CA");
    expect(result.cards).toEqual([]);
  });

  it("tolerates a network failure on any single endpoint", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/cards")) return Promise.reject(new Error("network down"));
      return Promise.resolve(jsonResponse([]));
    });

    const result = await fetchCountryData("US");
    expect(result.cards).toEqual([]);
  });
});
