/**
 * Category mapping utilities for Favorites screen
 * Maps entity types to user-friendly display names and provides category metadata
 */

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  synagogue: 'Shuls',
  shul: 'Shuls',
  mikvah: 'Mikvahs',
  restaurant: 'Eateries',
  eatery: 'Eateries',
  store: 'Stores',
  stores: 'Stores',
  jobs: 'Jobs',
  events: 'Events',
  specials: 'Specials',
  'eatery-plus': 'Eatery+ Coming Soon',
};

export const CATEGORY_EMOJIS: Record<string, string> = {
  synagogue: '🕍',
  shul: '🕍',
  mikvah: '💧',
  restaurant: '🍽️',
  eatery: '🍽️',
  store: '🏪',
  stores: '🏪',
  jobs: '💼',
  events: '🎉',
  specials: '🎁',
  'eatery-plus': '🍽️+',
};

// Category background images from Unsplash
export const CATEGORY_BACKGROUND_IMAGES: Record<string, string> = {
  synagogue:
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
  shul: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&crop=center',
  mikvah:
    'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=300&fit=crop&crop=center',
  restaurant:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center',
  eatery:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center',
  store:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center',
  stores:
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center',
  jobs: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop&crop=center',
  events:
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop&crop=center',
  specials:
    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop&crop=center',
  'eatery-plus':
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&crop=center',
};

export interface CategoryInfo {
  key: string;
  displayName: string;
  emoji: string;
  backgroundImage: string;
}

/**
 * Get category information by entity type
 */
export function getCategoryInfo(entityType: string): CategoryInfo {
  const key = entityType.toLowerCase();
  return {
    key,
    displayName:
      CATEGORY_DISPLAY_NAMES[key] ||
      entityType.charAt(0).toUpperCase() + entityType.slice(1),
    emoji: CATEGORY_EMOJIS[key] || '📍',
    backgroundImage:
      CATEGORY_BACKGROUND_IMAGES[key] ||
      'https://via.placeholder.com/300x200/F0F0F0/666666?text=Category',
  };
}

/**
 * Get all available categories with their counts
 */
export function getCategoriesWithCounts(
  favorites: Array<{ entity_type: string }>,
): Array<CategoryInfo & { count: number }> {
  const categoryCounts = new Map<string, number>();

  // Count favorites by category
  favorites.forEach(favorite => {
    const key = favorite.entity_type.toLowerCase();
    const categoryKey = key in CATEGORY_DISPLAY_NAMES ? key : 'other';
    categoryCounts.set(categoryKey, (categoryCounts.get(categoryKey) || 0) + 1);
  });

  // Define all available categories in the app (in preferred order)
  const allCategories = [
    'synagogue', // Shuls
    'mikvah', // Mikvahs
    'restaurant', // Eateries
    'jobs', // Jobs
    'events', // Events
    'store', // Stores
    'specials', // Specials
    'eatery-plus', // Eatery+ Coming Soon (always last)
  ];

  // Convert to array with category info - show ALL categories
  const categories: Array<CategoryInfo & { count: number }> = [];

  // Add all available categories (even with 0 counts)
  allCategories.forEach(key => {
    const categoryInfo = getCategoryInfo(key);
    const count = categoryCounts.get(key) || 0;
    categories.push({
      ...categoryInfo,
      count,
    });
  });

  // Sort by count (descending) then by display name, but always keep 'eatery-plus' last
  return categories.sort((a, b) => {
    // Always put 'eatery-plus' at the end
    if (a.key === 'eatery-plus') return 1;
    if (b.key === 'eatery-plus') return -1;

    // For all other categories, sort by count (descending) then by display name
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.displayName.localeCompare(b.displayName);
  });
}
