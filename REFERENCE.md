# Quick Reference Guide

## File Structure

```
website/
├── app/
│   ├── api/
│   │   ├── location/reverse-geocode/route.ts    # Reverse geocode coords → ZIP
│   │   └── stores/
│   │       ├── search/route.ts                   # Main API: search stores/deals
│   │       └── refresh/route.ts                  # Refresh deals for ZIP
│   ├── layout.tsx                                # Root layout
│   ├── page.tsx                                  # Home page (ZIP search)
│   └── results/page.tsx                          # Results page (stores & deals)
├── lib/
│   ├── integrations/
│   │   ├── store-finder.ts                       # Find stores by location
│   │   └── penny-scanner.ts                      # Scan for deals
│   ├── utils/
│   │   ├── geocoding.ts                          # ZIP ↔ coordinates
│   │   ├── distance.ts                           # Distance calculations
│   │   └── normalization.ts                      # Normalize deal data
│   ├── prisma.ts                                 # Database client
│   └── mock-data.ts                              # Mock responses
├── prisma/
│   └── schema.prisma                             # Database schema
├── styles/
│   └── globals.css                               # Tailwind styles
├── tests/
│   └── utils/                                    # Unit tests
├── scripts/
│   ├── setup-db.sh                               # Database setup
│   ├── dev-setup.sh                              # Dev environment setup
│   └── seed.js                                   # Seed sample data
├── .env.example                                  # Environment template
├── .gitignore                                    # Git ignore rules
├── package.json                                  # Dependencies
├── tsconfig.json                                 # TypeScript config
├── next.config.js                                # Next.js config
├── tailwind.config.js                            # Tailwind config
├── SETUP.md                                      # Setup guide
├── DEPLOY.md                                     # Deployment guide
└── README.md                                     # Project overview
```

## Key Features

### Frontend Pages
- **`app/page.tsx`** - Home page with ZIP input & geolocation
- **`app/results/page.tsx`** - Results with stores, filters, and deal listings

### API Routes
- **`POST /api/stores/search`** - Search nearby stores and their deals
- **`POST /api/location/reverse-geocode`** - Convert coordinates to ZIP code
- **`POST /api/stores/refresh`** - Refresh deals for a location

### Utilities
- **Geocoding** - Convert ZIP ↔ coordinates (supports mock & real APIs)
- **Distance** - Haversine formula for location-based sorting
- **Normalization** - Standardize retailer data formats
- **Store Finder** - Find nearby stores from retailers
- **Penny Scanner** - Scan for deals in stores

## Environment Variables

```bash
DATABASE_URL              # PostgreSQL connection string
GOOGLE_MAPS_API_KEY       # Google Maps geocoding API (optional)
NEXTAUTH_SECRET           # Session encryption key
NEXTAUTH_URL              # Auth callback URL (auto on Vercel)
SCAN_RADIUS_MILES         # Search radius (default: 25)
```

## Common Commands

```bash
# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Database
npx prisma migrate dev     # Create migrations
npx prisma migrate reset   # Reset database
npx prisma studio         # View database UI
npm run prisma:seed       # Seed sample data

# Testing
npm test                   # Run unit tests
npm run test:watch         # Watch mode
npm run test:e2e           # End-to-end tests

# Code Quality
npm run lint               # Run ESLint
```

## How to Extend

### Add a New Retailer

1. **Add to store-finder.ts:**
```typescript
export async function findBestBuyStores(...): Promise<StoreInfo[]> {
  // Fetch stores from Best Buy API
}
```

2. **Add to penny-scanner.ts:**
```typescript
export async function scanBestBuyDeals(storeId: string): Promise<ScanResult> {
  // Scan for penny deals
}
```

3. **Update search API:**
```typescript
// In app/api/stores/search/route.ts
if (store.chain === 'BEST_BUY') {
  scanResult = await scanBestBuyDeals(store.id);
}
```

### Add Real API Integration

1. Get API credentials from retailer
2. Create `lib/integrations/retailer-api.ts`
3. Implement data fetching and normalization
4. Update the scanner functions

### Set Up Background Jobs

Use Bull + Redis or AWS Lambda for periodic scans:

```typescript
// Example: scan deals every hour
import Queue from 'bull';

const scanQueue = new Queue('scan-deals');

scanQueue.process(async (job) => {
  const { zipCode } = job.data;
  // Run scan job
});

// Schedule
scanQueue.add({ zipCode: '62701' }, {
  repeat: { cron: '0 * * * *' } // Every hour
});
```

## Debugging

### Check Database
```bash
npx prisma studio
```
Opens visual database browser at http://localhost:5555

### Check Logs
```bash
# Terminal output during npm run dev
# Look for errors and console.log statements
```

### Test API Directly
```bash
curl -X POST http://localhost:3000/api/stores/search \
  -H "Content-Type: application/json" \
  -d '{"zipCode":"62701"}'
```

## Performance Tips

- Add caching with `node-cache` for store lists
- Implement request deduplication
- Use database indexes (already in schema)
- Add pagination for large result sets
- Consider Redis for session management

## Security Considerations

- ✅ Input validation on all API routes
- ✅ SQL injection protection (Prisma ORM)
- ✅ CORS handled by Next.js
- ✅ Environment variables not exposed
- 🔄 Add rate limiting for production
- 🔄 Add authentication for admin endpoints
- 🔄 Sanitize HTML output
