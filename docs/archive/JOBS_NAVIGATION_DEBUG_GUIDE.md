# Jobs Navigation Debug Guide

## Changes Made

### 1. Fixed API Response Format
- **File**: `backend/src/controllers/jobsController.js`
- **Change**: Updated `getJobListings` to return:
  ```javascript
  {
    success: true,
    data: {
      listings: result.rows
    },
    pagination: { ... }
  }
  ```
- **Previous**: Was returning `{ jobListings: result.rows }`
- **Issue Fixed**: Frontend expected `data.listings` format

### 2. Created Jobs Table
- Created `jobs` table with all necessary fields
- Added 5 sample job listings to the database
- Jobs are now available for the "I'm Hiring" page

### 3. Made Plus Button Dynamic
- **File**: `src/screens/EnhancedJobsScreen.tsx`
- **Change**: The middle button now changes based on active tab:
  - Shows "I'm Hiring +" when on "Job feed" tab
  - Shows "I'm Seeking +" when on "Resume Feed" tab
- **Navigation**: 
  - "I'm Hiring +" navigates to `CreateJobV2` screen
  - "I'm Seeking +" navigates to `CreateJobSeekerProfile` screen

## Testing Instructions

### Test 1: Verify Tabs Switch Properly
1. Open the Jobs section (Jobs icon in CategoryRail)
2. You should see 3 tabs: "Job feed", "I'm Hiring +", "Resume Feed"
3. Click "Job feed" - should show job listings
4. Click "Resume Feed" - should show job seeker profiles
5. **Check Console**: Look for debug logs like:
   - "Setting activeTab to jobs"
   - "Setting activeTab to seekers"

### Test 2: Verify Plus Button Changes
1. When on "Job feed" tab, the middle button should say "I'm Hiring +"
2. When on "Resume Feed" tab, the middle button should say "I'm Seeking +"
3. **Check Console**: Look for log showing current activeTab

### Test 3: Verify Plus Button Navigation
1. Click the "I'm Hiring +" button (when on Job feed)
2. Should navigate to Create Job screen
3. **Check Console**: Look for:
   - "🎯 Plus button pressed, activeTab: jobs"
   - "🎯 Navigating to CreateJobV2"
4. Go back, switch to "Resume Feed" tab
5. Click the "I'm Seeking +" button
6. Should navigate to Create Job Seeker Profile screen
7. **Check Console**: Look for:
   - "🎯 Plus button pressed, activeTab: seekers"
   - "🎯 Navigating to CreateJobSeekerProfile"

## Possible Issues

### Issue 1: Button Not Responding to Touches
**Symptoms**: Clicking the button does nothing
**Possible Causes**:
- TouchableOpacity is being covered by another element
- Button is outside the touchable area
- Navigation is failing silently

**Debug**:
1. Check console for "🎯 Plus button pressed" log
2. If you DON'T see this log, the touch isn't registering
3. If you DO see this log but no navigation happens, check for error logs

### Issue 2: Navigation Routes Not Found
**Symptoms**: Error in console about undefined route
**Solution**: Verify routes in `src/navigation/AppNavigator.tsx`:
- `CreateJobV2` should exist
- `CreateJobSeekerProfile` should exist

### Issue 3: Tabs Not Switching
**Symptoms**: Clicking "Job feed" or "Resume Feed" doesn't change content
**Debug**:
1. Check console for "Setting activeTab to..." logs
2. Verify `activeTab` state is changing
3. Check if `loadData` is being called when tab changes

## Current State

✅ **Backend**: Jobs table created, sample data added, API endpoint fixed
✅ **Frontend**: Dynamic button text implemented with navigation logic
✅ **Navigation**: Routes confirmed to exist in AppNavigator
✅ **Lookup Endpoints**: Fixed authentication issue - created public endpoints for industries, job types, etc.
✅ **Create Job Screen**: Should now load properly without "Endpoint not found" errors
⏳ **Testing**: Ready for user testing

## Next Steps if Still Not Working

1. **Check React Native Metro bundler**: Ensure app has reloaded with new changes
2. **Check for TypeScript errors**: Run `npx tsc --noEmit` to verify no type errors
3. **Verify navigation context**: Ensure `useNavigation()` hook is working properly
4. **Test simpler navigation**: Try navigating to a different screen to verify navigation works at all
5. **Check device logs**: Look for any crash reports or errors in device logs

