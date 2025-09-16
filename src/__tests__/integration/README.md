# Integration and End-to-End Tests

This directory contains comprehensive integration and end-to-end tests for the form functionality, covering all aspects of the user journey from form initialization to successful submission.

## Test Coverage

### 1. FormFlow.integration.test.tsx
**Complete form flow from start to submission**

- **Complete Form Journey**: Tests the entire user flow through all 5 form steps
- **Form Validation**: Tests validation errors and recovery during the flow
- **Business Hours Validation**: Tests complex business hours scenarios and validation
- **Data Persistence**: Tests form data preservation during navigation
- **Success Flow**: Tests successful form submission and celebration

**Key Test Scenarios:**
- Full form completion with all required fields
- Validation error handling at each step
- Business hours validation (invalid times, conflicts)
- Form submission with haptic feedback
- Success celebration and navigation

### 2. FormNavigation.integration.test.tsx
**Form navigation with data persistence**

- **Step Navigation**: Forward and backward navigation through form steps
- **Data Preservation**: Form data maintained during step changes
- **Progress Tracking**: Progress indicator updates and step completion status
- **Validation Integration**: Step validation prevents invalid navigation
- **Exit Confirmation**: Confirmation dialogs when exiting with unsaved changes

**Key Test Scenarios:**
- Navigation through all form steps
- Data persistence during step changes
- Progress indicator accuracy
- Validation blocking invalid navigation
- Exit confirmation with save options

### 3. AutoSaveRecovery.integration.test.tsx
**Auto-save functionality and data recovery**

- **Auto-Save Behavior**: Periodic auto-saving of form data
- **Data Recovery**: Recovery from app restart or crash
- **Save Status**: Visual save status indicators
- **Debouncing**: Debounced saves for performance
- **App State Handling**: Saves when app goes to background

**Key Test Scenarios:**
- Auto-save every 30 seconds
- Debounced saves for rapid changes
- Data recovery dialog on app restart
- Save status indicator updates
- Background save when app becomes inactive

### 4. ErrorHandling.integration.test.tsx
**Error handling and recovery scenarios**

- **Storage Errors**: AsyncStorage quota exceeded, access denied
- **Validation Errors**: Field validation, business hours validation
- **Network Errors**: Submission timeouts, server errors
- **Recovery Mechanisms**: Automatic retry, manual recovery options
- **Error Reporting**: Error analytics and user feedback

**Key Test Scenarios:**
- Storage quota exceeded with cleanup options
- Corrupted data recovery
- Network timeout handling
- Validation error recovery
- Error reporting and analytics

### 5. FormSubmission.integration.test.tsx
**Form submission with various data combinations**

- **Business Types**: Different kosher restaurant types (meat, dairy, pareve)
- **Special Hours**: Late-night, seasonal, limited weekday hours
- **Data Scenarios**: Minimum required vs maximum optional data
- **Certification Types**: Multiple certifications, custom agencies
- **Performance**: Large data sets, complex submissions

**Key Test Scenarios:**
- Kosher meat restaurant with full data
- Dairy cafe with limited hours
- Pareve bakery with catering
- Food truck with mobile service
- Catering service with event capacity

## Test Infrastructure

### Configuration Files

#### jest.config.js
Updated main Jest configuration with:
- React Native preset
- Transform ignore patterns for React Navigation
- Module name mapping for path aliases
- Setup files and test timeout configuration

#### jest.integration.config.js
Specialized configuration for integration tests:
- Extended test timeout (30 seconds)
- Coverage collection and thresholds
- HTML test reports
- Integration-specific setup files

### Setup Files

#### src/__tests__/setup.js
Main setup file for all tests:
- React Native module mocks
- AsyncStorage mocking
- React Navigation mocking
- Safe Area Context mocking
- Console log suppression

#### src/__tests__/integration/setup.js
Enhanced setup for integration tests:
- Additional React Native mocks
- Haptic feedback mocking
- Keyboard manager mocking
- Device adaptation mocking
- Global error handling

#### Global Setup/Teardown
- **globalSetup.js**: Environment setup, mock Date, test utilities
- **globalTeardown.js**: Cleanup after all tests complete

### Test Utilities

#### Global Test Utilities
Available in all integration tests:
- `testUtils.waitFor()`: Helper for async operations
- `testUtils.createMockFormData()`: Generate mock form data
- `testUtils.createMockMetadata()`: Generate mock metadata

#### Test Runner
- **runIntegrationTests.js**: Script to run all integration tests with reporting

## Running the Tests

### Individual Test Files
```bash
# Run specific integration test
npx jest src/__tests__/integration/FormFlow.integration.test.tsx

# Run with coverage
npx jest src/__tests__/integration/FormFlow.integration.test.tsx --coverage
```

### All Integration Tests
```bash
# Run all integration tests
npx jest --testPathPattern="integration"

# Run with custom config
npx jest --config=jest.integration.config.js

# Run test runner script
node src/__tests__/integration/runIntegrationTests.js
```

### Test Reports
Integration tests generate:
- Console output with detailed results
- HTML coverage reports in `coverage/integration/`
- Test result reports in `coverage/integration/html-report/`

## Test Data and Scenarios

### Mock Form Data
Tests use realistic form data representing:
- **Kosher Restaurants**: Various certification levels and types
- **Business Hours**: Complex scheduling scenarios
- **Contact Information**: Complete business details
- **Service Options**: Delivery, takeout, catering combinations

### Error Scenarios
Comprehensive error testing:
- **Storage Errors**: Quota exceeded, access denied, corruption
- **Network Errors**: Timeouts, server errors, offline mode
- **Validation Errors**: Field validation, business logic errors
- **State Errors**: Form corruption, navigation errors

### Performance Testing
Tests handle:
- **Large Data**: Maximum field lengths, extensive descriptions
- **Rapid Operations**: Fast navigation, frequent saves
- **Memory Management**: Cleanup, leak prevention
- **Concurrent Operations**: Multiple simultaneous saves

## Coverage Requirements

### Coverage Thresholds
- **Global**: 70% branches, functions, lines, statements
- **AddCategoryScreen**: 80% coverage (main form component)
- **useFormAutoSave**: 85% coverage (critical auto-save functionality)
- **FormPersistence**: 85% coverage (data persistence service)

### Covered Components
Integration tests provide coverage for:
- Form screens and components
- Auto-save and validation hooks
- Data persistence services
- Navigation and state management
- Error handling and recovery

## Best Practices

### Test Structure
- **Arrange-Act-Assert**: Clear test structure
- **Descriptive Names**: Self-documenting test descriptions
- **Isolated Tests**: Each test is independent
- **Realistic Data**: Tests use realistic business scenarios

### Mocking Strategy
- **Minimal Mocking**: Only mock external dependencies
- **Realistic Mocks**: Mocks behave like real implementations
- **Consistent State**: Mocks reset between tests
- **Error Simulation**: Mocks can simulate error conditions

### Performance
- **Fast Execution**: Tests run quickly with proper mocking
- **Parallel Execution**: Tests can run in parallel
- **Resource Cleanup**: Proper cleanup prevents memory leaks
- **Efficient Assertions**: Focused assertions for faster feedback

## Maintenance

### Adding New Tests
1. Create test file in appropriate category
2. Follow existing naming conventions
3. Use provided test utilities
4. Update coverage thresholds if needed

### Updating Existing Tests
1. Maintain backward compatibility
2. Update mock data as needed
3. Verify coverage requirements
4. Test both success and failure paths

### Debugging Tests
1. Use `--verbose` flag for detailed output
2. Check mock implementations
3. Verify test data matches expectations
4. Use `console.log` for debugging (mocked by default)

This comprehensive integration test suite ensures the form functionality works correctly across all user scenarios and edge cases, providing confidence in the reliability and robustness of the implementation.