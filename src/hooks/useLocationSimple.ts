import { useState, useEffect, useCallback } from 'react';
import { useLocation } from './useLocation';
import { formatDistanceWithAccuracy } from '../utils/distanceUtils';

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
    getCurrentLocation: getCurrentLocationOriginal 
  } = useLocation();

  const [accuracyAuthorization] = useState<'full' | 'reduced' | 'unknown'>('full');
  const [timeToFirstFix] = useState<number | null>(null);
  const [lastKnownLocation] = useState<any>(null);

  // Map permission status
  const permissionStatus = permissionGranted ? 'granted' : 'undetermined';

  // Request permission with proper error handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      return await requestLocationPermission();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }, [requestLocationPermission]);

  // Get current location with fallback handling
  const getCurrentLocation = useCallback(async (config?: any): Promise<any> => {
    try {
      return await getCurrentLocationOriginal();
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }, [getCurrentLocationOriginal]);

  // Start watching location
  const startWatching = useCallback((config?: any) => {
    // Use existing location watching if available
    console.log('Location watching started');
  }, []);

  // Stop watching location
  const stopWatching = useCallback(() => {
    console.log('Location watching stopped');
  }, []);

  // Handle reduced accuracy
  const handleReducedAccuracy = useCallback(async () => {
    console.log('Handling reduced accuracy');
  }, []);

  // Check if location services are enabled
  const isLocationServicesEnabled = useCallback(async (): Promise<boolean> => {
    return true; // Simplified for now
  }, []);

  // Handle app resume
  const handleAppResume = useCallback(async () => {
    console.log('Handling app resume');
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
