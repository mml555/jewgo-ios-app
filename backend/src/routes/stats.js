const express = require('express');
const { Pool } = require('pg');

const router = express.Router();

// Database connection
const pool = new Pool({
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

// GET /api/v5/entities/stats - Get database statistics
router.get('/entities/stats', async (req, res) => {
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
      pool.query(totalEntitiesQuery),
      pool.query(entitiesByTypeQuery),
      pool.query(statusQuery)
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

// GET /api/v5/entities/health - Database health check
router.get('/entities/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Test database connection with a simple query
    const result = await pool.query('SELECT NOW() as current_time, version() as version');
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      status: 'connected',
      response_time: responseTime,
      database: {
        current_time: result.rows[0].current_time,
        version: result.rows[0].version
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Database connection failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/v5/entities/recent - Get recently added entities
router.get('/entities/recent', async (req, res) => {
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
    
    const result = await pool.query(query, [limit]);
    
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

// GET /api/v5/entities/analytics - Get analytics data
router.get('/entities/analytics', async (req, res) => {
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
      pool.query(recentEntitiesQuery),
      pool.query(topCitiesQuery),
      pool.query(ratingDistributionQuery)
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

module.exports = router;
