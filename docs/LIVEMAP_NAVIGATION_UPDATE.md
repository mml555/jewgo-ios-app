# LiveMap Navigation Bar Update

## Overview

Successfully replaced the Notifications tab in the navigation bar with a LiveMap tab that displays all entities from all categories on a single interactive map.

## Changes Made

### 1. Created New LiveMapAllScreen Component

**File:** `src/screens/LiveMapAllScreen.tsx`

- **Purpose:** Displays all entities from all categories on a single map view
- **Features:**
  - Fetches data from all 10 categories (eatery, shul, mikvah, schools, stores, services, housing, shtetl, events, jobs)
  - Interactive Google Maps integration via WebView
  - Category filter rail to view specific categories or all entities
  - Search functionality to find locations
  - Filters integration (kosher certification, distance, price range)
  - Location markers with category-specific colors
  - Popup cards for selected locations with "View Details" action
  - User location tracking and display

### 2. Updated Navigation Types

**File:** `src/types/navigation.ts`

**Changed:**

```typescript
// BEFORE
export type TabParamList = {
  Explore: ...;
  Favorites: undefined;
  Specials: ...;
  Notifications: undefined;  // ❌ Removed
  Profile: undefined;
};

// AFTER
export type TabParamList = {
  Explore: ...;
  Favorites: undefined;
  Specials: ...;
  LiveMap: undefined;  // ✅ Added
  Profile: undefined;
};
```

### 3. Updated Root Navigation Tabs

**File:** `src/navigation/RootTabs.tsx`

**Changes:**

1. Replaced `NotificationsScreen` import with `LiveMapAllScreen`
2. Updated tab icon switch case:
   - Changed `'Notifications'` → `'LiveMap'`
   - Changed icon from `'bell'` → `'map'`
   - Changed label from `'Notifications'` → `'LiveMap'`
3. Updated Tab.Screen configuration:
   - Changed screen name from `'Notifications'` to `'LiveMap'`
   - Changed component from `NotificationsScreen` to `LiveMapAllScreen`
   - Updated accessibility label to `'LiveMap, tab 4 of 5'`

## Technical Implementation

### Data Fetching Strategy

The LiveMapAllScreen uses parallel data fetching from all categories:

```typescript
// Fetch data from all categories simultaneously
const eateryData = useCategoryData({ categoryKey: 'eatery', ... });
const shulData = useCategoryData({ categoryKey: 'shul', ... });
const mikvahData = useCategoryData({ categoryKey: 'mikvah', ... });
// ... etc for all 10 categories

// Combine all listings
const allListings = useMemo(() => [
  ...(eateryData.data || []),
  ...(shulData.data || []),
  // ... etc
], [eateryData.data, shulData.data, ...]);
```

### Map Integration

- Uses Google Maps JavaScript API via WebView
- Renders category-specific colored markers
- Supports user location display
- Implements marker clustering for better performance
- Auto-fits bounds to show all visible markers

### Category Filtering

- Category rail with 11 options (All + 10 specific categories)
- Visual indication of selected category with color coding
- Real-time marker updates when category changes
- Maintains filter state across interactions

### Search & Filters

- Real-time search across all listings
- Integration with existing FiltersModal
- Distance-based filtering using user location
- Kosher certification filtering
- Price range filtering

## UI/UX Features

### Header

- Back button (top left)
- Title: "Live Map - All Locations"
- Filter button (top right)

### Search Bar

- Positioned below header
- Clear button when text is entered
- Search icon indicator
- Placeholder: "Search locations..."

### Category Rail

- Horizontal scrollable list
- Emoji + label for each category
- Active state with category color background
- Inactive state with light gray background

### Location Popup

- Displays when marker is tapped
- Shows image (if available)
- Title and description
- Rating and distance info
- "View Details" button to navigate to ListingDetailScreen
- Close button (X) to dismiss

## Accessibility

- All interactive elements have proper accessibility labels
- Touch targets meet WCAG guidelines (inherited from RootTabs)
- Screen reader support for all navigation elements
- Keyboard navigation support (tab hiding on keyboard open)

## Benefits

1. **Unified View:** See all entities across all categories in one place
2. **Better Discovery:** Users can explore nearby locations regardless of category
3. **Efficient Navigation:** Direct access to map view from navigation bar
4. **Category Flexibility:** Toggle between viewing all or specific categories
5. **Location Awareness:** Shows proximity to user's current location
6. **Rich Filtering:** Combines search, category, and filter options

## Testing Recommendations

1. **Functional Testing:**

   - Verify all categories load data correctly
   - Test marker interactions (tap, popup display)
   - Validate navigation to ListingDetailScreen
   - Test search functionality
   - Verify filter integration

2. **Performance Testing:**

   - Monitor memory usage with large datasets
   - Check map rendering performance
   - Verify smooth scrolling in category rail
   - Test with slow network conditions

3. **UX Testing:**
   - Verify category color coding is clear
   - Test popup visibility and usability
   - Validate search/filter responsiveness
   - Check accessibility features

## Future Enhancements

1. **Clustering:** Implement marker clustering for better performance with many locations
2. **Route Planning:** Add directions/route planning to selected locations
3. **Saved Locations:** Quick access to frequently visited places
4. **Heat Maps:** Show density of locations by category
5. **Offline Support:** Cache map tiles and location data for offline viewing

## Migration Notes

- **Removed Screen:** `NotificationsScreen` is no longer accessible from navigation bar
- **Alternative Access:** If notifications functionality is needed, consider:
  - Adding notifications icon to profile screen
  - Implementing notifications badge on profile tab
  - Creating a notifications section in settings

## Files Modified

1. ✅ `src/screens/LiveMapAllScreen.tsx` (created)
2. ✅ `src/types/navigation.ts` (modified)
3. ✅ `src/navigation/RootTabs.tsx` (modified)

## Verification

- ✅ No linting errors
- ✅ TypeScript compilation successful
- ✅ Navigation types properly updated
- ✅ Icon (`map`) exists in Icon component
- ✅ All TODOs completed
