const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'jewgo_dev',
  user: process.env.DB_USER || 'jewgo_user',
  password: process.env.DB_PASSWORD || 'jewgo_dev_password'
});

async function enhanceData() {
  try {
    console.log('🚀 Starting database enhancement...');
    
    // First, let's add business hours to entities that already exist
    await addBusinessHours();
    
    // Add stock images
    await addStockImages();
    
    // Add sample reviews
    await addReviews();
    
    console.log('\n✅ Database enhancement completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

async function addBusinessHours() {
  console.log('\n📅 Adding business hours...');
  
  // Get all entities from the entities table
  const result = await pool.query('SELECT id FROM entities WHERE is_active = true');
  const entities = result.rows;
  
  console.log(`Found ${entities.length} entities to add business hours to`);
  
  for (const entity of entities) {
    // Clear existing hours
    await pool.query('DELETE FROM business_hours WHERE entity_id = $1', [entity.id]);
    
    // Add standard Jewish business hours
    const hours = [
      { day: 'sunday', open: '09:00:00', close: '21:00:00' },
      { day: 'monday', open: '09:00:00', close: '21:00:00' },
      { day: 'tuesday', open: '09:00:00', close: '21:00:00' },
      { day: 'wednesday', open: '09:00:00', close: '21:00:00' },
      { day: 'thursday', open: '09:00:00', close: '21:00:00' },
      { day: 'friday', open: '09:00:00', close: '15:00:00' }, // Close early for Shabbat
      { day: 'saturday', open: '20:00:00', close: '23:00:00' } // Open after Shabbat
    ];
    
    for (const hour of hours) {
      await pool.query(
        'INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) VALUES ($1, $2, $3, $4, false)',
        [entity.id, hour.day, hour.open, hour.close]
      );
    }
  }
  
  console.log(`✅ Added business hours to ${entities.length} entities`);
}

async function addStockImages() {
  console.log('\n🖼️ Adding stock images...');
  
  const result = await pool.query('SELECT id FROM entities WHERE is_active = true');
  const entities = result.rows;
  
  const stockImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop'
  ];
  
  for (const entity of entities) {
    // Clear existing images
    await pool.query('DELETE FROM images WHERE entity_id = $1', [entity.id]);
    
    // Add 4 stock images
    for (let i = 0; i < stockImages.length; i++) {
      await pool.query(
        'INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [entity.id, stockImages[i], `Image ${i + 1}`, i === 0, i + 1]
      );
    }
  }
  
  console.log(`✅ Added images to ${entities.length} entities`);
}

async function addReviews() {
  console.log('\n⭐ Adding sample reviews...');
  
  const result = await pool.query('SELECT id FROM entities WHERE is_active = true');
  const entities = result.rows;
  
  // Create sample users first
  const users = [
    { first_name: 'David', last_name: 'Cohen', email: 'david.cohen@example.com' },
    { first_name: 'Sarah', last_name: 'Goldberg', email: 'sarah.goldberg@example.com' },
    { first_name: 'Michael', last_name: 'Rosenberg', email: 'michael.rosenberg@example.com' },
    { first_name: 'Rachel', last_name: 'Weiss', email: 'rachel.weiss@example.com' },
    { first_name: 'Joshua', last_name: 'Silverman', email: 'joshua.silverman@example.com' }
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
  
  console.log(`Created/found ${userIds.length} users for reviews`);
  
  // Add 10 reviews per entity
  for (const entity of entities) {
    // Clear existing reviews
    await pool.query('DELETE FROM reviews WHERE entity_id = $1', [entity.id]);
    
    // Add 10 reviews with varied ratings
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
      const userId = userIds[i % userIds.length]; // Cycle through users
      
      await pool.query(
        'INSERT INTO reviews (entity_id, user_id, rating, title, content, is_moderated, created_at) VALUES ($1, $2, $3, $4, $5, true, $6)',
        [
          entity.id,
          userId,
          review.rating,
          review.title,
          review.content,
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        ]
      );
    }
  }
  
  console.log(`✅ Added reviews to ${entities.length} entities`);
}

enhanceData().catch(console.error);
