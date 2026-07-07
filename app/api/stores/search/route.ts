// API route to search for nearby stores and their deals
// POST /api/stores/search

import { NextRequest, NextResponse } from 'next/server';
import { zipToCoordinates } from '@/lib/utils/geocoding';
import { findNearbyStores } from '@/lib/integrations/store-finder';
import { scanWalmartDeals, scanTargetDeals } from '@/lib/integrations/penny-scanner';
import { calculateDistance } from '@/lib/utils/distance';

const SCAN_RADIUS = parseInt(process.env.SCAN_RADIUS_MILES || '25');

export async function POST(request: NextRequest) {
  try {
    const { zipCode } = await request.json();

    if (!zipCode || zipCode.length !== 5) {
      return NextResponse.json(
        { error: 'Invalid ZIP code' },
        { status: 400 }
      );
    }

    // Get coordinates from ZIP code
    const location = await zipToCoordinates(zipCode);

    // Find nearby stores
    const nearbyStores = await findNearbyStores(
      location.latitude,
      location.longitude,
      ['WALMART', 'TARGET', 'BEST_BUY'],
      SCAN_RADIUS
    );

    // Scan for deals in each store
    const storesWithDeals: any[] = [];

    for (const store of nearbyStores) {
      let scanResult;

      if (store.chain === 'WALMART') {
        scanResult = await scanWalmartDeals(store.storeId);
      } else if (store.chain === 'TARGET') {
        scanResult = await scanTargetDeals(store.storeId);
      } else {
        continue;
      }

      // Calculate distance
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        store.latitude,
        store.longitude
      );

      storesWithDeals.push({
        id: store.storeId,
        name: store.name,
        chain: store.chain,
        address: store.address,
        city: store.city,
        state: store.state,
        zip: store.zip,
        distance,
        items: scanResult.items.map((item, idx) => ({
          id: `${store.storeId}-${idx}`,
          itemName: item.name,
          category: item.category,
          originalPrice: item.originalPrice || 0,
          currentPrice: item.currentPrice,
          discountPercent: item.discountPercent,
          dealType: item.dealType,
          aisleNumber: item.aisleNumber,
          section: item.section,
          notes: item.notes,
        })),
        lastUpdated: new Date().toISOString(),
      });
    }

    // Sort by distance
    storesWithDeals.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      location,
      stores: storesWithDeals,
      totalStores: storesWithDeals.length,
    });
  } catch (error) {
    console.error('Error searching stores:', error);
    return NextResponse.json(
      { error: 'Failed to search stores' },
      { status: 500 }
    );
  }
}
