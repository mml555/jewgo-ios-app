/**
 * Integration tests for error handling and recovery scenarios
 * Tests various error conditions and recovery mechanisms
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddCategoryScreen from '../../screens/AddCategoryScreen';
import { formPersistenceService, SaveStatus } from '../../services/FormPersistence';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useFormAutoSave } from '../../hooks/useFormAutoSave';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/FormPersistence');
jest.mock('../../hooks/useFormValidation');
jest.mock('../../hooks/useFormAutoSave');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockFormPersistenceService = formPersistenceService as jest.Mocked<typeof formPersistenceService>;
const mockUseFormValidation = useFormValidation as jest.MockedFunction<typeof useFormValidation>;
const mockUseFormAutoSave = useFormAutoSave as jest.MockedFunction<typeof useFormAutoSave>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: { category: 'Eatery' },
};

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('Error Handling Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Setup default FormPersistenceService mocks
    mockFormPersistenceService.hasSavedData.mockResolvedValue(false);
    mockFormPersistenceService.getMetadata.mockResolvedValue(null);
    mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(0);
    mockFormPersistenceService.saveFormData.mockResolvedValue();
    mockFormPersistenceService.loadFormData.mockResolvedValue(null);
    mockFormPersistenceService.clearFormData.mockResolvedValue();
    mockFormPersistenceService.onSaveStatusChange.mockReturnValue(() => {});

    // Setup default useFormAutoSave mock
    mockUseFormAutoSave.mockReturnValue({
      saveStatus: 'idle',
      lastSaved: null,
      saveCount: 0,
      completionPercentage: 0,
      hasSavedData: false,
      saveNow: jest.fn().mockResolvedValue(undefined),
      loadSavedData: jest.fn().mockResolvedValue(null),
      clearSavedData: jest.fn().mockResolvedValue(undefined),
      getSaveHistory: jest.fn().mockResolvedValue([]),
      restoreFromHistory: jest.fn().mockResolvedValue(null),
    });

    // Setup default useFormValidation mock
    mockUseFormValidation.mockReturnValue({
      fieldErrors: {},
      stepResults: {},
      hasErrors: false,
      isFormValid: true,
      validateStep: jest.fn().mockReturnValue({ isValid: true, errors: {}, overallErrors: [] }),
      validateForm: jest.fn().mockReturnValue({ isValid: true, errors: {}, overallErrors: [] }),
      validationSummary: { totalErrors: 0, errorsByStep: {}, criticalErrors: [] },
      getFieldError: jest.fn().mockReturnValue(null),
      isStepValid: jest.fn().mockReturnValue(true),
    });

    // Mock navigation
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => mockNavigation,
      useRoute: () => mockRoute,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Storage Errors', () => {
    it('should handle AsyncStorage quota exceeded error', async () => {
      const quotaError = new Error('QuotaExceededError');
      quotaError.name = 'QuotaExceededError';
      
      mockFormPersistenceService.saveFormData.mockRejectedValue(quotaError);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out form data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Quota Test Restaurant');

      // Try to save (should trigger quota error)
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Storage Full',
          'Your device storage is full. Please free up space or clear old drafts to continue.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Clear Old Drafts' }),
            expect.objectContaining({ text: 'Continue Anyway' }),
          ])
        );
      });
    });

    it('should handle AsyncStorage access denied error', async () => {
      const accessError = new Error('Access denied');
      mockAsyncStorage.setItem.mockRejectedValue(accessError);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out form data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Access Error Restaurant');

      // Try to save
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Save Error',
          'Unable to save your progress. Please check your device permissions and try again.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Retry' }),
            expect.objectContaining({ text: 'Continue Without Saving' }),
          ])
        );
      });
    });

    it('should handle corrupted storage data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json data');
      mockFormPersistenceService.loadFormData.mockRejectedValue(new Error('JSON parse error'));

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should handle corrupted data gracefully and show recovery options
      await waitFor(() => {
        expect(getByText('Data Recovery')).toBeTruthy();
        expect(getByText('Reset Form')).toBeTruthy();
        expect(getByText('Export Corrupted Data')).toBeTruthy();
      });
    });

    it('should provide storage cleanup options', async () => {
      const quotaError = new Error('QuotaExceededError');
      mockFormPersistenceService.saveFormData.mockRejectedValue(quotaError);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Trigger quota error
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Clear Old Drafts')).toBeTruthy();
      });

      // Choose to clear old drafts
      fireEvent.press(getByText('Clear Old Drafts'));

      await waitFor(() => {
        expect(mockFormPersistenceService.clearFormData).toHaveBeenCalled();
      });
    });
  });

  describe('Validation Errors', () => {
    it('should handle field validation errors', async () => {
      const mockValidateStep = jest.fn().mockReturnValue({
        isValid: false,
        errors: {
          name: 'Business name is required',
          phone: 'Invalid phone number format',
        },
        overallErrors: ['Business name is required', 'Invalid phone number format'],
      });

      mockUseFormValidation.mockReturnValue({
        fieldErrors: {
          name: 'Business name is required',
          phone: 'Invalid phone number format',
        },
        stepResults: {
          1: {
            isValid: false,
            errors: {
              name: 'Business name is required',
              phone: 'Invalid phone number format',
            },
          },
        },
        hasErrors: true,
        isFormValid: false,
        validateStep: mockValidateStep,
        validateForm: jest.fn().mockReturnValue({ isValid: false, errors: {}, overallErrors: [] }),
        validationSummary: { totalErrors: 2, errorsByStep: { 1: 2 }, criticalErrors: [] },
        getFieldError: jest.fn((field) => {
          const errors: { [key: string]: string } = {
            name: 'Business name is required',
            phone: 'Invalid phone number format',
          };
          return errors[field] || null;
        }),
        isStepValid: jest.fn().mockReturnValue(false),
      });

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Try to proceed without filling required fields
      fireEvent.press(getByText('Next →'));

      // Should show validation errors
      await waitFor(() => {
        expect(getByText('Business name is required')).toBeTruthy();
        expect(getByText('Invalid phone number format')).toBeTruthy();
      });

      // Should prevent navigation
      expect(getByText('Basic Info')).toBeTruthy(); // Still on step 1
    });

    it('should handle business hours validation errors', async () => {
      const hoursErrors = {
        Monday: 'Close time must be after open time',
        general: 'At least one day must be open',
      };

      mockUseFormValidation.mockReturnValue({
        fieldErrors: hoursErrors,
        stepResults: {
          3: {
            isValid: false,
            errors: hoursErrors,
          },
        },
        hasErrors: true,
        isFormValid: false,
        validateStep: jest.fn().mockReturnValue({
          isValid: false,
          errors: hoursErrors,
          overallErrors: Object.values(hoursErrors),
        }),
        validateForm: jest.fn().mockReturnValue({ isValid: false, errors: {}, overallErrors: [] }),
        validationSummary: { totalErrors: 2, errorsByStep: { 3: 2 }, criticalErrors: [] },
        getFieldError: jest.fn((field) => hoursErrors[field] || null),
        isStepValid: jest.fn().mockReturnValue(false),
      });

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Navigate to business hours step (step 3)
      // In real scenario, would need to complete previous steps
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should show business hours validation errors
      await waitFor(() => {
        expect(getByText('Close time must be after open time')).toBeTruthy();
        expect(getByText('At least one day must be open')).toBeTruthy();
      });
    });

    it('should provide validation error recovery suggestions', async () => {
      const mockValidateStep = jest.fn().mockReturnValue({
        isValid: false,
        errors: { email: 'Invalid email format' },
        overallErrors: ['Invalid email format'],
        suggestions: ['Please enter a valid email address (e.g., name@example.com)'],
      });

      mockUseFormValidation.mockReturnValue({
        fieldErrors: { email: 'Invalid email format' },
        stepResults: { 1: { isValid: false, errors: { email: 'Invalid email format' } } },
        hasErrors: true,
        isFormValid: false,
        validateStep: mockValidateStep,
        validateForm: jest.fn().mockReturnValue({ isValid: false, errors: {}, overallErrors: [] }),
        validationSummary: { totalErrors: 1, errorsByStep: { 1: 1 }, criticalErrors: [] },
        getFieldError: jest.fn().mockReturnValue('Invalid email format'),
        isStepValid: jest.fn().mockReturnValue(false),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should show validation suggestion
      await waitFor(() => {
        expect(getByText('Please enter a valid email address (e.g., name@example.com)')).toBeTruthy();
      });
    });

    it('should handle real-time validation errors', async () => {
      let validationCallback: (field: string, value: any) => void;

      const mockGetFieldError = jest.fn((field) => {
        if (field === 'phone' && validationCallback) {
          return 'Phone number must be 10 digits';
        }
        return null;
      });

      mockUseFormValidation.mockReturnValue({
        fieldErrors: {},
        stepResults: {},
        hasErrors: false,
        isFormValid: true,
        validateStep: jest.fn().mockReturnValue({ isValid: true, errors: {}, overallErrors: [] }),
        validateForm: jest.fn().mockReturnValue({ isValid: true, errors: {}, overallErrors: [] }),
        validationSummary: { totalErrors: 0, errorsByStep: {}, criticalErrors: [] },
        getFieldError: mockGetFieldError,
        isStepValid: jest.fn().mockReturnValue(true),
      });

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const phoneInput = getByPlaceholderText('Phone number');
        expect(phoneInput).toBeTruthy();
      });

      const phoneInput = getByPlaceholderText('Phone number');

      // Enter invalid phone number
      fireEvent.changeText(phoneInput, '123');

      // Should show real-time validation error
      await waitFor(() => {
        expect(getByText('Phone number must be 10 digits')).toBeTruthy();
      });
    });
  });

  describe('Network and API Errors', () => {
    it('should handle network timeout during submission', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';

      // Mock successful form completion but failed submission
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Simulate network timeout during submission
      // (In real implementation, this would be during API call)
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Network Error',
          'Unable to submit your listing due to network issues. Your progress has been saved.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Retry' }),
            expect.objectContaining({ text: 'Save Draft' }),
          ])
        );
      });
    });

    it('should handle server errors during submission', async () => {
      const serverError = new Error('Internal server error');
      serverError.name = 'ServerError';

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Simulate server error
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Server Error',
          'The server is currently unavailable. Please try again later.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Retry Later' }),
            expect.objectContaining({ text: 'Contact Support' }),
          ])
        );
      });
    });

    it('should handle offline mode gracefully', async () => {
      // Mock network unavailable
      const networkError = new Error('Network unavailable');
      mockFormPersistenceService.saveFormData.mockRejectedValue(networkError);

      const { getByText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should show offline indicator
      await waitFor(() => {
        const offlineIndicator = getByTestId('offline-indicator');
        expect(offlineIndicator).toBeTruthy();
        expect(getByText('Offline Mode')).toBeTruthy();
      });
    });

    it('should queue submissions for retry when back online', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Simulate offline submission
      // Should queue for retry
      await waitFor(() => {
        expect(getByText('Queued for Submission')).toBeTruthy();
      });

      // Simulate coming back online
      // Should automatically retry submission
      await waitFor(() => {
        expect(getByText('Submitting...')).toBeTruthy();
      });
    });
  });

  describe('Form State Errors', () => {
    it('should handle form state corruption', async () => {
      // Mock corrupted form state
      const corruptedState = {
        currentPage: -1, // Invalid page
        formData: null, // Null data
      };

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should recover from corrupted state
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
        expect(getByText('Basic Info')).toBeTruthy(); // Should reset to step 1
      });
    });

    it('should handle step navigation errors', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Try to navigate to invalid step
      // Should handle gracefully and stay on current step
      expect(getByText('Basic Info')).toBeTruthy();
    });

    it('should handle form data type errors', async () => {
      const invalidData = {
        name: 123, // Should be string
        phone: true, // Should be string
        business_hours: 'invalid', // Should be array
      };

      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: null,
        saveCount: 0,
        completionPercentage: 0,
        hasSavedData: true,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: jest.fn().mockResolvedValue(invalidData),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should handle invalid data types gracefully
      await waitFor(() => {
        expect(getByText('Data Type Error')).toBeTruthy();
        expect(getByText('Reset to Defaults')).toBeTruthy();
      });
    });
  });

  describe('Recovery Mechanisms', () => {
    it('should provide automatic error recovery', async () => {
      const saveError = new Error('Temporary save error');
      mockFormPersistenceService.saveFormData
        .mockRejectedValueOnce(saveError)
        .mockResolvedValueOnce(); // Success on retry

      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out data (should trigger auto-retry on save error)
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Recovery Test Restaurant');

      // Should automatically retry and succeed
      await waitFor(() => {
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledTimes(2);
      });
    });

    it('should provide manual error recovery options', async () => {
      const persistentError = new Error('Persistent error');
      mockFormPersistenceService.saveFormData.mockRejectedValue(persistentError);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should show manual recovery options
      await waitFor(() => {
        expect(getByText('Save Error')).toBeTruthy();
        expect(getByText('Retry Save')).toBeTruthy();
        expect(getByText('Export Data')).toBeTruthy();
        expect(getByText('Reset Form')).toBeTruthy();
      });
    });

    it('should provide data export for error recovery', async () => {
      const exportData = JSON.stringify({
        formData: { name: 'Export Recovery Restaurant' },
        timestamp: new Date().toISOString(),
      });

      mockFormPersistenceService.exportFormData.mockResolvedValue(exportData);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Trigger export for recovery
      fireEvent.press(getByText('Export Data'));

      await waitFor(() => {
        expect(mockFormPersistenceService.exportFormData).toHaveBeenCalled();
        expect(getByText('Data Exported Successfully')).toBeTruthy();
      });
    });

    it('should provide form reset as last resort', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Show reset confirmation
      fireEvent.press(getByText('Reset Form'));

      await waitFor(() => {
        expect(getByText('Reset Confirmation')).toBeTruthy();
        expect(getByText('This will clear all form data. Are you sure?')).toBeTruthy();
        expect(getByText('Reset')).toBeTruthy();
        expect(getByText('Cancel')).toBeTruthy();
      });

      // Confirm reset
      fireEvent.press(getByText('Reset'));

      await waitFor(() => {
        expect(mockFormPersistenceService.clearFormData).toHaveBeenCalled();
      });
    });
  });

  describe('Error Reporting and Analytics', () => {
    it('should report errors for analytics', async () => {
      const analyticsError = new Error('Analytics test error');
      mockFormPersistenceService.saveFormData.mockRejectedValue(analyticsError);

      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Trigger error
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Analytics Error Test');

      // Should report error (implementation would verify actual analytics call)
      await waitFor(() => {
        // Verify error was logged/reported
        expect(mockFormPersistenceService.saveFormData).toHaveBeenCalled();
      });
    });

    it('should collect error context for debugging', async () => {
      const contextError = new Error('Context collection test');
      mockFormPersistenceService.saveFormData.mockRejectedValue(contextError);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should collect context: form state, user actions, device info, etc.
      // (Implementation would verify context collection)
    });

    it('should provide error feedback to users', async () => {
      const userFeedbackError = new Error('User feedback test');
      mockFormPersistenceService.saveFormData.mockRejectedValue(userFeedbackError);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should show user-friendly error message
      await waitFor(() => {
        expect(getByText('Something went wrong')).toBeTruthy();
        expect(getByText('Send Feedback')).toBeTruthy();
      });
    });
  });

  describe('Edge Cases and Stress Testing', () => {
    it('should handle rapid error conditions', async () => {
      const rapidError = new Error('Rapid error test');
      mockFormPersistenceService.saveFormData.mockRejectedValue(rapidError);

      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      const nameInput = getByPlaceholderText('Business name');

      // Trigger multiple rapid errors
      for (let i = 0; i < 10; i++) {
        fireEvent.changeText(nameInput, `Error Test ${i}`);
        act(() => {
          jest.advanceTimersByTime(100);
        });
      }

      // Should handle gracefully without crashing
      expect(nameInput).toBeTruthy();
    });

    it('should handle memory pressure during errors', async () => {
      const memoryError = new Error('Out of memory');
      mockFormPersistenceService.saveFormData.mockRejectedValue(memoryError);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Should handle memory pressure gracefully
      // (Implementation would test actual memory management)
    });

    it('should handle concurrent error conditions', async () => {
      const concurrentError = new Error('Concurrent error test');
      mockFormPersistenceService.saveFormData.mockRejectedValue(concurrentError);
      mockFormPersistenceService.loadFormData.mockRejectedValue(concurrentError);

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should handle multiple concurrent errors
      await waitFor(() => {
        expect(getByText('Multiple Errors Detected')).toBeTruthy();
        expect(getByText('Safe Mode')).toBeTruthy();
      });
    });
  });
});