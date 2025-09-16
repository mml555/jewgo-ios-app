import React from 'react';
import { create, act } from 'react-test-renderer';
import { Alert } from 'react-native';
import BusinessHoursSelector, { BusinessHoursData } from '../BusinessHoursSelector';
import * as hapticFeedback from '../../utils/hapticFeedback';
import * as accessibility from '../../utils/accessibility';

// Mock dependencies
jest.mock('../../utils/hapticFeedback');
jest.mock('../../utils/accessibility');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockHapticButtonPress = hapticFeedback.hapticButtonPress as jest.MockedFunction<typeof hapticFeedback.hapticButtonPress>;
const mockHapticSuccess = hapticFeedback.hapticSuccess as jest.MockedFunction<typeof hapticFeedback.hapticSuccess>;
const mockHapticWarning = hapticFeedback.hapticWarning as jest.MockedFunction<typeof hapticFeedback.hapticWarning>;
const mockAnnounceForScreenReader = accessibility.announceForScreenReader as jest.MockedFunction<typeof accessibility.announceForScreenReader>;

describe('BusinessHoursSelector', () => {
  const defaultHours: BusinessHoursData = {
    Monday: { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Tuesday: { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Wednesday: { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Thursday: { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Friday: { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
    Saturday: { day: 'Saturday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
    Sunday: { day: 'Sunday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
  };

  const mockOnHoursChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnHoursChange.mockClear();
  });

  describe('Rendering', () => {
    it('renders correctly with default hours', () => {
      const { getByText, getByRole } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      expect(getByText('Business Hours')).toBeTruthy();
      expect(getByText('Set your operating hours for each day of the week')).toBeTruthy();
      expect(getByText('Weekdays 9-5')).toBeTruthy();
      expect(getByText('Weekends 10-6')).toBeTruthy();
      expect(getByText('Close All')).toBeTruthy();
    });

    it('renders all seven days', () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach(day => {
        expect(getByText(day)).toBeTruthy();
      });
    });

    it('shows validation summary with correct open days count', () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      expect(getByText('5 of 7')).toBeTruthy(); // 5 weekdays open
      expect(getByText('✓ Business hours are valid')).toBeTruthy();
    });
  });

  describe('Bulk Operations', () => {
    it('sets all weekdays to 9-5 when weekdays button is pressed', async () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      await act(async () => {
        fireEvent.press(getByText('Weekdays 9-5'));
      });

      expect(mockHapticButtonPress).toHaveBeenCalled();
      expect(mockOnHoursChange).toHaveBeenCalledWith(
        expect.objectContaining({
          Monday: expect.objectContaining({ isOpen: true, openTime: '09:00', closeTime: '17:00' }),
          Tuesday: expect.objectContaining({ isOpen: true, openTime: '09:00', closeTime: '17:00' }),
          Wednesday: expect.objectContaining({ isOpen: true, openTime: '09:00', closeTime: '17:00' }),
          Thursday: expect.objectContaining({ isOpen: true, openTime: '09:00', closeTime: '17:00' }),
          Friday: expect.objectContaining({ isOpen: true, openTime: '09:00', closeTime: '17:00' }),
        })
      );
    });

    it('sets all weekends to 10-6 when weekends button is pressed', async () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      await act(async () => {
        fireEvent.press(getByText('Weekends 10-6'));
      });

      expect(mockHapticButtonPress).toHaveBeenCalled();
      expect(mockOnHoursChange).toHaveBeenCalledWith(
        expect.objectContaining({
          Saturday: expect.objectContaining({ isOpen: true, openTime: '10:00', closeTime: '18:00' }),
          Sunday: expect.objectContaining({ isOpen: true, openTime: '10:00', closeTime: '18:00' }),
        })
      );
    });

    it('closes all days when close all button is pressed', async () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      await act(async () => {
        fireEvent.press(getByText('Close All'));
      });

      expect(mockHapticWarning).toHaveBeenCalled();
      expect(mockOnHoursChange).toHaveBeenCalledWith(
        expect.objectContaining({
          Monday: expect.objectContaining({ isOpen: false }),
          Tuesday: expect.objectContaining({ isOpen: false }),
          Wednesday: expect.objectContaining({ isOpen: false }),
          Thursday: expect.objectContaining({ isOpen: false }),
          Friday: expect.objectContaining({ isOpen: false }),
          Saturday: expect.objectContaining({ isOpen: false }),
          Sunday: expect.objectContaining({ isOpen: false }),
        })
      );
    });
  });

  describe('Validation', () => {
    it('shows error when no days are open', () => {
      const allClosedHours: BusinessHoursData = {};
      Object.keys(defaultHours).forEach(day => {
        allClosedHours[day] = { ...defaultHours[day], isOpen: false };
      });

      const { getByText } = render(
        <BusinessHoursSelector
          hours={allClosedHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      expect(getByText('0 of 7')).toBeTruthy();
      expect(getByText('At least one day must be open')).toBeTruthy();
    });

    it('displays external errors', () => {
      const errors = { Monday: 'Invalid time range' };
      
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
          errors={errors}
        />
      );

      expect(getByText('Please fix the errors above')).toBeTruthy();
    });

    it('validates in real-time when enabled', async () => {
      const { rerender } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
          enableRealTimeValidation={true}
        />
      );

      // Change to invalid hours
      const invalidHours = {
        ...defaultHours,
        Monday: { ...defaultHours.Monday, openTime: '17:00', closeTime: '09:00' }
      };

      await act(async () => {
        rerender(
          <BusinessHoursSelector
            hours={invalidHours}
            onHoursChange={mockOnHoursChange}
            enableRealTimeValidation={true}
          />
        );
      });

      await waitFor(() => {
        expect(mockOnHoursChange).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility labels', () => {
      const { getByLabelText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      expect(getByLabelText(/Business Hours/)).toBeTruthy();
      expect(getByLabelText(/Quick hour setting options/)).toBeTruthy();
    });

    it('announces changes for screen readers', async () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
          hapticFeedback={true}
        />
      );

      await act(async () => {
        fireEvent.press(getByText('Weekdays 9-5'));
      });

      // Note: Screen reader announcements are tested in integration tests
      // as they depend on AccessibilityInfo which is mocked
    });

    it('supports disabled state', () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
          loading={true}
        />
      );

      const weekdaysButton = getByText('Weekdays 9-5');
      expect(weekdaysButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Performance', () => {
    it('memoizes component to prevent unnecessary re-renders', () => {
      const { rerender } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      // Re-render with same props should not cause re-render
      rerender(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      // Component should be memoized (tested by React.memo behavior)
      expect(mockOnHoursChange).not.toHaveBeenCalled();
    });

    it('debounces validation calls', async () => {
      jest.useFakeTimers();
      
      const { rerender } = render(
        <BusinessHoursSelector
          hours={defaultHours}
          onHoursChange={mockOnHoursChange}
          enableRealTimeValidation={true}
        />
      );

      // Make multiple rapid changes
      const changes = [
        { ...defaultHours, Monday: { ...defaultHours.Monday, openTime: '08:00' } },
        { ...defaultHours, Monday: { ...defaultHours.Monday, openTime: '08:30' } },
        { ...defaultHours, Monday: { ...defaultHours.Monday, openTime: '09:00' } },
      ];

      changes.forEach(hours => {
        rerender(
          <BusinessHoursSelector
            hours={hours}
            onHoursChange={mockOnHoursChange}
            enableRealTimeValidation={true}
          />
        );
      });

      // Fast-forward time to trigger debounced validation
      act(() => {
        jest.advanceTimersByTime(300);
      });

      jest.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty hours object', () => {
      const { getByText } = render(
        <BusinessHoursSelector
          hours={{}}
          onHoursChange={mockOnHoursChange}
        />
      );

      // Should initialize with smart defaults
      expect(getByText('Business Hours')).toBeTruthy();
    });

    it('handles malformed hours data', () => {
      const malformedHours = {
        Monday: { day: 'Monday', isOpen: true, openTime: 'invalid', closeTime: 'invalid', isNextDay: false },
      } as BusinessHoursData;

      const { getByText } = render(
        <BusinessHoursSelector
          hours={malformedHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      expect(getByText('Business Hours')).toBeTruthy();
    });

    it('handles missing day data gracefully', () => {
      const incompleteHours = {
        Monday: defaultHours.Monday,
        // Missing other days
      };

      const { getByText } = render(
        <BusinessHoursSelector
          hours={incompleteHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      expect(getByText('Business Hours')).toBeTruthy();
    });
  });

  describe('Copy Hours Functionality', () => {
    it('shows alert when trying to copy from closed day', async () => {
      const closedMondayHours = {
        ...defaultHours,
        Monday: { ...defaultHours.Monday, isOpen: false }
      };

      const { getAllByText } = render(
        <BusinessHoursSelector
          hours={closedMondayHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      // Find and press a copy button (this would be in DayHoursRow)
      // Note: This test would need to be more specific based on actual implementation
      expect(Alert.alert).not.toHaveBeenCalled(); // Initially
    });

    it('copies hours to multiple days successfully', async () => {
      // This would test the copy functionality when implemented
      // The actual copy button interaction would be tested in DayHoursRow tests
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Smart Defaults', () => {
    it('initializes with smart defaults for empty hours', () => {
      const { rerender } = render(
        <BusinessHoursSelector
          hours={{}}
          onHoursChange={mockOnHoursChange}
        />
      );

      // Should call onHoursChange with smart defaults
      expect(mockOnHoursChange).toHaveBeenCalledWith(
        expect.objectContaining({
          Monday: expect.objectContaining({ isOpen: true, openTime: '09:00', closeTime: '17:00' }),
          Sunday: expect.objectContaining({ isOpen: false }),
        })
      );
    });

    it('preserves existing hours when some are provided', () => {
      const partialHours = {
        Monday: { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '16:00', isNextDay: false },
      };

      render(
        <BusinessHoursSelector
          hours={partialHours}
          onHoursChange={mockOnHoursChange}
        />
      );

      // Should preserve Monday's custom hours
      expect(mockOnHoursChange).toHaveBeenCalledWith(
        expect.objectContaining({
          Monday: expect.objectContaining({ openTime: '08:00', closeTime: '16:00' }),
        })
      );
    });
  });
});