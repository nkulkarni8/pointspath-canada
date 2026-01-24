# 🎯 Points Optimizer Canada

> **Free Canadian credit card points calculator and travel planning tool**

Calculate how many points you need for flights and get personalized earning strategies with Canadian credit cards (TD Aeroplan, CIBC, Scotia, RBC Avion, Amex and more).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18.0+-blue.svg)
![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)

**Live Demo:** [Your URL Here]  
**Community:** [r/churningcanada](https://reddit.com/r/churningcanada)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Data Updates](#data-updates)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### 🗺️ **Two Powerful Flows**

**Flow 1: Trip Planning**
- Calculate points needed for specific routes
- Compare different travel classes (Economy, Business, First)
- Get personalized earning strategies based on top Canadian cards
- Supports 20+ popular routes from Canadian cities

**Flow 2: Points Gap Calculator** ⭐
- Enter exact points needed from any airline website
- Select YOUR actual credit cards
- Get month-by-month spending plan
- See if your goal is achievable within your budget
- Category-specific spending breakdowns

### 💳 **Real Canadian Data**

- **18+ Credit Cards** from TD, CIBC, RBC, Scotiabank, BMO, Amex
- **Current Welcome Bonuses** (Updated January 2026)
- **Accurate Earning Rates** for groceries, dining, gas, travel, etc.
- **Transfer Partners** and program details

### 🎯 **Smart Features**

- Real-time calculations with no page refresh
- Mobile-responsive design
- Data freshness indicators
- Input validation and error handling
- SEO optimized for organic traffic

---

## 🛠️ Tech Stack

### **Backend**
- **Python 3.11+** - Core language
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Production database (SQLite for local dev)
- **Pydantic** - Data validation

### **Frontend**
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### **Infrastructure**
- **Docker** - Containerization
- **GitHub Actions** - CI/CD (optional)
- **Render/Railway/AWS** - Hosting options

---

## 🚀 Quick Start

### **Prerequisites**

- Python 3.11 or higher
- Node.js 18 or higher
- Git

### **1. Clone Repository**

```bash
git clone https://github.com/nkulkarni8/points-optimizer-canada.git
cd points-optimizer-canada
```

### **2. Backend Setup**

```bash
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

# Initialize database
python database.py

# Start backend server
python main.py
```

Backend runs at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### **3. Frontend Setup**

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: **http://localhost:5173** (or 5174)

### **4. Access the App**

Open your browser to **http://localhost:5173**

You should see two tiles:
- 🗺️ **Plan a Trip** - Calculate points for destinations
- 🎯 **Calculate Points Gap** - Enter your points target

---

## 📁 Project Structure

```
points-optimizer-canada/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── models.py               # Database models
│   ├── database.py             # Database setup & seeding
│   ├── requirements.txt        # Python dependencies
│   ├── latest_cards_data.py    # Card data updater
│   ├── view_database.py        # Database viewer CLI
│   ├── add_more_data.py        # Add routes/cards
│   └── points_optimizer.db     # SQLite database (local)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── public/
│   ├── index.html              # HTML template (SEO optimized)
│   ├── package.json            # Node dependencies
│   ├── tailwind.config.js      # Tailwind configuration
│   └── vite.config.js          # Vite configuration
│
├── docker-compose.yml          # Docker setup
├── Dockerfile.backend          # Backend container
├── Dockerfile.frontend         # Frontend container
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

---

## 🐳 Docker Deployment

### **Using Docker Compose (Easiest)**

```bash
# Build and run all containers
docker-compose up --build

# Run in background
docker-compose up -d

# Stop containers
docker-compose down
```

Access at:
- Frontend: **http://localhost:3000**
- Backend: **http://localhost:8000**

### **Individual Containers**

**Backend:**
```bash
docker build -f Dockerfile.backend -t points-optimizer-backend .
docker run -p 8000:8000 points-optimizer-backend
```

**Frontend:**
```bash
docker build -f Dockerfile.frontend -t points-optimizer-frontend .
docker run -p 3000:80 points-optimizer-frontend
```
---

## 🔄 Updating Data

### **Credit Card Bonuses (Weekly)**

```bash
cd backend

# Edit latest_cards_data.py with new bonuses
# Then run:
python latest_cards_data.py

# Restart backend
python main.py
```

**Where to Check:**
- r/churningcanada (daily updates)
- princeoftravel.com/deals
- rewardscanada.ca

### **Routes & Points (Monthly)**

```bash
cd backend

# Edit add_more_data.py or database.py
# Then:
rm points_optimizer.db
python database.py
python main.py
```

---

## 📤 Publishing to GitHub

### **1. Create Repository**

```bash
# Initialize git (if not done)
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
venv/
__pycache__/
*.pyc
*.db
.env

# Node
node_modules/
dist/
.DS_Store

# IDE
.vscode/
.idea/
EOF

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Points Optimizer Canada"
```

### **2. Push to GitHub**

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name: `points-optimizer-canada`
4. **Don't** initialize with README (you have one)
5. Create repository

Then in terminal:
```bash
git remote add origin https://github.com/nkulkarni8/points-optimizer-canada.git
git branch -M main
git push -u origin main
```

### **3. Add Repository Details**

On GitHub, add:
- **Description:** "Free Canadian credit card points calculator and optimizer"
- **Topics:** `aeroplan`, `credit-cards`, `canada`, `points`, `travel`, `fastapi`, `react`
- **License:** MIT

---

## 🔒 Environment Variables

### **Backend (.env)**

```bash
DATABASE_URL=postgresql://user:pass@host/db
PORT=8000
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend.vercel.app
```

### **Frontend (.env.production)**

```bash
VITE_API_URL=https://your-backend.onrender.com
```

**Security Note:** Never commit `.env` files! They're in `.gitignore`.

---

## 🧪 Testing

### **Backend Tests**

```bash
cd backend
pytest tests/
```

### **Frontend Tests**

```bash
cd frontend
npm test
```

### **Manual Testing Checklist**

- [ ] Both flows load without errors
- [ ] Can calculate points for a trip
- [ ] Can calculate points gap
- [ ] Cards load from database
- [ ] Input validation works (try negative numbers)
- [ ] Mobile view looks good
- [ ] Backend API docs work (http://localhost:8000/docs)

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Roadmap

### **Phase 1: MVP** ✅ (Current)
- [x] Two-flow interface
- [x] Trip planning calculator
- [x] Points gap calculator
- [x] 18+ Canadian credit cards
- [x] 20+ popular routes

### **Phase 2: Enhancement** (Next 3 months)
- [ ] User accounts (optional)
- [ ] Save trip plans
- [ ] Email notifications for bonus changes
- [ ] Community price submissions
- [ ] More cards (30+ total)
- [ ] More routes (50+ total)

### **Phase 3: Advanced** (6-12 months)
- [ ] Real-time award availability API
- [ ] AI-powered recommendations
- [ ] Mobile app (React Native)
- [ ] Premium features
- [ ] Affiliate partnerships

---

## 🐛 Known Issues

- Backend sleeps on Render free tier (30-60s wake time on first request)
- Route data is estimated (not real-time from airlines)
- Limited to routes in database for Flow 1

---

## 💡 FAQ

**Q: Is this free to use?**  
A: Yes! 100% free, no credit card required.

**Q: Do you store my data?**  
A: No personal data is stored. All calculations happen in real-time.

**Q: How accurate are the points estimates?**  
A: Credit card data is 100% current. Route points are typical estimates (±10-20%).

**Q: Can I add my own cards?**  
A: Currently admin-only, but we're building a submission feature!

**Q: How often is data updated?**  
A: Credit card bonuses updated weekly, routes updated monthly.

---

## 📧 Contact

- **Issues:** [GitHub Issues](https://github.com/nkulkarni8/points-optimizer-canada/issues)
- **Discussions:** [r/churningcanada](https://reddit.com/r/churningcanada)
- **Email:** your-email@example.com

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Data Sources:** Prince of Travel, Rewards Canada, Ratehub
- **Community:** r/churningcanada

---

## ⭐ Star History

If this project helped you, please give it a star! ⭐

---

**Built with ❤️ for the Canadian points community** 🇨🇦

*Not affiliated with any bank or credit card issuer*

*Last Updated: January 2026*