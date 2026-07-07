# PennyScan v2 - Modern Deal Aggregator

**The ultimate penny deal finder** - Real-time geolocation-based discovery of $0.01 clearance items across Dollar General, Dollar Tree, Home Depot, Lowe's, Walmart, Target, and more.

## 🎯 Features

### Core Experience
- **Smart Geolocation**: Auto-detect location or enter ZIP code
- **Priority Scoring**: Finds closest + highest-confidence deals first
- **Dual Views**: Interactive map + scrollable list
- **Dark Mode**: Modern UI with light/dark toggle
- **Mobile-First**: Native app-like experience

### Deal Discovery
- Multi-store aggregation (Dollar General, Dollar Tree, Home Depot, Lowe's, Walmart, Target)
- Confidence scoring based on recency + community confirmations
- Distance + estimated drive time
- Real-time stock likelihood
- Aisle/location hints

### Community Layer
- "I found this" confirmations with optional photos
- User trust scoring system
- Anti-spam validation
- Recent confirmations displayed on each deal

### Performance
- Lazy-loaded images
- Infinite scroll
- Optimized geospatial queries (PostGIS)
- Redis caching
- CDN-ready

## 🏗️ Architecture

**Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + shadcn/ui  
**Backend**: Node.js + Express + PostgreSQL (PostGIS) + Redis  
**Store Adapters**: Pluggable, extensible architecture  
**Jobs**: Bull queue for background scraping + data refresh  
**Deployment**: Docker + Vercel (frontend) + Railway/Render (backend)

## 🚀 Quick Start

```bash
# Install
npm install

# Environment setup
cp .env.example .env.local

# Database
npx prisma migrate dev
npm run seed

# Start
npm run dev
```

Open http://localhost:3000 on your phone or desktop.

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [STORE_ADAPTERS.md](./STORE_ADAPTERS.md) - How to add a store
- [SCORING.md](./SCORING.md) - Priority scoring algorithm
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production setup

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Mapbox |
| Backend | Node.js, Express, NestJS (optional) |
| Database | PostgreSQL 14+ with PostGIS, Prisma ORM |
| Cache/Queue | Redis, Bull |
| Auth | NextAuth.js or custom JWT |
| Deployment | Docker, Vercel, Railway |

## 📦 Project Structure

```
.
├── frontend/                  # Next.js app
│  ├── app/
│  ├── components/
│  ├── lib/
│  └── public/
├── backend/                   # Node.js/Express backend
│  ├── src/
│  │  ├── adapters/           # Store integrations
│  │  ├── jobs/               # Background jobs
│  │  ├── routes/             # API endpoints
│  │  ├── services/           # Business logic
│  │  └── utils/              # Helpers
│  └── prisma/
├── docker-compose.yml         # Local dev environment
└── docs/                      # Documentation
```

## 🔌 Store Adapters

Currently supported:
- ✅ Dollar General
- ✅ Dollar Tree
- ✅ Home Depot
- ✅ Lowe's
- ✅ Walmart
- ✅ Target

## 📊 Scoring Formula

```
priority_score = (confidence × recency_factor × stock_factor) / (1 + distance_miles)

Where:
- confidence: 0.0-1.0 (based on source + user confirmations)
- recency_factor: decays over time
- stock_factor: based on quantity reported + historical accuracy
- distance: in miles from user
```

## 🤝 Community Features

- Submit finds with optional photos
- "I found this" / "Not here" confirmations
- User trust scoring
- Recent confirmations shown on each deal

## 🔐 Security & Privacy

- Explicit location permission request
- No precise location history stored by default
- User submissions sanitized
- Rate limiting on all APIs
- HTTPS enforced in production

## 📈 Analytics

- Track searches, clicks, submissions
- Improve scoring based on user behavior
- Monitor adapter accuracy

## 📝 License

MIT

## 🙋 Support

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add new stores or features.
