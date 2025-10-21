/**
 * Simplified Location Service
 * Uses react-native-geolocation-service for better performance and reliability
 */

import * as Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';
import { safeAsyncStorage } from './SafeAsyncStorage';
import { debugLog, warnLog } from '../utils/logger';

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
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

// Default configuration
const DEFAULT_CONFIG: LocationConfig = {
  desiredAccuracy: 'high',
  distanceFilter: 25, // meters
  timeout: 8000, // 8 seconds
  maximumAge: 2 * 60 * 1000, // 2 minutes
};

class LocationServiceSimple {
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
      const cached = await safeAsyncStorage.getItem(LOCATION_CACHE_KEY);
      if (cached) {
        const locationData: LocationData = JSON.parse(cached);
        const age = Date.now() - locationData.timestamp;

        if (age <= LOCATION_CACHE_TTL) {
          this.updateState({ lastKnownLocation: locationData });
        }
      }
    } catch (error) {
      warnLog('Failed to load cached location:', error);
    }
  }

  // Cache location
  private async cacheLocation(location: LocationData): Promise<void> {
    try {
      await safeAsyncStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(location));
      this.updateState({ lastKnownLocation: location });
    } catch (error) {
      warnLog('Failed to cache location:', error);
    }
  }

  // Get current location with proper error handling
  async getCurrentLocation(
    config: Partial<LocationConfig> = {},
  ): Promise<LocationData | null> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    this.updateState({ loading: true, error: null });
    this.startTime = Date.now();

    return new Promise(resolve => {
      const options = {
        enableHighAccuracy: finalConfig.desiredAccuracy === 'high',
        timeout: finalConfig.timeout,
        maximumAge: finalConfig.maximumAge,
        distanceFilter: finalConfig.distanceFilter,
      };

      Geolocation.getCurrentPosition(
        position => {
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
            permissionStatus: 'granted',
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
        error => {
          const timeToFirstFix = Date.now() - this.startTime;
          let errorMessage = 'Failed to get location';
          let errorClass = 'unknown';

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied';
              errorClass = 'permission_denied';
              this.updateState({ permissionStatus: 'denied' });
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
        options,
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
      position => {
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
          permissionStatus: 'granted',
        });
      },
      error => {
        warnLog('Location watch error:', error);
        this.updateState({
          error: 'Location watch failed',
        });
      },
      options,
    );
  }

  // Stop watching location
  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
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

    debugLog(`📍 Location Telemetry [${event}]:`, sanitizedData);
  }

  // Check if location services are enabled
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await new Promise(resolve => {
        Geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 1000, maximumAge: 0 },
        );
      });
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
      await safeAsyncStorage.removeItem(LOCATION_CACHE_KEY);
    }
  }
}

// Export singleton instance
export const locationServiceSimple = new LocationServiceSimple();
export default locationServiceSimple;
