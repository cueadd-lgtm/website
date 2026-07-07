// Deals Service - Core business logic
// backend/src/services/deals.service.ts

import { prisma } from '../utils/prisma';
import { calculatePriorityScore } from '../utils/scoring';
import { haversineDistance } from '../utils/distance';
import { logger } from '../utils/logger';

export interface SearchDealsInput {
  latitude: number;
  longitude: number;
  radiusMiles: number;
  storeChains?: string[];
  minConfidence?: number;
  categories?: string[];
  sortBy?: 'priority' | 'distance' | 'confidence' | 'newest';
  limit?: number;
  offset?: number;
}

export class DealsService {
  /**
   * Search for deals near user location
   */
  async searchDeals(input: SearchDealsInput) {
    const {
      latitude,
      longitude,
      radiusMiles,
      storeChains,
      minConfidence = 0.3,
      categories,
      sortBy = 'priority',
      limit = 50,
      offset = 0,
    } = input;

    try {
      // Fetch deals from database
      const deals = await prisma.deal.findMany({
        where: {
          confidenceScore: { gte: minConfidence },
          expiresAt: { gt: new Date() },
          ...(storeChains && { store: { chain: { in: storeChains as any } } }),
          ...(categories && { category: { in: categories } }),
        },
        include: {
          store: true,
          confirmations: {
            where: { createdAt: { gte: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate distances and priority scores
      const enrichedDeals = deals
        .map(deal => {
          const distance = haversineDistance(
            latitude,
            longitude,
            deal.store.latitude,
            deal.store.longitude
          );

          const priorityScore = calculatePriorityScore(
            deal,
            latitude,
            longitude,
            distance,
            deal.confirmations
          );

          return {
            ...deal,
            distance,
            priorityScore,
          };
        })
        .filter(d => d.distance <= radiusMiles);

      // Sort
      const sorted = this.sortDeals(enrichedDeals, sortBy);

      // Paginate
      const paginated = sorted.slice(offset, offset + limit);

      return {
        deals: paginated,
        total: enrichedDeals.length,
        limit,
        offset,
        hasMore: offset + limit < enrichedDeals.length,
      };
    } catch (error) {
      logger.error('Error searching deals:', error);
      throw error;
    }
  }

  /**
   * Get deal details
   */
  async getDealById(dealId: string) {
    return prisma.deal.findUnique({
      where: { id: dealId },
      include: {
        store: true,
        confirmations: {
          include: { user: { select: { username: true, trustScore: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  /**
   * Sort deals by different criteria
   */
  private sortDeals(
    deals: any[],
    sortBy: 'priority' | 'distance' | 'confidence' | 'newest'
  ): any[] {
    switch (sortBy) {
      case 'priority':
        return deals.sort((a, b) => b.priorityScore - a.priorityScore);
      case 'distance':
        return deals.sort((a, b) => a.distance - b.distance);
      case 'confidence':
        return deals.sort((a, b) => b.confidenceScore - a.confidenceScore);
      case 'newest':
        return deals.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
      default:
        return deals;
    }
  }
}

export const dealsService = new DealsService();
