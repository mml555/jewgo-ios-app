# Jobs Requirements Feature Implementation

## Summary

Successfully implemented a "Requirements" section (250 characters max) and shortened the "About" section to 200 characters in the job listings displayed on business detail pages.

## Database Changes

### Local Database (localhost:5433)

**Migration Applied:**

- Added `business_entity_id` column to `jobs` table
- Created index for performance: `idx_jobs_business_entity`
- Created `business_hiring_summary` view for analytics

**Sample Data Created:**

- 4 sample jobs linked to existing businesses:
  1. **Restaurant Manager** at Jerusalem Grill (Manhattan, NY)
  2. **Sous Chef** at Kosher Delight (Brooklyn, NY)
  3. **Administrative Assistant** at Congregation Beth Israel (Brooklyn, NY)
  4. **Server / Wait Staff** at Test Kosher Restaurant (Brooklyn, NY)

All jobs include:

- 5-6 requirements (stored as PostgreSQL `text[]` array)
- 4-5 benefits (stored as PostgreSQL `text[]` array)
- Link to business entity via `business_entity_id`

## Frontend Changes

### New Component: `BusinessJobsSection.tsx`

Located at: `src/components/BusinessJobsSection.tsx`

**Features:**

- Displays up to 3 job postings for a business
- **Description:** Truncated to 200 characters max
- **Requirements:** Truncated to 250 characters max
- Handles both string and array formats for requirements/benefits
- Horizontally scrollable job cards
- "View All X Jobs" button if more than 3 jobs exist
- Conditional rendering - only shows if jobs exist for the business

**Usage:**

```tsx
<BusinessJobsSection
  businessId="uuid-of-business"
  businessName="Business Name"
  maxDisplayCount={3}
/>
```

### Integration

**File:** `src/screens/ListingDetailScreen.tsx`

Added the `BusinessJobsSection` component below the specials section:

```tsx
<View style={styles.divider} />;

{
  /* Business Jobs - I'm Hiring Section */
}
<BusinessJobsSection
  businessId={itemId}
  businessName={item?.title || 'Business'}
  maxDisplayCount={3}
/>;
```

## Backend Changes

### File: `backend/src/controllers/jobsController.js`

**Updates:**

1. **`getJobListings` method:**

   - Added `business_id` filter support
   - Added `employer_id` filter support

2. **`createJobListing` method:**

   - Added `businessEntityId` field support

3. **`getJobListingById` method:**
   - Fixed guest user handling (guest IDs aren't valid UUIDs)
   - Removed dependency on non-existent `saved_jobs` table

### File: `src/services/JobsService.ts`

**Updates:**

- Added `business_id` and `employer_id` to filter options
- Updated `JobListing` interface to support `requirements: string | string[]`

## API Endpoints

### Get Jobs by Business

```bash
GET /api/v5/jobs/listings?business_id={uuid}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "id": "73bdcd16-2d1f-4d3e-a80d-6092ca304d05",
        "title": "Restaurant Manager",
        "description": "Manage daily operations...",
        "requirements": [
          "3+ years restaurant management experience",
          "Knowledge of kosher food preparation",
          "Strong leadership skills",
          "Excellent communication",
          "Ability to work evenings and weekends",
          "Food safety certification required"
        ],
        "business_entity_id": "41ee990e-f672-4767-895d-d9081ae1ae62",
        ...
      }
    ]
  }
}
```

### Get Job Details

```bash
GET /api/v5/jobs/listings/{job_id}
```

## Testing

### 1. Test in the App

1. **Navigate to a business with jobs:**

   - Go to the listing details for "Jerusalem Grill" (Manhattan, NY)
   - Scroll down to see the "I'm Hiring" section
   - Verify the job shows:
     - Title: "Restaurant Manager"
     - Description (truncated to 200 chars)
     - Requirements section (truncated to 250 chars)

2. **Test the data:**
   - Requirements should display as: "3+ years restaurant management experience, Knowledge of kosher food preparation..."
   - Should see 6 requirements joined by commas and truncated if needed

### 2. Test via API

```bash
# Create a guest session
TOKEN=$(curl -s -X POST "http://localhost:3001/api/v5/guest/create" \
  -H "Content-Type: application/json" \
  -d '{"deviceInfo":{"platform":"ios","model":"test"}}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['sessionToken'])")

# Get jobs for Jerusalem Grill
curl -s "http://localhost:3001/api/v5/jobs/listings?business_id=41ee990e-f672-4767-895d-d9081ae1ae62" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Get specific job details
curl -s "http://localhost:3001/api/v5/jobs/listings/73bdcd16-2d1f-4d3e-a80d-6092ca304d05" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### 3. Test Database Query

```bash
PGPASSWORD=jewgo_dev_password psql -h localhost -p 5433 -U jewgo_user -d jewgo_dev -c \
  "SELECT id, title, LEFT(description, 100), requirements, business_entity_id
   FROM jobs WHERE business_entity_id IS NOT NULL LIMIT 3;"
```

## Character Limits

- **Description:** 200 characters (enforced in `BusinessJobsSection` component)
- **Requirements:** 250 characters (enforced in `BusinessJobsSection` component)

## Data Structure

### Requirements Field

- **Database:** `text[]` (PostgreSQL array)
- **API Response:** `string[]` (JSON array)
- **Frontend Display:** Joined string with commas, truncated to 250 chars

Example:

```typescript
// From database/API
requirements: [
  '3+ years restaurant management experience',
  'Knowledge of kosher food preparation',
  'Strong leadership skills',
];

// Displayed as
('3+ years restaurant management experience, Knowledge of kosher food preparation, Strong leadership skills');
```

## Files Modified

1. `src/components/BusinessJobsSection.tsx` (NEW)
2. `src/screens/ListingDetailScreen.tsx`
3. `src/services/JobsService.ts`
4. `backend/src/controllers/jobsController.js`
5. `database/scripts/create_sample_jobs_local.sql` (NEW)

## Database Schema

```sql
-- Added to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS business_entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_jobs_business_entity
  ON jobs(business_entity_id)
  WHERE business_entity_id IS NOT NULL;
```

## Production Deployment Notes

**For Neon Database (Production):**

- The migration was already applied
- Sample jobs were already created
- Business entities are linked correctly

**For Local Development:**

- Migration applied to `jewgo_dev` database on port 5433
- Sample jobs created and linked to local business entities

## Known Issues & Fixes

### Issue 1: Guest User UUID Errors

**Problem:** Guest users have IDs like `guest_{uuid}` which aren't valid UUIDs  
**Fix:** Modified `getJobListingById` to detect and handle guest users separately

### Issue 2: saved_jobs Table Not Existing

**Problem:** Query referenced non-existent `saved_jobs` table  
**Fix:** Changed to always return `is_saved: false` instead of querying the table

### Issue 3: Requirements Not Displaying

**Problem:** Requirements field was an array but component expected a string  
**Fix:** Updated `truncateText` function to handle both `string` and `string[]` types

## Next Steps (Optional)

1. **Add filtering:** Allow filtering jobs by business in the main jobs screen
2. **Add analytics:** Track which businesses have the most job views
3. **Add saved jobs:** Implement the `saved_jobs` table for bookmarking
4. **Add applications:** Track job applications per business

---

**Implementation Date:** October 13, 2025  
**Status:** ✅ Complete and Tested
