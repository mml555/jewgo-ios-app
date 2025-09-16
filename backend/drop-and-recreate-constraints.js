const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'jewgo_dev',
  user: process.env.DB_USER || 'jewgo_user',
  password: process.env.DB_PASSWORD || 'jewgo_dev_password'
});

async function dropAndRecreateConstraints() {
  try {
    console.log('🔧 Temporarily dropping foreign key constraints...');
    
    // Drop foreign key constraints
    await pool.query('ALTER TABLE business_hours DROP CONSTRAINT IF EXISTS business_hours_entity_id_fkey');
    await pool.query('ALTER TABLE images DROP CONSTRAINT IF EXISTS images_entity_id_fkey');
    await pool.query('ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_entity_id_fkey');
    
    console.log('✅ Foreign key constraints dropped');
    
    // Now enhance the data
    console.log('🚀 Enhancing database with complete data...');
    await enhanceAllData();
    
    // Recreate foreign key constraints
    console.log('\n🔗 Recreating foreign key constraints...');
    
    // Create new constraints that work with category tables
    await pool.query(`
      ALTER TABLE business_hours 
      ADD CONSTRAINT business_hours_entity_id_fkey 
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    `);
    
    await pool.query(`
      ALTER TABLE images 
      ADD CONSTRAINT images_entity_id_fkey 
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    `);
    
    await pool.query(`
      ALTER TABLE reviews 
      ADD CONSTRAINT reviews_entity_id_fkey 
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    `);
    
    console.log('✅ Foreign key constraints recreated');
    
    console.log('\n🎉 Database enhancement completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Try to recreate constraints even if there was an error
    try {
      console.log('🔄 Attempting to recreate constraints after error...');
      await pool.query(`
        ALTER TABLE business_hours 
        ADD CONSTRAINT business_hours_entity_id_fkey 
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      `);
      await pool.query(`
        ALTER TABLE images 
        ADD CONSTRAINT images_entity_id_fkey 
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      `);
      await pool.query(`
        ALTER TABLE reviews 
        ADD CONSTRAINT reviews_entity_id_fkey 
        FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
      `);
      console.log('✅ Constraints recreated successfully');
    } catch (recreateError) {
      console.error('❌ Failed to recreate constraints:', recreateError);
    }
  } finally {
    await pool.end();
  }
}

async function enhanceAllData() {
  const categories = ['restaurants', 'synagogues', 'mikvahs', 'stores'];
  
  for (const category of categories) {
    console.log(`\n📊 Processing ${category}...`);
    await enhanceCategory(category);
  }
}

async function enhanceCategory(categoryName) {
  // Get all entities from this category
  const result = await pool.query(`SELECT id, name FROM ${categoryName} WHERE is_active = true ORDER BY created_at`);
  const entities = result.rows;
  
  console.log(`   Found ${entities.length} ${categoryName}`);
  
  for (const entity of entities) {
    console.log(`   Processing: ${entity.name}`);
    
    // Add business hours
    await addBusinessHours(entity.id, categoryName);
    
    // Add stock images
    await addStockImages(entity.id, categoryName);
    
    // Add sample reviews
    await addSampleReviews(entity.id);
  }
  
  console.log(`   ✅ Enhanced ${entities.length} ${categoryName}`);
}

async function addBusinessHours(entityId, categoryName) {
  try {
    // Clear existing business hours
    await pool.query('DELETE FROM business_hours WHERE entity_id = $1', [entityId]);
    
    // Get category-specific hours template
    const hoursTemplate = getHoursTemplate(categoryName);
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const hours = hoursTemplate[day];
      
      if (hours === 'closed') {
        await pool.query(
          'INSERT INTO business_hours (entity_id, day_of_week, is_closed) VALUES ($1, $2, true)',
          [entityId, day]
        );
      } else {
        const [openTime, closeTime] = hours.split('-');
        await pool.query(
          'INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) VALUES ($1, $2, $3, $4, false)',
          [entityId, day, openTime, closeTime]
        );
      }
    }
    
  } catch (error) {
    console.error(`Error adding business hours for ${entityId}:`, error);
  }
}

function getHoursTemplate(categoryName) {
  const templates = {
    restaurants: [
      { sunday: '09:00-21:00', monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00', thursday: '09:00-21:00', friday: '09:00-15:00', saturday: '20:00-23:00' },
      { sunday: '10:00-22:00', monday: '11:00-22:00', tuesday: '11:00-22:00', wednesday: '11:00-22:00', thursday: '11:00-22:00', friday: '11:00-15:00', saturday: '20:00-23:30' },
      { sunday: '17:00-22:00', monday: '17:00-22:00', tuesday: '17:00-22:00', wednesday: '17:00-22:00', thursday: '17:00-22:00', friday: '17:00-15:00', saturday: '20:30-23:00' }
    ],
    synagogues: [
      { sunday: '08:00-12:00', monday: '07:00-09:00', tuesday: '07:00-09:00', wednesday: '07:00-09:00', thursday: '07:00-09:00', friday: '07:00-09:00', saturday: '09:00-12:00' },
      { sunday: '09:00-13:00', monday: '07:30-09:00', tuesday: '07:30-09:00', wednesday: '07:30-09:00', thursday: '07:30-09:00', friday: '07:30-09:00', saturday: '09:30-13:00' },
      { sunday: '10:00-14:00', monday: '07:00-09:00', tuesday: '07:00-09:00', wednesday: '07:00-09:00', thursday: '07:00-09:00', friday: '07:00-09:00', saturday: '09:00-14:00' }
    ],
    mikvahs: [
      { sunday: '08:00-22:00', monday: '08:00-22:00', tuesday: '08:00-22:00', wednesday: '08:00-22:00', thursday: '08:00-22:00', friday: '08:00-15:00', saturday: '20:00-22:00' },
      { sunday: '09:00-21:00', monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00', thursday: '09:00-21:00', friday: '09:00-14:00', saturday: '20:00-21:00' }
    ],
    stores: [
      { sunday: '08:00-20:00', monday: '08:00-21:00', tuesday: '08:00-21:00', wednesday: '08:00-21:00', thursday: '08:00-21:00', friday: '08:00-15:00', saturday: '20:00-22:00' },
      { sunday: '10:00-18:00', monday: '09:00-19:00', tuesday: '09:00-19:00', wednesday: '09:00-19:00', thursday: '09:00-19:00', friday: '09:00-15:00', saturday: '20:00-22:00' },
      { sunday: '10:00-17:00', monday: '09:00-18:00', tuesday: '09:00-18:00', wednesday: '09:00-18:00', thursday: '09:00-18:00', friday: '09:00-15:00', saturday: '20:00-21:00' }
    ]
  };
  
  const categoryTemplates = templates[categoryName];
  return categoryTemplates[Math.floor(Math.random() * categoryTemplates.length)];
}

async function addStockImages(entityId, categoryName) {
  try {
    // Clear existing images
    await pool.query('DELETE FROM images WHERE entity_id = $1', [entityId]);
    
    const images = getCategoryImages(categoryName);
    
    for (let i = 0; i < images.length; i++) {
      const isPrimary = i === 0;
      await pool.query(
        'INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [
          entityId,
          images[i],
          `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1, -1)} image ${i + 1}`,
          isPrimary,
          i + 1
        ]
      );
    }
    
  } catch (error) {
    console.error(`Error adding images for ${entityId}:`, error);
  }
}

function getCategoryImages(categoryName) {
  const images = {
    restaurants: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop'
    ],
    synagogues: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
    ],
    mikvahs: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
    ],
    stores: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'
    ]
  };
  
  return images[categoryName];
}

async function addSampleReviews(entityId) {
  try {
    // Clear existing reviews
    await pool.query('DELETE FROM reviews WHERE entity_id = $1', [entityId]);
    
    // Get or create sample users
    const userIds = await getSampleUserIds();
    
    // Generate 10 reviews with varied ratings
    const reviews = [
      { rating: 5, title: 'Amazing!', content: 'Absolutely fantastic experience. Highly recommended!' },
      { rating: 5, title: 'Perfect', content: 'Great service and quality. Will definitely return.' },
      { rating: 5, title: 'Outstanding', content: 'Exceeded all expectations. Truly exceptional.' },
      { rating: 4, title: 'Very good', content: 'Really enjoyed my visit. Good quality service.' },
      { rating: 4, title: 'Great place', content: 'Nice atmosphere and friendly staff.' },
      { rating: 4, title: 'Solid choice', content: 'Good value for money. Would recommend.' },
      { rating: 3, title: 'Average', content: 'It was okay. Nothing special but not bad.' },
      { rating: 3, title: 'Fair', content: 'Acceptable service. Could be better.' },
      { rating: 2, title: 'Disappointing', content: 'Below expectations. Service was lacking.' },
      { rating: 1, title: 'Poor experience', content: 'Terrible service. Would not recommend.' }
    ];
    
    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      const userId = userIds[i % userIds.length];
      
      await pool.query(
        'INSERT INTO reviews (entity_id, user_id, rating, title, content, is_moderated, created_at) VALUES ($1, $2, $3, $4, $5, true, $6)',
        [
          entityId,
          userId,
          review.rating,
          review.title,
          review.content,
          new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
        ]
      );
    }
    
  } catch (error) {
    console.error(`Error adding reviews for ${entityId}:`, error);
  }
}

async function getSampleUserIds() {
  const users = [
    { first_name: 'David', last_name: 'Cohen', email: 'david.cohen@example.com' },
    { first_name: 'Sarah', last_name: 'Goldberg', email: 'sarah.goldberg@example.com' },
    { first_name: 'Michael', last_name: 'Rosenberg', email: 'michael.rosenberg@example.com' },
    { first_name: 'Rachel', last_name: 'Weiss', email: 'rachel.weiss@example.com' },
    { first_name: 'Joshua', last_name: 'Silverman', email: 'joshua.silverman@example.com' },
    { first_name: 'Miriam', last_name: 'Katz', email: 'miriam.katz@example.com' },
    { first_name: 'Aaron', last_name: 'Levy', email: 'aaron.levy@example.com' },
    { first_name: 'Rebecca', last_name: 'Feldman', email: 'rebecca.feldman@example.com' },
    { first_name: 'Daniel', last_name: 'Schwartz', email: 'daniel.schwartz@example.com' },
    { first_name: 'Esther', last_name: 'Grossman', email: 'esther.grossman@example.com' }
  ];
  
  const userIds = [];
  for (const user of users) {
    try {
      const userResult = await pool.query(
        'INSERT INTO users (first_name, last_name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [user.first_name, user.last_name, user.email, 'sample_hash', new Date()]
      );
      userIds.push(userResult.rows[0].id);
    } catch (error) {
      // User might already exist, try to get existing user
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [user.email]
      );
      if (existingUser.rows.length > 0) {
        userIds.push(existingUser.rows[0].id);
      }
    }
  }
  
  return userIds;
}

dropAndRecreateConstraints().catch(console.error);
