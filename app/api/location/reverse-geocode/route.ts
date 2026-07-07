// API route for reverse geocoding (coordinates to ZIP)
// POST /api/location/reverse-geocode

import { NextRequest, NextResponse } from 'next/server';
import { coordinatesToZip } from '@/lib/utils/geocoding';

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude } = await request.json();

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const zipCode = await coordinatesToZip(latitude, longitude);

    return NextResponse.json({ zipCode, latitude, longitude });
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return NextResponse.json(
      { error: 'Failed to determine ZIP code from location' },
      { status: 500 }
    );
  }
}
