#!/usr/bin/env node

/**
 * Integration Test Runner
 * Runs all integration tests for the form functionality
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'FormFlow.integration.test.tsx',
  'FormNavigation.integration.test.tsx',
  'AutoSaveRecovery.integration.test.tsx',
  'ErrorHandling.integration.test.tsx',
  'FormSubmission.integration.test.tsx',
];

const testDir = path.join(__dirname);

console.log('🚀 Running Integration Tests for Form Functionality\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

for (const testFile of testFiles) {
  const testPath = path.join(testDir, testFile);
  const testName = testFile.replace('.integration.test.tsx', '');
  
  console.log(`📋 Running ${testName} tests...`);
  
  try {
    const output = execSync(`npx jest ${testPath} --verbose --no-cache`, {
      encoding: 'utf8',
      cwd: path.join(__dirname, '../../../'),
    });
    
    // Parse Jest output to get test counts
    const lines = output.split('\n');
    const summaryLine = lines.find(line => line.includes('Tests:'));
    
    if (summaryLine) {
      const passed = (summaryLine.match(/(\d+) passed/) || [0, 0])[1];
      const failed = (summaryLine.match(/(\d+) failed/) || [0, 0])[1];
      const total = parseInt(passed) + parseInt(failed);
      
      totalTests += total;
      passedTests += parseInt(passed);
      failedTests += parseInt(failed);
      
      results.push({
        name: testName,
        passed: parseInt(passed),
        failed: parseInt(failed),
        total: total,
        status: parseInt(failed) === 0 ? '✅' : '❌',
      });
      
      console.log(`   ${parseInt(failed) === 0 ? '✅' : '❌'} ${passed} passed, ${failed} failed\n`);
    } else {
      console.log('   ⚠️  Could not parse test results\n');
    }
    
  } catch (error) {
    console.log(`   ❌ Tests failed with error:\n${error.message}\n`);
    results.push({
      name: testName,
      passed: 0,
      failed: 1,
      total: 1,
      status: '❌',
      error: error.message,
    });
    failedTests += 1;
    totalTests += 1;
  }
}

// Print summary
console.log('📊 Integration Test Summary');
console.log('=' .repeat(50));

results.forEach(result => {
  console.log(`${result.status} ${result.name}: ${result.passed}/${result.total} passed`);
  if (result.error) {
    console.log(`   Error: ${result.error.split('\n')[0]}`);
  }
});

console.log('=' .repeat(50));
console.log(`Total: ${passedTests}/${totalTests} tests passed`);

if (failedTests === 0) {
  console.log('🎉 All integration tests passed!');
  process.exit(0);
} else {
  console.log(`❌ ${failedTests} test(s) failed`);
  process.exit(1);
}