const { query } = require('../src/database/connection');
const fs = require('fs');
const path = require('path');

async function addAmenitiesData() {
  try {
    console.log('🔍 Testing database connection...');

    // Test connection
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Database connection successful');

    // Check if restaurants_normalized table exists
    console.log('🔍 Checking if restaurants_normalized table exists...');
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'restaurants_normalized'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('❌ restaurants_normalized table does not exist');
      console.log('Please run the database migrations first');
      return;
    }

    console.log('✅ restaurants_normalized table exists');

    // Check if amenities columns exist
    console.log('🔍 Checking amenities columns...');
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants_normalized' 
      AND column_name IN ('has_catering', 'has_shabbos_meals');
    `);

    const existingColumns = columnCheck.rows.map(row => row.column_name);

    if (!existingColumns.includes('has_catering')) {
      console.log('➕ Adding has_catering column...');
      await query(
        'ALTER TABLE restaurants_normalized ADD COLUMN has_catering BOOLEAN DEFAULT FALSE',
      );
    }

    if (!existingColumns.includes('has_shabbos_meals')) {
      console.log('➕ Adding has_shabbos_meals column...');
      await query(
        'ALTER TABLE restaurants_normalized ADD COLUMN has_shabbos_meals BOOLEAN DEFAULT FALSE',
      );
    }

    console.log('✅ All amenities columns exist');

    // Check how many restaurants exist
    const restaurantCount = await query(
      'SELECT COUNT(*) FROM restaurants_normalized',
    );
    console.log(`🔍 Found ${restaurantCount.rows[0].count} restaurants`);

    if (restaurantCount.rows[0].count === 0) {
      console.log('⚠️  No restaurants found to update');
      return;
    }

    // Update restaurants with amenities data
    console.log('🔄 Adding amenities data to restaurants...');

    await query(`
      UPDATE restaurants_normalized SET
        has_parking = CASE 
          WHEN random() < 0.7 THEN true
          ELSE false
        END,
        has_wifi = CASE 
          WHEN random() < 0.8 THEN true
          ELSE false
        END,
        has_delivery = CASE 
          WHEN random() < 0.6 THEN true
          ELSE false
        END,
        has_takeout = CASE 
          WHEN random() < 0.9 THEN true
          ELSE false
        END,
        has_dine_in = CASE 
          WHEN random() < 0.85 THEN true
          ELSE false
        END,
        has_outdoor_seating = CASE 
          WHEN random() < 0.4 THEN true
          ELSE false
        END,
        has_catering = CASE 
          WHEN random() < 0.5 THEN true
          ELSE false
        END,
        has_shabbos_meals = CASE 
          WHEN random() < 0.3 THEN true
          ELSE false
        END;
    `);

    // Get summary of amenities
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
    console.log('\n📊 Amenities Summary:');
    console.log(`   Total restaurants: ${stats.total_restaurants}`);
    console.log(`   With parking: ${stats.with_parking}`);
    console.log(`   With wifi: ${stats.with_wifi}`);
    console.log(`   With delivery: ${stats.with_delivery}`);
    console.log(`   With takeout: ${stats.with_takeout}`);
    console.log(`   With dine-in: ${stats.with_dine_in}`);
    console.log(`   With outdoor seating: ${stats.with_outdoor_seating}`);
    console.log(`   With catering: ${stats.with_catering}`);
    console.log(`   With shabbos meals: ${stats.with_shabbos_meals}`);

    console.log('\n✅ Amenities data added successfully!');
  } catch (error) {
    console.error('❌ Error adding amenities data:', error.message);
    console.error(error);
  }
}

// Run the script
addAmenitiesData()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
