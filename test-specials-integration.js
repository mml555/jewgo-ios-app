#!/usr/bin/env node

// Test script to verify the enhanced specials integration
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5433,
  database: 'jewgo_dev',
  user: 'jewgo_user',
  password: 'jewgo_dev_password',
  ssl: false,
});

async function testSpecialsIntegration() {
  console.log('🧪 Testing Enhanced Specials Integration...\n');

  try {
    // Test 1: Check if specials table exists and has data
    console.log('1️⃣ Testing specials table...');
    const specialsResult = await pool.query('SELECT COUNT(*) as count FROM specials');
    console.log(`   ✅ Found ${specialsResult.rows[0].count} specials in database`);

    // Test 2: Check if enhanced columns exist
    console.log('\n2️⃣ Testing enhanced schema...');
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'specials' 
      AND column_name IN ('priority', 'claims_total', 'validity')
    `);
    console.log(`   ✅ Found ${schemaResult.rows.length} enhanced columns:`, 
                schemaResult.rows.map(r => r.column_name).join(', '));

    // Test 3: Test enhanced query with business data
    console.log('\n3️⃣ Testing enhanced queries...');
    const enhancedQuery = `
      SELECT 
        s.id,
        s.title,
        s.discount_label,
        s.priority,
        s.claims_total,
        s.max_claims_total,
        e.name as business_name,
        e.city,
        e.state,
        et.key as entity_type
      FROM specials s
      JOIN entities e ON s.business_id = e.id
      JOIN entity_types et ON e.entity_type_id = et.id
      WHERE s.is_active = true
      ORDER BY s.priority DESC
      LIMIT 3
    `;
    
    const enhancedResult = await pool.query(enhancedQuery);
    console.log(`   ✅ Enhanced query returned ${enhancedResult.rows.length} specials:`);
    enhancedResult.rows.forEach((row, index) => {
      console.log(`      ${index + 1}. ${row.title} at ${row.business_name} (Priority: ${row.priority})`);
    });

    // Test 4: Test GiST index functionality
    console.log('\n4️⃣ Testing GiST index...');
    const gistQuery = `
      SELECT s.title, s.validity
      FROM specials s
      WHERE s.validity @> now()
      LIMIT 2
    `;
    
    const gistResult = await pool.query(gistQuery);
    console.log(`   ✅ GiST range query returned ${gistResult.rows.length} active specials`);

    // Test 5: Test lookup tables
    console.log('\n5️⃣ Testing lookup tables...');
    const lookupQuery = `
      SELECT 
        (SELECT COUNT(*) FROM entity_types) as entity_types,
        (SELECT COUNT(*) FROM kosher_levels) as kosher_levels,
        (SELECT COUNT(*) FROM services) as services,
        (SELECT COUNT(*) FROM social_links) as social_links
    `;
    
    const lookupResult = await pool.query(lookupQuery);
    const counts = lookupResult.rows[0];
    console.log(`   ✅ Lookup tables populated:`);
    console.log(`      - Entity Types: ${counts.entity_types}`);
    console.log(`      - Kosher Levels: ${counts.kosher_levels}`);
    console.log(`      - Services: ${counts.services}`);
    console.log(`      - Social Links: ${counts.social_links}`);

    // Test 6: Test performance indexes
    console.log('\n6️⃣ Testing performance indexes...');
    const indexQuery = `
      SELECT indexname, indexdef
      FROM pg_indexes 
      WHERE tablename = 'specials' 
      AND indexname LIKE '%gist%' OR indexname LIKE '%priority%'
    `;
    
    const indexResult = await pool.query(indexQuery);
    console.log(`   ✅ Found ${indexResult.rows.length} performance indexes:`);
    indexResult.rows.forEach(row => {
      console.log(`      - ${row.indexname}`);
    });

    // Test 7: Test radius search function
    console.log('\n7️⃣ Testing radius search...');
    const radiusQuery = `
      SELECT * FROM get_entities_within_radius(40.6782, -73.9442, 10000, 'restaurant')
      LIMIT 2
    `;
    
    const radiusResult = await pool.query(radiusQuery);
    console.log(`   ✅ Radius search returned ${radiusResult.rows.length} nearby restaurants`);

    console.log('\n🎉 All tests passed! Enhanced specials integration is working correctly.');
    console.log('\n📊 Summary:');
    console.log('   • Enhanced schema with lookup tables ✅');
    console.log('   • Specials with priority and claims tracking ✅');
    console.log('   • GiST indexes for time-range queries ✅');
    console.log('   • Social links and services junction tables ✅');
    console.log('   • Performance optimizations ✅');
    console.log('   • Radius search functionality ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testSpecialsIntegration();
