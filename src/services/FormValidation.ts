import { ListingFormData } from '../screens/AddCategoryScreen';
import { validateBusinessHours } from '../utils/businessHoursValidation';

// Validation result interfaces
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
}

export interface StepValidationResult {
  isValid: boolean;
  errors: { [fieldName: string]: string };
  warnings: { [fieldName: string]: string };
  suggestions: string[];
  completionPercentage: number;
}

export interface FormValidationResult {
  isValid: boolean;
  stepResults: { [stepNumber: number]: StepValidationResult };
  overallErrors: string[];
  overallWarnings: string[];
  completionPercentage: number;
}

// Validation rule interface
export interface ValidationRule {
  field: string;
  validator: (value: any, formData: ListingFormData) => FieldValidationResult;
  trigger: 'onChange' | 'onBlur' | 'onSubmit';
  required?: boolean;
  step: number;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (US format)
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;

// URL validation regex
const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Validation rules for each step
export const validationRules: ValidationRule[] = [
  // Step 1: Basic Info
  {
    field: 'name',
    step: 1,
    required: true,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: false, error: 'Business name is required' };
      }
      if (value.trim().length < 2) {
        return {
          isValid: false,
          error: 'Business name must be at least 2 characters',
        };
      }
      if (value.trim().length > 100) {
        return {
          isValid: false,
          error: 'Business name must be less than 100 characters',
        };
      }
      return { isValid: true };
    },
  },
  {
    field: 'address',
    step: 1,
    required: true,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: false, error: 'Business address is required' };
      }
      if (value.trim().length < 10) {
        return { isValid: false, error: 'Please enter a complete address' };
      }
      return { isValid: true };
    },
  },
  {
    field: 'phone',
    step: 1,
    required: true,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: false, error: 'Phone number is required' };
      }
      const cleanPhone = value.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      if (cleanPhone.length > 15) {
        return { isValid: false, error: 'Phone number is too long' };
      }
      return { isValid: true };
    },
  },
  {
    field: 'business_email',
    step: 1,
    required: true,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: false, error: 'Business email is required' };
      }
      if (!EMAIL_REGEX.test(value.trim())) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
      return { isValid: true };
    },
  },
  {
    field: 'website',
    step: 1,
    required: false,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return {
          isValid: true,
          suggestion: 'Adding a website helps customers find you online',
        };
      }
      if (!URL_REGEX.test(value.trim())) {
        return {
          isValid: false,
          error:
            'Please enter a valid website URL (include http:// or https://)',
        };
      }
      return { isValid: true };
    },
  },
  {
    field: 'listing_type',
    step: 1,
    required: true,
    trigger: 'onChange',
    validator: (value: string) => {
      const validTypes = ['Eatery', 'Catering', 'Food Truck'];
      if (!validTypes.includes(value)) {
        return { isValid: false, error: 'Please select a valid listing type' };
      }
      return { isValid: true };
    },
  },

  // Step 2: Kosher Certification
  {
    field: 'kosher_category',
    step: 2,
    required: true,
    trigger: 'onChange',
    validator: (value: string) => {
      const validCategories = ['Meat', 'Dairy', 'Pareve'];
      if (!validCategories.includes(value)) {
        return { isValid: false, error: 'Please select a kosher category' };
      }
      return { isValid: true };
    },
  },
  {
    field: 'certifying_agency',
    step: 2,
    required: true,
    trigger: 'onBlur',
    validator: (value: string, formData: ListingFormData) => {
      if (!value?.trim() && !formData.custom_certifying_agency?.trim()) {
        return {
          isValid: false,
          error: 'Please select or enter a certifying agency',
        };
      }
      return { isValid: true };
    },
  },

  // Step 3: Business Details
  {
    field: 'short_description',
    step: 3,
    required: true,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: false, error: 'Short description is required' };
      }
      if (value.trim().length < 10) {
        return {
          isValid: false,
          error: 'Short description must be at least 10 characters',
        };
      }
      if (value.trim().length > 80) {
        return {
          isValid: false,
          error: 'Short description must be 80 characters or less',
        };
      }
      return { isValid: true };
    },
  },
  {
    field: 'description',
    step: 3,
    required: false,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return {
          isValid: true,
          suggestion:
            'A detailed description helps customers understand your business better',
        };
      }
      if (value.trim().length > 2000) {
        return {
          isValid: false,
          error: 'Description must be 2000 characters or less',
        };
      }
      return { isValid: true };
    },
  },
  {
    field: 'business_hours',
    step: 3,
    required: true,
    trigger: 'onChange',
    validator: (value: any[], formData: ListingFormData) => {
      if (!value || !Array.isArray(value)) {
        return { isValid: false, error: 'Business hours are required' };
      }

      const hasOpenDay = value.some(
        day => !day.isClosed && day.openTime && day.closeTime,
      );
      if (!hasOpenDay) {
        return {
          isValid: false,
          error: 'At least one day must have operating hours',
        };
      }

      // Check for time conflicts
      for (const day of value) {
        if (!day.isClosed && day.openTime && day.closeTime) {
          const openTime = new Date(`2000-01-01 ${day.openTime}`);
          const closeTime = new Date(`2000-01-01 ${day.closeTime}`);

          if (closeTime <= openTime) {
            return {
              isValid: false,
              error: `${day.day}: Closing time must be after opening time`,
            };
          }
        }
      }

      return { isValid: true };
    },
  },
  {
    field: 'seating_capacity',
    step: 3,
    required: false,
    trigger: 'onBlur',
    validator: (value: number) => {
      if (value && (value < 0 || value > 1000)) {
        return {
          isValid: false,
          error: 'Seating capacity must be between 0 and 1000',
        };
      }
      return { isValid: true };
    },
  },
  {
    field: 'years_in_business',
    step: 3,
    required: false,
    trigger: 'onBlur',
    validator: (value: number) => {
      if (value && (value < 0 || value > 100)) {
        return {
          isValid: false,
          error: 'Years in business must be between 0 and 100',
        };
      }
      return { isValid: true };
    },
  },

  // Social Media Links Validation
  {
    field: 'instagram_link',
    step: 3,
    required: false,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: true };
      }
      if (!value.includes('instagram.com')) {
        return { isValid: false, error: 'Please enter a valid Instagram URL' };
      }
      return { isValid: true };
    },
  },
  {
    field: 'facebook_link',
    step: 3,
    required: false,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: true };
      }
      if (!value.includes('facebook.com')) {
        return { isValid: false, error: 'Please enter a valid Facebook URL' };
      }
      return { isValid: true };
    },
  },
  {
    field: 'tiktok_link',
    step: 3,
    required: false,
    trigger: 'onBlur',
    validator: (value: string) => {
      if (!value?.trim()) {
        return { isValid: true };
      }
      if (!value.includes('tiktok.com')) {
        return { isValid: false, error: 'Please enter a valid TikTok URL' };
      }
      return { isValid: true };
    },
  },

  // Step 4: Images
  {
    field: 'business_images',
    step: 4,
    required: false,
    trigger: 'onChange',
    validator: (value: string[]) => {
      if (!value || value.length === 0) {
        return {
          isValid: true,
          suggestion:
            'Adding photos helps customers see your business and increases engagement',
        };
      }
      if (value.length > 10) {
        return { isValid: false, error: 'Maximum 10 images allowed' };
      }
      return { isValid: true };
    },
  },
];

// Form validation engine
export class FormValidationEngine {
  private rules: ValidationRule[];

  constructor(customRules?: ValidationRule[]) {
    this.rules = customRules || validationRules;
  }

  // Validate a single field
  validateField(
    fieldName: string,
    value: any,
    formData: ListingFormData,
    trigger: 'onChange' | 'onBlur' | 'onSubmit' = 'onBlur',
  ): FieldValidationResult {
    const rule = this.rules.find(r => r.field === fieldName);
    if (!rule) {
      return { isValid: true };
    }

    // Only validate if trigger matches
    if (rule.trigger !== trigger && trigger !== 'onSubmit') {
      return { isValid: true };
    }

    return rule.validator(value, formData);
  }

  // Validate a specific step
  validateStep(
    stepNumber: number,
    formData: ListingFormData,
  ): StepValidationResult {
    const stepRules = this.rules.filter(rule => rule.step === stepNumber);
    const errors: { [fieldName: string]: string } = {};
    const warnings: { [fieldName: string]: string } = {};
    const suggestions: string[] = [];

    let validFields = 0;
    let totalFields = stepRules.length;
    let requiredFields = 0;
    let validRequiredFields = 0;

    for (const rule of stepRules) {
      const fieldValue = formData[rule.field as keyof ListingFormData];
      const result = rule.validator(fieldValue, formData);

      if (rule.required) {
        requiredFields++;
        if (result.isValid) {
          validRequiredFields++;
        }
      }

      if (result.isValid) {
        validFields++;
      } else if (result.error) {
        errors[rule.field] = result.error;
      }

      if (result.warning) {
        warnings[rule.field] = result.warning;
      }

      if (result.suggestion && !suggestions.includes(result.suggestion)) {
        suggestions.push(result.suggestion);
      }
    }

    // Calculate completion percentage for this step
    const completionPercentage =
      totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 100;

    // Step is valid if all required fields are valid and no errors
    const isValid =
      Object.keys(errors).length === 0 &&
      validRequiredFields === requiredFields;

    return {
      isValid,
      errors,
      warnings,
      suggestions,
      completionPercentage,
    };
  }

  // Validate entire form
  validateForm(formData: ListingFormData): FormValidationResult {
    const stepResults: { [stepNumber: number]: StepValidationResult } = {};
    const overallErrors: string[] = [];
    const overallWarnings: string[] = [];

    let totalValidSteps = 0;
    const totalSteps = Math.max(...this.rules.map(rule => rule.step));

    // Validate each step
    for (let step = 1; step <= totalSteps; step++) {
      const stepResult = this.validateStep(step, formData);
      stepResults[step] = stepResult;

      if (stepResult.isValid) {
        totalValidSteps++;
      }

      // Collect step errors as overall errors
      Object.values(stepResult.errors).forEach(error => {
        if (!overallErrors.includes(error)) {
          overallErrors.push(error);
        }
      });

      // Collect step warnings as overall warnings
      Object.values(stepResult.warnings).forEach(warning => {
        if (!overallWarnings.includes(warning)) {
          overallWarnings.push(warning);
        }
      });
    }

    // Calculate overall completion percentage
    const completionPercentage = Math.round(
      (totalValidSteps / totalSteps) * 100,
    );

    // Form is valid if all steps are valid
    const isValid = totalValidSteps === totalSteps;

    return {
      isValid,
      stepResults,
      overallErrors,
      overallWarnings,
      completionPercentage,
    };
  }

  // Get validation summary for display
  getValidationSummary(formData: ListingFormData): {
    totalErrors: number;
    totalWarnings: number;
    completedSteps: number;
    totalSteps: number;
    nextRequiredField?: string;
    readyToSubmit: boolean;
  } {
    const formResult = this.validateForm(formData);
    const totalSteps = Object.keys(formResult.stepResults).length;
    const completedSteps = Object.values(formResult.stepResults).filter(
      step => step.isValid,
    ).length;

    // Find next required field that has an error
    let nextRequiredField: string | undefined;
    for (let step = 1; step <= totalSteps; step++) {
      const stepResult = formResult.stepResults[step];
      if (stepResult && Object.keys(stepResult.errors).length > 0) {
        const requiredRule = this.rules.find(
          rule =>
            rule.step === step &&
            rule.required &&
            stepResult.errors[rule.field],
        );
        if (requiredRule) {
          nextRequiredField = requiredRule.field;
          break;
        }
      }
    }

    return {
      totalErrors: formResult.overallErrors.length,
      totalWarnings: formResult.overallWarnings.length,
      completedSteps,
      totalSteps,
      nextRequiredField,
      readyToSubmit: formResult.isValid,
    };
  }

  // Get step completion status
  getStepCompletionStatus(
    stepNumber: number,
    formData: ListingFormData,
  ): {
    isComplete: boolean;
    hasErrors: boolean;
    hasWarnings: boolean;
    completionPercentage: number;
    requiredFieldsCompleted: number;
    totalRequiredFields: number;
  } {
    const stepResult = this.validateStep(stepNumber, formData);
    const stepRules = this.rules.filter(rule => rule.step === stepNumber);
    const requiredRules = stepRules.filter(rule => rule.required);

    let requiredFieldsCompleted = 0;
    for (const rule of requiredRules) {
      const fieldValue = formData[rule.field as keyof ListingFormData];
      const result = rule.validator(fieldValue, formData);
      if (result.isValid) {
        requiredFieldsCompleted++;
      }
    }

    return {
      isComplete: stepResult.isValid,
      hasErrors: Object.keys(stepResult.errors).length > 0,
      hasWarnings: Object.keys(stepResult.warnings).length > 0,
      completionPercentage: stepResult.completionPercentage,
      requiredFieldsCompleted,
      totalRequiredFields: requiredRules.length,
    };
  }

  // Real-time validation for field changes
  validateFieldChange(
    fieldName: string,
    newValue: any,
    formData: ListingFormData,
    trigger: 'onChange' | 'onBlur' = 'onChange',
  ): {
    fieldResult: FieldValidationResult;
    stepResult: StepValidationResult;
    affectedSteps: number[];
  } {
    // Create updated form data
    const updatedFormData = {
      ...formData,
      [fieldName]: newValue,
    };

    // Validate the specific field
    const fieldResult = this.validateField(
      fieldName,
      newValue,
      updatedFormData,
      trigger,
    );

    // Find which step this field belongs to
    const rule = this.rules.find(r => r.field === fieldName);
    const stepNumber = rule?.step || 1;

    // Validate the affected step
    const stepResult = this.validateStep(stepNumber, updatedFormData);

    // Check if this change affects other steps (for cross-step validation)
    const affectedSteps = [stepNumber];

    return {
      fieldResult,
      stepResult,
      affectedSteps,
    };
  }
}

// Default validation engine instance
export const defaultValidationEngine = new FormValidationEngine();

// Convenience functions
export const validateFormField = (
  fieldName: string,
  value: any,
  formData: ListingFormData,
  trigger: 'onChange' | 'onBlur' | 'onSubmit' = 'onBlur',
): FieldValidationResult => {
  return defaultValidationEngine.validateField(
    fieldName,
    value,
    formData,
    trigger,
  );
};

export const validateFormStep = (
  stepNumber: number,
  formData: ListingFormData,
): StepValidationResult => {
  return defaultValidationEngine.validateStep(stepNumber, formData);
};

export const validateEntireForm = (
  formData: ListingFormData,
): FormValidationResult => {
  return defaultValidationEngine.validateForm(formData);
};

export const getFormValidationSummary = (formData: ListingFormData) => {
  return defaultValidationEngine.getValidationSummary(formData);
};

export const getStepCompletionStatus = (
  stepNumber: number,
  formData: ListingFormData,
) => {
  return defaultValidationEngine.getStepCompletionStatus(stepNumber, formData);
};
