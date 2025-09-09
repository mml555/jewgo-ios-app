import { useState, useEffect, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

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
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    permissionGranted: false,
    permissionRequested: false,
  });

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // iOS permissions are handled in Info.plist
      return true;
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
      setState(prev => ({ ...prev, permissionGranted: isGranted, permissionRequested: true }));
      return isGranted;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setState(prev => ({ ...prev, error: 'Failed to request location permission' }));
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!state.permissionGranted && !state.permissionRequested) {
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        return null;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
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

          setState(prev => ({
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
  }, [state.permissionGranted, state.permissionRequested, requestLocationPermission]);

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
