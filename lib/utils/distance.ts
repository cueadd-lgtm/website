/**
 * Distance calculation utilities
 * Uses Haversine formula to calculate distance between two points on Earth
 */

const EARTH_RADIUS_MILES = 3959;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Find stores within a radius from a center point
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param stores Array of stores with coordinates
 * @param radiusMiles Radius in miles
 * @returns Filtered stores sorted by distance
 */
export function filterStoresByRadius(
  userLat: number,
  userLon: number,
  stores: Array<{ latitude: number; longitude: number; id: string }>,
  radiusMiles: number = 25
): Array<{ id: string; distance: number }> {
  return stores
    .map((store) => ({
      id: store.id,
      distance: calculateDistance(userLat, userLon, store.latitude, store.longitude),
    }))
    .filter((store) => store.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance);
}
