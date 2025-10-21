import { useCallback, useEffect } from 'react';
import * as Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform } from 'react-native';
import { debugLog, errorLog } from '../utils/logger';
import { reverseGeocode } from '../utils/geocoding';
import { useLocationStore, LocationData } from '../stores/locationStore';

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
  const {
    location,
    loading,
    error,
    permissionGranted,
    permissionRequested,
    permissionDenied,
    setLocation,
    setLoading,
    setError,
    setPermissionState,
  } = useLocationStore();

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      // For iOS, we need to actually get the location to trigger the permission dialog
      try {
        setLoading(true);

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
              } catch (err) {
                // Silently fail - zip code is optional
                debugLog('⚠️ Failed to reverse geocode location:', err);
              }

              setLocation(locationData);
              setPermissionState(true, true, false);
              setLoading(false);
              resolve(true);
            },
            err => {
              errorLog('🔥 iOS location permission error:', err);
              const isDenied = err.code === 1; // PERMISSION_DENIED
              setPermissionState(false, true, isDenied);
              setError(err.message);
              resolve(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
          );
        });
      } catch (err) {
        errorLog('Error requesting iOS location permission:', err);
        setError('Failed to request location permission');
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
      const isDenied = granted === PermissionsAndroid.RESULTS.DENIED;
      setPermissionState(isGranted, true, isDenied);
      return isGranted;
    } catch (err) {
      errorLog('Error requesting location permission:', err);
      setError('Failed to request location permission');
      return false;
    }
  }, [setLocation, setLoading, setError, setPermissionState]);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!permissionGranted && !permissionRequested) {
      const granted = await requestLocationPermission();
      if (!granted) {
        return null;
      }
    }

    setLoading(true);
    setError(null);

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
          } catch (err) {
            // Silently fail - zip code is optional
            debugLog('⚠️ Failed to reverse geocode location:', err);
          }

          // Only update if location changed significantly (more than 50 meters)
          if (location) {
            const distanceMeters =
              calculateDistance(
                location.latitude,
                location.longitude,
                locationData.latitude,
                locationData.longitude,
              ) * 1609.34; // Convert miles to meters

            // Only update if moved more than 50 meters
            if (distanceMeters <= 50) {
              setLoading(false);
              resolve(location);
              return;
            }
          }

          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        err => {
          errorLog('Error getting location:', err);
          let errorMessage = 'Failed to get location';

          switch (err.code) {
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

          const isDenied = err.code === 1; // PERMISSION_DENIED
          setPermissionState(false, true, isDenied);
          setError(errorMessage);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }, [permissionGranted, permissionRequested, requestLocationPermission, location, setLocation, setLoading, setError, setPermissionState]);

  const watchLocation = useCallback(() => {
    if (!permissionGranted) {
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
        } catch (err) {
          // Silently fail - zip code is optional
          debugLog('⚠️ Failed to reverse geocode location:', err);
        }

        // Only update if location changed significantly (more than 50 meters)
        if (location) {
          const distanceMeters =
            calculateDistance(
              location.latitude,
              location.longitude,
              locationData.latitude,
              locationData.longitude,
            ) * 1609.34; // Convert miles to meters

          // Only update if moved more than 50 meters to reduce excessive updates
          if (distanceMeters <= 50) {
            return;
          }
        }

        setLocation(locationData);
      },
      err => {
        errorLog('Error watching location:', err);
        setError('Failed to watch location');
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
  }, [permissionGranted, location, setLocation, setError]);

  // Auto-request location on mount - ONLY for iOS to set permission status
  // Actual location fetching happens lazily when needed
  useEffect(() => {
    let isMounted = true;

    const initializePermissions = async () => {
      if (Platform.OS === 'ios') {
        // On iOS, just set permission as granted (assuming Info.plist is configured)
        // Don't fetch location automatically to prevent cascading updates
        if (isMounted) {
          setPermissionState(true, true, false);
        }
      }
      // On Android, don't do anything - let user trigger permission request
    };

    // Small delay to ensure hook is fully initialized
    const timer = setTimeout(initializePermissions, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [setPermissionState]);

  return {
    location,
    loading,
    error,
    permissionGranted,
    permissionRequested,
    permissionDenied,
    requestLocationPermission,
    getCurrentLocation,
    watchLocation,
    calculateDistance,
  };
};
