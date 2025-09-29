import { useState, useEffect, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

// Global location state to share across all components
let globalLocationState: LocationState = {
  location: null,
  loading: false,
  error: null,
  permissionGranted: false,
  permissionRequested: false,
};

// Listeners for state changes
const listeners = new Set<(state: LocationState) => void>();

const notifyListeners = () => {
  console.log('🔥 Location state changed:', {
    listeners: listeners.size,
    hasLocation: !!globalLocationState.location 
  });
  listeners.forEach(listener => listener(globalLocationState));
};

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionGranted: boolean;
  permissionRequested: boolean;
}

// Calculate distance between two coordinates in miles
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useLocation = () => {
  const [state, setState] = useState<LocationState>(globalLocationState);

  // Subscribe to global state changes
  useEffect(() => {
    const listener = (newState: LocationState) => {
      setState(newState);
    };
    
    listeners.add(listener);
    
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Update global state and notify listeners
  const updateGlobalState = useCallback((updater: (prev: LocationState) => LocationState) => {
    const newState = updater(globalLocationState);
    console.log('🔥 Updating global location state:', {
      oldLocation: globalLocationState.location ? 'has location' : 'no location',
      newLocation: newState.location ? 'has location' : 'no location',
      listeners: listeners.size 
    });
    globalLocationState = newState;
    notifyListeners();
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // For iOS, we need to actually get the location to trigger the permission dialog
      try {
        updateGlobalState(prev => ({ ...prev, loading: true, error: null }));
        
        return new Promise((resolve) => {
          Geolocation.getCurrentPosition(
            (position) => {
              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              };

              updateGlobalState(prev => ({
                ...prev,
                location: locationData,
                loading: false,
                error: null,
                permissionGranted: true,
                permissionRequested: true,
              }));
              
              resolve(true);
            },
            (error) => {
              console.error('🔥 iOS location permission error:', error);
              updateGlobalState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
                permissionGranted: false,
                permissionRequested: true,
              }));
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        });
      } catch (err) {
        console.error('Error requesting iOS location permission:', err);
        updateGlobalState(prev => ({ ...prev, error: 'Failed to request location permission' }));
        return false;
      }
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Jewgo needs access to your location to show nearby Jewish community locations and calculate distances.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      updateGlobalState(prev => ({ ...prev, permissionGranted: isGranted, permissionRequested: true }));
      return isGranted;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      updateGlobalState(prev => ({ ...prev, error: 'Failed to request location permission' }));
      return false;
    }
  }, [updateGlobalState]);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!state.permissionGranted && !state.permissionRequested) {
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        return null;
      }
    }

    updateGlobalState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          updateGlobalState(prev => ({
            ...prev,
            location: locationData,
            loading: false,
            error: null,
          }));

          resolve(locationData);
        },
        (error) => {
          console.error('Error getting location:', error);
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location unavailable';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out';
              break;
          }

          updateGlobalState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage,
            permissionGranted: false,
          }));

          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }, [state.permissionGranted, state.permissionRequested, requestLocationPermission, updateGlobalState]);

  const watchLocation = useCallback(() => {
    if (!state.permissionGranted) {
      return;
    }

    const watchId = Geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        setState(prev => ({
          ...prev,
          location: locationData,
          error: null,
        }));
      },
      (error) => {
        console.error('Error watching location:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to watch location',
        }));
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000, // Update every 5 seconds
      }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, [state.permissionGranted]);

  // Auto-request location on mount
  useEffect(() => {
    if (Platform.OS === 'ios') {
      // On iOS, assume permission is granted if in Info.plist
      setState(prev => ({ ...prev, permissionGranted: true, permissionRequested: true }));
    }
  }, []);

  return {
    ...state,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    calculateDistance,
  };
};
