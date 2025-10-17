const { query } = require('../src/database/connection');

async function checkTriggers() {
  try {
    console.log('🔍 Checking database triggers...');

    // Check triggers on entities_normalized table
    console.log('\n📋 Triggers on entities_normalized table:');
    const triggers = await query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'entities_normalized' 
      AND event_object_schema = 'public'
      ORDER BY trigger_name;
    `);

    triggers.rows.forEach(row => {
      console.log(
        `   ${row.trigger_name}: ${row.action_timing} ${row.event_manipulation}`,
      );
      console.log(`     Action: ${row.action_statement}`);
    });

    // Check if location column exists
    console.log('\n🔍 Checking for location column in entities_normalized...');
    const locationCheck = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'entities_normalized' 
      AND table_schema = 'public'
      AND column_name IN ('location', 'geom');
    `);

    if (locationCheck.rows.length > 0) {
      console.log('✅ Location/geometry columns found:');
      locationCheck.rows.forEach(row => {
        console.log(`   ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ No location/geometry columns found');
    }

    // Check if PostGIS is available
    console.log('\n🔍 Checking PostGIS availability...');
    const postgisCheck = await query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
      );
    `);

    if (postgisCheck.rows[0].exists) {
      console.log('✅ PostGIS extension is available');
    } else {
      console.log('❌ PostGIS extension is not available');
    }
  } catch (error) {
    console.error('❌ Error checking triggers:', error.message);
    console.error(error);
  }
}

// Run the script
checkTriggers()
  .then(() => {
    console.log('\n🎉 Trigger check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
