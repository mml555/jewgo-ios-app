/**
 * Global teardown for integration tests
 * Runs once after all integration tests complete
 */

module.exports = async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  // Clean up global mocks
  if (global.Date.mockRestore) {
    global.Date.mockRestore();
  }
  
  // Clean up global test utilities
  delete global.testUtils;
  
  // Clean up environment variables
  delete process.env.JEST_INTEGRATION_TESTS;
  
  console.log('✅ Integration test environment cleanup complete');
};