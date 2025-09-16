import React from 'react';
import { create } from 'react-test-renderer';
import TimePickerInput from '../TimePickerInput';

// Mock dependencies
jest.mock('../../utils/hapticFeedback', () => ({
  hapticButtonPress: jest.fn(),
  hapticTimeChange: jest.fn(),
}));

jest.mock('../../utils/accessibility', () => ({
  generateTimePickerLabel: jest.fn(() => 'Time picker'),
  generateAccessibilityHint: jest.fn(() => 'Tap to select time'),
  generateAccessibilityState: jest.fn(() => ({ disabled: false })),
  announceForScreenReader: jest.fn(),
  setAccessibilityFocus: jest.fn(),
  logAccessibilityInfo: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const MockDateTimePicker = () => {
    const MockedComponent = require('react-native').View;
    return <MockedComponent testID="datetime-picker" />;
  };
  return MockDateTimePicker;
});

describe('TimePickerInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const component = create(
      <TimePickerInput
        value=""
        onChange={mockOnChange}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with time value', () => {
    const component = create(
      <TimePickerInput
        value="09:30"
        onChange={mockOnChange}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with label', () => {
    const component = create(
      <TimePickerInput
        value=""
        onChange={mockOnChange}
        label="Opening Time"
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with placeholder', () => {
    const component = create(
      <TimePickerInput
        value=""
        onChange={mockOnChange}
        placeholder="Choose time"
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders in disabled state', () => {
    const component = create(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
        disabled={true}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with error', () => {
    const component = create(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
        error="Invalid time"
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders in loading state', () => {
    const component = create(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
        loading={true}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with custom accessibility props', () => {
    const component = create(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
        accessibilityLabel="Custom time picker"
        accessibilityHint="Select opening time"
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('renders with haptic feedback disabled', () => {
    const component = create(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
        hapticFeedback={false}
      />
    );

    expect(component.toJSON()).toBeTruthy();
  });

  it('handles various time formats', () => {
    const timeFormats = ['00:00', '12:00', '23:59', '09:30', '15:45'];
    
    timeFormats.forEach(time => {
      const component = create(
        <TimePickerInput
          value={time}
          onChange={mockOnChange}
        />
      );

      expect(component.toJSON()).toBeTruthy();
    });
  });

  it('handles invalid time formats gracefully', () => {
    const invalidTimes = ['25:00', '12:60', 'invalid', ''];
    
    invalidTimes.forEach(time => {
      const component = create(
        <TimePickerInput
          value={time}
          onChange={mockOnChange}
        />
      );

      expect(component.toJSON()).toBeTruthy();
    });
  });

  it('memoizes correctly', () => {
    const component = create(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
      />
    );

    const firstRender = component.toJSON();

    // Re-render with same props
    component.update(
      <TimePickerInput
        value="09:00"
        onChange={mockOnChange}
      />
    );

    const secondRender = component.toJSON();

    expect(firstRender).toEqual(secondRender);
  });
});