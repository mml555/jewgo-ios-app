import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  FormValidationEngine, 
  StepValidationResult, 
  FieldValidationResult,
  FormValidationResult,
  defaultValidationEngine 
} from '../services/FormValidation';
import { ListingFormData } from '../screens/AddCategoryScreen';

interface UseFormValidationOptions {
  enableRealTimeValidation?: boolean;
  validateOnMount?: boolean;
  debounceMs?: number;
}

interface UseFormValidationReturn {
  // Validation results
  fieldErrors: { [fieldName: string]: string };
  fieldWarnings: { [fieldName: string]: string };
  stepResults: { [stepNumber: number]: StepValidationResult };
  formResult: FormValidationResult | null;
  
  // Validation state
  isValidating: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  isFormValid: boolean;
  
  // Validation functions
  validateField: (fieldName: string, value: any, trigger?: 'onChange' | 'onBlur' | 'onSubmit') => FieldValidationResult;
  validateStep: (stepNumber: number) => StepValidationResult;
  validateForm: () => FormValidationResult;
  clearFieldError: (fieldName: string) => void;
  clearStepErrors: (stepNumber: number) => void;
  clearAllErrors: () => void;
  
  // Validation status helpers
  getFieldError: (fieldName: string) => string | undefined;
  getFieldWarning: (fieldName: string) => string | undefined;
  isFieldValid: (fieldName: string) => boolean;
  isStepValid: (stepNumber: number) => boolean;
  getStepCompletionPercentage: (stepNumber: number) => number;
  getFormCompletionPercentage: () => number;
  
  // Validation summary
  validationSummary: {
    totalErrors: number;
    totalWarnings: number;
    completedSteps: number;
    totalSteps: number;
    nextRequiredField?: string;
    readyToSubmit: boolean;
  };
}

export const useFormValidation = (
  formData: ListingFormData,
  options: UseFormValidationOptions = {}
): UseFormValidationReturn => {
  const {
    enableRealTimeValidation = true,
    validateOnMount = false,
    debounceMs = 300,
  } = options;

  // State
  const [fieldErrors, setFieldErrors] = useState<{ [fieldName: string]: string }>({});
  const [fieldWarnings, setFieldWarnings] = useState<{ [fieldName: string]: string }>({});
  const [stepResults, setStepResults] = useState<{ [stepNumber: number]: StepValidationResult }>({});
  const [formResult, setFormResult] = useState<FormValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Validation engine
  const validationEngine = useMemo(() => defaultValidationEngine, []);

  // Derived state
  const hasErrors = useMemo(() => Object.keys(fieldErrors).length > 0, [fieldErrors]);
  const hasWarnings = useMemo(() => Object.keys(fieldWarnings).length > 0, [fieldWarnings]);
  const isFormValid = useMemo(() => formResult?.isValid || false, [formResult]);

  // Validation summary
  const validationSummary = useMemo(() => {
    return validationEngine.getValidationSummary(formData);
  }, [formData, validationEngine]);

  // Debounced validation function
  const debouncedValidation = useCallback((callback: () => void) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setIsValidating(true);
      callback();
      setIsValidating(false);
    }, debounceMs);
  }, [debounceMs]);

  // Validate a single field
  const validateField = useCallback((
    fieldName: string, 
    value: any, 
    trigger: 'onChange' | 'onBlur' | 'onSubmit' = 'onBlur'
  ): FieldValidationResult => {
    const result = validationEngine.validateField(fieldName, value, formData, trigger);
    
    // Update field errors and warnings
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (result.error) {
        updated[fieldName] = result.error;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });

    setFieldWarnings(prev => {
      const updated = { ...prev };
      if (result.warning) {
        updated[fieldName] = result.warning;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });

    return result;
  }, [formData, validationEngine]);

  // Validate a step
  const validateStep = useCallback((stepNumber: number): StepValidationResult => {
    const result = validationEngine.validateStep(stepNumber, formData);
    
    // Update step results
    setStepResults(prev => ({
      ...prev,
      [stepNumber]: result,
    }));

    // Update field errors from step validation
    setFieldErrors(prev => {
      const updated = { ...prev };
      
      // Clear existing errors for this step
      Object.keys(updated).forEach(fieldName => {
        const fieldRule = validationEngine['rules'].find(rule => rule.field === fieldName);
        if (fieldRule?.step === stepNumber) {
          delete updated[fieldName];
        }
      });
      
      // Add new errors
      Object.assign(updated, result.errors);
      
      return updated;
    });

    // Update field warnings from step validation
    setFieldWarnings(prev => {
      const updated = { ...prev };
      
      // Clear existing warnings for this step
      Object.keys(updated).forEach(fieldName => {
        const fieldRule = validationEngine['rules'].find(rule => rule.field === fieldName);
        if (fieldRule?.step === stepNumber) {
          delete updated[fieldName];
        }
      });
      
      // Add new warnings
      Object.assign(updated, result.warnings);
      
      return updated;
    });

    return result;
  }, [formData, validationEngine]);

  // Validate entire form
  const validateForm = useCallback((): FormValidationResult => {
    const result = validationEngine.validateForm(formData);
    
    setFormResult(result);
    setStepResults(result.stepResults);
    
    // Update field errors from form validation
    const allErrors: { [fieldName: string]: string } = {};
    Object.values(result.stepResults).forEach(stepResult => {
      Object.assign(allErrors, stepResult.errors);
    });
    setFieldErrors(allErrors);
    
    // Update field warnings from form validation
    const allWarnings: { [fieldName: string]: string } = {};
    Object.values(result.stepResults).forEach(stepResult => {
      Object.assign(allWarnings, stepResult.warnings);
    });
    setFieldWarnings(allWarnings);

    return result;
  }, [formData, validationEngine]);

  // Clear field error
  const clearFieldError = useCallback((fieldName: string) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
  }, []);

  // Clear step errors
  const clearStepErrors = useCallback((stepNumber: number) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      
      // Find all fields for this step and clear their errors
      validationEngine['rules']
        .filter(rule => rule.step === stepNumber)
        .forEach(rule => {
          delete updated[rule.field];
        });
      
      return updated;
    });

    setStepResults(prev => {
      const updated = { ...prev };
      if (updated[stepNumber]) {
        updated[stepNumber] = {
          ...updated[stepNumber],
          errors: {},
        };
      }
      return updated;
    });
  }, [validationEngine]);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setFieldWarnings({});
    setStepResults({});
    setFormResult(null);
  }, []);

  // Helper functions
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return fieldErrors[fieldName];
  }, [fieldErrors]);

  const getFieldWarning = useCallback((fieldName: string): string | undefined => {
    return fieldWarnings[fieldName];
  }, [fieldWarnings]);

  const isFieldValid = useCallback((fieldName: string): boolean => {
    return !fieldErrors[fieldName];
  }, [fieldErrors]);

  const isStepValid = useCallback((stepNumber: number): boolean => {
    return stepResults[stepNumber]?.isValid || false;
  }, [stepResults]);

  const getStepCompletionPercentage = useCallback((stepNumber: number): number => {
    return stepResults[stepNumber]?.completionPercentage || 0;
  }, [stepResults]);

  const getFormCompletionPercentage = useCallback((): number => {
    return formResult?.completionPercentage || 0;
  }, [formResult]);

  // Real-time validation effect
  useEffect(() => {
    if (enableRealTimeValidation) {
      debouncedValidation(() => {
        const result = validationEngine.validateForm(formData);
        setFormResult(result);
        setStepResults(result.stepResults);
        
        // Update field errors from form validation
        const allErrors: { [fieldName: string]: string } = {};
        Object.values(result.stepResults).forEach(stepResult => {
          Object.assign(allErrors, stepResult.errors);
        });
        setFieldErrors(allErrors);
        
        // Update field warnings from form validation
        const allWarnings: { [fieldName: string]: string } = {};
        Object.values(result.stepResults).forEach(stepResult => {
          Object.assign(allWarnings, stepResult.warnings);
        });
        setFieldWarnings(allWarnings);
      });
    }
  }, [formData, enableRealTimeValidation, debouncedValidation, validationEngine]);

  // Validate on mount if requested
  useEffect(() => {
    if (validateOnMount) {
      validateForm();
    }
  }, [validateOnMount, validateForm]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // Validation results
    fieldErrors,
    fieldWarnings,
    stepResults,
    formResult,
    
    // Validation state
    isValidating,
    hasErrors,
    hasWarnings,
    isFormValid,
    
    // Validation functions
    validateField,
    validateStep,
    validateForm,
    clearFieldError,
    clearStepErrors,
    clearAllErrors,
    
    // Validation status helpers
    getFieldError,
    getFieldWarning,
    isFieldValid,
    isStepValid,
    getStepCompletionPercentage,
    getFormCompletionPercentage,
    
    // Validation summary
    validationSummary,
  };
};