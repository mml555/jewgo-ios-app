#!/usr/bin/env node

/**
 * Enhance Images Script
 * 
 * Adds multiple high-quality images to each entity for better visual variety.
 * Each entity will get 2-4 images based on their type.
 * 
 * Usage: node enhance-images.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'jewgo_app',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Multiple high-quality images by category
const imageSets = {
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format', // Restaurant interior
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop&auto=format', // Food preparation
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&auto=format', // Dining area
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop&auto=format'  // Kitchen/exterior
  ],
  synagogue: [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop&auto=format', // Synagogue exterior
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format', // Sanctuary interior
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&auto=format', // Torah reading
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format'  // Community hall
  ],
  mikvah: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format', // Modern bathroom
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop&auto=format', // Spa-like interior
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&auto=format', // Clean, modern space
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&auto=format'  // Water feature
  ],
  store: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&auto=format', // Store interior
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop&auto=format', // Product displays
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&auto=format', // Shelving
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&auto=format'  // Storefront
  ],
  jobs: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format', // Office workspace
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop&auto=format', // Professional meeting
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop&auto=format', // Team collaboration
    'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop&auto=format'  // Career development
  ]
};

async function enhanceImages() {
  console.log('🚀 Enhancing images for all entities...\n');
  
  try {
    // Get all entities
    const result = await pool.query(`
      SELECT e.id, e.name, e.entity_type
      FROM entities e
      WHERE e.is_active = true
      ORDER BY e.entity_type, e.name
    `);
    
    const entities = result.rows;
    console.log(`Found ${entities.length} entities to enhance\n`);
    
    let enhanced = 0;
    
    for (const entity of entities) {
      const images = imageSets[entity.entity_type] || imageSets.restaurant;
      
      // Clear existing images for this entity
      await pool.query('DELETE FROM images WHERE entity_id = $1', [entity.id]);
      
      // Add multiple images
      for (let i = 0; i < images.length; i++) {
        const isPrimary = i === 0;
        const altText = `${entity.entity_type} - ${entity.name} (Image ${i + 1})`;
        
        await pool.query(
          'INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [entity.id, images[i], altText, isPrimary, i + 1]
        );
      }
      
      console.log(`✅ Enhanced ${entity.entity_type}: ${entity.name} (${images.length} images)`);
      enhanced++;
    }
    
    console.log(`\n🎉 Successfully enhanced ${enhanced} entities with multiple images!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

enhanceImages();
