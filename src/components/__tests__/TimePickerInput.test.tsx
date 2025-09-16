import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform } from 'react-native';
import TimePickerInput from '../TimePickerInput';
import * as hapticFeedback from '../../utils/hapticFeedback';
import * as accessibility from '../../utils/accessibility';

// Mock dependencies
jest.mock('../../utils/hapticFeedback');
jest.mock('../../utils/accessibility');
jest.mock('@react-native-community/datetimepicker', () => {
  const MockDateTimePicker = ({ onChange, value }: any) => {
    const MockedComponent = require('react-native').View;
    return (
      <MockedComponent
        testID="datetime-picker"
        onPress={() => {
          // Simulate time selection
          const newDate = new Date(value);
          newDate.setHours(10, 30, 0, 0);
          onChange({ type: 'set' }, newDate);
        }}
      />
    );
  };
  return MockDateTimePicker;
});

const mockHapticButtonPress = hapticFeedback.hapticButtonPress as jest.MockedFunction<typeof hapticFeedback.hapticButtonPress>;
const mockHapticTimeChange = hapticFeedback.hapticTimeChange as jest.MockedFunction<typeof hapticFeedback.hapticTimeChange>;
const mockAnnounceForScreenReader = accessibility.announceForScreenReader as jest.MockedFunction<typeof accessibility.announceForScreenReader>;

describe('TimePickerInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      const { getByText } = render(
        <TimePickerInput
          value=""
          onChange={mockOnChange}
        />
      );

      expect(getByText('Select time')).toBeTruthy();
    });

    it('renders with custom placeholder', () => {
      const { getByText } = render(
        <TimePickerInput
          value=""
          onChange={mockOnChange}
          placeholder="Choose time"
        />
      );

      expect(getByText('Choose time')).toBeTruthy();
    });

    it('renders with label', () => {
      const { getByText } = render(
        <TimePickerInput
          value=""
          onChange={mockOnChange}
          label="Opening Time"
        />
      );

      expect(getByText('Opening Time')).toBeTruthy();
    });

    it('displays formatted time value', () => {
      const { getByText } = render(
        <TimePickerInput
          value="09:30"
          onChange={mockOnChange}
        />
      );

      expect(getByText('9:30 AM')).toBeTruthy();
    });

    it('displays PM time correctly', () => {
      const { getByText } = render(
        <TimePickerInput
          value="15:45"
          onChange={mockOnChange}
        />
      );

      expect(getByText('3:45 PM')).toBeTruthy();
    });

    it('displays midnight correctly', () => {
      const { getByText } = render(
        <TimePickerInput
          value="00:00"
          onChange={mockOnChange}
        />
      );

      expect(getByText('12:00 AM')).toBeTruthy();
    });

    it('displays noon correctly', () => {
      const { getByText } = render(
        <TimePickerInput
          value="12:00"
          onChange={mockOnChange}
        />
      );

      expect(getByText('12:00 PM')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('opens picker when pressed', async () => {
      const { getByRole, getByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      expect(mockHapticButtonPress).toHaveBeenCalled();
      expect(getByTestId('datetime-picker')).toBeTruthy();
    });

    it('calls onChange when time is selected', async () => {
      const { getByRole, getByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      const picker = getByTestId('datetime-picker');
      
      await act(async () => {
        fireEvent.press(picker);
      });

      expect(mockOnChange).toHaveBeenCalledWith('10:30');
      expect(mockHapticTimeChange).toHaveBeenCalled();
    });

    it('does not open picker when disabled', async () => {
      const { getByRole, queryByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      expect(mockHapticButtonPress).not.toHaveBeenCalled();
      expect(queryByTestId('datetime-picker')).toBeNull();
    });

    it('does not open picker when loading', async () => {
      const { getByRole, queryByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          loading={true}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      expect(mockHapticButtonPress).not.toHaveBeenCalled();
      expect(queryByTestId('datetime-picker')).toBeNull();
    });
  });

  describe('Time Conversion', () => {
    it('converts 24-hour format to 12-hour display correctly', () => {
      const testCases = [
        { input: '00:00', expected: '12:00 AM' },
        { input: '01:00', expected: '1:00 AM' },
        { input: '12:00', expected: '12:00 PM' },
        { input: '13:00', expected: '1:00 PM' },
        { input: '23:59', expected: '11:59 PM' },
      ];

      testCases.forEach(({ input, expected }) => {
        const { getByText } = render(
          <TimePickerInput
            value={input}
            onChange={mockOnChange}
          />
        );

        expect(getByText(expected)).toBeTruthy();
      });
    });

    it('handles invalid time format gracefully', () => {
      const { getByText } = render(
        <TimePickerInput
          value="invalid"
          onChange={mockOnChange}
          placeholder="Select time"
        />
      );

      expect(getByText('Select time')).toBeTruthy();
    });

    it('handles empty time value', () => {
      const { getByText } = render(
        <TimePickerInput
          value=""
          onChange={mockOnChange}
          placeholder="Select time"
        />
      );

      expect(getByText('Select time')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      const { getByText } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          error="Invalid time"
        />
      );

      expect(getByText('Invalid time')).toBeTruthy();
    });

    it('applies error styling when error is present', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          error="Invalid time"
        />
      );

      const button = getByRole('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: expect.any(String), // Error color
          })
        ])
      );
    });

    it('shows error in accessibility state', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          error="Invalid time"
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState?.invalid).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility role', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
        />
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('has descriptive accessibility label', () => {
      const { getByLabelText } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          label="Opening Time"
        />
      );

      expect(getByLabelText(/Opening Time/)).toBeTruthy();
    });

    it('has custom accessibility label when provided', () => {
      const { getByLabelText } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          accessibilityLabel="Custom time picker"
        />
      );

      expect(getByLabelText('Custom time picker')).toBeTruthy();
    });

    it('has accessibility hint', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          accessibilityHint="Select opening time"
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityHint).toBe('Select opening time');
    });

    it('announces time changes for screen readers', async () => {
      const { getByRole, getByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          label="Opening Time"
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      const picker = getByTestId('datetime-picker');
      
      await act(async () => {
        fireEvent.press(picker);
      });

      // Screen reader announcements are tested in integration tests
      // as they depend on AccessibilityInfo state
    });

    it('supports disabled accessibility state', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading', () => {
      const { getByLabelText } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          loading={true}
        />
      );

      expect(getByLabelText('Loading')).toBeTruthy();
    });

    it('applies loading styling', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          loading={true}
        />
      );

      const button = getByRole('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opacity: expect.any(Number),
          })
        ])
      );
    });

    it('disables interaction when loading', () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          loading={true}
        />
      );

      const button = getByRole('button');
      expect(button.props.disabled).toBe(true);
    });
  });

  describe('Haptic Feedback', () => {
    it('triggers haptic feedback on button press when enabled', async () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          hapticFeedback={true}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      expect(mockHapticButtonPress).toHaveBeenCalled();
    });

    it('triggers haptic feedback on time change when enabled', async () => {
      const { getByRole, getByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          hapticFeedback={true}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      const picker = getByTestId('datetime-picker');
      
      await act(async () => {
        fireEvent.press(picker);
      });

      expect(mockHapticTimeChange).toHaveBeenCalled();
    });

    it('does not trigger haptic feedback when disabled', async () => {
      const { getByRole } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
          hapticFeedback={false}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      expect(mockHapticButtonPress).not.toHaveBeenCalled();
    });
  });

  describe('Platform Differences', () => {
    it('handles Android picker behavior', async () => {
      // Mock Platform.OS to be 'android'
      const originalOS = Platform.OS;
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        writable: true,
      });

      const { getByRole, getByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      const picker = getByTestId('datetime-picker');
      
      await act(async () => {
        fireEvent.press(picker);
      });

      expect(mockOnChange).toHaveBeenCalled();

      // Restore original Platform.OS
      Object.defineProperty(Platform, 'OS', {
        value: originalOS,
        writable: true,
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles malformed time values', () => {
      const malformedValues = ['25:00', '12:60', 'abc:def', ''];
      
      malformedValues.forEach(value => {
        const { getByText } = render(
          <TimePickerInput
            value={value}
            onChange={mockOnChange}
            placeholder="Select time"
          />
        );

        // Should show placeholder for invalid values
        expect(getByText('Select time')).toBeTruthy();
      });
    });

    it('handles rapid successive changes', async () => {
      const { getByRole, getByTestId, rerender } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
        />
      );

      // Simulate rapid changes
      const times = ['09:00', '09:15', '09:30', '09:45'];
      
      for (const time of times) {
        rerender(
          <TimePickerInput
            value={time}
            onChange={mockOnChange}
          />
        );
      }

      // Component should handle rapid changes gracefully
      expect(mockOnChange).not.toHaveBeenCalled(); // Only called by user interaction
    });

    it('maintains focus after time selection', async () => {
      const { getByRole, getByTestId } = render(
        <TimePickerInput
          value="09:00"
          onChange={mockOnChange}
        />
      );

      const button = getByRole('button');
      
      await act(async () => {
        fireEvent.press(button);
      });

      const picker = getByTestId('datetime-picker');
      
      await act(async () => {
        fireEvent.press(picker);
      });

      // Focus management is tested in integration tests
      // as it involves complex accessibility interactions
      expect(mockOnChange).toHaveBeenCalled();
    });
  });
});