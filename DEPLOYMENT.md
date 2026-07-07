# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS
- Redis 6+

### Setup

```bash
# Clone and install
git clone <repo>
cd website
npm install

# Environment
cp .env.example .env.local

# Edit .env.local with your local values
# DATABASE_URL, REDIS_URL, MAPBOX_TOKEN, etc.

# Database
npx prisma migrate dev --name init
npm run seed

# Start dev server
npm run dev

# In another terminal: start backend
cd backend
npm install
npm run dev

# In another terminal: start Redis (if not running)
redis-server
```

Access at http://localhost:3000

## Docker Compose (Full Local Stack)

```bash
# Spin up entire local environment
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Tear down
docker-compose down
```

See [docker-compose.yml](./docker-compose.yml) for configuration.

## Production Deployment

### Architecture

```
┌─────────────────────┐
│  Vercel (Frontend)  │
│  - Next.js app      │
│  - React components │
│  - CDN              │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│ Railway (Backend)   │
│  - Node.js/Express  │
│  - API routes       │
│  - Job queue        │
└──────────┬──────────┘
           │
           ├──► PostgreSQL (Railway)
           ├──► Redis (Railway)
           └──► External APIs
```

### Step 1: Database (Railway PostgreSQL)

1. Go to https://railway.app
2. Create new project
3. Add PostgreSQL service
4. Enable PostGIS extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   ```
5. Copy connection string to `.env`

### Step 2: Redis (Railway)

1. In Railway project, add Redis service
2. Copy connection string to `.env`

### Step 3: Backend (Railway)

1. Push code to GitHub
2. In Railway, create new service from GitHub repo
3. Set root directory: `backend`
4. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<from PostgreSQL service>
   REDIS_URL=<from Redis service>
   MAPBOX_TOKEN=<your token>
   PORT=3001
   ```
5. Deploy

### Step 4: Frontend (Vercel)

1. Go to https://vercel.com
2. Import repository
3. Set root directory: `frontend` (or root if monorepo)
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://<railway-backend-url>
   NEXT_PUBLIC_MAPBOX_TOKEN=<your token>
   ```
5. Deploy

### Environment Variables

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=https://api.pennyscan.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
NEXT_PUBLIC_GA_ID=UA-xxx (optional)
```

**Backend (.env)**
```
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/pennyscan
REDIS_URL=redis://user:pass@host:6379
PORT=3001
API_SECRET=<random-secret>

# Store APIs
WALMART_API_KEY=xxx
TARGET_API_KEY=xxx
HOME_DEPOT_API_KEY=xxx

# External Services
MAPBOX_TOKEN=pk.xxx
SENTRY_DSN=https://xxx (error tracking)

# Feature Flags
ENABLE_DG_SCRAPER=true
ENABLE_DT_SCRAPER=true
ENABLE_HD_SCRAPER=true

# Job Scheduling
JOB_INTERVAL_SCRAPE=3600000 (1 hour in ms)
JOB_INTERVAL_DECAY=3600000
JOB_INTERVAL_CLEANUP=86400000 (1 day)
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Monitoring

### Error Tracking (Sentry)

1. Go to https://sentry.io
2. Create project
3. Add DSN to backend `.env`
4. Errors automatically logged

### Logs

- **Frontend**: Vercel dashboard
- **Backend**: Railway dashboard
- **Database**: PostgreSQL logs
- **Jobs**: Redis logs

### Metrics

```bash
# Backend health check
curl https://api.pennyscan.com/health

# Monitor job queue
redis-cli
> KEYS bull:*
> HGETALL bull:scrape-deals:*
```

## Database Migrations

### Deploy new migration to production

```bash
# Create migration
npx prisma migrate dev --name my_change

# Deploy to production
# (Runs automatically on Railway deploy)
npx prisma migrate deploy
```

## Scaling

### Horizontal Scaling

- **Frontend**: Vercel auto-scales
- **Backend**: Railway can auto-scale with CPU/memory metrics
- **Database**: PostgreSQL can scale vertically on Railway
- **Cache**: Redis replication available

### Performance Optimization

1. **CDN**: Cloudflare in front of Vercel
2. **Image optimization**: Next.js Image component
3. **API caching**: Redis for frequent queries
4. **Database indexing**: Already in schema
5. **Job batching**: Process deals in batches

## Rollback

### Frontend (Vercel)
```
1. Go to Vercel dashboard
2. Select deployment
3. Click "Promote to Production"
```

### Backend (Railway)
```bash
# Revert to previous deploy
railway run npm run migrate:rollback
```

## Disaster Recovery

### Database Backup

Railway PostgreSQL automatically backs up:
- Daily full backups (7-day retention)
- Point-in-time recovery available

### Manual Backup

```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Cost Estimation (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Vercel Frontend | $0-20 | Pro plan for analytics |
| Railway Backend | $5-50 | Depends on traffic |
| PostgreSQL | $10-100 | Depends on data size |
| Redis | $5-25 | Depends on usage |
| Mapbox | $0-100 | First 25k requests free |
| **Total** | **$20-295** | Scales with usage |

## Troubleshooting

### Backend won't start
```bash
# Check logs
railway logs

# Verify environment variables
railway env

# Test database connection
psql $DATABASE_URL -c "SELECT 1"
```

### Job queue stuck
```bash
# Check Redis
redis-cli KEYS 'bull:*'

# Clear queue
redis-cli FLUSHDB
```

### Database connection error
```bash
# Verify SSL
psql "$DATABASE_URL?sslmode=require" -c "SELECT 1"

# Check credentials
echo $DATABASE_URL
```

## Support

For deployment issues:
- Railway support: https://railway.app/support
- Vercel support: https://vercel.com/support
- PostgreSQL docs: https://www.postgresql.org/docs/
