const { query } = require('../src/database/connection');

async function testRestaurantsAPI() {
  try {
    console.log('🔍 Testing restaurants API data...');

    // Query restaurants_normalized directly with social links
    const restaurantsQuery = `
      SELECT 
        e.id,
        e.entity_type,
        e.name,
        e.description,
        r.has_wifi,
        r.has_parking,
        r.has_delivery,
        r.has_takeout,
        r.has_dine_in,
        r.has_outdoor_seating,
        r.has_catering,
        r.has_shabbos_meals,
        (
          SELECT json_agg(
            json_build_object('platform', platform, 'url', url)
          )
          FROM social_links
          WHERE entity_id = e.id
        ) as social_links
      FROM entities_normalized e
      JOIN restaurants_normalized r ON e.id = r.entity_id
      WHERE e.entity_type = 'restaurant'
      LIMIT 3
    `;

    const result = await query(restaurantsQuery);

    console.log(`\n✅ Found ${result.rows.length} restaurants:\n`);

    result.rows.forEach((restaurant, index) => {
      console.log(`${index + 1}. ${restaurant.name}`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(
        `   Description: ${restaurant.description?.substring(0, 50)}...`,
      );
      console.log('   Amenities:');
      console.log(`     - Wifi: ${restaurant.has_wifi ? '✓' : '✗'}`);
      console.log(`     - Parking: ${restaurant.has_parking ? '✓' : '✗'}`);
      console.log(`     - Delivery: ${restaurant.has_delivery ? '✓' : '✗'}`);
      console.log(`     - Catering: ${restaurant.has_catering ? '✓' : '✗'}`);
      console.log(
        `     - Shabbos Meals: ${restaurant.has_shabbos_meals ? '✓' : '✗'}`,
      );

      if (restaurant.social_links && restaurant.social_links.length > 0) {
        console.log('   Social Media:');
        restaurant.social_links.forEach(link => {
          console.log(`     - ${link.platform}: ${link.url}`);
        });
      }
      console.log('');
    });

    console.log('\n📊 Summary:');
    console.log(`   Total restaurants: ${result.rows.length}`);
    console.log(`   With wifi: ${result.rows.filter(r => r.has_wifi).length}`);
    console.log(
      `   With parking: ${result.rows.filter(r => r.has_parking).length}`,
    );
    console.log(
      `   With catering: ${result.rows.filter(r => r.has_catering).length}`,
    );
    console.log(
      `   With shabbos meals: ${
        result.rows.filter(r => r.has_shabbos_meals).length
      }`,
    );
    console.log(
      `   With social links: ${
        result.rows.filter(r => r.social_links && r.social_links.length > 0)
          .length
      }`,
    );
  } catch (error) {
    console.error('❌ Error testing restaurants API:', error.message);
    console.error(error);
  }
}

// Run the script
testRestaurantsAPI()
  .then(() => {
    console.log('\n🎉 Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
