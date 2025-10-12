# Job Seekers / Resumes Loading Fix

## Problem
Job seeker profiles (resumes) were not loading when switching to the "Seekers" tab. The app was showing a message "No job seeker API endpoint - showing empty state".

## Root Causes

### 1. Frontend Not Calling the API
The `EnhancedJobsScreen.tsx` was not calling the job seekers API at all. It just logged a message and set an empty array.

**Location:** `src/screens/EnhancedJobsScreen.tsx:290-294`

### 2. Wrong API Endpoint in JobSeekersService  
The `JobSeekersService` was trying to call `/job-seekers` but the actual backend route is `/jobs/seekers`.

**Location:** `src/services/JobSeekersService.ts:230`

### 3. Missing Sample Data
The database had a `job_seeker_profiles` table but no sample data. Sample data existed only for the old `job_seekers` table (from migration 016), but the backend controller was querying `job_seeker_profiles` (from migration 020).

### 4. Backend Response Format Mismatch
The backend was returning:
```javascript
{ profiles: [...], pagination: {...} }
```

But the frontend expected:
```javascript
{ success: true, data: { job_seekers: [...], pagination: {...} } }
```

## Solutions Implemented

### 1. Updated EnhancedJobsScreen to Call the API
**File:** `src/screens/EnhancedJobsScreen.tsx`

- Imported `JobSeekersService`
- Replaced the stub code with actual API call to `jobSeekersService.getJobSeekers()`
- Added data transformation to map backend fields to frontend format
- Added proper error handling and logging

### 2. Fixed JobSeekersService Endpoint
**File:** `src/services/JobSeekersService.ts`

Changed endpoint from:
```typescript
const endpoint = `/job-seekers${queryString ? `?${queryString}` : ''}`;
```

To:
```typescript
const endpoint = `/jobs/seekers${queryString ? `?${queryString}` : ''}`;
```

### 3. Created Sample Data for Job Seeker Profiles
**File:** `database/init/05_job_seeker_profiles_sample_data.sql`

Created 8 realistic job seeker profiles:
1. Sarah Cohen - Software Developer (Brooklyn, NY)
2. David Goldstein - Marketing Manager (Manhattan, NY)
3. Rachel Levine - Elementary Teacher (Queens, NY)
4. Michael Rosen - Graphic Designer (Bronx, NY)
5. Jessica Silver - Accountant (Staten Island, NY)
6. Esther Klein - Registered Nurse (Brooklyn, NY)
7. Benjamin Katz - Sales Representative (Manhattan, NY)
8. Miriam Schwartz - Social Worker (Queens, NY)

Executed the script to populate the database:
```bash
docker exec -i jewgo_postgres psql -U jewgo_user -d jewgo_dev < database/init/05_job_seeker_profiles_sample_data.sql
```

### 4. Fixed Backend Response Format
**File:** `backend/src/controllers/jobSeekersController.js`

Updated the `getJobSeekerProfiles` method to return:
```javascript
res.json({
  success: true,
  data: {
    job_seekers: result.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: result.rows.length,
      pages: Math.ceil(result.rows.length / parseInt(limit, 10)),
    },
  },
});
```

## Testing

To verify the fix:
1. Restart the app (backend should already be running)
2. Navigate to the Jobs section
3. Switch to the "Seekers" tab
4. You should now see 8 job seeker profiles/resumes loading

## API Endpoints

- **GET** `/api/v5/jobs/seekers` - Get all job seeker profiles
  - Supports pagination: `?page=1&limit=20`
  - Requires authentication (guest or user)
  
- **GET** `/api/v5/jobs/seekers/:id` - Get specific job seeker profile

## Database Tables

- `job_seeker_profiles` - Active table used by the backend
- `job_seekers` - Legacy table (has old sample data but not used)

## Files Changed

1. `src/screens/EnhancedJobsScreen.tsx` - Added API call and data transformation
2. `src/services/JobSeekersService.ts` - Fixed endpoint path for all methods
3. `src/services/api.ts` - Fixed endpoint paths for job seeker methods
4. `backend/src/controllers/jobSeekersController.js` - Fixed response format
5. `database/init/05_job_seeker_profiles_sample_data.sql` - New file with sample data

## Additional Fixes

### Updated All JobSeekersService Endpoints
Fixed all remaining `/job-seekers` endpoints to `/jobs/seekers`:
- `getJobSeeker(id)` - Individual profile lookup
- `createJobSeeker()` - Create new profile
- `updateJobSeeker()` - Update existing profile  
- `deleteJobSeeker()` - Delete profile
- `markFoundWork()` - Mark as found work
- `repostJobSeeker()` - Repost listing
- `getJobSeekerLimits()` - Get user limits

### Updated ApiService Endpoints
Fixed all `/job-seekers` endpoints in `api.ts`:
- `getJobSeekers()` - List all seekers
- `getJobSeeker(id)` - Get individual seeker
- `createJobSeeker()` - Create new seeker
- `updateJobSeeker()` - Update existing seeker

## Notes

- The backend properly requires authentication for the endpoint
- The frontend's `JobSeekersService` handles guest authentication automatically
- All 8 sample profiles are active and searchable
- The profiles include realistic data for New York area job seekers

