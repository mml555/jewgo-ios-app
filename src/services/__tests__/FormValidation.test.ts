import {
  FormValidationEngine,
  defaultValidationEngine,
  validateFormField,
  validateFormStep,
  validateEntireForm,
  getFormValidationSummary,
  getStepCompletionStatus,
  validationRules,
} from '../FormValidation';
import { ListingFormData } from '../../screens/AddCategoryScreen';

describe('FormValidation', () => {
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

  describe('FormValidationEngine', () => {
    let engine: FormValidationEngine;

    beforeEach(() => {
      engine = new FormValidationEngine();
    });

    describe('Field Validation', () => {
      it('validates required fields correctly', () => {
        const result = engine.validateField('name', '', validFormData, 'onBlur');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Business name is required');
      });

      it('validates field length constraints', () => {
        const result = engine.validateField('name', 'A', validFormData, 'onBlur');
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Business name must be at least 2 characters');
      });

      it('validates email format', () => {
        const invalidEmail = engine.validateField('business_email', 'invalid-email', validFormData, 'onBlur');
        expect(invalidEmail.isValid).toBe(false);
        expect(invalidEmail.error).toBe('Please enter a valid email address');

        const validEmail = engine.validateField('business_email', 'test@example.com', validFormData, 'onBlur');
        expect(validEmail.isValid).toBe(true);
      });

      it('validates phone number format', () => {
        const shortPhone = engine.validateField('phone', '123', validFormData, 'onBlur');
        expect(shortPhone.isValid).toBe(false);
        expect(shortPhone.error).toBe('Please enter a valid phone number');

        const validPhone = engine.validateField('phone', '1234567890', validFormData, 'onBlur');
        expect(validPhone.isValid).toBe(true);
      });

      it('validates URL format', () => {
        const invalidUrl = engine.validateField('website', 'not-a-url', validFormData, 'onBlur');
        expect(invalidUrl.isValid).toBe(false);
        expect(invalidUrl.error).toBe('Please enter a valid website URL (include http:// or https://)');

        const validUrl = engine.validateField('website', 'https://example.com', validFormData, 'onBlur');
        expect(validUrl.isValid).toBe(true);
      });

      it('validates business hours', () => {
        const invalidHours = [
          { day: 'Monday', openTime: '17:00', closeTime: '09:00', isClosed: false }, // Invalid range
        ];
        
        const result = engine.validateField('business_hours', invalidHours, validFormData, 'onChange');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Closing time must be after opening time');
      });

      it('validates numeric fields', () => {
        const invalidCapacity = engine.validateField('seating_capacity', -5, validFormData, 'onBlur');
        expect(invalidCapacity.isValid).toBe(false);
        expect(invalidCapacity.error).toBe('Seating capacity must be between 0 and 1000');

        const validCapacity = engine.validateField('seating_capacity', 50, validFormData, 'onBlur');
        expect(validCapacity.isValid).toBe(true);
      });

      it('validates social media links', () => {
        const invalidInstagram = engine.validateField('instagram_link', 'https://twitter.com/test', validFormData, 'onBlur');
        expect(invalidInstagram.isValid).toBe(false);
        expect(invalidInstagram.error).toBe('Please enter a valid Instagram URL');

        const validInstagram = engine.validateField('instagram_link', 'https://instagram.com/test', validFormData, 'onBlur');
        expect(validInstagram.isValid).toBe(true);
      });

      it('handles optional fields correctly', () => {
        const emptyOptional = engine.validateField('website', '', validFormData, 'onBlur');
        expect(emptyOptional.isValid).toBe(true);
        expect(emptyOptional.suggestion).toContain('Adding a website helps customers');
      });

      it('respects validation triggers', () => {
        // Should not validate onChange trigger when called with onBlur
        const result = engine.validateField('listing_type', '', validFormData, 'onBlur');
        expect(result.isValid).toBe(true); // No validation performed
      });
    });

    describe('Step Validation', () => {
      it('validates step 1 (Basic Info) correctly', () => {
        const result = engine.validateStep(1, validFormData);
        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
        expect(result.completionPercentage).toBe(100);
      });

      it('identifies missing required fields in step', () => {
        const incompleteData = { ...validFormData, name: '', phone: '' };
        const result = engine.validateStep(1, incompleteData);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.name).toBe('Business name is required');
        expect(result.errors.phone).toBe('Phone number is required');
        expect(result.completionPercentage).toBeLessThan(100);
      });

      it('calculates completion percentage correctly', () => {
        const partialData = { ...validFormData, name: 'Test', address: '', phone: '', business_email: '' };
        const result = engine.validateStep(1, partialData);
        
        expect(result.completionPercentage).toBeGreaterThan(0);
        expect(result.completionPercentage).toBeLessThan(100);
      });

      it('collects warnings and suggestions', () => {
        const dataWithWarnings = { ...validFormData, website: '' };
        const result = engine.validateStep(1, dataWithWarnings);
        
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.suggestions[0]).toContain('Adding a website helps customers');
      });
    });

    describe('Form Validation', () => {
      it('validates entire form correctly', () => {
        const result = engine.validateForm(validFormData);
        expect(result.isValid).toBe(true);
        expect(result.overallErrors).toHaveLength(0);
        expect(result.completionPercentage).toBe(100);
      });

      it('identifies errors across all steps', () => {
        const invalidData = {
          ...validFormData,
          name: '', // Step 1 error
          kosher_category: '', // Step 2 error
          short_description: '', // Step 3 error
        };
        
        const result = engine.validateForm(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.overallErrors.length).toBeGreaterThan(0);
        expect(result.completionPercentage).toBeLessThan(100);
      });

      it('validates all steps individually', () => {
        const result = engine.validateForm(validFormData);
        
        // Should have results for all steps
        const stepNumbers = Object.keys(result.stepResults).map(Number);
        expect(stepNumbers.length).toBeGreaterThan(0);
        expect(Math.max(...stepNumbers)).toBeGreaterThanOrEqual(4); // At least 4 steps
      });
    });

    describe('Validation Summary', () => {
      it('provides accurate validation summary', () => {
        const summary = engine.getValidationSummary(validFormData);
        
        expect(summary.totalErrors).toBe(0);
        expect(summary.readyToSubmit).toBe(true);
        expect(summary.completedSteps).toBeGreaterThan(0);
        expect(summary.totalSteps).toBeGreaterThan(0);
      });

      it('identifies next required field', () => {
        const incompleteData = { ...validFormData, name: '', business_email: '' };
        const summary = engine.getValidationSummary(incompleteData);
        
        expect(summary.nextRequiredField).toBeDefined();
        expect(summary.readyToSubmit).toBe(false);
      });
    });

    describe('Step Completion Status', () => {
      it('provides step completion details', () => {
        const status = engine.getStepCompletionStatus(1, validFormData);
        
        expect(status.isComplete).toBe(true);
        expect(status.hasErrors).toBe(false);
        expect(status.completionPercentage).toBe(100);
        expect(status.requiredFieldsCompleted).toBe(status.totalRequiredFields);
      });

      it('tracks required field completion', () => {
        const incompleteData = { ...validFormData, name: '', phone: '' };
        const status = engine.getStepCompletionStatus(1, incompleteData);
        
        expect(status.requiredFieldsCompleted).toBeLessThan(status.totalRequiredFields);
        expect(status.isComplete).toBe(false);
      });
    });

    describe('Real-time Validation', () => {
      it('validates field changes with step impact', () => {
        const result = engine.validateFieldChange('name', 'New Name', validFormData, 'onChange');
        
        expect(result.fieldResult.isValid).toBe(true);
        expect(result.stepResult).toBeDefined();
        expect(result.affectedSteps).toContain(1);
      });

      it('handles cross-field validation', () => {
        const result = engine.validateFieldChange('certifying_agency', '', validFormData, 'onBlur');
        
        expect(result.fieldResult).toBeDefined();
        expect(result.stepResult).toBeDefined();
      });
    });
  });

  describe('Validation Rules', () => {
    it('has rules for all required fields', () => {
      const requiredFields = ['name', 'address', 'phone', 'business_email', 'listing_type', 'kosher_category'];
      
      requiredFields.forEach(field => {
        const rule = validationRules.find(r => r.field === field);
        expect(rule).toBeDefined();
        expect(rule?.required).toBe(true);
      });
    });

    it('has appropriate triggers for different field types', () => {
      const onChangeFields = ['listing_type', 'kosher_category', 'business_hours'];
      const onBlurFields = ['name', 'address', 'phone', 'business_email'];
      
      onChangeFields.forEach(field => {
        const rule = validationRules.find(r => r.field === field);
        expect(rule?.trigger).toBe('onChange');
      });
      
      onBlurFields.forEach(field => {
        const rule = validationRules.find(r => r.field === field);
        expect(rule?.trigger).toBe('onBlur');
      });
    });

    it('assigns fields to correct steps', () => {
      const step1Fields = ['name', 'address', 'phone', 'business_email', 'website', 'listing_type'];
      const step2Fields = ['kosher_category', 'certifying_agency'];
      const step3Fields = ['short_description', 'description', 'business_hours'];
      
      step1Fields.forEach(field => {
        const rule = validationRules.find(r => r.field === field);
        expect(rule?.step).toBe(1);
      });
      
      step2Fields.forEach(field => {
        const rule = validationRules.find(r => r.field === field);
        expect(rule?.step).toBe(2);
      });
      
      step3Fields.forEach(field => {
        const rule = validationRules.find(r => r.field === field);
        expect(rule?.step).toBe(3);
      });
    });
  });

  describe('Convenience Functions', () => {
    it('validateFormField works correctly', () => {
      const result = validateFormField('name', 'Test Name', validFormData);
      expect(result.isValid).toBe(true);
    });

    it('validateFormStep works correctly', () => {
      const result = validateFormStep(1, validFormData);
      expect(result.isValid).toBe(true);
    });

    it('validateEntireForm works correctly', () => {
      const result = validateEntireForm(validFormData);
      expect(result.isValid).toBe(true);
    });

    it('getFormValidationSummary works correctly', () => {
      const summary = getFormValidationSummary(validFormData);
      expect(summary.readyToSubmit).toBe(true);
    });

    it('getStepCompletionStatus works correctly', () => {
      const status = getStepCompletionStatus(1, validFormData);
      expect(status.isComplete).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty form data', () => {
      const emptyData = {} as ListingFormData;
      const result = defaultValidationEngine.validateForm(emptyData);
      
      expect(result.isValid).toBe(false);
      expect(result.overallErrors.length).toBeGreaterThan(0);
    });

    it('handles null/undefined values', () => {
      const dataWithNulls = {
        ...validFormData,
        name: null,
        address: undefined,
      } as any;
      
      const result = defaultValidationEngine.validateForm(dataWithNulls);
      expect(result.isValid).toBe(false);
    });

    it('handles malformed business hours', () => {
      const malformedHours = [
        { day: 'Monday' }, // Missing required fields
        { openTime: '09:00', closeTime: '17:00' }, // Missing day
      ] as any;
      
      const result = validateFormField('business_hours', malformedHours, validFormData);
      expect(result.isValid).toBe(false);
    });

    it('handles very long strings', () => {
      const veryLongName = 'A'.repeat(200);
      const result = validateFormField('name', veryLongName, validFormData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must be less than 100 characters');
    });

    it('handles special characters in fields', () => {
      const nameWithSpecialChars = 'Café & Restaurant';
      const result = validateFormField('name', nameWithSpecialChars, validFormData);
      
      expect(result.isValid).toBe(true);
    });

    it('handles international phone numbers', () => {
      const intlPhone = '+1234567890123';
      const result = validateFormField('phone', intlPhone, validFormData);
      
      expect(result.isValid).toBe(true);
    });

    it('handles edge case URLs', () => {
      const edgeCaseUrls = [
        'http://localhost:3000',
        'https://sub.domain.co.uk/path?query=1',
        'https://xn--example.com', // IDN domain
      ];
      
      edgeCaseUrls.forEach(url => {
        const result = validateFormField('website', url, validFormData);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Performance', () => {
    it('validates large forms efficiently', () => {
      const startTime = Date.now();
      
      // Run validation multiple times
      for (let i = 0; i < 100; i++) {
        defaultValidationEngine.validateForm(validFormData);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete 100 validations in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('handles rapid field changes efficiently', () => {
      const startTime = Date.now();
      
      // Simulate rapid typing
      const values = ['T', 'Te', 'Tes', 'Test', 'Test ', 'Test R', 'Test Re', 'Test Restaurant'];
      
      values.forEach(value => {
        defaultValidationEngine.validateField('name', value, validFormData, 'onChange');
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle rapid changes quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Custom Validation Engine', () => {
    it('accepts custom validation rules', () => {
      const customRules = [
        {
          field: 'custom_field',
          step: 1,
          required: true,
          trigger: 'onBlur' as const,
          validator: (value: any) => {
            if (!value) return { isValid: false, error: 'Custom field is required' };
            return { isValid: true };
          },
        },
      ];
      
      const customEngine = new FormValidationEngine(customRules);
      const result = customEngine.validateField('custom_field', '', validFormData);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Custom field is required');
    });

    it('maintains state correctly across validations', () => {
      const engine = new FormValidationEngine();
      
      // First validation
      const result1 = engine.validateForm(validFormData);
      expect(result1.isValid).toBe(true);
      
      // Second validation with different data
      const invalidData = { ...validFormData, name: '' };
      const result2 = engine.validateForm(invalidData);
      expect(result2.isValid).toBe(false);
      
      // Results should be independent
      expect(result1.isValid).toBe(true); // Should not be affected
    });
  });
});