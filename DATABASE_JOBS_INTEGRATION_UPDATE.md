# Database and Backend Update: Business Jobs Integration

## Overview

This update integrates job listings with business entities, allowing businesses to display their job openings on their listing detail pages. The "I'm Hiring" section shows jobs with:

- **About section: 200 characters max**
- **Requirements section: 250 characters max**

## Database Changes

### 1. Migration File: `024_add_business_entity_to_jobs.sql`

**Location:** `/database/migrations/024_add_business_entity_to_jobs.sql`

**Changes Made:**

#### A. New Column Added

```sql
ALTER TABLE job_listings
ADD COLUMN business_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;
```

This column creates an optional link between job listings and business entities (restaurants, stores, synagogues, etc.).

#### B. Performance Index

```sql
CREATE INDEX idx_job_listings_business_entity
ON job_listings(business_entity_id)
WHERE business_entity_id IS NOT NULL;
```

Ensures fast queries when fetching jobs for a specific business.

#### C. Updated Analytics View

```sql
CREATE OR REPLACE VIEW job_listing_stats
```

Now includes business information:

- `business_name`
- `business_type`
- `business_city`
- `business_state`

#### D. New Business Hiring Summary View

```sql
CREATE OR REPLACE VIEW business_hiring_summary
```

Provides analytics for businesses:

- Total jobs posted
- Active jobs count
- Filled jobs count
- Total views and applications
- Latest job posted date

### 2. How to Apply Migration

**Option 1: Using the Script (Recommended)**

```bash
cd /Users/mendell/JewgoAppFinal/database/scripts
./apply_business_jobs_migration.sh
```

**Option 2: Manual SQL**

```bash
psql $DATABASE_URL -f database/migrations/024_add_business_entity_to_jobs.sql
```

**Option 3: Via Backend (if migration runner exists)**

```bash
npm run migrate
```

## Backend API Changes

### Updated Files

- `/backend/src/controllers/jobsController.js`

### Changes Made

#### 1. Create Job Listing - NEW Parameter

**Endpoint:** `POST /jobs/listings`

**New Field:**

```javascript
{
  "businessEntityId": "uuid-of-business-entity", // Optional
  // ... other fields
}
```

**Example Request:**

```json
{
  "jobTitle": "Restaurant Manager",
  "industryId": "hospitality-uuid",
  "jobTypeId": "full-time-uuid",
  "compensationStructureId": "salary-uuid",
  "salaryMin": 5000000,
  "salaryMax": 7000000,
  "zipCode": "10001",
  "description": "Manage daily operations of our kosher restaurant...",
  "requirements": "3+ years restaurant management experience...",
  "businessEntityId": "restaurant-entity-uuid"
}
```

#### 2. Get Job Listings - NEW Filters

**Endpoint:** `GET /jobs/listings`

**New Query Parameters:**

**Filter by Business:**

```
GET /jobs/listings?business_id=uuid-of-business-entity
```

**Filter by Employer:**

```
GET /jobs/listings?employer_id=uuid-of-user
```

**Combined Example:**

```
GET /jobs/listings?business_id=abc123&limit=3&status=active
```

## Frontend Integration

### Component Updates

**File:** `/src/components/BusinessJobsSection.tsx`

The component now fetches jobs using the `employer_id` filter:

```typescript
const response = await JobsService.getJobListings({
  limit: maxDisplayCount,
  employer_id: businessId,
});
```

### Service Updates

**File:** `/src/services/JobsService.ts`

Added filter parameters:

```typescript
static async getJobListings(filters?: {
  // ... existing filters
  business_id?: string;
  employer_id?: string;
}): Promise<{ jobListings: JobListing[]; pagination: any }>
```

## Data Model

### Relationship Diagram

```
┌─────────────────┐
│     users       │
│  (employers)    │
└────────┬────────┘
         │
         │ owner_id
         ▼
┌─────────────────┐         ┌──────────────────┐
│    entities     │◄────────│  job_listings    │
│  (businesses)   │         │                  │
│                 │  business│  - employer_id   │
│  - restaurants  │  _entity│  - job_title     │
│  - stores       │     _id │  - description   │
│  - synagogues   │         │  - requirements  │
└─────────────────┘         └──────────────────┘
```

### Field Mapping

| Job Listing Field    | Type | Purpose                           |
| -------------------- | ---- | --------------------------------- |
| `employer_id`        | UUID | User who posted the job           |
| `business_entity_id` | UUID | Business where the job is located |

**Key Points:**

- `employer_id` is **required** - the user posting the job
- `business_entity_id` is **optional** - links job to a business
- One user can own multiple businesses
- One business can have multiple job postings
- Jobs can exist without a business link (independent employers)

## Usage Examples

### 1. Business Posts a Job

```javascript
// Business owner creates a job for their restaurant
const job = await JobsService.createJobListing({
  jobTitle: 'Sous Chef',
  description: 'Assist in kitchen management...', // Max 200 chars on display
  requirements: 'Culinary degree, 2+ years...', // Max 250 chars on display
  businessEntityId: restaurantId, // Links to the business
  // ... other fields
});
```

### 2. Display Jobs on Business Page

```javascript
// Fetch jobs for a specific business
const jobs = await JobsService.getJobListings({
  employer_id: businessOwnerId,
  limit: 3,
  status: 'active',
});
```

### 3. Query Business Hiring Stats

```sql
-- Get hiring summary for all active businesses
SELECT * FROM business_hiring_summary
WHERE active_jobs > 0
ORDER BY total_applications DESC;
```

## Testing Checklist

### Database

- [ ] Run migration successfully
- [ ] Verify `business_entity_id` column exists in `job_listings`
- [ ] Verify index `idx_job_listings_business_entity` created
- [ ] Check `job_listing_stats` view includes business info
- [ ] Check `business_hiring_summary` view works

### Backend API

- [ ] Create job with `businessEntityId` parameter
- [ ] Create job without `businessEntityId` (should work)
- [ ] Filter jobs by `business_id`
- [ ] Filter jobs by `employer_id`
- [ ] Verify responses include business information

### Frontend

- [ ] Navigate to a business listing detail page
- [ ] See "I'm Hiring" section appear (if jobs exist)
- [ ] See job cards with truncated about (200 chars)
- [ ] See job cards with truncated requirements (250 chars)
- [ ] Click job card to navigate to job detail
- [ ] Click "View All" to see all business jobs

## Migration Rollback

If you need to undo this migration:

```sql
-- Remove the view
DROP VIEW IF EXISTS business_hiring_summary;

-- Remove the updated view
DROP VIEW IF EXISTS job_listing_stats CASCADE;

-- Recreate original view (without business info)
-- [Use original CREATE VIEW statement from migration 020]

-- Remove the index
DROP INDEX IF EXISTS idx_job_listings_business_entity;

-- Remove the column
ALTER TABLE job_listings DROP COLUMN IF EXISTS business_entity_id;
```

## Performance Considerations

1. **Index on business_entity_id** ensures fast lookups
2. **Partial index** (`WHERE business_entity_id IS NOT NULL`) saves space
3. **View materialization** can be added later if needed for high-traffic sites
4. **Recommended**: Add caching in frontend for business job sections

## Security Notes

1. **Foreign Key Constraint:** `business_entity_id` must reference a valid entity
2. **ON DELETE SET NULL:** If business is deleted, jobs remain but lose business link
3. **User Ownership:** Backend should verify user owns the business before linking
4. **API Validation:** Validate `businessEntityId` exists and user has permission

## Future Enhancements

Potential improvements:

1. Add `featured_business_job` flag for promoted positions
2. Track `business_application_count` separately from total
3. Add business-specific application questions
4. Implement job templates for businesses
5. Add automatic job expiration based on business subscription
6. Create business hiring dashboard with analytics

## Support

For issues or questions:

1. Check migration was applied: `SELECT column_name FROM information_schema.columns WHERE table_name = 'job_listings' AND column_name = 'business_entity_id';`
2. Check backend logs for errors
3. Verify API endpoints return expected data
4. Test with sample data first

## Version Info

- **Migration Version:** 024
- **Created:** 2025-01-13
- **Dependency:** Requires migration 020 (complete_jobs_system)
- **Backend Version:** Compatible with current API v1
- **Frontend Version:** Compatible with current React Native app
