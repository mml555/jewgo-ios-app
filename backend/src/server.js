const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import database connection
const { Pool } = require('pg');

// Import auth system
const AuthSystem = require('./auth');

// Import routes
const entitiesRoutes = require('./routes/entities');
const restaurantsRoutes = require('./routes/restaurants');
const synagoguesRoutes = require('./routes/synagogues');
const mikvahsRoutes = require('./routes/mikvahs');
const storesRoutes = require('./routes/stores');
const reviewsRoutes = require('./routes/reviews');
const interactionsRoutes = require('./routes/interactions');
const specialsRoutes = require('./routes/specials');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connection
const dbPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jewgo_dev',
  user: process.env.DB_USER || 'jewgo_user',
  password: process.env.DB_PASSWORD || 'jewgo_dev_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize auth system
const authSystem = new AuthSystem(dbPool);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://jewgo.app', 'https://www.jewgo.app']
    : ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const authHealth = await authSystem.healthCheck();
    
    res.json({
      success: true,
      status: authHealth.status,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: authHealth.services,
      error: authHealth.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Import auth routes
const createAuthRoutes = require('./routes/auth');
const createRBACRoutes = require('./routes/rbac');
const createGuestRoutes = require('./routes/guest');

// Auth routes
app.use('/api/v5/auth', createAuthRoutes(authSystem.getAuthController(), authSystem.getAuthMiddleware()));
app.use('/api/v5/rbac', createRBACRoutes(authSystem.getRBACService(), authSystem.getAuthMiddleware()));
app.use('/api/v5/guest', createGuestRoutes(authSystem.getGuestController(), authSystem.getAuthMiddleware()));

// API routes (with authentication middleware)
app.use('/api/v5/entities', authSystem.getAuthMiddleware().requireAuthOrGuest(), entitiesRoutes);
app.use('/api/v5/restaurants', authSystem.getAuthMiddleware().requireAuthOrGuest(), restaurantsRoutes);
app.use('/api/v5/synagogues', authSystem.getAuthMiddleware().requireAuthOrGuest(), synagoguesRoutes);
app.use('/api/v5/mikvahs', authSystem.getAuthMiddleware().requireAuthOrGuest(), mikvahsRoutes);
app.use('/api/v5/stores', authSystem.getAuthMiddleware().requireAuthOrGuest(), storesRoutes);
app.use('/api/v5/reviews', authSystem.getAuthMiddleware().requireAuthOrGuest(), reviewsRoutes);
app.use('/api/v5/interactions', authSystem.getAuthMiddleware().requireAuthOrGuest(), interactionsRoutes);
app.use('/api/v5/specials', authSystem.getAuthMiddleware().requireAuthOrGuest(), specialsRoutes);

// Search endpoint (requires authentication)
app.get('/api/v5/search', 
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  authSystem.getAuthMiddleware().requireGuestPermission('search:public', 'search'),
  async (req, res) => {
  try {
    const { q, ...params } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    // Import Entity model here to avoid circular dependencies
    const Entity = require('./models/Entity');
    const result = await Entity.search(`%${q}%`, params);
    
    res.json({
      success: true,
      data: {
        entities: result.rows,
        query: q,
        pagination: {
          limit: parseInt(params.limit) || 50,
          offset: parseInt(params.offset) || 0,
          total: result.rowCount
        }
      }
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search entities',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  await authSystem.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  await authSystem.cleanup();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jewgo API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth system: ${authSystem.healthCheck().status}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔑 Auth endpoints: http://localhost:${PORT}/api/v5/auth`);
  console.log(`👥 RBAC endpoints: http://localhost:${PORT}/api/v5/rbac`);
  console.log(`📖 API docs: http://localhost:${PORT}/api/v5`);
});

module.exports = app;
