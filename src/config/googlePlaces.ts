// Google Places API Configuration
// Get your API key from: https://console.cloud.google.com/
// Enable the following APIs:
// - Places API
// - Maps JavaScript API
// - Geocoding API

import { configService } from './ConfigService';

// API Configuration
export const GOOGLE_PLACES_CONFIG = {
  key: configService.googlePlacesApiKey,
  language: 'en',
  components: 'country:us', // Restrict to US addresses
  types: 'establishment', // Focus on business establishments
};
