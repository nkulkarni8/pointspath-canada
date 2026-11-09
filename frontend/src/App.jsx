import { useState } from "react";
import { NavLink, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import LoginModal from "./components/auth/LoginModal";
import RequireAuth from "./components/auth/RequireAuth";
import InstallButton from "./components/InstallButton";
import JourneyBar from "./components/JourneyBar";
import OfflineBanner from "./components/OfflineBanner";
import ReviewsSection from "./components/ReviewsSection";
import { SkeletonPage } from "./components/Skeleton";
import { COUNTRIES, TABS } from "./constants";
import { AppProvider, useApp } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";
import { track } from "./lib/api";
import AboutPage from "./pages/AboutPage";
import CalculatorPage from "./pages/CalculatorPage";
import CardsPage from "./pages/CardsPage";
import GapPage from "./pages/GapPage";
import HotelsPage from "./pages/HotelsPage";
import SpotsPage from "./pages/SpotsPage";
import { GRADIENT } from "./theme";

function GlobalStyle({ t }) {
  return (
    <style>{`
      :root{--pp-muted:${t.muted};--pp-focus:${t.gold}}
      *{box-sizing:border-box;margin:0;padding:0}
      @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes progressFill{from{width:0}to{width:var(--target-w,100%)}}
      @keyframes ppShimmer{0%{opacity:.45}50%{opacity:.9}100%{opacity:.45}}
      .fade{animation:fadeIn .35s ease}
      .slide{animation:slideUp .4s ease}
      .pp-shimmer{animation:ppShimmer 1.4s ease-in-out infinite}
      .cbtn:hover{transform:translateY(-2px)}
      input:focus,select:focus,button:focus-visible,a:focus-visible{outline:none;border-color:${t.accent}!important;box-shadow:0 0 0 3px ${t.accent}44!important}
      input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
      ::-webkit-scrollbar{width:5px;height:5px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:${t.border};border-radius:3px}
      .sc{transition:box-shadow .2s,transform .2s}
      .sc:hover{box-shadow:0 8px 30px ${t.accent}22!important;transform:translateY(-2px)}
      .pbar{animation:progressFill .6s ease forwards}
      .tab:hover{color:${t.accent}!important}
      select option{background:${t.surface};color:${t.text}}
      .cc-label{display:inline}
      @media (max-width:700px){.cc-label{display:none}}
      @media (max-width:480px){
        body{font-size:13px}
        main{padding:16px 14px!important}
        h1{font-size:19px!important}
      }
      @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
      .skip-link{position:absolute;left:-9999px;top:0;background:${t.accent};color:${t.onAccent};padding:12px 16px;border-radius:0 0 8px 0;z-index:1000;font-size:13px;font-weight:700;text-decoration:none}
      .skip-link:focus{left:0}
    `}</style>
  );
}

function Layout() {
  const { t, cc, country, changeCountry, dark, setDark, journey, isLoading, loadingVis, withCountry } = useApp();
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'DM Sans',sans-serif" }}>
      <GlobalStyle t={t} />

      <a href="#main-content" className="skip-link">Skip to content</a>

      <header style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: GRADIENT(t), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>✈</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 19, fontWeight: 700 }}>PointsPath</div>
            <div style={{ fontSize: 10, color: t.muted, letterSpacing: "0.07em", textTransform: "uppercase" }}>Rewards Intelligence · 2026</div>
          </div>
        </div>

        <nav aria-label="Country" style={{ display: "flex", gap: 4, background: t.hover, padding: 4, borderRadius: 12, border: `1px solid ${t.border}` }}>
          {COUNTRIES.map(c => (
            <button key={c.code} className="cbtn"
              onClick={() => changeCountry(c.code)}
              aria-pressed={country === c.code}
              style={{ background: country === c.code ? GRADIENT(t) : "transparent", border: "none", borderRadius: 9, padding: "6px 12px", color: country === c.code ? "#fff" : t.muted, cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, transition: "all .2s", fontFamily: "'DM Sans',sans-serif" }}>
              {c.flag} <span className="cc-label">{c.code}</span>
              {loadingVis[c.code] && <span style={{ fontSize: 9, opacity: .7 }}>⟳</span>}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <InstallButton />
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: t.muted, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
              <button onClick={logout} style={{ background: t.hover, border: `1px solid ${t.border}`, borderRadius: 9, padding: "7px 12px", color: t.muted, cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>Sign out</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)}
              style={{ background: GRADIENT(t), border: "none", borderRadius: 9, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>
              Sign in
            </button>
          )}
          <button onClick={() => setDark(d => !d)} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            style={{ background: t.hover, border: `1px solid ${t.border}`, borderRadius: 9, padding: "8px 12px", color: t.muted, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <OfflineBanner />

      <div style={{ background: t.accentBg, borderBottom: `1px solid ${t.borderL}`, padding: "7px 24px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: t.accent, fontSize: 12, fontWeight: 600 }}>{cc?.flag} {cc?.name} · {cc?.program}</span>
        <span style={{ color: t.dim, fontSize: 11 }}>Spending in {cc?.sym} · Data verified 2026</span>
      </div>

      {journey?.setup && <JourneyBar />}

      <nav aria-label="Sections" style={{ background: t.surface, borderBottom: `1px solid ${t.border}`, padding: "0 24px", display: "flex", gap: 2, overflowX: "auto" }}>
        {TABS.map(([path, label]) => (
          <NavLink key={path} to={withCountry(path)} className="tab"
            onClick={() => track("tab_switch", { tab: path.replace("/", ""), country })}
            style={({ isActive }) => ({
              background: "transparent", border: "none",
              borderBottom: isActive ? `2px solid ${t.accent}` : "2px solid transparent",
              color: isActive ? t.accent : t.muted,
              padding: "13px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              fontFamily: "'DM Sans',sans-serif", transition: "all .2s", whiteSpace: "nowrap",
              textDecoration: "none",
            })}>
            {label}
          </NavLink>
        ))}
      </nav>

      <main id="main-content" style={{ maxWidth: 1060, margin: "0 auto", padding: "26px 20px" }}>
        <div className="fade" key={`${country}-${pathname}`}>
          {isLoading ? <SkeletonPage t={t} /> : <Outlet />}
        </div>
      </main>

      <ReviewsSection />

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => setShowLogin(false)} />
    </div>
  );
}

/** Keeps the ?country= param when bouncing off the bare root path. */
function IndexRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/calculator", search }} replace />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<IndexRedirect />} />
          <Route path="about" element={<AboutPage />} />
          <Route element={<RequireAuth />}>
            <Route path="calculator" element={<CalculatorPage />} />
            <Route path="hotels" element={<HotelsPage />} />
            <Route path="gap" element={<GapPage />} />
            <Route path="cards" element={<CardsPage />} />
            <Route path="spots" element={<SpotsPage />} />
          </Route>
          <Route path="*" element={<IndexRedirect />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}
