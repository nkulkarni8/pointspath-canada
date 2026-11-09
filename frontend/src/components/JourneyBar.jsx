import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fmt } from "../lib/format";

const STEPS = [
  { path: "/calculator", label: "1. Find Flight" },
  { path: "/hotels",     label: "2. Find Hotel" },
  { path: "/gap",        label: "3. Points Gap" },
  { path: "/cards",      label: "4. Card Strategy" },
];

export default function JourneyBar() {
  const { journey, setJourney, tripResult, data, t, go } = useApp();
  const { pathname } = useLocation();

  const card = (data.cards || []).find(c => c.id === journey.cardId);

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
          {STEPS.map((s, i) => {
            const done = s.path === "/calculator" && !!tripResult;
            const active = pathname === s.path;
            return (
              <div key={s.path} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <button onClick={() => go(s.path)}
                  style={{ background: done ? t.greenBg : active ? t.accentBg : "transparent", border: `1px solid ${done ? t.green + "44" : active ? t.accent + "44" : t.border}`, borderRadius: 7, padding: "4px 11px", color: done ? t.green : active ? t.accent : t.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                  {done ? "✓ " : ""}{s.label}
                </button>
                {i < STEPS.length - 1 && <span style={{ color: t.dim, fontSize: 11 }}>→</span>}
              </div>
            );
          })}
        </div>
      </div>
      <button onClick={() => setJourney(null)} aria-label="Edit journey"
        style={{ background: "transparent", border: "none", color: t.dim, fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
        Edit ✎
      </button>
    </div>
  );
}
