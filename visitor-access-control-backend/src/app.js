const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const logger = require('./utils/logger');
const { HTTP_STATUS } = require('./config/constants');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logger (only in development)
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom morgan format for production
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API base route
app.get(`/api/${config.apiVersion}`, (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Visitor Access Control API',
    version: config.apiVersion,
    documentation: '/api/v1/docs',
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const residentRoutes = require('./routes/residentRoutes');
const securityRoutes = require('./routes/securityRoutes');
const accessRoutes = require('./routes/accessRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

// Mount route handlers
app.use(`/api/${config.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.apiVersion}/resident`, residentRoutes);
app.use(`/api/${config.apiVersion}/security`, securityRoutes);
app.use(`/api/${config.apiVersion}/access`, accessRoutes);
app.use(`/api/${config.apiVersion}/admin`, adminRoutes);

// 404 handler - must be after all routes
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;