# PointsPath Canada 🍁

**Your path to free travel with Canadian credit cards**

A full-stack web application that helps Canadians maximize credit card points for travel rewards. Calculate points needed for flights, discover optimal earning strategies, and bridge points gaps with personalized spending plans.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://pointspath-canada.vercel.app)
[![API Status](https://img.shields.io/badge/API-healthy-success)](https://pointspath-canada-api.onrender.com/health)

---

## 🚀 Features

### Flow 1: Trip Planning Calculator
- Calculate points needed for 242+ flight routes (all bidirectional)
- Coverage: Domestic Canada, USA, Mexico, Europe, Asia, Middle East, Oceania, Caribbean, South America
- Support for Economy, Premium Economy, Business, and First Class
- Real-time passenger and trip duration calculations
- Round-trip vs one-way estimates

### Flow 2: Points Gap Calculator
- Bridge the gap between current points and travel goals
- Smart budget calculation (auto-calculates if not provided)
- Personalized strategies for all 22 Canadian credit cards
- Category-specific spending breakdown
- Budget feasibility warnings and timeline suggestions

### Credit Card Database
- **22 Canadian credit cards** with January 2026 welcome bonuses
- Programs: Aeroplan, Membership Rewards, Avion, Scene+, BMO Rewards, Cash Back
- Issuers: TD, CIBC, Amex, RBC, Scotiabank, BMO, National Bank, Tangerine
- Welcome bonuses ranging from 0 to 95,000 points

---

## 🏗️ Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **Axios** for API calls
- Deployed on **Vercel**

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** ORM
- **Pydantic** for validation
- **PostgreSQL** (Neon) for production
- **SQLite** for local development
- Deployed on **Render**

### Database
- **Neon PostgreSQL** (production)
- **SQLite** (local development)
- 22 credit cards, 242 flight routes

---

## 🌐 Live Deployment

| Service | Platform | URL | Cost |
|---------|----------|-----|------|
| **Frontend** | Vercel | https://pointspath-canada.vercel.app | Free |
| **Backend API** | Render | https://pointspath-canada-api.onrender.com | Free |
| **Database** | Neon PostgreSQL | Managed | Free |
| **Total** | — | — | **$0/month** |

### Free Tier Details
- **Vercel**: 100 GB bandwidth/month, unlimited projects
- **Render**: 750 hours/month (sleeps after 15min inactivity)
- **Neon**: 0.5 GB storage, 3 GB data transfer/month

---

## 🚀 Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOL
DATABASE_URL=sqlite:///./points_optimizer.db
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
EOL

# Initialize database with 22 cards
python database.py

# Update routes (242 routes)
python update_routes.py

# Verify database
python view_database.py

# Start backend server
python main.py
# Server runs at http://localhost:8000
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
VITE_API_URL=http://localhost:8000
EOL

# Start development server
npm run dev
# App runs at http://localhost:5173
```

### Verify Setup

1. **Backend Health Check**: http://localhost:8000/health
```json
   {
     "status": "healthy",
     "database": {
       "cards": 22,
       "routes": 242
     }
   }
```

2. **API Docs**: http://localhost:8000/docs

3. **Frontend**: http://localhost:5173

---

## 📦 Deployment Guide

### Initial Setup (One-Time)

#### 1. Neon PostgreSQL Database

1. Sign up at https://neon.tech
2. Create new project: `pointspath-canada`
3. Copy connection string (starts with `postgresql://`)
4. Run SQL in Neon Console:
```sql
   -- Run backend/database.py CREATE TABLE statements
   -- Run backend/latest_cards_data.py INSERT statements
   -- Run complete_routes.sql (242 routes)
```

#### 2. Render Backend Deployment

1. Sign up at https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings**:
   - Name: `pointspath-canada-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && python main.py`
   - **Environment Variables**:
```
     DATABASE_URL=<Neon connection string>
     ENVIRONMENT=production
     ALLOWED_ORIGINS=https://pointspath-canada.vercel.app,https://pointspath-canada-git-main-<your-username>.vercel.app
```
4. Deploy → Copy API URL

#### 3. Vercel Frontend Deployment

1. Sign up at https://vercel.com
2. **Import Project** → Connect GitHub repo
3. **Settings**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - **Environment Variables**:
```
     VITE_API_URL=<Render API URL>
```
4. Deploy → App is live!

### Continuous Deployment

**Every time you push to GitHub:**
```bash
git add .
git commit -m "Your changes"
git push origin main
```

- ✅ Vercel auto-deploys frontend (~30 seconds)
- ✅ Render auto-deploys backend (~2-3 minutes)

---

## 📊 Database Schema

### Credit Cards Table
```sql
id, name, issuer, program, earn_rate, annual_fee, 
welcome_bonus, categories, transfer_partners, is_active
```

### Routes Table
```sql
id, from_city, to_city, distance_km, route_type,
economy_points, premium_economy_points, business_points, 
first_points, program
```

---

## 🎯 API Endpoints

### Health & Info
- `GET /` - API info
- `GET /health` - Health check with database stats

### Flow 1: Trip Planning
- `POST /calculate-points` - Calculate points for a trip
- `POST /strategies` - Get earning strategies

### Flow 2: Points Gap
- `POST /calculate-gap` - Calculate points gap strategies

### Data Access
- `GET /cards` - List all credit cards (filter by program)
- `GET /cards/{id}` - Get specific card
- `GET /routes` - List all 242 routes

**Full API Docs**: https://pointspath-canada-api.onrender.com/docs

---

## 🔧 Environment Variables

### Backend (.env)
```env
# Database (use one)
DATABASE_URL=sqlite:///./points_optimizer.db  # Local
DATABASE_URL=postgresql://...                  # Production (Neon)

# Environment
ENVIRONMENT=development  # or 'production'

# CORS (comma-separated, no spaces)
ALLOWED_ORIGINS=http://localhost:5173,https://pointspath-canada.vercel.app
```

### Frontend (.env)
```env
# Backend API URL
VITE_API_URL=http://localhost:8000  # Local
VITE_API_URL=https://pointspath-canada-api.onrender.com  # Production
```

---

## 📝 Data Sources & Accuracy

### Points Estimates
- Based on typical Aeroplan pricing (January 2026)
- **ONE-WAY** estimates - multiply by 2 for round-trip
- Actual prices vary by date, demand, and availability
- Can range 50% below to 200% above estimates
- **Always verify on Aeroplan.com before booking**

### Credit Card Data
- Welcome bonuses accurate as of January 2026
- Bonuses change monthly - verify on bank websites
- Annual fees and earn rates subject to change
- Tool is educational - not financial advice

### Flight Routes
- 242 bidirectional routes covering major destinations
- Does not include all possible city pairs
- Focused on popular Canadian departure cities

---

## 🐛 Known Issues & Limitations

### Render Free Tier
- **Cold Start Delay**: API sleeps after 15 minutes of inactivity
- **First Request**: Takes 20-30 seconds to wake up
- **Subsequent Requests**: Instant
- **Solution**: Upgrade to paid tier ($7/month) or accept delay

### Database ID Gaps
- Credit card IDs start from 6, not 1 (due to previous deletions)
- Routes IDs may not be sequential
- **No functional impact** - just unique identifiers

---

## 📄 License

This project is for educational purposes. Credit card data is publicly available information. Not affiliated with any bank, credit card issuer, or airline program.

---

## 🙏 Acknowledgments

- **Aeroplan** for points program data
- **Canadian banks** for credit card information
- **Vercel, Render, Neon** for free tier hosting
- **Claude AI** for development assistance
- **r/churningcanada** community for inspiration

---

## 📧 Contact

**GitHub**: [@nkulkarni8](https://github.com/nkulkarni8)  
**Project Link**: https://github.com/nkulkarni8/pointspath-canada

---

**Built with ❤️ for the Canadian travel hacking community**

*Last Updated: January 2026*