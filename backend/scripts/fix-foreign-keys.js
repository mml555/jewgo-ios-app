const { query } = require('../src/database/connection');

async function fixForeignKeys() {
  try {
    console.log('🔍 Checking and fixing foreign key constraints...');

    // Check foreign key constraints on social_links table
    console.log('\n📋 Foreign key constraints on social_links table:');
    const fkConstraints = await query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'social_links'
        AND tc.table_schema = 'public';
    `);

    fkConstraints.rows.forEach(row => {
      console.log(
        `   ${row.constraint_name}: ${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`,
      );
    });

    // Drop the old foreign key constraint if it exists
    if (fkConstraints.rows.length > 0) {
      console.log('\n🔧 Dropping old foreign key constraints...');

      for (const constraint of fkConstraints.rows) {
        if (constraint.foreign_table_name === 'entities') {
          console.log(`   Dropping ${constraint.constraint_name}...`);
          await query(
            `ALTER TABLE social_links DROP CONSTRAINT ${constraint.constraint_name}`,
          );
        }
      }

      console.log('✅ Old foreign key constraints dropped');
    }

    // Add new foreign key constraint pointing to entities_normalized
    console.log('\n➕ Adding new foreign key constraint...');

    await query(`
      ALTER TABLE social_links 
      ADD CONSTRAINT fk_social_links_entity_normalized
      FOREIGN KEY (entity_id) 
      REFERENCES entities_normalized(id) 
      ON DELETE CASCADE;
    `);

    console.log('✅ New foreign key constraint added');

    // Check other tables that might have similar issues
    console.log('\n🔍 Checking other tables for foreign key issues...');

    const allFkConstraints = await query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'entities'
        AND tc.table_schema = 'public';
    `);

    if (allFkConstraints.rows.length > 0) {
      console.log(
        '⚠️  Found other tables with foreign keys pointing to old entities table:',
      );
      allFkConstraints.rows.forEach(row => {
        console.log(
          `   ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`,
        );
      });

      console.log('\n🔧 Fixing other foreign key constraints...');

      for (const constraint of allFkConstraints.rows) {
        console.log(
          `   Fixing ${constraint.table_name}.${constraint.constraint_name}...`,
        );

        // Drop old constraint
        await query(
          `ALTER TABLE ${constraint.table_name} DROP CONSTRAINT ${constraint.constraint_name}`,
        );

        // Add new constraint
        await query(`
          ALTER TABLE ${constraint.table_name} 
          ADD CONSTRAINT ${constraint.constraint_name.replace(
            'entity',
            'entity_normalized',
          )}
          FOREIGN KEY (${constraint.column_name}) 
          REFERENCES entities_normalized(id) 
          ON DELETE CASCADE;
        `);
      }

      console.log('✅ Other foreign key constraints fixed');
    } else {
      console.log('✅ No other foreign key issues found');
    }

    console.log('\n✅ Foreign key fix completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing foreign keys:', error.message);
    console.error(error);
  }
}

// Run the script
fixForeignKeys()
  .then(() => {
    console.log('\n🎉 Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
