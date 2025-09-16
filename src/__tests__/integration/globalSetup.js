/**
 * Global setup for integration tests
 * Runs once before all integration tests
 */

module.exports = async () => {
  console.log('🚀 Setting up integration test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_INTEGRATION_TESTS = 'true';
  
  // Mock Date for consistent testing
  const mockDate = new Date('2023-01-01T00:00:00.000Z');
  global.Date = class extends Date {
    constructor(...args) {
      if (args.length === 0) {
        return mockDate;
      }
      return new Date(...args);
    }
    
    static now() {
      return mockDate.getTime();
    }
  };
  
  // Setup global test utilities
  global.testUtils = {
    // Helper to wait for async operations
    waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),
    
    // Helper to create mock form data
    createMockFormData: (overrides = {}) => ({
      name: 'Test Restaurant',
      address: '123 Test St',
      phone: '1234567890',
      business_email: 'test@example.com',
      kosher_category: 'Pareve',
      certifying_agency: 'OU',
      short_description: 'Test description',
      business_hours: [
        { day: 'Monday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
        { day: 'Tuesday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
        { day: 'Wednesday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
        { day: 'Thursday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
        { day: 'Friday', openTime: '9:00 AM', closeTime: '3:00 PM', isClosed: false },
        { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        { day: 'Sunday', openTime: '10:00 AM', closeTime: '6:00 PM', isClosed: false },
      ],
      ...overrides,
    }),
    
    // Helper to create mock metadata
    createMockMetadata: (overrides = {}) => ({
      lastSaved: '2023-01-01T00:00:00.000Z',
      currentStep: 1,
      version: '1.0.0',
      saveCount: 1,
      isComplete: false,
      ...overrides,
    }),
  };
  
  console.log('✅ Integration test environment setup complete');
};