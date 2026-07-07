// Backend entry point
// src/index.ts

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { setupRoutes } from './routes';
import { initializeJobs } from './jobs';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Routes
setupRoutes(app);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  
  // Initialize background jobs
  initializeJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
