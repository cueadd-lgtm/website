// Store finder utilities
// Finds nearby stores from various retailers

export interface StoreInfo {
  chain: string;
  storeId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phoneNumber?: string;
}

/**
 * Find nearby Walmart stores
 */
export async function findWalmartStores(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<StoreInfo[]> {
  // Mock data for testing
  return [
    {
      chain: 'WALMART',
      storeId: 'walmart_001',
      name: 'Walmart Supercenter',
      address: '123 Main St',
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      latitude: 39.7817,
      longitude: -89.6501,
      phoneNumber: '(217) 555-0001',
    },
  ];
}

/**
 * Find nearby Target stores
 */
export async function findTargetStores(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<StoreInfo[]> {
  // Mock data for testing
  return [
    {
      chain: 'TARGET',
      storeId: 'target_001',
      name: 'Target',
      address: '456 Oak Ave',
      city: 'Springfield',
      state: 'IL',
      zip: '62702',
      latitude: 39.7850,
      longitude: -89.6550,
      phoneNumber: '(217) 555-0002',
    },
  ];
}

/**
 * Find all nearby stores from all chains
 */
export async function findNearbyStores(
  latitude: number,
  longitude: number,
  chains: string[] = ['WALMART', 'TARGET', 'BEST_BUY'],
  radiusMiles: number = 25
): Promise<StoreInfo[]> {
  const storePromises: Promise<StoreInfo[]>[] = [];

  if (chains.includes('WALMART')) {
    storePromises.push(findWalmartStores(latitude, longitude, radiusMiles));
  }
  
  if (chains.includes('TARGET')) {
    storePromises.push(findTargetStores(latitude, longitude, radiusMiles));
  }

  const results = await Promise.all(storePromises);
  return results.flat();
}
