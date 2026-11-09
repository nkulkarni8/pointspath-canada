# PointsPath — Claude Code Project Memory

> This file is read by Claude Code at the start of every session.

## What is PointsPath?
Multi-country travel rewards optimizer helping users maximize credit card points for flights.
Countries: Canada 🇨🇦 | USA 🇺🇸 | India 🇮🇳
GitHub: https://github.com/nkulkarni8/pointspath-canada

## Tech Stack
| Layer    | Technology                                                  |
|----------|-------------------------------------------------------------|
| Frontend | React 19 + Vite + React Router 7 + Tailwind CSS + Lucide     |
| PWA      | vite-plugin-pwa (Workbox) — installable, offline-capable     |
| Backend  | Python FastAPI + SQLAlchemy + Pydantic                       |
| Database | Neon PostgreSQL (prod) / SQLite (local)                      |
| Auth     | Supabase Email OTP (auth only, not DB)                       |
| Analytics| Google Analytics 4 via gtag                                  |
| Deploy   | Vercel (frontend) + Render (backend)                         |
| Monitor  | UptimeRobot (pings /health with HEAD)                        |

## Frontend Architecture
Routes are real URLs (React Router), not tab state. Country travels as a
`?country=CA` query param so links are shareable.

```
src/
  App.jsx              layout shell (header, tabs, journey bar) + <Routes>
  main.jsx             ErrorBoundary > BrowserRouter > AuthProvider > App
  theme.js             T colour tokens, GRADIENT(), inputStyle(), lbl
  constants.js         COUNTRIES, CABINS, TABS, CITY_REGION, REVIEWS, …
  context/AppContext   country, theme, cached country data, journey, go()
  context/AuthContext  Supabase OTP session
  lib/api.js           API base, fetchCountryData(), track()
  lib/format.js        fmt(), seasonBadge(), groupByRegion()
  data/                CARD_EARNING_RATES, FALLBACK_HOTELS
  pages/               Calculator | Hotels | Gap | Cards | Spots | About
  components/          CitySelect, JourneyBar/Setup, Skeleton, InstallButton, …
```

Routes: `/calculator` `/hotels` `/gap` `/cards` `/spots` `/about`.
All except `/about` sit behind `<RequireAuth>`.

Backend static data lives in `backend/data/` (`earning_rates.py`, `hotels.py`,
`countries.py`) — `main.py` imports it rather than defining it inline.

## Non-Negotiable Rules
1. Health endpoint supports both GET and HEAD — required for UptimeRobot
2. Never hardcode city lists — always query DB dynamically
3. Neon is the database — Supabase is auth only
4. All API calls include ?country= parameter (CA | US | IN | HK)
5. Backward compatibility — new features must not break existing flows
6. Verify DB counts after every prod deploy
7. Keep the SPA rewrite in `frontend/vercel.json` — without it every route
   except `/` 404s in production
8. Navigate with `go()` / `withCountry()` from AppContext so the `?country=`
   param survives — never a bare `navigate("/cards")`

## Data
- Cards: 64 total (CA: 22, US: 24, IN: 18)
- Routes: 500+ (CA: ~200, US: ~180, IN: ~140)

## Auth Flow
1. User clicks Sign In → LoginModal opens (compact modal, always visible on one screen)
2. User enters email → supabase.auth.signInWithOtp() called
3. Supabase sends 6-digit code (NOT a magic link — requires email template fix)
4. User enters code → supabase.auth.verifyOtp({ type: "email" }) called
5. Session stored in localStorage automatically
6. ProtectedRoute checks user from AuthContext before rendering calculators

## Analytics Events (GA4)
- login: { method: 'OTP', country }
- tab_switch: { tab, country }
- country_switch: { country }
- calculate_points: { country, from, to, class }
- calculate_gap: { country, points_needed }

## Environment Variables
### Frontend (Vercel)
- VITE_API_URL
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_GA_MEASUREMENT_ID

### Backend (Render)
- DATABASE_URL (Neon PostgreSQL)
- ENVIRONMENT=production
- ALLOWED_ORIGINS
- BEEHIIV_API_KEY
- BEEHIIV_PUB_ID

## Commit Author
Nachiket Kulkarni <kulkarni.nachiket8@gmail.com>

## Do NOT Do
- Do not query Supabase for cards or routes
- Do not hardcode city names in React components
- Do not commit .env files
- Do not remove GET /health when adding HEAD support
- Do not deploy schema changes without running SQL migration on Neon first
