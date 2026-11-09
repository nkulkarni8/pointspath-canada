import { useMemo, useState } from "react";
import DataDisclaimer from "../components/DataDisclaimer";
import { ValuationChip } from "../components/ValueBits";
import { ISSUER_HOMEPAGES } from "../constants";
import { useApp } from "../context/AppContext";
import { track } from "../lib/api";
import { fmt } from "../lib/format";
import { useValuations } from "../lib/useProgramData";
import { GRADIENT, inputStyle, text } from "../theme";

export default function CardsPage() {
  const { data, country, cc, t } = useApp();
  const inp = inputStyle(t);
  const [search, setSearch] = useState("");
  const cards = data.cards || [];
  const programs = useMemo(() => cards.map(c => c.program), [cards]);
  const valuations = useValuations(programs);

  // Most recent last_updated across all cards, for the page-level badge.
  const lastUpdated = useMemo(() => cards.map(c => c.last_updated).find(Boolean) || null, [cards]);

  const filtered = useMemo(() =>
    cards.filter(c => !search
      || c.name?.toLowerCase().includes(search.toLowerCase())
      || c.issuer?.toLowerCase().includes(search.toLowerCase())),
    [cards, search]
  );

  const tierColor = { premium: t.gold, mid: t.accent, entry: t.green };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: text.xl.size, lineHeight: text.xl.lh, marginBottom: 5 }}>Explore Cards</h1>
        <p style={{ color: t.muted, fontSize: 13 }}>{cards.length} cards{lastUpdated ? ` · Updated ${lastUpdated}` : ""}</p>
      </div>

      <label htmlFor="cards-search" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>Search cards or issuers</label>
      <input id="cards-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cards or issuers…"
        style={{ ...inp, maxWidth: 300, marginBottom: 18 }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {filtered.map((card, i) => {
          const tc = tierColor[card.tier] || t.accent;
          return (
            <div key={card.id || i} className="sc" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ height: 4, background: `linear-gradient(90deg,${tc},${tc}88)` }} />
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35, marginBottom: 3, paddingRight: 8 }}>{card.name}</div>
                    <div style={{ fontSize: 11, color: t.muted, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span>{card.issuer} · {card.program}</span>
                      <ValuationChip t={t} valuation={valuations[card.program]} />
                    </div>
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
                  <span style={{ fontSize: 9, color: t.dim, background: t.hover, padding: "2px 6px", borderRadius: 4 }}>{card.last_updated ? `✓ ${card.last_updated}` : "✓ Verified"}</span>
                </div>

                {card.affiliate_url ? (
                  <a href={card.affiliate_url} target="_blank" rel="noopener noreferrer sponsored"
                    onClick={() => track("affiliate_click", { country, card: card.name })}
                    style={{ background: GRADIENT(t), color: "#fff", borderRadius: 10, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "block", boxShadow: `0 3px 12px ${t.accent}33` }}>
                    Apply Now →
                  </a>
                ) : ISSUER_HOMEPAGES[card.issuer] ? (
                  <a href={ISSUER_HOMEPAGES[card.issuer]} target="_blank" rel="noopener noreferrer"
                    style={{ color: t.muted, fontSize: 12, textAlign: "center", padding: "6px", textDecoration: "underline" }}>
                    Learn more at {card.issuer} →
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <DataDisclaimer t={t} lastUpdated={lastUpdated} />
    </div>
  );
}
