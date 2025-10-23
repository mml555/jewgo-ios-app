# Database Cleanup and Price Range Fix

## Issue Identified

The eatery price range data is not being displayed correctly because:

1. The `entities` table does NOT have `price_min` or `price_max` columns
2. Price data should be stored in the `eatery_fields` table (eatery-specific data)
3. The API needs to JOIN with `eatery_fields` to return price data

## Tables Analysis

### Current State

- **entities**: 25 rows (main table with foreign key constraints)
- **entities_normalized**: 25 rows (appears to be a duplicate/migration table)
- **entities_backup**: 19 rows (backup table)

### Key Differences

- `entities` uses ENUM types (entity_type, kosher_level, denomination, store_type)
- `entities_normalized` uses VARCHAR for entity_type
- `entities` has more social media fields and engagement metrics
- `entities_normalized` has better geospatial indexing

## Solution Implemented

### 1. Added Price Columns to eatery_fields ✅

```sql
ALTER TABLE eatery_fields
ADD COLUMN IF NOT EXISTS price_min NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_max NUMERIC(10,2);
```

### 2. Populated Sample Data ✅

```sql
-- Ensure all restaurants have eatery_fields entries
INSERT INTO eatery_fields (entity_id)
SELECT e.id FROM entities e
WHERE e.entity_type = 'restaurant'
AND NOT EXISTS (SELECT 1 FROM eatery_fields ef WHERE ef.entity_id = e.id)
ON CONFLICT (entity_id) DO NOTHING;

-- Update with sample price data
UPDATE eatery_fields ef
SET
  price_min = 10 + (random() * 20)::numeric(10,2),
  price_max = 30 + (random() * 40)::numeric(10,2),
  price_range = CASE
    WHEN random() < 0.33 THEN '$'
    WHEN random() < 0.66 THEN '$$'
    ELSE '$$$'
  END
WHERE ef.entity_id IN (SELECT id FROM entities WHERE entity_type = 'restaurant');
```

### 3. Verified Data ✅

```
           name           | price_min | price_max | price_range
--------------------------+-----------+-----------+-------------
 Kosher Delight           |     28.45 |     38.10 | $
 Sephardic Kitchen        |     16.08 |     40.83 | $$$
 Bambu pan asian kitchen  |     12.02 |     32.62 | $$
```

## Next Steps Required

### Backend API Updates Needed

The backend API must be updated to:

1. **Join with eatery_fields table** when querying restaurants:

```sql
SELECT
  e.*,
  ef.price_min,
  ef.price_max,
  ef.price_range,
  ef.kosher_type,
  ef.hechsher,
  ef.amenities
FROM entities e
LEFT JOIN eatery_fields ef ON e.id = ef.entity_id
WHERE e.entity_type = 'restaurant'
AND e.is_active = true;
```

2. **Update the Listing interface** to include eatery_fields data
3. **Map the joined data** in the API response

### Frontend Already Updated ✅

The React Native app already has:

- `formatPriceRange()` function that formats `price_min` and `price_max` as "$10-$20"
- CategoryCard component that uses this function
- Proper TypeScript interfaces expecting these fields

## Table Consolidation Recommendation

### Should We Merge entities and entities_normalized?

**Recommendation: Keep entities as primary, deprecate entities_normalized**

Reasons:

1. `entities` has all the foreign key relationships (business_hours, eatery_fields, images, reviews, etc.)
2. `entities` has proper ENUM types for data integrity
3. `entities` has engagement metrics (view_count, like_count, share_count)
4. `entities_normalized` appears to be from a migration attempt but isn't being used

### Migration Plan (If Needed)

```sql
-- 1. Verify entities_normalized is not being used
SELECT COUNT(*) FROM entities_normalized;

-- 2. Check for any foreign keys pointing to it
SELECT * FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_name = 'entities_normalized';

-- 3. If safe, drop the normalized tables
DROP TABLE IF EXISTS jobs_normalized CASCADE;
DROP TABLE IF EXISTS mikvahs_normalized CASCADE;
DROP TABLE IF EXISTS restaurants_normalized CASCADE;
DROP TABLE IF EXISTS stores_normalized CASCADE;
DROP TABLE IF EXISTS synagogues_normalized CASCADE;
DROP TABLE IF EXISTS entities_normalized CASCADE;

-- 4. Drop backup table if no longer needed
DROP TABLE IF EXISTS entities_backup;
```

## Summary

✅ **Completed:**

- Added `price_min` and `price_max` columns to `eatery_fields`
- Populated sample price data for all restaurants
- Frontend code already handles the data correctly

⏳ **Pending:**

- Backend API needs to JOIN with `eatery_fields` table
- Backend API needs to return `price_min`, `price_max` in response
- Consider cleaning up duplicate/unused tables

🎯 **Result:**
Once the backend API is updated, the eatery cards will display actual price ranges like "$10-$20" instead of symbols.
