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
const favoritesRoutes = require('./routes/favorites');
const shtetlStoresRoutes = require('./routes/shtetlStores');
const shtetlProductsRoutes = require('./routes/shtetlProducts');
const jobsRoutes = require('./routes/jobs');
const statsRoutes = require('./routes/stats');
const nearbyRoutes = require('./routes/nearby');

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

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for health checks and development
    return req.path === '/health' || process.env.NODE_ENV === 'development';
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
app.use('/api/v5/favorites', authSystem.getAuthMiddleware().requireAuthOrGuest(), favoritesRoutes);
app.use('/api/v5/shtetl-stores', authSystem.getAuthMiddleware().requireAuthOrGuest(), shtetlStoresRoutes);
app.use('/api/v5/shtetl-products', authSystem.getAuthMiddleware().requireAuthOrGuest(), shtetlProductsRoutes);
app.use('/api/v5/jobs', authSystem.getAuthMiddleware().requireAuthOrGuest(), jobsRoutes);
app.use('/api/v1', nearbyRoutes); // New optimized nearby API
// Public dashboard endpoints (no authentication required)
app.get('/api/v5/dashboard/entities/stats', async (req, res) => {
  try {
    console.log('📊 Fetching database statistics...');
    
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
      dbPool.query(statusQuery)
    ]);
    
    const totalEntities = parseInt(totalResult.rows[0].total_entities);
    const typeCounts = typeResult.rows.reduce((acc, row) => {
      acc[row.entity_type] = parseInt(row.count);
      return acc;
    }, {});
    
    const status = statusResult.rows[0];
    
    const stats = {
      total_entities: totalEntities,
      restaurants: typeCounts.restaurant || 0,
      synagogues: typeCounts.synagogue || 0,
      mikvahs: typeCounts.mikvah || 0,
      stores: typeCounts.store || 0,
      verified_count: parseInt(status.verified_count) || 0,
      active_count: parseInt(status.active_count) || 0,
      total_reviews: parseInt(status.total_reviews) || 0,
      average_rating: parseFloat(status.average_rating) || 0.0
    };
    
    console.log('📊 Database statistics:', stats);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching database statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics',
      message: error.message
    });
  }
});

app.get('/api/v5/dashboard/entities/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
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
      count: result.rows.length
    });
  } catch (error) {
    console.error('❌ Error fetching recent entities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent entities',
      message: error.message
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
      dbPool.query(ratingDistributionQuery)
    ]);
    
    res.json({
      success: true,
      data: {
        recent_entities: recentResult.rows,
        top_cities: citiesResult.rows,
        rating_distribution: ratingResult.rows
      }
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

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
