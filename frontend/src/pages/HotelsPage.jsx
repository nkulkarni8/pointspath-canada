import { useMemo, useState } from "react";
import DataDisclaimer from "../components/DataDisclaimer";
import { ValuationChip } from "../components/ValueBits";
import { HOTEL_DESTINATIONS } from "../constants";
import { useApp } from "../context/AppContext";
import { fmt } from "../lib/format";
import { GRADIENT, inputStyle, lbl, text } from "../theme";

/** Programs without a published per-night chart ship with categories: [] (or omit the key). */
const categoriesOf = (h) => (Array.isArray(h?.categories) ? h.categories : []);
const hasChart = (h) => categoriesOf(h).length > 0;

export default function HotelsPage() {
  const { data, country, cc, t, go } = useApp();
  const inp = inputStyle(t);
  const hotels = data.hotels || [];

  const [destination, setDestination] = useState("");
  const [checkIn,  setCheckIn]  = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests,   setGuests]   = useState(2);
  const [searched, setSearched] = useState(false);

  const [progId,  setProgId]  = useState(null);
  const [tierIdx, setTierIdx] = useState(0);
  const [result,  setResult]  = useState(null);

  const prog = hotels.find(h => h.id === progId);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diff = (new Date(checkOut) - new Date(checkIn)) / 86400000;
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const changeCheckIn = (value) => {
    setCheckIn(value);
    // Default to a 3-night stay so the points estimate has something to work with.
    if (value && !checkOut) {
      const d = new Date(value);
      d.setDate(d.getDate() + 3);
      setCheckOut(d.toISOString().split("T")[0]);
    }
  };

  const search = () => {
    if (!destination || !checkIn || !checkOut) return;
    setSearched(true);
    setProgId(null);
    setResult(null);
  };

  const calculate = () => {
    if (!prog) return;
    const cat = categoriesOf(prog)[tierIdx];
    if (!cat) return;
    const total = cat.points_per_night * (nights || 1);
    setResult({ nights: nights || 1, points_per_night: cat.points_per_night, total_points: total, category: cat });
  };

  const tierColors = t.series;
  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: text.xl.size, lineHeight: text.xl.lh, marginBottom: 5 }}>Hotel Points Booking</h1>
        <p style={{ color: t.muted, fontSize: 13 }}>Search your stay, pick a loyalty program, and see exactly how many points you need.</p>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 16 }}>Where are you staying?</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label htmlFor="hotel-dest" style={lbl}>Destination</label>
            <select id="hotel-dest" value={destination} onChange={e => setDestination(e.target.value)} style={inp}>
              <option value="">Select city / resort</option>
              {HOTEL_DESTINATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="hotel-checkin" style={lbl}>Check-in</label>
            <input id="hotel-checkin" type="date" value={checkIn} onChange={e => changeCheckIn(e.target.value)} min={today} style={inp} />
          </div>
          <div>
            <label htmlFor="hotel-checkout" style={lbl}>Check-out</label>
            <input id="hotel-checkout" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || today} style={inp} />
          </div>
          <div>
            <label htmlFor="hotel-guests" style={lbl}>Guests</label>
            <select id="hotel-guests" value={guests} onChange={e => setGuests(Number(e.target.value))} style={{ ...inp, minWidth: 80 }}>
              {[1,2,3,4].map(n => <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>

        {nights > 0 && (
          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: t.accentBg, color: t.accent, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 6 }}>
              {nights} night{nights > 1 ? "s" : ""}
            </span>
            {destination && <span style={{ fontSize: 12, color: t.muted }}>in {destination}</span>}
          </div>
        )}

        <button onClick={search} disabled={!destination || !checkIn || !checkOut}
          style={{ marginTop: 16, background: destination && checkIn && checkOut ? GRADIENT(t) : t.border, border: "none", borderRadius: 11, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: destination && checkIn && checkOut ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif" }}>
          Search Hotels →
        </button>
      </div>

      {searched && (
        <div className="fade">
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 4 }}>
              Points programs for {destination}
            </div>
            <div style={{ fontSize: 12, color: t.muted }}>{nights} night{nights > 1 ? "s" : ""} · {guests} guest{guests > 1 ? "s" : ""} · Select a loyalty program to see points cost</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12, marginBottom: 24 }}>
            {hotels.map(h => {
              const minPts = categoriesOf(h)[0]?.points_per_night || 0;
              const sel = progId === h.id;
              return (
                <button key={h.id} onClick={() => { setProgId(h.id); setTierIdx(0); setResult(null); }}
                  style={{ background: sel ? t.accentBg : t.surface, border: `2px solid ${sel ? t.accent : t.border}`, borderRadius: 14, padding: 18, cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div style={{ fontSize: 26 }}>{h.logo}</div>
                    {sel && <span style={{ background: t.accent, color: t.onAccent, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>SELECTED</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: sel ? t.accent : t.text, marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginBottom: 8, lineHeight: 1.4 }}>{h.description}</div>
                  <div style={{ fontSize: 11, color: sel ? t.accent : t.muted }}>
                    {hasChart(h) ? <>From <strong>{fmt(minPts)}</strong> pts/night</> : "No published per-night chart"}
                  </div>
                  {h.points_value_cpp && <div style={{ marginTop: 8 }}><ValuationChip t={t} valuation={h.points_value_cpp} /></div>}
                </button>
              );
            })}
          </div>

          {prog && !hasChart(prog) && (
            <div className="fade" data-testid="no-chart-panel" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 6 }}>{prog.logo} {prog.name}</div>
              {prog.description && <p style={{ fontSize: 13, color: t.muted, marginBottom: 10, lineHeight: 1.6 }}>{prog.description}</p>}
              <p style={{ fontSize: 12, color: t.muted, marginBottom: 12 }}>
                {prog.name} does not publish a fixed per-night award chart, so there is no category calculator for it. Check the program's site for live point prices.
              </p>
              {prog.points_value_cpp && <div style={{ marginBottom: 12 }}><ValuationChip t={t} valuation={prog.points_value_cpp} /></div>}
              {prog.sweet_spot && (
                <div style={{ background: t.goldBg, border: `1px solid ${t.gold}33`, borderRadius: 8, padding: "7px 12px", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: t.gold, fontWeight: 700, marginBottom: 2 }}>💡 Sweet Spot</div>
                  <div style={{ fontSize: 12, color: t.muted }}>{prog.sweet_spot}</div>
                </div>
              )}
              {prog.transfer_programs?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Transfer Partners</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {prog.transfer_programs.map((tp, i) => (
                      <span key={i} style={{ background: t.greenBg, border: `1px solid ${t.green}33`, borderRadius: 7, padding: "4px 10px", fontSize: 12, color: t.green }}>{tp}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {prog && hasChart(prog) && (
            <div className="fade">
              <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{prog.logo} {prog.name} — Choose Property Type <ValuationChip t={t} valuation={prog.points_value_cpp} /></div>
                <div style={{ fontSize: 12, color: t.muted, marginBottom: 16 }}>Award charts are fixed — not subject to dynamic pricing (except Hilton)</div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 9, marginBottom: 18 }}>
                  {categoriesOf(prog).map((cat, i) => {
                    const tc = tierColors[i % tierColors.length];
                    const sel = tierIdx === i;
                    return (
                      <button key={i} onClick={() => { setTierIdx(i); setResult(null); }}
                        style={{ background: sel ? `${tc}22` : t.hover, border: `2px solid ${sel ? tc : t.border}`, borderRadius: 11, padding: 12, cursor: "pointer", textAlign: "center", fontFamily: "'DM Sans',sans-serif", transition: "all .15s" }}>
                        <div style={{ fontSize: 9, color: tc, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{cat.tier}</div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: tc }}>{fmt(cat.points_per_night)}</div>
                        <div style={{ fontSize: 9, color: t.dim }}>pts/night</div>
                        <div style={{ fontSize: 10, color: t.muted, marginTop: 4, lineHeight: 1.4 }}>{cat.label}</div>
                        <div style={{ fontSize: 9, color: t.dim, marginTop: 3, lineHeight: 1.3 }}>{cat.example}</div>
                      </button>
                    );
                  })}
                </div>

                <button onClick={calculate}
                  style={{ background: GRADIENT(t), border: "none", borderRadius: 11, padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Calculate Points Needed →
                </button>
              </div>

              {result && (
                <div className="fade">
                  <div style={{ background: t.surface, border: `2px solid ${t.accent}44`, borderRadius: 14, padding: 22, marginBottom: 16 }}>
                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, marginBottom: 3 }}>Your stay in {destination}</div>
                        <div style={{ fontSize: 12, color: t.muted }}>{result.category.tier} · {result.category.label} · {result.nights} night{result.nights > 1 ? "s" : ""} · {guests} guest{guests > 1 ? "s" : ""}</div>
                      </div>
                      {prog.sweet_spot && (
                        <div style={{ background: t.goldBg, border: `1px solid ${t.gold}33`, borderRadius: 8, padding: "7px 12px", maxWidth: 260 }}>
                          <div style={{ fontSize: 10, color: t.gold, fontWeight: 700, marginBottom: 2 }}>💡 Sweet Spot</div>
                          <div style={{ fontSize: 11, color: t.muted }}>{prog.sweet_spot}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 18 }}>
                      {[
                        { l: "Total Points", v: fmt(result.total_points), c: t.accent, i: "🎯" },
                        { l: "Per Night",    v: fmt(result.points_per_night), c: t.gold,   i: "🌙" },
                        { l: "Nights",       v: result.nights,             c: t.green,  i: "📅" },
                        { l: "Guests",       v: guests,                    c: t.series[2], i: "👤" },
                      ].map(s => (
                        <div key={s.l} style={{ background: `${s.c}14`, border: `1px solid ${s.c}33`, borderRadius: 11, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 20, marginBottom: 4 }}>{s.i}</div>
                          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
                          <div style={{ fontSize: 10, color: t.muted, marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: t.hover, borderRadius: 9, padding: "9px 14px", fontSize: 12, color: t.muted, marginBottom: 16 }}>
                      🏨 Example hotels: <strong style={{ color: t.text }}>{result.category.example}</strong>
                    </div>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button onClick={() => go("/gap")}
                        style={{ background: GRADIENT(t), border: "none", borderRadius: 10, padding: "11px 20px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        Earn {fmt(result.total_points)} pts →
                      </button>
                      <button onClick={() => go("/cards")}
                        style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 10, padding: "11px 16px", color: t.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                        Browse cards
                      </button>
                    </div>
                  </div>

                  {prog.earn_cards?.[country] && (
                    <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, marginBottom: 12 }}>Best cards to earn {prog.name} points</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                        {prog.earn_cards[country].map((cardName, i) => {
                          const card = (data.cards || []).find(c => c.name === cardName);
                          return (
                            <div key={i} style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 9, padding: "8px 14px" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: t.accent }}>{cardName}</div>
                              {card && <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>Welcome: {fmt(card.welcome_bonus)} pts · Fee: {cc?.sym}{fmt(card.annual_fee)}</div>}
                            </div>
                          );
                        })}
                      </div>
                      {prog.transfer_programs?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 7 }}>Transfer Partners</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {prog.transfer_programs.map((tp, i) => (
                              <span key={i} style={{ background: t.greenBg, border: `1px solid ${t.green}33`, borderRadius: 7, padding: "4px 10px", fontSize: 12, color: t.green }}>{tp}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div>
          <div style={{ fontSize: 12, color: t.muted, marginBottom: 14 }}>Available loyalty programs — search above to compare points for your stay</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
            {hotels.map(h => {
              const hc = categoriesOf(h);
              const minPts = hc[0]?.points_per_night || 0;
              const maxPts = hc[hc.length - 1]?.points_per_night || 0;
              return (
                <div key={h.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 13, padding: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{h.logo}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{h.name}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginBottom: 8, lineHeight: 1.4 }}>{h.description}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>
                    {hc.length > 0 ? <><span style={{ color: t.green, fontWeight: 700 }}>{fmt(minPts)}</span> – <span style={{ color: t.danger, fontWeight: 700 }}>{fmt(maxPts)}</span> pts/night</> : "No published per-night chart"}
                  </div>
                  {h.points_value_cpp && <div style={{ marginTop: 6 }}><ValuationChip t={t} valuation={h.points_value_cpp} /></div>}
                  {h.sweet_spot && <div style={{ fontSize: 10, color: t.gold, marginTop: 6, lineHeight: 1.4 }}>💡 {h.sweet_spot}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <DataDisclaimer t={t} />
    </div>
  );
}
