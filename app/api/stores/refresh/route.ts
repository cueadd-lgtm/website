// API route to manually refresh deals for a ZIP code
// POST /api/stores/refresh

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { zipCode } = await request.json();

    // This endpoint would trigger a background job to re-scan all stores
    // For now, return success
    // TODO: Implement Bull queue or similar for background jobs

    return NextResponse.json({
      message: 'Refresh job queued',
      stores: [],
    });
  } catch (error) {
    console.error('Error refreshing deals:', error);
    return NextResponse.json(
      { error: 'Failed to refresh deals' },
      { status: 500 }
    );
  }
}
