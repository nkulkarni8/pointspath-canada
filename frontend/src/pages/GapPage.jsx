import { useEffect, useRef, useState } from "react";
import DataDisclaimer from "../components/DataDisclaimer";
import { SkeletonBlock } from "../components/Skeleton";
import { SPEND_PROPS } from "../constants";
import { useApp } from "../context/AppContext";
import { CARD_EARNING_RATES } from "../data/earningRates";
import { calculateGap, track } from "../lib/api";
import { fmt } from "../lib/format";
import { useValuations } from "../lib/useProgramData";
import { GRADIENT, inputStyle, lbl, radius, space, text } from "../theme";

export default function GapPage() {
  const { data, country, cc, t, journey, tripResult } = useApp();
  const inp = inputStyle(t);

  const [needed,     setNeeded]     = useState("");
  const [havePoints, setHavePoints] = useState("");
  const [months,     setMonths]     = useState(6);
  const [cardIds,    setCardIds]    = useState(new Set());
  const [results,    setResults]    = useState([]);
  const [wallet,        setWallet]        = useState(null);
  const [walletLoading, setWalletLoading]  = useState(false);

  const cards = data.cards || [];
  const prevTripRef = useRef(null);
  const valuations = useValuations(cards.map(c => c.program));

  useEffect(() => {
    if (tripResult && tripResult !== prevTripRef.current) {
      prevTripRef.current = tripResult;
      setNeeded(String(tripResult.base_points));
    }
  }, [tripResult]);

  useEffect(() => {
    if (journey?.cardId && cardIds.size === 0) setCardIds(new Set([journey.cardId]));
  }, [journey?.cardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalNeeded = Number(needed)     || 0;
  const existing    = Number(havePoints) || 0;
  const netNeeded   = Math.max(0, totalNeeded - existing);
  const pct         = totalNeeded > 0 ? Math.min(100, Math.round(existing / totalNeeded * 100)) : 0;
  const alreadyDone = pct >= 100;

  const toggleCard = (id) => {
    setCardIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const buildStrategy = (card) => {
    const rates = CARD_EARNING_RATES[card?.name] || { general: 1.5 };
    const rateVals = Object.values(rates).filter(v => v >= 1).sort((a, b) => b - a);
    const avg = rateVals.length >= 2
      ? rateVals[0] * 0.4 + rateVals[1] * 0.3 + (rateVals.slice(2).reduce((s, v) => s + v, 0) || rateVals[1]) * 0.3 / Math.max(rateVals.length - 2, 1)
      : rateVals[0] || 1.5;

    const monthly_pts   = netNeeded > 0 ? Math.ceil(netNeeded / months) : 0;
    const monthly_spend = netNeeded > 0 ? Math.round(netNeeded / months / avg) : 0;

    const sorted = Object.entries(rates).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]);
    let allocated = 0;
    const plan = sorted.map(([cat, rate]) => {
      const prop = SPEND_PROPS[cat] || SPEND_PROPS.general;
      const spend = Math.round(monthly_spend * prop);
      allocated += spend;
      return { cat, rate, spend, pts: Math.round(spend * rate) };
    });
    // Any rounding remainder lands in the lowest-earning category.
    const remainder = Math.max(0, monthly_spend - allocated);
    if (remainder > 0 && plan.length > 0) plan[plan.length - 1].spend += remainder;

    const tips = [];
    if (sorted[0] && sorted[0][1] >= 4) tips.push(`Max out ${sorted[0][1]}x on ${sorted[0][0].replace(/_/g,' ')} — put every ${sorted[0][0].replace(/_/g,' ')} purchase on this card.`);
    if (sorted[1] && sorted[1][1] >= 2) tips.push(`Also use for ${sorted[1][0].replace(/_/g,' ')} at ${sorted[1][1]}x to hit your monthly target faster.`);
    if (avg < 2) tips.push("This card has a moderate earn rate. Consider pairing it with a higher-category card (e.g. 5x groceries).");
    if (months <= 3) tips.push("Short timeline — focus spending on your highest-earn category exclusively to maximize efficiency.");

    const topCats = sorted.filter(([, v]) => v >= 2).slice(0, 4);

    return {
      card_id: card?.id, card_name: card?.name || "Card", program: card?.program,
      total_target: totalNeeded, existing, net_needed: netNeeded,
      avg_earn_rate: Math.round(avg * 10) / 10,
      monthly_pts, monthly_spend,
      total_spend: monthly_spend * months,
      plan, tips, topCats,
    };
  };

  const calc = () => {
    if (!needed || cardIds.size === 0) return;
    const res = [...cardIds]
      .map(cid => cards.find(c => c.id === cid))
      .filter(Boolean)
      .map(buildStrategy);
    setResults(res);
    setWallet(null);
    track("calculate_gap", { country, points_needed: netNeeded });

    // Additive: when 2+ cards are selected, also ask the backend for a combined
    // wallet plan. This is purely additive — any failure here must never affect
    // the per-card results above.
    if (cardIds.size >= 2) {
      setWalletLoading(true);
      calculateGap({
        points_needed: totalNeeded, points_current: existing,
        timeline_months: months, card_ids: [...cardIds], country,
      })
        .then(d => setWallet(d?.wallet_strategy || null))
        .catch(() => setWallet(null))
        .finally(() => setWalletLoading(false));
    }
  };

  const canCalc = needed && cardIds.size > 0;
  const ranked = [...results].sort((a, b) => a.monthly_spend - b.monthly_spend);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: text.xl.size, lineHeight: text.xl.lh, marginBottom: 5 }}>Points Earning Strategy</h1>
        <p style={{ color: t.muted, fontSize: 13 }}>Set your points goal, enter what you already have, and get a clear monthly spending plan — broken down by category.</p>
      </div>

      {tripResult && (
        <div className="fade" style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, borderRadius: 11, padding: "11px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: t.accent, fontSize: 14 }}>✈</span>
          <span style={{ fontSize: 13, color: t.muted }}>
            Pre-filled from flight: <strong style={{ color: t.text }}>{tripResult.route}</strong> — <strong style={{ color: t.accent }}>{fmt(tripResult.base_points)}</strong> pts
          </span>
        </div>
      )}

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <label htmlFor="gap-needed" style={lbl}>Points Goal <span style={{ color: t.dim, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(total needed)</span></label>
            <input id="gap-needed" type="number" value={needed} onChange={e => { setNeeded(e.target.value); setResults([]); }}
              placeholder="e.g. 80,000" style={inp} />
          </div>
          <div>
            <label htmlFor="gap-have" style={lbl}>Points You Already Have <span style={{ color: t.dim, textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
            <input id="gap-have" type="number" value={havePoints} onChange={e => { setHavePoints(e.target.value); setResults([]); }}
              placeholder="Leave blank if none" style={inp} />
          </div>
          <div>
            <label htmlFor="gap-months" style={lbl}>Earn Over</label>
            <select id="gap-months" value={months} onChange={e => { setMonths(Number(e.target.value)); setResults([]); }} style={inp}>
              {[3,4,5,6,9,12,18,24].map(n => <option key={n} value={n}>{n} months</option>)}
            </select>
          </div>
        </div>

        {totalNeeded > 0 && existing > 0 && (
          <div className="fade" style={{ background: t.hover, borderRadius: 12, padding: "13px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>Progress toward goal</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? t.green : t.accent }}>{pct}% complete</span>
            </div>
            <div style={{ background: t.border, borderRadius: 8, height: 10, overflow: "hidden", marginBottom: 10 }}>
              <div className="pbar" style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? t.green : GRADIENT(t), borderRadius: 8 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { l: "You have", v: fmt(existing),    c: t.green  },
                { l: "Still need", v: fmt(netNeeded), c: t.accent },
                { l: "Total goal", v: fmt(totalNeeded), c: t.text },
              ].map(s => (
                <div key={s.l} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginTop: 2, textTransform: "uppercase", letterSpacing: ".05em", fontWeight: 700 }}>{s.l}</div>
                </div>
              ))}
            </div>
            {alreadyDone && (
              <div style={{ marginTop: 12, background: t.greenBg, border: `1px solid ${t.green}44`, borderRadius: 9, padding: "9px 14px", fontSize: 13, color: t.green, fontWeight: 700, textAlign: "center" }}>
                🎉 You already have enough points to book! Ready to go.
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={lbl}>Select Cards to Compare <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0, color: t.dim }}>— pick one or more</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 7, maxHeight: 240, overflowY: "auto", padding: "2px" }}>
            {cards.map(card => {
              const sel = cardIds.has(card.id);
              const rates = CARD_EARNING_RATES[card.name];
              const topRate = rates ? Math.max(...Object.values(rates)) : null;
              return (
                <button key={card.id} onClick={() => { toggleCard(card.id); setResults([]); }}
                  style={{ background: sel ? t.accentBg : t.hover, border: `2px solid ${sel ? t.accent : t.border}`, borderRadius: 10, padding: "10px 12px", color: t.text, cursor: "pointer", fontSize: 11, fontWeight: 600, textAlign: "left", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5, transition: "all .15s" }}>
                  <div style={{ color: sel ? t.accent : t.text, marginBottom: 3 }}>{sel ? "✓ " : ""}{card.name}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {topRate && <span style={{ background: sel ? `${t.accent}33` : t.surface, color: sel ? t.accent : t.muted, fontSize: 10, padding: "1px 6px", borderRadius: 4 }}>Up to {topRate}x</span>}
                    <span style={{ color: t.dim, fontSize: 10 }}>{card.issuer}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={calc} disabled={!canCalc || alreadyDone}
          style={{ width: "100%", background: canCalc && !alreadyDone ? GRADIENT(t) : t.border, border: "none", borderRadius: 12, padding: "14px", color: "#fff", fontSize: 15, fontWeight: 700, cursor: canCalc && !alreadyDone ? "pointer" : "default", fontFamily: "'DM Sans',sans-serif", boxShadow: canCalc && !alreadyDone ? `0 4px 18px ${t.accent}44` : "none", transition: "all .2s" }}>
          {alreadyDone ? "You have enough points ✓" : "Generate Spending Strategy →"}
        </button>
      </div>

      {ranked.length > 0 && !alreadyDone && (
        <div className="slide">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, color: t.muted }}>
              Strategy to earn <strong style={{ color: t.text }}>{fmt(netNeeded)} pts</strong> in <strong style={{ color: t.text }}>{months} months</strong>
            </div>
            {ranked.length > 1 && (
              <span style={{ fontSize: 11, color: t.muted }}>Comparing {ranked.length} cards — lowest monthly spend wins</span>
            )}
          </div>

          {ranked.map((res, idx) => (
            <div key={res.card_id || idx} className="sc" style={{ background: t.surface, border: `1px solid ${idx === 0 && ranked.length > 1 ? t.accent : t.border}`, borderRadius: 16, padding: 22, marginBottom: 16, position: "relative" }}>
              {idx === 0 && ranked.length > 1 && (
                <div style={{ position: "absolute", top: -10, left: 18, background: GRADIENT(t), color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, letterSpacing: ".05em" }}>BEST VALUE</div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{res.card_name}</div>
                  <div style={{ fontSize: 12, color: t.muted }}>Avg {res.avg_earn_rate}x earn rate · {months}-month plan · {fmt(res.monthly_pts)} pts/month needed</div>
                </div>
                <div style={{ background: `linear-gradient(135deg,${t.accent}18,${t.gold}18)`, border: `1px solid ${t.accent}33`, borderRadius: 12, padding: "11px 18px", textAlign: "right", minWidth: 130 }}>
                  <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Monthly Spend</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: t.accent }}>{cc?.sym}{fmt(res.monthly_spend)}</div>
                  <div style={{ fontSize: 10, color: t.muted, marginTop: 1 }}>→ {fmt(res.monthly_pts)} pts/mo</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 10, marginBottom: 18 }}>
                {[
                  { l: "Total Spend",   v: `${cc?.sym}${fmt(res.total_spend)}`, c: t.accent,  i: "💳" },
                  { l: "Points Earned", v: fmt(res.net_needed),                 c: t.green,   i: "🎯",
                    sub: (() => {
                      const val = valuations[res.program];
                      if (!val || !res.net_needed) return null;
                      const lo = Math.round(res.net_needed * val.floor / 100), hi = Math.round(res.net_needed * val.ceiling / 100);
                      return `≈ $${fmt(lo)}–$${fmt(hi)} est. value`;
                    })() },
                  { l: "Timeline",      v: `${months} months`,                  c: t.series[2], i: "📅" },
                  { l: "Avg Earn Rate", v: `${res.avg_earn_rate}x`,             c: t.gold,    i: "⚡" },
                ].map(s => (
                  <div key={s.l} style={{ background: `${s.c}12`, border: `1px solid ${s.c}28`, borderRadius: 11, padding: "12px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.i}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: t.muted, marginTop: 2, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{s.l}</div>
                    {s.sub && <div data-testid="points-value-estimate" title="Estimate from cents-per-point valuation range; not a guaranteed redemption value." style={{ fontSize: 10, color: t.muted, marginTop: 3 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              <div style={{ background: t.hover, borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 14 }}>
                  Monthly Spending Plan — {cc?.sym}{fmt(res.monthly_spend)}/month total
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {res.plan.filter(p => p.spend > 0).map((p, i) => {
                    const barW = res.monthly_spend > 0 ? Math.round(p.spend / res.monthly_spend * 100) : 0;
                    const cols = t.series;
                    const col  = cols[i % cols.length];
                    return (
                      <div key={p.cat}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: t.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ textTransform: "capitalize" }}>{p.cat.replace(/_/g, " ")}</span>
                            <span style={{ background: `${col}22`, color: col, fontSize: 10, padding: "1px 7px", borderRadius: 5, fontWeight: 700 }}>{p.rate}x</span>
                          </span>
                          <span style={{ fontSize: 12, color: t.muted }}>
                            <strong style={{ color: t.text, fontFamily: "'DM Sans',sans-serif" }}>{cc?.sym}{fmt(p.spend)}</strong>/mo
                            <span style={{ margin: "0 4px", color: t.dim }}>→</span>
                            <strong style={{ color: col }}>{fmt(p.pts)} pts</strong>
                          </span>
                        </div>
                        <div style={{ background: t.border, borderRadius: 5, height: 6, overflow: "hidden" }}>
                          <div className="pbar" style={{ width: `${barW}%`, height: "100%", background: col, borderRadius: 5 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${t.borderL}`, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: t.muted }}>Total monthly spend</span>
                  <strong style={{ color: t.text }}>{cc?.sym}{fmt(res.monthly_spend)} → {fmt(res.monthly_pts)} pts/month</strong>
                </div>
              </div>

              {res.tips.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                  {res.tips.map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: t.accentBg, border: `1px solid ${t.accent}22`, borderRadius: 9, padding: "9px 12px" }}>
                      <span style={{ fontSize: 14, minWidth: 18 }}>💡</span>
                      <span style={{ fontSize: 12, color: t.muted, lineHeight: 1.55 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

              {res.topCats.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Best Earn Categories</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {res.topCats.map(([cat, rate]) => (
                      <span key={cat} style={{ background: t.accentBg, border: `1px solid ${t.accent}33`, color: t.accent, fontSize: 11, padding: "4px 11px", borderRadius: 7, fontWeight: 700 }}>
                        {rate}x {cat.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {cardIds.size >= 2 && (walletLoading || wallet) && (
            <div className="sc" style={{ background: t.surface, border: `1px solid ${t.gold}`, borderRadius: radius.lg, padding: space.lg + 2, marginBottom: space.lg - 4, position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: 18, background: GRADIENT(t), color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 10, letterSpacing: ".05em" }}>COMBINED WALLET PLAN</div>

              {walletLoading && (
                <div aria-busy="true" aria-live="polite">
                  <SkeletonBlock t={t} height={18} width="50%" style={{ marginBottom: space.md }} />
                  <SkeletonBlock t={t} height={60} radius={radius.md} />
                </div>
              )}

              {!walletLoading && wallet && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: space.md + 2, flexWrap: "wrap", gap: space.sm + 2 }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: text.lg.size, fontWeight: 700, marginBottom: 2 }}>
                        Using all {wallet.card_names?.length || 0} cards together
                      </div>
                      <div style={{ fontSize: text.sm.size - 1, color: t.muted }}>
                        {wallet.card_names?.join(" + ")} · avg {wallet.avg_earn_rate}x across categories
                      </div>
                    </div>
                    <div style={{ background: `linear-gradient(135deg,${t.gold}18,${t.warn}18)`, border: `1px solid ${t.gold}33`, borderRadius: radius.md + 1, padding: "11px 18px", textAlign: "right", minWidth: 130 }}>
                      <div style={{ fontSize: 9, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>Monthly Spend</div>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: text["2xl"].size - 2, fontWeight: 700, color: t.gold }}>{cc?.sym}{fmt(wallet.monthly_spend_needed)}</div>
                      <div style={{ fontSize: 10, color: t.muted, marginTop: 1 }}>→ {fmt(wallet.monthly_points_earned)} pts/mo</div>
                    </div>
                  </div>

                  {wallet.budget_warning && (
                    <div style={{ background: `${t.warn}18`, border: `1px solid ${t.warn}44`, borderRadius: radius.sm + 2, padding: space.md - 2, marginBottom: space.md, fontSize: text.sm.size, color: t.warn }}>
                      ⚠ {wallet.budget_warning}
                    </div>
                  )}

                  {wallet.category_breakdown?.length > 0 && (
                    <div style={{ background: t.hover, borderRadius: radius.md + 1, padding: space.md + 4 }}>
                      <div style={{ fontSize: text.xs.size, color: t.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: space.md + 2 }}>
                        Best card per category
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: space.sm + 2 }}>
                        {wallet.category_breakdown.map((c, i) => (
                          <div key={c.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: space.sm, flexWrap: "wrap" }}>
                            <span style={{ fontSize: text.sm.size - 1, color: t.text, fontWeight: 600, textTransform: "capitalize" }}>
                              {c.category.replace(/_/g, " ")}
                              <span style={{ background: `${t.gold}22`, color: t.gold, fontSize: 10, padding: "1px 7px", borderRadius: 5, fontWeight: 700, marginLeft: space.xs + 2 }}>{c.multiplier}x</span>
                            </span>
                            <span style={{ fontSize: text.sm.size - 1, color: t.muted }}>
                              {cc?.sym}{fmt(c.monthly_spend)}/mo on <strong style={{ color: t.text }}>{c.best_card_name}</strong>
                              <span style={{ margin: "0 4px", color: t.dim }}>→</span>
                              <strong style={{ color: t.gold }}>{fmt(c.monthly_points)} pts</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <DataDisclaimer t={t} />
    </div>
  );
}
