/**
 * Jest configuration for integration tests
 * Specialized configuration for running integration tests with proper setup
 */

module.exports = {
  preset: 'react-native',

  // Test environment
  testEnvironment: 'jsdom',

  // Test file patterns
  testMatch: [
    '<rootDir>/src/__tests__/integration/**/*.integration.test.{js,jsx,ts,tsx}',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/setup.js'],

  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/screens/AddCategoryScreen.tsx',
    'src/components/AddCategoryForm/**/*.tsx',
    'src/components/BusinessHoursSelector.tsx',
    'src/components/TimePickerInput.tsx',
    'src/components/DayHoursRow.tsx',
    'src/hooks/useFormAutoSave.ts',
    'src/hooks/useFormValidation.ts',
    'src/services/FormPersistence.ts',
    'src/services/FormValidation.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],

  coverageDirectory: '<rootDir>/coverage/integration',

  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/screens/AddCategoryScreen.tsx': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/hooks/useFormAutoSave.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/services/FormPersistence.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Test timeout
  testTimeout: 30000, // 30 seconds for integration tests

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Mock configuration
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/ios/',
    '<rootDir>/android/',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/ios/',
    '<rootDir>/android/',
  ],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*)/)',
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/src/__tests__/integration/globalSetup.js',
  globalTeardown: '<rootDir>/src/__tests__/integration/globalTeardown.js',

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/integration/html-report',
        filename: 'integration-test-report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'Form Integration Test Report',
      },
    ],
  ],

  // Error handling
  errorOnDeprecated: true,

  // Watch mode configuration
  watchPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/coverage/'],
};
