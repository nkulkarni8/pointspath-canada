import { useState } from "react";
import { useApp } from "../context/AppContext";
import { inputStyle, GRADIENT, lbl as label } from "../theme";
import CitySelect from "./CitySelect";

export default function JourneySetup() {
  const { data, t, setJourney } = useApp();
  const [to, setTo] = useState("");
  const [pts, setPts] = useState("");
  const [cardId, setCardId] = useState(null);

  const inp = inputStyle(t);
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
          <label htmlFor="journey-to" style={label}>Where do you want to go?</label>
          <CitySelect id="journey-to" value={to} onChange={e => setTo(e.target.value)}
            cities={toCities} placeholder="Select destination" style={inp} />
        </div>
        <div>
          <label htmlFor="journey-pts" style={label}>Points you have now</label>
          <input id="journey-pts" type="number" value={pts} onChange={e => setPts(e.target.value)}
            placeholder="e.g. 15000" style={inp} />
        </div>
        <div>
          <label htmlFor="journey-card" style={label}>Your card (or target card)</label>
          <select id="journey-card" value={cardId || ""} onChange={e => setCardId(Number(e.target.value) || null)} style={inp}>
            <option value="">Select card (optional)</option>
            {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => setJourney({ to, currentPoints: Number(pts) || 0, cardId, setup: true })}
          disabled={!to}
          style={{ background: to ? GRADIENT(t) : t.border, border: "none", borderRadius: 11, padding: "12px 22px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: to ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif" }}>
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
