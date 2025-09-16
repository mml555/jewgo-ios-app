import { AccessibilityInfo } from 'react-native';
import {
  announceForScreenReader,
  generateBusinessHoursLabel,
  generateAccessibilityHint,
  generateValidationLabel,
  generateAccessibilityState,
  generateSemanticDescription,
  generateTimePickerLabel,
  announceValidationChange,
  setAccessibilityFocus,
  logAccessibilityInfo,
} from '../accessibility';

// Mock React Native AccessibilityInfo
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForScreenReader: jest.fn(),
    setAccessibilityFocus: jest.fn(),
    isScreenReaderEnabled: jest.fn(),
  },
}));

const mockAccessibilityInfo = AccessibilityInfo as jest.Mocked<typeof AccessibilityInfo>;

describe('Accessibility Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods for testing
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('announceForScreenReader', () => {
    it('announces message with default priority', () => {
      announceForScreenReader('Test message');

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith('Test message');
    });

    it('announces message with polite priority', () => {
      announceForScreenReader('Test message', 'polite');

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith('Test message');
    });

    it('announces message with assertive priority', () => {
      announceForScreenReader('Test message', 'assertive');

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith('Test message');
    });

    it('handles empty messages gracefully', () => {
      announceForScreenReader('');

      expect(mockAccessibilityInfo.announceForScreenReader).not.toHaveBeenCalled();
    });

    it('handles null/undefined messages gracefully', () => {
      announceForScreenReader(null as any);
      announceForScreenReader(undefined as any);

      expect(mockAccessibilityInfo.announceForScreenReader).not.toHaveBeenCalled();
    });

    it('handles announcement errors gracefully', () => {
      mockAccessibilityInfo.announceForScreenReader.mockImplementation(() => {
        throw new Error('Announcement failed');
      });

      expect(() => announceForScreenReader('Test message')).not.toThrow();
    });
  });

  describe('generateBusinessHoursLabel', () => {
    it('generates label for open day with regular hours', () => {
      const label = generateBusinessHoursLabel('Monday', true, '09:00', '17:00', false);

      expect(label).toContain('Monday');
      expect(label).toContain('open');
      expect(label).toContain('9:00 AM');
      expect(label).toContain('5:00 PM');
    });

    it('generates label for closed day', () => {
      const label = generateBusinessHoursLabel('Sunday', false, '', '', false);

      expect(label).toContain('Sunday');
      expect(label).toContain('closed');
    });

    it('generates label for next day hours', () => {
      const label = generateBusinessHoursLabel('Friday', true, '18:00', '02:00', true);

      expect(label).toContain('Friday');
      expect(label).toContain('6:00 PM');
      expect(label).toContain('2:00 AM');
      expect(label).toContain('next day');
    });

    it('handles midnight hours correctly', () => {
      const label = generateBusinessHoursLabel('Saturday', true, '00:00', '12:00', false);

      expect(label).toContain('12:00 AM');
      expect(label).toContain('12:00 PM');
    });

    it('handles invalid time formats gracefully', () => {
      const label = generateBusinessHoursLabel('Monday', true, 'invalid', 'invalid', false);

      expect(label).toContain('Monday');
      expect(label).toContain('open');
      // Should not crash on invalid times
    });

    it('handles empty day name', () => {
      const label = generateBusinessHoursLabel('', true, '09:00', '17:00', false);

      expect(label).toBeDefined();
      expect(typeof label).toBe('string');
    });
  });

  describe('generateAccessibilityHint', () => {
    it('generates basic hint', () => {
      const hint = generateAccessibilityHint('tap to select');

      expect(hint).toContain('tap to select');
    });

    it('generates hint with additional context', () => {
      const hint = generateAccessibilityHint('tap to select', 'This will open a time picker');

      expect(hint).toContain('tap to select');
      expect(hint).toContain('This will open a time picker');
    });

    it('handles empty action gracefully', () => {
      const hint = generateAccessibilityHint('');

      expect(hint).toBe('');
    });

    it('handles null/undefined values gracefully', () => {
      const hint1 = generateAccessibilityHint(null as any);
      const hint2 = generateAccessibilityHint(undefined as any);

      expect(hint1).toBe('');
      expect(hint2).toBe('');
    });

    it('formats hint properly with context', () => {
      const hint = generateAccessibilityHint('select time', 'Current time is 9:00 AM');

      expect(hint).toMatch(/select time.*Current time is 9:00 AM/);
    });
  });

  describe('generateValidationLabel', () => {
    it('generates label for valid field', () => {
      const label = generateValidationLabel('Business Name', true);

      expect(label).toContain('Business Name');
      expect(label).toContain('valid');
    });

    it('generates label for invalid field', () => {
      const label = generateValidationLabel('Business Name', false, 'Name is required');

      expect(label).toContain('Business Name');
      expect(label).toContain('invalid');
      expect(label).toContain('Name is required');
    });

    it('generates label for field with warning', () => {
      const label = generateValidationLabel('Website', true, undefined, 'Consider adding a website');

      expect(label).toContain('Website');
      expect(label).toContain('Consider adding a website');
    });

    it('handles empty field name', () => {
      const label = generateValidationLabel('', true);

      expect(label).toBeDefined();
      expect(typeof label).toBe('string');
    });
  });

  describe('generateAccessibilityState', () => {
    it('generates state for required valid field', () => {
      const state = generateAccessibilityState(true, false, false, true);

      expect(state.required).toBe(true);
      expect(state.invalid).toBe(false);
      expect(state.disabled).toBe(false);
      expect(state.selected).toBe(true);
    });

    it('generates state for invalid field', () => {
      const state = generateAccessibilityState(false, true, false, false);

      expect(state.required).toBe(false);
      expect(state.invalid).toBe(true);
      expect(state.disabled).toBe(false);
      expect(state.selected).toBe(false);
    });

    it('generates state for disabled field', () => {
      const state = generateAccessibilityState(false, false, true, false);

      expect(state.disabled).toBe(true);
    });

    it('handles all false values', () => {
      const state = generateAccessibilityState(false, false, false, false);

      expect(state.required).toBe(false);
      expect(state.invalid).toBe(false);
      expect(state.disabled).toBe(false);
      expect(state.selected).toBe(false);
    });
  });

  describe('generateSemanticDescription', () => {
    it('generates description for section', () => {
      const description = generateSemanticDescription('section', 'Business Hours', 'Set your operating hours');

      expect(description).toContain('Business Hours');
      expect(description).toContain('section');
      expect(description).toContain('Set your operating hours');
    });

    it('generates description for button', () => {
      const description = generateSemanticDescription('button', 'Save', 'Save your changes');

      expect(description).toContain('Save');
      expect(description).toContain('button');
      expect(description).toContain('Save your changes');
    });

    it('handles missing description', () => {
      const description = generateSemanticDescription('button', 'Save');

      expect(description).toContain('Save');
      expect(description).toContain('button');
    });

    it('handles empty values gracefully', () => {
      const description = generateSemanticDescription('', '', '');

      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
    });
  });

  describe('generateTimePickerLabel', () => {
    it('generates label for time picker with value', () => {
      const label = generateTimePickerLabel('Opening Time', '9:00 AM', 'Select time');

      expect(label).toContain('Opening Time');
      expect(label).toContain('9:00 AM');
    });

    it('generates label for empty time picker', () => {
      const label = generateTimePickerLabel('Opening Time', '', 'Select time');

      expect(label).toContain('Opening Time');
      expect(label).toContain('Select time');
    });

    it('handles missing label', () => {
      const label = generateTimePickerLabel('', '9:00 AM', 'Select time');

      expect(label).toContain('9:00 AM');
    });

    it('handles all empty values', () => {
      const label = generateTimePickerLabel('', '', '');

      expect(label).toBeDefined();
      expect(typeof label).toBe('string');
    });
  });

  describe('announceValidationChange', () => {
    it('announces validation success', () => {
      announceValidationChange('Business Name', true);

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Business Name')
      );
      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('valid')
      );
    });

    it('announces validation error', () => {
      announceValidationChange('Business Name', false, 'Name is required');

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Business Name')
      );
      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledWith(
        expect.stringContaining('Name is required')
      );
    });

    it('handles empty field name', () => {
      announceValidationChange('', true);

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalled();
    });

    it('handles announcement errors gracefully', () => {
      mockAccessibilityInfo.announceForScreenReader.mockImplementation(() => {
        throw new Error('Announcement failed');
      });

      expect(() => announceValidationChange('Business Name', true)).not.toThrow();
    });
  });

  describe('setAccessibilityFocus', () => {
    it('sets focus on element', () => {
      const mockElement = { current: { focus: jest.fn() } };

      setAccessibilityFocus(mockElement as any);

      expect(mockAccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(
        mockElement.current
      );
    });

    it('handles null ref gracefully', () => {
      const mockElement = { current: null };

      expect(() => setAccessibilityFocus(mockElement as any)).not.toThrow();
      expect(mockAccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('handles undefined ref gracefully', () => {
      expect(() => setAccessibilityFocus(undefined as any)).not.toThrow();
      expect(mockAccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('handles focus errors gracefully', () => {
      const mockElement = { current: { focus: jest.fn() } };
      mockAccessibilityInfo.setAccessibilityFocus.mockImplementation(() => {
        throw new Error('Focus failed');
      });

      expect(() => setAccessibilityFocus(mockElement as any)).not.toThrow();
    });
  });

  describe('logAccessibilityInfo', () => {
    it('logs accessibility info in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      logAccessibilityInfo('TestComponent', {
        accessibilityLabel: 'Test Label',
        accessibilityRole: 'button',
      });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('TestComponent'),
        expect.objectContaining({
          accessibilityLabel: 'Test Label',
          accessibilityRole: 'button',
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('does not log in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      logAccessibilityInfo('TestComponent', {
        accessibilityLabel: 'Test Label',
      });

      expect(console.log).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles empty component name', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(() => logAccessibilityInfo('', {})).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });

    it('handles empty accessibility info', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(() => logAccessibilityInfo('TestComponent', {})).not.toThrow();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Time Formatting', () => {
    it('formats various time values correctly', () => {
      const testCases = [
        { input: '00:00', expected: '12:00 AM' },
        { input: '01:30', expected: '1:30 AM' },
        { input: '12:00', expected: '12:00 PM' },
        { input: '13:45', expected: '1:45 PM' },
        { input: '23:59', expected: '11:59 PM' },
      ];

      testCases.forEach(({ input, expected }) => {
        const label = generateBusinessHoursLabel('Monday', true, input, '17:00', false);
        expect(label).toContain(expected);
      });
    });

    it('handles invalid time formats in labels', () => {
      const invalidTimes = ['25:00', '12:60', 'abc:def', ''];

      invalidTimes.forEach(time => {
        expect(() => {
          generateBusinessHoursLabel('Monday', true, time, '17:00', false);
        }).not.toThrow();
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('generates comprehensive business hours description', () => {
      const label = generateBusinessHoursLabel('Wednesday', true, '08:30', '22:15', true);

      expect(label).toContain('Wednesday');
      expect(label).toContain('open');
      expect(label).toContain('8:30 AM');
      expect(label).toContain('10:15 PM');
      expect(label).toContain('next day');
    });

    it('generates accessibility state for complex form field', () => {
      const state = generateAccessibilityState(true, true, false, false);

      expect(state.required).toBe(true);
      expect(state.invalid).toBe(true);
      expect(state.disabled).toBe(false);
      expect(state.selected).toBe(false);
    });

    it('generates semantic description for nested component', () => {
      const description = generateSemanticDescription(
        'group',
        'Business Hours Settings',
        'Configure when your business is open each day of the week'
      );

      expect(description).toContain('Business Hours Settings');
      expect(description).toContain('group');
      expect(description).toContain('Configure when your business is open');
    });
  });

  describe('Error Resilience', () => {
    it('handles all functions with null/undefined inputs', () => {
      const functions = [
        () => announceForScreenReader(null as any),
        () => generateBusinessHoursLabel(null as any, null as any, null as any, null as any, null as any),
        () => generateAccessibilityHint(null as any),
        () => generateValidationLabel(null as any, null as any),
        () => generateAccessibilityState(null as any, null as any, null as any, null as any),
        () => generateSemanticDescription(null as any, null as any),
        () => generateTimePickerLabel(null as any, null as any, null as any),
        () => announceValidationChange(null as any, null as any),
        () => setAccessibilityFocus(null as any),
        () => logAccessibilityInfo(null as any, null as any),
      ];

      functions.forEach(fn => {
        expect(fn).not.toThrow();
      });
    });

    it('handles functions with extreme values', () => {
      const extremeValues = ['', '   ', '\n\t', '🎉', 'very'.repeat(100)];

      extremeValues.forEach(value => {
        expect(() => {
          announceForScreenReader(value);
          generateBusinessHoursLabel(value, true, value, value, false);
          generateAccessibilityHint(value);
          generateValidationLabel(value, true);
          generateSemanticDescription(value, value, value);
          generateTimePickerLabel(value, value, value);
          announceValidationChange(value, true);
          logAccessibilityInfo(value, {});
        }).not.toThrow();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('works with screen reader enabled flow', async () => {
      mockAccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);

      // Simulate a complete form interaction flow
      announceForScreenReader('Form loaded');
      
      const businessHoursLabel = generateBusinessHoursLabel('Monday', true, '09:00', '17:00', false);
      const timePickerLabel = generateTimePickerLabel('Opening Time', '9:00 AM', 'Select time');
      const validationLabel = generateValidationLabel('Business Name', false, 'Name is required');
      
      announceValidationChange('Business Name', false, 'Name is required');
      
      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledTimes(2);
      expect(businessHoursLabel).toBeDefined();
      expect(timePickerLabel).toBeDefined();
      expect(validationLabel).toBeDefined();
    });

    it('handles rapid accessibility updates', () => {
      // Simulate rapid form changes
      for (let i = 0; i < 10; i++) {
        announceValidationChange(`Field ${i}`, i % 2 === 0, i % 2 === 0 ? undefined : 'Error');
        generateBusinessHoursLabel(`Day ${i}`, i % 2 === 0, '09:00', '17:00', false);
      }

      expect(mockAccessibilityInfo.announceForScreenReader).toHaveBeenCalledTimes(10);
    });
  });
});