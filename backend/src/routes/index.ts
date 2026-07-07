// API Routes
// backend/src/routes/index.ts

import { Express } from 'express';
import { dealsRouter } from './deals.routes';
import { storesRouter } from './stores.routes';
import { confirmationsRouter } from './confirmations.routes';

export function setupRoutes(app: Express) {
  app.use('/api/deals', dealsRouter);
  app.use('/api/stores', storesRouter);
  app.use('/api/confirmations', confirmationsRouter);
}
