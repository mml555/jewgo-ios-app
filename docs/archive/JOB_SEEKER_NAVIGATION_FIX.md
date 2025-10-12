# Job Seeker Navigation Fix

## Problem Summary

Users were experiencing an error when clicking on job seeker cards in the app:

```
[2025-10-09T08:49:53.535Z] [ERROR] 🔍 DEBUG: Failed to load listing: Listing not found in any category
```

### Root Cause

1. **Frontend Issue**: The `CategoryGridScreen` component was navigating to `ListingDetail` screen for ALL items, including job seekers
2. **Backend Issue**: Job seekers have IDs like `seeker-1`, `seeker-2`, etc., which are NOT valid UUIDs
3. When `ListingDetail` tried to fetch a job seeker using `apiService.getListing('seeker-1')`, it called the entities endpoint `/api/v5/entities/seeker-1`
4. The backend attempted to query the database with `seeker-1` as a UUID, causing a PostgreSQL error:
   ```
   invalid input syntax for type uuid: "seeker-1"
   ```
5. This resulted in a 500 error, and the frontend then tried all category endpoints (restaurants, synagogues, mikvahs, stores), all of which failed
6. Finally, the frontend logged "Listing not found in any category"

## Solutions Implemented

### 1. Frontend Navigation Fix (`CategoryGridScreen.tsx`)

**Updated the `handleCardPress` function** to check if an item is a job seeker and navigate to the appropriate screen:

```typescript
// Handle card press
const handleCardPress = useCallback(
  (item: CategoryItem) => {
    // Check if this is a job seeker and navigate to appropriate screen
    if (
      (item as any).entity_type === 'job_seeker' ||
      item.id?.startsWith('seeker-')
    ) {
      (navigation as any).navigate('JobSeekerDetail', {
        jobSeekerId: item.id,
      });
    } else {
      (navigation as any).navigate('ListingDetail', {
        itemId: item.id,
        categoryKey: categoryKey,
      });
    }
  },
  [navigation, categoryKey],
);
```

**Changes:**

- Added check for `entity_type === 'job_seeker'` or ID starting with `seeker-`
- Navigates to `JobSeekerDetail` screen for job seekers
- Navigates to `ListingDetail` screen for all other entities (restaurants, synagogues, etc.)

### 2. Backend UUID Validation (`EntityController.js`)

**Added UUID format validation** to prevent database errors:

```javascript
// Get single entity by ID
static async getEntityById(req, res) {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.warn('Invalid UUID format:', id);
      return res.status(404).json({
        success: false,
        error: 'Entity not found'
      });
    }

    const entity = await Entity.findById(id);
    // ... rest of the code
  }
}
```

**Changes:**

- Validates that the ID is a properly formatted UUID before querying the database
- Returns 404 instead of 500 for invalid UUID formats
- Prevents PostgreSQL errors from invalid UUID strings

### 3. Backend Normalized Controller (`EntityControllerNormalized.js`)

Applied the same UUID validation fix to `EntityControllerNormalized` which is used by category-specific controllers (restaurants, synagogues, mikvahs, stores):

```javascript
static async getEntityById(req, res) {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      logger.warn('Invalid UUID format:', id);
      return res.status(404).json({
        success: false,
        error: 'Entity not found'
      });
    }

    // Use the helper function to get entity with all related data
    const result = await pool.query('SELECT * FROM get_entity_with_details($1)', [id]);
    // ... rest of the code
  }
}
```

## Testing

After these changes:

1. ✅ Clicking on job seeker cards navigates to `JobSeekerDetail` screen
2. ✅ Clicking on entity cards (restaurants, synagogues, etc.) navigates to `ListingDetail` screen
3. ✅ Invalid UUID requests return 404 instead of 500
4. ✅ No more PostgreSQL UUID conversion errors in logs
5. ✅ Frontend no longer shows "Listing not found in any category" error for job seekers

## Files Modified

1. `/Users/mendell/JewgoAppFinal/src/screens/CategoryGridScreen.tsx` - Navigation logic
2. `/Users/mendell/JewgoAppFinal/backend/src/controllers/EntityController.js` - UUID validation
3. `/Users/mendell/JewgoAppFinal/backend/src/controllers/EntityControllerNormalized.js` - UUID validation

## Additional Notes

- The fix maintains backward compatibility with existing entity navigation
- Job seekers have their own dedicated detail screen (`JobSeekerDetail`) with appropriate API calls
- UUID validation improves error handling and provides better error messages
- The solution follows the existing pattern used in `JobCard` component for job seeker navigation
