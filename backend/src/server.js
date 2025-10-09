const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const logger = require('./utils/logger');
const { rateLimiters, getStats } = require('./middleware/rateLimiter');
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
const favoritesRoutes = require('./routes/favorites');
const shtetlStoresRoutes = require('./routes/shtetlStores');
const shtetlProductsRoutes = require('./routes/shtetlProducts');
const jobsRoutes = require('./routes/jobs');
const jobSeekersRoutes = require('./routes/jobSeekers');
const nearbyRoutes = require('./routes/nearby');
const eventsRoutes = require('./routes/events');
const claimsRoutes = require('./routes/claims');
const adminRoutes = require('./routes/admin');

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

// Trust proxy if behind reverse proxy (nginx, Cloudflare, etc.)
// This is important for accurate IP detection in rate limiting
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? ['https://jewgo.app', 'https://www.jewgo.app']
        : ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
  }),
);

// Apply general rate limiting to all API routes
// This provides baseline protection against abuse
app.use('/api/', rateLimiters.general);

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
      error: authHealth.error,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// Import auth routes
const createAuthRoutes = require('./routes/auth');
const createRBACRoutes = require('./routes/rbac');
const createGuestRoutes = require('./routes/guest');

// Auth routes - apply stricter rate limiting for security
app.use(
  '/api/v5/auth',
  rateLimiters.auth,
  createAuthRoutes(
    authSystem.getAuthController(),
    authSystem.getAuthMiddleware(),
  ),
);
app.use(
  '/api/v5/rbac',
  rateLimiters.auth,
  createRBACRoutes(authSystem.getRBACService(), authSystem.getAuthMiddleware()),
);
app.use(
  '/api/v5/guest',
  rateLimiters.general,
  createGuestRoutes(
    authSystem.getGuestController(),
    authSystem.getAuthMiddleware(),
  ),
);

// API routes (with authentication middleware)
// Read-only endpoints use general rate limiting
app.use(
  '/api/v5/entities',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  entitiesRoutes,
);
app.use(
  '/api/v5/restaurants',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  restaurantsRoutes,
);
app.use(
  '/api/v5/synagogues',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  synagoguesRoutes,
);
app.use(
  '/api/v5/mikvahs',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  mikvahsRoutes,
);
app.use(
  '/api/v5/stores',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  storesRoutes,
);

// Write operations get more restrictive rate limiting
app.use(
  '/api/v5/reviews',
  rateLimiters.write,
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  reviewsRoutes,
);
app.use(
  '/api/v5/interactions',
  rateLimiters.write,
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  interactionsRoutes,
);
app.use(
  '/api/v5/favorites',
  rateLimiters.write,
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  favoritesRoutes,
);
app.use(
  '/api/v5/claims',
  rateLimiters.write,
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  claimsRoutes,
);

// General endpoints
app.use(
  '/api/v5/specials',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  specialsRoutes,
);
app.use(
  '/api/v5/shtetl-stores',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  shtetlStoresRoutes,
);
app.use(
  '/api/v5/shtetl-products',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  shtetlProductsRoutes,
);
app.use(
  '/api/v5/jobs',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  jobsRoutes,
);
app.use(
  '/api/v5/job-seekers',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  jobSeekersRoutes,
);
app.use(
  '/api/v5/events',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  eventsRoutes,
);
app.use(
  '/api/v5/admin',
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  adminRoutes,
);
app.use('/api/v1', nearbyRoutes); // New optimized nearby API
// Public dashboard endpoints (no authentication required)
app.get('/api/v5/dashboard/entities/stats', async (req, res) => {
  try {
    logger.debug('📊 Fetching database statistics...');

    // Get total entities count
    const totalEntitiesQuery = `
      SELECT COUNT(*) as total_entities 
      FROM entities 
      WHERE is_active = true
    `;

    // Get entities by type
    const entitiesByTypeQuery = `
      SELECT 
        entity_type,
        COUNT(*) as count
      FROM entities 
      WHERE is_active = true
      GROUP BY entity_type
    `;

    // Get verified and active counts
    const statusQuery = `
      SELECT 
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
        AVG(rating) as average_rating,
        SUM(review_count) as total_reviews
      FROM entities
    `;

    // Execute all queries
    const [totalResult, typeResult, statusResult] = await Promise.all([
      dbPool.query(totalEntitiesQuery),
      dbPool.query(entitiesByTypeQuery),
      dbPool.query(statusQuery),
    ]);

    const totalEntities = parseInt(totalResult.rows[0].total_entities, 10);
    const typeCounts = typeResult.rows.reduce((acc, row) => {
      acc[row.entity_type] = parseInt(row.count, 10);
      return acc;
    }, {});

    const status = statusResult.rows[0];

    const stats = {
      total_entities: totalEntities,
      restaurants: typeCounts.restaurant || 0,
      synagogues: typeCounts.synagogue || 0,
      mikvahs: typeCounts.mikvah || 0,
      stores: typeCounts.store || 0,
      verified_count: parseInt(status.verified_count, 10) || 0,
      active_count: parseInt(status.active_count, 10) || 0,
      total_reviews: parseInt(status.total_reviews, 10) || 0,
      average_rating: parseFloat(status.average_rating) || 0.0,
    };

    logger.info('📊 Database statistics:', stats);

    res.json(stats);
  } catch (error) {
    logger.error('❌ Error fetching database statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics',
      message: error.message,
    });
  }
});

app.get('/api/v5/dashboard/entities/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = `
      SELECT 
        e.*,
        et.name as entity_type_name,
        u.first_name,
        u.last_name
      FROM entities e
      LEFT JOIN entity_types et ON e.entity_type_id = et.id
      LEFT JOIN users u ON e.owner_id = u.id
      WHERE e.is_active = true
      ORDER BY e.created_at DESC
      LIMIT $1
    `;

    const result = await dbPool.query(query, [limit]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    logger.error('❌ Error fetching recent entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent entities',
      message: error.message,
    });
  }
});

app.get('/api/v5/dashboard/entities/analytics', async (req, res) => {
  try {
    // Get entities created in the last 30 days
    const recentEntitiesQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM entities 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get top cities by entity count
    const topCitiesQuery = `
      SELECT 
        city,
        state,
        COUNT(*) as entity_count
      FROM entities 
      WHERE is_active = true
      GROUP BY city, state
      ORDER BY entity_count DESC
      LIMIT 10
    `;

    // Get rating distribution
    const ratingDistributionQuery = `
      SELECT 
        CASE 
          WHEN rating >= 4.5 THEN '4.5-5.0'
          WHEN rating >= 4.0 THEN '4.0-4.4'
          WHEN rating >= 3.5 THEN '3.5-3.9'
          WHEN rating >= 3.0 THEN '3.0-3.4'
          WHEN rating >= 2.5 THEN '2.5-2.9'
          WHEN rating >= 2.0 THEN '2.0-2.4'
          WHEN rating >= 1.5 THEN '1.5-1.9'
          WHEN rating >= 1.0 THEN '1.0-1.4'
          ELSE '0.0-0.9'
        END as rating_range,
        COUNT(*) as count
      FROM entities 
      WHERE is_active = true AND rating > 0
      GROUP BY rating_range
      ORDER BY rating_range
    `;

    const [recentResult, citiesResult, ratingResult] = await Promise.all([
      dbPool.query(recentEntitiesQuery),
      dbPool.query(topCitiesQuery),
      dbPool.query(ratingDistributionQuery),
    ]);

    res.json({
      success: true,
      data: {
        recent_entities: recentResult.rows,
        top_cities: citiesResult.rows,
        rating_distribution: ratingResult.rows,
      },
    });
  } catch (error) {
    logger.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message,
    });
  }
});

// Search endpoint (requires authentication) - apply search-specific rate limit
app.get(
  '/api/v5/search',
  rateLimiters.search,
  authSystem.getAuthMiddleware().requireAuthOrGuest(),
  authSystem
    .getAuthMiddleware()
    .requireGuestPermission('search:public', 'search'),
  async (req, res) => {
    try {
      const { q, ...params } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
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
            limit: parseInt(params.limit, 10) || 50,
            offset: parseInt(params.offset, 10) || 0,
            total: result.rowCount,
          },
        },
      });
    } catch (error) {
      logger.error('Error in search endpoint:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search entities',
        message: error.message,
      });
    }
  },
);

// Rate limiting statistics endpoint (for monitoring)
app.get(
  '/api/v5/admin/rate-limit-stats',
  authSystem.getAuthMiddleware().authenticate(),
  authSystem.getAuthMiddleware().requirePermission('admin:view'),
  (req, res) => {
    try {
      const stats = getStats();
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching rate limit stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch rate limit statistics',
      });
    }
  },
);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);

  res.status(error.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.shutdown('Received SIGINT. Graceful shutdown...');
  await authSystem.cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.shutdown('Received SIGTERM. Graceful shutdown...');
  await authSystem.cleanup();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.startup(`Jewgo API server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔐 Auth system: ${authSystem.healthCheck().status}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔑 Auth endpoints: http://localhost:${PORT}/api/v5/auth`);
  logger.info(`👥 RBAC endpoints: http://localhost:${PORT}/api/v5/rbac`);
  logger.info(`📖 API docs: http://localhost:${PORT}/api/v5`);
});

module.exports = app;
