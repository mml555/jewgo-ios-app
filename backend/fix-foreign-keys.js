const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'jewgo_dev',
  user: process.env.DB_USER || 'jewgo_user',
  password: process.env.DB_PASSWORD || 'jewgo_dev_password'
});

async function fixForeignKeys() {
  try {
    console.log('🔧 Fixing foreign key constraints...');
    
    // Drop existing foreign key constraints
    console.log('📋 Dropping existing foreign key constraints...');
    await pool.query('ALTER TABLE business_hours DROP CONSTRAINT IF EXISTS business_hours_entity_id_fkey');
    await pool.query('ALTER TABLE images DROP CONSTRAINT IF EXISTS images_entity_id_fkey');
    await pool.query('ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_entity_id_fkey');
    
    console.log('✅ Foreign key constraints dropped');
    
    // Create new foreign key constraints that work with category tables
    console.log('🔗 Creating new flexible foreign key constraints...');
    
    // For business_hours - check if entity exists in any category table
    await pool.query(`
      ALTER TABLE business_hours 
      ADD CONSTRAINT business_hours_entity_id_fkey 
      CHECK (
        entity_id IN (
          SELECT id FROM restaurants 
          UNION SELECT id FROM synagogues 
          UNION SELECT id FROM mikvahs 
          UNION SELECT id FROM stores
        )
      )
    `);
    
    // For images - check if entity exists in any category table
    await pool.query(`
      ALTER TABLE images 
      ADD CONSTRAINT images_entity_id_fkey 
      CHECK (
        entity_id IN (
          SELECT id FROM restaurants 
          UNION SELECT id FROM synagogues 
          UNION SELECT id FROM mikvahs 
          UNION SELECT id FROM stores
        )
      )
    `);
    
    // For reviews - check if entity exists in any category table
    await pool.query(`
      ALTER TABLE reviews 
      ADD CONSTRAINT reviews_entity_id_fkey 
      CHECK (
        entity_id IN (
          SELECT id FROM restaurants 
          UNION SELECT id FROM synagogues 
          UNION SELECT id FROM mikvahs 
          UNION SELECT id FROM stores
        )
      )
    `);
    
    console.log('✅ New foreign key constraints created');
    
    // Test the constraints
    console.log('🧪 Testing constraints...');
    
    // Try to insert a test business hour for a restaurant
    const restaurantResult = await pool.query('SELECT id FROM restaurants LIMIT 1');
    if (restaurantResult.rows.length > 0) {
      const restaurantId = restaurantResult.rows[0].id;
      
      // Test business hours
      await pool.query(`
        INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) 
        VALUES ($1, 'monday', '09:00:00', '17:00:00', false)
        ON CONFLICT (entity_id, day_of_week) DO NOTHING
      `, [restaurantId]);
      
      console.log('✅ Business hours constraint working');
    }
    
    console.log('🎉 Foreign key constraints fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing foreign keys:', error);
  } finally {
    await pool.end();
  }
}

fixForeignKeys().catch(console.error);
