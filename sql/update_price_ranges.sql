-- ============================================================================
-- Update Eatery Price Ranges
-- ============================================================================
-- This script updates the eatery_fields table with predefined price buckets
-- Buckets: $5-$10, $10-$20, $20-$30, $30-$40, $40-$50, $50-$60,
--          $60-$70, $70-$80, $80-$90, $90-$100, $100+
-- ============================================================================

-- Step 1: Add price columns if they don't exist
ALTER TABLE eatery_fields 
ADD COLUMN IF NOT EXISTS price_min NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS price_max NUMERIC(10,2);

-- Step 2: Ensure all restaurants have eatery_fields entries
INSERT INTO eatery_fields (entity_id)
SELECT e.id FROM entities e 
WHERE e.entity_type = 'restaurant' 
AND NOT EXISTS (SELECT 1 FROM eatery_fields ef WHERE ef.entity_id = e.id)
ON CONFLICT (entity_id) DO NOTHING;

-- Step 3: Update with predefined price range buckets
-- This uses random assignment for demo - replace with actual data
WITH price_ranges AS (
  SELECT 
    entity_id,
    floor(random() * 11)::int as range_idx
  FROM eatery_fields
  WHERE entity_id IN (SELECT id FROM entities WHERE entity_type = 'restaurant')
)
UPDATE eatery_fields ef
SET 
  price_min = CASE pr.range_idx
    WHEN 0 THEN 5
    WHEN 1 THEN 10
    WHEN 2 THEN 20
    WHEN 3 THEN 30
    WHEN 4 THEN 40
    WHEN 5 THEN 50
    WHEN 6 THEN 60
    WHEN 7 THEN 70
    WHEN 8 THEN 80
    WHEN 9 THEN 90
    ELSE 100
  END,
  price_max = CASE pr.range_idx
    WHEN 0 THEN 10
    WHEN 1 THEN 20
    WHEN 2 THEN 30
    WHEN 3 THEN 40
    WHEN 4 THEN 50
    WHEN 5 THEN 60
    WHEN 6 THEN 70
    WHEN 7 THEN 80
    WHEN 8 THEN 90
    WHEN 9 THEN 100
    ELSE NULL  -- For $100+
  END,
  price_range = CASE pr.range_idx
    WHEN 0 THEN '$5-$10'
    WHEN 1 THEN '$10-$20'
    WHEN 2 THEN '$20-$30'
    WHEN 3 THEN '$30-$40'
    WHEN 4 THEN '$40-$50'
    WHEN 5 THEN '$50-$60'
    WHEN 6 THEN '$60-$70'
    WHEN 7 THEN '$70-$80'
    WHEN 8 THEN '$80-$90'
    WHEN 9 THEN '$90-$100'
    ELSE '$100+'
  END
FROM price_ranges pr
WHERE ef.entity_id = pr.entity_id;

-- Step 4: Verify the results
SELECT 
  e.name, 
  ef.price_min, 
  ef.price_max, 
  ef.price_range 
FROM entities e 
JOIN eatery_fields ef ON e.id = ef.entity_id 
WHERE e.entity_type = 'restaurant' 
ORDER BY ef.price_min;

-- ============================================================================
-- Manual Update Examples
-- ============================================================================

-- Set a specific restaurant to $10-$20 range
-- UPDATE eatery_fields ef
-- SET 
--   price_min = 10,
--   price_max = 20,
--   price_range = '$10-$20'
-- WHERE ef.entity_id = (
--   SELECT id FROM entities WHERE name = 'Restaurant Name' LIMIT 1
-- );

-- Set a specific restaurant to $100+ range
-- UPDATE eatery_fields ef
-- SET 
--   price_min = 100,
--   price_max = NULL,
--   price_range = '$100+'
-- WHERE ef.entity_id = (
--   SELECT id FROM entities WHERE name = 'Expensive Restaurant' LIMIT 1
-- );
