const { query } = require('../src/database/connection');

async function fixLocationColumn() {
  try {
    console.log('🔍 Fixing location column issue...');

    // Check if location column exists
    const locationCheck = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'entities_normalized' 
      AND table_schema = 'public'
      AND column_name = 'location';
    `);

    if (locationCheck.rows.length === 0) {
      console.log('➕ Adding location column...');

      // Add location column as POINT type (not geography since PostGIS is not available)
      await query(`
        ALTER TABLE entities_normalized 
        ADD COLUMN location POINT;
      `);

      console.log('✅ Location column added');
    } else {
      console.log('✅ Location column already exists');
    }

    // Update the trigger function to handle the location column properly
    console.log('🔧 Updating trigger function...');

    await query(`
      CREATE OR REPLACE FUNCTION update_entity_geometry()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Update location column with lat/lng coordinates
        IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW.location = POINT(NEW.longitude, NEW.latitude);
        ELSE
          NEW.location = NULL;
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Trigger function updated');

    // Test the trigger by updating an existing record (if any)
    const testUpdate = await query(`
      SELECT COUNT(*) as count FROM entities_normalized LIMIT 1;
    `);

    if (parseInt(testUpdate.rows[0].count) > 0) {
      console.log('🔄 Testing trigger with existing data...');

      // Update existing records to populate location column
      await query(`
        UPDATE entities_normalized 
        SET location = POINT(longitude, latitude)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
      `);

      console.log('✅ Existing data updated with location');
    }

    console.log('\n✅ Location column fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing location column:', error.message);
    console.error(error);
  }
}

// Run the script
fixLocationColumn()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
