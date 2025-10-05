#!/usr/bin/env node

/**
 * Quick Add Images Script
 * 
 * Simple script to add images to all entities that don't have them.
 * Uses high-quality Unsplash images appropriate for each entity type.
 * 
 * Usage: node quick-add-images.js
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

// High-quality images by category
const images = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&auto=format',
  synagogue: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop&auto=format',
  mikvah: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format',
  store: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop&auto=format',
  jobs: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format'
};

async function addMissingImages() {
  console.log('🚀 Adding images to entities without them...\n');
  
  try {
    // Find entities without images
    const result = await pool.query(`
      SELECT e.id, e.name, e.entity_type
      FROM entities e
      LEFT JOIN images i ON e.id = i.entity_id
      WHERE i.entity_id IS NULL AND e.is_active = true
      ORDER BY e.entity_type, e.name
    `);
    
    const entities = result.rows;
    console.log(`Found ${entities.length} entities without images\n`);
    
    if (entities.length === 0) {
      console.log('🎉 All entities already have images!');
      return;
    }
    
    let added = 0;
    
    for (const entity of entities) {
      const imageUrl = images[entity.entity_type] || images.restaurant; // fallback to restaurant
      const altText = `${entity.entity_type} - ${entity.name}`;
      
      await pool.query(
        'INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [entity.id, imageUrl, altText, true, 1]
      );
      
      console.log(`✅ Added image to ${entity.entity_type}: ${entity.name}`);
      added++;
    }
    
    console.log(`\n🎉 Successfully added images to ${added} entities!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addMissingImages();
