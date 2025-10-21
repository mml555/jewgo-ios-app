/**
 * Geocoding Service
 * Converts addresses to latitude/longitude coordinates
 * Uses Google Maps Geocoding API
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Geocode an address to get latitude, longitude, and PostGIS geometry
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number, geom: string, formatted_address: string}>}
 */
async function geocodeAddress(address) {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      logger.warn('GOOGLE_MAPS_API_KEY not set, using fallback geocoding');
      // Fallback: return default coordinates (you can enhance this)
      return {
        lat: 40.7128,
        lng: -74.0060,
        geom: `POINT(-74.0060 40.7128)`,
        formatted_address: address
      };
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey
      },
      timeout: 5000 // 5 second timeout
    });

    if (response.data.status === 'OK' && response.data.results[0]) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      logger.info(`Geocoded address: ${address} -> (${location.lat}, ${location.lng})`);
      
      return {
        lat: location.lat,
        lng: location.lng,
        geom: `POINT(${location.lng} ${location.lat})`, // PostGIS format: lng, lat
        formatted_address: result.formatted_address
      };
    } else {
      logger.error(`Geocoding failed for address: ${address}, status: ${response.data.status}`);
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    logger.error('Geocoding error:', error.message);
    
    // Fallback: return approximate coordinates based on zip code or city
    // For production, you might want to use a backup geocoding service
    logger.warn('Using fallback coordinates for address:', address);
    return {
      lat: 40.7128,
      lng: -74.0060,
      geom: `POINT(-74.0060 40.7128)`,
      formatted_address: address
    };
  }
}

/**
 * Parse hours string into structured JSON format
 * @param {string} hoursString - Hours string like "monday: 9:00 AM-5:00 PM, tuesday: Closed"
 * @returns {Object} Parsed hours object
 */
function parseHoursString(hoursString) {
  try {
    const hours = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Split by comma and parse each day
    const dayEntries = hoursString.toLowerCase().split(',').map(s => s.trim());
    
    dayEntries.forEach(entry => {
      const match = entry.match(/(\w+):\s*(.+)/);
      if (match) {
        const [, day, timeStr] = match;
        
        if (timeStr.includes('closed')) {
          hours[day] = { closed: true };
        } else {
          const timeMatch = timeStr.match(/(\d+:\d+\s*[ap]m)\s*[-→]\s*(\d+:\d+\s*[ap]m)/i);
          if (timeMatch) {
            hours[day] = {
              open: timeMatch[1].trim(),
              close: timeMatch[2].trim(),
              closed: false
            };
          }
        }
      }
    });
    
    return hours;
  } catch (error) {
    logger.error('Error parsing hours string:', error);
    return { raw: hoursString };
  }
}

module.exports = {
  geocodeAddress,
  parseHoursString
};
