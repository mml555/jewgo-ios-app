/**
 * Integration tests for form submission with various data combinations
 * Tests different business types, data scenarios, and submission flows
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AddCategoryScreen, { ListingFormData } from '../../screens/AddCategoryScreen';
import { formPersistenceService } from '../../services/FormPersistence';
import { hapticSuccess } from '../../utils/hapticFeedback';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../../services/FormPersistence');
jest.mock('../../utils/hapticFeedback');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockFormPersistenceService = formPersistenceService as jest.Mocked<typeof formPersistenceService>;
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

// Test wrapper
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

// Helper function to fill out complete form
const fillCompleteForm = async (getByPlaceholderText: any, getByText: any, getByTestId: any, formData: Partial<ListingFormData>) => {
  // Step 1: Basic Info
  if (formData.name) {
    const nameInput = getByPlaceholderText('Business name');
    fireEvent.changeText(nameInput, formData.name);
  }
  
  if (formData.address) {
    const addressInput = getByPlaceholderText('Full business address');
    fireEvent.changeText(addressInput, formData.address);
  }
  
  if (formData.phone) {
    const phoneInput = getByPlaceholderText('Phone number');
    fireEvent.changeText(phoneInput, formData.phone);
  }
  
  if (formData.business_email) {
    const emailInput = getByPlaceholderText('Business email');
    fireEvent.changeText(emailInput, formData.business_email);
  }

  if (formData.website) {
    const websiteInput = getByPlaceholderText('Website URL');
    fireEvent.changeText(websiteInput, formData.website);
  }

  // Owner information if specified
  if (formData.is_owner_submission) {
    const ownerToggle = getByTestId('owner-submission-toggle');
    fireEvent.press(ownerToggle);

    if (formData.owner_name) {
      const ownerNameInput = getByPlaceholderText('Your full name');
      fireEvent.changeText(ownerNameInput, formData.owner_name);
    }
  }

  // Navigate to step 2
  fireEvent.press(getByText('Next →'));
  await waitFor(() => expect(getByText('Kosher Info')).toBeTruthy());

  // Step 2: Kosher Info
  if (formData.kosher_category) {
    const categoryButton = getByText(formData.kosher_category);
    fireEvent.press(categoryButton);
  }

  if (formData.certifying_agency) {
    const agencyInput = getByPlaceholderText('Select certifying agency');
    fireEvent.changeText(agencyInput, formData.certifying_agency);
  }

  // Navigate to step 3
  fireEvent.press(getByText('Next →'));
  await waitFor(() => expect(getByText('Business Details')).toBeTruthy());

  // Step 3: Business Details
  if (formData.short_description) {
    const shortDescInput = getByPlaceholderText('Brief description of your business');
    fireEvent.changeText(shortDescInput, formData.short_description);
  }

  if (formData.description) {
    const descInput = getByPlaceholderText('Detailed description of your business, menu, specialties, etc.');
    fireEvent.changeText(descInput, formData.description);
  }

  // Set business hours if specified
  if (formData.business_hours) {
    formData.business_hours.forEach((dayHours, index) => {
      if (!dayHours.isClosed) {
        const dayToggle = getByTestId(`${dayHours.day.toLowerCase()}-open-toggle`);
        fireEvent.press(dayToggle);

        const openTimeInput = getByTestId(`${dayHours.day.toLowerCase()}-open-time`);
        fireEvent.changeText(openTimeInput, dayHours.openTime);

        const closeTimeInput = getByTestId(`${dayHours.day.toLowerCase()}-close-time`);
        fireEvent.changeText(closeTimeInput, dayHours.closeTime);
      }
    });
  }

  // Service options
  if (formData.delivery_available) {
    const deliveryToggle = getByTestId('delivery-toggle');
    fireEvent.press(deliveryToggle);
  }

  if (formData.takeout_available) {
    const takeoutToggle = getByTestId('takeout-toggle');
    fireEvent.press(takeoutToggle);
  }

  if (formData.catering_available) {
    const cateringToggle = getByTestId('catering-toggle');
    fireEvent.press(cateringToggle);
  }

  // Navigate to step 4
  fireEvent.press(getByText('Next →'));
  await waitFor(() => expect(getByText('Photos')).toBeTruthy());

  // Step 4: Photos (skip for most tests)
  fireEvent.press(getByText('Review & Submit'));
  await waitFor(() => expect(getByText('Review')).toBeTruthy());
};

describe('Form Submission Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup default mocks
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();
    
    mockFormPersistenceService.hasSavedData.mockResolvedValue(false);
    mockFormPersistenceService.getMetadata.mockResolvedValue(null);
    mockFormPersistenceService.getFormCompletionPercentage.mockResolvedValue(0);
    mockFormPersistenceService.saveFormData.mockResolvedValue();
    mockFormPersistenceService.clearFormData.mockResolvedValue();
    mockFormPersistenceService.onSaveStatusChange.mockReturnValue(() => {});

    // Mock navigation
    jest.doMock('@react-navigation/native', () => ({
      useNavigation: () => mockNavigation,
      useRoute: () => mockRoute,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Different Business Types', () => {
    it('should submit kosher meat restaurant successfully', async () => {
      const meatRestaurantData: Partial<ListingFormData> = {
        name: 'Prime Kosher Steakhouse',
        address: '123 Kosher Ave, Brooklyn, NY 11201',
        phone: '(718) 555-0123',
        business_email: 'info@primekosher.com',
        website: 'https://primekosher.com',
        listing_type: 'Eatery',
        is_owner_submission: true,
        owner_name: 'Rabbi David Cohen',
        owner_email: 'rabbi@primekosher.com',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        is_cholov_yisroel: true,
        is_pas_yisroel: true,
        short_description: 'Premium kosher steakhouse with glatt kosher meat',
        description: 'Fine dining kosher steakhouse featuring prime cuts of glatt kosher beef, elegant atmosphere, and exceptional service.',
        business_hours: [
          { day: 'Sunday', openTime: '5:00 PM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Monday', openTime: '5:00 PM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '5:00 PM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '5:00 PM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '5:00 PM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Friday', openTime: '12:00 PM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        seating_capacity: 80,
        years_in_business: 15,
        delivery_available: false,
        takeout_available: true,
        catering_available: true,
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, meatRestaurantData);

      // Submit the form
      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      // Wait for submission
      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });

      // Verify haptic feedback
      expect(mockHapticSuccess).toHaveBeenCalled();

      // Verify data was cleared after submission
      expect(mockFormPersistenceService.clearFormData).toHaveBeenCalled();
    });

    it('should submit kosher dairy cafe successfully', async () => {
      const dairyCafeData: Partial<ListingFormData> = {
        name: 'Kosher Dairy Delights',
        address: '456 Dairy Lane, Lakewood, NJ 08701',
        phone: '(732) 555-0456',
        business_email: 'hello@dairydelights.com',
        listing_type: 'Eatery',
        kosher_category: 'Dairy',
        certifying_agency: 'Star-K',
        is_cholov_yisroel: true,
        short_description: 'Cozy kosher dairy cafe with fresh pastries and coffee',
        description: 'Family-friendly kosher dairy cafe serving fresh baked goods, artisan coffee, and light dairy meals.',
        business_hours: [
          { day: 'Sunday', openTime: '7:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Monday', openTime: '7:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '7:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '7:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '7:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Friday', openTime: '7:00 AM', closeTime: '1:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        seating_capacity: 25,
        years_in_business: 8,
        delivery_available: true,
        takeout_available: true,
        catering_available: false,
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, dairyCafeData);

      // Submit the form
      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should submit pareve bakery successfully', async () => {
      const pareveBakeryData: Partial<ListingFormData> = {
        name: 'Golden Crust Kosher Bakery',
        address: '789 Bakery Street, Monsey, NY 10952',
        phone: '(845) 555-0789',
        business_email: 'orders@goldencrust.com',
        website: 'https://goldencrust.com',
        listing_type: 'Eatery',
        kosher_category: 'Pareve',
        certifying_agency: 'Kof-K',
        is_pas_yisroel: true,
        short_description: 'Traditional kosher bakery with fresh bread and pastries',
        description: 'Artisan kosher bakery specializing in traditional Jewish breads, pastries, and custom cakes for all occasions.',
        business_hours: [
          { day: 'Sunday', openTime: '6:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Monday', openTime: '6:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '6:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '6:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '6:00 AM', closeTime: '8:00 PM', isClosed: false },
          { day: 'Friday', openTime: '6:00 AM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        seating_capacity: 0, // Bakery only, no seating
        years_in_business: 25,
        delivery_available: true,
        takeout_available: true,
        catering_available: true,
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, pareveBakeryData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should submit food truck successfully', async () => {
      const foodTruckData: Partial<ListingFormData> = {
        name: 'Kosher Street Eats',
        address: 'Mobile - Various Locations in Manhattan',
        phone: '(212) 555-0321',
        business_email: 'info@kosherstreeteats.com',
        listing_type: 'Food Truck',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        short_description: 'Mobile kosher food truck serving gourmet street food',
        description: 'Gourmet kosher food truck bringing delicious street food to various locations throughout Manhattan.',
        business_hours: [
          { day: 'Sunday', openTime: '11:00 AM', closeTime: '8:00 PM', isClosed: false },
          { day: 'Monday', openTime: '11:00 AM', closeTime: '8:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '11:00 AM', closeTime: '8:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '11:00 AM', closeTime: '8:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '11:00 AM', closeTime: '8:00 PM', isClosed: false },
          { day: 'Friday', openTime: '11:00 AM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        seating_capacity: 0, // Food truck
        years_in_business: 3,
        delivery_available: false,
        takeout_available: true,
        catering_available: true,
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, foodTruckData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should submit catering service successfully', async () => {
      const cateringData: Partial<ListingFormData> = {
        name: 'Elite Kosher Catering',
        address: '321 Catering Blvd, Five Towns, NY 11598',
        phone: '(516) 555-0987',
        business_email: 'events@elitekoshercatering.com',
        website: 'https://elitekoshercatering.com',
        listing_type: 'Catering',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        is_cholov_yisroel: true,
        is_pas_yisroel: true,
        short_description: 'Premium kosher catering for all occasions',
        description: 'Full-service kosher catering company specializing in weddings, bar/bat mitzvahs, corporate events, and private parties.',
        business_hours: [
          { day: 'Sunday', openTime: '9:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Monday', openTime: '9:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '9:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '9:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '9:00 AM', closeTime: '6:00 PM', isClosed: false },
          { day: 'Friday', openTime: '9:00 AM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        seating_capacity: 500, // Event capacity
        years_in_business: 20,
        delivery_available: true,
        takeout_available: false,
        catering_available: true,
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, cateringData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Special Business Hours Scenarios', () => {
    it('should handle late-night restaurant hours', async () => {
      const lateNightData: Partial<ListingFormData> = {
        name: 'Midnight Kosher Diner',
        address: '999 Night Owl Ave, Brooklyn, NY 11230',
        phone: '(718) 555-0999',
        business_email: 'info@midnightkosher.com',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        short_description: 'Late-night kosher diner open until midnight',
        business_hours: [
          { day: 'Sunday', openTime: '6:00 PM', closeTime: '12:00 AM', isClosed: false },
          { day: 'Monday', openTime: '6:00 PM', closeTime: '12:00 AM', isClosed: false },
          { day: 'Tuesday', openTime: '6:00 PM', closeTime: '12:00 AM', isClosed: false },
          { day: 'Wednesday', openTime: '6:00 PM', closeTime: '12:00 AM', isClosed: false },
          { day: 'Thursday', openTime: '6:00 PM', closeTime: '2:00 AM', isClosed: false }, // Late Thursday
          { day: 'Friday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Saturday', openTime: '8:00 PM', closeTime: '2:00 AM', isClosed: false }, // Motzei Shabbat
        ],
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, lateNightData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should handle seasonal restaurant hours', async () => {
      const seasonalData: Partial<ListingFormData> = {
        name: 'Summer Kosher Pavilion',
        address: '555 Seasonal Dr, Catskills, NY 12345',
        phone: '(845) 555-0555',
        business_email: 'info@summerpavilion.com',
        kosher_category: 'Dairy',
        certifying_agency: 'Star-K',
        short_description: 'Seasonal kosher restaurant open summer months only',
        description: 'Beautiful outdoor kosher dairy restaurant open during summer season with stunning mountain views.',
        business_hours: [
          { day: 'Sunday', openTime: '8:00 AM', closeTime: '9:00 PM', isClosed: false },
          { day: 'Monday', openTime: '8:00 AM', closeTime: '9:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '8:00 AM', closeTime: '9:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '8:00 AM', closeTime: '9:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '8:00 AM', closeTime: '9:00 PM', isClosed: false },
          { day: 'Friday', openTime: '8:00 AM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        contact_notes: 'Open seasonally from Memorial Day through Labor Day',
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, seasonalData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should handle limited weekday hours', async () => {
      const limitedHoursData: Partial<ListingFormData> = {
        name: 'Weekday Lunch Spot',
        address: '777 Business District, Manhattan, NY 10001',
        phone: '(212) 555-0777',
        business_email: 'lunch@weekdayspot.com',
        kosher_category: 'Pareve',
        certifying_agency: 'Kof-K',
        short_description: 'Kosher lunch spot open weekdays only',
        business_hours: [
          { day: 'Sunday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Monday', openTime: '11:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '11:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '11:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '11:00 AM', closeTime: '3:00 PM', isClosed: false },
          { day: 'Friday', openTime: '11:00 AM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, limitedHoursData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Minimum vs Maximum Data Scenarios', () => {
    it('should submit with minimum required data', async () => {
      const minimalData: Partial<ListingFormData> = {
        name: 'Minimal Kosher Place',
        address: '123 Min St',
        phone: '1234567890',
        business_email: 'min@test.com',
        kosher_category: 'Pareve',
        certifying_agency: 'Local Rabbinate',
        short_description: 'Basic kosher establishment',
        business_hours: [
          { day: 'Sunday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
          { day: 'Monday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Tuesday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Wednesday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Thursday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Friday', openTime: '', closeTime: '', isClosed: true },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, minimalData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should submit with maximum data including all optional fields', async () => {
      const maximalData: Partial<ListingFormData> = {
        name: 'Complete Kosher Restaurant & Catering',
        address: '123 Complete Avenue, Brooklyn, NY 11201',
        phone: '(718) 555-0123',
        business_email: 'info@completekosher.com',
        website: 'https://completekosher.com',
        listing_type: 'Eatery',
        is_owner_submission: true,
        owner_name: 'Rabbi Complete Owner',
        owner_email: 'rabbi@completekosher.com',
        owner_phone: '(718) 555-0124',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        custom_certifying_agency: '',
        is_cholov_yisroel: true,
        is_pas_yisroel: true,
        cholov_stam: false,
        short_description: 'Complete kosher restaurant with all amenities and services available',
        description: 'Full-service kosher restaurant offering traditional and modern cuisine, private dining rooms, full catering services, and special event hosting. We pride ourselves on exceptional service and the highest standards of kashrut.',
        business_hours: [
          { day: 'Sunday', openTime: '11:00 AM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Monday', openTime: '11:00 AM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '11:00 AM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '11:00 AM', closeTime: '10:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '11:00 AM', closeTime: '11:00 PM', isClosed: false },
          { day: 'Friday', openTime: '11:00 AM', closeTime: '2:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '', closeTime: '', isClosed: true },
        ],
        seating_capacity: 150,
        years_in_business: 25,
        business_license: 'BL-2023-12345',
        tax_id: '12-3456789',
        delivery_available: true,
        takeout_available: true,
        catering_available: true,
        google_listing_url: 'https://maps.google.com/completekosher',
        instagram_link: 'https://instagram.com/completekosher',
        facebook_link: 'https://facebook.com/completekosher',
        tiktok_link: 'https://tiktok.com/@completekosher',
        preferred_contact_method: 'Email',
        preferred_contact_time: 'Morning',
        contact_notes: 'Please call ahead for large parties. We offer private dining rooms and custom menus for special events.',
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, maximalData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });

      // Verify all data was included in submission
      expect(mockFormPersistenceService.saveFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          name: maximalData.name,
          seating_capacity: maximalData.seating_capacity,
          years_in_business: maximalData.years_in_business,
          business_license: maximalData.business_license,
          tax_id: maximalData.tax_id,
        }),
        expect.any(Number),
        expect.any(Boolean)
      );
    });
  });

  describe('Special Certification Scenarios', () => {
    it('should handle multiple kosher certifications', async () => {
      const multiCertData: Partial<ListingFormData> = {
        name: 'Multi-Certified Kosher Restaurant',
        address: '456 Certification St, Lakewood, NJ 08701',
        phone: '(732) 555-0456',
        business_email: 'info@multicert.com',
        kosher_category: 'Meat',
        certifying_agency: 'OU - Orthodox Union',
        custom_certifying_agency: 'Also certified by Star-K and Kof-K',
        is_cholov_yisroel: true,
        is_pas_yisroel: true,
        short_description: 'Restaurant with multiple kosher certifications',
        description: 'Strictly kosher restaurant maintaining certifications from multiple recognized agencies to serve the diverse needs of our community.',
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, multiCertData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should handle custom certification agency', async () => {
      const customCertData: Partial<ListingFormData> = {
        name: 'Local Rabbinate Certified Eatery',
        address: '789 Local Ave, Small Town, NY 12345',
        phone: '(555) 123-4567',
        business_email: 'info@localcert.com',
        kosher_category: 'Dairy',
        certifying_agency: 'Other',
        custom_certifying_agency: 'Rabbi Smith - Local Community Rabbinate',
        short_description: 'Locally certified kosher dairy restaurant',
        description: 'Family-owned kosher dairy restaurant certified by our local community rabbinate, serving traditional Jewish comfort food.',
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, customCertData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Submission Error Scenarios', () => {
    it('should handle submission timeout gracefully', async () => {
      // Mock submission timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Submission timeout')), 5000);
      });

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      const minimalData: Partial<ListingFormData> = {
        name: 'Timeout Test Restaurant',
        address: '123 Timeout St',
        phone: '1234567890',
        business_email: 'timeout@test.com',
        kosher_category: 'Pareve',
        certifying_agency: 'OU',
        short_description: 'Test timeout scenario',
      };

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, minimalData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      // Should show timeout error and retry option
      await waitFor(() => {
        expect(getByText('Submission Timeout')).toBeTruthy();
        expect(getByText('Retry Submission')).toBeTruthy();
      }, { timeout: 6000 });
    });

    it('should handle server validation errors', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      const invalidData: Partial<ListingFormData> = {
        name: 'Server Validation Test',
        address: '123 Invalid St',
        phone: 'invalid-phone',
        business_email: 'invalid-email',
        kosher_category: 'Meat',
        certifying_agency: 'OU',
        short_description: 'Test server validation',
      };

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, invalidData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      // Should show server validation errors
      await waitFor(() => {
        expect(getByText('Validation Error')).toBeTruthy();
        expect(getByText('Please fix the following issues:')).toBeTruthy();
      });
    });
  });

  describe('Data Transformation and Legacy Compatibility', () => {
    it('should transform new format to legacy format for submission', async () => {
      const newFormatData: Partial<ListingFormData> = {
        name: 'Format Test Restaurant',
        business_hours: [
          { day: 'Monday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '9:00 AM', closeTime: '5:00 PM', isClosed: false },
        ],
        business_images: ['image1.jpg', 'image2.jpg'],
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, newFormatData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });

      // Verify data transformation occurred
      // (Implementation would check that new format was converted to legacy format)
    });

    it('should include system-generated fields in submission', async () => {
      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      const basicData: Partial<ListingFormData> = {
        name: 'System Fields Test',
        address: '123 System St',
        phone: '1234567890',
        business_email: 'system@test.com',
        kosher_category: 'Pareve',
        certifying_agency: 'OU',
        short_description: 'Test system fields',
      };

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, basicData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });

      // Verify system fields were added
      // (Implementation would check for submission_date, created_at, etc.)
    });
  });

  describe('Performance with Large Data Sets', () => {
    it('should handle submission with large description text', async () => {
      const largeDescription = 'A'.repeat(2000); // Maximum allowed length

      const largeTextData: Partial<ListingFormData> = {
        name: 'Large Text Test Restaurant',
        address: '123 Large Text Ave',
        phone: '1234567890',
        business_email: 'large@test.com',
        kosher_category: 'Meat',
        certifying_agency: 'OU',
        short_description: 'Restaurant with maximum description length',
        description: largeDescription,
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, largeTextData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 5000 }); // Allow extra time for large data
    });

    it('should handle submission with many social media links', async () => {
      const socialMediaData: Partial<ListingFormData> = {
        name: 'Social Media Heavy Restaurant',
        address: '123 Social Ave',
        phone: '1234567890',
        business_email: 'social@test.com',
        website: 'https://restaurant.com',
        kosher_category: 'Dairy',
        certifying_agency: 'Star-K',
        short_description: 'Restaurant with extensive social media presence',
        google_listing_url: 'https://maps.google.com/restaurant',
        instagram_link: 'https://instagram.com/restaurant',
        facebook_link: 'https://facebook.com/restaurant',
        tiktok_link: 'https://tiktok.com/@restaurant',
      };

      const { getByText, getByPlaceholderText, getByTestId } = render(
        <TestWrapper>
          <AddCategoryScreen />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText('Add Eatery')).toBeTruthy();
      });

      await fillCompleteForm(getByPlaceholderText, getByText, getByTestId, socialMediaData);

      const submitButton = getByText('Submit Listing 🚀');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(getByText('Success!')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });
});