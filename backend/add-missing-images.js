#!/usr/bin/env node

/**
 * Add Missing Images Script
 * 
 * This script finds all entities in the database that don't have images
 * and adds appropriate stock images based on their entity type.
 * 
 * Usage: node add-missing-images.js
 */

const { Pool } = require('pg');
require('dotenv').config();

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'jewgo_app',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// High-quality stock images by category
const stockImages = {
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
  ],
  // Default fallback images
  default: [
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop&auto=format', // Generic business
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format', // Professional building
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&auto=format', // Modern office
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop&auto=format'  // Business exterior
  ]
};

/**
 * Get entities that don't have any images
 */
async function getEntitiesWithoutImages() {
  try {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.entity_type,
        e.description
      FROM entities e
      LEFT JOIN images i ON e.id = i.entity_id
      WHERE i.entity_id IS NULL
      AND e.is_active = true
      ORDER BY e.entity_type, e.title
    `;
    
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching entities without images:', error);
    throw error;
  }
}

/**
 * Add images to an entity
 */
async function addImagesToEntity(entityId, entityType, entityTitle) {
  try {
    // Get appropriate images for the entity type
    const images = stockImages[entityType] || stockImages.default;
    
    console.log(`📸 Adding ${images.length} images to ${entityType}: ${entityTitle}`);
    
    // Add each image
    for (let i = 0; i < images.length; i++) {
      const isPrimary = i === 0; // First image is primary
      const altText = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} - ${entityTitle} (Image ${i + 1})`;
      
      await pool.query(
        `INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order, created_at) 
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [
          entityId,
          images[i],
          altText,
          isPrimary,
          i + 1
        ]
      );
    }
    
    console.log(`✅ Successfully added ${images.length} images to ${entityTitle}`);
    return true;
  } catch (error) {
    console.error(`❌ Error adding images to entity ${entityId}:`, error);
    return false;
  }
}

/**
 * Get statistics about current images in database
 */
async function getImageStatistics() {
  try {
    const stats = await pool.query(`
      SELECT 
        e.entity_type,
        COUNT(DISTINCT e.id) as total_entities,
        COUNT(DISTINCT CASE WHEN i.id IS NOT NULL THEN e.id END) as entities_with_images,
        COUNT(DISTINCT CASE WHEN i.id IS NULL THEN e.id END) as entities_without_images,
        COUNT(i.id) as total_images
      FROM entities e
      LEFT JOIN images i ON e.id = i.entity_id
      WHERE e.is_active = true
      GROUP BY e.entity_type
      ORDER BY e.entity_type
    `);
    
    return stats.rows;
  } catch (error) {
    console.error('Error getting image statistics:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Add Missing Images Script...\n');
  
  try {
    // Get current statistics
    console.log('📊 Current Image Statistics:');
    const stats = await getImageStatistics();
    
    let totalEntities = 0;
    let totalWithImages = 0;
    let totalWithoutImages = 0;
    let totalImages = 0;
    
    stats.forEach(stat => {
      console.log(`  ${stat.entity_type}: ${stat.entities_with_images}/${stat.total_entities} entities have images (${stat.total_images} total images)`);
      totalEntities += parseInt(stat.total_entities);
      totalWithImages += parseInt(stat.entities_with_images);
      totalWithoutImages += parseInt(stat.entities_without_images);
      totalImages += parseInt(stat.total_images);
    });
    
    console.log(`\n📈 Summary: ${totalWithImages}/${totalEntities} entities have images (${totalWithoutImages} missing images)`);
    console.log(`🖼️  Total images in database: ${totalImages}\n`);
    
    if (totalWithoutImages === 0) {
      console.log('🎉 All entities already have images! No action needed.');
      return;
    }
    
    // Get entities without images
    console.log('🔍 Finding entities without images...');
    const entitiesWithoutImages = await getEntitiesWithoutImages();
    
    console.log(`Found ${entitiesWithoutImages.length} entities without images:\n`);
    
    // Group by entity type for better reporting
    const groupedEntities = entitiesWithoutImages.reduce((acc, entity) => {
      if (!acc[entity.entity_type]) {
        acc[entity.entity_type] = [];
      }
      acc[entity.entity_type].push(entity);
      return acc;
    }, {});
    
    // Show what will be processed
    Object.entries(groupedEntities).forEach(([entityType, entities]) => {
      console.log(`  ${entityType}: ${entities.length} entities`);
      entities.slice(0, 3).forEach(entity => {
        console.log(`    - ${entity.title}`);
      });
      if (entities.length > 3) {
        console.log(`    ... and ${entities.length - 3} more`);
      }
    });
    
    console.log(`\n🔄 Processing ${entitiesWithoutImages.length} entities...\n`);
    
    // Process each entity
    let successCount = 0;
    let errorCount = 0;
    
    for (const entity of entitiesWithoutImages) {
      const success = await addImagesToEntity(entity.id, entity.entity_type, entity.title);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 Processing Complete:`);
    console.log(`  ✅ Successfully processed: ${successCount} entities`);
    console.log(`  ❌ Errors: ${errorCount} entities`);
    
    // Get updated statistics
    console.log('\n📊 Updated Image Statistics:');
    const updatedStats = await getImageStatistics();
    
    let newTotalWithImages = 0;
    let newTotalImages = 0;
    
    updatedStats.forEach(stat => {
      console.log(`  ${stat.entity_type}: ${stat.entities_with_images}/${stat.total_entities} entities have images (${stat.total_images} total images)`);
      newTotalWithImages += parseInt(stat.entities_with_images);
      newTotalImages += parseInt(stat.total_images);
    });
    
    console.log(`\n🎉 Final Summary:`);
    console.log(`  📈 Entities with images: ${newTotalWithImages}/${totalEntities} (was ${totalWithImages})`);
    console.log(`  🖼️  Total images: ${newTotalImages} (was ${totalImages})`);
    console.log(`  ➕ Added: ${newTotalImages - totalImages} new images`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔚 Database connection closed.');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getEntitiesWithoutImages,
  addImagesToEntity,
  getImageStatistics,
  stockImages
};
