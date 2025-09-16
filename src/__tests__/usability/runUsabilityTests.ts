#!/usr/bin/env ts-node

/**
 * Usability Test Execution Script
 * Run this script to execute comprehensive usability and accessibility testing
 */

import { runQuickUsabilityTest, runFullUsabilityTest } from './UsabilityTestExecution';

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'quick';

  console.log('🧪 Add Eatery Form - Usability Testing Suite');
  console.log('===========================================\n');

  try {
    if (testType === 'full') {
      console.log('🚀 Running Full Usability Test Suite (8 hours)...\n');
      await runFullUsabilityTest();
    } else {
      console.log('⚡ Running Quick Usability Test Suite (2 hours)...\n');
      await runQuickUsabilityTest();
    }

    console.log('\n✅ Usability testing completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review generated reports');
    console.log('2. Address critical issues identified');
    console.log('3. Implement recommended improvements');
    console.log('4. Schedule follow-up testing with real users');
    console.log('5. Conduct accessibility testing with screen reader users');

  } catch (error) {
    console.error('❌ Error running usability tests:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main as runUsabilityTests };