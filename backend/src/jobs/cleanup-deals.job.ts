// Cleanup Deals Job
// backend/src/jobs/cleanup-deals.job.ts

import { Job } from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';

export async function cleanupDealsJob(job: Job) {
  logger.info('Starting cleanup deals job...');

  try {
    // Delete deals older than 7 days without recent confirmations
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { count } = await prisma.deal.deleteMany({
      where: {
        lastSeen: { lt: sevenDaysAgo },
        expiresAt: { lt: new Date() },
        confirmations: { none: {} },
      },
    });

    logger.info(`Cleaned up ${count} expired deals`);

    // Archive old search events
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const archivedEvents = await prisma.searchEvent.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });

    logger.info(`Archived ${archivedEvents.count} old search events`);

    return { success: true, dealsDeleted: count, eventsArchived: archivedEvents.count };
  } catch (error) {
    logger.error('Cleanup deals job failed:', error);
    throw error;
  }
}
