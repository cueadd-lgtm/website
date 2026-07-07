// Scrape Deals Job
// backend/src/jobs/scrape-deals.job.ts

import { Job } from 'bull';
import { logger } from '../utils/logger';
import { prisma } from '../utils/prisma';
import { getAllAdapters } from '../adapters';

export async function scrapeDealJob(job: Job) {
  logger.info('Starting scrape deals job...');

  try {
    const adapters = getAllAdapters();
    let totalDealsScraped = 0;

    for (const adapter of adapters) {
      logger.info(`Scraping ${adapter.name}...`);

      try {
        // Fetch deals from adapter
        const deals = await adapter.fetchDeals();
        logger.info(`${adapter.name} returned ${deals.length} deals`);

        // Find stores for this chain
        const stores = await prisma.store.findMany({
          where: { chain: adapter.chain },
        });

        // Upsert deals to database
        for (const store of stores) {
          for (const deal of deals) {
            await prisma.deal.upsert({
              where: {
                // Need unique constraint on sku + storeId
                id: `${store.id}-${deal.sku}`, // Temporary
              },
              create: {
                storeId: store.id,
                name: deal.itemName,
                sku: deal.sku,
                upc: deal.upc,
                price: deal.price,
                originalPrice: deal.originalPrice,
                category: deal.category,
                imageUrl: deal.imageUrl,
                aisleLocation: deal.aisleLocation,
                sectionName: deal.sectionName,
                quantityReported: deal.quantityReported,
                sourceType: deal.sourceType,
                confidenceScore: 0.75, // Will be calculated by adapter
                dealType: deal.price <= 0.01 ? 'PENNY' : 'CLEARANCE',
              },
              update: {
                price: deal.price,
                originalPrice: deal.originalPrice,
                lastSeen: new Date(),
                confidenceScore: 0.75,
              },
            });

            totalDealsScraped++;
          }
        }
      } catch (error) {
        logger.error(`Error scraping ${adapter.name}:`, error);
        // Continue with next adapter
      }
    }

    // Log job completion
    await prisma.jobLog.create({
      data: {
        jobName: 'scrape_deals',
        status: 'completed',
        itemsProcessed: totalDealsScraped,
        startedAt: new Date(Date.now() - 60000), // Estimate
        completedAt: new Date(),
      },
    });

    logger.info(`Scrape job completed. Total deals: ${totalDealsScraped}`);
    return { success: true, dealsScraped: totalDealsScraped };
  } catch (error) {
    logger.error('Scrape deals job failed:', error);
    throw error;
  }
}
