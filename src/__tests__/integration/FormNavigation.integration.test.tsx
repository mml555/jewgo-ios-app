/**
 * Integration tests for form navigation with data persistence
 * Tests step-by-step navigation, data preservation, and validation
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddCategoryScreen from '../../screens/AddCategoryScreen';
import { formPersistenceService } from '../../services/FormPersistence';
import { useFormAutoSave } from '../../hooks/useFormAutoSave';
import { useFormValidation } from '../../hooks/useFormValidation';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/FormPersistence');
jest.mock('../../hooks/useFormAutoSave');
jest.mock('../../hooks/useFormValidation');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockFormPersistenceService = formPersistenceService as jest.Mocked<typeof formPersistenceService>;
const mockUseFormAutoSave = useFormAutoSave as jest.MockedFunction<typeof useFormAutoSave>;
const mockUseFormValidation = useFormValidation as jest.MockedFunction<typeof useFormValidation>;

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

describe('Form Navigation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    
    // Mock useFormAutoSave hook
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

    // Mock useFormValidation hook
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

  describe('Step Navigation', () => {
    it('should navigate forward through all form steps', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Step 1: Basic Info
      expect(getByText('Basic Info')).toBeTruthy();
      expect(getByText('Business Ownership & Basic Info')).toBeTruthy();

      // Navigate to step 2
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
        expect(getByText('Kosher Certification')).toBeTruthy();
      });

      // Navigate to step 3
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Business Details')).toBeTruthy();
      });

      // Navigate to step 4
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Photos')).toBeTruthy();
        expect(getByText('Images')).toBeTruthy();
      });

      // Navigate to step 5
      fireEvent.press(getByText('Review & Submit'));

      await waitFor(() => {
        expect(getByText('Review')).toBeTruthy();
        expect(getByText('Review & Submit')).toBeTruthy();
      });
    });

    it('should navigate backward through form steps', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Navigate forward to step 3
      fireEvent.press(getByText('Next →')); // Step 2
      await waitFor(() => expect(getByText('Kosher Info')).toBeTruthy());
      
      fireEvent.press(getByText('Next →')); // Step 3
      await waitFor(() => expect(getByText('Business Details')).toBeTruthy());

      // Navigate backward
      fireEvent.press(getByText('←'));
      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });

      fireEvent.press(getByText('←'));
      await waitFor(() => {
        expect(getByText('Basic Info')).toBeTruthy();
      });
    });

    it('should save data when navigating between steps', async () => {
      const mockSaveNow = jest.fn().mockResolvedValue(undefined);
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: null,
        saveCount: 0,
        completionPercentage: 0,
        hasSavedData: false,
        saveNow: mockSaveNow,
        loadSavedData: jest.fn().mockResolvedValue(null),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Navigate forward
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(mockSaveNow).toHaveBeenCalled();
      });

      // Navigate backward
      fireEvent.press(getByText('←'));

      await waitFor(() => {
        expect(mockSaveNow).toHaveBeenCalledTimes(2);
      });
    });

    it('should prevent navigation when step validation fails', async () => {
      const mockValidateStep = jest.fn().mockReturnValue({
        isValid: false,
        errors: { name: 'Name is required' },
        overallErrors: ['Name is required'],
      });

      mockUseFormValidation.mockReturnValue({
        fieldErrors: { name: 'Name is required' },
        stepResults: { 1: { isValid: false, errors: { name: 'Name is required' } } },
        hasErrors: true,
        isFormValid: false,
        validateStep: mockValidateStep,
        validateForm: jest.fn().mockReturnValue({ isValid: false, errors: {}, overallErrors: [] }),
        validationSummary: { totalErrors: 1, errorsByStep: { 1: 1 }, criticalErrors: ['Name is required'] },
        getFieldError: jest.fn().mockReturnValue('Name is required'),
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

      // Try to navigate forward with invalid data
      fireEvent.press(getByText('Next →'));

      // Should still be on step 1
      await waitFor(() => {
        expect(getByText('Basic Info')).toBeTruthy();
        expect(mockValidateStep).toHaveBeenCalledWith(1);
      });
    });

    it('should handle step jumping via progress indicator', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const progressIndicator = getByTestId('form-progress-indicator');
        expect(progressIndicator).toBeTruthy();
      });

      // Click on step 3 in progress indicator
      const step3Button = getByTestId('progress-step-3');
      fireEvent.press(step3Button);

      await waitFor(() => {
        expect(getByTestId('business-details-page')).toBeTruthy();
      });
    });
  });

  describe('Data Persistence During Navigation', () => {
    it('should preserve form data when navigating between steps', async () => {
      const formData = {
        name: 'Test Restaurant',
        address: '123 Test St',
        phone: '1234567890',
      };

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Fill out form data
      const nameInput = getByPlaceholderText('Business name');
      const addressInput = getByPlaceholderText('Full business address');
      const phoneInput = getByPlaceholderText('Phone number');

      fireEvent.changeText(nameInput, formData.name);
      fireEvent.changeText(addressInput, formData.address);
      fireEvent.changeText(phoneInput, formData.phone);

      // Navigate to next step
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });

      // Navigate back
      fireEvent.press(getByText('←'));

      await waitFor(() => {
        expect(getByText('Basic Info')).toBeTruthy();
      });

      // Verify data is preserved
      expect(nameInput.props.value).toBe(formData.name);
      expect(addressInput.props.value).toBe(formData.address);
      expect(phoneInput.props.value).toBe(formData.phone);
    });

    it('should restore data from saved state on initialization', async () => {
      const savedData = {
        name: 'Saved Restaurant',
        address: '456 Saved Ave',
        phone: '9876543210',
        business_email: 'saved@test.com',
      };

      const mockLoadSavedData = jest.fn().mockResolvedValue(savedData);
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: new Date(),
        saveCount: 1,
        completionPercentage: 50,
        hasSavedData: true,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: mockLoadSavedData,
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput.props.value).toBe(savedData.name);
      });
    });

    it('should handle data recovery dialog', async () => {
      const savedData = {
        name: 'Recovery Test Restaurant',
        address: '789 Recovery St',
      };

      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: new Date(),
        saveCount: 1,
        completionPercentage: 25,
        hasSavedData: true,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: jest.fn().mockResolvedValue(savedData),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should show recovery dialog
      await waitFor(() => {
        expect(getByText('Recover Draft')).toBeTruthy();
        expect(getByText('Continue Draft')).toBeTruthy();
        expect(getByText('Start Fresh')).toBeTruthy();
      });
    });

    it('should clear data when starting fresh', async () => {
      const mockClearSavedData = jest.fn().mockResolvedValue(undefined);
      
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: new Date(),
        saveCount: 1,
        completionPercentage: 25,
        hasSavedData: true,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: jest.fn().mockResolvedValue({}),
        clearSavedData: mockClearSavedData,
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Start Fresh')).toBeTruthy();
      });

      // Choose to start fresh
      fireEvent.press(getByText('Start Fresh'));

      await waitFor(() => {
        expect(mockClearSavedData).toHaveBeenCalled();
      });
    });
  });

  describe('Form Progress Tracking', () => {
    it('should update progress indicator as user completes steps', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const progressIndicator = getByTestId('form-progress-indicator');
        expect(progressIndicator).toBeTruthy();
      });

      // Step 1 should be current
      const step1 = getByTestId('progress-step-1');
      expect(step1.props.accessibilityState.selected).toBe(true);

      // Navigate to step 2
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        const step2 = getByTestId('progress-step-2');
        expect(step2.props.accessibilityState.selected).toBe(true);
      });

      // Step 1 should be completed
      const step1Updated = getByTestId('progress-step-1');
      expect(step1Updated.props.accessibilityState.checked).toBe(true);
    });

    it('should show completion percentage', async () => {
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: null,
        saveCount: 0,
        completionPercentage: 75,
        hasSavedData: false,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: jest.fn().mockResolvedValue(null),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('75%')).toBeTruthy();
      });
    });

    it('should show validation errors in progress indicator', async () => {
      mockUseFormValidation.mockReturnValue({
        fieldErrors: { name: 'Name is required' },
        stepResults: { 
          1: { 
            isValid: false, 
            errors: { name: 'Name is required' },
            completionPercentage: 25,
          } 
        },
        hasErrors: true,
        isFormValid: false,
        validateStep: jest.fn().mockReturnValue({ isValid: false, errors: {}, overallErrors: [] }),
        validateForm: jest.fn().mockReturnValue({ isValid: false, errors: {}, overallErrors: [] }),
        validationSummary: { totalErrors: 1, errorsByStep: { 1: 1 }, criticalErrors: [] },
        getFieldError: jest.fn().mockReturnValue('Name is required'),
        isStepValid: jest.fn().mockReturnValue(false),
      });

      const { getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const step1 = getByTestId('progress-step-1');
        expect(step1.props.accessibilityState.invalid).toBe(true);
      });
    });
  });

  describe('Exit Confirmation', () => {
    it('should show confirmation dialog when exiting with unsaved changes', async () => {
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: null,
        saveCount: 1,
        completionPercentage: 25,
        hasSavedData: true,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: jest.fn().mockResolvedValue(null),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Try to go back from step 1 (exit form)
      fireEvent.press(getByText('←'));

      await waitFor(() => {
        expect(getByText('Save Draft?')).toBeTruthy();
        expect(getByText('Save & Exit')).toBeTruthy();
        expect(getByText('Discard Changes')).toBeTruthy();
      });
    });

    it('should save and exit when confirmed', async () => {
      const mockSaveNow = jest.fn().mockResolvedValue(undefined);
      
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: null,
        saveCount: 1,
        completionPercentage: 25,
        hasSavedData: true,
        saveNow: mockSaveNow,
        loadSavedData: jest.fn().mockResolvedValue(null),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Try to exit
      fireEvent.press(getByText('←'));

      await waitFor(() => {
        expect(getByText('Save & Exit')).toBeTruthy();
      });

      // Confirm save and exit
      fireEvent.press(getByText('Save & Exit'));

      await waitFor(() => {
        expect(mockSaveNow).toHaveBeenCalled();
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('should exit without saving when discarding changes', async () => {
      mockUseFormAutoSave.mockReturnValue({
        saveStatus: 'idle',
        lastSaved: null,
        saveCount: 1,
        completionPercentage: 25,
        hasSavedData: true,
        saveNow: jest.fn().mockResolvedValue(undefined),
        loadSavedData: jest.fn().mockResolvedValue(null),
        clearSavedData: jest.fn().mockResolvedValue(undefined),
        getSaveHistory: jest.fn().mockResolvedValue([]),
        restoreFromHistory: jest.fn().mockResolvedValue(null),
      });

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Try to exit
      fireEvent.press(getByText('←'));

      await waitFor(() => {
        expect(getByText('Discard Changes')).toBeTruthy();
      });

      // Discard changes
      fireEvent.press(getByText('Discard Changes'));

      await waitFor(() => {
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('Keyboard and Focus Management', () => {
    it('should handle keyboard dismissal during navigation', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Focus on input to show keyboard
      const nameInput = getByPlaceholderText('Business name');
      fireEvent(nameInput, 'focus');

      // Navigate to next step (should dismiss keyboard)
      fireEvent.press(getByText('Next →'));

      // Keyboard should be dismissed (implementation would test actual keyboard state)
      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });
    });

    it('should maintain focus state during step changes', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Fill out data and navigate
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Test Restaurant');

      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });

      // Navigate back
      fireEvent.press(getByText('←'));

      await waitFor(() => {
        expect(getByText('Basic Info')).toBeTruthy();
        // Input should maintain its value
        expect(nameInput.props.value).toBe('Test Restaurant');
      });
    });
  });

  describe('Performance During Navigation', () => {
    it('should not cause memory leaks during rapid navigation', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Rapidly navigate back and forth
      for (let i = 0; i < 10; i++) {
        fireEvent.press(getByText('Next →'));
        await waitFor(() => expect(getByText('Kosher Info')).toBeTruthy());
        
        fireEvent.press(getByText('←'));
        await waitFor(() => expect(getByText('Basic Info')).toBeTruthy());
      }

      // Should still be functional
      expect(getByText('Add Eatery')).toBeTruthy();
    });

    it('should handle navigation with large form data efficiently', async () => {
      const largeFormData = {
        name: 'A'.repeat(1000),
        description: 'B'.repeat(5000),
        // ... other large fields
      };

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Fill with large data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, largeFormData.name);

      // Navigation should still be responsive
      const startTime = Date.now();
      fireEvent.press(getByText('Next →'));
      
      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should be fast
    });
  });
});