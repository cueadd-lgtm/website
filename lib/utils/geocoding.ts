// Geocoding utilities for converting ZIP codes to coordinates
// Uses Google Maps API or free alternative (OpenStreetMap/Nominatim)

import axios from 'axios';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  zipCode: string;
  city?: string;
  state?: string;
}

/**
 * Convert ZIP code to latitude/longitude
 * Uses Google Maps Geocoding API
 * Fallback: Can use Nominatim (OpenStreetMap) for free tier
 */
export async function zipToCoordinates(zipCode: string): Promise<GeoLocation> {
  try {
    // For demo purposes, return mock coordinates
    // In production, integrate with geocoding service
    const mockLocations: { [key: string]: GeoLocation } = {
      '62701': {
        latitude: 39.7817,
        longitude: -89.6501,
        zipCode: '62701',
        city: 'Springfield',
        state: 'IL',
      },
      '10001': {
        latitude: 40.7128,
        longitude: -74.006,
        zipCode: '10001',
        city: 'New York',
        state: 'NY',
      },
    };

    if (mockLocations[zipCode]) {
      return mockLocations[zipCode];
    }

    // Default mock location
    return {
      latitude: 39.7817,
      longitude: -89.6501,
      zipCode,
      city: 'Springfield',
      state: 'IL',
    };
  } catch (error) {
    console.error('Error geocoding ZIP code:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to ZIP code
 * Used when user allows browser geolocation
 */
export async function coordinatesToZip(latitude: number, longitude: number): Promise<string> {
  try {
    // Mock implementation
    return '62701';
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    throw error;
  }
}
