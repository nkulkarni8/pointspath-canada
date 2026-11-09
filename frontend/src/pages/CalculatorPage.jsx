import { useEffect, useMemo, useState } from "react";
import CitySelect from "../components/CitySelect";
import DataDisclaimer from "../components/DataDisclaimer";
import { SkeletonBlock } from "../components/Skeleton";
import JourneySetup from "../components/JourneySetup";
import { AllianceBadge } from "../components/ValueBits";
import { CABINS, CABIN_CODES, CABIN_CODE_HINT, MONTHS } from "../constants";
import { useApp } from "../context/AppContext";
import { calculatePoints, getAlliance, getStopovers, track } from "../lib/api";
import { fmt, seasonBadge } from "../lib/format";
import { GRADIENT, inputStyle, lbl, radius, space, text } from "../theme";

export default function CalculatorPage() {
  const { data, country, cc, t, journey, setTripResult, go } = useApp();
  const inp = inputStyle(t);

  const cities = data.cities || {};
  const routesMap = cities.routes_map || {};
  // If from_cities is empty but to_cities has data (older backend), use both.
  const allCities = [...new Set([...(cities.from_cities || []), ...(cities.to_cities || [])])].sort();
  const fromCities = (cities.from_cities || []).length > 0 ? cities.from_cities : allCities;
  const allToCities = (cities.to_cities || []).length > 0 ? cities.to_cities : allCities;

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
  const [alliance, setAlliance] = useState(null);
  const [stopovers, setStopovers] = useState(null);

  // Valid To cities: narrow by routes_map once a From city is chosen.
  const validToCities = useMemo(() => {
    if (!from) return allToCities.filter(c => c !== from);
    return (routesMap[from] || allToCities).filter(c => c !== from);
  }, [from, routesMap, allToCities]);

  const sb = seasonBadge(month);

  // Supplementary reference data for the result's program. Null = render nothing.
  const resProgram = res?.program;
  useEffect(() => {
    let cancelled = false;
    setAlliance(null); setStopovers(null);
    if (!resProgram) return undefined;
    getAlliance(resProgram).then(a => { if (!cancelled) setAlliance(a); });
    getStopovers(resProgram).then(s => { if (!cancelled) setStopovers(s); });
    return () => { cancelled = true; };
  }, [resProgram]);

  useEffect(() => {
    if (journey?.to && allToCities.includes(journey.to) && !to) setTo(journey.to);
  }, [journey?.to, allToCities.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeFrom = (value) => {
    setFrom(value);
    // Drop the destination when it is no longer reachable from the new origin.
    if (to && routesMap[value] && !routesMap[value].includes(to)) setTo("");
  };

  const changeDepDate = (value) => {
    setDepDate(value);
    if (value) setMonth(new Date(value).getMonth() + 1);
  };

  const calc = async () => {
    if (!from || !to) return;
    setLoading(true); setErr(null); setRes(null);
    try {
      const d = await calculatePoints({
        from_city: from, to_city: to, travel_class: cabin, passengers: pax,
        country, ...(month ? { month } : {}),
      });
      // Return-trip doubling stays a frontend concern — the server only prices one-way.
      const result = { ...d, return_trip: !!retDate, return_date: retDate, depart_date: depDate };
      if (retDate) {
        result.base_points = d.base_points * 2;
        if (d.median_points) result.median_points = d.median_points * 2;
      }
      setRes(result); setTripResult(result);
      track("calculate_points", { country, from, to, class: cabin });
    } catch (e) {
      setErr(e.message || "Could not reach the server. Please check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      {!journey?.setup && <JourneySetup />}

      <div style={{ marginBottom: space.lg }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: text.xl.size, lineHeight: text.xl.lh, marginBottom: space.xs + 1 }}>Flight Points Calculator</h1>
        <p style={{ color: t.muted, fontSize: text.sm.size }}>Find how many points you need — Aeroplan, Asia Miles, MileagePlus, Flying Returns.</p>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius.lg - 2, padding: space.lg + 2, marginBottom: space.lg }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md + 2, marginBottom: space.md + 2 }}>
          <div>
            <label htmlFor="calc-from" style={lbl}>From</label>
            <CitySelect id="calc-from" value={from} onChange={e => changeFrom(e.target.value)}
              cities={fromCities} placeholder="Select departure city" style={inp} />
          </div>
          <div>
            <label htmlFor="calc-to" style={lbl}>To {from && validToCities.length > 0 && <span style={{ color: t.accent, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({validToCities.length} destinations)</span>}</label>
            <CitySelect id="calc-to" value={to} onChange={e => setTo(e.target.value)}
              cities={validToCities} placeholder="Select destination" style={inp} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md + 2, marginBottom: space.md + 2 }}>
          <div>
            <label htmlFor="calc-depart" style={lbl}>Departure Date</label>
            <input id="calc-depart" type="date" value={depDate} onChange={e => changeDepDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label htmlFor="calc-return" style={lbl}>Return Date <span style={{ color: t.dim, fontWeight: 400 }}>(optional)</span></label>
            <input id="calc-return" type="date" value={retDate} onChange={e => setRetDate(e.target.value)} min={depDate} style={inp} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: space.md + 2, marginBottom: space.md + 4 }}>
          <div>
            <label htmlFor="calc-cabin" style={lbl}>Cabin Class</label>
            <select id="calc-cabin" value={cabin} onChange={e => setCabin(e.target.value)} style={inp} title={CABIN_CODE_HINT} aria-describedby="calc-cabin-hint">
              {CABINS.map(c => <option key={c.v} value={c.v}>{c.i} {c.l}</option>)}
            </select>
            <div id="calc-cabin-hint" title={CABIN_CODE_HINT} style={{ fontSize: text.xs.size, color: t.muted, marginTop: 4 }}>
              Award code: {CABIN_CODES[cabin]} = {CABINS.find(c => c.v === cabin)?.l.replace(" Class", "")}
            </div>
          </div>
          <div>
            <label htmlFor="calc-pax" style={lbl}>Passengers</label>
            <select id="calc-pax" value={pax} onChange={e => setPax(Number(e.target.value))} style={inp}>
              {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? "passenger" : "passengers"}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="calc-month" style={lbl}>Travel Month</label>
            <select id="calc-month" value={month} onChange={e => setMonth(Number(e.target.value))} style={inp}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        {sb && (
          <div style={{ marginBottom: space.md + 2, padding: `${space.sm + 1}px ${space.md + 1}px`, background: `${sb.c}18`, border: `1px solid ${sb.c}40`, borderRadius: radius.sm + 1, display: "flex", alignItems: "center", gap: space.sm + 2 }}>
            <span style={{ background: sb.c, color: "#fff", fontSize: text.xs.size, fontWeight: 700, padding: "2px 8px", borderRadius: 5 }}>{sb.l}</span>
            <span style={{ color: t.muted, fontSize: text.sm.size }}>{sb.tip}</span>
          </div>
        )}

        <button onClick={calc} disabled={!from || !to || loading}
          style={{ width: "100%", background: from && to ? GRADIENT(t) : t.border, border: "none", borderRadius: radius.md, padding: "13px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: from && to ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", opacity: loading ? .7 : 1 }}>
          {loading ? "Searching…" : "Search Points →"}
        </button>
      </div>

      {err && (
        <div role="alert" style={{ background: `${t.danger}18`, border: `1px solid ${t.danger}55`, borderRadius: radius.md, padding: space.md + 2, color: t.danger, fontSize: text.base.size }}>
          ⚠ {err}
        </div>
      )}

      {loading && !res && (
        <div aria-busy="true" aria-live="polite" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: radius.lg - 2, padding: space.lg + 2 }}>
          <SkeletonBlock t={t} height={18} width="40%" style={{ marginBottom: space.md + 2 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.md + 2 }}>
            <SkeletonBlock t={t} height={90} radius={radius.lg - 3} />
            <SkeletonBlock t={t} height={90} radius={radius.lg - 3} />
          </div>
        </div>
      )}

      {res && !err && (
        <div className="fade" style={{ background: t.surface, border: `1px solid ${t.accent}44`, borderRadius: radius.lg - 2, padding: space.lg + 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.lg - 2, flexWrap: "wrap", gap: space.sm + 2 }}>
            <div>
              <div style={{ fontSize: text.sm.size - 1, color: t.muted, marginBottom: 3, display: "flex", alignItems: "center", gap: space.sm, flexWrap: "wrap" }}>
                <span>{res.program || cc?.program}</span>
                <AllianceBadge t={t} alliance={alliance} />
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700 }}>{res.route}</div>
              <div style={{ fontSize: text.sm.size, color: t.muted, marginTop: 3 }}>
                {pax} pax · {CABINS.find(c => c.v === cabin)?.l}
                {depDate && ` · ${new Date(depDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
                {retDate && ` → ${new Date(retDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`}
              </div>
            </div>
            <div style={{ fontSize: text.xs.size, color: t.accent, fontWeight: 600 }}>
              {res.last_updated ? `✓ Updated ${res.last_updated}` : "✓ Verified"}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: res.median_points ? "1fr 1fr" : "1fr", gap: space.md + 2, marginBottom: space.md + 4 }}>
            <div style={{ background: t.accentBg, border: `1px solid ${t.accent}40`, borderRadius: radius.lg - 3, padding: space.lg - 2, textAlign: "center" }}>
              <div style={{ fontSize: text.xs.size, color: t.muted, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>
                {res.is_dynamic ? "Starting At" : "Points Required"}
                {retDate && " (Round Trip)"}
              </div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: text["3xl"].size, fontWeight: 700, color: t.accent }}>{fmt(res.base_points)}</div>
              {pax > 1 && <div style={{ fontSize: text.sm.size - 1, color: t.muted, marginTop: 3 }}>{fmt(res.base_points_per_person)} × {pax}{retDate ? " × 2" : ""}</div>}
            </div>
            {res.median_points && (
              <div style={{ background: t.goldBg, border: `1px solid ${t.gold}44`, borderRadius: radius.lg - 3, padding: space.lg - 2, textAlign: "center" }}>
                <div style={{ fontSize: text.xs.size, color: t.gold, marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Realistic Median</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: text["3xl"].size, fontWeight: 700, color: t.gold }}>{fmt(res.median_points)}</div>
                <div style={{ fontSize: text.xs.size, color: t.muted, marginTop: 3 }}>Dynamic pricing — actual may vary</div>
              </div>
            )}
          </div>

          {res.is_dynamic && (
            <div style={{ background: `${t.warn}18`, border: `1px solid ${t.warn}44`, borderRadius: radius.sm + 2, padding: space.md, marginBottom: space.md, fontSize: text.sm.size, color: t.warn }}>
              Dynamic pricing: Minimum shown — actual cost varies by availability. Book early for lowest rates.
            </div>
          )}
          {res.seasonal_note && (
            <div style={{ background: t.hover, borderRadius: radius.sm + 2, padding: space.md - 1, marginBottom: space.md, fontSize: text.sm.size, color: t.muted }}>📅 {res.seasonal_note}</div>
          )}
          {res.route_note && (
            <div style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: radius.md, padding: space.md + 1, marginBottom: space.md + 4, fontSize: text.sm.size, color: t.muted, lineHeight: 1.6 }}>
              💡 <strong style={{ color: t.text }}>Expert tip:</strong> {res.route_note}
            </div>
          )}

          {stopovers && (
            <div data-testid="stopover-note" style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: radius.md, padding: space.md + 1, marginBottom: space.md + 4, fontSize: text.sm.size, color: t.muted, lineHeight: 1.6 }}>
              <strong style={{ color: t.text }}>Stopover tip:</strong> {resProgram} allows {stopovers.max_stopovers_one_way} stopover{stopovers.max_stopovers_one_way === 1 ? "" : "s"} each way
              {stopovers.max_duration_days ? ` (up to ${stopovers.max_duration_days} days)` : ""}
              {stopovers.surcharge_points != null ? ` for ${fmt(stopovers.surcharge_points) === "—" ? "no extra" : fmt(stopovers.surcharge_points)} points` : ""}
              {stopovers.restrictions ? ` — ${String(stopovers.restrictions).replace(/[.\s]+$/, "")}` : ""}.
            </div>
          )}

          <div style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: radius.md + 1, padding: space.md + 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space.md }}>
            <div>
              <div style={{ fontSize: text.sm.size, fontWeight: 700, color: t.accent }}>Need {fmt(res.base_points)} points?</div>
              <div style={{ fontSize: text.xs.size, color: t.muted, marginTop: 3 }}>See how much you need to spend — with your welcome bonus.</div>
            </div>
            <button onClick={() => go("/gap")}
              style={{ background: GRADIENT(t), border: "none", borderRadius: radius.sm + 2, padding: "11px 20px", color: "#fff", fontSize: text.sm.size, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
              Calculate Gap →
            </button>
          </div>
        </div>
      )}

      <DataDisclaimer t={t} lastUpdated={res?.last_updated} />
    </div>
  );
}
