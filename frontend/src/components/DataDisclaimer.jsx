import { space, text } from "../theme";

/** Shown near the bottom of data-driven pages (calculator, gap, cards, hotels, spots). */
export default function DataDisclaimer({ t, lastUpdated }) {
  return (
    <div style={{
      marginTop: space.lg, padding: `${space.md}px ${space.lg}px`,
      fontSize: text.xs.size, lineHeight: text.xs.lh, color: t.dim,
      borderTop: `1px solid ${t.borderL}`,
    }}>
      Rates and award charts shown here are estimates based on published programs and may
      change — always verify with the issuer or airline before booking.
      {lastUpdated && <span> Last updated: {lastUpdated}.</span>}
      <div style={{ marginTop: 6 }}>
        Valuations, transfer ratios, alliances and editorial picks adapted from the open-source
        borski/travel-hacking-toolkit (MIT) and published valuation guides (The Points Guy,
        Upgraded Points, One Mile at a Time, View From The Wing); rates change — verify before booking.
      </div>
    </div>
  );
}
