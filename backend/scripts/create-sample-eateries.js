const { query } = require('../src/database/connection');
const { v4: uuidv4 } = require('uuid');

async function createSampleEateries() {
  try {
    console.log('🔍 Testing database connection...');

    // Test connection
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Database connection successful');

    // Check if entities_normalized table exists
    console.log('🔍 Checking if entities_normalized table exists...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'entities_normalized'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ entities_normalized table does not exist');
      console.log('Please run the database migrations first');
      return;
    }

    console.log('✅ entities_normalized table exists');

    // Check if restaurants_normalized table exists
    const restaurantTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants_normalized'
      );
    `);

    if (!restaurantTableCheck.rows[0].exists) {
      console.log('❌ restaurants_normalized table does not exist');
      return;
    }

    console.log('✅ restaurants_normalized table exists');

    // Sample eateries data
    const sampleEateries = [
      {
        name: 'Kosher Corner Deli',
        description:
          'Authentic kosher deli with fresh sandwiches and traditional Jewish cuisine',
        long_description:
          'Family-owned kosher deli serving the community for over 20 years. We specialize in traditional Jewish cuisine, fresh sandwiches, and homemade soups. Our ingredients are carefully selected and prepared according to kosher standards.',
        address: '123 Main Street',
        city: 'Brooklyn',
        state: 'NY',
        zip_code: '11201',
        phone: '(555) 123-4567',
        email: 'info@koshercorner.com',
        website: 'https://koshercorner.com',
        facebook_url: 'https://facebook.com/koshercorner',
        instagram_url: 'https://instagram.com/koshercorner',
        latitude: 40.6892,
        longitude: -74.0445,
        amenities: {
          has_parking: true,
          has_wifi: true,
          has_delivery: true,
          has_takeout: true,
          has_dine_in: true,
          has_outdoor_seating: false,
          has_catering: true,
          has_shabbos_meals: true,
        },
      },
      {
        name: 'Shalom Pizza & Grill',
        description: 'Kosher pizza and grill with dine-in and delivery options',
        long_description:
          'Serving the finest kosher pizza and grilled dishes in the area. Our wood-fired pizzas are made with fresh ingredients and our grill offers a variety of kosher meats and vegetables.',
        address: '456 Oak Avenue',
        city: 'Brooklyn',
        state: 'NY',
        zip_code: '11202',
        phone: '(555) 234-5678',
        email: 'orders@shalompizza.com',
        website: 'https://shalompizza.com',
        facebook_url: 'https://facebook.com/shalompizza',
        instagram_url: 'https://instagram.com/shalompizza',
        latitude: 40.6893,
        longitude: -74.0446,
        amenities: {
          has_parking: false,
          has_wifi: true,
          has_delivery: true,
          has_takeout: true,
          has_dine_in: true,
          has_outdoor_seating: true,
          has_catering: false,
          has_shabbos_meals: false,
        },
      },
      {
        name: 'Gourmet Kosher Bistro',
        description:
          'Upscale kosher dining with fine cuisine and elegant atmosphere',
        long_description:
          'Experience fine dining at its finest with our upscale kosher bistro. Our chef creates innovative dishes using the finest kosher ingredients, served in an elegant and comfortable atmosphere.',
        address: '789 Park Place',
        city: 'Brooklyn',
        state: 'NY',
        zip_code: '11203',
        phone: '(555) 345-6789',
        email: 'reservations@gourmetkosher.com',
        website: 'https://gourmetkosher.com',
        facebook_url: 'https://facebook.com/gourmetkosher',
        instagram_url: 'https://instagram.com/gourmetkosher',
        latitude: 40.6894,
        longitude: -74.0447,
        amenities: {
          has_parking: true,
          has_wifi: true,
          has_delivery: false,
          has_takeout: false,
          has_dine_in: true,
          has_outdoor_seating: true,
          has_catering: true,
          has_shabbos_meals: true,
        },
      },
      {
        name: 'Quick Kosher Cafe',
        description:
          'Fast casual kosher cafe with coffee, pastries, and light meals',
        long_description:
          'Your neighborhood kosher cafe for coffee, fresh pastries, and light meals. Perfect for breakfast, lunch, or a quick snack. We use only kosher ingredients and maintain the highest standards.',
        address: '321 Pine Street',
        city: 'Brooklyn',
        state: 'NY',
        zip_code: '11204',
        phone: '(555) 456-7890',
        email: 'hello@quickkosher.com',
        website: 'https://quickkosher.com',
        facebook_url: 'https://facebook.com/quickkosher',
        instagram_url: 'https://instagram.com/quickkosher',
        latitude: 40.6895,
        longitude: -74.0448,
        amenities: {
          has_parking: false,
          has_wifi: true,
          has_delivery: true,
          has_takeout: true,
          has_dine_in: true,
          has_outdoor_seating: true,
          has_catering: false,
          has_shabbos_meals: false,
        },
      },
      {
        name: 'Family Kosher Market & Deli',
        description:
          'Full-service kosher market with deli counter and prepared foods',
        long_description:
          'Your one-stop shop for all kosher needs. We offer fresh produce, kosher meats, dairy products, and a full deli counter with prepared foods. Family-owned and operated for over 30 years.',
        address: '654 Maple Drive',
        city: 'Brooklyn',
        state: 'NY',
        zip_code: '11205',
        phone: '(555) 567-8901',
        email: 'info@familykosher.com',
        website: 'https://familykosher.com',
        facebook_url: 'https://facebook.com/familykosher',
        instagram_url: 'https://instagram.com/familykosher',
        latitude: 40.6896,
        longitude: -74.0449,
        amenities: {
          has_parking: true,
          has_wifi: false,
          has_delivery: true,
          has_takeout: true,
          has_dine_in: false,
          has_outdoor_seating: false,
          has_catering: true,
          has_shabbos_meals: true,
        },
      },
    ];

    console.log(`🔄 Creating ${sampleEateries.length} sample eateries...`);

    for (const eatery of sampleEateries) {
      const entityId = uuidv4();

      // Insert into entities_normalized
      await query(
        `
        INSERT INTO entities_normalized (
          id, entity_type, name, description, long_description,
          address, city, state, zip_code, phone, email, website,
          latitude, longitude, rating, review_count, is_verified, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `,
        [
          entityId,
          'restaurant',
          eatery.name,
          eatery.description,
          eatery.long_description,
          eatery.address,
          eatery.city,
          eatery.state,
          eatery.zip_code,
          eatery.phone,
          eatery.email,
          eatery.website,
          eatery.latitude,
          eatery.longitude,
          4.5, // default rating
          0, // no reviews yet
          true, // verified
          true, // active
        ],
      );

      // Insert social media links
      if (eatery.facebook_url) {
        await query(
          `
          INSERT INTO social_links (entity_id, platform, url, is_verified)
          VALUES ($1, 'facebook', $2, true)
        `,
          [entityId, eatery.facebook_url],
        );
      }

      if (eatery.instagram_url) {
        await query(
          `
          INSERT INTO social_links (entity_id, platform, url, is_verified)
          VALUES ($1, 'instagram', $2, true)
        `,
          [entityId, eatery.instagram_url],
        );
      }

      // Insert into restaurants_normalized with amenities
      await query(
        `
        INSERT INTO restaurants_normalized (
          entity_id, kosher_level, kosher_certification, cuisine_type, price_range,
          has_parking, has_wifi, has_delivery, has_takeout, has_dine_in,
          has_outdoor_seating, has_catering, has_shabbos_meals
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `,
        [
          entityId,
          'regular',
          'OU Kosher',
          'Jewish',
          '$$',
          eatery.amenities.has_parking,
          eatery.amenities.has_wifi,
          eatery.amenities.has_delivery,
          eatery.amenities.has_takeout,
          eatery.amenities.has_dine_in,
          eatery.amenities.has_outdoor_seating,
          eatery.amenities.has_catering,
          eatery.amenities.has_shabbos_meals,
        ],
      );

      console.log(`✅ Created: ${eatery.name}`);
    }

    // Get summary of created eateries
    const summary = await query(`
      SELECT 
        COUNT(*) as total_restaurants,
        COUNT(*) FILTER (WHERE has_parking) as with_parking,
        COUNT(*) FILTER (WHERE has_wifi) as with_wifi,
        COUNT(*) FILTER (WHERE has_delivery) as with_delivery,
        COUNT(*) FILTER (WHERE has_takeout) as with_takeout,
        COUNT(*) FILTER (WHERE has_dine_in) as with_dine_in,
        COUNT(*) FILTER (WHERE has_outdoor_seating) as with_outdoor_seating,
        COUNT(*) FILTER (WHERE has_catering) as with_catering,
        COUNT(*) FILTER (WHERE has_shabbos_meals) as with_shabbos_meals
      FROM restaurants_normalized;
    `);

    const stats = summary.rows[0];
    console.log('\n📊 Created Eateries Summary:');
    console.log(`   Total restaurants: ${stats.total_restaurants}`);
    console.log(`   With parking: ${stats.with_parking}`);
    console.log(`   With wifi: ${stats.with_wifi}`);
    console.log(`   With delivery: ${stats.with_delivery}`);
    console.log(`   With takeout: ${stats.with_takeout}`);
    console.log(`   With dine-in: ${stats.with_dine_in}`);
    console.log(`   With outdoor seating: ${stats.with_outdoor_seating}`);
    console.log(`   With catering: ${stats.with_catering}`);
    console.log(`   With shabbos meals: ${stats.with_shabbos_meals}`);

    console.log('\n✅ Sample eateries created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample eateries:', error.message);
    console.error(error);
  }
}

// Run the script
createSampleEateries()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
