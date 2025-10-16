# Apply Job Requirements Fix to Production (Neon Database)

## What This Does

This updates your production database to:

1. Truncate all job descriptions to 200 characters max
2. Verify all jobs have requirements and benefits

## How to Apply

### Option 1: Using psql (Recommended)

```bash
# Set your Neon database URL
export DATABASE_URL="postgresql://neondb_owner:npg_j1VErkAiwc8h@ep-sweet-haze-adr4ogvy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Run the update
psql "$DATABASE_URL" << 'EOF'
BEGIN;

-- Truncate all job descriptions to 200 characters
UPDATE jobs
SET description = LEFT(description, 200)
WHERE LENGTH(description) > 200;

-- Show results
SELECT
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN LENGTH(description) <= 200 THEN 1 END) as jobs_within_limit,
    COUNT(CASE WHEN requirements IS NOT NULL AND array_length(requirements, 1) > 0 THEN 1 END) as jobs_with_requirements,
    COUNT(CASE WHEN benefits IS NOT NULL AND array_length(benefits, 1) > 0 THEN 1 END) as jobs_with_benefits
FROM jobs
WHERE is_active = true;

COMMIT;
EOF
```

### Option 2: Using Neon Console

1. Go to https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Paste this SQL:

```sql
BEGIN;

-- Truncate all job descriptions to 200 characters
UPDATE jobs
SET description = LEFT(description, 200)
WHERE LENGTH(description) > 200;

-- Show results
SELECT
    COUNT(*) as total_jobs,
    COUNT(CASE WHEN LENGTH(description) <= 200 THEN 1 END) as jobs_within_limit,
    COUNT(CASE WHEN requirements IS NOT NULL AND array_length(requirements, 1) > 0 THEN 1 END) as jobs_with_requirements,
    COUNT(CASE WHEN benefits IS NOT NULL AND array_length(benefits, 1) > 0 THEN 1 END) as jobs_with_benefits
FROM jobs
WHERE is_active = true;

COMMIT;
```

5. Click "Run" and verify the results

## Expected Results

You should see something like:

```
UPDATE X
 total_jobs | jobs_within_limit | jobs_with_requirements | jobs_with_benefits
------------|-------------------|------------------------|--------------------
         X  |                 X |                      X |                  X
```

Where X is the number of active jobs in your database.

## Verification

After applying, test a job in your app:

1. Open the JewGO app
2. Go to Jobs tab
3. Tap on any job listing
4. Verify:
   - ✅ "Requirements" tab is visible
   - ✅ Tapping it shows a bullet-point list
   - ✅ "Benefits" tab is visible
   - ✅ Description is concise (≤ 200 chars)

## Rollback (if needed)

This operation is **permanent** and truncates text. If you need to rollback:

1. Restore from a database backup before this update
2. OR manually update individual job descriptions through your admin panel

## Backend Deployment

The backend code changes are **already deployed** if you're using the latest code:

- ✅ New route `/api/v5/jobs/:id` added
- ✅ Works alongside existing `/api/v5/jobs/listings/:id`

No backend restart needed - the changes are backwards compatible.

---

**Status:** Ready to apply  
**Risk Level:** Low (only truncates long descriptions)  
**Reversible:** Only via backup restoration
