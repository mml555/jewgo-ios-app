import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import locationService, {
  LocationData,
  LocationState,
  LocationConfig,
} from '../services/LocationService';
import { errorLog } from '../utils/logger';

export interface LocationHookState extends LocationState {
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: (
    config?: Partial<LocationConfig>,
  ) => Promise<LocationData | null>;
  startWatching: (config?: Partial<LocationConfig>) => void;
  stopWatching: () => void;
  handleReducedAccuracy: () => Promise<void>;
  isLocationServicesEnabled: () => Promise<boolean>;
  handleAppResume: () => Promise<void>;
}

export const useLocationHardened = (): LocationHookState => {
  const [state, setState] = useState<LocationState>(locationService.getState());
  const hasShownReducedAccuracyAlert = useRef(false);

  // Subscribe to location service updates
  useEffect(() => {
    const unsubscribe = locationService.subscribe(setState);
    return unsubscribe;
  }, []);

  // Handle reduced accuracy alert (show once)
  useEffect(() => {
    if (
      state.accuracyAuthorization === 'reduced' &&
      !hasShownReducedAccuracyAlert.current &&
      state.permissionStatus === 'granted'
    ) {
      hasShownReducedAccuracyAlert.current = true;
      handleReducedAccuracy();
    }
  }, [state.accuracyAuthorization, state.permissionStatus]);

  // Request permission with proper error handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await locationService.requestPermission();

      if (!granted) {
        // Show settings deep-link for denied permissions
        Alert.alert(
          'Location Access Required',
          'To show distances to nearby businesses, please enable location access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Settings',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
      }

      return granted;
    } catch (error) {
      errorLog('Error requesting location permission:', error);
      return false;
    }
  }, []);

  // Get current location with fallback handling
  const getCurrentLocation = useCallback(
    async (config?: Partial<LocationConfig>): Promise<LocationData | null> => {
      try {
        const location = await locationService.getCurrentLocation(config);

        if (!location) {
          // Show fallback message
          Alert.alert(
            'Location Unavailable',
            'Using approximate location based on your area. Enable precise location for accurate distances.',
            [
              { text: 'OK' },
              {
                text: 'Settings',
                onPress: () => Linking.openSettings(),
              },
            ],
          );
        }

        return location;
      } catch (error) {
        errorLog('Error getting current location:', error);
        return null;
      }
    },
    [],
  );

  // Start watching location
  const startWatching = useCallback((config?: Partial<LocationConfig>) => {
    locationService.startWatching(config);
  }, []);

  // Stop watching location
  const stopWatching = useCallback(() => {
    locationService.stopWatching();
  }, []);

  // Handle reduced accuracy
  const handleReducedAccuracy = useCallback(async () => {
    await locationService.handleReducedAccuracy();
  }, []);

  // Check if location services are enabled
  const isLocationServicesEnabled = useCallback(async (): Promise<boolean> => {
    return await locationService.isLocationServicesEnabled();
  }, []);

  // Handle app resume
  const handleAppResume = useCallback(async () => {
    await locationService.handleAppResume();
  }, []);

  return {
    ...state,
    requestPermission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    handleReducedAccuracy,
    isLocationServicesEnabled,
    handleAppResume,
  };
};

export default useLocationHardened;
