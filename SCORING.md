# Priority Scoring Algorithm

## Overview

PennyScan uses a sophisticated multi-factor scoring system to surface the **best deals for the user right now**—balancing proximity, confidence, recency, and stock likelihood.

## Formula

```
priority_score = (confidence × recency_factor × stock_factor) / (1 + distance_miles)

Where:
  confidence ∈ [0.0, 1.0]    - How confident this is truly a penny/clearance deal
  recency_factor ∈ [0.0, 1.0] - Decays over time since last confirmation
  stock_factor ∈ [0.0, 1.0]   - Likelihood item is actually in stock
  distance_miles ∈ [0.1, ∞]   - Distance from user to store
```

## Component Calculations

### 1. Confidence Score

Based on **source type** and **confirmation history**:

```typescript
function calculateConfidence(deal: Deal): number {
  let confidence = 0.0;
  
  // Base score by source
  switch (deal.sourceType) {
    case 'penny_list':        confidence = 0.95; break;  // DG official penny list
    case 'api':               confidence = 0.90; break;  // Official store API
    case 'scraper':           confidence = 0.75; break;  // Web scraper (pattern-based)
    case 'user_submission':   confidence = 0.65; break;  // Crowdsourced
    default:                  confidence = 0.50; break;
  }
  
  // Boost for recent user confirmations
  const recentConfirmations = deal.confirmations
    .filter(c => c.status === 'found')
    .filter(c => Date.now() - c.createdAt < 1 * 60 * 60 * 1000) // Last 1 hour
    .length;
  
  const userTrustBoost = recentConfirmations * 0.05; // +5% per confirmation
  
  // Penalize for recent "not found" reports
  const notFoundReports = deal.confirmations
    .filter(c => c.status === 'not_found')
    .filter(c => Date.now() - c.createdAt < 2 * 60 * 60 * 1000) // Last 2 hours
    .length;
  
  const notFoundPenalty = notFoundReports * 0.10; // -10% per report
  
  return Math.max(0.0, Math.min(1.0, confidence + userTrustBoost - notFoundPenalty));
}
```

### 2. Recency Factor

Decays exponentially over 24 hours:

```typescript
function calculateRecencyFactor(lastSeenAt: Date): number {
  const hoursSinceLastSeen = (Date.now() - lastSeenAt.getTime()) / (1000 * 60 * 60);
  
  // Exponential decay: fresh deals are 1.0, stale deals approach 0
  // Formula: e^(-t/6) where t = hours and 6 is the decay constant
  return Math.exp(-hoursSinceLastSeen / 6);
}

// Examples:
// 0 hours:   1.0
// 1 hour:    0.85
// 6 hours:   0.37
// 12 hours:  0.14
// 24 hours:  0.02
```

### 3. Stock Factor

Based on quantity reported and user confirmation accuracy:

```typescript
function calculateStockFactor(deal: Deal, confirmationHistory: Confirmation[]): number {
  let stockFactor = 0.5;
  
  // If quantity was reported, boost confidence
  if (deal.quantityReported) {
    if (deal.quantityReported >= 5)      stockFactor = 0.95;
    else if (deal.quantityReported >= 3) stockFactor = 0.85;
    else if (deal.quantityReported >= 1) stockFactor = 0.70;
  }
  
  // Factor in store's historical accuracy
  const storeConfirmations = confirmationHistory.filter(
    c => c.deal.storeId === deal.storeId
  );
  
  if (storeConfirmations.length > 0) {
    const foundRate = storeConfirmations
      .filter(c => c.status === 'found').length / storeConfirmations.length;
    
    stockFactor *= foundRate; // Weight by success rate
  }
  
  return Math.max(0.3, stockFactor); // Never go below 0.3
}
```

## Complete Priority Scoring

```typescript
export function calculatePriorityScore(
  deal: Deal,
  userLat: number,
  userLon: number,
  confirmationHistory: Confirmation[]
): number {
  const confidence = calculateConfidence(deal);
  const recencyFactor = calculateRecencyFactor(deal.lastSeen);
  const stockFactor = calculateStockFactor(deal, confirmationHistory);
  const distance = haversineDistance(
    userLat,
    userLon,
    deal.store.latitude,
    deal.store.longitude
  );
  
  // Main formula
  const score = (confidence * recencyFactor * stockFactor) / (1 + distance);
  
  return score; // Returns a number, higher = better
}

// Example scores:
// Fresh penny deal, 2 miles away, 5 confirmations: ~0.42
// Old deal, 50 miles away, 0 confirmations: ~0.003
// Community find, 0.5 miles away, 1 confirmation: ~0.25
```

## Sorting Options

Users can toggle between:

1. **Priority (Default)**
   - Sort by `priority_score` descending
   - Best balance of all factors

2. **Distance**
   - Sort by distance ascending
   - Find closest deals regardless of confidence

3. **Confidence**
   - Sort by confidence_score descending
   - Find most reliable deals regardless of distance

4. **Newest**
   - Sort by last_seen descending
   - Find most recently confirmed deals

## Tie-Breaking

When scores are very close, use secondary sort:

```typescript
function sortDeals(
  deals: Deal[],
  primarySort: 'priority' | 'distance' | 'confidence' | 'newest',
  userLat: number,
  userLon: number
): Deal[] {
  return deals.sort((a, b) => {
    // Primary sort
    let primaryDiff: number;
    
    switch (primarySort) {
      case 'priority':
        primaryDiff = calculatePriorityScore(b, userLat, userLon, []) - 
                      calculatePriorityScore(a, userLat, userLon, []);
        break;
      case 'distance':
        primaryDiff = haversineDistance(...a.store) - 
                      haversineDistance(...b.store);
        break;
      case 'confidence':
        primaryDiff = b.confidenceScore - a.confidenceScore;
        break;
      case 'newest':
        primaryDiff = b.lastSeen.getTime() - a.lastSeen.getTime();
        break;
    }
    
    if (Math.abs(primaryDiff) > 0.01) return primaryDiff;
    
    // Tie-breaker: confidence
    return b.confidenceScore - a.confidenceScore;
  });
}
```

## Confidence Decay Over Time

Deals lose confidence if they go unconfirmed:

```typescript
const CONFIDENCE_DECAY_PER_HOUR = 0.02;

function applyConfidenceDecay(deal: Deal): void {
  const hoursSinceUpdate = (Date.now() - deal.updatedAt.getTime()) / (1000 * 60 * 60);
  const decayAmount = hoursSinceUpdate * CONFIDENCE_DECAY_PER_HOUR;
  
  deal.confidenceScore = Math.max(0.1, deal.confidenceScore - decayAmount);
}
```

## User Trust Scoring

```typescript
export function calculateUserTrustScore(user: User): number {
  // Base score
  let trustScore = 0.5;
  
  // Rewards
  trustScore += Math.min(0.3, user.accurateReports * 0.01);      // +1% per accurate report
  trustScore += Math.min(0.1, user.submissions_count * 0.001);   // +0.1% per submission
  
  // Penalties
  const falseClaims = (user.submissions_count - user.accurate_reports);
  trustScore -= Math.min(0.2, falseClaims * 0.02);               // -2% per false claim
  
  return Math.max(0.0, Math.min(1.0, trustScore));
}
```

## Filtering (Pre-Sorting)

Before sorting, apply user filters:

```typescript
function filterDeals(
  deals: Deal[],
  filters: {
    storeChains?: string[];
    radiusMiles?: number;
    minConfidence?: number;
    categories?: string[];
    maxPrice?: number;
  },
  userLat: number,
  userLon: number
): Deal[] {
  return deals.filter(deal => {
    // Store chain filter
    if (filters.storeChains?.length && !filters.storeChains.includes(deal.store.chain)) {
      return false;
    }
    
    // Radius filter
    if (filters.radiusMiles) {
      const distance = haversineDistance(userLat, userLon, deal.store.latitude, deal.store.longitude);
      if (distance > filters.radiusMiles) return false;
    }
    
    // Confidence filter
    if (filters.minConfidence && deal.confidenceScore < filters.minConfidence) {
      return false;
    }
    
    // Category filter
    if (filters.categories?.length && !filters.categories.includes(deal.category)) {
      return false;
    }
    
    // Price filter
    if (filters.maxPrice && deal.price > filters.maxPrice) {
      return false;
    }
    
    return true;
  });
}
```

## Real-World Examples

### Example 1: Fresh Penny from Official List
```
Store: Dollar General #1234 (2 miles away)
Item: Smart LED Bulb ($0.01, usually $29.99)
Source: Official penny list
Quantity: Multiple units reported
Recent confirmations: 3 "found" in last hour

Calculation:
- Confidence: 0.95 (official list) + 0.15 (3 confirmations) = 0.95 (capped)
- Recency: 0.95 (within 10 minutes)
- Stock: 0.95 (multiple reported)
- Distance: 2 miles

Score = (0.95 × 0.95 × 0.95) / (1 + 2) = 0.286
```

### Example 2: Older User Report
```
Store: Home Depot #567 (15 miles away)
Item: Kitchen Gadget ($0.01, user reported)
Source: Community submission
Quantity: Single unit
Recent confirmations: 0 (2 hours old)

Calculation:
- Confidence: 0.65 (user submission)
- Recency: 0.37 (6 hours old, applying decay)
- Stock: 0.70 (single unit)
- Distance: 15 miles

Score = (0.65 × 0.37 × 0.70) / (1 + 15) = 0.0106
```

## Tuning

Adjust these constants in `.env` to fine-tune behavior:

```
# Scoring weights
CONFIDENCE_PENNY_LIST=0.95
CONFIDENCE_API=0.90
CONFIDENCE_SCRAPER=0.75
CONFIDENCE_USER=0.65
CONFIDENCE_BOOST_PER_CONFIRMATION=0.05
CONFIDENCE_PENALTY_PER_NOTFOUND=0.10
CONFIDENCE_DECAY_PER_HOUR=0.02

# Recency
RECENCY_DECAY_CONSTANT=6  # Hours

# Stock
MIN_STOCK_FACTOR=0.3
```
