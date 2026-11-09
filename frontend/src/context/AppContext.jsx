import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { COUNTRIES } from "../constants";
import { useAuth } from "./AuthContext";
import { emptyCountryData, fetchCountryData, getWallet, putWallet, track } from "../lib/api";
import { T } from "../theme";

const AppContext = createContext(null);

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
// v3 cache key — older keys held domestic-only city lists and are ignored.
const cacheKey = (code) => `pp_cache_v3_${code}`;

const isValidCountry = (code) => COUNTRIES.some(c => c.code === code);

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : raw;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const urlCountry = (searchParams.get("country") || "").toUpperCase();

  const [dark, setDark] = useState(() => readStored("pp_theme", "dark") !== "light");
  const [country, setCountry] = useState(() => {
    if (isValidCountry(urlCountry)) return urlCountry;
    const saved = readStored("pp_country", "CA");
    return isValidCountry(saved) ? saved : "CA";
  });

  const [cache, setCache] = useState({});
  const [loadingVis, setLoadingVis] = useState({});
  const loadedRef = useRef(new Set());

  const [journey, setJourney] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pp_journey") || "null"); } catch { return null; }
  });
  const [tripResult, setTripResult] = useState(null);

  const { user, session } = useAuth();
  const prevUserRef = useRef(null);

  const t = T[dark ? "dark" : "light"];
  const cc = useMemo(() => COUNTRIES.find(c => c.code === country), [country]);

  // ── Persistence ────────────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem("pp_theme", dark ? "dark" : "light"); } catch { /* quota */ }
    // Keeps native widgets (date pickers, scrollbars) in step with the toggle.
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    try {
      if (journey) localStorage.setItem("pp_journey", JSON.stringify(journey));
      else localStorage.removeItem("pp_journey");
    } catch { /* quota */ }
  }, [journey]);

  // ── Server-side wallet (signed-in users only) ───────────────────────────────
  // On sign-in, pull the saved journey from the server and prefer it over
  // whatever is in local state (the server holds "your saved journey").
  useEffect(() => {
    const wasSignedOut = !prevUserRef.current;
    prevUserRef.current = user;
    if (!user || !session?.access_token || !wasSignedOut) return;
    (async () => {
      const wallet = await getWallet(session.access_token);
      if (wallet && wallet.data && Object.keys(wallet.data).length > 0) {
        setJourney(wallet.data);
      }
    })();
  }, [user, session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire-and-forget save whenever the journey changes, for signed-in users.
  // Must never block the UI or break offline/PWA use — all errors are swallowed.
  useEffect(() => {
    if (!user || !session?.access_token) return;
    putWallet(session.access_token, country, journey);
  }, [journey, user, session, country]);

  // ── Keep the country reflected in the URL so links are shareable ───────────
  // The two effects below converge: each only fires while the values differ.
  useEffect(() => {
    try { localStorage.setItem("pp_country", country); } catch { /* quota */ }
    if (urlCountry === country) return;
    const next = new URLSearchParams(searchParams);
    next.set("country", country);
    setSearchParams(next, { replace: true });
  }, [country, urlCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isValidCountry(urlCountry) && urlCountry !== country) setCountry(urlCountry);
  }, [urlCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = useCallback(async (code, force = false) => {
    if (!force && loadedRef.current.has(code)) return;

    // Serve the localStorage cache immediately when it is still fresh.
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey(code));
        if (cached) {
          const { ts, data } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            loadedRef.current.add(code);
            setCache(p => ({ ...p, [code]: data }));
            return;
          }
        }
      } catch { /* ignore corrupt cache */ }
    }

    loadedRef.current.add(code);
    setLoadingVis(p => ({ ...p, [code]: true }));
    try {
      const result = await fetchCountryData(code);
      setCache(p => ({ ...p, [code]: result }));
      try {
        localStorage.setItem(cacheKey(code), JSON.stringify({ ts: Date.now(), data: result }));
      } catch { /* quota */ }
    } catch (e) {
      console.error("load error:", e);
      loadedRef.current.delete(code);
      setCache(p => ({ ...p, [code]: emptyCountryData(code) }));
    }
    setLoadingVis(p => ({ ...p, [code]: false }));
  }, []);

  useEffect(() => { COUNTRIES.forEach(c => load(c.code)); }, [load]);

  const changeCountry = useCallback((code) => {
    setCountry(code);
    load(code);
    track("country_switch", { country: code });
  }, [load]);

  // ── Navigation that preserves the ?country= param ─────────────────────────
  const withCountry = useCallback(
    (pathname) => ({ pathname, search: location.search }),
    [location.search]
  );
  const go = useCallback((pathname) => navigate(withCountry(pathname)), [navigate, withCountry]);

  const data = cache[country] || {};
  const isLoading = !!loadingVis[country] && !cache[country];

  const value = {
    dark, setDark,
    country, changeCountry,
    t, cc,
    data, isLoading, loadingVis, load,
    journey, setJourney,
    tripResult, setTripResult,
    go, withCountry,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
