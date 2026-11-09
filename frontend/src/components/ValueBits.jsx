import { radius, text } from "../theme";

const chip = (t, color) => ({
  display: "inline-flex", alignItems: "center", gap: 4, fontSize: text.xs.size, fontWeight: 600,
  color, background: `${color}14`, border: `1px solid ${color}33`,
  borderRadius: radius.sm - 2, padding: "2px 7px", lineHeight: text.xs.lh,
});

/** Quiet "≈ 1.5–2.1¢/pt" chip. Renders nothing without a valuation. */
export function ValuationChip({ t, valuation }) {
  if (!valuation) return null;
  return (
    <span data-testid="valuation-chip" style={chip(t, t.gold)}
      title="Valuation: floor = conservative estimate, ceiling = optimistic. Sourced from published valuation guides.">
      ≈{valuation.floor}–{valuation.ceiling}¢/pt
    </span>
  );
}

/** "Star Alliance · Air Canada" badge. Renders nothing without a match. */
export function AllianceBadge({ t, alliance }) {
  if (!alliance) return null;
  return (
    <span data-testid="alliance-badge" style={chip(t, t.muted)} title={alliance.note || undefined}>
      {alliance.alliance}{alliance.airline ? ` · ${alliance.airline}` : ""}
    </span>
  );
}
