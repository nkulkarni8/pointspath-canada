import { FALLBACK_HOTELS } from "../data/fallbackHotels";

export const API = import.meta.env.VITE_API_URL || "https://pointspath-canada-api.onrender.com";

const EMPTY_CITIES = { from_cities: [], to_cities: [] };

export function emptyCountryData(code) {
  return {
    cards: [],
    cities: EMPTY_CITIES,
    spots: [],
    hotels: FALLBACK_HOTELS.filter(h => h.countries.includes(code)),
  };
}

/**
 * Fetches every dataset a country tab needs in one pass. Individual endpoints
 * are allowed to fail independently — a cold backend should still leave the
 * rest of the tab usable rather than blanking the whole page.
 */
export async function fetchCountryData(code) {
  const [cardsR, citiesR, spotsR, hotelsR] = await Promise.all([
    fetch(`${API}/cards?country=${code}`).catch(() => null),
    fetch(`${API}/cities?country=${code}`).catch(() => null),
    fetch(`${API}/sweet-spots?country=${code}&limit=8`).catch(() => null),
    fetch(`${API}/hotels?country=${code}`).catch(() => null),
  ]);

  const cardsJson = cardsR?.ok ? await cardsR.json() : [];
  const cards = Array.isArray(cardsJson) ? cardsJson : (cardsJson.cards || []);
  const cities = citiesR?.ok ? await citiesR.json() : EMPTY_CITIES;
  const spots = spotsR?.ok ? await spotsR.json() : [];
  const hotelsRaw = hotelsR?.ok ? await hotelsR.json() : [];
  const hotels = Array.isArray(hotelsRaw) && hotelsRaw.length > 0
    ? hotelsRaw
    : FALLBACK_HOTELS.filter(h => h.countries.includes(code));

  return { cards, cities, spots, hotels };
}

/** POST /calculate-points — single merged endpoint (replaces the old v1/v2 pair). */
export async function calculatePoints(body) {
  const r = await fetch(`${API}/calculate-points`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Route not found. Please select valid cities from the dropdowns.");
  return data;
}

/** POST /calculate-gap — optionally includes a combined wallet_strategy when 2+ card_ids are sent. */
export async function calculateGap(body) {
  const r = await fetch(`${API}/calculate-gap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("calculate-gap failed");
  return r.json();
}

/** GET /wallet — requires a Supabase access token. Returns null on any failure. */
export async function getWallet(accessToken) {
  try {
    const r = await fetch(`${API}/wallet`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** PUT /wallet — fire-and-forget save, requires a Supabase access token. Swallows all errors. */
export async function putWallet(accessToken, country, data) {
  try {
    await fetch(`${API}/wallet`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ country, data }),
    });
  } catch {
    /* offline or backend down — journey stays in localStorage */
  }
}

/**
 * Reference-data helpers. Every one of these swallows failures and returns
 * null / [] — supplementary data must never break the page that shows it.
 */
async function getJson(path, params = {}) {
  try {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString();
    const r = await fetch(`${API}${path}${qs ? `?${qs}` : ""}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** GET /points-valuations?program= -> {name, floor, ceiling, note?} or null (no sourced match). */
export async function getPointsValuation(program) {
  if (!program) return null;
  const d = await getJson("/points-valuations", { program });
  return d && typeof d.floor === "number" && typeof d.ceiling === "number" ? d : null;
}

/** GET /alliances?program= -> {alliance, airline, note?} or null. */
export async function getAlliance(program) {
  if (!program) return null;
  const d = await getJson("/alliances", { program });
  return d && d.alliance ? d : null;
}

/** GET /sweet-spots-curated -> array of editorial picks ([] on failure). */
export async function getCuratedSweetSpots({ program, kind } = {}) {
  const d = await getJson("/sweet-spots-curated", { program, kind });
  return Array.isArray(d) ? d : [];
}

/** GET /stopovers?program= -> policy object only when stopovers are allowed, else null. */
export async function getStopovers(program) {
  if (!program) return null;
  const d = await getJson("/stopovers", { program });
  return d && d.allowed === true ? d : null;
}

/** Fire-and-forget GA4 event — no-ops when analytics isn't configured. */
export function track(event, params = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
}
