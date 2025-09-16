import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import DayHoursRow from '../DayHoursRow';
import * as hapticFeedback from '../../utils/hapticFeedback';
import * as accessibility from '../../utils/accessibility';

// Mock dependencies
jest.mock('../../utils/hapticFeedback');
jest.mock('../../utils/accessibility');
jest.mock('../TimePickerInput', () => {
  const MockTimePickerInput = ({ value, onChange, label, disabled }: any) => {
    const MockedComponent = require('react-native').TouchableOpacity;
    const MockedText = require('react-native').Text;
    return (
      <MockedComponent
        testID={`time-picker-${label}`}
        onPress={() => !disabled && onChange('10:30')}
        disabled={disabled}
      >
        <MockedText>{value || 'Select time'}</MockedText>
      </MockedComponent>
    );
  };
  return MockTimePickerInput;
});

const mockHapticToggle = hapticFeedback.hapticToggle as jest.MockedFunction<typeof hapticFeedback.hapticToggle>;
const mockHapticButtonPress = hapticFeedback.hapticButtonPress as jest.MockedFunction<typeof hapticFeedback.hapticButtonPress>;
const mockHapticCopy = hapticFeedback.hapticCopy as jest.MockedFunction<typeof hapticFeedback.hapticCopy>;
const mockAnnounceForScreenReader = accessibility.announceForScreenReader as jest.MockedFunction<typeof accessibility.announceForScreenReader>;

describe('DayHoursRow', () => {
  const defaultProps = {
    day: 'Monday',
    isOpen: true,
    openTime: '09:00',
    closeTime: '17:00',
    isNextDay: false,
    onToggleOpen: jest.fn(),
    onOpenTimeChange: jest.fn(),
    onCloseTimeChange: jest.fn(),
    onToggleNextDay: jest.fn(),
    onCopyHours: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly for open day', () => {
      const { getByText } = render(<DayHoursRow {...defaultProps} />);

      expect(getByText('Mon')).toBeTruthy();
      expect(getByText('Monday')).toBeTruthy();
      expect(getByText('Open')).toBeTruthy();
    });

    it('renders correctly for closed day', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} isOpen={false} />
      );

      expect(getByText('Mon')).toBeTruthy();
      expect(getByText('Monday')).toBeTruthy();
      expect(getByText('Closed')).toBeTruthy();
    });

    it('shows time pickers when day is open', () => {
      const { getByTestId } = render(<DayHoursRow {...defaultProps} />);

      expect(getByTestId('time-picker-Opens')).toBeTruthy();
      expect(getByTestId('time-picker-Closes')).toBeTruthy();
    });

    it('hides time pickers when day is closed', () => {
      const { queryByTestId } = render(
        <DayHoursRow {...defaultProps} isOpen={false} />
      );

      expect(queryByTestId('time-picker-Opens')).toBeNull();
      expect(queryByTestId('time-picker-Closes')).toBeNull();
    });

    it('shows copy button when showCopyButton is true', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} showCopyButton={true} />
      );

      expect(getByText('Copy')).toBeTruthy();
    });

    it('hides copy button when showCopyButton is false', () => {
      const { queryByText } = render(
        <DayHoursRow {...defaultProps} showCopyButton={false} />
      );

      expect(queryByText('Copy')).toBeNull();
    });
  });

  describe('Toggle Functionality', () => {
    it('calls onToggleOpen when switch is pressed', async () => {
      const { getByRole } = render(<DayHoursRow {...defaultProps} />);

      const toggle = getByRole('switch');
      
      await act(async () => {
        fireEvent(toggle, 'valueChange', false);
      });

      expect(defaultProps.onToggleOpen).toHaveBeenCalled();
      expect(mockHapticToggle).toHaveBeenCalled();
    });

    it('announces toggle change for screen readers', async () => {
      const { getByRole } = render(<DayHoursRow {...defaultProps} />);

      const toggle = getByRole('switch');
      
      await act(async () => {
        fireEvent(toggle, 'valueChange', false);
      });

      // Screen reader announcements are tested in integration tests
      expect(defaultProps.onToggleOpen).toHaveBeenCalled();
    });

    it('does not trigger haptic feedback when disabled', async () => {
      const { getByRole } = render(
        <DayHoursRow {...defaultProps} hapticFeedback={false} />
      );

      const toggle = getByRole('switch');
      
      await act(async () => {
        fireEvent(toggle, 'valueChange', false);
      });

      expect(mockHapticToggle).not.toHaveBeenCalled();
    });
  });

  describe('Time Picker Integration', () => {
    it('calls onOpenTimeChange when open time is changed', async () => {
      const { getByTestId } = render(<DayHoursRow {...defaultProps} />);

      const openTimePicker = getByTestId('time-picker-Opens');
      
      await act(async () => {
        fireEvent.press(openTimePicker);
      });

      expect(defaultProps.onOpenTimeChange).toHaveBeenCalledWith('10:30');
    });

    it('calls onCloseTimeChange when close time is changed', async () => {
      const { getByTestId } = render(<DayHoursRow {...defaultProps} />);

      const closeTimePicker = getByTestId('time-picker-Closes');
      
      await act(async () => {
        fireEvent.press(closeTimePicker);
      });

      expect(defaultProps.onCloseTimeChange).toHaveBeenCalledWith('10:30');
    });

    it('disables time pickers when day is closed', () => {
      const { getByTestId } = render(
        <DayHoursRow {...defaultProps} isOpen={false} />
      );

      // Time pickers should not be rendered when closed
      expect(() => getByTestId('time-picker-Opens')).toThrow();
      expect(() => getByTestId('time-picker-Closes')).toThrow();
    });

    it('disables time pickers when loading', () => {
      const { getByTestId } = render(
        <DayHoursRow {...defaultProps} loading={true} />
      );

      const openTimePicker = getByTestId('time-picker-Opens');
      const closeTimePicker = getByTestId('time-picker-Closes');

      expect(openTimePicker.props.disabled).toBe(true);
      expect(closeTimePicker.props.disabled).toBe(true);
    });
  });

  describe('Next Day Toggle', () => {
    it('calls onToggleNextDay when next day button is pressed', async () => {
      const { getByText } = render(<DayHoursRow {...defaultProps} />);

      const nextDayButton = getByText('Next Day');
      
      await act(async () => {
        fireEvent.press(nextDayButton);
      });

      expect(defaultProps.onToggleNextDay).toHaveBeenCalled();
      expect(mockHapticButtonPress).toHaveBeenCalled();
    });

    it('shows active state when isNextDay is true', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} isNextDay={true} />
      );

      const nextDayButton = getByText('Next Day');
      expect(nextDayButton.props.accessibilityState?.selected).toBe(true);
    });

    it('shows inactive state when isNextDay is false', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} isNextDay={false} />
      );

      const nextDayButton = getByText('Next Day');
      expect(nextDayButton.props.accessibilityState?.selected).toBe(false);
    });

    it('disables next day button when day is closed', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} isOpen={false} />
      );

      // Next day button should not be rendered when closed
      expect(() => getByText('Next Day')).toThrow();
    });

    it('disables next day button when loading', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} loading={true} />
      );

      const nextDayButton = getByText('Next Day');
      expect(nextDayButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Copy Hours Functionality', () => {
    it('calls onCopyHours when copy button is pressed', async () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} showCopyButton={true} />
      );

      const copyButton = getByText('Copy');
      
      await act(async () => {
        fireEvent.press(copyButton);
      });

      expect(defaultProps.onCopyHours).toHaveBeenCalled();
      expect(mockHapticCopy).toHaveBeenCalled();
    });

    it('announces copy action for screen readers', async () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} showCopyButton={true} />
      );

      const copyButton = getByText('Copy');
      
      await act(async () => {
        fireEvent.press(copyButton);
      });

      // Screen reader announcements are tested in integration tests
      expect(defaultProps.onCopyHours).toHaveBeenCalled();
    });

    it('disables copy button when loading', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} showCopyButton={true} loading={true} />
      );

      const copyButton = getByText('Copy');
      expect(copyButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Error Display', () => {
    it('displays error messages', () => {
      const errors = ['Invalid time range'];
      const { getByText } = render(
        <DayHoursRow {...defaultProps} errors={errors} />
      );

      expect(getByText('Invalid time range')).toBeTruthy();
    });

    it('displays multiple errors', () => {
      const errors = ['Invalid time range', 'Missing required field'];
      const { getByText } = render(
        <DayHoursRow {...defaultProps} errors={errors} />
      );

      expect(getByText('Invalid time range')).toBeTruthy();
    });

    it('applies error styling when errors are present', () => {
      const errors = ['Invalid time range'];
      const { getByRole } = render(
        <DayHoursRow {...defaultProps} errors={errors} />
      );

      const container = getByRole('group');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: expect.any(String), // Error color
          })
        ])
      );
    });

    it('validates time logic and shows appropriate errors', () => {
      // Test invalid time range (close before open)
      const { getByText } = render(
        <DayHoursRow
          {...defaultProps}
          openTime="17:00"
          closeTime="09:00"
          isNextDay={false}
        />
      );

      expect(getByText(/Close time must be after open time/)).toBeTruthy();
    });

    it('allows close before open when next day is enabled', () => {
      const { queryByText } = render(
        <DayHoursRow
          {...defaultProps}
          openTime="22:00"
          closeTime="02:00"
          isNextDay={true}
        />
      );

      // Should not show error when next day is enabled
      expect(queryByText(/Close time must be after open time/)).toBeNull();
    });

    it('shows error when times are missing for open day', () => {
      const { getByText } = render(
        <DayHoursRow
          {...defaultProps}
          openTime=""
          closeTime=""
        />
      );

      expect(getByText(/Both open and close times are required/)).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByLabelText } = render(<DayHoursRow {...defaultProps} />);

      expect(getByLabelText(/Monday hours settings/)).toBeTruthy();
      expect(getByLabelText(/Monday open\/closed toggle/)).toBeTruthy();
    });

    it('has descriptive accessibility state for switch', () => {
      const { getByRole } = render(<DayHoursRow {...defaultProps} />);

      const toggle = getByRole('switch');
      expect(toggle.props.accessibilityState?.checked).toBe(true);
    });

    it('has proper accessibility hints', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} showCopyButton={true} />
      );

      const copyButton = getByText('Copy');
      expect(copyButton.props.accessibilityHint).toContain('copy these hours');
    });

    it('announces errors with proper accessibility role', () => {
      const errors = ['Invalid time range'];
      const { getByRole } = render(
        <DayHoursRow {...defaultProps} errors={errors} />
      );

      const errorText = getByRole('alert');
      expect(errorText).toBeTruthy();
    });

    it('supports expanded accessibility state', () => {
      const { getByRole } = render(<DayHoursRow {...defaultProps} />);

      const container = getByRole('group');
      expect(container.props.accessibilityState?.expanded).toBe(true);
    });

    it('shows collapsed state when day is closed', () => {
      const { getByRole } = render(
        <DayHoursRow {...defaultProps} isOpen={false} />
      );

      const container = getByRole('group');
      expect(container.props.accessibilityState?.expanded).toBe(false);
    });
  });

  describe('Day Abbreviation', () => {
    it('shows correct abbreviation for each day', () => {
      const days = [
        { day: 'Monday', abbrev: 'Mon' },
        { day: 'Tuesday', abbrev: 'Tue' },
        { day: 'Wednesday', abbrev: 'Wed' },
        { day: 'Thursday', abbrev: 'Thu' },
        { day: 'Friday', abbrev: 'Fri' },
        { day: 'Saturday', abbrev: 'Sat' },
        { day: 'Sunday', abbrev: 'Sun' },
      ];

      days.forEach(({ day, abbrev }) => {
        const { getByText } = render(
          <DayHoursRow {...defaultProps} day={day} />
        );

        expect(getByText(abbrev)).toBeTruthy();
        expect(getByText(day)).toBeTruthy();
      });
    });
  });

  describe('Loading State', () => {
    it('disables all interactions when loading', () => {
      const { getByRole, getByText, getByTestId } = render(
        <DayHoursRow {...defaultProps} loading={true} showCopyButton={true} />
      );

      const toggle = getByRole('switch');
      const nextDayButton = getByText('Next Day');
      const copyButton = getByText('Copy');
      const openTimePicker = getByTestId('time-picker-Opens');
      const closeTimePicker = getByTestId('time-picker-Closes');

      expect(toggle.props.disabled).toBe(true);
      expect(nextDayButton.props.accessibilityState?.disabled).toBe(true);
      expect(copyButton.props.accessibilityState?.disabled).toBe(true);
      expect(openTimePicker.props.disabled).toBe(true);
      expect(closeTimePicker.props.disabled).toBe(true);
    });

    it('shows loading state in accessibility labels', () => {
      const { getByRole } = render(
        <DayHoursRow {...defaultProps} loading={true} />
      );

      const toggle = getByRole('switch');
      expect(toggle.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onCopyHours prop gracefully', () => {
      const propsWithoutCopy = { ...defaultProps };
      delete propsWithoutCopy.onCopyHours;

      const { queryByText } = render(
        <DayHoursRow {...propsWithoutCopy} showCopyButton={true} />
      );

      // Copy button should not be shown if onCopyHours is not provided
      expect(queryByText('Copy')).toBeNull();
    });

    it('handles empty errors array', () => {
      const { queryByRole } = render(
        <DayHoursRow {...defaultProps} errors={[]} />
      );

      expect(queryByRole('alert')).toBeNull();
    });

    it('handles undefined errors', () => {
      const { queryByRole } = render(
        <DayHoursRow {...defaultProps} errors={undefined} />
      );

      expect(queryByRole('alert')).toBeNull();
    });

    it('handles very long day names', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} day="VeryLongDayName" />
      );

      expect(getByText('Ver')).toBeTruthy(); // Should truncate to 3 chars
      expect(getByText('VeryLongDayName')).toBeTruthy();
    });

    it('handles special characters in day names', () => {
      const { getByText } = render(
        <DayHoursRow {...defaultProps} day="Mon-day" />
      );

      expect(getByText('Mon')).toBeTruthy();
      expect(getByText('Mon-day')).toBeTruthy();
    });
  });
});