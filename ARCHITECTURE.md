# PennyScan v2 - System Architecture

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Phone                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Frontend (React/Next.js)                            │   │
│  │ - Geolocation request                              │   │
│  │ - Search form (ZIP or current location)            │   │
│  │ - Map + List views                                 │   │
│  │ - Dark mode toggle                                 │   │
│  │ - User confirmations                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕ (HTTPS)
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ API Layer (Express/NestJS)                          │   │
│  │ POST /api/deals/search                             │   │
│  │ POST /api/deals/confirm                            │   │
│  │ GET /api/stores/nearby                             │   │
│  │ POST /api/deals/submit                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Service Layer                                       │   │
│  │ - DealService (priority scoring, filtering)        │   │
│  │ - StoreService (locator, hours, details)           │   │
│  │ - ConfirmationService (trust scoring, aggregation) │   │
│  │ - GeoService (distance, drive time)                │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Store Adapters (Pluggable)                          │   │
│  │ ├─ DollarGeneralAdapter                            │   │
│  │ ├─ DollarTreeAdapter                               │   │
│  │ ├─ HomeDepotAdapter                                │   │
│  │ ├─ LowesAdapter                                    │   │
│  │ ├─ WalmartAdapter                                  │   │
│  │ └─ TargetAdapter                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Data Layer (Prisma ORM)                            │   │
│  │ - PostgreSQL (PostGIS for geo queries)             │   │
│  │ - Redis (caching, job queue)                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↕                                  │
│  ┌───────────────────────��─────────────────────────────┐   │
│  │ Background Jobs (Bull Queue)                        │   │
│  │ - Scrape penny data (hourly)                       │   │
│  │ - Refresh store details (daily)                    │   │
│  │ - Decay confidence scores (hourly)                 │   │
│  │ - Clean expired deals (nightly)                    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
│  ├─ Mapbox (geocoding, distance, directions)              │
│  ├─ Store APIs (Walmart, Target, Home Depot)             │
│  ├─ Web Scrapers (Dollar General, Dollar Tree)           │
│  └─ Analytics (event tracking)                            │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Stores Table
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  chain VARCHAR(100) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state CHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  hours JSONB,
  data_source VARCHAR(50),
  last_verified TIMESTAMP,
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS 
    (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CREATE INDEX idx_stores_chain ON stores(chain);
  CREATE INDEX idx_stores_location ON stores USING GIST(location);
  CREATE UNIQUE INDEX idx_stores_chain_id ON stores(chain, id);
);
```

### Deals Table
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  upc VARCHAR(15),
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  aisle_location VARCHAR(255),
  category VARCHAR(100),
  image_url VARCHAR(500),
  confidence_score FLOAT DEFAULT 0.5,
  in_stock_likelihood FLOAT DEFAULT 0.7,
  quantity_reported INT,
  last_seen TIMESTAMP,
  source_type VARCHAR(50),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CREATE INDEX idx_deals_store_id ON deals(store_id);
  CREATE INDEX idx_deals_created_at ON deals(created_at DESC);
  CREATE INDEX idx_deals_expires_at ON deals(expires_at);
  CREATE INDEX idx_deals_confidence ON deals(confidence_score DESC);
);
```

### User Confirmations Table
```sql
CREATE TABLE user_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  
  CREATE INDEX idx_confirmations_deal_id ON user_confirmations(deal_id);
  CREATE INDEX idx_confirmations_user_id ON user_confirmations(user_id);
  CREATE INDEX idx_confirmations_created_at ON user_confirmations(created_at DESC);
);
```

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  username VARCHAR(100),
  trust_score FLOAT DEFAULT 0.5,
  submissions_count INT DEFAULT 0,
  accurate_reports INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_trust_score ON users(trust_score DESC);
);
```

### Search Events Table (Analytics)
```sql
CREATE TABLE search_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  location_lat FLOAT,
  location_lon FLOAT,
  filters JSONB,
  results_count INT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CREATE INDEX idx_search_events_created_at ON search_events(created_at DESC);
  CREATE INDEX idx_search_events_location ON search_events USING GIST(
    ST_SetSRID(ST_MakePoint(location_lon, location_lat), 4326)
  );
);
```

## API Endpoints

### Search Deals (Primary)
```
POST /api/deals/search

Request:
{
  "latitude": 39.7817,
  "longitude": -89.6501,
  "radiusMiles": 25,
  "storeChains": ["DOLLAR_GENERAL", "HOME_DEPOT"],
  "minConfidence": 0.5,
  "sortBy": "priority" | "distance" | "confidence",
  "limit": 50,
  "offset": 0
}

Response:
{
  "deals": [
    {
      "id": "uuid",
      "name": "Smart LED Bulb",
      "price": 0.01,
      "originalPrice": 29.99,
      "store": {
        "id": "uuid",
        "name": "Dollar General #1234",
        "chain": "DOLLAR_GENERAL",
        "address": "123 Main St",
        "distance": 2.5,
        "driveTimeMinutes": 7,
        "phone": "(217) 555-1234",
        "hours": { "mon": "8am-10pm", ... }
      },
      "confidence": 0.92,
      "inStockLikelihood": 0.85,
      "aisleLocation": "G12",
      "imageUrl": "https://...",
      "lastSeen": "2024-01-15T10:30:00Z",
      "recentConfirmations": [
        {
          "status": "found",
          "username": "deal_hunter_42",
          "createdAt": "2024-01-15T09:15:00Z"
        }
      ]
    }
  ],
  "userLocation": { "latitude": 39.7817, "longitude": -89.6501 },
  "totalResults": 147,
  "pagination": { "limit": 50, "offset": 0, "hasMore": true }
}
```

### Confirm Deal (Community)
```
POST /api/deals/confirm

Request:
{
  "dealId": "uuid",
  "status": "found" | "not_found" | "out_of_stock",
  "notes": "Found 3 units at end cap",
  "photoUrl": "https://..." (optional),
  "userId": "uuid" (optional for anonymous)
}

Response:
{
  "success": true,
  "confirmation": { ... },
  "dealUpdated": {
    "id": "uuid",
    "confidenceScore": 0.95,
    "recentConfirmations": [...]
  }
}
```

### Get Nearby Stores
```
GET /api/stores/nearby?lat=39.7817&lon=-89.6501&radius=25

Response:
{
  "stores": [
    {
      "id": "uuid",
      "name": "Dollar General #1234",
      "chain": "DOLLAR_GENERAL",
      "distance": 2.5,
      "dealCount": 12,
      "coordinates": { "lat": 39.7850, "lon": -89.6550 }
    }
  ]
}
```

### Submit Deal (Crowdsource)
```
POST /api/deals/submit

Request:
{
  "storeName": "Dollar General #1234",
  "storeChain": "DOLLAR_GENERAL",
  "itemName": "Kitchen Timer",
  "price": 0.01,
  "aisleLocation": "J5",
  "photoUrl": "https://...",
  "notes": "Clearance endcap",
  "quantity": 5,
  "userId": "uuid" (optional)
}

Response:
{
  "success": true,
  "deal": { ... },
  "message": "Deal submitted! It will appear after review."
}
```

## Store Adapter Pattern

```typescript
export abstract class BaseStoreAdapter {
  abstract name: string;
  abstract chain: StoreChain;
  
  // Must implement
  abstract fetchDeals(): Promise<RawDeal[]>;
  abstract searchStores(lat: number, lon: number, radius: number): Promise<RawStore[]>;
  
  // Provided by base class
  protected normalize(raw: RawDeal): Deal {
    return {
      name: raw.itemName,
      sku: raw.sku,
      price: this.parsePrice(raw.price),
      confidence: this.calculateConfidence(raw),
      source: this.chain,
    };
  }
  
  protected calculateConfidence(raw: any): number {
    // Override per adapter
  }
}
```

## Priority Scoring Formula

```typescript
const priorityScore = 
  (confidence * recencyFactor * stockFactor) / (1 + distanceMiles);

// Example weights:
// - Penny items: confidence = 0.95
// - 70%+ clearance: confidence = 0.80
// - User reported: confidence = 0.70
// - API confirmed: confidence = 0.90

// Recency factor (decays over 24 hours)
// - Within 1 hour: 1.0
// - Within 6 hours: 0.8
// - Within 24 hours: 0.5
// - Over 24 hours: 0.1

// Stock factor (based on quantity + accuracy history)
// - Multiple units reported: 0.9
// - Single unit reported: 0.7
// - Unconfirmed: 0.5
```

## Background Jobs (Bull Queue)

1. **Scrape Deals** (Hourly)
   - Fetch penny data from all store adapters
   - Parse, normalize, upsert to database
   - Update last_verified timestamp

2. **Decay Confidence** (Hourly)
   - Reduce confidence of unconfirmed deals
   - Apply recency factor

3. **Expire Stale Deals** (Nightly)
   - Remove deals older than 7 days without confirmation
   - Archive for analytics

4. **Refresh Store Details** (Daily)
   - Update hours, phone, address from store locator APIs
   - Verify store is still open

## Deployment Stack

**Frontend**: Vercel (Next.js)
**Backend**: Railway or Render (Node.js + Express)
**Database**: Railway PostgreSQL (with PostGIS extension)
**Cache/Queue**: Railway Redis
**CDN**: Cloudflare (optional)
**Mapping**: Mapbox

## Performance Targets

- Home page load: < 2s
- Search results: < 500ms
- Map rendering: < 1s
- Image lazy-load on scroll
- Infinite scroll with pagination
- API rate limits: 100 req/min per IP
