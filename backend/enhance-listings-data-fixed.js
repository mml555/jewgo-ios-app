const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'jewgo_dev',
  user: process.env.DB_USER || 'jewgo_user',
  password: process.env.DB_PASSWORD || 'jewgo_dev_password'
});

// Realistic business hours templates
const businessHoursTemplates = {
  restaurant: [
    // Traditional Jewish Restaurant
    { sunday: '09:00-21:00', monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00', thursday: '09:00-21:00', friday: '09:00-15:00', saturday: '20:00-23:00' },
    // Fast Casual
    { sunday: '10:00-22:00', monday: '11:00-22:00', tuesday: '11:00-22:00', wednesday: '11:00-22:00', thursday: '11:00-22:00', friday: '11:00-15:00', saturday: '20:00-23:30' },
    // Upscale Restaurant
    { sunday: '17:00-22:00', monday: '17:00-22:00', tuesday: '17:00-22:00', wednesday: '17:00-22:00', thursday: '17:00-22:00', friday: '17:00-15:00', saturday: '20:30-23:00' },
    // Deli/Bakery
    { sunday: '08:00-18:00', monday: '07:00-19:00', tuesday: '07:00-19:00', wednesday: '07:00-19:00', thursday: '07:00-19:00', friday: '07:00-15:00', saturday: '20:00-22:00' }
  ],
  synagogue: [
    // Traditional Shul
    { sunday: '08:00-12:00', monday: '07:00-09:00', tuesday: '07:00-09:00', wednesday: '07:00-09:00', thursday: '07:00-09:00', friday: '07:00-09:00', saturday: '09:00-12:00' },
    // Modern Synagogue
    { sunday: '09:00-13:00', monday: '07:30-09:00', tuesday: '07:30-09:00', wednesday: '07:30-09:00', thursday: '07:30-09:00', friday: '07:30-09:00', saturday: '09:30-13:00' },
    // Chabad House
    { sunday: '10:00-14:00', monday: '07:00-09:00', tuesday: '07:00-09:00', wednesday: '07:00-09:00', thursday: '07:00-09:00', friday: '07:00-09:00', saturday: '09:00-14:00' }
  ],
  mikvah: [
    // Community Mikvah
    { sunday: '08:00-22:00', monday: '08:00-22:00', tuesday: '08:00-22:00', wednesday: '08:00-22:00', thursday: '08:00-22:00', friday: '08:00-15:00', saturday: '20:00-22:00' },
    // Private Mikvah
    { sunday: '09:00-21:00', monday: '09:00-21:00', tuesday: '09:00-21:00', wednesday: '09:00-21:00', thursday: '09:00-21:00', friday: '09:00-14:00', saturday: '20:00-21:00' }
  ],
  store: [
    // Grocery Store
    { sunday: '08:00-20:00', monday: '08:00-21:00', tuesday: '08:00-21:00', wednesday: '08:00-21:00', thursday: '08:00-21:00', friday: '08:00-15:00', saturday: '20:00-22:00' },
    // Specialty Store
    { sunday: '10:00-18:00', monday: '09:00-19:00', tuesday: '09:00-19:00', wednesday: '09:00-19:00', thursday: '09:00-19:00', friday: '09:00-15:00', saturday: '20:00-22:00' },
    // Bookstore
    { sunday: '10:00-17:00', monday: '09:00-18:00', tuesday: '09:00-18:00', wednesday: '09:00-18:00', thursday: '09:00-18:00', friday: '09:00-15:00', saturday: '20:00-21:00' }
  ]
};

// Stock image URLs by category
const stockImages = {
  restaurant: [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop', // Restaurant interior
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop', // Food preparation
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', // Dining area
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop'  // Kitchen/exterior
  ],
  synagogue: [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop', // Synagogue exterior
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop', // Sanctuary interior
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop', // Torah reading
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'  // Community hall
  ],
  mikvah: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop', // Modern bathroom
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop', // Spa-like interior
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Clean, modern space
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'  // Water feature
  ],
  store: [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Store interior
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Product displays
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Shelving
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop'  // Storefront
  ]
};

// Sample review data
const reviewTemplates = [
  {
    rating: 5,
    titles: ['Amazing experience!', 'Highly recommended!', 'Perfect!', 'Outstanding service!', 'Best in the area!'],
    contents: [
      'This place exceeded all my expectations. The quality is outstanding and the service is impeccable.',
      'I\'ve been coming here for years and they never disappoint. Truly a gem in the community.',
      'Exceptional experience from start to finish. Will definitely be back!',
      'The attention to detail and customer service is remarkable. Highly recommend to everyone.',
      'Outstanding quality and service. This is exactly what our community needed.'
    ]
  },
  {
    rating: 4,
    titles: ['Great place!', 'Very good experience', 'Solid choice', 'Good quality', 'Would recommend'],
    contents: [
      'Really enjoyed my visit here. Good quality and friendly service.',
      'Nice atmosphere and good service. Minor issues but overall a positive experience.',
      'Good value for money. Staff was helpful and the place was clean.',
      'Pleasant experience overall. Would visit again.',
      'Good quality service. Some room for improvement but definitely worth a visit.'
    ]
  },
  {
    rating: 3,
    titles: ['Average experience', 'Okay overall', 'Mixed feelings', 'Room for improvement', 'Fair'],
    contents: [
      'It was okay. Nothing special but not bad either. Average experience.',
      'Mixed experience. Some good aspects but also some areas that could be better.',
      'Fair service. Could use some improvements but acceptable overall.',
      'Average quality. Not terrible but not exceptional either.',
      'It\'s fine. Does the job but there are better options available.'
    ]
  },
  {
    rating: 2,
    titles: ['Disappointing', 'Below expectations', 'Not great', 'Could be better', 'Poor experience'],
    contents: [
      'Unfortunately didn\'t meet expectations. Service was slow and quality was lacking.',
      'Had some issues during my visit. Staff seemed overwhelmed and service suffered.',
      'Not the best experience. Several problems that affected the overall quality.',
      'Below average service. Would not recommend based on this visit.',
      'Disappointing visit. Issues with both service and quality.'
    ]
  },
  {
    rating: 1,
    titles: ['Terrible experience', 'Worst ever', 'Avoid this place', 'Complete waste', 'Awful'],
    contents: [
      'Terrible experience from start to finish. Poor service and quality.',
      'Worst visit ever. Multiple issues and no attempt to resolve them.',
      'Complete waste of time and money. Would not recommend to anyone.',
      'Awful experience. Staff was rude and service was non-existent.',
      'Horrible place. Stay away at all costs.'
    ]
  ]
];

// Sample user data for reviews
const sampleUsers = [
  { first_name: 'David', last_name: 'Cohen' },
  { first_name: 'Sarah', last_name: 'Goldberg' },
  { first_name: 'Michael', last_name: 'Rosenberg' },
  { first_name: 'Rachel', last_name: 'Weiss' },
  { first_name: 'Joshua', last_name: 'Silverman' },
  { first_name: 'Miriam', last_name: 'Katz' },
  { first_name: 'Aaron', last_name: 'Levy' },
  { first_name: 'Rebecca', last_name: 'Feldman' },
  { first_name: 'Daniel', last_name: 'Schwartz' },
  { first_name: 'Esther', last_name: 'Grossman' },
  { first_name: 'Benjamin', last_name: 'Friedman' },
  { first_name: 'Leah', last_name: 'Stein' },
  { first_name: 'Jacob', last_name: 'Meyer' },
  { first_name: 'Hannah', last_name: 'Wagner' },
  { first_name: 'Samuel', last_name: 'Berger' },
  { first_name: 'Ruth', last_name: 'Klein' },
  { first_name: 'Isaac', last_name: 'Wolf' },
  { first_name: 'Deborah', last_name: 'Baum' },
  { first_name: 'Abraham', last_name: 'Richter' },
  { first_name: 'Naomi', last_name: 'Krause' }
];

async function enhanceListingsData() {
  try {
    console.log('🚀 Starting database enhancement...');
    
    // Get all entities from each category
    const categories = ['restaurants', 'synagogues', 'mikvahs', 'stores'];
    
    for (const category of categories) {
      console.log(`\n📊 Processing ${category}...`);
      
      // Get all entities from this category
      const entitiesResult = await pool.query(`SELECT id, name FROM ${category} WHERE is_active = true ORDER BY created_at`);
      const entities = entitiesResult.rows;
      
      console.log(`   Found ${entities.length} ${category}`);
      
      for (const entity of entities) {
        console.log(`   Processing: ${entity.name}`);
        
        // Add business hours
        await addBusinessHours(entity.id, category.slice(0, -1)); // Remove 's' from category name
        
        // Add stock images
        await addStockImages(entity.id, category.slice(0, -1));
        
        // Add sample reviews
        await addSampleReviews(entity.id);
      }
    }
    
    console.log('\n✅ Database enhancement completed successfully!');
    
    // Print summary
    await printSummary();
    
  } catch (error) {
    console.error('❌ Error enhancing database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function addBusinessHours(entityId, entityType) {
  try {
    // Clear existing business hours
    await pool.query('DELETE FROM business_hours WHERE entity_id = $1', [entityId]);
    
    // Get random template for this entity type
    const templates = businessHoursTemplates[entityType];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const hours = template[day];
      
      if (hours === 'closed') {
        await pool.query(
          'INSERT INTO business_hours (entity_id, day_of_week, is_closed) VALUES ($1, $2, true)',
          [entityId, day] // Use string day name instead of integer
        );
      } else {
        const [openTime, closeTime] = hours.split('-');
        await pool.query(
          'INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) VALUES ($1, $2, $3, $4, false)',
          [entityId, day, openTime, closeTime] // Use string day name instead of integer
        );
      }
    }
    
  } catch (error) {
    console.error(`Error adding business hours for entity ${entityId}:`, error);
  }
}

async function addStockImages(entityId, entityType) {
  try {
    // Clear existing images
    await pool.query('DELETE FROM images WHERE entity_id = $1', [entityId]);
    
    const images = stockImages[entityType];
    
    for (let i = 0; i < images.length; i++) {
      const isPrimary = i === 0;
      await pool.query(
        'INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [
          entityId,
          images[i],
          `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} image ${i + 1}`,
          isPrimary,
          i + 1
        ]
      );
    }
    
  } catch (error) {
    console.error(`Error adding images for entity ${entityId}:`, error);
  }
}

async function addSampleReviews(entityId) {
  try {
    // Clear existing reviews
    await pool.query('DELETE FROM reviews WHERE entity_id = $1', [entityId]);
    
    // Generate 10 reviews with varied ratings
    const reviewCounts = [3, 4, 2, 1, 0]; // 5-star, 4-star, 3-star, 2-star, 1-star distribution
    
    for (let rating = 5; rating >= 1; rating--) {
      const count = reviewCounts[5 - rating];
      
      for (let i = 0; i < count; i++) {
        const template = reviewTemplates.find(t => t.rating === rating);
        const user = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
        
        const title = template.titles[Math.floor(Math.random() * template.titles.length)];
        const content = template.contents[Math.floor(Math.random() * template.contents.length)];
        
        // Create user if doesn't exist
        let userId;
        const userResult = await pool.query(
          'SELECT id FROM users WHERE first_name = $1 AND last_name = $2',
          [user.first_name, user.last_name]
        );
        
        if (userResult.rows.length === 0) {
          const newUserResult = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [
              user.first_name,
              user.last_name,
              `${user.first_name.toLowerCase()}.${user.last_name.toLowerCase()}@example.com`,
              'sample_password_hash', // Add required password_hash
              new Date()
            ]
          );
          userId = newUserResult.rows[0].id;
        } else {
          userId = userResult.rows[0].id;
        }
        
        // Create review
        await pool.query(
          'INSERT INTO reviews (entity_id, user_id, rating, title, content, is_moderated, created_at) VALUES ($1, $2, $3, $4, $5, true, $6)',
          [
            entityId,
            userId,
            rating,
            title,
            content,
            new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000) // Random date within last 90 days
          ]
        );
      }
    }
    
  } catch (error) {
    console.error(`Error adding reviews for entity ${entityId}:`, error);
  }
}

async function printSummary() {
  console.log('\n📊 Database Enhancement Summary:');
  console.log('================================');
  
  const categories = ['restaurants', 'synagogues', 'mikvahs', 'stores'];
  
  for (const category of categories) {
    const countResult = await pool.query(`SELECT COUNT(*) FROM ${category} WHERE is_active = true`);
    const count = countResult.rows[0].count;
    
    // Count business hours
    const hoursResult = await pool.query(`
      SELECT COUNT(*) FROM business_hours bh
      JOIN ${category} e ON bh.entity_id = e.id
      WHERE e.is_active = true
    `);
    
    // Count images
    const imagesResult = await pool.query(`
      SELECT COUNT(*) FROM images img
      JOIN ${category} e ON img.entity_id = e.id
      WHERE e.is_active = true
    `);
    
    // Count reviews
    const reviewsResult = await pool.query(`
      SELECT COUNT(*) FROM reviews r
      JOIN ${category} e ON r.entity_id = e.id
      WHERE e.is_active = true AND r.is_moderated = true
    `);
    
    console.log(`${category.charAt(0).toUpperCase() + category.slice(1, -1)}: ${count} listings`);
    console.log(`  📅 Business hours: ${hoursResult.rows[0].count} entries`);
    console.log(`  🖼️  Images: ${imagesResult.rows[0].count} images`);
    console.log(`  ⭐ Reviews: ${reviewsResult.rows[0].count} reviews`);
  }
  
  console.log('\n🎉 All listings now have:');
  console.log('   ✅ Realistic business hours');
  console.log('   ✅ 4 stock images each');
  console.log('   ✅ 10 reviews with varied ratings');
  console.log('   ✅ Sample users for reviews');
}

// Run the enhancement
enhanceListingsData().catch(console.error);
