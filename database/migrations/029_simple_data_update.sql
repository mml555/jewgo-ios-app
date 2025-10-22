-- Migration: Simple Data Update
-- Date: 2025-01-19
-- Description: Update existing data to use new dietary types and price brackets

BEGIN;

-- Step 1: Update existing kosher_level values in entities table to dietary types
UPDATE entities 
SET kosher_level = CASE
  WHEN kosher_level::text = 'glatt' THEN 'meat'::kosher_level
  WHEN kosher_level::text = 'chalav_yisrael' THEN 'dairy'::kosher_level
  WHEN kosher_level::text = 'pas_yisrael' THEN 'parve'::kosher_level
  WHEN kosher_level::text = 'regular' THEN 'parve'::kosher_level
  ELSE kosher_level
END
WHERE kosher_level::text IN ('glatt', 'chalav_yisrael', 'pas_yisrael', 'regular');

-- Step 2: Update entities_backup table as well
UPDATE entities_backup 
SET kosher_level = CASE
  WHEN kosher_level::text = 'glatt' THEN 'meat'::kosher_level
  WHEN kosher_level::text = 'chalav_yisrael' THEN 'dairy'::kosher_level
  WHEN kosher_level::text = 'pas_yisrael' THEN 'parve'::kosher_level
  WHEN kosher_level::text = 'regular' THEN 'parve'::kosher_level
  ELSE kosher_level
END
WHERE kosher_level::text IN ('glatt', 'chalav_yisrael', 'pas_yisrael', 'regular');

-- Step 3: Update any existing kosher_certification values to standardized format
UPDATE restaurants_normalized
SET kosher_certification = CASE
  WHEN kosher_certification ILIKE '%KM%' THEN 'KM'
  WHEN kosher_certification ILIKE '%ORB%' THEN 'ORB'
  WHEN kosher_certification ILIKE '%OU%' THEN 'OU'
  WHEN kosher_certification ILIKE '%OK%' THEN 'OK'
  WHEN kosher_certification ILIKE '%Star-K%' THEN 'Star-K'
  WHEN kosher_certification ILIKE '%CRC%' THEN 'CRC'
  WHEN kosher_certification ILIKE '%Kof-K%' THEN 'Kof-K'
  ELSE kosher_certification
END
WHERE kosher_certification IS NOT NULL;

COMMIT;
