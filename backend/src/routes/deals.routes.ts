// Deals Routes
// backend/src/routes/deals.routes.ts

import { Router } from 'express';
import { dealsService } from '../services/deals.service';

export const dealsRouter = Router();

/**
 * POST /api/deals/search
 * Search for deals near user location
 */
dealsRouter.post('/search', async (req, res) => {
  try {
    const { latitude, longitude, radiusMiles = 25, ...filters } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'latitude and longitude required' });
    }

    const results = await dealsService.searchDeals({
      latitude,
      longitude,
      radiusMiles,
      ...filters,
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search deals' });
  }
});

/**
 * GET /api/deals/:id
 * Get deal details
 */
dealsRouter.get('/:id', async (req, res) => {
  try {
    const deal = await dealsService.getDealById(req.params.id);

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});
