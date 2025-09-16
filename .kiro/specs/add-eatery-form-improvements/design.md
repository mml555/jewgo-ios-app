# Design Document

## Overview

This design addresses critical usability issues in the "Add Eatery" form, specifically focusing on improving the business hours interface and overall form experience. The current implementation has several pain points that prevent users from successfully completing their business listings.

## Current Issues Identified

### Business Hours Interface Problems
1. **Modal Time Picker**: The current modal-based time selection is cumbersome on mobile
2. **Limited Time Options**: Fixed 30-minute intervals may not suit all businesses
3. **Poor Visual Feedback**: Users can't easily see all their hours at once
4. **Confusing "Same as Monday" Logic**: Only copies from Monday, not flexible
5. **Validation Issues**: Time conflicts (close before open) not properly handled

### Form Navigation Issues
1. **No Progress Persistence**: Form data may be lost when navigating between steps
2. **Unclear Validation**: Errors not clearly communicated until submission
3. **Poor Mobile UX**: Time pickers and inputs not optimized for touch

## Architecture

### Component Structure
```
AddCategoryScreen (Main Container)
├── FormProgressIndicator (Enhanced)
├── FormStepContainer (New Wrapper)
│   ├── BasicInfoPage (Existing)
│   ├── KosherPricingPage (Existing)
│   ├── HoursServicesPage (Enhanced)
│   │   └── BusinessHoursSelector (New Component)
│   │       ├── DayHoursRow (New Component)
│   │       ├── TimePickerInput (New Component)
│   │       └── HoursValidation (New Component)
│   ├── PhotosReviewPage (Existing)
│   └── ReviewSubmitPage (Enhanced)
└── FormNavigationFooter (Enhanced)
```

### State Management
```typescript
interface FormState {
  currentStep: number;
  formData: ListingFormData;
  validation: {
    [stepNumber: number]: {
      isValid: boolean;
      errors: { [fieldName: string]: string };
    };
  };
  isDirty: boolean;
  isSubmitting: boolean;
}
```

## Components and Interfaces

### 1. Enhanced BusinessHoursSelector Component

```typescript
interface BusinessHoursData {
  [day: string]: {
    isOpen: boolean;
    openTime: string; // 24-hour format: "09:00"
    closeTime: string; // 24-hour format: "17:00"
    isNextDay: boolean; // For late-night businesses
  };
}

interface BusinessHoursSelectorProps {
  hours: BusinessHoursData;
  onHoursChange: (hours: BusinessHoursData) => void;
  errors?: { [day: string]: string };
}
```

**Key Features:**
- **Inline Time Pickers**: Native iOS-style time wheels instead of modal
- **Visual Day Grid**: All days visible simultaneously
- **Smart Defaults**: Common business hours pre-filled
- **Copy Hours Feature**: Copy any day to multiple other days
- **Real-time Validation**: Immediate feedback on time conflicts
- **24-Hour Support**: Handle businesses open past midnight

### 2. TimePickerInput Component

```typescript
interface TimePickerInputProps {
  value: string; // "09:00" format
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  label?: string;
}
```

**Design:**
- Native iOS DatePicker in compact mode
- Smooth scrolling time selection
- Clear visual states (normal, focused, error, disabled)
- Accessibility labels for screen readers

### 3. DayHoursRow Component

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
  errors?: string[];
}
```

**Layout:**
```
[Day Name] [Open Toggle] [Open Time] → [Close Time] [Next Day?] [Copy Button]
```

### 4. Enhanced Form Validation

```typescript
interface ValidationRule {
  field: string;
  validator: (value: any, formData: ListingFormData) => string | null;
  trigger: 'onChange' | 'onBlur' | 'onSubmit';
}

interface ValidationEngine {
  validateField(field: string, value: any, formData: ListingFormData): string | null;
  validateStep(stepNumber: number, formData: ListingFormData): ValidationResult;
  validateForm(formData: ListingFormData): ValidationResult;
}
```

**Business Hours Validation Rules:**
1. At least one day must be open
2. Open time must be before close time (unless next day)
3. No overlapping hours for same day
4. Valid time format (HH:MM)
5. Reasonable business hours (not 24/7 unless explicitly allowed)

## Data Models

### Enhanced Business Hours Model

```typescript
interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface DayHours {
  isOpen: boolean;
  openTime: string; // "09:00" 24-hour format
  closeTime: string; // "17:00" 24-hour format
  isNextDay: boolean; // true if closes after midnight
  breaks?: TimeBreak[]; // Future: lunch breaks, etc.
}

interface TimeBreak {
  startTime: string;
  endTime: string;
  label: string; // "Lunch Break"
}
```

### Form Persistence Model

```typescript
interface FormPersistence {
  saveFormData(stepNumber: number, data: Partial<ListingFormData>): void;
  loadFormData(): ListingFormData | null;
  clearFormData(): void;
  getLastSavedStep(): number;
}
```

## Error Handling

### Validation Error Display
```typescript
interface ErrorDisplay {
  type: 'field' | 'step' | 'form';
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
  action?: {
    label: string;
    handler: () => void;
  };
}
```

### Error Recovery Strategies
1. **Auto-save**: Save form data every 30 seconds
2. **Smart Defaults**: Provide reasonable defaults for common scenarios
3. **Progressive Enhancement**: Allow partial completion and return later
4. **Clear Messaging**: Specific, actionable error messages
5. **Undo/Redo**: Allow users to revert changes

## Testing Strategy

### Unit Tests
- Business hours validation logic
- Time format conversion utilities
- Form state management
- Error handling scenarios

### Integration Tests
- Form step navigation with data persistence
- Hours selector with various time combinations
- Validation across multiple form steps
- API submission with complete form data

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- High contrast mode support
- Dynamic text sizing

### User Experience Tests
- Time picker usability on different devices
- Form completion flow timing
- Error recovery scenarios
- Performance with large datasets

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load form steps on demand
2. **Debounced Validation**: Avoid excessive validation calls
3. **Memoized Components**: Prevent unnecessary re-renders
4. **Efficient State Updates**: Minimize state changes
5. **Image Optimization**: Compress and resize uploaded photos

### Memory Management
- Clean up form data on successful submission
- Limit auto-save history to prevent memory leaks
- Optimize component lifecycle management

## Accessibility Features

### Screen Reader Support
- Comprehensive ARIA labels for all form elements
- Logical tab order through form fields
- Clear announcements for validation errors
- Progress indicators accessible to screen readers

### Visual Accessibility
- High contrast mode support
- Scalable text (Dynamic Type support)
- Clear focus indicators
- Color-blind friendly error states

### Motor Accessibility
- Large touch targets (minimum 44pt)
- Gesture alternatives for all interactions
- Voice input support where applicable
- Reduced motion options

## Implementation Phases

### Phase 1: Core Hours Interface (Week 1)
- Replace modal time picker with inline pickers
- Implement new DayHoursRow component
- Add basic validation for time conflicts
- Test on iOS devices

### Phase 2: Enhanced UX (Week 2)
- Add copy hours functionality
- Implement smart defaults
- Add next-day support for late-night businesses
- Improve visual feedback and animations

### Phase 3: Form Integration (Week 3)
- Integrate enhanced hours selector into form
- Add form-wide validation
- Implement auto-save functionality
- Add progress persistence

### Phase 4: Polish & Testing (Week 4)
- Comprehensive accessibility testing
- Performance optimization
- User acceptance testing
- Bug fixes and refinements

## Success Metrics

### Usability Metrics
- Form completion rate increase by 40%
- Time to complete hours section reduced by 60%
- User error rate decreased by 50%
- Support tickets related to form issues reduced by 70%

### Technical Metrics
- Form validation response time < 100ms
- Auto-save frequency every 30 seconds
- Memory usage within acceptable limits
- Accessibility compliance score > 95%

### User Satisfaction
- User satisfaction score > 4.5/5
- Reduced abandonment rate at hours step
- Positive feedback on time picker usability
- Successful business owner onboarding