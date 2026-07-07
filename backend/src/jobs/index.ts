// Background Jobs
// backend/src/jobs/index.ts

import Queue from 'bull';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';
import { scrapeDealJob } from './scrape-deals.job';
import { decayScoresJob } from './decay-scores.job';
import { cleanupDealsJob } from './cleanup-deals.job';

export const scraperQueue = new Queue('scrape-deals', redis);
export const decayQueue = new Queue('decay-scores', redis);
export const cleanupQueue = new Queue('cleanup-deals', redis);

export async function initializeJobs() {
  logger.info('Initializing background jobs...');

  // Scrape deals job (hourly)
  scraperQueue.process(async (job) => {
    await scrapeDealJob(job);
  });

  scraperQueue.add({}, {
    repeat: { cron: '0 * * * *' }, // Every hour
    removeOnComplete: true,
    removeOnFail: false,
  });

  // Decay scores job (hourly)
  decayQueue.process(async (job) => {
    await decayScoresJob(job);
  });

  decayQueue.add({}, {
    repeat: { cron: '0 * * * *' }, // Every hour
    removeOnComplete: true,
    removeOnFail: false,
  });

  // Cleanup job (nightly)
  cleanupQueue.process(async (job) => {
    await cleanupDealsJob(job);
  });

  cleanupQueue.add({}, {
    repeat: { cron: '0 0 * * *' }, // Every day at midnight
    removeOnComplete: true,
    removeOnFail: false,
  });

  logger.info('Background jobs initialized');
}
