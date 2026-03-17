# PointsPath — Claude Code Project Memory

> This file is read by Claude Code at the start of every session.

## What is PointsPath?
Multi-country travel rewards optimizer helping users maximize credit card points for flights.
Countries: Canada 🇨🇦 | USA 🇺🇸 | India 🇮🇳
GitHub: https://github.com/nkulkarni8/pointspath-canada

## Tech Stack
| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | React 19 + Vite + Tailwind CSS + Axios + Lucide |
| Backend  | Python FastAPI + SQLAlchemy + Pydantic          |
| Database | Neon PostgreSQL (prod) / SQLite (local)         |
| Auth     | Supabase Email OTP (auth only, not DB)          |
| Analytics| Google Analytics 4 via gtag                     |
| Deploy   | Vercel (frontend) + Render (backend)            |
| Monitor  | UptimeRobot (pings /health with HEAD)           |

## Non-Negotiable Rules
1. Health endpoint supports both GET and HEAD — required for UptimeRobot
2. Never hardcode city lists — always query DB dynamically
3. Neon is the database — Supabase is auth only
4. All API calls include ?country= parameter (CA | US | IN)
5. Backward compatibility — new features must not break existing flows
6. Verify DB counts after every prod deploy

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
