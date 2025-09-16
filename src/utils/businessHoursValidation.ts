import { BusinessHoursData, DayHours } from '../components/BusinessHoursSelector';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: { [day: string]: string };
  warnings: { [day: string]: string };
  suggestions: string[];
}

// Individual validation rule interface
export interface ValidationRule {
  name: string;
  validate: (hours: BusinessHoursData) => ValidationResult;
  priority: number; // Lower number = higher priority
}

// Time utilities
export const timeToMinutes = (timeString: string): number => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const formatTimeForDisplay = (timeString: string): string => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

// Validation rules
export const validationRules: ValidationRule[] = [
  // Rule 1: At least one day must be open (highest priority)
  {
    name: 'atLeastOneDayOpen',
    priority: 1,
    validate: (hours: BusinessHoursData): ValidationResult => {
      const openDays = Object.values(hours).filter(day => day.isOpen);
      
      if (openDays.length === 0) {
        return {
          isValid: false,
          errors: { general: 'At least one day must be open' },
          warnings: {},
          suggestions: ['Consider setting standard business hours for weekdays'],
        };
      }
      
      return {
        isValid: true,
        errors: {},
        warnings: {},
        suggestions: [],
      };
    },
  },

  // Rule 2: Open and close times must be provided for open days
  {
    name: 'requiredTimesForOpenDays',
    priority: 2,
    validate: (hours: BusinessHoursData): ValidationResult => {
      const errors: { [day: string]: string } = {};
      
      Object.values(hours).forEach(dayHours => {
        if (dayHours.isOpen) {
          if (!dayHours.openTime || !dayHours.closeTime) {
            errors[dayHours.day] = 'Both opening and closing times are required';
          }
        }
      });
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings: {},
        suggestions: Object.keys(errors).length > 0 
          ? ['Set both opening and closing times for all open days']
          : [],
      };
    },
  },

  // Rule 3: Time format validation
  {
    name: 'validTimeFormat',
    priority: 3,
    validate: (hours: BusinessHoursData): ValidationResult => {
      const errors: { [day: string]: string } = {};
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      
      Object.values(hours).forEach(dayHours => {
        if (dayHours.isOpen) {
          if (dayHours.openTime && !timeRegex.test(dayHours.openTime)) {
            errors[dayHours.day] = 'Invalid opening time format';
          }
          if (dayHours.closeTime && !timeRegex.test(dayHours.closeTime)) {
            errors[dayHours.day] = 'Invalid closing time format';
          }
        }
      });
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings: {},
        suggestions: [],
      };
    },
  },

  // Rule 4: Close time must be after open time (unless next day)
  {
    name: 'closeAfterOpen',
    priority: 4,
    validate: (hours: BusinessHoursData): ValidationResult => {
      const errors: { [day: string]: string } = {};
      
      Object.values(hours).forEach(dayHours => {
        if (dayHours.isOpen && dayHours.openTime && dayHours.closeTime && !dayHours.isNextDay) {
          const openMinutes = timeToMinutes(dayHours.openTime);
          const closeMinutes = timeToMinutes(dayHours.closeTime);
          
          if (closeMinutes <= openMinutes) {
            errors[dayHours.day] = 'Closing time must be after opening time, or enable "Next Day"';
          }
        }
      });
      
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        warnings: {},
        suggestions: Object.keys(errors).length > 0 
          ? ['For late-night businesses, enable the "Next Day" option']
          : [],
      };
    },
  },

  // Rule 5: Reasonable business hours (warnings only)
  {
    name: 'reasonableHours',
    priority: 5,
    validate: (hours: BusinessHoursData): ValidationResult => {
      const warnings: { [day: string]: string } = {};
      const suggestions: string[] = [];
      
      Object.values(hours).forEach(dayHours => {
        if (dayHours.isOpen && dayHours.openTime && dayHours.closeTime) {
          const openMinutes = timeToMinutes(dayHours.openTime);
          const closeMinutes = timeToMinutes(dayHours.closeTime);
          
          // Check for very early opening (before 5 AM)
          if (openMinutes < 300) { // 5:00 AM
            warnings[dayHours.day] = `Very early opening time: ${formatTimeForDisplay(dayHours.openTime)}`;
          }
          
          // Check for very late closing (after 2 AM next day)
          if (dayHours.isNextDay && closeMinutes > 120) { // 2:00 AM
            warnings[dayHours.day] = `Very late closing time: ${formatTimeForDisplay(dayHours.closeTime)} next day`;
          }
          
          // Check for very long hours (more than 16 hours)
          let totalMinutes = dayHours.isNextDay 
            ? (1440 - openMinutes) + closeMinutes // Minutes until midnight + minutes after midnight
            : closeMinutes - openMinutes;
            
          if (totalMinutes > 960) { // 16 hours
            warnings[dayHours.day] = `Very long operating hours: ${Math.floor(totalMinutes / 60)} hours`;
            suggestions.push('Consider if such long hours are sustainable for your business');
          }
          
          // Check for very short hours (less than 2 hours)
          if (!dayHours.isNextDay && totalMinutes < 120) { // 2 hours
            warnings[dayHours.day] = `Very short operating hours: ${Math.floor(totalMinutes / 60)} hours`;
          }
        }
      });
      
      return {
        isValid: true, // Warnings don't make it invalid
        errors: {},
        warnings,
        suggestions: [...new Set(suggestions)], // Remove duplicates
      };
    },
  },

  // Rule 6: Consistent weekend/weekday patterns (suggestions only)
  {
    name: 'consistentPatterns',
    priority: 6,
    validate: (hours: BusinessHoursData): ValidationResult => {
      const suggestions: string[] = [];
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const weekends = ['Saturday', 'Sunday'];
      
      // Check weekday consistency
      const weekdayHours = weekdays.map(day => hours[day]).filter(day => day?.isOpen);
      if (weekdayHours.length > 1) {
        const firstWeekdayHours = weekdayHours[0];
        const inconsistentWeekdays = weekdayHours.some(day => 
          day.openTime !== firstWeekdayHours.openTime || 
          day.closeTime !== firstWeekdayHours.closeTime
        );
        
        if (inconsistentWeekdays) {
          suggestions.push('Consider using consistent hours for all weekdays');
        }
      }
      
      // Check weekend consistency
      const weekendHours = weekends.map(day => hours[day]).filter(day => day?.isOpen);
      if (weekendHours.length > 1) {
        const firstWeekendHours = weekendHours[0];
        const inconsistentWeekends = weekendHours.some(day => 
          day.openTime !== firstWeekendHours.openTime || 
          day.closeTime !== firstWeekendHours.closeTime
        );
        
        if (inconsistentWeekends) {
          suggestions.push('Consider using consistent hours for weekends');
        }
      }
      
      return {
        isValid: true,
        errors: {},
        warnings: {},
        suggestions,
      };
    },
  },
];

// Main validation engine
export class BusinessHoursValidationEngine {
  private rules: ValidationRule[];
  
  constructor(customRules?: ValidationRule[]) {
    this.rules = customRules || validationRules;
    this.rules.sort((a, b) => a.priority - b.priority);
  }
  
  // Validate all rules
  validateAll(hours: BusinessHoursData): ValidationResult {
    const combinedResult: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
      suggestions: [],
    };
    
    for (const rule of this.rules) {
      const result = rule.validate(hours);
      
      // Combine errors
      Object.assign(combinedResult.errors, result.errors);
      
      // Combine warnings
      Object.assign(combinedResult.warnings, result.warnings);
      
      // Combine suggestions (avoid duplicates)
      result.suggestions.forEach(suggestion => {
        if (!combinedResult.suggestions.includes(suggestion)) {
          combinedResult.suggestions.push(suggestion);
        }
      });
      
      // If any rule fails, the overall validation fails
      if (!result.isValid) {
        combinedResult.isValid = false;
      }
    }
    
    return combinedResult;
  }
  
  // Validate a specific day
  validateDay(hours: BusinessHoursData, day: string): ValidationResult {
    const dayHours = hours[day];
    if (!dayHours) {
      return {
        isValid: false,
        errors: { [day]: 'Day not found' },
        warnings: {},
        suggestions: [],
      };
    }
    
    // Create a minimal hours object for validation
    const singleDayHours = { [day]: dayHours };
    
    // Run relevant rules
    const result = this.validateAll(singleDayHours);
    
    return result;
  }
  
  // Get validation suggestions for improving hours
  getSuggestions(hours: BusinessHoursData): string[] {
    const result = this.validateAll(hours);
    return result.suggestions;
  }
  
  // Check if hours are valid (no errors)
  isValid(hours: BusinessHoursData): boolean {
    const result = this.validateAll(hours);
    return result.isValid;
  }
  
  // Get all errors
  getErrors(hours: BusinessHoursData): { [day: string]: string } {
    const result = this.validateAll(hours);
    return result.errors;
  }
  
  // Get all warnings
  getWarnings(hours: BusinessHoursData): { [day: string]: string } {
    const result = this.validateAll(hours);
    return result.warnings;
  }
  
  // Real-time validation for a single field change
  validateFieldChange(
    hours: BusinessHoursData, 
    day: string, 
    field: keyof DayHours, 
    value: any
  ): ValidationResult {
    // Create updated hours with the field change
    const updatedHours = {
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    };
    
    // Validate the updated hours
    return this.validateAll(updatedHours);
  }
}

// Default validation engine instance
export const defaultValidationEngine = new BusinessHoursValidationEngine();

// Convenience functions
export const validateBusinessHours = (hours: BusinessHoursData): ValidationResult => {
  return defaultValidationEngine.validateAll(hours);
};

export const isValidBusinessHours = (hours: BusinessHoursData): boolean => {
  return defaultValidationEngine.isValid(hours);
};

export const getBusinessHoursErrors = (hours: BusinessHoursData): { [day: string]: string } => {
  return defaultValidationEngine.getErrors(hours);
};

export const getBusinessHoursSuggestions = (hours: BusinessHoursData): string[] => {
  return defaultValidationEngine.getSuggestions(hours);
};