// Store Adapter Base Class
// backend/src/adapters/base.adapter.ts

import { logger } from '../utils/logger';

export interface RawDeal {
  itemName: string;
  price: number;
  originalPrice?: number;
  sku?: string;
  upc?: string;
  category: string;
  imageUrl?: string;
  aisleLocation?: string;
  sectionName?: string;
  quantityReported?: number;
  sourceType: 'api' | 'scraper' | 'penny_list' | 'community';
}

export interface RawStore {
  chainStoreId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone?: string;
  hours?: Record<string, string>;
  website?: string;
}

export type StoreChain = 'DOLLAR_GENERAL' | 'DOLLAR_TREE' | 'HOME_DEPOT' | 'LOWES' | 'WALMART' | 'TARGET';

export abstract class BaseStoreAdapter {
  abstract name: string;
  abstract chain: StoreChain;

  /**
   * Fetch penny/clearance deals from store
   */
  abstract fetchDeals(): Promise<RawDeal[]>;

  /**
   * Find store locations
   */
  abstract searchStores(lat: number, lon: number, radiusMiles: number): Promise<RawStore[]>;

  /**
   * Normalize raw deal to common schema
   */
  protected normalize(raw: RawDeal): RawDeal {
    return {
      ...raw,
      sourceType: raw.sourceType || 'scraper',
    };
  }

  /**
   * Calculate confidence score (override per adapter)
   */
  protected calculateConfidence(raw: RawDeal): number {
    switch (raw.sourceType) {
      case 'penny_list':
        return 0.95; // Official penny list
      case 'api':
        return 0.90; // Official API
      case 'scraper':
        return 0.75; // Web scraping
      case 'community':
        return 0.65; // User submitted
      default:
        return 0.5;
    }
  }

  /**
   * Determine deal type
   */
  protected determineDealType(price: number, originalPrice?: number): 'PENNY' | 'DEEP_CLEARANCE' | 'CLEARANCE' {
    if (price <= 0.01) return 'PENNY';
    if (originalPrice) {
      const discount = ((originalPrice - price) / originalPrice) * 100;
      if (discount >= 70) return 'DEEP_CLEARANCE';
      if (discount >= 30) return 'CLEARANCE';
    }
    return 'CLEARANCE';
  }
}
