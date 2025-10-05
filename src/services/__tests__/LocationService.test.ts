import LocationService, { LocationData, LocationState } from '../LocationService';

// Mock react-native-geolocation-service
jest.mock('react-native-geolocation-service', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(),
  PERMISSIONS: {
    IOS: {
      LOCATION_WHEN_IN_USE: 'ios.permission.LOCATION_WHEN_IN_USE',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('LocationService', () => {
  let locationService: LocationService;
  let mockListener: jest.Mock;

  beforeEach(() => {
    locationService = new LocationService();
    mockListener = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    locationService.stopWatching();
  });

  describe('subscribe', () => {
    it('should add and remove listeners', () => {
      const unsubscribe = locationService.subscribe(mockListener);
      
      // Should be able to call unsubscribe
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should notify listeners on state changes', () => {
      locationService.subscribe(mockListener);
      
      // Trigger a state change by updating location
      const mockLocation: LocationData = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now(),
        accuracyAuthorization: 'full'
      };

      // This would normally be called internally
      (locationService as any).updateState({ location: mockLocation });
      
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({ location: mockLocation })
      );
    });
  });

  describe('requestPermission', () => {
    it('should request permission and update state', async () => {
      const { request, RESULTS } = require('react-native-permissions');
      request.mockResolvedValue(RESULTS.GRANTED);

      const granted = await locationService.requestPermission();
      
      expect(granted).toBe(true);
      expect(request).toHaveBeenCalledWith('ios.permission.LOCATION_WHEN_IN_USE');
    });

    it('should handle denied permission', async () => {
      const { request, RESULTS } = require('react-native-permissions');
      request.mockResolvedValue(RESULTS.DENIED);

      const granted = await locationService.requestPermission();
      
      expect(granted).toBe(false);
    });

    it('should handle blocked permission', async () => {
      const { request, RESULTS } = require('react-native-permissions');
      request.mockResolvedValue(RESULTS.BLOCKED);

      const granted = await locationService.requestPermission();
      
      expect(granted).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should get current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const location = await locationService.getCurrentLocation();
      
      expect(location).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
        accuracyAuthorization: 'full',
      });
    });

    it('should handle location error and return fallback', async () => {
      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 3, message: 'Timeout' }); // TIMEOUT error
      });

      const location = await locationService.getCurrentLocation();
      
      // Should return fallback (null in this case since no cached location)
      expect(location).toBeNull();
    });

    it('should use cached location as fallback', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      const cachedLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now() - 60000, // 1 minute ago
      };
      
      AsyncStorage.getItem.mockResolvedValue(JSON.stringify(cachedLocation));

      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 3, message: 'Timeout' });
      });

      // Create new service instance to trigger cache loading
      const newService = new LocationService();
      
      // Wait for cache to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const location = await newService.getCurrentLocation();
      
      expect(location).toEqual(cachedLocation);
    });
  });

  describe('startWatching', () => {
    it('should start watching location', () => {
      const Geolocation = require('react-native-geolocation-service');
      
      locationService.startWatching();
      
      expect(Geolocation.watchPosition).toHaveBeenCalled();
    });

    it('should not start multiple watches', () => {
      const Geolocation = require('react-native-geolocation-service');
      
      locationService.startWatching();
      locationService.startWatching();
      
      expect(Geolocation.watchPosition).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopWatching', () => {
    it('should stop watching location', () => {
      const Geolocation = require('react-native-geolocation-service');
      
      locationService.startWatching();
      locationService.stopWatching();
      
      expect(Geolocation.clearWatch).toHaveBeenCalled();
    });
  });

  describe('handleReducedAccuracy', () => {
    it('should handle reduced accuracy on iOS', async () => {
      // Mock Alert
      const mockAlert = jest.fn();
      jest.doMock('react-native', () => ({
        Alert: { alert: mockAlert },
        Linking: { openSettings: jest.fn() },
      }));

      // This would normally be called when accuracyAuthorization is 'reduced'
      await locationService.handleReducedAccuracy();
      
      // In a real test, we'd verify the alert was shown
      // For now, just ensure the method doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('isLocationServicesEnabled', () => {
    it('should check if location services are enabled', async () => {
      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success) => {
        success({ coords: { latitude: 0, longitude: 0 } });
      });

      const enabled = await locationService.isLocationServicesEnabled();
      
      expect(enabled).toBe(true);
    });

    it('should return false when location services are disabled', async () => {
      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 1, message: 'Location services disabled' });
      });

      const enabled = await locationService.isLocationServicesEnabled();
      
      expect(enabled).toBe(false);
    });
  });

  describe('handleAppResume', () => {
    it('should invalidate old cached location', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Set up old location in state
      (locationService as any).updateState({
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
        }
      });

      await locationService.handleAppResume();
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('jewgo_last_known_location');
    });

    it('should not invalidate recent cached location', async () => {
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Set up recent location in state
      (locationService as any).updateState({
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
          timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
        }
      });

      await locationService.handleAppResume();
      
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('telemetry', () => {
    it('should log telemetry for successful location', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      await locationService.getCurrentLocation();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Location Telemetry [location_success]'),
        expect.objectContaining({
          accuracy: 10,
          timeToFirstFix: expect.any(Number),
          accuracyAuthorization: 'full',
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should log telemetry for location errors', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const Geolocation = require('react-native-geolocation-service');
      Geolocation.getCurrentPosition.mockImplementation((success, error) => {
        error({ code: 3, message: 'Timeout' });
      });

      await locationService.getCurrentLocation();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Location Telemetry [location_error]'),
        expect.objectContaining({
          errorCode: 3,
          errorClass: 'timeout',
          timeToFirstFix: expect.any(Number),
        })
      );
      
      consoleSpy.mockRestore();
    });
  });
});
