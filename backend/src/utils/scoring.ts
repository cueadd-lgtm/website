// Priority Scoring Utility
// backend/src/utils/scoring.ts

import { Deal, Confirmation } from '@prisma/client';

/**
 * Calculate priority score for a deal
 * Formula: (confidence × recency_factor × stock_factor) / (1 + distance)
 */
export function calculatePriorityScore(
  deal: Deal,
  userLat: number,
  userLon: number,
  distance: number,
  confirmations: (Confirmation & { user?: any })[]
): number {
  const confidence = calculateConfidence(deal, confirmations);
  const recencyFactor = calculateRecencyFactor(deal.lastSeen);
  const stockFactor = calculateStockFactor(deal, confirmations);

  return (confidence * recencyFactor * stockFactor) / (1 + distance);
}

/**
 * Calculate confidence score based on source and confirmations
 */
export function calculateConfidence(
  deal: Deal,
  confirmations: (Confirmation & { user?: any })[]
): number {
  let confidence = deal.confidenceScore;

  // Boost for recent "found" confirmations
  const recentFound = confirmations.filter(
    c => c.status === 'FOUND' && 
    Date.now() - c.createdAt.getTime() < 1 * 60 * 60 * 1000 // Last 1 hour
  ).length;
  confidence += recentFound * 0.05; // +5% per confirmation

  // Penalize for "not found" reports
  const recentNotFound = confirmations.filter(
    c => c.status === 'NOT_FOUND' && 
    Date.now() - c.createdAt.getTime() < 2 * 60 * 60 * 1000 // Last 2 hours
  ).length;
  confidence -= recentNotFound * 0.10; // -10% per report

  return Math.max(0.0, Math.min(1.0, confidence));
}

/**
 * Calculate recency factor (exponential decay over 24 hours)
 */
export function calculateRecencyFactor(lastSeenAt: Date): number {
  const hoursSinceLastSeen = (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60);
  // Exponential decay: e^(-t/6) where t = hours
  return Math.exp(-hoursSinceLastSeen / 6);
}

/**
 * Calculate stock likelihood factor
 */
export function calculateStockFactor(
  deal: Deal,
  confirmations: Confirmation[]
): number {
  let stockFactor = 0.5;

  // Quantity reported
  if (deal.quantityReported) {
    if (deal.quantityReported >= 5) stockFactor = 0.95;
    else if (deal.quantityReported >= 3) stockFactor = 0.85;
    else if (deal.quantityReported >= 1) stockFactor = 0.70;
  }

  // Historical accuracy
  const foundConfirmations = confirmations.filter(c => c.status === 'FOUND').length;
  const totalConfirmations = confirmations.length;

  if (totalConfirmations > 0) {
    const foundRate = foundConfirmations / totalConfirmations;
    stockFactor *= foundRate;
  }

  return Math.max(0.3, stockFactor);
}
