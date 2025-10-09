const { Pool } = require('pg');
require('dotenv').config();

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

// Test the connection
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Connected to PostgreSQL database');
  }
});

pool.on('error', err => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Only log in development or for slow queries
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isSlowQuery = duration > 1000; // Queries taking more than 1 second

    if (isDevelopment) {
      // In development, log all queries with truncated text for security
      console.log('🔍 Executed query', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: res.rowCount,
      });
    }

    if (isSlowQuery) {
      // Always warn about slow queries in any environment
      console.warn('⚠️ Slow query detected', {
        duration: `${duration}ms`,
        rows: res.rowCount,
        queryStart: text.substring(0, 50) + '...',
      });
    }

    return res;
  } catch (error) {
    console.error('❌ Database query error:', {
      message: error.message,
      code: error.code,
      // Don't log full query text in production for security
      queryPreview: text.substring(0, 50) + '...',
    });
    throw error;
  }
};

// Helper function to get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
};
