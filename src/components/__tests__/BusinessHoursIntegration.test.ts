// Integration test to verify business hours components work together
import { 
  validateBusinessHours, 
  isValidBusinessHours,
  timeToMinutes,
  minutesToTime,
  formatTimeForDisplay 
} from '../../utils/businessHoursValidation';
import { BusinessHoursData } from '../BusinessHoursSelector';

describe('Business Hours Integration', () => {
  // Test data conversion functions that would be used in the form
  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return '';
    
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const convertTo12Hour = (time24h: string): string => {
    if (!time24h) return '';
    
    const [hours, minutes] = time24h.split(':');
    let hour12 = parseInt(hours);
    const period = hour12 >= 12 ? 'PM' : 'AM';
    
    if (hour12 === 0) {
      hour12 = 12;
    } else if (hour12 > 12) {
      hour12 -= 12;
    }
    
    return `${hour12}:${minutes} ${period}`;
  };

  // Test legacy format conversion
  const legacyBusinessHours = [
    { day: 'Monday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
    { day: 'Tuesday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
    { day: 'Wednesday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
    { day: 'Thursday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
    { day: 'Friday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
    { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
    { day: 'Sunday', openTime: '', closeTime: '', isClosed: true },
  ];

  const convertToBusinessHoursData = (businessHours: typeof legacyBusinessHours): BusinessHoursData => {
    const hoursData: BusinessHoursData = {};
    
    businessHours.forEach(dayHour => {
      hoursData[dayHour.day] = {
        day: dayHour.day,
        isOpen: !dayHour.isClosed,
        openTime: convertTo24Hour(dayHour.openTime),
        closeTime: convertTo24Hour(dayHour.closeTime),
        isNextDay: false,
      };
    });
    
    return hoursData;
  };

  test('should convert legacy format to new format correctly', () => {
    const newFormat = convertToBusinessHoursData(legacyBusinessHours);
    
    expect(newFormat.Monday.isOpen).toBe(true);
    expect(newFormat.Monday.openTime).toBe('09:00');
    expect(newFormat.Monday.closeTime).toBe('17:00');
    expect(newFormat.Saturday.isOpen).toBe(false);
    expect(newFormat.Sunday.isOpen).toBe(false);
  });

  test('should validate converted business hours', () => {
    const newFormat = convertToBusinessHoursData(legacyBusinessHours);
    const result = validateBusinessHours(newFormat);
    
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('time conversion functions work correctly', () => {
    expect(convertTo24Hour('9:00 AM')).toBe('09:00');
    expect(convertTo24Hour('5:00 PM')).toBe('17:00');
    expect(convertTo24Hour('12:00 PM')).toBe('12:00');
    expect(convertTo24Hour('12:00 AM')).toBe('00:00');
    
    expect(convertTo12Hour('09:00')).toBe('9:00 AM');
    expect(convertTo12Hour('17:00')).toBe('5:00 PM');
    expect(convertTo12Hour('12:00')).toBe('12:00 PM');
    expect(convertTo12Hour('00:00')).toBe('12:00 AM');
  });

  test('should handle late night hours with next day flag', () => {
    const lateNightHours: BusinessHoursData = {
      Friday: {
        day: 'Friday',
        isOpen: true,
        openTime: '18:00',
        closeTime: '02:00',
        isNextDay: true,
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
    };

    const result = validateBusinessHours(lateNightHours);
    expect(result.isValid).toBe(true);
  });

  test('should provide helpful suggestions for business hours', () => {
    const inconsistentHours: BusinessHoursData = {
      Monday: { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
      Tuesday: { day: 'Tuesday', isOpen: true, openTime: '10:00', closeTime: '18:00', isNextDay: false },
      Wednesday: { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
      Thursday: { day: 'Thursday', isOpen: true, openTime: '10:00', closeTime: '18:00', isNextDay: false },
      Friday: { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00', isNextDay: false },
      Saturday: { day: 'Saturday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
      Sunday: { day: 'Sunday', isOpen: false, openTime: '', closeTime: '', isNextDay: false },
    };

    const result = validateBusinessHours(inconsistentHours);
    expect(result.isValid).toBe(true);
    expect(result.suggestions).toContain('Consider using consistent hours for all weekdays');
  });
});