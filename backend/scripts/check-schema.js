const { query } = require('../src/database/connection');

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');

    // Check entities_normalized table structure
    console.log('\n📋 entities_normalized table columns:');
    const entityColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'entities_normalized' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    entityColumns.rows.forEach(row => {
      console.log(
        `   ${row.column_name}: ${row.data_type} (${
          row.is_nullable === 'YES' ? 'nullable' : 'not null'
        })`,
      );
    });

    // Check restaurants_normalized table structure
    console.log('\n📋 restaurants_normalized table columns:');
    const restaurantColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'restaurants_normalized' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    restaurantColumns.rows.forEach(row => {
      console.log(
        `   ${row.column_name}: ${row.data_type} (${
          row.is_nullable === 'YES' ? 'nullable' : 'not null'
        })`,
      );
    });

    // Check if social_links table exists
    console.log('\n🔍 Checking for social_links table...');
    const socialLinksCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'social_links'
      );
    `);

    if (socialLinksCheck.rows[0].exists) {
      console.log('✅ social_links table exists');

      const socialLinksColumns = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'social_links' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 social_links table columns:');
      socialLinksColumns.rows.forEach(row => {
        console.log(
          `   ${row.column_name}: ${row.data_type} (${
            row.is_nullable === 'YES' ? 'nullable' : 'not null'
          })`,
        );
      });
    } else {
      console.log('❌ social_links table does not exist');
    }
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    console.error(error);
  }
}

// Run the script
checkSchema()
  .then(() => {
    console.log('\n🎉 Schema check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
