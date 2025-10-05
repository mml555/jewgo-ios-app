/**
 * Distance Formatting Utilities
 * Consistent distance display and rounding across the app
 */

export interface DistanceDisplayOptions {
  showApproximate?: boolean;
  precision?: number;
  unit?: 'metric' | 'imperial';
  maxDecimals?: number;
}

export interface FormattedDistance {
  display: string;
  value: number;
  unit: string;
  isApproximate: boolean;
}

/**
 * Format distance for display with consistent rounding
 * Rules:
 * - <1000m → "287 m"
 * - ≥1000m → "2.9 km"
 * - When accuracy is reduced, show "~2.9 km" (tilde)
 * - If server returns approximate:true, always show ~
 */
export function formatDistance(
  distanceMeters: number,
  options: DistanceDisplayOptions = {}
): FormattedDistance {
  const {
    showApproximate = false,
    precision = 1,
    unit = 'metric',
    maxDecimals = 1
  } = options;

  if (distanceMeters < 0 || !isFinite(distanceMeters)) {
    return {
      display: 'Unknown',
      value: 0,
      unit: '',
      isApproximate: false
    };
  }

  let display: string;
  let value: number;
  let unitStr: string;

  if (unit === 'imperial') {
    // Convert to miles
    const miles = distanceMeters * 0.000621371;
    
    if (miles < 0.1) {
      // Show in feet for very short distances
      const feet = distanceMeters * 3.28084;
      value = Math.round(feet);
      unitStr = 'ft';
      display = `${value} ${unitStr}`;
    } else if (miles < 1) {
      // Show in miles with decimals
      value = Math.round(miles * 10) / 10;
      unitStr = 'mi';
      display = `${value.toFixed(1)} ${unitStr}`;
    } else {
      // Show in miles
      value = Math.round(miles * 10) / 10;
      unitStr = 'mi';
      display = `${value.toFixed(1)} ${unitStr}`;
    }
  } else {
    // Metric system
    if (distanceMeters < 1000) {
      // Show in meters
      value = Math.round(distanceMeters);
      unitStr = 'm';
      display = `${value} ${unitStr}`;
    } else {
      // Show in kilometers
      const km = distanceMeters / 1000;
      value = Math.round(km * Math.pow(10, precision)) / Math.pow(10, precision);
      unitStr = 'km';
      display = `${value.toFixed(maxDecimals)} ${unitStr}`;
    }
  }

  // Add tilde for approximate distances
  if (showApproximate) {
    display = `~${display}`;
  }

  return {
    display,
    value,
    unit: unitStr,
    isApproximate: showApproximate
  };
}

/**
 * Format distance with accuracy context
 * Handles reduced accuracy and approximate locations
 */
export function formatDistanceWithAccuracy(
  distanceMeters: number,
  accuracyContext: {
    accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
    isApproximate?: boolean;
    accuracy?: number;
  } = {},
  options: DistanceDisplayOptions = {}
): FormattedDistance {
  const { accuracyAuthorization, isApproximate, accuracy } = accuracyContext;
  
  // Determine if we should show approximate indicator
  const showApproximate = 
    accuracyAuthorization === 'reduced' || 
    isApproximate || 
    (accuracy && accuracy > 100); // Low accuracy GPS

  return formatDistance(distanceMeters, {
    ...options,
    showApproximate
  });
}

/**
 * Get distance category for sorting/filtering
 */
export function getDistanceCategory(distanceMeters: number): string {
  if (distanceMeters < 500) return 'very_close';
  if (distanceMeters < 1000) return 'close';
  if (distanceMeters < 5000) return 'nearby';
  if (distanceMeters < 25000) return 'far';
  return 'very_far';
}

/**
 * Get human-readable distance category
 */
export function getDistanceCategoryLabel(distanceMeters: number): string {
  const category = getDistanceCategory(distanceMeters);
  
  switch (category) {
    case 'very_close': return 'Very Close';
    case 'close': return 'Close';
    case 'nearby': return 'Nearby';
    case 'far': return 'Far';
    case 'very_far': return 'Very Far';
    default: return 'Unknown';
  }
}

/**
 * Validate distance value
 */
export function isValidDistance(distanceMeters: number): boolean {
  return (
    typeof distanceMeters === 'number' &&
    isFinite(distanceMeters) &&
    distanceMeters >= 0 &&
    distanceMeters <= 40075000 // Earth's circumference in meters
  );
}

/**
 * Convert distance between units
 */
export function convertDistance(
  distance: number,
  fromUnit: 'meters' | 'kilometers' | 'miles' | 'feet',
  toUnit: 'meters' | 'kilometers' | 'miles' | 'feet'
): number {
  // Convert to meters first
  let meters: number;
  
  switch (fromUnit) {
    case 'meters':
      meters = distance;
      break;
    case 'kilometers':
      meters = distance * 1000;
      break;
    case 'miles':
      meters = distance * 1609.34;
      break;
    case 'feet':
      meters = distance * 0.3048;
      break;
    default:
      meters = distance;
  }
  
  // Convert from meters to target unit
  switch (toUnit) {
    case 'meters':
      return meters;
    case 'kilometers':
      return meters / 1000;
    case 'miles':
      return meters / 1609.34;
    case 'feet':
      return meters / 0.3048;
    default:
      return meters;
  }
}

/**
 * Get distance color based on proximity
 * For UI theming
 */
export function getDistanceColor(distanceMeters: number): string {
  const category = getDistanceCategory(distanceMeters);
  
  switch (category) {
    case 'very_close': return '#4CAF50'; // Green
    case 'close': return '#8BC34A'; // Light Green
    case 'nearby': return '#FFC107'; // Amber
    case 'far': return '#FF9800'; // Orange
    case 'very_far': return '#F44336'; // Red
    default: return '#9E9E9E'; // Grey
  }
}

/**
 * Format distance for accessibility (screen readers)
 */
export function formatDistanceForAccessibility(
  distanceMeters: number,
  accuracyContext: {
    accuracyAuthorization?: 'full' | 'reduced' | 'unknown';
    isApproximate?: boolean;
  } = {}
): string {
  const formatted = formatDistanceWithAccuracy(distanceMeters, accuracyContext);
  
  let accessibilityText = `${formatted.display}`;
  
  if (formatted.isApproximate) {
    accessibilityText += ', approximate distance';
  }
  
  if (accuracyContext.accuracyAuthorization === 'reduced') {
    accessibilityText += ', using approximate location';
  }
  
  return accessibilityText;
}

/**
 * Sort entities by distance with fallback
 */
export function sortEntitiesByDistance<T extends { distance_m?: number }>(
  entities: T[],
  fallbackSort: (a: T, b: T) => number = () => 0
): T[] {
  return entities.sort((a, b) => {
    const aDistance = a.distance_m;
    const bDistance = b.distance_m;
    
    // Both have distances - sort by distance
    if (aDistance !== undefined && bDistance !== undefined) {
      return aDistance - bDistance;
    }
    
    // Only one has distance - prioritize it
    if (aDistance !== undefined && bDistance === undefined) {
      return -1;
    }
    
    if (aDistance === undefined && bDistance !== undefined) {
      return 1;
    }
    
    // Neither has distance - use fallback sort
    return fallbackSort(a, b);
  });
}

/**
 * Filter entities by distance range
 */
export function filterEntitiesByDistance<T extends { distance_m?: number }>(
  entities: T[],
  minDistance?: number,
  maxDistance?: number
): T[] {
  return entities.filter(entity => {
    const distance = entity.distance_m;
    
    if (distance === undefined) {
      return false; // Exclude entities without distance
    }
    
    if (minDistance !== undefined && distance < minDistance) {
      return false;
    }
    
    if (maxDistance !== undefined && distance > maxDistance) {
      return false;
    }
    
    return true;
  });
}

export default {
  formatDistance,
  formatDistanceWithAccuracy,
  getDistanceCategory,
  getDistanceCategoryLabel,
  isValidDistance,
  convertDistance,
  getDistanceColor,
  formatDistanceForAccessibility,
  sortEntitiesByDistance,
  filterEntitiesByDistance
};
