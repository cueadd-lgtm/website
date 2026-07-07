// Adapter Registry
// backend/src/adapters/index.ts

import { BaseStoreAdapter } from './base.adapter';
import { DollarGeneralAdapter } from './stores/dollar-general.adapter';
import { HomeDepotAdapter } from './stores/home-depot.adapter';
// Import other adapters as you add them

export const ADAPTERS: BaseStoreAdapter[] = [
  new DollarGeneralAdapter(),
  new HomeDepotAdapter(),
  // new DollarTreeAdapter(),
  // new LowesAdapter(),
  // new WalmartAdapter(),
  // new TargetAdapter(),
];

export function getAdapterByChain(chain: string): BaseStoreAdapter | undefined {
  return ADAPTERS.find(a => a.chain === chain);
}

export function getAllAdapters(): BaseStoreAdapter[] {
  return ADAPTERS;
}
