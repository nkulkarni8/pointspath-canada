import { useApp } from "../context/AppContext";
import { GRADIENT } from "../theme";

export default function AboutPage() {
  const { t, go, setJourney } = useApp();

  const sections = [
    {
      icon: "✈", title: "Flight Points Calculator", path: "/calculator", color: t.accent,
      desc: "Find out how many reward points you need for any flight — economy to first class. Supports Aeroplan (CA), Chase UR / MileagePlus (US), Flying Returns (IN), and Asia Miles (HK).",
      steps: ["Select your departure and destination city", "Pick cabin class and travel dates", "See base points + seasonal pricing notes", "Jump to Points Gap to plan how to earn them"],
    },
    {
      icon: "🏨", title: "Hotel Points Booking", path: "/hotels", color: t.series[2],
      desc: "Book hotels using loyalty points from Marriott Bonvoy, Hilton Honors, World of Hyatt, and IHG One Rewards. Fixed award charts — no dynamic pricing surprises.",
      steps: ["Search by destination city and travel dates", "Choose a loyalty program (Marriott, Hilton, Hyatt, IHG)", "Pick your property tier (Budget → Ultra Premium)", "See total points needed + best cards to earn them"],
    },
    {
      icon: "🎯", title: "Points Earning Strategy (Gap)", path: "/gap", color: t.green,
      desc: "Know your points target? This calculator shows exactly how much to spend each month on your card to earn them through everyday purchases — groceries, dining, travel, and more.",
      steps: ["Enter your points target (auto-filled from flight search)", "Choose how many months you have to earn", "Select one or more credit cards to compare", "See monthly spend required + best earning categories per card"],
    },
    {
      icon: "💳", title: "Cards Explorer", path: "/cards", color: t.gold,
      desc: "Browse all top travel rewards cards for your country. Compare welcome bonuses, annual fees, earn rates, and find the right card for your spending profile.",
      steps: ["Sorted by welcome bonus value", "View earn rates by category (groceries, dining, travel)", "Compare annual fees across issuers", "Click Apply Now for eligible cards"],
    },
    {
      icon: "⭐", title: "Award Sweet Spots", path: "/spots", color: t.series[3],
      desc: "Our curated list of the best value redemptions — routes where points go the furthest. Updated annually based on published award charts.",
      steps: ["Ranked by business class points efficiency", "Shows economy and business rates side-by-side", "Includes expert tips for each route", "Use as inspiration for your next trip"],
    },
  ];

  const journeySteps = [
    { n: "1", l: "Search a flight", d: "Use the Flights tab to find your destination and see how many points you need.", path: "/calculator" },
    { n: "2", l: "Plan your hotel", d: "Switch to Hotels, enter your dates, and see points needed for your stay.", path: "/hotels" },
    { n: "3", l: "Calculate the gap", d: "Go to Points Gap and enter your points target. Pick cards to compare earning strategies.", path: "/gap" },
    { n: "4", l: "Choose your card", d: "Browse Cards to find the best fit for your spending. Apply and start earning.", path: "/cards" },
  ];

  const faqs = [
    { q: "Is this data real?", a: "Yes — award charts are sourced from published airline and hotel loyalty program tables. Dynamic pricing notes (like Aeroplan) are flagged clearly. Data is verified in 2026." },
    { q: "Do I need an account?", a: "The calculators require a free sign-in with a 6-digit email code — no password. Your journey settings then follow you across devices." },
    { q: "What's the difference between earn rates and welcome bonuses?", a: "A welcome bonus is a one-time points burst when you meet a spending threshold (typically in the first 3 months). Earn rates are ongoing — you earn X points per dollar on every purchase. The Points Gap tab focuses on earning strategy, not welcome bonuses." },
    { q: "Which credit cards are supported?", a: "We cover the top travel rewards cards for each country: ~22 CA cards, ~24 US cards, ~18 IN cards, and ~12 HK cards. Cards tab shows them all." },
    { q: "How do I pick the best card?", a: "Start with the Sweet Spots tab to find your target route. Then use Points Gap to model how long each card takes to earn the required points. The card with the highest earn rate in your top spending category usually wins." },
    { q: "Can I use hotel + flight points together?", a: "Yes — plan your flight first (Flights tab), then your hotel (Hotels tab). Add both point totals in the Points Gap calculator to model the full trip." },
    { q: "Can I install PointsPath on my phone?", a: "Yes. PointsPath is a progressive web app — open it in your mobile browser and choose 'Add to Home Screen'. It then launches full screen and keeps previously loaded routes and cards available offline." },
  ];

  return (
    <div className="fade">
      <div style={{ background: `linear-gradient(135deg,${t.accent}14,${t.gold}22)`, border: `1px solid ${t.accent}33`, borderRadius: 18, padding: "32px 28px", marginBottom: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✈ 🏨 💳</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
          Welcome to PointsPath
        </h1>
        <div style={{ fontSize: 14, color: t.muted, maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.7 }}>
          PointsPath helps you maximize your travel rewards — whether you're flying across the country or booking a luxury hotel with points.
          It covers <strong style={{ color: t.text }}>Canada 🇨🇦, USA 🇺🇸, India 🇮🇳, and Hong Kong 🇭🇰</strong>.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => go("/calculator")}
            style={{ background: GRADIENT(t), border: "none", borderRadius: 11, padding: "12px 22px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Start Searching Flights →
          </button>
          <button onClick={() => { setJourney(null); go("/calculator"); }}
            style={{ background: "transparent", border: `1px solid ${t.border}`, borderRadius: 11, padding: "12px 18px", color: t.muted, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
            Set Up My Journey
          </button>
        </div>
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 6 }}>How the Journey works</div>
        <div style={{ fontSize: 13, color: t.muted, marginBottom: 20 }}>Follow these 4 steps to go from zero to booking your dream trip with points.</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {journeySteps.map(s => (
            <button key={s.n} onClick={() => go(s.path)}
              style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: 13, padding: 18, textAlign: "left", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: GRADIENT(t), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, marginBottom: 6 }}>{s.l}</div>
              <div style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{s.d}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 14 }}>What's in each section</div>
      <div style={{ display: "grid", gap: 14, marginBottom: 28 }}>
        {sections.map(s => (
          <div key={s.path} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: t.muted }}>Tab: <span style={{ color: s.color }}>{s.path.replace("/", "")}</span></div>
                </div>
              </div>
              <button onClick={() => go(s.path)}
                style={{ background: `${s.color}22`, border: `1px solid ${s.color}44`, borderRadius: 8, padding: "6px 14px", color: s.color, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                Open →
              </button>
            </div>
            <div style={{ fontSize: 13, color: t.muted, marginBottom: 12, lineHeight: 1.6 }}>{s.desc}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {s.steps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: s.color, fontWeight: 700, fontSize: 12, minWidth: 18 }}>{i + 1}.</span>
                  <span style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 16 }}>Frequently Asked Questions</div>
        {faqs.map((faq, i) => {
          const last = i === faqs.length - 1;
          return (
            <div key={i} style={{ borderBottom: last ? "none" : `1px solid ${t.borderL}`, paddingBottom: last ? 0 : 14, marginBottom: last ? 0 : 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 5 }}>Q: {faq.q}</div>
              <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, marginBottom: 14 }}>Supported Countries</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
          {[
            { flag: "🇨🇦", name: "Canada", program: "Aeroplan", cards: 22, routes: "200+" },
            { flag: "🇺🇸", name: "USA",    program: "Chase UR / MileagePlus", cards: 24, routes: "180+" },
            { flag: "🇮🇳", name: "India",  program: "Flying Returns / Air India", cards: 18, routes: "140+" },
            { flag: "🇭🇰", name: "Hong Kong", program: "Asia Miles", cards: 12, routes: "90+" },
          ].map(c => (
            <div key={c.name} style={{ background: t.hover, border: `1px solid ${t.borderL}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 26, marginBottom: 7 }}>{c.flag}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: t.muted, marginBottom: 7 }}>{c.program}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ background: t.accentBg, color: t.accent, fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>{c.cards} cards</span>
                <span style={{ background: t.greenBg, color: t.green, fontSize: 10, padding: "2px 7px", borderRadius: 5, fontWeight: 700 }}>{c.routes} routes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
