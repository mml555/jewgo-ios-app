import { configService } from '../config/ConfigService';
import { debugLog, errorLog } from './logger';

// Cache for reverse geocoding to prevent excessive API calls
const geocodeCache = new Map<
  string,
  {
    zipCode: string;
    city: string;
    state: string;
    timestamp: number;
  }
>();
const CACHE_DURATION = 300000; // 5 minutes in milliseconds

/**
 * Reverse geocode coordinates to get address components including zip code
 * Includes caching to prevent excessive API calls
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<{ zipCode: string; city: string; state: string } | null> => {
  try {
    // TEMPORARY FIX: Disable reverse geocoding to prevent API errors
    debugLog('⚠️ Reverse geocoding temporarily disabled to prevent API errors');
    return null;

    /* Commented out temporarily - uncomment when re-enabling reverse geocoding
    // Create cache key (round to 4 decimal places = ~11m precision)
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

    // Check cache first
    const cached = geocodeCache.get(cacheKey);
    if (cached && Date.now() - cached!.timestamp < CACHE_DURATION) {
      // Return cached result without logging to reduce console noise
      return {
        zipCode: cached!.zipCode,
        city: cached!.city,
        state: cached!.state,
      };
    }

    const apiKey = configService.googlePlacesApiKey;

    if (!apiKey || apiKey === 'YOUR_GOOGLE_PLACES_API_KEY_HERE') {
      debugLog('Google Places API key not configured for reverse geocoding');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const addressComponents = data.results[0].address_components;

      let zipCode = '';
      let city = '';
      let state = '';

      // Extract zip code, city, and state from address components
      for (const component of addressComponents) {
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
        }
        if (component.types.includes('locality')) {
          city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
      }

      if (zipCode) {
        // Store in cache
        geocodeCache.set(cacheKey, {
          zipCode,
          city,
          state,
          timestamp: Date.now(),
        });

        debugLog('✅ Reverse geocoded successfully:', { zipCode, city, state });
        return { zipCode, city, state };
      }
    }

    debugLog('⚠️ No zip code found in reverse geocoding response');
    return null;
    */
  } catch (error) {
    errorLog('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Format location string for display
 */
export const formatLocationDisplay = (
  zipCode?: string,
  city?: string,
  state?: string,
): string => {
  if (zipCode) {
    if (city && state) {
      return `${city}, ${state} ${zipCode}`;
    }
    return zipCode;
  }
  return 'Location unknown';
};
