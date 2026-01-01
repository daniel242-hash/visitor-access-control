const app = require('./app');
const connectDB = require('./config/database');
const config = require('./config/env');
const logger = require('./utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`Error: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

// Connect to database
connectDB();

// Start server - Updated to bind to 0.0.0.0 for Railway/Render
const PORT = config.port;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all network interfaces

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running in ${config.nodeEnv} mode`);
  logger.info(`📡 Listening on ${HOST}:${PORT}`);
  logger.info(`📡 API endpoint: http://localhost:${PORT}/api/${config.apiVersion}`);
  logger.info(`✅ Health check: http://localhost:${PORT}/health`);
  logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(`Error: ${err.name} - ${err.message}`);
  logger.error(err.stack);
  
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM (for graceful shutdown on platforms like Railway/Render)
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('💤 Process terminated');
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('👋 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('💤 Process terminated');
    process.exit(0);
  });
});