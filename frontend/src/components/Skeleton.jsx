// Placeholder blocks shown while a country's datasets load, so the layout
// settles in place instead of jumping when the data lands.

export function SkeletonBlock({ t, height = 16, width = "100%", radius = 8, style }) {
  return (
    <div
      className="pp-shimmer"
      style={{ height, width, borderRadius: radius, background: t.hover, ...style }}
    />
  );
}

export function SkeletonPage({ t, cards = 3 }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
        Loading…
      </span>
      <div style={{ marginBottom: 20 }}>
        <SkeletonBlock t={t} height={26} width="42%" style={{ marginBottom: 10 }} />
        <SkeletonBlock t={t} height={14} width="66%" />
      </div>
      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <SkeletonBlock t={t} height={44} radius={10} />
          <SkeletonBlock t={t} height={44} radius={10} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <SkeletonBlock t={t} height={44} radius={10} />
          <SkeletonBlock t={t} height={44} radius={10} />
          <SkeletonBlock t={t} height={44} radius={10} />
        </div>
        <SkeletonBlock t={t} height={46} radius={11} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {Array.from({ length: cards }, (_, i) => (
          <SkeletonBlock key={i} t={t} height={150} radius={16} />
        ))}
      </div>
    </div>
  );
}
