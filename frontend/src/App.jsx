import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/auth/LoginModal";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const API = import.meta.env.VITE_API_URL || "https://pointspath-canada-api.onrender.com";

// ─── Theme ────────────────────────────────────────────────────────────────────
const T = {
  dark: {
    bg: "#0a0a0f", surface: "#111118", hover: "#1a1a26",
    border: "#2a2a3a", borderL: "#222235",
    text: "#f0f0f8", muted: "#8888aa", dim: "#444460",
    accent: "#6c63ff", accentBg: "#6c63ff1a",
    gold: "#f4c542", goldBg: "#f4c5421a",
    green: "#3ddc84", greenBg: "#3ddc841a",
    warn: "#ffb347", card: "#13131e",
  },
  light: {
    bg: "#f4f4ff", surface: "#ffffff", hover: "#f0f0fa",
    border: "#d0d0e0", borderL: "#e4e4f0",
    text: "#1a1a2e", muted: "#55558a", dim: "#aaaacc",
    accent: "#4f46e5", accentBg: "#4f46e518",
    gold: "#c47a00", goldBg: "#fef3c7",
    green: "#1a8c4e", greenBg: "#d1fae5",
    warn: "#c46400", card: "#f9f9ff",
  },
};

const COUNTRIES = [
  { code: "CA", flag: "🇨🇦", name: "Canada",    sym: "C$",  program: "Aeroplan" },
  { code: "US", flag: "🇺🇸", name: "USA",        sym: "$",   program: "Chase UR / MileagePlus" },
  { code: "IN", flag: "🇮🇳", name: "India",      sym: "₹",   program: "Flying Returns" },
  { code: "HK", flag: "🇭🇰", name: "Hong Kong",  sym: "HK$", program: "Asia Miles" },
];

const CABINS = [
  { v: "economy",         l: "Economy",         i: "💺" },
  { v: "premium_economy", l: "Premium Economy",  i: "🛋" },
  { v: "business",        l: "Business Class",   i: "✨" },
  { v: "first",           l: "First Class",      i: "👑" },
];

const MONTHS = ["Any month","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PEAK = new Set([6,7,8,12]);
const SHOULDER = new Set([4,5]);

const REVIEWS = [
  { name: "Sarah M.", country: "CA", trip: "Toronto → Tokyo", points: "65,000 Aeroplan", saving: "$4,200", text: "PointsPath showed me exactly which card to use and how to hit the spending threshold. Flew business to Japan — seats I could never afford otherwise!", avatar: "👩" },
  { name: "Raj P.",   country: "IN", trip: "Mumbai → London", points: "70,000 Air India", saving: "₹1.8L",  text: "The Points Gap calculator was a game-changer. I set a 9-month goal, followed the strategy, and booked a flat-bed on Air India One.", avatar: "👨" },
  { name: "Kevin T.", country: "US", trip: "NYC → Paris",     points: "55,000 Chase UR",  saving: "$3,100", text: "Used Chase Sapphire Reserve transfer to Air France. PointsPath's sweet spots section found this route — 55k for business is incredible value.", avatar: "🧑" },
  { name: "Mei L.",   country: "HK", trip: "HKG → Maldives",  points: "30,000 Asia Miles", saving: "HK$8,000", text: "Transferred Citi points to Asia Miles and redeemed at Category 5 resort. The hotel points calculator showed me exactly how many nights I could afford.", avatar: "👩‍💼" },
  { name: "Alex W.",  country: "CA", trip: "Vancouver → NYC", points: "15,000 Aeroplan",   saving: "$890",   text: "Domestic transborder sweet spot. Booked in under 5 minutes after finding the route on PointsPath. Cards tab helped me earn the bonus points fast.", avatar: "🙋" },
  { name: "Priya K.", country: "IN", trip: "Delhi → Dubai",   points: "22,000 Axis Edge",  saving: "₹42,000", text: "The card strategy was spot on — Axis Magnus 12x travel rate let me hit 80,000 points in 4 months just from regular spending.", avatar: "👩‍🦱" },
];

// ─── Fallback hotel data (used when backend /hotels endpoint unavailable) ──────
const FALLBACK_HOTELS = [
  {
    id: "marriott", name: "Marriott Bonvoy", logo: "🏨",
    description: "30+ brands: Marriott, Sheraton, Westin, Ritz-Carlton, W Hotels, St. Regis",
    categories: [
      { tier: "Category 1", label: "Budget",     points_per_night: 7500,  example: "Courtyard, Fairfield" },
      { tier: "Category 2", label: "Standard",   points_per_night: 12500, example: "Four Points, Aloft" },
      { tier: "Category 3", label: "Mid-Range",  points_per_night: 17500, example: "Sheraton, Le Méridien" },
      { tier: "Category 4", label: "Upper Mid",  points_per_night: 25000, example: "Westin, Renaissance" },
      { tier: "Category 5", label: "Upscale",    points_per_night: 35000, example: "JW Marriott, Autograph" },
      { tier: "Category 6", label: "Luxury",     points_per_night: 50000, example: "W Hotels, EDITION" },
      { tier: "Category 7", label: "Premium",    points_per_night: 62500, example: "Ritz-Carlton" },
      { tier: "Category 8", label: "Top Tier",   points_per_night: 85000, example: "St. Regis Maldives" },
    ],
    earn_cards: { CA: ["American Express Cobalt Card","American Express Platinum Card"], US: ["Amex Marriott Bonvoy Brilliant","Chase Sapphire Reserve"], IN: ["HDFC Infinia","Amex Platinum India"], HK: ["American Express Platinum HK","Citi Prestige HK"] },
    transfer_programs: ["Amex Membership Rewards → Marriott (1:1.25)", "Chase UR → Marriott (1:1)"],
    sweet_spot: "Category 4-5 properties offer the best points value", countries: ["CA","US","IN","HK"],
  },
  {
    id: "hilton", name: "Hilton Honors", logo: "🏩",
    description: "18+ brands: Hilton, DoubleTree, Conrad, Waldorf Astoria, Curio Collection",
    categories: [
      { tier: "Tier 1", label: "Budget",   points_per_night: 5000,   example: "Hampton Inn, Tru by Hilton" },
      { tier: "Tier 2", label: "Standard", points_per_night: 10000,  example: "DoubleTree, Embassy Suites" },
      { tier: "Tier 3", label: "Upscale",  points_per_night: 30000,  example: "Hilton Hotels & Resorts" },
      { tier: "Tier 4", label: "Luxury",   points_per_night: 60000,  example: "Conrad Hotels, Canopy" },
      { tier: "Tier 5", label: "Top Tier", points_per_night: 120000, example: "Waldorf Astoria" },
    ],
    earn_cards: { CA: ["American Express Platinum Card","American Express Gold Rewards"], US: ["Amex Hilton Honors Aspire","Capital One Venture X"], IN: ["Amex Platinum India","HDFC Infinia"], HK: ["American Express Platinum HK","DBS Black World Mastercard HK"] },
    transfer_programs: ["Amex Membership Rewards → Hilton (1:2)", "Capital One Miles → Hilton (1:2)"],
    sweet_spot: "Tier 2-3 properties offer 0.5–0.7 cents/point value", countries: ["CA","US","IN","HK"],
  },
  {
    id: "hyatt", name: "World of Hyatt", logo: "⭐",
    description: "Hyatt, Grand Hyatt, Park Hyatt, Andaz, Alila, Thompson Hotels",
    categories: [
      { tier: "Category 1", label: "Budget",        points_per_night: 3500,  example: "Hyatt House, Hyatt Place" },
      { tier: "Category 2", label: "Standard",      points_per_night: 8000,  example: "Hyatt Regency Tier 2" },
      { tier: "Category 3", label: "Mid-Range",     points_per_night: 12000, example: "Hyatt Centric" },
      { tier: "Category 4", label: "Upper Upscale", points_per_night: 18000, example: "Grand Hyatt" },
      { tier: "Category 5", label: "Luxury",        points_per_night: 25000, example: "Park Hyatt" },
      { tier: "Category 6", label: "Prem. Luxury",  points_per_night: 40000, example: "Andaz, Alila" },
      { tier: "Category 7", label: "Ultra Premium", points_per_night: 55000, example: "Park Hyatt Maldives" },
    ],
    earn_cards: { CA: ["Chase Sapphire Reserve"], US: ["Chase Sapphire Reserve","Chase Sapphire Preferred"], IN: ["Axis Magnus","HDFC Diners Club Black"], HK: ["Citi Prestige HK","Standard Chartered Visa Infinite HK"] },
    transfer_programs: ["Chase UR → Hyatt (1:1) — best transfer rate", "Capital One Miles → Hyatt (1:1)"],
    sweet_spot: "Hyatt has highest points value (~1.7 cents/point). Category 1-4 is exceptional.", countries: ["CA","US","IN","HK"],
  },
  {
    id: "ihg", name: "IHG One Rewards", logo: "🏰",
    description: "InterContinental, Holiday Inn, Crowne Plaza, Regent, Kimpton, Six Senses",
    categories: [
      { tier: "Tier 1", label: "Budget",   points_per_night: 10000,  example: "Holiday Inn Express" },
      { tier: "Tier 2", label: "Standard", points_per_night: 25000,  example: "Holiday Inn, Staybridge" },
      { tier: "Tier 3", label: "Upscale",  points_per_night: 40000,  example: "Crowne Plaza" },
      { tier: "Tier 4", label: "Luxury",   points_per_night: 70000,  example: "InterContinental, Kimpton" },
      { tier: "Tier 5", label: "Top Tier", points_per_night: 100000, example: "Six Senses, Regent" },
    ],
    earn_cards: { CA: ["RBC Avion Visa Infinite","American Express Platinum Card"], US: ["Chase Sapphire Reserve","Capital One Venture X"], IN: ["HDFC Diners Club Black","Axis Magnus"], HK: ["HSBC Premier Mastercard HK","Citi Prestige HK"] },
    transfer_programs: ["Chase UR → IHG (1:1)", "Amex MR → IHG (1:1)", "Capital One → IHG (1:1)"],
    sweet_spot: "4th-night-free benefit on points redemptions is the best deal", countries: ["CA","US","IN","HK"],
  },
];

// ─── City → Continent mapping (for <optgroup> sections) ──────────────────────
const CITY_REGION = {
  // Canada
  Toronto:"Canada", Montreal:"Canada", Vancouver:"Canada", Calgary:"Canada",
  Edmonton:"Canada", Ottawa:"Canada", Winnipeg:"Canada", Halifax:"Canada",
  "Quebec City":"Canada", Victoria:"Canada", Kelowna:"Canada", Regina:"Canada",
  Saskatoon:"Canada", Whitehorse:"Canada", Yellowknife:"Canada",
  "Prince George":"Canada", Kamloops:"Canada", Abbotsford:"Canada",
  // USA
  "New York":"USA", "Los Angeles":"USA", Chicago:"USA", Miami:"USA",
  "San Francisco":"USA", Washington:"USA", Boston:"USA", Seattle:"USA",
  Denver:"USA", Houston:"USA", Atlanta:"USA", Dallas:"USA",
  Phoenix:"USA", "Las Vegas":"USA", Minneapolis:"USA", Detroit:"USA",
  Philadelphia:"USA", Orlando:"USA",
  // Latin America
  "Mexico City":"Latin America", Cancun:"Latin America",
  "Buenos Aires":"Latin America", "São Paulo":"Latin America",
  Lima:"Latin America", "Bogotá":"Latin America", Santiago:"Latin America",
  // Europe
  London:"Europe", Paris:"Europe", Frankfurt:"Europe", Amsterdam:"Europe",
  Rome:"Europe", Madrid:"Europe", Barcelona:"Europe", Lisbon:"Europe",
  Vienna:"Europe", Istanbul:"Europe", Athens:"Europe", Zurich:"Europe",
  Copenhagen:"Europe", Stockholm:"Europe", Oslo:"Europe", Dublin:"Europe",
  Brussels:"Europe", Prague:"Europe", Warsaw:"Europe", Budapest:"Europe",
  Munich:"Europe", Milan:"Europe",
  // Middle East
  Dubai:"Middle East", "Abu Dhabi":"Middle East", Doha:"Middle East",
  Riyadh:"Middle East", "Tel Aviv":"Middle East", Amman:"Middle East",
  "Kuwait City":"Middle East", Muscat:"Middle East",
  // East Asia
  Tokyo:"East Asia", Seoul:"East Asia", Beijing:"East Asia",
  Shanghai:"East Asia", "Hong Kong":"East Asia", Taipei:"East Asia", Osaka:"East Asia",
  // Southeast Asia
  Singapore:"SE Asia", Bangkok:"SE Asia", "Kuala Lumpur":"SE Asia",
  Jakarta:"SE Asia", Bali:"SE Asia", Manila:"SE Asia",
  "Ho Chi Minh":"SE Asia", Hanoi:"SE Asia",
  // South Asia
  Mumbai:"South Asia", Delhi:"South Asia", Bengaluru:"South Asia",
  Chennai:"South Asia", Hyderabad:"South Asia", Kolkata:"South Asia",
  Kochi:"South Asia", Ahmedabad:"South Asia", Goa:"South Asia",
  Jaipur:"South Asia", Pune:"South Asia", Amritsar:"South Asia",
  Varanasi:"South Asia", Leh:"South Asia", Jammu:"South Asia",
  // Oceania
  Sydney:"Oceania", Melbourne:"Oceania", Auckland:"Oceania",
  Brisbane:"Oceania", Perth:"Oceania", Christchurch:"Oceania",
  // Africa
  Johannesburg:"Africa", Nairobi:"Africa", "Cape Town":"Africa",
  Cairo:"Africa", Casablanca:"Africa",
  // HK domestic / nearby
  Macau:"Nearby", Shenzhen:"Nearby", Guangzhou:"Nearby",
};

const REGION_ORDER = [
  "Canada","USA","Latin America","Europe","Middle East",
  "East Asia","SE Asia","South Asia","Oceania","Africa","Nearby","Other",
];

function groupByRegion(cities) {
  const map = {};
  cities.forEach(c => {
    const r = CITY_REGION[c] || "Other";
    (map[r] = map[r] || []).push(c);
  });
  // Sort within each region alphabetically
  Object.values(map).forEach(arr => arr.sort());
  return map;
}

function CitySelect({ value, onChange, cities, placeholder, style }) {
  const grouped = groupByRegion(cities);
  return (
    <select value={value} onChange={onChange} style={style}>
      <option value="">{placeholder}</option>
      {REGION_ORDER.filter(r => grouped[r]?.length).map(region => (
        <optgroup key={region} label={`── ${region} ──`}>
          {grouped[region].map(c => <option key={c} value={c}>{c}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

function fmt(n) { return n ? Number(n).toLocaleString() : "—"; }

function seasonBadge(m) {
  if (!m || m === 0) return null;
  if (PEAK.has(m)) return { l: "Peak", c: "#ff6b6b", tip: "Expect higher points. Book early." };
  if (SHOULDER.has(m)) return { l: "Shoulder", c: "#ffb347", tip: "Slight premium over base rates." };
  return { l: "Off-Peak", c: "#3ddc84", tip: "Best time to book — lowest points rates." };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(true);
  const [country, setCountry] = useState("CA");
  const [tab, setTab] = useState("calculator");
  const [cache, setCache] = useState({});
  const [loadingVis, setLoadingVis] = useState({});
  const loadedRef = useRef(new Set());
  const [showLogin, setShowLogin] = useState(false);

  const [journey, setJourney] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pp_journey") || "null"); } catch { return null; }
  });
  const [tripResult, setTripResult] = useState(null);

  const t = T[dark ? "dark" : "light"];
  const cc = COUNTRIES.find(c => c.code === country);

  useEffect(() => {
    if (journey) localStorage.setItem("pp_journey", JSON.stringify(journey));
    else localStorage.removeItem("pp_journey");
  }, [journey]);

  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  const load = useCallback(async (code, force = false) => {
    if (!force && loadedRef.current.has(code)) return;

    // Serve localStorage cache immediately while fetching fresh data
    // v3 cache key — old keys (v1/v2 = domestic-only cities) are auto-ignored
    const lsKey = `pp_cache_v3_${code}`;
    if (!force) {
      try {
        const cached = localStorage.getItem(lsKey);
        if (cached) {
          const { ts, data: d } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            loadedRef.current.add(code);
            setCache(p => ({ ...p, [code]: d }));
            return; // Fresh enough — skip network fetch
          }
        }
      } catch { /* ignore corrupt cache */ }
    }

    loadedRef.current.add(code);
    setLoadingVis(p => ({ ...p, [code]: true }));
    try {
      const [cardsR, citiesR, spotsR, hotelsR] = await Promise.all([
        fetch(`${API}/cards?country=${code}`).catch(() => null),
        fetch(`${API}/cities?country=${code}`).catch(() => null),
        fetch(`${API}/sweet-spots?country=${code}&limit=8`).catch(() => null),
        fetch(`${API}/hotels?country=${code}`).catch(() => null),
      ]);
      const cardsJson = cardsR?.ok ? await cardsR.json() : [];
      const cards  = Array.isArray(cardsJson) ? cardsJson : (cardsJson.cards || []);
      const cities = citiesR?.ok ? await citiesR.json() : { from_cities: [], to_cities: [] };
      const spots  = spotsR?.ok  ? await spotsR.json()  : [];
      const hotelsRaw = hotelsR?.ok ? await hotelsR.json() : [];
      // Use fallback hotel data if backend returns nothing
      const hotels = (Array.isArray(hotelsRaw) && hotelsRaw.length > 0)
        ? hotelsRaw
        : FALLBACK_HOTELS.filter(h => h.countries.includes(code));
      const result = { cards, cities, spots, hotels };
      setCache(p => ({ ...p, [code]: result }));
      try { localStorage.setItem(`pp_cache_v3_${code}`, JSON.stringify({ ts: Date.now(), data: result })); } catch { /* storage full */ }
    } catch (e) {
      console.error("load error:", e);
      loadedRef.current.delete(code);
      const fallback = { cards: [], cities: { from_cities: [], to_cities: [] }, spots: [], hotels: FALLBACK_HOTELS.filter(h => h.countries.includes(code)) };
      setCache(p => ({ ...p, [code]: fallback }));
    }
    setLoadingVis(p => ({ ...p, [code]: false }));
  }, []);

  useEffect(() => { COUNTRIES.forEach(c => load(c.code)); }, [load]);

  const data = cache[country] || {};
  const isLoading = loadingVis[country] && !cache[country];

  const inp = {
    width: "100%", background: t.hover, border: `1px solid ${t.border}`,
    borderRadius: 10, padding: "12px 14px", color: t.text, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
  };

  const TABS = [
    ["calculator", "✈ Flights"],
    ["hotels",     "🏨 Hotels"],
    ["gap",        "🎯 Points Gap"],
    ["cards",      "💳 Cards"],
    ["spots",      "⭐ Sweet Spots"],
    ["about",      "ℹ About"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes progressFill{from{width:0}to{width:var(--target-w,100%)}}
        .fade{animation:fadeIn .35s ease}
        .slide{animation:slideUp .4s ease}
        .cbtn:hover{transform:translateY(-2px)}
        input:focus,select:focus{outline:none;border-color:${t.accent}!important;box-shadow:0 0 0 3px ${t.accent}22!important}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${t.border};border-radius:3px}
        .sc{transition:box-shadow .2s,transform .2s}
        .sc:hover{box-shadow:0 8px 30px rgba(108,99,255,0.13)!important;transform:translateY(-2px)}
        .pbar{animation:progressFill .6s ease forwards}
        .tab-item:hover{color:${t.accent}!important;background:${t.accentBg}!important}
        select option{background:${t.surface};color:${t.text}}
      `}</style>

      {/* ── Header ── */}
      <header style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${t.accent},#a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>✈</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>PointsPath</div>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: "0.07em", textTransform: "uppercase" }}>Rewards Intelligence · 2026</div>
          </div>
        </div>

        {/* Country selector */}
        <div style={{ display: "flex", gap: 4, background: t.hover, padding: "4px", borderRadius: 12, border: `1px solid ${t.border}` }}>
          {COUNTRIES.map(c => (
            <button key={c.code} className="cbtn"
              onClick={() => { setCountry(c.code); load(c.code); }}
              style={{ background: country === c.code ? `linear-gradient(135deg,${t.accent},#a855f7)` : "transparent", border: "none", borderRadius: 9, padding: "6px 12px", color: country === c.code ? "#fff" : t.muted, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, transition: "all .2s", fontFamily: "'DM Sans',sans-serif" }}>
              {c.flag} <span style={{ display: window.innerWidth > 700 ? "block" : "none" }}>{c.code}</span>
              {loadingVis[c.code] && <span style={{ fontSize: 9, opacity: .7 }}>⟳</span>}
            </button>
          ))}
        </div>

        {/* Auth + theme */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
              <button onClick={logout} style={{ background: t.hover, border: `1px solid ${t.border}`, borderRadius: 9, padding: "7px 12px", color: t.muted, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>Sign out</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)}
              style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, border: "none", borderRadius: 9, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
              Sign in
            </button>
          )}
          <button onClick={() => setDark(d => !d)}
            style={{ background: t.hover, border: `1px solid ${t.border}`, borderRadius: 9, padding: "8px 12px", color: t.muted, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>

      {/* ── Country badge ── */}
      <div style={{ background: t.accentBg, borderBottom: `1px solid ${t.borderL}`, padding: "7px 24px", display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>{cc?.flag} {cc?.name} · {cc?.program}</span>
        <span style={{ color: t.dim, fontSize: 11 }}>Spending in {cc?.sym} · Data verified 2026</span>
      </div>

      {/* ── Journey bar ── */}
      {journey?.setup && (
        <JourneyBar journey={journey} tripResult={tripResult} data={data} t={t} cc={cc}
          setJourney={setJourney} setTab={setTab} tab={tab} />
      )}

      {/* ── Tabs ── */}
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "0 24px", display: "flex", gap: 2, overflowX: "auto" }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background: "transparent", border: "none", borderBottom: tab === id ? `2px solid ${t.accent}` : "2px solid transparent", color: tab === id ? t.accent : t.muted, padding: "13px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", transition: "all .2s", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1060, margin: "0 auto", padding: "26px 20px" }}>
        <div className="fade" key={`${country}-${tab}`}>
          {isLoading ? (
            <div style={{ color: t.muted, textAlign: "center", padding: 60 }}>Loading {cc?.name} data…</div>
          ) : (
            <>
              {/* About is public — no login needed */}
              {tab === "about" && <About t={t} cc={cc} setTab={setTab} setJourney={setJourney} />}

              {/* Hotels requires sign-in */}
              {tab === "hotels" && (
                <ProtectedRoute country={country} accentColor={t.accent}>
                  <Hotels data={data} country={country} cc={cc} t={t} inp={inp} setTab={setTab} />
                </ProtectedRoute>
              )}

              {/* Calculator, Gap, Cards, Spots require sign-in */}
              {tab === "calculator" && (
                <ProtectedRoute country={country} accentColor={t.accent}>
                  {!journey?.setup && (
                    <JourneySetup data={data} setJourney={setJourney} t={t} inp={inp} cc={cc} />
                  )}
                  <Calculator data={data} country={country} cc={cc} t={t} inp={inp}
                    journey={journey} setTripResult={setTripResult} setTab={setTab} />
                </ProtectedRoute>
              )}
              {tab === "gap" && (
                <ProtectedRoute country={country} accentColor={t.accent}>
                  <Gap data={data} country={country} cc={cc} t={t} inp={inp}
                    journey={journey} tripResult={tripResult} />
                </ProtectedRoute>
              )}
              {tab === "cards" && (
                <ProtectedRoute country={country} accentColor={t.accent}>
                  <Cards data={data} country={country} cc={cc} t={t} inp={inp} />
                </ProtectedRoute>
              )}
              {tab === "spots" && (
                <ProtectedRoute country={country} accentColor={t.accent}>
                  <Spots data={data} country={country} cc={cc} t={t} />
                </ProtectedRoute>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Reviews ── */}
      <ReviewsSection t={t} />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
}

// ─── Journey Setup ────────────────────────────────────────────────────────────
function JourneySetup({ data, setJourney, t, inp, cc }) {
  const [to, setTo] = useState("");
  const [pts, setPts] = useState("");
  const [cardId, setCardId] = useState(null);

  const cards = data.cards || [];
  const toCities = data.cities?.to_cities || [];

  return (
    <div className="fade" style={{ background: t.surface, border: `2px solid ${t.accent}33`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, marginBottom: 5 }}>
          Plan your rewards journey
        </div>
        <div style={{ fontSize: 13, color: t.muted }}>
          Tell us your goal — we'll personalize every tab for you. You can change this anytime.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 10, color: t.muted, marginBottom: 5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Where do you want to go?
          </label>
          <CitySelect value={to} onChange={e => setTo(e.target.value)}
            cities={toCities} placeholder="Select destination" style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10, color: t.muted, marginBottom: 5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Points you have now
          </label>
          <input type="number" value={pts} onChange={e => setPts(e.target.value)}
            placeholder="e.g. 15000" style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 10, color: t.muted, marginBottom: 5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
            Your card (or target card)
          </label>
          <select value={cardId || ""} onChange={e => setCardId(Number(e.target.value) || null)} style={inp}>
            <option value="">Select card (optional)</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setJourney({ to, currentPoints: Number(pts) || 0, cardId, setup: true })}
          disabled={!to}
          style={{ background: to ? `linear-gradient(135deg,${t.accent},#a855f7)` : t.border, border: "none", borderRadius: 11, padding: "12px 22px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: to ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif" }}>
          Start My Journey →
        </button>
        <button onClick={() => setJourney({ to: "", currentPoints: 0, cardId: null, setup: true })}
          style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 11, padding: "12px 16px", color: t.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

// ─── Journey Bar ──────────────────────────────────────────────────────────────
function JourneyBar({ journey, tripResult, data, t, cc, setJourney, setTab, tab }) {
  const card = (data.cards || []).find(c => c.id === journey.cardId);
  const steps = [
    { id: "calculator", label: "1. Find Flight",  done: !!tripResult },
    { id: "hotels",     label: "2. Find Hotel",   done: false },
    { id: "gap",        label: "3. Points Gap",   done: false },
    { id: "cards",      label: "4. Card Strategy",done: false },
  ];

  return (
    <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        {journey.to && (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 11, color: t.muted }}>Journey:</span>
            <span style={{ background: t.accentBg, color: t.accent, fontSize: 12, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>→ {journey.to}</span>
            {journey.currentPoints > 0 && <span style={{ fontSize: 12, color: t.muted }}>{fmt(journey.currentPoints)} pts</span>}
            {card && <span style={{ fontSize: 12, color: t.muted, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {card.name}</span>}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {steps.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <button onClick={() => setTab(s.id)}
                style={{ background: s.done ? t.greenBg : tab === s.id ? t.accentBg : "transparent", border: `1px solid ${s.done ? t.green + "44" : tab === s.id ? t.accent + "44" : t.border}`, borderRadius: 7, padding: "4px 11px", color: s.done ? t.green : tab === s.id ? t.accent : t.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                {s.done ? "✓ " : ""}{s.label}
              </button>
              {i < steps.length - 1 && <span style={{ color: t.dim, fontSize: 11 }}>→</span>}
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setJourney(null)}
        style={{ background: "transparent", border: "none", color: t.dim, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
        Edit ✎
      </button>
    </div>
  );
}

// ─── Trip Calculator ──────────────────────────────────────────────────────────
function Calculator({ data, country, cc, t, inp, journey, setTripResult, setTab }) {
  const cities      = data.cities || {};
  const routesMap   = cities.routes_map || {};
  // If from_cities is empty but to_cities has data (old backend), use to_cities as both
  const allCities   = [...new Set([...(cities.from_cities || []), ...(cities.to_cities || [])])].sort();
  const fromCities  = (cities.from_cities || []).length > 0 ? cities.from_cities : allCities;
  const allToCities = (cities.to_cities   || []).length > 0 ? cities.to_cities   : allCities;

  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [cabin,   setCabin]   = useState("economy");
  const [pax,     setPax]     = useState(1);
  const [month,   setMonth]   = useState(0);
  const [depDate, setDepDate] = useState("");
  const [retDate, setRetDate] = useState("");
  const [res,     setRes]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState(null);

  // Compute valid To cities: if From is selected use routes_map, else show all To cities
  const validToCities = useMemo(() => {
    if (!from) return allToCities.filter(c => c !== from);
    return (routesMap[from] || allToCities).filter(c => c !== from);
  }, [from, routesMap, allToCities]);

  const sb = seasonBadge(month);

  useEffect(() => {
    if (journey?.to && allToCities.includes(journey.to) && !to) setTo(journey.to);
  }, [journey?.to, allToCities.length]);

  // Reset To when From changes if To is no longer valid
  useEffect(() => {
    if (from && to && routesMap[from] && !routesMap[from].includes(to)) setTo("");
  }, [from]);

  // Sync month from departure date
  useEffect(() => {
    if (depDate) setMonth(new Date(depDate).getMonth() + 1);
  }, [depDate]);

  const calc = async () => {
    if (!from || !to) return;
    setLoading(true); setErr(null); setRes(null);
    const today = new Date().toISOString().split("T")[0];
    try {
      const url = `${API}/calculate-points-v2?country=${country}&from_city=${encodeURIComponent(from)}&to_city=${encodeURIComponent(to)}&cabin=${cabin}&passengers=${pax}${month ? `&month=${month}` : ""}`;
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        const result = { ...d, return_trip: !!retDate, return_date: retDate, depart_date: depDate };
        if (retDate) result.base_points = d.base_points * 2;
        setRes(result); setTripResult(result);
      } else {
        // Fallback to v1 POST
        const r2 = await fetch(`${API}/calculate-points`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from_city: from, to_city: to, travel_class: cabin, passengers: pax, country,
            depart_date: depDate || today, return_date: retDate || undefined }),
        });
        if (r2.ok) {
          const d = await r2.json();
          const normalized = {
            found: true, route: `${from} → ${to}`,
            base_points: retDate ? (d.total_points || 0) * 2 : (d.total_points || 0),
            base_points_per_person: Math.round((d.points_per_person || (d.total_points || 0)) ),
            cabin, passengers: pax, is_dynamic: false, last_updated: "2026",
            depart_date: depDate, return_date: retDate,
          };
          setRes(normalized); setTripResult(normalized);
        } else {
          const errData = await r2.json().catch(() => ({}));
          setErr(errData.detail || "Route not found. Please select valid cities from the dropdowns.");
        }
      }
    } catch {
      setErr("Could not reach the server. Is the backend running on port 8000?");
    }
    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, marginBottom: 5 }}>Flight Points Calculator</h2>
        <p style={{ color: t.muted, fontSize: 13 }}>Find how many points you need — Aeroplan, Asia Miles, MileagePlus, Flying Returns.</p>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22, marginBottom: 20 }}>
        {/* Row 1: From / To */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>From</label>
            <CitySelect value={from} onChange={e => setFrom(e.target.value)}
              cities={fromCities} placeholder="Select departure city" style={inp} />
          </div>
          <div>
            <label style={lbl}>To {from && validToCities.length > 0 && <span style={{ color: t.accent, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({validToCities.length} destinations)</span>}</label>
            <CitySelect value={to} onChange={e => setTo(e.target.value)}
              cities={validToCities} placeholder="Select destination" style={inp} />
          </div>
        </div>

        {/* Row 2: Dates */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Departure Date</label>
            <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Return Date <span style={{ color: t.dim, fontWeight: 400 }}>(optional)</span></label>
            <input type="date" value={retDate} onChange={e => setRetDate(e.target.value)} min={depDate} style={inp} />
          </div>
        </div>

        {/* Row 3: Cabin / Passengers / Month */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Cabin Class</label>
            <select value={cabin} onChange={e => setCabin(e.target.value)} style={inp}>
              {CABINS.map(c => <option key={c.v} value={c.v}>{c.i} {c.l}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Passengers</label>
            <select value={pax} onChange={e => setPax(Number(e.target.value))} style={inp}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? "passenger" : "passengers"}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Travel Month</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={inp}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        {sb && (
          <div style={{ marginBottom: 14, padding: "9px 13px", background: `${sb.c}18`, border: `1px solid ${sb.c}40`, borderRadius: 9, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: sb.c, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>{sb.l}</span>
            <span style={{ color: t.muted, fontSize: 13 }}>{sb.tip}</span>
          </div>
        )}

        <button onClick={calc} disabled={!from || !to || loading}
          style={{ width: "100%", background: from && to ? `linear-gradient(135deg,${t.accent},#a855f7)` : t.border, border: "none", borderRadius: 11, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: from && to ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", opacity: loading ? .7 : 1 }}>
          {loading ? "Searching…" : "Search Points →"}
        </button>
      </div>

      {err && (
        <div style={{ background: "#ff6b6b18", border: "1px solid #ff6b6b44", borderRadius: 11, padding: 14, color: "#ff6b6b", fontSize: 14 }}>
          ⚠ {err}
        </div>
      )}

      {res && !err && (
        <div className="fade" style={{ background: t.surface, border: `1px solid ${t.accent}44`, borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: t.muted, marginBottom: 3 }}>{res.program || cc?.program}</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>{res.route}</div>
              <div style={{ fontSize: 13, color: t.muted, marginTop: 3 }}>
                {pax} pax · {CABINS.find(c => c.v === cabin)?.l}
                {depDate && ` · ${new Date(depDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
                {retDate && ` → ${new Date(retDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
              </div>
            </div>
            <div style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>✓ Verified 2026</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: res.median_points ? "1fr 1fr" : "1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ background: t.accentBg, border: `1px solid ${t.accent}40`, borderRadius: 13, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: t.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
                {res.is_dynamic ? "Starting At" : "Points Required"}
                {retDate && " (Round Trip)"}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 700, color: t.accent }}>{fmt(res.base_points)}</div>
              {pax > 1 && <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>{fmt(res.base_points_per_person)} × {pax}{retDate ? " × 2" : ""}</div>}
            </div>
            {res.median_points && (
              <div style={{ background: t.goldBg, border: `1px solid ${t.gold}44`, borderRadius: 13, padding: 18, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: t.gold, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Realistic Median</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 34, fontWeight: 700, color: t.gold }}>{fmt(res.median_points)}</div>
                <div style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>Dynamic pricing — actual may vary</div>
              </div>
            )}
          </div>

          {res.is_dynamic && (
            <div style={{ background: `${t.warn}18`, border: `1px solid ${t.warn}44`, borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 13, color: t.warn }}>
              Dynamic pricing: Minimum shown — actual cost varies by availability. Book early for lowest rates.
            </div>
          )}
          {res.seasonal_note && (
            <div style={{ background: t.hover, borderRadius: 10, padding: 11, marginBottom: 12, fontSize: 13, color: t.muted }}>📅 {res.seasonal_note}</div>
          )}
          {res.route_note && (
            <div style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: 11, padding: 13, marginBottom: 16, fontSize: 13, color: t.muted, lineHeight: 1.6 }}>
              💡 <strong style={{ color: t.text }}>Expert tip:</strong> {res.route_note}
            </div>
          )}

          <div style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>Need {fmt(res.base_points)} points?</div>
              <div style={{ fontSize: 12, color: t.muted, marginTop: 3 }}>See how much you need to spend — with your welcome bonus.</div>
            </div>
            <button onClick={() => setTab("gap")}
              style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
              Calculate Gap →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hotels ───────────────────────────────────────────────────────────────────
const HOTEL_DESTINATIONS = [
  "Tokyo","Paris","London","New York","Bali","Dubai","Singapore","Bangkok",
  "Rome","Barcelona","Sydney","Maldives","Amsterdam","Hong Kong","Istanbul",
  "Cancun","Phuket","Kuala Lumpur","Seoul","Vienna","Prague","Lisbon",
  "Cape Town","Miami","Las Vegas","Vancouver","Toronto","Mumbai","Delhi",
];

function Hotels({ data, country, cc, t, inp, setTab }) {
  const hotels = data.hotels || [];

  // Booking search state
  const [destination, setDestination] = useState("");
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests,   setGuests]   = useState(2);
  const [searched, setSearched] = useState(false);

  // Program + tier selection
  const [progId,  setProgId]  = useState(null);
  const [tierIdx, setTierIdx] = useState(0);
  const [result,  setResult]  = useState(null);

  const prog = hotels.find(h => h.id === progId);

  // Auto-calculate nights from dates
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000;
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  // Auto-fill check-out if only check-in is set (default 3 nights)
  useEffect(() => {
    if (checkIn && !checkOut) {
      const d = new Date(checkIn);
      d.setDate(d.getDate() + 3);
      setCheckOut(d.toISOString().split("T")[0]);
    }
  }, [checkIn]);

  const search = () => {
    if (!destination || !checkIn || !checkOut) return;
    setSearched(true);
    setProgId(null);
    setResult(null);
  };

  const calculate = async () => {
    if (!prog) return;
    const cat = prog.categories[tierIdx];
    if (!cat) return;
    const total = cat.points_per_night * (nights || 1);
    setResult({ nights: nights || 1, points_per_night: cat.points_per_night, total_points: total, category: cat });
  };

  const tierColors = [t.green, t.accent, "#a855f7", t.gold, "#f97316", "#ef4444", "#6366f1", "#ec4899"];
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, marginBottom: 5 }}>Hotel Points Booking</h2>
        <p style={{ color: t.muted, fontSize: 13 }}>Search your stay, pick a loyalty program, and see exactly how many points you need.</p>
      </div>

      {/* ── Booking search bar ── */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 16 }}>Where are you staying?</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={lbl}>Destination</label>
            <select value={destination} onChange={e => setDestination(e.target.value)} style={inp}>
              <option value="">Select city / resort</option>
              {HOTEL_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Check-in</label>
            <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={today} style={inp} />
          </div>
          <div>
            <label style={lbl}>Check-out</label>
            <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || today} style={inp} />
          </div>
          <div>
            <label style={lbl}>Guests</label>
            <select value={guests} onChange={e => setGuests(Number(e.target.value))} style={{ ...inp, minWidth: 80 }}>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>

        {nights > 0 && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: t.accentBg, color: t.accent, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>
              {nights} night{nights > 1 ? "s" : ""}
            </span>
            {destination && <span style={{ fontSize: 12, color: t.muted }}>in {destination}</span>}
          </div>
        )}

        <button onClick={search} disabled={!destination || !checkIn || !checkOut}
          style={{ marginTop: 16, background: destination && checkIn && checkOut ? `linear-gradient(135deg,${t.accent},#a855f7)` : t.border, border: "none", borderRadius: 11, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: destination && checkIn && checkOut ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif" }}>
          Search Hotels →
        </button>
      </div>

      {/* ── Program selection (shown after search) ── */}
      {searched && (
        <div className="fade">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 4 }}>
              Points programs for {destination}
            </div>
            <div style={{ fontSize: 12, color: t.muted }}>{nights} night{nights > 1 ? "s" : ""} · {guests} guest{guests > 1 ? "s" : ""} · Select a loyalty program to see points cost</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12, marginBottom: 24 }}>
            {hotels.map(h => {
              const minPts = h.categories[0]?.points_per_night || 0;
              const sel = progId === h.id;
              return (
                <button key={h.id} onClick={() => { setProgId(h.id); setTierIdx(0); setResult(null); }}
                  style={{ background: sel ? t.accentBg : t.surface, border: `2px solid ${sel ? t.accent : t.border}`, borderRadius: 14, padding: 18, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 26 }}>{h.logo}</div>
                    {sel && <span style={{ background: t.accent, color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>SELECTED</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: sel ? t.accent : t.text, marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginBottom: 8, lineHeight: 1.4 }}>{h.description}</div>
                  <div style={{ fontSize: 11, color: sel ? t.accent : t.muted }}>
                    From <strong>{fmt(minPts)}</strong> pts/night
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Property tier selector + points result ── */}
          {prog && (
            <div className="fade">
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 4 }}>{prog.logo} {prog.name} — Choose Property Type</div>
                <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>Award charts are fixed — not subject to dynamic pricing (except Hilton)</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 9, marginBottom: 18 }}>
                  {prog.categories.map((cat, i) => {
                    const tc = tierColors[i % tierColors.length];
                    const sel = tierIdx === i;
                    return (
                      <button key={i} onClick={() => { setTierIdx(i); setResult(null); }}
                        style={{ background: sel ? `${tc}22` : t.hover, border: `2px solid ${sel ? tc : t.border}`, borderRadius: 11, padding: 12, cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
                        <div style={{ fontSize: 9, color: tc, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{cat.tier}</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: tc }}>{fmt(cat.points_per_night)}</div>
                        <div style={{ fontSize: 9, color: t.dim }}>pts/night</div>
                        <div style={{ fontSize: 10, color: t.muted, marginTop: 4, lineHeight: 1.4 }}>{cat.label}</div>
                        <div style={{ fontSize: 9, color: t.dim, marginTop: 3, lineHeight: 1.3 }}>{cat.example}</div>
                      </button>
                    );
                  })}
                </div>

                <button onClick={calculate}
                  style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, border: "none", borderRadius: 11, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Calculate Points Needed →
                </button>
              </div>

              {/* ── Points result ── */}
              {result && (
                <div className="fade">
                  <div style={{ background: t.surface, border: `2px solid ${t.accent}44`, borderRadius: 14, padding: 22, marginBottom: 16 }}>
                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 3 }}>Your stay in {destination}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>{result.category.tier} · {result.category.label} · {result.nights} night{result.nights > 1 ? "s" : ""} · {guests} guest{guests > 1 ? "s" : ""}</div>
                      </div>
                      {prog.sweet_spot && (
                        <div style={{ background: t.goldBg, border: `1px solid ${t.gold}33`, borderRadius: 8, padding: "7px 12px", maxWidth: 260 }}>
                          <div style={{ fontSize: 10, color: t.gold, fontWeight: 700, marginBottom: 2 }}>💡 Sweet Spot</div>
                          <div style={{ fontSize: 11, color: t.muted }}>{prog.sweet_spot}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 18 }}>
                      {[
                        { l: "Total Points", v: fmt(result.total_points), c: t.accent, i: "🎯" },
                        { l: "Per Night",    v: fmt(result.points_per_night), c: t.gold,   i: "🌙" },
                        { l: "Nights",       v: result.nights,             c: t.green,  i: "📅" },
                        { l: "Guests",       v: guests,                    c: "#a855f7", i: "👤" },
                      ].map(s => (
                        <div key={s.l} style={{ background: `${s.c}14`, border: `1px solid ${s.c}33`, borderRadius: 11, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{s.i}</div>
                          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                          <div style={{ fontSize: 10, color: t.muted, marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    {/* example properties */}
                    <div style={{ background: t.hover, borderRadius: 9, padding: "9px 14px", fontSize: 12, color: t.muted, marginBottom: 16 }}>
                      🏨 Example hotels: <strong style={{ color: t.text }}>{result.category.example}</strong>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => setTab("gap")}
                        style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        Earn {fmt(result.total_points)} pts →
                      </button>
                      <button onClick={() => setTab("cards")}
                        style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 10, padding: "11px 16px", color: t.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        Browse cards
                      </button>
                    </div>
                  </div>

                  {/* Best cards to earn */}
                  {prog.earn_cards?.[country] && (
                    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, marginBottom: 12 }}>Best cards to earn {prog.name} points</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        {prog.earn_cards[country].map((cardName, i) => {
                          const card = (data.cards || []).find(c => c.name === cardName);
                          return (
                            <div key={i} style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 9, padding: "8px 14px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{cardName}</div>
                              {card && <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Welcome: {fmt(card.welcome_bonus)} pts · Fee: {cc?.sym}{fmt(card.annual_fee)}</div>}
                            </div>
                          );
                        })}
                      </div>
                      {prog.transfer_programs?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Transfer Partners</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {prog.transfer_programs.map((tp, i) => (
                              <span key={i} style={{ background: t.greenBg, border: `1px solid ${t.green}33`, borderRadius: 7, padding: "4px 10px", fontSize: 12, color: t.green }}>{tp}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Program overview (always visible) ── */}
      {!searched && (
        <div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>Available loyalty programs — search above to compare points for your stay</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
            {hotels.map(h => {
              const minPts = h.categories[0]?.points_per_night || 0;
              const maxPts = h.categories[h.categories.length - 1]?.points_per_night || 0;
              return (
                <div key={h.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{h.logo}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginBottom: 8, lineHeight: 1.4 }}>{h.description}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>
                    <span style={{ color: t.green, fontWeight: 700 }}>{fmt(minPts)}</span> – <span style={{ color: "#ef4444", fontWeight: 700 }}>{fmt(maxPts)}</span> pts/night
                  </div>
                  {h.sweet_spot && <div style={{ fontSize: 10, color: t.gold, marginTop: 6, lineHeight: 1.4 }}>💡 {h.sweet_spot}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Points Gap ───────────────────────────────────────────────────────────────
// Typical monthly spending proportions used to build the spending plan
const SPEND_PROPS = {
  groceries: 0.26, dining: 0.20, gas: 0.10, travel: 0.12,
  transit: 0.05, entertainment: 0.05, shopping: 0.08, hotel: 0.06, general: 0.08,
};

function Gap({ data, country, cc, t, inp, journey, tripResult }) {
  const [needed,     setNeeded]     = useState("");
  const [havePoints, setHavePoints] = useState(""); // blank by default
  const [months,     setMonths]     = useState(6);
  const [cardIds,    setCardIds]    = useState(new Set());
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);

  const cards = data.cards || [];
  const prevTripRef = useRef(null);

  useEffect(() => {
    if (tripResult && tripResult !== prevTripRef.current) {
      prevTripRef.current = tripResult;
      setNeeded(String(tripResult.base_points));
    }
  }, [tripResult]);

  useEffect(() => {
    if (journey?.cardId && cardIds.size === 0) setCardIds(new Set([journey.cardId]));
  }, [journey?.cardId]);

  const totalNeeded = Number(needed)     || 0;
  const existing    = Number(havePoints) || 0;
  const netNeeded   = Math.max(0, totalNeeded - existing);
  const pct         = totalNeeded > 0 ? Math.min(100, Math.round(existing / totalNeeded * 100)) : 0;
  const alreadyDone = pct >= 100;

  const toggleCard = (id) => {
    setCardIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const localCalc = (card) => {
    const rates = CARD_EARNING_RATES[card?.name] || { general: 1.5 };
    const rateVals = Object.values(rates).filter(v => v >= 1).sort((a, b) => b - a);
    const avg = rateVals.length >= 2
      ? rateVals[0] * 0.4 + rateVals[1] * 0.3 + (rateVals.slice(2).reduce((s, v) => s + v, 0) || rateVals[1]) * 0.3 / Math.max(rateVals.length - 2, 1)
      : rateVals[0] || 1.5;

    const monthly_pts   = netNeeded > 0 ? Math.ceil(netNeeded / months) : 0;
    const monthly_spend = netNeeded > 0 ? Math.round(netNeeded / months / avg) : 0;

    // Build per-category spending plan
    const sorted = Object.entries(rates).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]);
    let allocated = 0;
    const plan = sorted.map(([cat, rate], i) => {
      const prop = SPEND_PROPS[cat] || SPEND_PROPS.general;
      const spend = Math.round(monthly_spend * prop);
      allocated += spend;
      return { cat, rate, spend, pts: Math.round(spend * rate) };
    });
    // Put unallocated remainder into the last (lowest rate) category
    const remainder = Math.max(0, monthly_spend - allocated);
    if (remainder > 0 && plan.length > 0) plan[plan.length - 1].spend += remainder;

    // Smart actionable tips
    const tips = [];
    if (sorted[0] && sorted[0][1] >= 4) tips.push(`Max out ${sorted[0][1]}x on ${sorted[0][0].replace(/_/g,' ')} — put every ${sorted[0][0].replace(/_/g,' ')} purchase on this card.`);
    if (sorted[1] && sorted[1][1] >= 2) tips.push(`Also use for ${sorted[1][0].replace(/_/g,' ')} at ${sorted[1][1]}x to hit your monthly target faster.`);
    if (avg < 2) tips.push("This card has a moderate earn rate. Consider pairing it with a higher-category card (e.g. 5x groceries).");
    if (months <= 3) tips.push("Short timeline — focus spending on your highest-earn category exclusively to maximize efficiency.");

    const topCats = sorted.filter(([, v]) => v >= 2).slice(0, 4);

    return {
      card_id: card?.id, card_name: card?.name || "Card",
      total_target: totalNeeded, existing, net_needed: netNeeded,
      avg_earn_rate: Math.round(avg * 10) / 10,
      monthly_pts, monthly_spend,
      total_spend: monthly_spend * months,
      plan, tips, topCats,
    };
  };

  const calc = async () => {
    if (!needed || cardIds.size === 0) return;
    setLoading(true);
    const res = await Promise.all([...cardIds].map(cid => Promise.resolve(localCalc(cards.find(c => c.id === cid)))));
    setResults(res.filter(Boolean));
    setLoading(false);
  };

  const canCalc = needed && cardIds.size > 0;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, marginBottom: 5 }}>Points Earning Strategy</h2>
        <p style={{ color: t.muted, fontSize: 13 }}>Set your points goal, enter what you already have, and get a clear monthly spending plan — broken down by category.</p>
      </div>

      {tripResult && (
        <div className="fade" style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 11, padding: "11px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: t.accent, fontSize: 14 }}>✈</span>
          <span style={{ fontSize: 13, color: t.muted }}>
            Pre-filled from flight: <strong style={{ color: t.text }}>{tripResult.route}</strong> — <strong style={{ color: t.accent }}>{fmt(tripResult.base_points)}</strong> pts
          </span>
        </div>
      )}

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
        {/* Row 1: Goal / Have / Timeline */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={lbl}>Points Goal <span style={{ color: t.dim, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(total needed)</span></label>
            <input type="number" value={needed} onChange={e => { setNeeded(e.target.value); setResults([]); }}
              placeholder="e.g. 80,000" style={inp} />
          </div>
          <div>
            <label style={lbl}>Points You Already Have <span style={{ color: t.dim, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
            <input type="number" value={havePoints} onChange={e => { setHavePoints(e.target.value); setResults([]); }}
              placeholder="Leave blank if none" style={inp} />
          </div>
          <div>
            <label style={lbl}>Earn Over</label>
            <select value={months} onChange={e => { setMonths(Number(e.target.value)); setResults([]); }} style={inp}>
              {[3,4,5,6,9,12,18,24].map(n => <option key={n} value={n}>{n} months</option>)}
            </select>
          </div>
        </div>

        {/* Progress bar — only shown when both goal and existing are set */}
        {totalNeeded > 0 && existing > 0 && (
          <div className="fade" style={{ background: t.hover, borderRadius: 12, padding: "13px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>Progress toward goal</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? t.green : t.accent }}>{pct}% complete</span>
            </div>
            <div style={{ background: t.border, borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 10 }}>
              <div className="pbar" style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? `linear-gradient(90deg,${t.green},#3ddc84)` : `linear-gradient(90deg,${t.accent},#a855f7)`, borderRadius: 8 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { l: "You have", v: fmt(existing),    c: t.green  },
                { l: "Still need", v: fmt(netNeeded), c: t.accent },
                { l: "Total goal", v: fmt(totalNeeded), c: t.text },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {alreadyDone && (
              <div style={{ marginTop: 12, background: t.greenBg, border: `1px solid ${t.green}44`, borderRadius: 9, padding: "9px 14px", fontSize: 13, color: t.green, fontWeight: 700, textAlign: "center" }}>
                🎉 You already have enough points to book! Ready to go.
              </div>
            )}
          </div>
        )}

        {/* Card picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Select Cards to Compare <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0, color: t.dim }}>— pick one or more</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 7, maxHeight: 240, overflowY: "auto", padding: "2px" }}>
            {cards.map(card => {
              const sel = cardIds.has(card.id);
              const rates = CARD_EARNING_RATES[card.name];
              const topRate = rates ? Math.max(...Object.values(rates)) : null;
              return (
                <button key={card.id} onClick={() => { toggleCard(card.id); setResults([]); }}
                  style={{ background: sel ? t.accentBg : t.hover, border: `2px solid ${sel ? t.accent : t.border}`, borderRadius: 10, padding: "10px 12px", color: t.text, cursor: "pointer", fontSize: 11, fontWeight: 600, textAlign: "left", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, transition: "all .15s" }}>
                  <div style={{ color: sel ? t.accent : t.text, marginBottom: 3 }}>{sel ? "✓ " : ""}{card.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {topRate && <span style={{ background: sel ? `${t.accent}33` : t.surface, color: sel ? t.accent : t.muted, fontSize: 10, padding: "1px 6px", borderRadius: 4 }}>Up to {topRate}x</span>}
                    <span style={{ color: t.dim, fontSize: 10 }}>{card.issuer}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={calc} disabled={!canCalc || loading || alreadyDone}
          style={{ width: "100%", background: canCalc && !alreadyDone ? `linear-gradient(135deg,${t.accent},#a855f7)` : t.border, border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: canCalc && !alreadyDone ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", boxShadow: canCalc && !alreadyDone ? `0 4px 18px ${t.accent}44` : "none", transition: "all .2s" }}>
          {loading ? "Calculating…" : alreadyDone ? "You have enough points ✓" : "Generate Spending Strategy →"}
        </button>
      </div>

      {results.length > 0 && !alreadyDone && (
        <div className="slide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, color: t.muted }}>
              Strategy to earn <strong style={{ color: t.text }}>{fmt(netNeeded)} pts</strong> in <strong style={{ color: t.text }}>{months} months</strong>
            </div>
            {results.length > 1 && (
              <span style={{ fontSize: 11, color: t.muted }}>Comparing {results.length} cards — lowest monthly spend wins</span>
            )}
          </div>

          {results.sort((a, b) => a.monthly_spend - b.monthly_spend).map((res, idx) => (
            <div key={res.card_id || idx} className="sc" style={{ background: t.surface, border: `1px solid ${idx === 0 && results.length > 1 ? t.accent : t.border}`, borderRadius: 16, padding: 22, marginBottom: 16, position: "relative" }}>
              {idx === 0 && results.length > 1 && (
                <div style={{ position: "absolute", top: -10, left: 18, background: `linear-gradient(135deg,${t.accent},#a855f7)`, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, letterSpacing: ".05em" }}>BEST VALUE</div>
              )}

              {/* Card header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{res.card_name}</div>
                  <div style={{ fontSize: 12, color: t.muted }}>Avg {res.avg_earn_rate}x earn rate · {months}-month plan · {fmt(res.monthly_pts)} pts/month needed</div>
                </div>
                <div style={{ background: `linear-gradient(135deg,${t.accent}18,#a855f718)`, border: `1px solid ${t.accent}33`, borderRadius: 12, padding: "11px 18px", textAlign: "right", minWidth: 130 }}>
                  <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Monthly Spend</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: t.accent }}>{cc?.sym}{fmt(res.monthly_spend)}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginTop: 1 }}>→ {fmt(res.monthly_pts)} pts/mo</div>
                </div>
              </div>

              {/* Summary row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 18 }}>
                {[
                  { l: "Total Spend",   v: `${cc?.sym}${fmt(res.total_spend)}`,       c: t.accent,   i: "💳" },
                  { l: "Points Earned", v: fmt(res.net_needed),                        c: t.green,    i: "🎯" },
                  { l: "Timeline",      v: `${months} months`,                         c: "#a855f7",  i: "📅" },
                  { l: "Avg Earn Rate", v: `${res.avg_earn_rate}x`,                    c: t.gold,     i: "⚡" },
                ].map(s => (
                  <div key={s.l} style={{ background: `${s.c}12`, border: `1px solid ${s.c}28`, borderRadius: 11, padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.i}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: t.muted, marginTop: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Monthly spending plan breakdown */}
              <div style={{ background: t.hover, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
                  Monthly Spending Plan — {cc?.sym}{fmt(res.monthly_spend)}/month total
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {res.plan.filter(p => p.spend > 0).map((p, i) => {
                    const barW = res.monthly_spend > 0 ? Math.round(p.spend / res.monthly_spend * 100) : 0;
                    const cols = [t.accent, t.green, "#a855f7", t.gold, "#f97316", "#06b6d4", "#ec4899"];
                    const col  = cols[i % cols.length];
                    return (
                      <div key={p.cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: t.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ textTransform: "capitalize" }}>{p.cat.replace(/_/g, " ")}</span>
                            <span style={{ background: `${col}22`, color: col, fontSize: 10, padding: "1px 7px", borderRadius: 5, fontWeight: 700 }}>{p.rate}x</span>
                          </span>
                          <span style={{ fontSize: 12, color: t.muted }}>
                            <strong style={{ color: t.text, fontFamily: "'DM Sans',sans-serif" }}>{cc?.sym}{fmt(p.spend)}</strong>/mo
                            <span style={{ margin: "0 4px", color: t.dim }}>→</span>
                            <strong style={{ color: col }}>{fmt(p.pts)} pts</strong>
                          </span>
                        </div>
                        <div style={{ background: t.border, borderRadius: 5, height: 6, overflow: "hidden" }}>
                          <div className="pbar" style={{ width: `${barW}%`, height: "100%", background: col, borderRadius: 5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.borderL}`, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.muted }}>Total monthly spend</span>
                  <strong style={{ color: t.text }}>{cc?.sym}{fmt(res.monthly_spend)} → {fmt(res.monthly_pts)} pts/month</strong>
                </div>
              </div>

              {/* Smart tips */}
              {res.tips.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  {res.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: t.accentBg, border: `1px solid ${t.accent}22`, borderRadius: 9, padding: "9px 12px" }}>
                      <span style={{ fontSize: 14, minWidth: 18 }}>💡</span>
                      <span style={{ fontSize: 12, color: t.muted, lineHeight: 1.55 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Top earn badges */}
              {res.topCats.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Best Earn Categories</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {res.topCats.map(([cat, rate]) => (
                      <span key={cat} style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, color: t.accent, fontSize: 11, padding: "4px 11px", borderRadius: 7, fontWeight: 700 }}>
                        {rate}x {cat.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Card earning rates (mirrors backend — used for local gap calc) ────────────
const CARD_EARNING_RATES = {
  "American Express Platinum Card":         {travel:1.25,dining:1.25,gas:1.25,groceries:1.25,entertainment:1.25,general:1.25},
  "TD Aeroplan Visa Infinite":              {groceries:1.5,gas:1.5,air_canada:1.5,dining:1.0,general:1.0},
  "CIBC Aeroplan Visa Infinite":            {groceries:1.5,gas:1.5,dining:1.5,general:1.0},
  "American Express Aeroplan Reserve":      {dining:3.0,groceries:2.0,gas:2.0,travel:2.0,general:2.0},
  "RBC Avion Visa Infinite":                {travel:1.25,groceries:1.0,general:1.0},
  "Scotiabank Gold American Express":       {groceries:5.0,dining:5.0,entertainment:5.0,general:1.0},
  "BMO Eclipse Visa Infinite":              {groceries:5.0,gas:5.0,transit:5.0,dining:1.0,general:1.0},
  "American Express Cobalt Card":           {groceries:5.0,dining:5.0,travel:2.0,transit:2.0,general:1.0},
  "TD First Class Travel Visa Infinite":    {travel:3.0,groceries:1.5,gas:1.5,dining:1.5,general:1.0},
  "CIBC Aventura Visa Infinite":            {travel:2.0,dining:2.0,general:1.0},
  "National Bank World Elite Mastercard":   {groceries:5.0,gas:5.0,transit:5.0,general:1.0},
  "BMO Ascend World Elite Mastercard":      {travel:5.0,dining:5.0,entertainment:5.0,general:1.0},
  "Chase Sapphire Reserve":                 {travel:3.0,dining:3.0,general:1.0},
  "Chase Sapphire Preferred":               {travel:2.0,dining:3.0,groceries:3.0,general:1.0},
  "Amex Platinum":                          {travel:5.0,dining:1.0,general:1.0},
  "Amex Gold":                              {dining:4.0,groceries:4.0,travel:3.0,general:1.0},
  "Capital One Venture X":                  {travel:10.0,hotels:5.0,general:2.0},
  "Capital One Venture":                    {travel:5.0,general:2.0},
  "Chase Freedom Unlimited":                {travel:3.0,dining:3.0,general:1.5},
  "HDFC Infinia":                           {dining:5.0,travel:5.0,groceries:2.0,general:1.5},
  "Axis Magnus":                            {travel:12.0,dining:2.0,general:1.0},
  "HDFC Diners Club Black":                 {dining:5.0,travel:5.0,general:1.5},
  "SBI Card PRIME":                         {dining:5.0,groceries:5.0,travel:5.0,general:2.0},
  "Amex Platinum India":                    {travel:5.0,dining:5.0,general:1.0},
  "Yes First Exclusive":                    {travel:12.0,dining:6.0,general:2.0},
  "Citi Prestige HK":                       {travel:4.0,dining:4.0,hotel:4.0,general:1.0},
  "American Express Platinum HK":           {travel:5.0,dining:5.0,general:1.0},
  "Standard Chartered Visa Infinite HK":   {travel:5.0,dining:3.0,general:1.5},
  "DBS Black World Mastercard HK":          {dining:5.0,travel:4.0,general:1.5},
};

// ─── Cards ────────────────────────────────────────────────────────────────────
function Cards({ data, country, cc, t, inp }) {
  const [search, setSearch] = useState("");
  const cards = data.cards || [];

  const filtered = useMemo(() =>
    cards.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.issuer?.toLowerCase().includes(search.toLowerCase())),
    [cards, search]
  );

  const tierColor = { premium: t.gold, mid: t.accent, entry: t.green };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, marginBottom: 5 }}>Explore Cards</h2>
        <p style={{ color: t.muted, fontSize: 13 }}>{cards.length} cards · Welcome bonuses verified 2026</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards or issuers…"
        style={{ ...inp, maxWidth: 300, marginBottom: 18 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {filtered.map((card, i) => {
          const tc = tierColor[card.tier] || t.accent;
          return (
            <div key={card.id || i} className="sc" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Tier accent bar */}
              <div style={{ height: 4, background: `linear-gradient(90deg,${tc},${tc}88)` }} />
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, marginBottom: 3, paddingRight: 8 }}>{card.name}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{card.issuer} · {card.program}</div>
                  </div>
                  {card.tier && (
                    <span style={{ background: `${tc}22`, color: tc, fontSize: 9, fontWeight: 700, padding: "4px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap", border: `1px solid ${tc}33` }}>{card.tier}</span>
                  )}
                </div>

                <div style={{ background: `linear-gradient(135deg,${t.green}15,${t.green}08)`, border: `1px solid ${t.green}33`, borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 9, color: t.green, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 4 }}>Welcome Bonus</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: t.green }}>{fmt(card.welcome_bonus)} <span style={{ fontSize: 13, fontWeight: 600 }}>pts</span></div>
                </div>

                {card.earn_rates && Object.keys(card.earn_rates).length > 0 && (
                  <div>
                    <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Earn Rates</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {Object.entries(typeof card.earn_rates === "string" ? JSON.parse(card.earn_rates) : card.earn_rates)
                        .sort((a, b) => b[1] - a[1])
                        .map(([cat, rate]) => (
                        <span key={cat} style={{ background: rate >= 3 ? `${tc}22` : t.accentBg, color: rate >= 3 ? tc : t.accent, fontSize: 10, padding: "3px 8px", borderRadius: 6, fontWeight: 700, border: `1px solid ${rate >= 3 ? tc : t.accent}22` }}>
                          {rate}x {cat.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `1px solid ${t.borderL}`, marginTop: "auto" }}>
                  <div style={{ fontSize: 12, color: t.muted }}>
                    Annual fee: <span style={{ color: card.annual_fee === 0 ? t.green : t.text, fontWeight: 700 }}>{card.annual_fee === 0 ? "Free" : `${cc?.sym}${fmt(card.annual_fee)}`}</span>
                  </div>
                  <span style={{ fontSize: 9, color: t.dim, background: t.hover, padding: "2px 6px", borderRadius: 4 }}>2026 ✓</span>
                </div>

                {card.affiliate_url && (
                  <a href={card.affiliate_url} target="_blank" rel="noopener noreferrer"
                    style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, color: "#fff", borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "block", boxShadow: `0 3px 12px ${t.accent}33` }}>
                    Apply Now →
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sweet Spots ──────────────────────────────────────────────────────────────
function Spots({ data, country, cc, t }) {
  const spots = data.spots || [];
  const typeColor = {
    domestic: t.green, transborder: t.accent, transatlantic: "#a855f7",
    transpacific: "#06b6d4", long_haul_india: t.gold, long_haul: "#f97316",
    regional: t.green, south_america: "#ec4899", north_america: t.accent,
    international: "#a855f7",
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, marginBottom: 5 }}>Award Sweet Spots</h2>
        <p style={{ color: t.muted, fontSize: 13 }}>Best value routes for {cc?.name} — ranked by points efficiency in business class.</p>
      </div>

      {spots.length === 0 ? (
        <div style={{ textAlign: "center", color: t.muted, padding: 60 }}>No sweet spot data for this country yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {spots.map((r, i) => {
            const tc = typeColor[r.route_type] || t.accent;
            return (
              <div key={i} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 18, display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 14, alignItems: "start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${tc}22`, border: `1px solid ${tc}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: tc, fontWeight: 800 }}>{i + 1}</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.from_city} → {r.to_city}</span>
                    <span style={{ background: `${tc}22`, color: tc, fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{r.route_type?.replace(/_/g, " ")}</span>
                    {r.distance_km && <span style={{ fontSize: 11, color: t.dim }}>{fmt(r.distance_km)} km</span>}
                  </div>
                  {r.note && <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.6, marginBottom: 4 }}>💡 {r.note}</div>}
                  <div style={{ fontSize: 11, color: t.dim }}>{r.program}</div>
                </div>
                <div style={{ textAlign: "right", minWidth: 110 }}>
                  <div style={{ fontSize: 9, color: t.muted, marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Business</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 21, fontWeight: 700, color: tc }}>{fmt(r.business_points)}</div>
                  <div style={{ fontSize: 10, color: t.dim }}>pts one-way</div>
                  {r.economy_points && <div style={{ fontSize: 11, color: t.muted, marginTop: 3 }}>Econ: {fmt(r.economy_points)}</div>}
                  {r.median_points_business && <div style={{ fontSize: 10, color: t.gold, marginTop: 2 }}>Median: {fmt(r.median_points_business)}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
function ReviewsSection({ t }) {
  return (
    <section style={{ background: t.surface, borderTop: `1px solid ${t.border}`, padding: "48px 24px" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Real journeys, real savings
          </div>
          <div style={{ color: t.muted, fontSize: 14 }}>See how travelers used PointsPath to book smarter</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
          {REVIEWS.map((r, i) => {
            const cc = COUNTRIES.find(c => c.code === r.country);
            return (
              <div key={i} style={{ background: t.card || t.bg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${t.accent},#a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{cc?.flag} {cc?.name}</div>
                  </div>
                </div>

                <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6, marginBottom: 14 }}>"{r.text}"</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ background: t.accentBg, color: t.accent, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>✈ {r.trip}</span>
                  <span style={{ background: t.greenBg, color: t.green, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>🎯 {r.points}</span>
                  <span style={{ background: t.goldBg, color: t.gold, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6 }}>💰 Saved {r.saving}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
function About({ t, cc, setTab, setJourney }) {
  const sections = [
    {
      icon: "✈", title: "Flight Points Calculator", tab: "calculator", color: t.accent,
      desc: "Find out how many reward points you need for any flight — economy to first class. Supports Aeroplan (CA), Chase UR / MileagePlus (US), Flying Returns (IN), and Asia Miles (HK).",
      steps: ["Select your departure and destination city", "Pick cabin class and travel dates", "See base points + seasonal pricing notes", "Jump to Points Gap to plan how to earn them"],
    },
    {
      icon: "🏨", title: "Hotel Points Booking", tab: "hotels", color: "#a855f7",
      desc: "Book hotels using loyalty points from Marriott Bonvoy, Hilton Honors, World of Hyatt, and IHG One Rewards. Fixed award charts — no dynamic pricing surprises.",
      steps: ["Search by destination city and travel dates", "Choose a loyalty program (Marriott, Hilton, Hyatt, IHG)", "Pick your property tier (Budget → Ultra Premium)", "See total points needed + best cards to earn them"],
    },
    {
      icon: "🎯", title: "Points Earning Strategy (Gap)", tab: "gap", color: t.green,
      desc: "Know your points target? This calculator shows exactly how much to spend each month on your card to earn them through everyday purchases — groceries, dining, travel, and more.",
      steps: ["Enter your points target (auto-filled from flight search)", "Choose how many months you have to earn", "Select one or more credit cards to compare", "See monthly spend required + best earning categories per card"],
    },
    {
      icon: "💳", title: "Cards Explorer", tab: "cards", color: t.gold,
      desc: "Browse all top travel rewards cards for your country. Compare welcome bonuses, annual fees, earn rates, and find the right card for your spending profile.",
      steps: ["Sorted by welcome bonus value", "View earn rates by category (groceries, dining, travel)", "Compare annual fees across issuers", "Click Apply Now for eligible cards"],
    },
    {
      icon: "⭐", title: "Award Sweet Spots", tab: "spots", color: "#f97316",
      desc: "Our curated list of the best value redemptions — routes where points go the furthest. Updated annually based on published award charts.",
      steps: ["Ranked by business class points efficiency", "Shows economy and business rates side-by-side", "Includes expert tips for each route", "Use as inspiration for your next trip"],
    },
  ];

  const journeySteps = [
    { n: "1", l: "Search a flight", d: "Use the Flights tab to find your destination and see how many points you need.", tab: "calculator" },
    { n: "2", l: "Plan your hotel", d: "Switch to Hotels, enter your dates, and see points needed for your stay.", tab: "hotels" },
    { n: "3", l: "Calculate the gap", d: "Go to Points Gap and enter your points target. Pick cards to compare earning strategies.", tab: "gap" },
    { n: "4", l: "Choose your card", d: "Browse Cards to find the best fit for your spending. Apply and start earning.", tab: "cards" },
  ];

  return (
    <div className="fade">
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${t.accent}22,#a855f722)`, border: `1px solid ${t.accent}33`, borderRadius: 18, padding: "32px 28px", marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✈ 🏨 💳</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
          Welcome to PointsPath
        </div>
        <div style={{ fontSize: 14, color: t.muted, maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.7 }}>
          PointsPath helps you maximize your travel rewards — whether you're flying across the country or booking a luxury hotel with points.
          It covers <strong style={{ color: t.text }}>Canada 🇨🇦, USA 🇺🇸, India 🇮🇳, and Hong Kong 🇭🇰</strong>.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setTab("calculator")}
            style={{ background: `linear-gradient(135deg,${t.accent},#a855f7)`, border: "none", borderRadius: 11, padding: "12px 22px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Start Searching Flights →
          </button>
          <button onClick={() => setJourney(null)}
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 11, padding: "12px 18px", color: t.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Set Up My Journey
          </button>
        </div>
      </div>

      {/* How the Journey works */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 6 }}>How the Journey works</div>
        <div style={{ fontSize: 13, color: t.muted, marginBottom: 20 }}>Follow these 4 steps to go from zero to booking your dream trip with points.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {journeySteps.map(s => (
            <button key={s.n} onClick={() => setTab(s.tab)}
              style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: 13, padding: 18, textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${t.accent},#a855f7)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 6 }}>{s.l}</div>
              <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{s.d}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Section-by-section guide */}
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 14 }}>What's in each section</div>
      <div style={{ display: "grid", gap: 14, marginBottom: 28 }}>
        {sections.map(s => (
          <div key={s.tab} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>Tab: <span style={{ color: s.color }}>{s.tab}</span></div>
                </div>
              </div>
              <button onClick={() => setTab(s.tab)}
                style={{ background: `${s.color}22`, border: `1px solid ${s.color}44`, borderRadius: 8, padding: "6px 14px", color: s.color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                Open →
              </button>
            </div>
            <div style={{ fontSize: 13, color: t.muted, marginBottom: 12, lineHeight: 1.6 }}>{s.desc}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {s.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: s.color, fontWeight: 700, fontSize: 12, minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 16 }}>Frequently Asked Questions</div>
        {[
          { q: "Is this data real?", a: "Yes — award charts are sourced from published airline and hotel loyalty program tables. Dynamic pricing notes (like Aeroplan) are flagged clearly. Data is verified in 2026." },
          { q: "Do I need an account?", a: "No — all calculators work without signing in. Create an account to save your journey settings across devices." },
          { q: "What's the difference between earn rates and welcome bonuses?", a: "A welcome bonus is a one-time points burst when you meet a spending threshold (typically in the first 3 months). Earn rates are ongoing — you earn X points per dollar on every purchase. The Points Gap tab focuses on earning strategy, not welcome bonuses." },
          { q: "Which credit cards are supported?", a: "We cover the top travel rewards cards for each country: ~22 CA cards, ~24 US cards, ~18 IN cards, and ~12 HK cards. Cards tab shows them all." },
          { q: "How do I pick the best card?", a: "Start with the Sweet Spots tab to find your target route. Then use Points Gap to model how long each card takes to earn the required points. The card with the highest earn rate in your top spending category usually wins." },
          { q: "Can I use hotel + flight points together?", a: "Yes — plan your flight first (Flights tab), then your hotel (Hotels tab). Add both point totals in the Points Gap calculator to model the full trip." },
        ].map((faq, i) => (
          <div key={i} style={{ borderBottom: i < 5 ? `1px solid ${t.borderL}` : "none", paddingBottom: i < 5 ? 14 : 0, marginBottom: i < 5 ? 14 : 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 5 }}>Q: {faq.q}</div>
            <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.6 }}>{faq.a}</div>
          </div>
        ))}
      </div>

      {/* Countries */}
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 14 }}>Supported Countries</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {[
            { flag: "🇨🇦", name: "Canada", program: "Aeroplan", sym: "C$", cards: 22, routes: "200+" },
            { flag: "🇺🇸", name: "USA",    program: "Chase UR / MileagePlus", sym: "$", cards: 24, routes: "180+" },
            { flag: "🇮🇳", name: "India",  program: "Flying Returns / Air India", sym: "₹", cards: 18, routes: "140+" },
            { flag: "🇭🇰", name: "Hong Kong", program: "Asia Miles", sym: "HK$", cards: 12, routes: "90+" },
          ].map(c => (
            <div key={c.name} style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 26, marginBottom: 7 }}>{c.flag}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginBottom: 7 }}>{c.program}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: t.accentBg, color: t.accent, fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>{c.cards} cards</span>
                <span style={{ background: t.greenBg, color: t.green, fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>{c.routes} routes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared label style ───────────────────────────────────────────────────────
const lbl = {
  display: "block", fontSize: 10, color: "#8888aa", marginBottom: 5,
  fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
};
