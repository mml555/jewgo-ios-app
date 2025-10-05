import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS, Permission } from 'react-native-permissions';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  accuracyAuthorization?: 'full' | 'reduced';
}

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'undetermined' | 'granted' | 'denied' | 'restricted';
  accuracyAuthorization: 'full' | 'reduced' | 'unknown';
  timeToFirstFix: number | null;
  lastKnownLocation: LocationData | null;
}

export interface LocationConfig {
  desiredAccuracy: 'high' | 'balanced' | 'low';
  distanceFilter: number;
  timeout: number;
  maximumAge: number;
}

// Constants
const LOCATION_CACHE_KEY = 'jewgo_last_known_location';
const LOCATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_RADIUS_M = 25000; // 25km server-side cap
const MAX_LIMIT = 50;

// Default configuration
const DEFAULT_CONFIG: LocationConfig = {
  desiredAccuracy: 'high',
  distanceFilter: 25, // meters
  timeout: 8000, // 8 seconds
  maximumAge: 2 * 60 * 1000, // 2 minutes
};

class LocationService {
  private state: LocationState = {
    location: null,
    loading: false,
    error: null,
    permissionStatus: 'undetermined',
    accuracyAuthorization: 'unknown',
    timeToFirstFix: null,
    lastKnownLocation: null,
  };

  private listeners: Set<(state: LocationState) => void> = new Set();
  private watchId: number | null = null;
  private startTime: number = 0;

  constructor() {
    this.loadCachedLocation();
  }

  // Subscribe to location state changes
  subscribe(listener: (state: LocationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Update state and notify listeners
  private updateState(updates: Partial<LocationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  // Load cached location
  private async loadCachedLocation(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const locationData: LocationData = JSON.parse(cached);
        const age = Date.now() - locationData.timestamp;
        
        if (age <= LOCATION_CACHE_TTL) {
          this.updateState({ lastKnownLocation: locationData });
        }
      }
    } catch (error) {
      console.warn('Failed to load cached location:', error);
    }
  }

  // Cache location
  private async cacheLocation(location: LocationData): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
      this.updateState({ lastKnownLocation: location });
    } catch (error) {
      console.warn('Failed to cache location:', error);
    }
  }

  // Get iOS permission
  private getIOSPermission(): Permission {
    return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  }

  // Request location permission
  async requestPermission(): Promise<boolean> {
    try {
      this.updateState({ loading: true, error: null });

      const permission = this.getIOSPermission();
      const result = await request(permission);

      let permissionStatus: LocationState['permissionStatus'];
      switch (result) {
        case RESULTS.GRANTED:
          permissionStatus = 'granted';
          break;
        case RESULTS.DENIED:
          permissionStatus = 'denied';
          break;
        case RESULTS.BLOCKED:
          permissionStatus = 'restricted';
          break;
        default:
          permissionStatus = 'undetermined';
      }

      this.updateState({ 
        permissionStatus, 
        loading: false 
      });

      return result === RESULTS.GRANTED;
    } catch (error) {
      this.updateState({ 
        error: 'Failed to request location permission',
        loading: false 
      });
      return false;
    }
  }

  // Check accuracy authorization (iOS 14+)
  private checkAccuracyAuthorization(): 'full' | 'reduced' | 'unknown' {
    if (Platform.OS !== 'ios') {
      return 'full'; // Android doesn't have this concept
    }

    // For iOS 14+, we need to check the accuracy authorization
    // This is a simplified check - in a real implementation, you'd use
    // the native module to get the actual authorization status
    return 'full'; // Default to full for now
  }

  // Get current location with proper error handling
  async getCurrentLocation(config: Partial<LocationConfig> = {}): Promise<LocationData | null> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    
    // Check permission first
    if (this.state.permissionStatus !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return this.getFallbackLocation();
      }
    }

    this.updateState({ loading: true, error: null });
    this.startTime = Date.now();

    return new Promise((resolve) => {
      const options = {
        enableHighAccuracy: finalConfig.desiredAccuracy === 'high',
        timeout: finalConfig.timeout,
        maximumAge: finalConfig.maximumAge,
        distanceFilter: finalConfig.distanceFilter,
      };

      Geolocation.getCurrentPosition(
        (position) => {
          const timeToFirstFix = Date.now() - this.startTime;
          const accuracyAuthorization = this.checkAccuracyAuthorization();

          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            accuracyAuthorization,
          };

          // Cache the location
          this.cacheLocation(locationData);

          this.updateState({
            location: locationData,
            loading: false,
            error: null,
            accuracyAuthorization,
            timeToFirstFix,
          });

          // Log telemetry (redacted)
          this.logTelemetry('location_success', {
            accuracy: position.coords.accuracy,
            timeToFirstFix,
            accuracyAuthorization,
            hasCachedLocation: !!this.state.lastKnownLocation,
          });

          resolve(locationData);
        },
        (error) => {
          const timeToFirstFix = Date.now() - this.startTime;
          let errorMessage = 'Failed to get location';
          let errorClass = 'unknown';

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied';
              errorClass = 'permission_denied';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location unavailable';
              errorClass = 'position_unavailable';
              break;
            case 3: // TIMEOUT
              errorMessage = 'Location request timed out';
              errorClass = 'timeout';
              break;
          }

          this.updateState({
            loading: false,
            error: errorMessage,
            timeToFirstFix,
          });

          // Log telemetry
          this.logTelemetry('location_error', {
            errorCode: error.code,
            errorClass,
            timeToFirstFix,
            hasCachedLocation: !!this.state.lastKnownLocation,
          });

          // Try fallback
          const fallbackLocation = this.getFallbackLocation();
          resolve(fallbackLocation);
        },
        options
      );
    });
  }

  // Get fallback location (cached or coarse)
  private getFallbackLocation(): LocationData | null {
    if (this.state.lastKnownLocation) {
      const age = Date.now() - this.state.lastKnownLocation.timestamp;
      if (age <= LOCATION_CACHE_TTL) {
        this.logTelemetry('location_fallback', {
          type: 'cached',
          age,
        });
        return this.state.lastKnownLocation;
      }
    }

    // Return null for coarse fallback - let the UI handle it
    this.logTelemetry('location_fallback', {
      type: 'coarse',
    });
    return null;
  }

  // Start watching location
  startWatching(config: Partial<LocationConfig> = {}): void {
    if (this.watchId !== null) {
      return; // Already watching
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    const options = {
      enableHighAccuracy: finalConfig.desiredAccuracy === 'high',
      timeout: finalConfig.timeout,
      maximumAge: finalConfig.maximumAge,
      distanceFilter: finalConfig.distanceFilter,
    };

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const accuracyAuthorization = this.checkAccuracyAuthorization();
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          accuracyAuthorization,
        };

        this.cacheLocation(locationData);
        this.updateState({
          location: locationData,
          accuracyAuthorization,
        });
      },
      (error) => {
        console.warn('Location watch error:', error);
        this.updateState({
          error: 'Location watch failed',
        });
      },
      options
    );
  }

  // Stop watching location
  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Handle reduced accuracy (iOS 14+)
  async handleReducedAccuracy(): Promise<void> {
    if (this.state.accuracyAuthorization !== 'reduced') {
      return;
    }

    // Show one-time explainer
    Alert.alert(
      'Improve Location Accuracy',
      'For more accurate distances to nearby businesses, you can enable precise location in Settings.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Settings', 
          onPress: () => Linking.openSettings() 
        }
      ]
    );
  }

  // Get current state
  getState(): LocationState {
    return this.state;
  }

  // Log telemetry (with privacy considerations)
  private logTelemetry(event: string, data: Record<string, any>): void {
    // Redact sensitive data
    const sanitizedData = {
      ...data,
      // Don't log actual coordinates unless user opted into diagnostics
      latitude: undefined,
      longitude: undefined,
    };

    console.log(`📍 Location Telemetry [${event}]:`, sanitizedData);
    
    // In production, send to analytics service
    // analytics.track(event, sanitizedData);
  }

  // Validate location data
  private isValidLocation(location: LocationData): boolean {
    return (
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number' &&
      !isNaN(location.latitude) &&
      !isNaN(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180
    );
  }

  // Check if location services are enabled
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Geolocation.getCurrentPosition(
        () => true,
        () => false,
        { timeout: 1000, maximumAge: 0 }
      ) !== null;
    } catch {
      return false;
    }
  }

  // Handle app resume (invalidate cached location if user traveled)
  async handleAppResume(): Promise<void> {
    if (!this.state.location || !this.state.lastKnownLocation) {
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastUpdate = currentTime - this.state.location.timestamp;
    
    // If it's been more than 5 minutes, invalidate cache
    if (timeSinceLastUpdate > 5 * 60 * 1000) {
      this.updateState({ lastKnownLocation: null });
      await AsyncStorage.removeItem(LOCATION_CACHE_KEY);
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
