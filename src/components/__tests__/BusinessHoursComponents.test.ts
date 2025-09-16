// Basic test to verify business hours validation logic
import { 
  validateBusinessHours, 
  isValidBusinessHours,
  timeToMinutes,
  minutesToTime,
  formatTimeForDisplay 
} from '../../utils/businessHoursValidation';
import { BusinessHoursData } from '../BusinessHoursSelector';

describe('Business Hours Validation', () => {
  const validHours: BusinessHoursData = {
    Monday: {
      day: 'Monday',
      isOpen: true,
      openTime: '09:00',
      closeTime: '17:00',
      isNextDay: false,
    },
    Tuesday: {
      day: 'Tuesday',
      isOpen: true,
      openTime: '09:00',
      closeTime: '17:00',
      isNextDay: false,
    },
    Wednesday: {
      day: 'Wednesday',
      isOpen: true,
      openTime: '09:00',
      closeTime: '17:00',
      isNextDay: false,
    },
    Thursday: {
      day: 'Thursday',
      isOpen: true,
      openTime: '09:00',
      closeTime: '17:00',
      isNextDay: false,
    },
    Friday: {
      day: 'Friday',
      isOpen: true,
      openTime: '09:00',
      closeTime: '17:00',
      isNextDay: false,
    },
    Saturday: {
      day: 'Saturday',
      isOpen: false,
      openTime: '',
      closeTime: '',
      isNextDay: false,
    },
    Sunday: {
      day: 'Sunday',
      isOpen: false,
      openTime: '',
      closeTime: '',
      isNextDay: false,
    },
  };

  test('should validate correct business hours', () => {
    const result = validateBusinessHours(validHours);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('should detect when no days are open', () => {
    const allClosedHours: BusinessHoursData = {};
    Object.keys(validHours).forEach(day => {
      allClosedHours[day] = {
        ...validHours[day],
        isOpen: false,
      };
    });

    const result = validateBusinessHours(allClosedHours);
    expect(result.isValid).toBe(false);
    expect(result.errors.general).toBe('At least one day must be open');
  });

  test('should detect invalid time ranges', () => {
    const invalidHours: BusinessHoursData = {
      ...validHours,
      Monday: {
        day: 'Monday',
        isOpen: true,
        openTime: '17:00',
        closeTime: '09:00', // Close before open
        isNextDay: false,
      },
    };

    const result = validateBusinessHours(invalidHours);
    expect(result.isValid).toBe(false);
    expect(result.errors.Monday).toContain('Closing time must be after opening time');
  });

  test('should allow next day closing', () => {
    const nextDayHours: BusinessHoursData = {
      ...validHours,
      Friday: {
        day: 'Friday',
        isOpen: true,
        openTime: '18:00',
        closeTime: '02:00', // 2 AM next day
        isNextDay: true,
      },
    };

    const result = validateBusinessHours(nextDayHours);
    expect(result.isValid).toBe(true);
  });

  test('timeToMinutes utility function', () => {
    expect(timeToMinutes('09:00')).toBe(540); // 9 * 60
    expect(timeToMinutes('17:30')).toBe(1050); // 17 * 60 + 30
    expect(timeToMinutes('00:00')).toBe(0);
  });

  test('minutesToTime utility function', () => {
    expect(minutesToTime(540)).toBe('09:00');
    expect(minutesToTime(1050)).toBe('17:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  test('formatTimeForDisplay utility function', () => {
    expect(formatTimeForDisplay('09:00')).toBe('9:00 AM');
    expect(formatTimeForDisplay('17:30')).toBe('5:30 PM');
    expect(formatTimeForDisplay('00:00')).toBe('12:00 AM');
    expect(formatTimeForDisplay('12:00')).toBe('12:00 PM');
  });

  test('isValidBusinessHours convenience function', () => {
    expect(isValidBusinessHours(validHours)).toBe(true);
    
    const invalidHours: BusinessHoursData = {};
    Object.keys(validHours).forEach(day => {
      invalidHours[day] = {
        ...validHours[day],
        isOpen: false,
      };
    });
    
    expect(isValidBusinessHours(invalidHours)).toBe(false);
  });
});