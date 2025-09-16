import { renderHook, act } from '@testing-library/react-hooks';
import { useFormValidation } from '../useFormValidation';
import { ListingFormData } from '../../screens/AddCategoryScreen';

describe('useFormValidation', () => {
  const validFormData: ListingFormData = {
    name: 'Test Restaurant',
    address: '123 Main St, City, State 12345',
    phone: '1234567890',
    business_email: 'test@restaurant.com',
    website: 'https://testrestaurant.com',
    listing_type: 'Eatery',
    kosher_category: 'Meat',
    certifying_agency: 'OU',
    custom_certifying_agency: '',
    short_description: 'A great kosher restaurant',
    description: 'We serve delicious kosher food in a family-friendly atmosphere.',
    business_hours: [
      { day: 'Monday', openTime: '09:00', closeTime: '17:00', isClosed: false },
      { day: 'Tuesday', openTime: '09:00', closeTime: '17:00', isClosed: false },
      { day: 'Wednesday', openTime: '09:00', closeTime: '17:00', isClosed: false },
      { day: 'Thursday', openTime: '09:00', closeTime: '17:00', isClosed: false },
      { day: 'Friday', openTime: '09:00', closeTime: '17:00', isClosed: false },
      { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
      { day: 'Sunday', openTime: '', closeTime: '', isClosed: true },
    ],
    seating_capacity: 50,
    years_in_business: 5,
    instagram_link: 'https://instagram.com/testrestaurant',
    facebook_link: 'https://facebook.com/testrestaurant',
    tiktok_link: '',
    business_images: ['image1.jpg', 'image2.jpg'],
  };

  const emptyFormData = {} as ListingFormData;

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.fieldWarnings).toEqual({});
      expect(result.current.stepResults).toEqual({});
      expect(result.current.formResult).toBeNull();
      expect(result.current.isValidating).toBe(false);
      expect(result.current.hasErrors).toBe(false);
      expect(result.current.hasWarnings).toBe(false);
      expect(result.current.isFormValid).toBe(false);
    });

    it('validates on mount when enabled', () => {
      const { result } = renderHook(() => 
        useFormValidation(validFormData, { validateOnMount: true })
      );

      act(() => {
        jest.advanceTimersByTime(300); // Default debounce
      });

      expect(result.current.formResult).not.toBeNull();
      expect(result.current.isFormValid).toBe(true);
    });

    it('does not validate on mount by default', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.formResult).toBeNull();
    });
  });

  describe('Field Validation', () => {
    it('validates individual fields', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const fieldResult = result.current.validateField('name', 'Valid Name');
        expect(fieldResult.isValid).toBe(true);
      });
    });

    it('validates required fields', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const fieldResult = result.current.validateField('name', '');
        expect(fieldResult.isValid).toBe(false);
        expect(fieldResult.error).toBe('Business name is required');
      });

      expect(result.current.fieldErrors.name).toBe('Business name is required');
      expect(result.current.hasErrors).toBe(true);
    });

    it('validates field format constraints', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const fieldResult = result.current.validateField('business_email', 'invalid-email');
        expect(fieldResult.isValid).toBe(false);
        expect(fieldResult.error).toBe('Please enter a valid email address');
      });

      expect(result.current.fieldErrors.business_email).toBe('Please enter a valid email address');
    });

    it('clears field errors when validation passes', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      // First, create an error
      act(() => {
        result.current.validateField('name', '');
      });

      expect(result.current.fieldErrors.name).toBeDefined();

      // Then, fix the error
      act(() => {
        result.current.validateField('name', 'Valid Name');
      });

      expect(result.current.fieldErrors.name).toBeUndefined();
      expect(result.current.hasErrors).toBe(false);
    });

    it('handles field warnings', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const fieldResult = result.current.validateField('website', '');
        expect(fieldResult.isValid).toBe(true);
        expect(fieldResult.suggestion).toContain('Adding a website helps customers');
      });

      // Note: Warnings are handled differently than errors in the validation engine
    });
  });

  describe('Step Validation', () => {
    it('validates individual steps', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const stepResult = result.current.validateStep(1);
        expect(stepResult.isValid).toBe(true);
        expect(stepResult.completionPercentage).toBe(100);
      });

      expect(result.current.stepResults[1]).toBeDefined();
      expect(result.current.isStepValid(1)).toBe(true);
    });

    it('identifies step errors', () => {
      const invalidData = { ...validFormData, name: '', phone: '' };
      const { result } = renderHook(() => useFormValidation(invalidData));

      act(() => {
        const stepResult = result.current.validateStep(1);
        expect(stepResult.isValid).toBe(false);
        expect(Object.keys(stepResult.errors)).toContain('name');
        expect(Object.keys(stepResult.errors)).toContain('phone');
      });

      expect(result.current.fieldErrors.name).toBeDefined();
      expect(result.current.fieldErrors.phone).toBeDefined();
      expect(result.current.hasErrors).toBe(true);
    });

    it('calculates step completion percentage', () => {
      const partialData = { ...validFormData, name: 'Test', address: '', phone: '' };
      const { result } = renderHook(() => useFormValidation(partialData));

      act(() => {
        result.current.validateStep(1);
      });

      const percentage = result.current.getStepCompletionPercentage(1);
      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });
  });

  describe('Form Validation', () => {
    it('validates entire form', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const formResult = result.current.validateForm();
        expect(formResult.isValid).toBe(true);
        expect(formResult.completionPercentage).toBe(100);
      });

      expect(result.current.formResult).not.toBeNull();
      expect(result.current.isFormValid).toBe(true);
    });

    it('identifies form-wide errors', () => {
      const { result } = renderHook(() => useFormValidation(emptyFormData));

      act(() => {
        const formResult = result.current.validateForm();
        expect(formResult.isValid).toBe(false);
        expect(formResult.overallErrors.length).toBeGreaterThan(0);
      });

      expect(result.current.hasErrors).toBe(true);
      expect(result.current.isFormValid).toBe(false);
    });

    it('calculates form completion percentage', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        result.current.validateForm();
      });

      const percentage = result.current.getFormCompletionPercentage();
      expect(percentage).toBe(100);
    });
  });

  describe('Real-time Validation', () => {
    it('validates automatically when form data changes', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useFormValidation(formData, { enableRealTimeValidation: true }),
        { initialProps: { formData: validFormData } }
      );

      // Change form data
      const updatedData = { ...validFormData, name: '' };
      rerender({ formData: updatedData });

      act(() => {
        jest.advanceTimersByTime(300); // Debounce time
      });

      expect(result.current.formResult).not.toBeNull();
      expect(result.current.hasErrors).toBe(true);
    });

    it('debounces real-time validation', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useFormValidation(formData, { 
          enableRealTimeValidation: true,
          debounceMs: 500 
        }),
        { initialProps: { formData: validFormData } }
      );

      // Make rapid changes
      rerender({ formData: { ...validFormData, name: 'A' } });
      rerender({ formData: { ...validFormData, name: 'AB' } });
      rerender({ formData: { ...validFormData, name: 'ABC' } });

      // Should not validate immediately
      expect(result.current.isValidating).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should validate after debounce
      expect(result.current.formResult).not.toBeNull();
    });

    it('can disable real-time validation', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useFormValidation(formData, { enableRealTimeValidation: false }),
        { initialProps: { formData: validFormData } }
      );

      const updatedData = { ...validFormData, name: '' };
      rerender({ formData: updatedData });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Should not auto-validate
      expect(result.current.formResult).toBeNull();
    });
  });

  describe('Error Management', () => {
    it('clears individual field errors', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      // Create error
      act(() => {
        result.current.validateField('name', '');
      });

      expect(result.current.fieldErrors.name).toBeDefined();

      // Clear error
      act(() => {
        result.current.clearFieldError('name');
      });

      expect(result.current.fieldErrors.name).toBeUndefined();
    });

    it('clears step errors', () => {
      const invalidData = { ...validFormData, name: '', phone: '' };
      const { result } = renderHook(() => useFormValidation(invalidData));

      // Create step errors
      act(() => {
        result.current.validateStep(1);
      });

      expect(Object.keys(result.current.fieldErrors)).toContain('name');
      expect(Object.keys(result.current.fieldErrors)).toContain('phone');

      // Clear step errors
      act(() => {
        result.current.clearStepErrors(1);
      });

      expect(result.current.fieldErrors.name).toBeUndefined();
      expect(result.current.fieldErrors.phone).toBeUndefined();
    });

    it('clears all errors', () => {
      const { result } = renderHook(() => useFormValidation(emptyFormData));

      // Create errors
      act(() => {
        result.current.validateForm();
      });

      expect(result.current.hasErrors).toBe(true);

      // Clear all errors
      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.hasErrors).toBe(false);
      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.stepResults).toEqual({});
      expect(result.current.formResult).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    it('gets field errors', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        result.current.validateField('name', '');
      });

      const error = result.current.getFieldError('name');
      expect(error).toBe('Business name is required');

      const noError = result.current.getFieldError('address');
      expect(noError).toBeUndefined();
    });

    it('gets field warnings', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      // This would need to be implemented based on actual warning logic
      const warning = result.current.getFieldWarning('website');
      expect(warning).toBeUndefined(); // No warnings in current implementation
    });

    it('checks field validity', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      expect(result.current.isFieldValid('name')).toBe(true);

      act(() => {
        result.current.validateField('name', '');
      });

      expect(result.current.isFieldValid('name')).toBe(false);
    });

    it('checks step validity', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        result.current.validateStep(1);
      });

      expect(result.current.isStepValid(1)).toBe(true);
    });
  });

  describe('Validation Summary', () => {
    it('provides validation summary', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      const summary = result.current.validationSummary;
      expect(summary.totalErrors).toBe(0);
      expect(summary.readyToSubmit).toBe(true);
      expect(summary.completedSteps).toBeGreaterThan(0);
      expect(summary.totalSteps).toBeGreaterThan(0);
    });

    it('updates summary when validation changes', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useFormValidation(formData),
        { initialProps: { formData: validFormData } }
      );

      const initialSummary = result.current.validationSummary;
      expect(initialSummary.readyToSubmit).toBe(true);

      // Change to invalid data
      const invalidData = { ...validFormData, name: '' };
      rerender({ formData: invalidData });

      const updatedSummary = result.current.validationSummary;
      expect(updatedSummary.readyToSubmit).toBe(false);
    });
  });

  describe('Performance', () => {
    it('handles rapid validation calls efficiently', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      const startTime = Date.now();

      act(() => {
        // Perform many validations
        for (let i = 0; i < 100; i++) {
          result.current.validateField('name', `Name ${i}`);
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete quickly
      expect(duration).toBeLessThan(100);
    });

    it('debounces validation properly', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useFormValidation(formData, { 
          enableRealTimeValidation: true,
          debounceMs: 100 
        }),
        { initialProps: { formData: validFormData } }
      );

      // Make rapid changes
      for (let i = 0; i < 10; i++) {
        rerender({ formData: { ...validFormData, name: `Name ${i}` } });
      }

      // Should not be validating yet
      expect(result.current.isValidating).toBe(false);

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should validate after debounce
      expect(result.current.formResult).not.toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined form data', () => {
      const { result } = renderHook(() => useFormValidation(undefined as any));

      act(() => {
        const formResult = result.current.validateForm();
        expect(formResult.isValid).toBe(false);
      });
    });

    it('handles null field values', () => {
      const dataWithNulls = { ...validFormData, name: null } as any;
      const { result } = renderHook(() => useFormValidation(dataWithNulls));

      act(() => {
        const fieldResult = result.current.validateField('name', null);
        expect(fieldResult.isValid).toBe(false);
      });
    });

    it('handles validation of non-existent fields', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const fieldResult = result.current.validateField('non_existent_field', 'value');
        expect(fieldResult.isValid).toBe(true); // Should not error
      });
    });

    it('handles validation of non-existent steps', () => {
      const { result } = renderHook(() => useFormValidation(validFormData));

      act(() => {
        const stepResult = result.current.validateStep(999);
        expect(stepResult.isValid).toBe(true); // Should handle gracefully
      });
    });
  });

  describe('Cleanup', () => {
    it('cleans up debounce timers on unmount', () => {
      const { unmount } = renderHook(() => 
        useFormValidation(validFormData, { enableRealTimeValidation: true })
      );

      // Start a debounced validation
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Unmount should clean up timers
      unmount();

      // Should not throw or cause memory leaks
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });
  });

  describe('Custom Options', () => {
    it('respects custom debounce time', () => {
      const { result, rerender } = renderHook(
        ({ formData }) => useFormValidation(formData, { 
          enableRealTimeValidation: true,
          debounceMs: 1000 
        }),
        { initialProps: { formData: validFormData } }
      );

      rerender({ formData: { ...validFormData, name: 'Changed' } });

      // Should not validate before custom debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current.formResult).toBeNull();

      // Should validate after custom debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current.formResult).not.toBeNull();
    });
  });
});