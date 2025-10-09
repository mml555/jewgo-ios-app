/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import CategoryGridScreen from '../src/screens/CategoryGridScreen';

// Mock the navigation and hooks
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useFilters', () => ({
  useFilters: () => ({
    filters: {
      maxDistance: 100,
      minRating: 0,
      priceRange: 'any',
      kosherLevel: 'any',
      denomination: 'any',
      storeType: 'any',
      city: '',
      state: '',
      hasParking: false,
      hasWifi: false,
      hasAccessibility: false,
      hasDelivery: false,
      hasPrivateRooms: false,
      hasHeating: false,
      hasAirConditioning: false,
      hasKosherKitchen: false,
      hasMikvah: false,
      hasLibrary: false,
      hasYouthPrograms: false,
      hasAdultEducation: false,
      hasSocialEvents: false,
      openNow: false,
      openWeekends: false,
    },
  }),
}));

jest.mock('../src/hooks/useLocation', () => ({
  useLocation: () => ({
    location: null,
    requestLocationPermission: jest.fn(),
    permissionGranted: false,
    getCurrentLocation: jest.fn(),
    loading: false,
  }),
  calculateDistance: jest.fn(() => 5),
}));

jest.mock('../src/hooks/useCategoryData', () => ({
  useCategoryData: () => ({
    data: [],
    loading: false,
    refreshing: false,
    hasMore: false,
    error: null,
    refresh: jest.fn(),
    loadMore: jest.fn(),
  }),
}));

test('renders CategoryGridScreen with hiring mode by default', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <CategoryGridScreen categoryKey="jobs" query="" jobMode="hiring" />,
    );
  });
});

test('renders CategoryGridScreen with seeking mode', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <CategoryGridScreen categoryKey="jobs" query="" jobMode="seeking" />,
    );
  });
});

test('renders CategoryGridScreen without job mode (non-jobs category)', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <CategoryGridScreen categoryKey="mikvah" query="" />,
    );
  });
});
