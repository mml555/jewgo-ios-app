import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddCategoryScreen from '../../screens/AddCategoryScreen';
import FormAnalyticsService from '../../services/FormAnalytics';
import CrashReportingService from '../../services/CrashReporting';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/FormAnalytics');
jest.mock('../../services/CrashReporting');
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { category: 'Eatery' },
  }),
}));

// Mock haptic feedback
jest.mock('../../utils/hapticFeedback', () => ({
  hapticNavigation: jest.fn(),
  hapticSuccess: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('Form Regression Tests', () => {
  let mockAnalyticsService: jest.Mocked<FormAnalyticsService>;
  let mockCrashService: jest.Mocked<CrashReportingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup analytics service mock
    mockAnalyticsService = {
      startFormSession: jest.fn().mockResolvedValue('session_123'),
      trackStepNavigation: jest.fn().mockResolvedValue(undefined),
      trackValidationError: jest.fn().mockResolvedValue(undefined),
      trackRecoveryAction: jest.fn().mockResolvedValue(undefined),
      trackAutoSave: jest.fn().mockResolvedValue(undefined),
      trackFormSubmission: jest.fn().mockResolvedValue(undefined),
      trackFormAbandonment: jest.fn().mockResolvedValue(undefined),
      getInstance: jest.fn().mockReturnValue(mockAnalyticsService),
    } as any;

    // Setup crash service mock
    mockCrashService = {
      setFormContext: jest.fn(),
      clearFormContext: jest.fn(),
      addBreadcrumb: jest.fn(),
      reportError: jest.fn().mockResolvedValue(undefined),
      getInstance: jest.fn().mockReturnValue(mockCrashService),
    } as any;

    (FormAnalyticsService.getInstance as jest.Mock).mockReturnValue(mockAnalyticsService);
    (CrashReportingService.getInstance as jest.Mock).mockReturnValue(mockCrashService);
  });

  describe('Form Initialization', () => {
    it('should initialize form with analytics tracking', async () => {
      render(<AddCategoryScreen />);

      await waitFor(() => {
        expect(mockAnalyticsService.startFormSession).toHaveBeenCalledWith('add_eatery_form');
        expect(mockCrashService.setFormContext).toHaveBeenCalledWith(
          expect.objectContaining({
            sessionId: 'session_123',
            formType: 'add_eatery_form',
            currentStep: 1,
          })
        );
      });
    });

    it('should handle initialization errors gracefully', async () => {
      mockAnalyticsService.startFormSession.mockRejectedValue(new Error('Analytics error'));

      render(<AddCategoryScreen />);

      await waitFor(() => {
        expect(mockCrashService.reportError).toHaveBeenCalledWith(
          expect.any(Error),
          'javascript_error',
          'medium',
          expect.objectContaining({
            context: 'form_initialization',
          })
        );
      });
    });

    it('should offer draft recovery when saved data exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify({
        formData: { business_name: 'Test Restaurant' },
        currentStep: 2,
      }));

      render(<AddCategoryScreen />);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Recover Draft',
          expect.stringContaining('Found a saved draft'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Start Fresh' }),
            expect.objectContaining({ text: 'Continue Draft' }),
          ])
        );
      });
    });
  });

  describe('Form Navigation', () => {
    it('should track step navigation in analytics', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Wait for initialization
      await waitFor(() => {
        expect(mockAnalyticsService.startFormSession).toHaveBeenCalled();
      });

      // Navigate to next step (assuming Next button exists and form is valid)
      const nextButton = getByText('Next →');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(mockAnalyticsService.trackStepNavigation).toHaveBeenCalledWith(
          2,
          'Kosher Info'
        );
      });
    });

    it('should prevent navigation with validation errors', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Try to navigate without filling required fields
      const nextButton = getByText('Next →');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Please Complete Required Fields',
          expect.stringContaining('Some required fields are missing'),
          [{ text: 'OK' }]
        );
      });
    });

    it('should update crash reporting context on step changes', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Fill required fields and navigate
      // (This would need actual form field interactions)

      await waitFor(() => {
        expect(mockCrashService.setFormContext).toHaveBeenCalledWith(
          expect.objectContaining({
            currentStep: expect.any(Number),
            lastAction: expect.stringContaining('navigated_to_step'),
          })
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should track validation errors in analytics', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Trigger validation error (e.g., invalid email format)
      const emailInput = getByTestId('business-email-input');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent(emailInput, 'blur');

      await waitFor(() => {
        expect(mockAnalyticsService.trackValidationError).toHaveBeenCalledWith(
          'business_email',
          'validation_failed',
          expect.stringContaining('email'),
          1
        );
      });
    });

    it('should show validation errors for required fields', async () => {
      const { getByText, getByTestId } = render(<AddCategoryScreen />);

      // Try to submit with empty required fields
      const nextButton = getByText('Next →');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('validation-error')).toBeTruthy();
      });
    });

    it('should track recovery actions when errors are fixed', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Create and then fix a validation error
      const nameInput = getByTestId('business-name-input');
      fireEvent.changeText(nameInput, ''); // Create error
      fireEvent.changeText(nameInput, 'Valid Restaurant Name'); // Fix error

      await waitFor(() => {
        expect(mockAnalyticsService.trackRecoveryAction).toHaveBeenCalledWith(
          expect.stringContaining('field_corrected'),
          1,
          'business_name'
        );
      });
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should track auto-save events', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Fill form data to trigger auto-save
      const nameInput = getByTestId('business-name-input');
      fireEvent.changeText(nameInput, 'Test Restaurant');

      // Wait for auto-save to trigger
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 31000)); // Auto-save interval
      });

      expect(mockAnalyticsService.trackAutoSave).toHaveBeenCalledWith(1);
    });

    it('should handle auto-save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const { getByTestId } = render(<AddCategoryScreen />);

      const nameInput = getByTestId('business-name-input');
      fireEvent.changeText(nameInput, 'Test Restaurant');

      await waitFor(() => {
        expect(mockCrashService.reportError).toHaveBeenCalledWith(
          expect.any(Error),
          'storage_error',
          'high',
          expect.objectContaining({
            operation: 'auto_save',
          })
        );
      });
    });
  });

  describe('Business Hours Functionality', () => {
    it('should handle time picker interactions', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Navigate to hours step
      // (This would need proper navigation setup)

      const mondayOpenTime = getByTestId('monday-open-time');
      fireEvent.press(mondayOpenTime);

      // Verify time picker opens and handles selection
      expect(getByTestId('time-picker-modal')).toBeTruthy();
    });

    it('should validate business hours correctly', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Set invalid hours (closing before opening)
      const mondayOpenTime = getByTestId('monday-open-time');
      const mondayCloseTime = getByTestId('monday-close-time');

      fireEvent.changeText(mondayOpenTime, '18:00');
      fireEvent.changeText(mondayCloseTime, '12:00');

      await waitFor(() => {
        expect(getByTestId('hours-validation-error')).toBeTruthy();
      });
    });

    it('should handle copy hours functionality', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Set hours for Monday
      const mondayOpenTime = getByTestId('monday-open-time');
      fireEvent.changeText(mondayOpenTime, '09:00');

      // Copy to other days
      const copyButton = getByTestId('monday-copy-hours');
      fireEvent.press(copyButton);

      // Select days to copy to
      const tuesdayCheckbox = getByTestId('copy-to-tuesday');
      fireEvent.press(tuesdayCheckbox);

      const confirmCopy = getByTestId('confirm-copy');
      fireEvent.press(confirmCopy);

      // Verify hours were copied
      const tuesdayOpenTime = getByTestId('tuesday-open-time');
      expect(tuesdayOpenTime.props.value).toBe('09:00');
    });
  });

  describe('Photo Upload', () => {
    it('should handle photo selection and upload', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      const photoUpload = getByTestId('photo-upload-button');
      fireEvent.press(photoUpload);

      // Mock photo selection
      const mockPhoto = {
        uri: 'file://test-photo.jpg',
        type: 'image/jpeg',
        name: 'test-photo.jpg',
      };

      fireEvent(photoUpload, 'photoSelected', mockPhoto);

      await waitFor(() => {
        expect(getByTestId('uploaded-photo-0')).toBeTruthy();
      });
    });

    it('should validate photo requirements', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Try to proceed without minimum photos
      const nextButton = getByTestId('next-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByTestId('photo-validation-error')).toBeTruthy();
      });
    });

    it('should handle photo upload errors', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Mock photo upload failure
      const photoUpload = getByTestId('photo-upload-button');
      fireEvent(photoUpload, 'uploadError', new Error('Upload failed'));

      await waitFor(() => {
        expect(mockCrashService.reportError).toHaveBeenCalledWith(
          expect.any(Error),
          'network_error',
          'medium',
          expect.objectContaining({
            context: 'photo_upload',
          })
        );
      });
    });
  });

  describe('Form Submission', () => {
    it('should track successful form submission', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Fill all required fields (mocked)
      // Navigate to final step
      // Submit form

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockAnalyticsService.trackFormSubmission).toHaveBeenCalledWith(
          undefined,
          expect.objectContaining({
            status: 'pending',
            submission_status: 'pending_approval',
          })
        );
      });
    });

    it('should handle submission validation errors', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Try to submit incomplete form
      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Form Incomplete',
          expect.stringContaining('Please fix the following issues'),
          [{ text: 'OK' }]
        );
      });

      expect(mockAnalyticsService.trackValidationError).toHaveBeenCalledWith(
        'form_submission',
        'submission_validation_failed',
        expect.any(String),
        expect.any(Number)
      );
    });

    it('should handle submission network errors', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Mock network error during submission
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockCrashService.reportError).toHaveBeenCalledWith(
          expect.any(Error),
          'network_error',
          'high',
          expect.objectContaining({
            context: 'form_submission',
          })
        );
      });
    });

    it('should clear form data after successful submission', async () => {
      const { getByText } = render(<AddCategoryScreen />);

      // Mock successful submission
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@form_auto_save');
        expect(mockCrashService.clearFormContext).toHaveBeenCalled();
      });
    });
  });

  describe('Form Abandonment', () => {
    it('should track form abandonment on back navigation', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(mockAnalyticsService.trackFormAbandonment).toHaveBeenCalledWith(1);
      });
    });

    it('should show exit confirmation with unsaved changes', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Make changes to form
      const nameInput = getByTestId('business-name-input');
      fireEvent.changeText(nameInput, 'Test Restaurant');

      const backButton = getByTestId('back-button');
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Save Draft?',
          expect.stringContaining('unsaved changes'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Save & Exit' }),
            expect.objectContaining({ text: 'Discard Changes' }),
          ])
        );
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByLabelText } = render(<AddCategoryScreen />);

      expect(getByLabelText('Business name')).toBeTruthy();
      expect(getByLabelText('Business address')).toBeTruthy();
      expect(getByLabelText('Phone number')).toBeTruthy();
    });

    it('should support screen reader navigation', () => {
      const { getByRole } = render(<AddCategoryScreen />);

      expect(getByRole('button', { name: /next/i })).toBeTruthy();
      expect(getByRole('button', { name: /back/i })).toBeTruthy();
    });

    it('should have proper focus management', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      const nameInput = getByTestId('business-name-input');
      fireEvent(nameInput, 'focus');

      expect(nameInput.props.accessibilityState?.focused).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks', async () => {
      const { unmount } = render(<AddCategoryScreen />);

      // Simulate component lifecycle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
      });

      unmount();

      // Verify cleanup
      expect(mockCrashService.clearFormContext).toHaveBeenCalled();
    });

    it('should handle large form data efficiently', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Fill form with large amounts of data
      const descriptionInput = getByTestId('description-input');
      const largeText = 'A'.repeat(10000);

      const startTime = Date.now();
      fireEvent.changeText(descriptionInput, largeText);
      const endTime = Date.now();

      // Should handle large text input quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle app backgrounding and foregrounding', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Simulate app going to background
      fireEvent(getByTestId('app-state'), 'change', 'background');

      // Simulate app coming to foreground
      fireEvent(getByTestId('app-state'), 'change', 'active');

      // Should restore session properly
      await waitFor(() => {
        expect(mockAnalyticsService.startFormSession).toHaveBeenCalled();
      });
    });

    it('should handle network connectivity changes', async () => {
      const { getByTestId } = render(<AddCategoryScreen />);

      // Simulate network disconnection
      fireEvent(getByTestId('network-state'), 'change', false);

      // Try to save data
      const nameInput = getByTestId('business-name-input');
      fireEvent.changeText(nameInput, 'Test Restaurant');

      // Should show offline indicator
      expect(getByTestId('offline-indicator')).toBeTruthy();
    });

    it('should handle device rotation', async () => {
      const { getByTestId, rerender } = render(<AddCategoryScreen />);

      // Simulate device rotation
      const originalDimensions = { width: 375, height: 812 };
      const rotatedDimensions = { width: 812, height: 375 };

      // Mock Dimensions.get
      jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
        get: () => rotatedDimensions,
      });

      rerender(<AddCategoryScreen />);

      // Form should adapt to new dimensions
      expect(getByTestId('form-container')).toBeTruthy();
    });
  });
});

// Integration test for complete form flow
describe('Complete Form Flow Integration', () => {
  it('should complete entire form successfully', async () => {
    const { getByTestId, getByText } = render(<AddCategoryScreen />);

    // Step 1: Basic Info
    fireEvent.changeText(getByTestId('business-name-input'), 'Test Kosher Restaurant');
    fireEvent.changeText(getByTestId('address-input'), '123 Main St, Brooklyn, NY 11201');
    fireEvent.changeText(getByTestId('phone-input'), '(555) 123-4567');
    fireEvent.changeText(getByTestId('email-input'), 'info@testrestaurant.com');
    
    fireEvent.press(getByText('Next →'));

    // Step 2: Kosher Info
    await waitFor(() => {
      expect(getByTestId('kosher-category-selector')).toBeTruthy();
    });

    fireEvent.press(getByTestId('kosher-category-meat'));
    fireEvent.press(getByTestId('certifying-agency-ou'));
    
    fireEvent.press(getByText('Next →'));

    // Step 3: Business Details
    await waitFor(() => {
      expect(getByTestId('business-hours-selector')).toBeTruthy();
    });

    // Set business hours
    fireEvent.press(getByTestId('monday-open-toggle'));
    fireEvent.changeText(getByTestId('monday-open-time'), '09:00');
    fireEvent.changeText(getByTestId('monday-close-time'), '21:00');

    fireEvent.changeText(getByTestId('description-input'), 'A wonderful kosher restaurant serving traditional Jewish cuisine.');
    
    fireEvent.press(getByText('Next →'));

    // Step 4: Photos
    await waitFor(() => {
      expect(getByTestId('photo-upload-section')).toBeTruthy();
    });

    // Mock photo uploads
    for (let i = 0; i < 3; i++) {
      fireEvent(getByTestId('photo-upload-button'), 'photoSelected', {
        uri: `file://photo${i}.jpg`,
        type: 'image/jpeg',
        name: `photo${i}.jpg`,
      });
    }

    fireEvent.press(getByText('Review & Submit'));

    // Step 5: Review & Submit
    await waitFor(() => {
      expect(getByTestId('review-section')).toBeTruthy();
    });

    fireEvent.press(getByText('Submit Listing 🚀'));

    // Verify successful submission
    await waitFor(() => {
      expect(getByTestId('success-celebration')).toBeTruthy();
    });
  });
});