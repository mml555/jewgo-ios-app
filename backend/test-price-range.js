/**
 * Test script to verify price_range is correctly fetched from eatery_fields
 * Run with: node backend/test-price-range.js
 */

const pool = require('./src/database/connection');

async function testPriceRangeQuery() {
  console.log('🧪 Testing price_range query from eatery_fields...\n');

  try {
    // Test the exact query structure used in EntityControllerNormalized
    const query = `
      SELECT 
        e.id,
        e.name,
        e.entity_type,
        r.kosher_level,
        r.kosher_certification,
        ef.price_min,
        ef.price_max,
        ef.price_range
      FROM entities_normalized e
      LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
      LEFT JOIN eatery_fields ef ON e.id = ef.entity_id
      WHERE e.entity_type = 'restaurant'
      AND e.is_active = true
      LIMIT 5
    `;

    const result = await pool.query(query);

    console.log(`✅ Found ${result.rows.length} restaurants\n`);

    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   Entity ID: ${row.id}`);
      console.log(`   Kosher Level: ${row.kosher_level || 'N/A'}`);
      console.log(`   Kosher Cert: ${row.kosher_certification || 'N/A'}`);
      console.log(`   Price Min: ${row.price_min || 'N/A'}`);
      console.log(`   Price Max: ${row.price_max || 'N/A'}`);
      console.log(`   Price Range: ${row.price_range || 'N/A'}`);
      console.log('');
    });

    // Check if any restaurants have price data
    const withPriceData = result.rows.filter(r => r.price_range);
    const withoutPriceData = result.rows.filter(r => !r.price_range);

    console.log('📊 Summary:');
    console.log(`   With price_range: ${withPriceData.length}`);
    console.log(`   Without price_range: ${withoutPriceData.length}`);

    if (withoutPriceData.length > 0) {
      console.log('\n⚠️  Some restaurants missing price_range data');
      console.log('   Run: psql -d jewgo_db -f sql/update_price_ranges.sql');
    } else {
      console.log('\n✅ All restaurants have price_range data!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testPriceRangeQuery();
