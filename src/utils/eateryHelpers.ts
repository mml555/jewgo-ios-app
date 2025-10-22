// Eatery helper functions
import { DietaryType, DIETARY_COLORS } from '../types/eatery';

/**
 * Get color for dietary type
 */
export function getDietaryColor(kosherLevel?: string): string {
  if (!kosherLevel) {
    return '#B8B8B8';
  }

  const colors: Record<string, string> = {
    meat: DIETARY_COLORS.meat,
    dairy: DIETARY_COLORS.dairy,
    parve: DIETARY_COLORS.parve,
  };

  return colors[kosherLevel.toLowerCase()] || '#B8B8B8';
}

/**
 * Get label for dietary type
 */
export function getDietaryLabel(kosherLevel?: string): string {
  if (!kosherLevel) {
    return 'Kosher';
  }

  const labels: Record<string, string> = {
    meat: 'Meat',
    dairy: 'Dairy',
    parve: 'Parve',
  };

  return labels[kosherLevel.toLowerCase()] || 'Kosher';
}

/**
 * Format price range from min/max values
 * Returns actual price range like "$10-20" instead of symbols
 */
export function formatPriceRange(
  priceMin?: number,
  priceMax?: number,
): string | null {
  // Treat 0 as "no data" - only use positive values
  const hasMin = priceMin && priceMin > 0;
  const hasMax = priceMax && priceMax > 0;

  if (!hasMin && !hasMax) {
    return null;
  }

  // Helper to format price without unnecessary decimals
  const formatPrice = (price: number): string => {
    // Ensure price is a valid number before calling toFixed
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      return '0';
    }
    return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
  };

  if (hasMin && hasMax) {
    // Both values available - show range
    if (priceMin === priceMax) {
      return formatPrice(priceMin);
    }
    return `${formatPrice(priceMin).replace('$', '')}-${formatPrice(priceMax)}`;
  }

  // Only one value available
  const price = (hasMin ? priceMin : priceMax) || 0;
  return formatPrice(price);
}
