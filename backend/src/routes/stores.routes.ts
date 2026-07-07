// Stores Routes
// backend/src/routes/stores.routes.ts

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { haversineDistance } from '../utils/distance';

export const storesRouter = Router();

/**
 * GET /api/stores/nearby
 * Find stores near user location
 */
storesRouter.get('/nearby', async (req, res) => {
  try {
    const { lat, lon, radius = 25 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'lat and lon required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lon as string);
    const radiusMiles = parseFloat(radius as string);

    const stores = await prisma.store.findMany({
      include: {
        _count: { select: { deals: true } },
      },
    });

    const nearby = stores
      .map(store => ({
        ...store,
        distance: haversineDistance(latitude, longitude, store.latitude, store.longitude),
        dealCount: store._count.deals,
      }))
      .filter(s => s.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    res.json({ stores: nearby });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});
