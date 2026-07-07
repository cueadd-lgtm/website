// Confirmations Routes
// backend/src/routes/confirmations.routes.ts

import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export const confirmationsRouter = Router();

/**
 * POST /api/confirmations
 * Submit a confirmation (I found this / Not here)
 */
confirmationsRouter.post('/', async (req, res) => {
  try {
    const { dealId, status, notes, photoUrl, quantity } = req.body;

    if (!dealId || !status) {
      return res.status(400).json({ error: 'dealId and status required' });
    }

    const confirmation = await prisma.confirmation.create({
      data: {
        dealId,
        status: status.toUpperCase(),
        notes,
        photoUrl,
        quantity,
      },
      include: { deal: true },
    });

    // Update deal confidence based on confirmation
    if (status === 'FOUND') {
      await prisma.deal.update({
        where: { id: dealId },
        data: { confidenceScore: { increment: 0.05 } },
      });
    } else if (status === 'NOT_FOUND') {
      await prisma.deal.update({
        where: { id: dealId },
        data: { confidenceScore: { decrement: 0.10 } },
      });
    }

    logger.info(`Confirmation submitted: ${dealId} - ${status}`);
    res.json(confirmation);
  } catch (error) {
    logger.error('Error submitting confirmation:', error);
    res.status(500).json({ error: 'Failed to submit confirmation' });
  }
});

/**
 * GET /api/confirmations/:dealId
 * Get confirmations for a deal
 */
confirmationsRouter.get('/:dealId', async (req, res) => {
  try {
    const confirmations = await prisma.confirmation.findMany({
      where: { dealId: req.params.dealId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json({ confirmations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch confirmations' });
  }
});
