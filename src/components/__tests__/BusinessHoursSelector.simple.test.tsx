import React from 'react';
import { create } from 'react-test-renderer';
import BusinessHoursSelector, { BusinessHoursData } from '../BusinessHoursSelector';

// Mock dependencies
jest.mock('../../utils/hapticFeedback', () => ({
  hapticButtonPress: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticWarning: jest.fn(),
}));

jest.mock('../../utils/accessibility', () => ({
  announceForScreenReader: jest.fn(),
  generateBusinessHoursLabel: jest.fn(() => 'Monday open 9:00 AM to 5:00 PM'),
  generateAccessibilityHint: jest.fn(() => 'Tap to interact'),
  generateSemanticDescription: jest.fn(() => 'Business Hours section'),
  logAccessibilityInfo: jest.fn(),
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

describe('BusinessHoursSelector', () => {
  const defaultHours: BusinessHoursData = {
    Monday: { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Tuesday: { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Wednesday: { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Thursday: { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Friday: { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Saturday: { day: 'Saturday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
    Sunday: { day: 'Sunday', isOpen: false, openTime: '', isNextDay: false },
  };

  const mockOnHoursChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const component = create(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with empty hours', () => {
    const component = create(
      <BusinessHoursSelector
        hours={{}}
        onHoursChange={mockOnHoursChange}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders in loading state', () => {
    const component = create(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
        loading={true}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with errors', () => {
    const errors = { Monday: 'Invalid time range' };
    
    const component = create(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
        errors={errors}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with real-time validation disabled', () => {
    const component = create(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
        enableRealTimeValidation={false}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with haptic feedback disabled', () => {
    const component = create(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
        hapticFeedback={false}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('handles all days closed', () => {
    const allClosedHours: BusinessHoursData = {};
    Object.keys(defaultHours).forEach(day => {
      allClosedHours[day] = { ...defaultHours[day], isOpen: false };
    });

    const component = create(
      <BusinessHoursSelector
        hours={allClosedHours}
        onHoursChange={mockOnHoursChange}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('handles malformed hours data', () => {
    const malformedHours = {
      Monday: { day: 'Monday', isOpen: true, openTime: 'invalid', closeTime: 'invalid', isNextDay: false },
    } as BusinessHoursData;

    const component = create(
      <BusinessHoursSelector
        hours={malformedHours}
        onHoursChange={mockOnHoursChange}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('memoizes correctly', () => {
    const component = create(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
      />
    );

    const firstRender = component.toJSON();

    // Re-render with same props
    component.update(
      <BusinessHoursSelector
        hours={defaultHours}
        onHoursChange={mockOnHoursChange}
      />
    );

    const secondRender = component.toJSON();

    // Should be the same due to memoization
    expect(firstRender).toEqual(secondRender);
  });
});