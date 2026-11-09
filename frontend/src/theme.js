// Shared visual language: colour tokens plus the field styles derived from them.

export const T = {
  dark: {
    bg: "#0C0A09", surface: "#1C1917", hover: "#292524",
    border: "#44403C", borderL: "#292524",
    text: "#FAFAF9", muted: "#A8A29E", dim: "#8F8984",
    accent: "#D9A441", accentBg: "#D9A4411f", onAccent: "#1C1917",
    gold: "#E3B454", goldBg: "#E3B4541f",
    green: "#4ADE80", greenBg: "#4ADE8021",
    warn: "#FBBF24", danger: "#F87171", card: "#171413",
    // Categorical series (charts, tags) — muted, no purple.
    series: ["#D9A441", "#4ADE80", "#5EEAD4", "#FB923C", "#93C5FD", "#D6D3D1", "#FCA5A5", "#BEF264"],
    // Gradient stops for primary CTAs (white text must clear 4.5:1 on both).
    cta: ["#A16207", "#854D0E"],
  },
  light: {
    bg: "#FAFAF9", surface: "#FFFFFF", hover: "#F5F5F4",
    border: "#D6D3D1", borderL: "#E7E5E4",
    text: "#1C1917", muted: "#475569", dim: "#6B645F",
    accent: "#1C1917", accentBg: "#1C191710", onAccent: "#FFFFFF",
    gold: "#A16207", goldBg: "#A1620714",
    green: "#15803D", greenBg: "#15803D14",
    warn: "#B45309", danger: "#DC2626", card: "#FFFFFF",
    series: ["#A16207", "#15803D", "#0F766E", "#9A3412", "#1E40AF", "#57534E", "#BE123C", "#4D7C0F"],
    cta: ["#1C1917", "#44403C"],
  },
};

// Spacing scale (px) — matches the gap/padding values already in use across pages.
export const space = { xs: 4, sm: 8, md: 12, lg: 20, xl: 32 };

// Corner-radius scale (px).
export const radius = { sm: 8, md: 11, lg: 16 };

// Type scale (px) with matching line-heights.
export const text = {
  xs:   { size: 11, lh: 1.4 },
  sm:   { size: 13, lh: 1.5 },
  base: { size: 14, lh: 1.5 },
  lg:   { size: 17, lh: 1.4 },
  xl:   { size: 23, lh: 1.3 },
  "2xl": { size: 28, lh: 1.25 },
  "3xl": { size: 34, lh: 1.2 },
};

// Restrained primary-CTA treatment: near-black to charcoal (light), deep gold (dark).
// White text clears 4.5:1 on every stop.
export const GRADIENT = (t) => `linear-gradient(135deg,${t.cta[0]},${t.cta[1]})`;

export function inputStyle(t) {
  return {
    width: "100%", background: t.hover, border: `1px solid ${t.border}`,
    borderRadius: radius.sm, padding: `${space.sm + 4}px ${space.md + 2}px`, color: t.text,
    fontSize: text.base.size, lineHeight: text.base.lh,
    fontFamily: "'DM Sans', sans-serif",
  };
}

export const lbl = {
  display: "block", fontSize: text.xs.size, color: "var(--pp-muted, #475569)", marginBottom: space.xs + 1,
  fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
};
