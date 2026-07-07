# How to Add a New Store Adapter

## Overview

PennyScan uses a pluggable adapter architecture. Each store has a dedicated adapter that:

1. Fetches penny/clearance deals from the store's data source
2. Scrapes store locations
3. Normalizes data to a common schema
4. Calculates confidence scores

## Store Adapter Template

```typescript
// src/adapters/stores/[store].adapter.ts

import { BaseStoreAdapter, RawDeal, RawStore, StoreChain } from '../base.adapter';
import { logger } from '../../utils/logger';

export class [StoreNameAdapter] extends BaseStoreAdapter {
  name = '[Store Display Name]';
  chain: StoreChain = '[STORE_CHAIN]';
  
  constructor() {
    super();
  }
  
  /**
   * Fetch penny/clearance deals from store
   * Implement based on available data source:
   * - Official API
   * - Web scraping
   * - Community crowdsourcing
   */
  async fetchDeals(): Promise<RawDeal[]> {
    try {
      logger.info(`[${this.name}] Fetching deals...`);
      
      // TODO: Implement data fetching
      const rawDeals = [];
      
      const normalizedDeals = rawDeals.map(raw => this.normalize(raw));
      logger.info(`[${this.name}] Found ${normalizedDeals.length} deals`);
      
      return normalizedDeals;
    } catch (error) {
      logger.error(`[${this.name}] Error fetching deals:`, error);
      return [];
    }
  }
  
  /**
   * Find store locations
   */
  async searchStores(lat: number, lon: number, radiusMiles: number): Promise<RawStore[]> {
    try {
      logger.info(`[${this.name}] Searching stores near ${lat}, ${lon}...`);
      
      // TODO: Implement store search
      // Use store locator API or scrape store finder
      const stores = [];
      
      logger.info(`[${this.name}] Found ${stores.length} stores`);
      return stores;
    } catch (error) {
      logger.error(`[${this.name}] Error searching stores:`, error);
      return [];
    }
  }
  
  /**
   * Calculate confidence score for this deal
   * Override per adapter based on source characteristics
   */
  protected calculateConfidence(raw: any): number {
    // Default: 0.75 for scraped data
    // Override for better estimates
    return 0.75;
  }
}

export default [StoreNameAdapter];
```

## Example: Dollar General Adapter

```typescript
// src/adapters/stores/dollar-general.adapter.ts

import { BaseStoreAdapter, RawDeal } from '../base.adapter';
import axios from 'axios';
import * as cheerio from 'cheerio';

export class DollarGeneralAdapter extends BaseStoreAdapter {
  name = 'Dollar General';
  chain = 'DOLLAR_GENERAL' as const;
  private pennyListUrl = 'https://www.dollargeneral.com/penny-list';
  
  async fetchDeals(): Promise<RawDeal[]> {
    try {
      // Method 1: Scrape official penny list (if available)
      const pennyListDeals = await this.scrapePennyList();
      
      // Method 2: Community submissions (fallback)
      const communityDeals = await this.getCommunitySubmissions();
      
      return [...pennyListDeals, ...communityDeals];
    } catch (error) {
      logger.error('[DollarGeneral] Error fetching deals:', error);
      return [];
    }
  }
  
  private async scrapePennyList(): Promise<RawDeal[]> {
    try {
      const response = await axios.get(this.pennyListUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PennyScan)',
        },
      });
      
      const $ = cheerio.load(response.data);
      const deals: RawDeal[] = [];
      
      // Parse penny items from DG site
      // Note: Adjust selectors based on actual site structure
      $('tr').each((i, el) => {
        const itemName = $(el).find('.item-name').text().trim();
        const price = $(el).find('.price').text().trim();
        const sku = $(el).find('.sku').text().trim();
        
        if (itemName && parseFloat(price) <= 0.01) {
          deals.push({
            itemName,
            price: parseFloat(price),
            sku,
            originalPrice: undefined, // Not available in list
            category: 'General', // Could infer from name
            sourceType: 'penny_list',
          });
        }
      });
      
      return deals;
    } catch (error) {
      logger.error('[DollarGeneral] Error scraping penny list:', error);
      return [];
    }
  }
  
  private async getCommunitySubmissions(): Promise<RawDeal[]> {
    // Fetch user-submitted deals from DB for DG
    // Filter by store chain and recent timestamp
    return []; // TODO: Query database
  }
  
  async searchStores(lat: number, lon: number, radiusMiles: number): Promise<RawStore[]> {
    // Option 1: Use DG store locator API (if available)
    // Option 2: Use Google Places API
    // Option 3: Cache of known DG locations
    return [];
  }
  
  protected calculateConfidence(raw: any): number {
    if (raw.sourceType === 'penny_list') return 0.95; // Official list
    if (raw.sourceType === 'community') return 0.65;   // User reported
    return 0.75; // Default
  }
}
```

## Step-by-Step: Adding a New Store

### 1. Create Adapter File
```bash
touch src/adapters/stores/[store].adapter.ts
```

### 2. Implement BaseStoreAdapter
```typescript
export class [StoreAdapter] extends BaseStoreAdapter {
  // Implement fetchDeals() and searchStores()
}
```

### 3. Register Adapter
```typescript
// src/adapters/index.ts

import DollarGeneralAdapter from './stores/dollar-general.adapter';
import [NewStoreAdapter] from './stores/[store].adapter';

export const ADAPTERS = [
  new DollarGeneralAdapter(),
  new [NewStoreAdapter](),
];
```

### 4. Add Chain to Database
```sql
-- Add to StoreChain enum if using Prisma
enum StoreChain {
  // ...
  [NEW_STORE]
}
```

### 5. Test the Adapter
```bash
npm run test:adapter [store]
```

## Data Sources by Store

### Dollar General
- **Source**: Official penny list (seasonally released)
- **Frequency**: Monthly or as announced
- **Confidence**: 0.95 (official)
- **Implementation**: Web scraping + PDF parsing

### Dollar Tree
- **Source**: Unofficial API + community reports
- **Frequency**: Ad-hoc
- **Confidence**: 0.70
- **Implementation**: Community crowdsourcing + historical pattern analysis

### Home Depot
- **Source**: Clearance section scraping + API (if available)
- **Frequency**: Real-time
- **Confidence**: 0.80
- **Implementation**: Web scraper monitoring clearance pages

### Lowe's
- **Source**: Similar to Home Depot
- **Frequency**: Real-time
- **Confidence**: 0.80
- **Implementation**: Web scraper + community reports

### Walmart
- **Source**: Official API + clearance scraping
- **Frequency**: Real-time
- **Confidence**: 0.85
- **Implementation**: API integration + web scraper

### Target
- **Source**: Official API + clearance section
- **Frequency**: Real-time
- **Confidence**: 0.85
- **Implementation**: API integration

## Normalization

All adapters must normalize to this schema:

```typescript
export interface NormalizedDeal {
  name: string;
  sku?: string;
  upc?: string;
  price: number;
  originalPrice?: number;
  category: string;
  imageUrl?: string;
  aisleLocation?: string;
  sourceType: 'api' | 'scraper' | 'penny_list' | 'community';
  quantityReported?: number;
}
```

## Best Practices

### Rate Limiting
```typescript
// Respect server resources
await this.rateLimiter.wait();
const response = await axios.get(url);
```

### Caching
```typescript
// Cache results for 1 hour
const cacheKey = `deals:${this.chain}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### Error Handling
```typescript
try {
  // ...
} catch (error) {
  logger.error(`[${this.name}] Error:`, error);
  return []; // Return empty array on error
}
```

### User Agent Headers
```typescript
// Always include to avoid blocking
headers: {
  'User-Agent': 'Mozilla/5.0 (compatible; PennyScan/1.0)',
}
```

## Testing Your Adapter

```typescript
// test/adapters/[store].test.ts

import [StoreAdapter] from '../../src/adapters/stores/[store].adapter';

describe('[Store] Adapter', () => {
  let adapter: [StoreAdapter];
  
  beforeEach(() => {
    adapter = new [StoreAdapter]();
  });
  
  it('should fetch deals', async () => {
    const deals = await adapter.fetchDeals();
    expect(deals.length).toBeGreaterThan(0);
  });
  
  it('should search stores', async () => {
    const stores = await adapter.searchStores(39.78, -89.65, 25);
    expect(stores.length).toBeGreaterThan(0);
  });
  
  it('should normalize deals', async () => {
    const deals = await adapter.fetchDeals();
    deals.forEach(deal => {
      expect(deal.name).toBeDefined();
      expect(deal.price).toBeDefined();
      expect(deal.sourceType).toBeDefined();
    });
  });
});
```

## Deployment

Once tested:

1. Push to main branch
2. Background job will automatically include new adapter
3. Monitor logs for errors
4. Tune confidence scores based on real-world accuracy

## Support

For questions, see [ARCHITECTURE.md](./ARCHITECTURE.md) or open an issue.
