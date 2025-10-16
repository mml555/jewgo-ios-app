# Quick Setup Guide: Business Jobs Feature

## TL;DR - 3 Steps to Enable

```bash
# 1. Apply database migration
cd database/scripts
./apply_business_jobs_migration.sh

# 2. Restart backend
cd ../../backend
npm restart

# 3. Done! Visit any business listing page
```

## What This Adds

✅ "I'm Hiring" section on business listing pages  
✅ Job cards showing About (200 chars) and Requirements (250 chars)  
✅ Horizontal scrollable job list  
✅ "View All" link to see all jobs from the business

## Step-by-Step Setup

### 1. Database Migration

```bash
# Set your database URL (if not already set)
export DATABASE_URL="postgresql://username:password@host:port/database"

# Run migration script
cd /Users/mendell/JewgoAppFinal/database/scripts
./apply_business_jobs_migration.sh
```

**What it does:**

- Adds `business_entity_id` column to `job_listings` table
- Creates performance index
- Updates analytics views

### 2. Verify Migration

```bash
# Check if column was added
psql $DATABASE_URL -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'job_listings' AND column_name = 'business_entity_id';"
```

**Expected output:**

```
      column_name      | data_type
-----------------------+-----------
 business_entity_id    | uuid
```

### 3. Restart Backend

```bash
cd /Users/mendell/JewgoAppFinal/backend
npm restart
# or
pm2 restart jewgo-backend
```

### 4. Test the Feature

#### A. Create a Job Linked to a Business

**API Request:**

```bash
curl -X POST https://your-api.com/jobs/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jobTitle": "Restaurant Manager",
    "industryId": "your-industry-id",
    "jobTypeId": "your-job-type-id",
    "compensationStructureId": "your-comp-structure-id",
    "salaryMin": 5000000,
    "salaryMax": 7000000,
    "zipCode": "10001",
    "description": "Manage daily restaurant operations, staff scheduling, and customer service in our kosher establishment.",
    "requirements": "3+ years restaurant management, food safety certification, experience with POS systems, excellent communication skills, kosher kitchen knowledge preferred.",
    "businessEntityId": "uuid-of-your-restaurant"
  }'
```

#### B. View Jobs on Business Page

1. Open the mobile app
2. Navigate to any business listing (restaurant, store, etc.)
3. Scroll down past "Business Specials"
4. Look for "💼 I'm Hiring" section
5. See job cards with truncated text

#### C. Test API Filter

```bash
# Get jobs for a specific business
curl "https://your-api.com/jobs/listings?business_id=BUSINESS_UUID&limit=3"

# Get jobs by employer
curl "https://your-api.com/jobs/listings?employer_id=USER_UUID"
```

## Files Changed

### Database

```
✅ database/migrations/024_add_business_entity_to_jobs.sql
✅ database/scripts/apply_business_jobs_migration.sh
```

### Backend

```
✅ backend/src/controllers/jobsController.js
   - Added businessEntityId parameter to createJobListing
   - Added business_id and employer_id filters to getJobListings
```

### Frontend

```
✅ src/components/BusinessJobsSection.tsx (NEW)
   - Displays job cards on business pages
   - Truncates About to 200 chars
   - Truncates Requirements to 250 chars

✅ src/screens/ListingDetailScreen.tsx
   - Integrated BusinessJobsSection component

✅ src/services/JobsService.ts
   - Added business_id and employer_id filter support
```

## Common Issues

### Issue 1: Migration Fails

**Error:** `column "business_entity_id" already exists`

**Solution:** Migration already applied, skip to step 2.

### Issue 2: Jobs Not Showing

**Check:**

1. Does the business have active jobs?
   ```sql
   SELECT * FROM job_listings WHERE business_entity_id = 'YOUR_BUSINESS_ID';
   ```
2. Is the business ID correct?
3. Are jobs set to `is_active = true`?

### Issue 3: API Returns Empty

**Check:**

1. Backend restarted after migration?
2. Correct query parameter: `business_id` not `businessId`
3. Using GET not POST

## Sample Data

### Create Sample Jobs for Testing

```sql
-- Get a business ID
SELECT id, name, entity_type FROM entities WHERE entity_type = 'restaurant' LIMIT 1;

-- Create sample job (replace UUIDs with real ones)
INSERT INTO job_listings (
  employer_id,
  business_entity_id,
  job_title,
  description,
  requirements,
  industry_id,
  job_type_id,
  compensation_structure_id,
  zip_code,
  status
) VALUES (
  'your-user-id',
  'your-business-id',
  'Kitchen Manager',
  'Oversee kitchen operations, manage staff, ensure food quality and safety standards.',
  'Culinary degree or equivalent experience, 3+ years in commercial kitchen, ServSafe certified, leadership skills.',
  (SELECT id FROM job_industries WHERE key = 'hospitality'),
  (SELECT id FROM job_types WHERE key = 'full_time'),
  (SELECT id FROM compensation_structures WHERE key = 'salary'),
  '10001',
  'active'
);
```

## Testing Checklist

- [ ] Migration applied successfully
- [ ] Backend restarted
- [ ] Can create job with `businessEntityId`
- [ ] Can filter jobs by `business_id`
- [ ] Business page shows "I'm Hiring" section
- [ ] Job cards show truncated About (200 chars)
- [ ] Job cards show truncated Requirements (250 chars)
- [ ] Clicking job card navigates to detail
- [ ] "View All" button works

## Next Steps

1. **Populate Jobs:** Add real job listings for your businesses
2. **Business Dashboard:** Let business owners post jobs from their dashboard
3. **Analytics:** Track how many applications come from business pages
4. **Featured Jobs:** Highlight certain positions
5. **Auto-linking:** When user creates job, auto-link to their business

## Rollback Instructions

If needed, rollback the changes:

```bash
# Run rollback SQL
psql $DATABASE_URL <<EOF
DROP VIEW IF EXISTS business_hiring_summary;
ALTER TABLE job_listings DROP COLUMN IF EXISTS business_entity_id;
EOF

# Restart backend
cd backend && npm restart
```

Then remove the frontend component from `ListingDetailScreen.tsx`.

## Support

**Check migration status:**

```sql
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'job_listings'
  AND column_name = 'business_entity_id';
```

**Check existing jobs:**

```sql
SELECT
  id,
  job_title,
  business_entity_id,
  status
FROM job_listings
LIMIT 5;
```

**View business hiring summary:**

```sql
SELECT * FROM business_hiring_summary LIMIT 10;
```

## Documentation

For detailed information:

- Full technical docs: `DATABASE_JOBS_INTEGRATION_UPDATE.md`
- Frontend changes: `JOBS_SECTION_UPDATE.md`
- Migration file: `database/migrations/024_add_business_entity_to_jobs.sql`
