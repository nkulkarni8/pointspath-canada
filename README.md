# PointsPath ✈

**Travel Rewards Optimizer — Canada · USA · India**

A full-stack web app helping users maximize credit card points for flights.
Calculate points needed for any route, find the best earning strategy, and bridge your points gap — all in one place.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://pointspath.vercel.app)
[![API Status](https://img.shields.io/badge/API-healthy-success)](https://pointspath-api.onrender.com/health)

---

## Features

### Trip Calculator
- Points needed for 500+ routes across Canada, USA & India
- Economy, Premium Economy, Business & First Class
- Round-trip & one-way support
- Per-person and total breakdown

### Points Gap Calculator
- Bridge the gap between current points and travel goal
- Compare strategies across all cards in your country
- Smart budget calculation with monthly spend breakdown
- Category-specific earning optimization

### Credit Cards
- **Canada:** 22 cards — Aeroplan, Scene+, Avion, TD Rewards, BMO Rewards, Amex MR, Cash Back
- **USA:** 24 cards — Chase UR, Amex MR, Capital One, Citi TY, SkyMiles, United, Hilton, Marriott
- **India:** 18 cards — HDFC Infinia, Axis Magnus, SBI Prime, ICICI Emeralde, Amex, Vistara

### Progressive Web App
- Installable on phone and desktop — "Add to Home Screen" launches it full screen
- Service worker precaches the app shell; previously loaded cards, routes and
  sweet spots stay readable offline
- Shareable URLs per section (`/calculator`, `/cards`, …) with the country
  carried as `?country=CA`

### Authentication
- Supabase Email OTP (no password ever)
- Google Analytics 4 — track signups, country usage, feature adoption

---

## Tech Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Frontend | React 19 + Vite + React Router 7 + Tailwind CSS         |
| PWA      | vite-plugin-pwa (Workbox)                               |
| Backend  | Python FastAPI + SQLAlchemy + Pydantic                  |
| Database | Neon PostgreSQL (prod) / SQLite (local)                 |
| Auth     | Supabase Email OTP                                      |
| Analytics| Google Analytics 4                                      |
| Deploy   | Vercel (frontend) + Render (backend)                    |
| Monitor  | UptimeRobot                                             |
| Email    | Beehiiv newsletters                                     |

---

## Live Deployment

| Service  | URL                                        |
|----------|--------------------------------------------|
| Frontend | https://pointspath.vercel.app              |
| Backend  | https://pointspath-api.onrender.com        |
| Health   | https://pointspath-api.onrender.com/health |

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate         # Windows
pip install -r requirements.txt

# Create .env
echo DATABASE_URL=sqlite:///./pointspath.db > .env
echo ENVIRONMENT=development >> .env
echo ALLOWED_ORIGINS=http://localhost:5173 >> .env

python main.py
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install

# Create .env (copy from .env.example and fill in)
cp .env.example .env

npm run dev
# → http://localhost:5173
```

Regenerate the PWA icon set after a brand change:

```bash
cd frontend
npm run icons          # writes favicon.svg + pwa-*.png into public/
```

The service worker only runs in a production build — test installability with
`npm run build && npm run preview`.

---

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Backend (.env on Render)

```
DATABASE_URL=postgresql://...neon...
ENVIRONMENT=production
ALLOWED_ORIGINS=https://pointspath.vercel.app
BEEHIIV_API_KEY=...
BEEHIIV_PUB_ID=...
```

---

## Database

Routes: 500+ (CA: ~200, US: ~180, IN: ~140)
Cards: 64 total (CA: 22, US: 24, IN: 18)

Schema adds a `country` column to both `credit_cards` and `routes` tables.

**Migration for existing Neon DB:**
```sql
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'CA';
ALTER TABLE routes ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'CA';
UPDATE credit_cards SET country = 'CA' WHERE country IS NULL;
UPDATE routes SET country = 'CA' WHERE country IS NULL;
```

---

## Rebranding Note

This app was previously called **PointsPath Canada**. It has been rebranded to **PointsPath** to reflect multi-country support (Canada, USA, India).

Update references:
- Vercel project: rename or keep URL, add custom domain
- Render service: update API_TITLE in config
- UptimeRobot: update monitor URLs if domain changes

---

## Author

**Nachiket Kulkarni** · GitHub [@nkulkarni8](https://github.com/nkulkarni8)

Built with ❤️ for the travel hacking community.
