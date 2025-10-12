# Location Bar Update - Zip Code Display

## Summary

Updated the location bar to display zip code instead of latitude/longitude coordinates. The location bar is already shown on all category pages including the Jobs page.

## Changes Made

### 1. Created Geocoding Utility (`src/utils/geocoding.ts`)

- New utility file for reverse geocoding coordinates to zip codes
- Uses Google Geocoding API (same API key as Google Places)
- Functions:
  - `reverseGeocode()`: Converts lat/long to zip code, city, and state
  - `formatLocationDisplay()`: Formats location info for display

### 2. Updated Location Hook (`src/hooks/useLocation.ts`)

- Extended `LocationData` interface to include:
  - `zipCode?: string`
  - `city?: string`
  - `state?: string`
- Updated location fetching functions to include reverse geocoding:
  - `requestLocationPermission()` (iOS flow)
  - `getCurrentLocation()` (main location getter)
  - `watchLocation()` (continuous location updates)
- Reverse geocoding is performed automatically when location is obtained
- Failures in reverse geocoding are handled gracefully (zip code is optional)

### 3. Updated Location Display (`src/screens/CategoryGridScreen.tsx`)

- Changed location indicator from showing lat/long coordinates to showing zip code
- **Before**: `📍 Location enabled - showing distances (40.7128, -74.0060)`
- **After**: `📍 Location enabled - showing distances (10001)`
- Location bar appears for ALL categories including:
  - Mikvah
  - Eatery
  - Shul
  - Stores
  - Events
  - All others (except Jobs, which uses EnhancedJobsScreen)

### 4. Added Location Bar to Jobs Page (`src/screens/EnhancedJobsScreen.tsx`)

- Added location permission request handler
- Added location refresh handler
- Added three location banner states:
  1. Permission not granted - "Enable Location" button
  2. Permission granted, no location - "Refresh Location" button
  3. Location available - Shows zip code indicator
- Location bar displays above job listings
- Works for both "Job feed" and "Resume Feed" tabs
- Shows distances to jobs when location is enabled

## Location Bar Features

The location bar has three states:

1. **Permission Not Granted**: Shows "Enable Location" button

   - Prompts user to grant location permission
   - Displays message: "See distances to nearby businesses"

2. **Permission Granted, No Location Yet**: Shows "Refresh Location" button

   - Allows user to manually trigger location fetch
   - Useful if initial location fetch failed

3. **Location Available**: Shows location indicator with zip code
   - Format: `📍 Location enabled - showing distances (ZIP_CODE)`
   - Example: `📍 Location enabled - showing distances (11201)`
   - If zip code is not available, just shows: `📍 Location enabled - showing distances`

## Jobs Page Implementation

The location bar has been **added to the Jobs page** (`EnhancedJobsScreen`):

- Jobs page uses a custom `EnhancedJobsScreen` component (not `CategoryGridScreen`)
- Location bars are rendered between tab bar/filters and the job listings grid
- Works for both "Job feed" and "Resume Feed" tabs
- Displays zip code when location is available
- Shows distances to jobs (already working, now enhanced with zip code display)

## Technical Details

### API Requirements

- Requires Google Places API key (already configured in project)
- Uses Google Geocoding API endpoint
- API key configured in `src/config/ConfigService.ts`

### Performance Considerations

- Reverse geocoding is done once per location fetch
- Results are cached in location state
- Only re-fetches when location changes significantly (>10 meters)
- Graceful fallback if API call fails (still shows location-based features)

### Error Handling

- API failures are logged but don't block location features
- If reverse geocoding fails, location still works (just without zip code display)
- User can still see distances to businesses even without zip code

## Testing Recommendations

1. **Test on Jobs Page**:

   - Navigate to Jobs category
   - Verify location bar appears at top
   - Check that zip code is displayed when location is enabled

2. **Test Permission Flow**:

   - Fresh install: Should prompt for location permission
   - Grant permission: Should show zip code
   - Deny permission: Should show "Enable Location" banner

3. **Test Location Refresh**:

   - Enable location
   - Force refresh location
   - Verify zip code updates

4. **Test Different Categories**:
   - Verify location bar appears on all category pages
   - Confirm consistent behavior across categories

## Files Modified

- `src/utils/geocoding.ts` (NEW)
- `src/hooks/useLocation.ts` (MODIFIED)
- `src/screens/CategoryGridScreen.tsx` (MODIFIED)
- `src/screens/EnhancedJobsScreen.tsx` (MODIFIED - Jobs page)
- `docs/LOCATION_BAR_UPDATE.md` (NEW)

## No Breaking Changes

- All existing location features continue to work
- Distance calculations still use lat/long internally
- Only display changed (zip code instead of coordinates)
- Backward compatible (handles missing zip code gracefully)
