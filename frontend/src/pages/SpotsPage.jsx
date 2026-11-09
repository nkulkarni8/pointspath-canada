import { useEffect, useState } from "react";
import DataDisclaimer from "../components/DataDisclaimer";
import { AllianceBadge } from "../components/ValueBits";
import { useApp } from "../context/AppContext";
import { getAlliance, getCuratedSweetSpots } from "../lib/api";
import { fmt } from "../lib/format";
import { radius, space, text } from "../theme";

/** Loads editorial picks plus an alliance lookup per distinct program. Failures yield []. */
function useEditorsPicks() {
  const [picks, setPicks] = useState([]);
  const [alliances, setAlliances] = useState({});
  useEffect(() => {
    let cancelled = false;
    getCuratedSweetSpots().then(list => {
      if (cancelled) return;
      setPicks(list);
      [...new Set(list.map(p => p.program).filter(Boolean))].forEach(prog => {
        getAlliance(prog).then(a => { if (!cancelled && a) setAlliances(prev => ({ ...prev, [prog]: a })); });
      });
    });
    return () => { cancelled = true; };
  }, []);
  return { picks, alliances };
}

export default function SpotsPage() {
  const { data, cc, t } = useApp();
  const spots = data.spots || [];
  const { picks, alliances } = useEditorsPicks();
  const tierColor = { legendary: t.gold, excellent: t.green, good: t.muted };

  const typeColor = {
    domestic: t.green, transborder: t.series[4], transatlantic: t.series[2],
    transpacific: t.series[3], long_haul_india: t.gold, long_haul: t.series[3],
    regional: t.green, south_america: t.series[6], north_america: t.series[4],
    international: t.series[2],
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 23, marginBottom: 5 }}>Award Sweet Spots</h1>
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

      {picks.length > 0 && (
        <section aria-labelledby="editors-picks-h" style={{ marginTop: space.xl }}>
          <h2 id="editors-picks-h" style={{ fontFamily: "'Playfair Display',serif", fontSize: text.lg.size, marginBottom: space.xs + 1 }}>Editor's Picks</h2>
          <p style={{ color: t.muted, fontSize: text.sm.size, marginBottom: space.md + 2, lineHeight: text.sm.lh }}>
            Curated editorial redemptions chosen from published travel-hacking guides. These are not computed
            from PointsPath's route data — the list above is. Availability and pricing change; verify before booking.
          </p>
          <div style={{ display: "grid", gap: space.md }}>
            {picks.map((p, i) => {
              const tc = tierColor[p.tier] || t.muted;
              return (
                <article key={`${p.name}-${i}`} style={{ background: t.surface, border: `1px solid ${t.border}`, borderLeft: `3px solid ${tc}`, borderRadius: radius.md, padding: space.md + 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: space.sm, flexWrap: "wrap", marginBottom: space.xs + 1 }}>
                    <span style={{ background: `${tc}18`, color: tc, border: `1px solid ${tc}44`, fontSize: text.xs.size, fontWeight: 700, padding: "2px 8px", borderRadius: radius.sm - 3, textTransform: "uppercase", letterSpacing: ".06em" }}>{p.tier}</span>
                    <h3 style={{ fontSize: text.base.size + 1, fontWeight: 700 }}>{p.name}</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: space.sm, flexWrap: "wrap", fontSize: text.sm.size, color: t.muted, marginBottom: space.sm }}>
                    <span>{p.program}{p.cabin ? ` · ${p.cabin}` : ""}</span>
                    <AllianceBadge t={t} alliance={alliances[p.program]} />
                    {p.cost_range && <strong style={{ color: t.text }}>{p.cost_range}</strong>}
                  </div>
                  {p.why && <p style={{ fontSize: text.sm.size, color: t.text, lineHeight: 1.6, marginBottom: space.sm }}>{p.why}</p>}
                  {p.transfer_partners?.length > 0 && (
                    <div style={{ fontSize: text.xs.size + 1, color: t.muted, marginBottom: space.xs + 2 }}>
                      <strong>Transfer from:</strong> {p.transfer_partners.join(", ")}
                    </div>
                  )}
                  {p.caveats?.length > 0 && (
                    <ul style={{ fontSize: text.xs.size + 1, color: t.muted, paddingLeft: space.lg, lineHeight: 1.6 }}>
                      {p.caveats.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <DataDisclaimer t={t} />
    </div>
  );
}
