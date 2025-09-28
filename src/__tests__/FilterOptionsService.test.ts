import { filterOptionsService } from '../services/FilterOptionsService';

// Mock the apiService
jest.mock('../services/api', () => ({
  apiService: {
    getListingsByCategory: jest.fn(),
  },
}));

describe('FilterOptionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and analyze filter options for restaurants', async () => {
    const mockListings = [
      {
        id: '1',
        name: 'Kosher Delight',
        kosher_level: 'glatt',
        price: '$$',
        city: 'Brooklyn',
        state: 'NY',
        hasParking: true,
        hasWifi: false,
        hasAccessibility: true,
      },
      {
        id: '2',
        name: 'Jerusalem Grill',
        kosher_level: 'glatt',
        price: '$$$',
        city: 'Manhattan',
        state: 'NY',
        hasParking: false,
        hasWifi: true,
        hasAccessibility: false,
      },
      {
        id: '3',
        name: 'Chabad House Cafe',
        kosher_level: 'chalav_yisrael',
        price: '$',
        city: 'Queens',
        state: 'NY',
        hasParking: true,
        hasWifi: true,
        hasAccessibility: true,
      },
    ];

    const { apiService } = require('../services/api');
    apiService.getListingsByCategory.mockResolvedValue({
      success: true,
      data: { listings: mockListings },
    });

    const result = await filterOptionsService.getFilterOptions('eatery');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.kosherLevels).toContainEqual({
      value: 'glatt',
      label: 'Glatt',
      count: 2,
    });
    expect(result.data?.kosherLevels).toContainEqual({
      value: 'chalav_yisrael',
      label: 'Chalav Yisrael',
      count: 1,
    });
    expect(result.data?.priceRanges).toContainEqual({
      value: '$',
      label: '$',
      count: 1,
    });
    expect(result.data?.cities).toContainEqual({
      value: 'Brooklyn',
      label: 'Brooklyn',
      count: 1,
    });
  });

  it('should fetch and analyze filter options for synagogues', async () => {
    const mockListings = [
      {
        id: '1',
        name: 'Congregation Beth Israel',
        denomination: 'orthodox',
        city: 'Brooklyn',
        state: 'NY',
        hasParking: true,
        hasWifi: false,
        hasLibrary: true,
        hasYouthPrograms: true,
      },
      {
        id: '2',
        name: 'Temple Emanuel',
        denomination: 'conservative',
        city: 'Manhattan',
        state: 'NY',
        hasParking: false,
        hasWifi: true,
        hasLibrary: false,
        hasYouthPrograms: false,
      },
    ];

    const { apiService } = require('../services/api');
    apiService.getListingsByCategory.mockResolvedValue({
      success: true,
      data: { listings: mockListings },
    });

    const result = await filterOptionsService.getFilterOptions('shul');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.denominations).toContainEqual({
      value: 'orthodox',
      label: 'Orthodox',
      count: 1,
    });
    expect(result.data?.denominations).toContainEqual({
      value: 'conservative',
      label: 'Conservative',
      count: 1,
    });
    expect(result.data?.amenities).toContainEqual({
      value: 'Parking Available',
      label: 'Parking Available',
      count: 1,
    });
  });

  it('should fetch and analyze filter options for stores', async () => {
    const mockListings = [
      {
        id: '1',
        name: 'Kosher World Market',
        store_type: 'grocery',
        city: 'Brooklyn',
        state: 'NY',
        hasParking: true,
        hasWifi: false,
      },
      {
        id: '2',
        name: 'Glatt Kosher Butcher',
        store_type: 'butcher',
        city: 'Manhattan',
        state: 'NY',
        hasParking: false,
        hasWifi: true,
      },
    ];

    const { apiService } = require('../services/api');
    apiService.getListingsByCategory.mockResolvedValue({
      success: true,
      data: { listings: mockListings },
    });

    const result = await filterOptionsService.getFilterOptions('stores');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.storeTypes).toContainEqual({
      value: 'grocery',
      label: 'Grocery',
      count: 1,
    });
    expect(result.data?.storeTypes).toContainEqual({
      value: 'butcher',
      label: 'Butcher',
      count: 1,
    });
  });

  it('should handle API errors gracefully', async () => {
    // Clear cache first to ensure fresh call
    filterOptionsService.clearCache();
    
    const { apiService } = require('../services/api');
    apiService.getListingsByCategory.mockResolvedValue({
      success: false,
      data: null,
    });

    const result = await filterOptionsService.getFilterOptions('eatery');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to fetch category data');
  });

  it('should cache filter options', async () => {
    // Clear cache first
    filterOptionsService.clearCache();

    const mockListings = [
      {
        id: '1',
        name: 'Test Restaurant',
        kosher_level: 'glatt',
        city: 'Test City',
        state: 'Test State',
      },
    ];

    const { apiService } = require('../services/api');
    apiService.getListingsByCategory.mockResolvedValue({
      success: true,
      data: { listings: mockListings },
    });

    // First call
    const result1 = await filterOptionsService.getFilterOptions('eatery');
    expect(result1.success).toBe(true);

    // Second call should use cache
    const result2 = await filterOptionsService.getFilterOptions('eatery');
    expect(result2.success).toBe(true);

    // API should only be called once
    expect(apiService.getListingsByCategory).toHaveBeenCalledTimes(1);
  });
});
