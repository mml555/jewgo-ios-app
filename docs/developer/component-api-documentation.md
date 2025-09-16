# Component API Documentation

This document provides comprehensive API documentation for the enhanced form components in the JEWGO Add Eatery form.

## Table of Contents
- [BusinessHoursSelector](#businesshoursselector)
- [TimePickerInput](#timepickerinput)
- [DayHoursRow](#dayhoursrow)
- [FormProgressIndicator](#formprogressindicator)
- [SaveStatusIndicator](#savestatusindicator)
- [ValidationSummary](#validationsummary)
- [FormAnalyticsService](#formanalyticsservice)
- [CrashReportingService](#crashreportingservice)

---

## BusinessHoursSelector

Enhanced business hours selection component with inline time pickers and smart defaults.

### Props

```typescript
interface BusinessHoursSelectorProps {
  hours: BusinessHoursData;
  onHoursChange: (hours: BusinessHoursData) => void;
  errors?: { [day: string]: string };
  disabled?: boolean;
  compact?: boolean;
  showCopyFeature?: boolean;
  defaultHours?: Partial<BusinessHoursData>;
}

interface BusinessHoursData {
  [day: string]: {
    isOpen: boolean;
    openTime: string; // 24-hour format: "09:00"
    closeTime: string; // 24-hour format: "17:00"
    isNextDay: boolean; // For late-night businesses
  };
}
```

### Usage

```tsx
import BusinessHoursSelector from '../components/BusinessHoursSelector';

const MyComponent = () => {
  const [hours, setHours] = useState<BusinessHoursData>({
    monday: { isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    // ... other days
  });

  return (
    <BusinessHoursSelector
      hours={hours}
      onHoursChange={setHours}
      errors={validationErrors}
      showCopyFeature={true}
    />
  );
};
```

### Features

- **Inline Time Pickers**: Native iOS-style time selection
- **Copy Hours**: Duplicate hours from one day to multiple days
- **Next Day Support**: Handle businesses open past midnight
- **Real-time Validation**: Immediate feedback on time conflicts
- **Smart Defaults**: Common business hour patterns
- **Accessibility**: Full VoiceOver support

### Validation Rules

1. At least one day must be open
2. Open time must be before close time (unless `isNextDay` is true)
3. Valid time format (HH:MM in 24-hour format)
4. No overlapping hours for same day

---

## TimePickerInput

Native iOS time picker component with enhanced styling and validation.

### Props

```typescript
interface TimePickerInputProps {
  value: string; // "09:00" format
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}
```

### Usage

```tsx
import TimePickerInput from '../components/TimePickerInput';

const MyComponent = () => {
  const [openTime, setOpenTime] = useState('09:00');

  return (
    <TimePickerInput
      value={openTime}
      onChange={setOpenTime}
      label="Opening Time"
      placeholder="Select time"
      error={validationError}
      accessibilityLabel="Business opening time"
    />
  );
};
```

### Features

- **Native iOS DatePicker**: Compact mode for smooth scrolling
- **24-Hour Format**: Internal storage in HH:MM format
- **Display Format**: Shows user-friendly 12-hour format
- **Error States**: Visual feedback for validation errors
- **Accessibility**: Screen reader compatible

### Time Format Conversion

```typescript
// Internal format: "09:00" (24-hour)
// Display format: "9:00 AM" (12-hour)

// Convert display to internal
const convertToInternal = (displayTime: string): string => {
  // Implementation handles AM/PM conversion
};

// Convert internal to display
const convertToDisplay = (internalTime: string): string => {
  // Implementation handles 24-hour to 12-hour conversion
};
```

---

## DayHoursRow

Individual day row component for business hours with toggle and time pickers.

### Props

```typescript
interface DayHoursRowProps {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  isNextDay: boolean;
  onToggleOpen: () => void;
  onOpenTimeChange: (time: string) => void;
  onCloseTimeChange: (time: string) => void;
  onToggleNextDay: () => void;
  onCopyHours?: () => void;
  errors?: string[];
  disabled?: boolean;
  showCopyButton?: boolean;
}
```

### Usage

```tsx
import DayHoursRow from '../components/DayHoursRow';

const MyComponent = () => {
  return (
    <DayHoursRow
      day="Monday"
      isOpen={true}
      openTime="09:00"
      closeTime="17:00"
      isNextDay={false}
      onToggleOpen={() => toggleDay('monday')}
      onOpenTimeChange={(time) => updateTime('monday', 'open', time)}
      onCloseTimeChange={(time) => updateTime('monday', 'close', time)}
      onToggleNextDay={() => toggleNextDay('monday')}
      onCopyHours={() => copyHours('monday')}
      showCopyButton={true}
    />
  );
};
```

### Layout

```
[Day Name] [Open Toggle] [Open Time] → [Close Time] [Next Day?] [Copy Button]
```

---

## FormProgressIndicator

Enhanced progress indicator with step validation and completion status.

### Props

```typescript
interface FormProgressIndicatorProps {
  steps: FormStep[];
  onStepPress?: (stepNumber: number) => void;
  allowStepJumping?: boolean;
  showCompletionPercentage?: boolean;
  compact?: boolean;
  animated?: boolean;
}

interface FormStep {
  number: number;
  title: string;
  subtitle?: string;
  isCompleted: boolean;
  isValid: boolean;
  isCurrent: boolean;
  hasErrors: boolean;
  completionPercentage: number;
}
```

### Usage

```tsx
import FormProgressIndicator from '../components/FormProgressIndicator';

const MyComponent = () => {
  const steps = [
    {
      number: 1,
      title: 'Basic Info',
      subtitle: 'Business details',
      isCompleted: true,
      isValid: true,
      isCurrent: false,
      hasErrors: false,
      completionPercentage: 100,
    },
    // ... other steps
  ];

  return (
    <FormProgressIndicator
      steps={steps}
      onStepPress={handleStepNavigation}
      allowStepJumping={true}
      showCompletionPercentage={true}
    />
  );
};
```

### Features

- **Visual Progress**: Dots, lines, and percentages
- **Step Navigation**: Tap to jump to completed steps
- **Error Indication**: Red highlighting for steps with errors
- **Completion Status**: Green checkmarks for completed steps
- **Responsive Design**: Adapts to screen size

---

## SaveStatusIndicator

Real-time save status indicator with auto-save feedback.

### Props

```typescript
interface SaveStatusIndicatorProps {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  saveCount?: number;
  completionPercentage?: number;
  compact?: boolean;
  showDetails?: boolean;
  animated?: boolean;
}
```

### Usage

```tsx
import SaveStatusIndicator from '../components/SaveStatusIndicator';

const MyComponent = () => {
  return (
    <SaveStatusIndicator
      saveStatus="saved"
      lastSaved={new Date()}
      saveCount={5}
      completionPercentage={75}
      showDetails={true}
    />
  );
};
```

### Status States

- **idle**: No recent save activity
- **saving**: Currently saving data
- **saved**: Successfully saved
- **error**: Save operation failed

---

## ValidationSummary

Comprehensive validation summary with error grouping and recovery suggestions.

### Props

```typescript
interface ValidationSummaryProps {
  validationResults: ValidationResult[];
  onFieldFocus?: (fieldName: string) => void;
  showRecoverySuggestions?: boolean;
  groupByStep?: boolean;
  maxErrors?: number;
}

interface ValidationResult {
  fieldName: string;
  stepNumber: number;
  errorType: string;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  recoverySuggestion?: string;
}
```

### Usage

```tsx
import ValidationSummary from '../components/ValidationSummary';

const MyComponent = () => {
  return (
    <ValidationSummary
      validationResults={validationErrors}
      onFieldFocus={focusField}
      showRecoverySuggestions={true}
      groupByStep={true}
    />
  );
};
```

---

## FormAnalyticsService

Service for tracking form usage, completion rates, and user behavior analytics.

### Methods

```typescript
class FormAnalyticsService {
  // Session Management
  startFormSession(formType: string, userId?: string): Promise<string>;
  trackStepNavigation(stepNumber: number, stepName: string, userId?: string): Promise<void>;
  trackFormSubmission(userId?: string, formData?: any): Promise<void>;
  trackFormAbandonment(stepNumber: number, userId?: string): Promise<void>;

  // Error Tracking
  trackValidationError(fieldName: string, errorType: string, errorMessage: string, stepNumber: number, userId?: string): Promise<void>;
  trackRecoveryAction(action: string, stepNumber: number, fieldName?: string, userId?: string): Promise<void>;

  // Performance Tracking
  trackAutoSave(stepNumber: number, userId?: string): Promise<void>;

  // Analytics Retrieval
  calculateFormMetrics(formType?: string): Promise<FormMetrics>;
  getDashboardData(): Promise<DashboardData>;
  getCurrentSessionMetrics(): FormSession | null;
}
```

### Usage

```typescript
import FormAnalyticsService from '../services/FormAnalytics';

const analyticsService = FormAnalyticsService.getInstance();

// Start tracking a form session
const sessionId = await analyticsService.startFormSession('add_eatery_form', userId);

// Track step navigation
await analyticsService.trackStepNavigation(2, 'Kosher Info', userId);

// Track validation errors
await analyticsService.trackValidationError('business_name', 'required_field', 'Business name is required', 1, userId);

// Track form submission
await analyticsService.trackFormSubmission(userId, formData);
```

### Metrics Available

- **Completion Rate**: Percentage of started forms that are completed
- **Abandonment Points**: Steps where users most commonly abandon the form
- **Time Per Step**: Average time spent on each form step
- **Validation Errors**: Most common validation errors by field and step
- **Recovery Rate**: Success rate of users fixing validation errors

---

## CrashReportingService

Service for capturing and reporting form-related crashes and errors.

### Methods

```typescript
class CrashReportingService {
  // Context Management
  setFormContext(context: FormContext): void;
  clearFormContext(): void;
  addBreadcrumb(category: string, message: string, level: 'info' | 'warning' | 'error', data?: any): void;

  // Error Reporting
  reportError(error: Error, errorType?: CrashReportErrorType, severity?: CrashReportSeverity, additionalContext?: any): Promise<void>;
  reportFormValidationError(fieldName: string, errorMessage: string, formData: any, stepNumber: number): Promise<void>;
  reportNetworkError(url: string, method: string, statusCode?: number, responseText?: string): Promise<void>;
  reportStorageError(operation: string, key: string, error: Error): Promise<void>;
  reportPerformanceIssue(issue: PerformanceIssue): Promise<void>;

  // Analytics
  getStoredReports(): Promise<CrashReport[]>;
  getCrashStatistics(): Promise<CrashStatistics>;
}
```

### Usage

```typescript
import CrashReportingService from '../services/CrashReporting';

const crashService = CrashReportingService.getInstance();

// Set form context for better error reporting
crashService.setFormContext({
  sessionId: 'session_123',
  formType: 'add_eatery_form',
  currentStep: 2,
  formData: sanitizedFormData,
  lastAction: 'step_navigation',
});

// Add breadcrumbs for user actions
crashService.addBreadcrumb('user_action', 'User tapped next button', 'info');

// Report errors with context
try {
  await submitForm();
} catch (error) {
  await crashService.reportError(error, 'network_error', 'high', {
    formStep: currentStep,
    formData: sanitizedData,
  });
}
```

### Error Types

- **javascript_error**: Unhandled JavaScript exceptions
- **form_validation_error**: Form validation failures
- **network_error**: API and network-related errors
- **storage_error**: Local storage and persistence errors
- **performance_issue**: Performance-related problems

---

## Testing Guidelines

### Unit Testing

```typescript
// Example test for BusinessHoursSelector
import { render, fireEvent } from '@testing-library/react-native';
import BusinessHoursSelector from '../BusinessHoursSelector';

describe('BusinessHoursSelector', () => {
  it('should update hours when time is changed', () => {
    const mockOnChange = jest.fn();
    const { getByTestId } = render(
      <BusinessHoursSelector
        hours={mockHours}
        onHoursChange={mockOnChange}
      />
    );

    fireEvent.press(getByTestId('monday-open-time'));
    // Test time picker interaction
    expect(mockOnChange).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
// Example integration test
describe('Form Integration', () => {
  it('should save and restore form data', async () => {
    const { getByTestId } = render(<AddCategoryScreen />);
    
    // Fill form data
    fireEvent.changeText(getByTestId('business-name'), 'Test Restaurant');
    
    // Navigate away and back
    fireEvent.press(getByTestId('back-button'));
    fireEvent.press(getByTestId('continue-draft'));
    
    // Verify data is restored
    expect(getByTestId('business-name').props.value).toBe('Test Restaurant');
  });
});
```

### Accessibility Testing

```typescript
// Example accessibility test
describe('Accessibility', () => {
  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(<TimePickerInput label="Opening Time" />);
    
    expect(getByLabelText('Opening Time')).toBeTruthy();
  });
});
```

---

## Performance Considerations

### Optimization Techniques

1. **React.memo**: Prevent unnecessary re-renders
```typescript
export default React.memo(BusinessHoursSelector);
```

2. **useCallback**: Memoize event handlers
```typescript
const handleTimeChange = useCallback((time: string) => {
  onTimeChange(time);
}, [onTimeChange]);
```

3. **Debounced Validation**: Reduce validation frequency
```typescript
const debouncedValidation = useMemo(
  () => debounce(validateField, 300),
  [validateField]
);
```

4. **Lazy Loading**: Load components on demand
```typescript
const FormAnalyticsDashboard = lazy(() => import('./FormAnalyticsDashboard'));
```

### Memory Management

- Clean up event listeners in useEffect cleanup
- Limit stored analytics events (max 1000)
- Clear form data after successful submission
- Use weak references for large objects

---

## Migration Guide

### From Legacy Components

#### Old BusinessHours Component
```typescript
// Old way
<BusinessHours
  hours={hours}
  onChange={setHours}
/>

// New way
<BusinessHoursSelector
  hours={hours}
  onHoursChange={setHours}
  showCopyFeature={true}
/>
```

#### Old Time Picker Modal
```typescript
// Old way
<TimePickerModal
  visible={showPicker}
  onConfirm={setTime}
  onCancel={() => setShowPicker(false)}
/>

// New way
<TimePickerInput
  value={time}
  onChange={setTime}
  label="Select Time"
/>
```

### Breaking Changes

1. **Time Format**: Changed from 12-hour to 24-hour internal format
2. **Props**: Some prop names changed for consistency
3. **Validation**: New validation rules may require updates
4. **Styling**: Updated design system may affect custom styles

---

## Troubleshooting

### Common Issues

1. **Time Picker Not Responding**
   - Check iOS version compatibility
   - Verify DatePicker mode is set to 'time'
   - Ensure proper event handling

2. **Validation Errors Not Showing**
   - Verify error prop is passed correctly
   - Check validation logic implementation
   - Ensure error state styling is applied

3. **Analytics Not Tracking**
   - Verify service initialization
   - Check AsyncStorage permissions
   - Ensure proper session management

### Debug Mode

Enable debug logging for development:

```typescript
// In development
if (__DEV__) {
  FormAnalyticsService.enableDebugLogging();
  CrashReportingService.enableVerboseLogging();
}
```

---

## Contributing

### Code Style

- Use TypeScript for all new components
- Follow existing naming conventions
- Add comprehensive prop documentation
- Include accessibility attributes
- Write unit tests for all public methods

### Pull Request Checklist

- [ ] Component API documented
- [ ] Unit tests added/updated
- [ ] Accessibility tested
- [ ] Performance impact assessed
- [ ] Breaking changes noted
- [ ] Migration guide updated

---

*Last updated: December 2024*

For questions or contributions, contact the development team or create an issue in the project repository.