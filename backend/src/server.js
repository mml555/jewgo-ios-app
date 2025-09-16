const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const entitiesRoutes = require('./routes/entities');
const restaurantsRoutes = require('./routes/restaurants');
const synagoguesRoutes = require('./routes/synagogues');
const mikvahsRoutes = require('./routes/mikvahs');
const storesRoutes = require('./routes/stores');
const reviewsRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3001;

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
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v5/entities', entitiesRoutes);
app.use('/api/v5/restaurants', restaurantsRoutes);
app.use('/api/v5/synagogues', synagoguesRoutes);
app.use('/api/v5/mikvahs', mikvahsRoutes);
app.use('/api/v5/stores', storesRoutes);
app.use('/api/v5/reviews', reviewsRoutes);

// Search endpoint
app.get('/api/v5/search', async (req, res) => {
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jewgo API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/api/v5`);
});

module.exports = app;
