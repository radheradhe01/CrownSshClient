/**
 * local server entry file, for local development
 */
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { initWebSocket } from './services/socketService.js';
import connectDB from './config/db.js';
import './workers/executionWorker.js'; // Start the worker
import logger from './utils/logger.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 7002;

// Connect to Database
connectDB();

const server = app.listen(PORT, () => {
  logger.info(`Server ready on port ${PORT}`);
});

initWebSocket(server);

/**
 * close server
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;