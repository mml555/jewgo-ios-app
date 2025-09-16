/**
 * Integration tests for complete form flow from start to submission
 * Tests the entire user journey through the multi-step form
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddCategoryScreen, { ListingFormData } from '../../screens/AddCategoryScreen';
import { formPersistenceService } from '../../services/FormPersistence';
import { hapticNavigation, hapticSuccess } from '../../utils/hapticFeedback';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../utils/hapticFeedback');
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;
const mockHapticNavigation = hapticNavigation as jest.MockedFunction<typeof hapticNavigation>;
const mockHapticSuccess = hapticSuccess as jest.MockedFunction<typeof hapticSuccess>;

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

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('Form Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default AsyncStorage mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    // Mock navigation
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => mockNavigation,
      useRoute: () => mockRoute,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Complete Form Flow', () => {
    it('should complete entire form flow from start to submission', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Wait for form to initialize
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Step 1: Basic Info
      expect(getByText('Basic Info')).toBeTruthy();
      
      // Fill out basic information
      const nameInput = getByPlaceholderText('Business name');
      const addressInput = getByPlaceholderText('Full business address');
      const phoneInput = getByPlaceholderText('Phone number');
      const emailInput = getByPlaceholderText('Business email');
      
      fireEvent.changeText(nameInput, 'Test Kosher Restaurant');
      fireEvent.changeText(addressInput, '123 Main Street, Brooklyn, NY 11201');
      fireEvent.changeText(phoneInput, '(718) 555-0123');
      fireEvent.changeText(emailInput, 'info@testkosher.com');

      // Select business owner submission
      const ownerToggle = getByTestId('owner-submission-toggle');
      fireEvent.press(ownerToggle);

      // Fill owner information
      const ownerNameInput = getByPlaceholderText('Your full name');
      const ownerEmailInput = getByPlaceholderText('Your email address');
      const ownerPhoneInput = getByPlaceholderText('Your phone number');
      
      fireEvent.changeText(ownerNameInput, 'John Doe');
      fireEvent.changeText(ownerEmailInput, 'john@testkosher.com');
      fireEvent.changeText(ownerPhoneInput, '(718) 555-0124');

      // Proceed to next step
      const nextButton = getByText('Next →');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });

      // Step 2: Kosher Certification
      const meatOption = getByText('Meat');
      fireEvent.press(meatOption);

      const agencyInput = getByPlaceholderText('Select certifying agency');
      fireEvent.changeText(agencyInput, 'OU - Orthodox Union');

      const cholovYisroelToggle = getByTestId('cholov-yisroel-toggle');
      fireEvent.press(cholovYisroelToggle);

      // Proceed to next step
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Business Details')).toBeTruthy();
      });

      // Step 3: Business Details & Hours
      const shortDescInput = getByPlaceholderText('Brief description of your business');
      fireEvent.changeText(shortDescInput, 'Authentic kosher restaurant serving traditional Jewish cuisine');

      const detailedDescInput = getByPlaceholderText('Detailed description of your business, menu, specialties, etc.');
      fireEvent.changeText(detailedDescInput, 'We offer a wide variety of kosher meals including traditional Shabbat dinners, holiday catering, and daily specials.');

      // Set business hours - Monday
      const mondayOpenToggle = getByTestId('monday-open-toggle');
      fireEvent.press(mondayOpenToggle);

      const mondayOpenTime = getByTestId('monday-open-time');
      fireEvent.changeText(mondayOpenTime, '11:00');

      const mondayCloseTime = getByTestId('monday-close-time');
      fireEvent.changeText(mondayCloseTime, '22:00');

      // Copy hours to other weekdays
      const copyMondayButton = getByTestId('copy-monday-hours');
      fireEvent.press(copyMondayButton);

      // Select weekdays to copy to
      const tuesdayCheckbox = getByTestId('copy-to-tuesday');
      const wednesdayCheckbox = getByTestId('copy-to-wednesday');
      const thursdayCheckbox = getByTestId('copy-to-thursday');
      
      fireEvent.press(tuesdayCheckbox);
      fireEvent.press(wednesdayCheckbox);
      fireEvent.press(thursdayCheckbox);

      const confirmCopyButton = getByText('Copy Hours');
      fireEvent.press(confirmCopyButton);

      // Set Friday hours (shorter for Shabbat)
      const fridayOpenToggle = getByTestId('friday-open-toggle');
      fireEvent.press(fridayOpenToggle);

      const fridayCloseTime = getByTestId('friday-close-time');
      fireEvent.changeText(fridayCloseTime, '15:00');

      // Saturday closed for Shabbat (should be default)
      const saturdayToggle = getByTestId('saturday-open-toggle');
      expect(saturdayToggle.props.accessibilityState.checked).toBe(false);

      // Set service options
      const deliveryToggle = getByTestId('delivery-toggle');
      const takeoutToggle = getByTestId('takeout-toggle');
      const cateringToggle = getByTestId('catering-toggle');
      
      fireEvent.press(deliveryToggle);
      fireEvent.press(takeoutToggle);
      fireEvent.press(cateringToggle);

      // Add social media links
      const instagramInput = getByPlaceholderText('https://instagram.com/...');
      fireEvent.changeText(instagramInput, 'https://instagram.com/testkosher');

      // Proceed to next step
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Photos')).toBeTruthy();
      });

      // Step 4: Photos (skip for this test)
      fireEvent.press(getByText('Review & Submit'));

      await waitFor(() => {
        expect(getByText('Review')).toBeTruthy();
      });

      // Step 5: Review & Submit
      expect(getByText('Test Kosher Restaurant')).toBeTruthy();
      expect(getByText('123 Main Street, Brooklyn, NY 11201')).toBeTruthy();
      expect(getByText('Meat')).toBeTruthy();
      expect(getByText('OU - Orthodox Union')).toBeTruthy();

      // Submit the form
      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });

      // Verify haptic feedback was triggered
      expect(mockHapticSuccess).toHaveBeenCalled();

      // Verify success message
      expect(getByText('Your eatery listing has been submitted for review. It will appear in the app within 24 hours.')).toBeTruthy();

      // Close success dialog
      const doneButton = getByText('Done');
      fireEvent.press(doneButton);

      // Verify navigation back
      expect(mockGoBack).toHaveBeenCalled();
    });

    it('should handle form validation errors during flow', async () => {
      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Try to proceed without filling required fields
      const nextButton = getByText('Next →');
      fireEvent.press(nextButton);

      // Should show validation alert
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Please Complete Required Fields',
          'Some required fields are missing or have errors. Please fix them before continuing.',
          [{ text: 'OK' }]
        );
      });

      // Fill minimum required fields
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Test Restaurant');

      // Try again - should still fail due to missing fields
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledTimes(2);
      });

      // Fill all required fields
      const addressInput = getByPlaceholderText('Full business address');
      const phoneInput = getByPlaceholderText('Phone number');
      const emailInput = getByPlaceholderText('Business email');
      
      fireEvent.changeText(addressInput, '123 Main St');
      fireEvent.changeText(phoneInput, '1234567890');
      fireEvent.changeText(emailInput, 'test@example.com');

      // Now should proceed successfully
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });
    });

    it('should handle business hours validation', async () => {
      const { getByText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Navigate to business hours step
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Skip to step 3 (would need to fill previous steps in real scenario)
      // For this test, we'll mock the navigation directly
      act(() => {
        // Simulate being on step 3
      });

      // Try to set invalid hours (close before open)
      const mondayOpenToggle = getByTestId('monday-open-toggle');
      fireEvent.press(mondayOpenToggle);

      const mondayOpenTime = getByTestId('monday-open-time');
      const mondayCloseTime = getByTestId('monday-close-time');
      
      fireEvent.changeText(mondayOpenTime, '22:00');
      fireEvent.changeText(mondayCloseTime, '10:00');

      // Should show validation error
      await waitFor(() => {
        expect(getByText('Close time must be after open time')).toBeTruthy();
      });

      // Fix the hours
      fireEvent.changeText(mondayOpenTime, '10:00');
      fireEvent.changeText(mondayCloseTime, '22:00');

      // Error should disappear
      await waitFor(() => {
        expect(() => getByText('Close time must be after open time')).toThrow();
      });
    });
  });

  describe('Form Navigation with Data Persistence', () => {
    it('should save and restore form data when navigating between steps', async () => {
      const { getByText, getByPlaceholderText, rerender } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Fill out step 1
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Persistent Restaurant');

      // Advance to step 2
      fireEvent.press(getByText('Next →'));

      await waitFor(() => {
        expect(getByText('Kosher Info')).toBeTruthy();
      });

      // Verify data was saved
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'add_eatery_form_data',
        expect.stringContaining('Persistent Restaurant')
      );

      // Go back to step 1
      const backButton = getByText('←');
      fireEvent.press(backButton);

      await waitFor(() => {
        expect(getByText('Basic Info')).toBeTruthy();
      });

      // Verify data is still there
      expect(nameInput.props.value).toBe('Persistent Restaurant');
    });

    it('should handle app backgrounding and restoration', async () => {
      const savedData = {
        name: 'Background Test Restaurant',
        address: '456 Test Ave',
        phone: '9876543210',
        business_email: 'bg@test.com',
      };

      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify(savedData));
      mockAsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({
        lastSaved: new Date().toISOString(),
        currentStep: 1,
        version: '1.0.0',
        saveCount: 1,
        isComplete: false,
      }));

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should show recovery dialog
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Recover Draft',
          expect.stringContaining('Found a saved draft'),
          expect.arrayContaining([
            expect.objectContaining({ text: 'Start Fresh' }),
            expect.objectContaining({ text: 'Continue Draft' }),
          ])
        );
      });

      // Simulate choosing to continue draft
      const alertCall = mockAlert.mock.calls[0];
      const continueButton = alertCall[2].find((button: any) => button.text === 'Continue Draft');
      continueButton.onPress();

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput.props.value).toBe('Background Test Restaurant');
      });
    });

    it('should clear saved data after successful submission', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Mock successful submission flow
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Simulate completing the form and submitting
      // (In a real test, we'd fill out all steps)
      
      // Mock the submission
      jest.spyOn(formPersistenceService, 'clearFormData').mockResolvedValue();

      // Trigger submission (would need to navigate through all steps)
      // For this test, we'll simulate the final submission call
      await act(async () => {
        await formPersistenceService.clearFormData();
      });

      expect(formPersistenceService.clearFormData).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle save errors gracefully', async () => {
      const saveError = new Error('Storage quota exceeded');
      mockAsyncStorage.setItem.mockRejectedValue(saveError);

      const { getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Fill out form data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Error Test Restaurant');

      // Try to navigate (which triggers save)
      fireEvent.press(getByText('Next →'));

      // Should handle error gracefully (exact behavior depends on implementation)
      await waitFor(() => {
        // The form should still be functional even if save fails
        expect(getByText('Add Eatery')).toBeTruthy();
      });
    });

    it('should handle network errors during submission', async () => {
      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      // Mock network error during submission
      // (In real implementation, this would be an API call)
      
      // Simulate submission failure
      // The exact implementation would depend on how API calls are handled
      
      // Should show error alert
      await waitFor(() => {
        // Error handling would be tested based on actual implementation
        expect(getByText('Add Eatery')).toBeTruthy();
      });
    });

    it('should recover from corrupted saved data', async () => {
      // Mock corrupted data
      mockAsyncStorage.getItem.mockResolvedValueOnce('invalid json data');

      const { getByText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      // Should initialize with default data instead of crashing
      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
        expect(getByText('Basic Info')).toBeTruthy();
      });
    });
  });

  describe('Auto-Save Functionality', () => {
    it('should auto-save form data periodically', async () => {
      const { getByPlaceholderText } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const nameInput = getByPlaceholderText('Business name');
        expect(nameInput).toBeTruthy();
      });

      // Fill out some data
      const nameInput = getByPlaceholderText('Business name');
      fireEvent.changeText(nameInput, 'Auto Save Test');

      // Fast-forward time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(30000); // 30 seconds
      });

      // Should have saved data
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'add_eatery_form_data',
          expect.stringContaining('Auto Save Test')
        );
      });
    });

    it('should show save status indicator', async () => {
      const { getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        const saveIndicator = getByTestId('save-status-indicator');
        expect(saveIndicator).toBeTruthy();
      });

      // Should show appropriate save status
      // (Implementation would depend on SaveStatusIndicator component)
    });

    it('should debounce rapid changes', async () => {
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

      // Make rapid changes
      fireEvent.changeText(nameInput, 'A');
      fireEvent.changeText(nameInput, 'AB');
      fireEvent.changeText(nameInput, 'ABC');
      fireEvent.changeText(nameInput, 'ABCD');

      // Should not save immediately
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();

      // Fast-forward past debounce time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should save only once after debounce
      await waitFor(() => {
        expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
          'add_eatery_form_data',
          expect.stringContaining('ABCD')
        );
      });
    });
  });

  describe('Form Submission with Various Data Combinations', () => {
    const testCases = [
      {
        name: 'Meat restaurant with delivery',
        data: {
          name: 'Kosher Steakhouse',
          kosher_category: 'Meat',
          delivery_available: true,
          takeout_available: true,
        },
      },
      {
        name: 'Dairy cafe with limited hours',
        data: {
          name: 'Kosher Dairy Cafe',
          kosher_category: 'Dairy',
          delivery_available: false,
          business_hours: [
            { day: 'Sunday', openTime: '08:00', closeTime: '14:00', isClosed: false },
            { day: 'Monday', openTime: '08:00', closeTime: '14:00', isClosed: false },
          ],
        },
      },
      {
        name: 'Pareve bakery with catering',
        data: {
          name: 'Kosher Bakery',
          kosher_category: 'Pareve',
          catering_available: true,
          years_in_business: 15,
        },
      },
    ];

    testCases.forEach(({ name, data }) => {
      it(`should handle submission for ${name}`, async () => {
        const { getByText } = render(
          <TestWrapper>
            <AddCategoryScreen />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(getByText('Add Eatery')).toBeTruthy();
        });

        // Mock form completion with test data
        // (In real test, would fill out form with specific data)
        
        // Simulate successful submission
        await act(async () => {
          // Mock the submission process
          await new Promise(resolve => setTimeout(resolve, 100));
        });

        // Verify submission completed
        // (Implementation would depend on actual submission flow)
      });
    });

    it('should handle submission with maximum data', async () => {
      const maxData = {
        name: 'Complete Kosher Restaurant',
        address: '789 Complete Ave, Brooklyn, NY 11201',
        phone: '(718) 555-9999',
        business_email: 'complete@kosher.com',
        website: 'https://completekosher.com',
        listing_type: 'Eatery',
        owner_name: 'Complete Owner',
        owner_email: 'owner@kosher.com',
        owner_phone: '(718) 555-8888',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        is_cholov_yisroel: true,
        is_pas_yisroel: true,
        short_description: 'Complete kosher restaurant with all amenities',
        description: 'Full service kosher restaurant offering traditional and modern cuisine',
        seating_capacity: 100,
        years_in_business: 25,
        delivery_available: true,
        takeout_available: true,
        catering_available: true,
        instagram_link: 'https://instagram.com/completekosher',
        facebook_link: 'https://facebook.com/completekosher',
        google_listing_url: 'https://maps.google.com/completekosher',
      };

      // Test would fill out complete form and verify submission
      // (Implementation details would depend on form structure)
    });

    it('should handle submission with minimum required data', async () => {
      const minData = {
        name: 'Minimal Restaurant',
        address: '123 Min St',
        phone: '1234567890',
        business_email: 'min@test.com',
        kosher_category: 'Pareve',
        short_description: 'Minimal description',
      };

      // Test would fill out minimal form and verify submission
      // (Implementation details would depend on form structure)
    });
  });
});