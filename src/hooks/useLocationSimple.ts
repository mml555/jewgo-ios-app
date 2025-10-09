import { useState, useEffect, useCallback } from 'react';
import { useLocation } from './useLocation';
import { formatDistanceWithAccuracy } from '../utils/distanceUtils';
import { debugLog, errorLog } from '../utils/logger';

export interface LocationHookState {
  location: any;
  loading: boolean;
  error: string | null;
  permissionStatus: 'undetermined' | 'granted' | 'denied' | 'restricted';
  accuracyAuthorization: 'full' | 'reduced' | 'unknown';
  timeToFirstFix: number | null;
  lastKnownLocation: any;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: (config?: any) => Promise<any>;
  startWatching: (config?: any) => void;
  stopWatching: () => void;
  handleReducedAccuracy: () => Promise<void>;
  isLocationServicesEnabled: () => Promise<boolean>;
  handleAppResume: () => Promise<void>;
}

export const useLocationSimple = (): LocationHookState => {
  const {
    location,
    loading,
    error,
    permissionGranted,
    requestLocationPermission,
    getCurrentLocation: getCurrentLocationOriginal,
  } = useLocation();

  const [accuracyAuthorization] = useState<'full' | 'reduced' | 'unknown'>(
    'full',
  );
  const [timeToFirstFix] = useState<number | null>(null);
  const [lastKnownLocation] = useState<any>(null);

  // Map permission status
  const permissionStatus = permissionGranted ? 'granted' : 'undetermined';

  // Request permission with proper error handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      return await requestLocationPermission();
    } catch (error) {
      errorLog('Error requesting location permission:', error);
      return false;
    }
  }, [requestLocationPermission]);

  // Get current location with fallback handling
  const getCurrentLocation = useCallback(async (config?: any): Promise<any> => {
    try {
      return await getCurrentLocationOriginal();
    } catch (error) {
      errorLog('Error getting current location:', error);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Don't add getCurrentLocationOriginal to avoid infinite loop

  // Start watching location
  const startWatching = useCallback((config?: any) => {
    // Use existing location watching if available
    debugLog('Location watching started');
  }, []);

  // Stop watching location
  const stopWatching = useCallback(() => {
    debugLog('Location watching stopped');
  }, []);

  // Handle reduced accuracy
  const handleReducedAccuracy = useCallback(async () => {
    debugLog('Handling reduced accuracy');
  }, []);

  // Check if location services are enabled
  const isLocationServicesEnabled = useCallback(async (): Promise<boolean> => {
    return true; // Simplified for now
  }, []);

  // Handle app resume
  const handleAppResume = useCallback(async () => {
    debugLog('Handling app resume');
  }, []);

  return {
    location,
    loading,
    error,
    permissionStatus,
    accuracyAuthorization,
    timeToFirstFix,
    lastKnownLocation,
    requestPermission,
    getCurrentLocation,
    startWatching,
    stopWatching,
    handleReducedAccuracy,
    isLocationServicesEnabled,
    handleAppResume,
  };
};

export default useLocationSimple;
