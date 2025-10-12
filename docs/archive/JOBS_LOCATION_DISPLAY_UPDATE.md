# Jobs Location Display Update - October 10, 2025

## Change Summary
Updated job listings to display **Distance** (when available) or **Zip Code** instead of "City, State".

## Rationale
- **Distance** is more useful for job seekers (shows how far the job is)
- **Zip Code** is more precise than city for on-site jobs
- Maintains clean, concise display

## Changes Made

### 1. JobCard Component
**File**: `src/components/JobCard.tsx`

**Before**:
```typescript
const formatLocation = (): string => {
  if (item.city && item.state) {
    return `${item.city}, ${item.state}`;  // ❌ Less useful
  }
  return item.zip_code ? String(item.zip_code) : 'N/A';
};
```

**After**:
```typescript
const formatLocation = (): string => {
  // If we have distance and location accuracy, show distance
  if (realDistanceMeters !== null && accuracyAuthorization === 'full') {
    const distanceMiles = realDistanceMeters / 1609.34;
    if (distanceMiles < 1) {
      return `${Math.round(distanceMiles * 5280)} ft away`;  // ✅ "450 ft away"
    } else if (distanceMiles < 100) {
      return `${distanceMiles.toFixed(1)} mi away`;          // ✅ "5.3 mi away"
    } else {
      return `${Math.round(distanceMiles)} mi away`;          // ✅ "45 mi away"
    }
  }
  
  // Otherwise show zip code
  return item.zip_code ? String(item.zip_code) : 'Remote';   // ✅ "11230"
};
```

### 2. EnhancedJobsScreen
**File**: `src/screens/EnhancedJobsScreen.tsx`

**Before**:
```typescript
const formatLocation = (item: JobListing): string => {
  if (item.city && item.state) {
    return `${item.city}, ${item.state}`;  // ❌ "Brooklyn, NY"
  }
  return item.zip_code ? String(item.zip_code) : 'Remote';
};
```

**After**:
```typescript
const formatLocation = useCallback((item: JobListing): string => {
  // If we have user location and job coordinates, calculate distance
  if (location && item.latitude && item.longitude) {
    const distanceMiles = calculateDistance(
      location.latitude,
      location.longitude,
      Number(item.latitude),
      Number(item.longitude),
    );
    
    // Only show distance if within reasonable range (< 1000 miles)
    if (distanceMiles < 1000) {
      if (distanceMiles < 1) {
        return `${Math.round(distanceMiles * 5280)} ft away`;  // ✅ "450 ft away"
      } else if (distanceMiles < 100) {
        return `${distanceMiles.toFixed(1)} mi away`;          // ✅ "5.3 mi away"
      } else {
        return `${Math.round(distanceMiles)} mi away`;          // ✅ "45 mi away"
      }
    }
  }
  
  // Otherwise show zip code
  return item.zip_code ? String(item.zip_code) : 'Remote';     // ✅ "11230"
}, [location]);
```

### 3. JobListingsScreen
**File**: `src/screens/jobs/JobListingsScreen.tsx`

Added `useLocation` hook and updated location display:

**Before**:
```typescript
{item.is_remote
  ? 'Remote'
  : item.is_hybrid
  ? 'Hybrid'
  : `${item.city || item.zip_code}, ${item.state || ''}`}  // ❌ "Brooklyn, NY"
```

**After**:
```typescript
const formatJobLocation = useCallback((item: JobListing): string => {
  if (item.is_remote) return 'Remote';
  if (item.is_hybrid) return 'Hybrid';
  return item.zip_code || 'Location TBD';  // ✅ "11230"
}, []);

// In render:
{formatJobLocation(item)}
```

### 4. Job Seeker Profiles
**File**: `src/screens/EnhancedJobsScreen.tsx`

**Before**:
```typescript
const displayLocation = item.city && item.state 
  ? `${item.city}, ${item.state}`  // ❌ "Brooklyn, NY"
  : item.zip_code || 'Remote';
```

**After**:
```typescript
// Show zip code instead of city for job seekers
const displayLocation = item.zip_code || 'Location not specified';  // ✅ "11230"
```

## Display Logic Priority

### For Jobs with Coordinates (JobCard, EnhancedJobsScreen)
1. **Distance** (if user location available & job has lat/lng)
   - < 1 mile: "450 ft away"
   - 1-100 miles: "5.3 mi away"
   - 100-1000 miles: "45 mi away"
   - > 1000 miles: Falls back to zip code

2. **Zip Code** (if no distance calculable)
   - Shows actual zip: "11230"
   - Remote jobs: "Remote"

### For Remote/Hybrid Jobs
- Remote: "Remote"
- Hybrid: "Hybrid"

## User Experience Improvements

### Before
- ❌ "Brooklyn, NY" - Not very useful, too vague
- ❌ "Queens, NY" - Hard to judge proximity
- ❌ City names can be long and take up space

### After
- ✅ "2.5 mi away" - Immediately know if it's nearby!
- ✅ "11230" - Precise location for searching
- ✅ Shorter, cleaner display
- ✅ More actionable information

## Examples

### With User Location Enabled
```
Hebrew School Teacher
Torah Academy
$45K-$60K
📍 3.2 mi away          ← Distance!
💼 Full-time
```

### Without User Location
```
Hebrew School Teacher
Torah Academy
$45K-$60K
📍 11230                ← Zip code!
💼 Full-time
```

### Remote Job
```
Social Media Manager
Stand With Us
$45K-$60K
📍 Remote               ← Remote!
💼 Full-time
```

## Files Modified
1. ✅ `src/components/JobCard.tsx` - Distance or zip code
2. ✅ `src/screens/EnhancedJobsScreen.tsx` - Distance or zip code
3. ✅ `src/screens/jobs/JobListingsScreen.tsx` - Zip code only

## Technical Details

### Distance Calculation
- Uses `calculateDistance()` from `useLocation` hook
- Haversine formula for accurate distance
- Only shows if within 1000 miles (prevents showing jobs across country as "2500 mi away")

### Location Permission
- **JobCard**: Checks `accuracyAuthorization === 'full'` before showing distance
- **EnhancedJobsScreen**: Shows distance if `location` object exists
- Falls back gracefully to zip code if no permission

## Testing

### With Location Permission
1. Enable location in app
2. Open Jobs tab
3. Should see distances: "2.5 mi away", "450 ft away", etc.

### Without Location Permission  
1. Deny location or disable
2. Open Jobs tab
3. Should see zip codes: "11230", "10024", etc.

### Remote Jobs
Always shows "Remote" regardless of location permission

## Summary
Job listings now display **actionable location information**:
- **Distance** when user location is available (most useful!)
- **Zip Code** when distance can't be calculated (still useful)
- **Remote/Hybrid** for flexible work arrangements

This makes it much easier for job seekers to find opportunities near them! 🎯

