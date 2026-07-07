// Data normalization utilities
// Converts data from various retailer formats into unified PennyScan model

import { DealType } from '@prisma/client';

export interface NormalizedItem {
  sku?: string;
  upc?: string;
  name: string;
  description?: string;
  category: string;
  originalPrice?: number;
  currentPrice: number;
  discountPercent: number;
  dealType: DealType;
  aisleNumber?: string;
  section?: string;
  notes?: string;
  imageUrl?: string;
}

/**
 * Normalize price and calculate discount percentage
 */
export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  if (originalPrice === 0) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Determine deal type based on price and discount
 */
export function determineDealType(currentPrice: number, discountPercent: number): DealType {
  // Penny deals: items marked at $0.01
  if (currentPrice <= 0.01) {
    return DealType.PENNY;
  }
  
  // Deep clearance: 70% or more off
  if (discountPercent >= 70) {
    return DealType.DEEP_CLEARANCE;
  }
  
  // Standard clearance: any other significant discount
  if (discountPercent >= 30) {
    return DealType.CLEARANCE;
  }
  
  return DealType.CLEARANCE;
}
