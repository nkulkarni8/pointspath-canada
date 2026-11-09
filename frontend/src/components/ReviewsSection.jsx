import { COUNTRIES, REVIEWS } from "../constants";
import { useApp } from "../context/AppContext";
import { GRADIENT } from "../theme";

export default function ReviewsSection() {
  const { t } = useApp();

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
            const rc = COUNTRIES.find(c => c.code === r.country);
            return (
              <div key={i} style={{ background: t.card || t.bg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: GRADIENT(t), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{r.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: t.muted }}>{rc?.flag} {rc?.name}</div>
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
