import { useState, useEffect, useCallback } from 'react';
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert } from 'react-native';
import { debugLog, errorLog } from '../utils/logger';
import { reverseGeocode } from '../utils/geocoding';

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

// Track last notified state to prevent unnecessary updates
let lastNotifiedState: LocationState | null = null;

// Throttle notifications to prevent excessive re-renders
let notificationTimeout: NodeJS.Timeout | null = null;
const NOTIFICATION_THROTTLE = 100; // ms

const notifyListeners = () => {
  // Cancel pending notification
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }

  notificationTimeout = setTimeout(() => {
    // Shallow comparison - only notify if state actually changed
    if (lastNotifiedState) {
      const locationChanged =
        lastNotifiedState.location?.latitude !==
          globalLocationState.location?.latitude ||
        lastNotifiedState.location?.longitude !==
          globalLocationState.location?.longitude ||
        lastNotifiedState.location?.zipCode !==
          globalLocationState.location?.zipCode;

      const statusChanged =
        lastNotifiedState.loading !== globalLocationState.loading ||
        lastNotifiedState.error !== globalLocationState.error ||
        lastNotifiedState.permissionGranted !==
          globalLocationState.permissionGranted;

      // Only notify if something actually changed
      if (!locationChanged && !statusChanged) {
        return;
      }
    }

    // Update last notified state
    lastNotifiedState = { ...globalLocationState };

    // Only log location changes very occasionally to reduce console noise
    if (__DEV__ && Math.random() < 0.01) {
      debugLog('🔥 Location state changed:', {
        listeners: listeners.size,
        hasLocation: !!globalLocationState.location,
        location: globalLocationState.location
          ? `${globalLocationState.location.latitude}, ${globalLocationState.location.longitude}`
          : 'null',
        zipCode: globalLocationState.location?.zipCode,
        permissionGranted: globalLocationState.permissionGranted,
        permissionRequested: globalLocationState.permissionRequested,
        loading: globalLocationState.loading,
        error: globalLocationState.error,
      });
    }

    listeners.forEach(listener => listener(globalLocationState));
  }, NOTIFICATION_THROTTLE);
};

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  zipCode?: string;
  city?: string;
  state?: string;
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
  lon2: number,
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
  const updateGlobalState = useCallback(
    (updater: (prev: LocationState) => LocationState) => {
      const newState = updater(globalLocationState);
      // debugLog('🔥 Updating global location state:', {
      //   oldLocation: globalLocationState.location ? 'has location' : 'no location',
      //   newLocation: newState.location ? 'has location' : 'no location',
      //   listeners: listeners.size
      // });
      globalLocationState = newState;
      notifyListeners();
    },
    [],
  );

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // For iOS, we need to actually get the location to trigger the permission dialog
      try {
        updateGlobalState(prev => ({ ...prev, loading: true, error: null }));

        return new Promise(resolve => {
          Geolocation.getCurrentPosition(
            async position => {
              const locationData: LocationData = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                timestamp: position.timestamp,
              };

              // Reverse geocode to get zip code
              try {
                const addressInfo = await reverseGeocode(
                  position.coords.latitude,
                  position.coords.longitude,
                );
                if (addressInfo) {
                  locationData.zipCode = addressInfo.zipCode;
                  locationData.city = addressInfo.city;
                  locationData.state = addressInfo.state;
                }
              } catch (error) {
                // Silently fail - zip code is optional
                debugLog('⚠️ Failed to reverse geocode location:', error);
              }

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
            error => {
              errorLog('🔥 iOS location permission error:', error);
              updateGlobalState(prev => ({
                ...prev,
                loading: false,
                error: error.message,
                permissionGranted: false,
                permissionRequested: true,
              }));
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        });
      } catch (err) {
        errorLog('Error requesting iOS location permission:', err);
        updateGlobalState(prev => ({
          ...prev,
          error: 'Failed to request location permission',
        }));
        return false;
      }
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message:
            'Jewgo needs access to your location to show nearby Jewish community locations and calculate distances.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      updateGlobalState(prev => ({
        ...prev,
        permissionGranted: isGranted,
        permissionRequested: true,
      }));
      return isGranted;
    } catch (err) {
      errorLog('Error requesting location permission:', err);
      updateGlobalState(prev => ({
        ...prev,
        error: 'Failed to request location permission',
      }));
      return false;
    }
  }, [updateGlobalState]);

  const getCurrentLocation =
    useCallback(async (): Promise<LocationData | null> => {
      // Use globalLocationState instead of state to avoid dependency issues
      if (
        !globalLocationState.permissionGranted &&
        !globalLocationState.permissionRequested
      ) {
        const permissionGranted = await requestLocationPermission();
        if (!permissionGranted) {
          return null;
        }
      }

      updateGlobalState(prev => ({ ...prev, loading: true, error: null }));

      return new Promise(resolve => {
        Geolocation.getCurrentPosition(
          async position => {
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            };

            // Reverse geocode to get zip code
            try {
              const addressInfo = await reverseGeocode(
                position.coords.latitude,
                position.coords.longitude,
              );
              if (addressInfo) {
                locationData.zipCode = addressInfo.zipCode;
                locationData.city = addressInfo.city;
                locationData.state = addressInfo.state;
              }
            } catch (error) {
              // Silently fail - zip code is optional
              debugLog('⚠️ Failed to reverse geocode location:', error);
            }

            // Only update if location changed significantly (more than 50 meters)
            const prevLocation = globalLocationState.location;
            let shouldUpdate = true;

            if (prevLocation) {
              const distanceMeters =
                calculateDistance(
                  prevLocation.latitude,
                  prevLocation.longitude,
                  locationData.latitude,
                  locationData.longitude,
                ) * 1609.34; // Convert miles to meters

              // Only update if moved more than 50 meters to reduce excessive updates
              shouldUpdate = distanceMeters > 50;

              // Removed excessive logging to prevent memory issues
              // Only log very occasionally (0.1% of the time)
              if (!shouldUpdate && __DEV__ && Math.random() < 0.001) {
                debugLog(
                  '🔥 Location change too small, skipping update:',
                  distanceMeters.toFixed(2),
                  'meters',
                );
              }
            }

            if (shouldUpdate) {
              updateGlobalState(prev => ({
                ...prev,
                location: locationData,
                loading: false,
                error: null,
              }));
            } else {
              updateGlobalState(prev => ({
                ...prev,
                loading: false,
              }));
            }

            resolve(locationData);
          },
          error => {
            errorLog('Error getting location:', error);
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
          },
        );
      });
    }, [requestLocationPermission, updateGlobalState]);

  const watchLocation = useCallback(() => {
    if (!globalLocationState.permissionGranted) {
      return;
    }

    const watchId = Geolocation.watchPosition(
      async position => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        // Reverse geocode to get zip code
        try {
          const addressInfo = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
          );
          if (addressInfo) {
            locationData.zipCode = addressInfo.zipCode;
            locationData.city = addressInfo.city;
            locationData.state = addressInfo.state;
          }
        } catch (error) {
          // Silently fail - zip code is optional
          debugLog('⚠️ Failed to reverse geocode location:', error);
        }

        // Only update if location changed significantly (more than 50 meters)
        const prevLocation = globalLocationState.location;
        let shouldUpdate = true;

        if (prevLocation) {
          const distanceMeters =
            calculateDistance(
              prevLocation.latitude,
              prevLocation.longitude,
              locationData.latitude,
              locationData.longitude,
            ) * 1609.34; // Convert miles to meters

          // Only update if moved more than 50 meters to reduce excessive updates
          shouldUpdate = distanceMeters > 50;

          if (!shouldUpdate && __DEV__ && Math.random() < 0.1) {
            debugLog(
              '🔥 Location change too small in watch, skipping update:',
              distanceMeters.toFixed(2),
              'meters',
            );
          }
        }

        if (shouldUpdate) {
          updateGlobalState(prev => ({
            ...prev,
            location: locationData,
            error: null,
          }));
        }
      },
      error => {
        errorLog('Error watching location:', error);
        updateGlobalState(prev => ({
          ...prev,
          error: 'Failed to watch location',
        }));
      },
      {
        enableHighAccuracy: false, // Disable for better performance
        distanceFilter: 100, // Update every 100 meters (not 10)
        interval: 30000, // Update every 30 seconds (not 5)
        maximumAge: 60000, // Cache for 60 seconds
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, [updateGlobalState]);

  // Auto-request location on mount - ONLY for iOS to set permission status
  // Actual location fetching happens lazily when needed
  useEffect(() => {
    let isMounted = true;

    const initializePermissions = async () => {
      if (Platform.OS === 'ios') {
        // On iOS, just set permission as granted (assuming Info.plist is configured)
        // Don't fetch location automatically to prevent cascading updates
        if (isMounted) {
          updateGlobalState(prev => ({
            ...prev,
            permissionGranted: true,
            permissionRequested: true,
          }));
        }
      }
      // On Android, don't do anything - let user trigger permission request
    };

    // Small delay to ensure hook is fully initialized
    const timer = setTimeout(initializePermissions, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      // Clear any pending notifications
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
    };
  }, []); // Empty deps - only run once on mount

  return {
    ...state,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    calculateDistance,
  };
};
