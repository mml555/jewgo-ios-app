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
 * Supports predefined price buckets:
 * $5-10, $10-20, $20-30, $30-40, $40-50, $50-60,
 * $60-70, $70-80, $80-90, $90-100, $100+
 * Format: "$10-20" (dollar sign only on first number)
 * Returns null if no valid price data (so caller can fall back to price_range field)
 */
export function formatPriceRange(
  priceMin?: number,
  priceMax?: number,
): string | null {
  // Treat 0, null, undefined as "no data" - only use positive values
  const hasMin = typeof priceMin === 'number' && priceMin > 0;
  const hasMax = typeof priceMax === 'number' && priceMax > 0;

  // If no valid data, return null so caller can use price_range fallback
  if (!hasMin && !hasMax) {
    return null;
  }

  // Helper to format price without decimals
  const formatPrice = (price: number): string => {
    return Number.isInteger(price) ? `${price}` : `${price.toFixed(0)}`;
  };

  // Special case: $100+ (when min is 100 and max is null/undefined)
  if (hasMin && priceMin >= 100 && !hasMax) {
    return '$100+';
  }

  if (hasMin && hasMax) {
    // Both values available - show range
    if (priceMin === priceMax) {
      return `$${formatPrice(priceMin)}`;
    }
    // Format as "$10-20" (dollar sign only on first number)
    return `$${formatPrice(priceMin)}-${formatPrice(priceMax)}`;
  }

  // Only one value available (shouldn't happen with proper data, but handle it)
  const price = hasMin ? priceMin! : priceMax!;
  return `$${formatPrice(price)}`;
}
