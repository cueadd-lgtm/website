// Decay Scores Job
// backend/src/jobs/decay-scores.job.ts

import { Job } from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import { calculateRecencyFactor } from '../utils/scoring';

export async function decayScoresJob(job: Job) {
  logger.info('Starting decay scores job...');

  try {
    const deals = await prisma.deal.findMany({
      where: { expiresAt: { gt: new Date() } },
    });

    let decayedCount = 0;

    for (const deal of deals) {
      const recencyFactor = calculateRecencyFactor(deal.lastSeen);
      const newConfidence = Math.max(0.1, deal.confidenceScore * recencyFactor);

      if (Math.abs(newConfidence - deal.confidenceScore) > 0.01) {
        await prisma.deal.update({
          where: { id: deal.id },
          data: { confidenceScore: newConfidence },
        });
        decayedCount++;
      }
    }

    logger.info(`Decayed ${decayedCount} deal scores`);
    return { success: true, decayedCount };
  } catch (error) {
    logger.error('Decay scores job failed:', error);
    throw error;
  }
}
