-- Migration: Add missing restaurants_normalized entries for old restaurants
-- Date: 2025-01-19
-- Description: Create restaurants_normalized entries for old restaurants that don't have them

BEGIN;

-- Insert missing restaurants_normalized entries for old restaurants
INSERT INTO restaurants_normalized (
  entity_id,
  kosher_level,
  kosher_certification,
  cuisine_type,
  price_range,
  price_min,
  price_max,
  has_parking,
  has_wifi,
  has_delivery,
  has_takeout,
  has_dine_in,
  has_outdoor_seating
)
SELECT 
  e.id,
  e.kosher_level,
  e.kosher_certification,
  'General', -- Default cuisine type
  '$$', -- Default price range
  10.00, -- Default price_min
  25.00, -- Default price_max
  true, -- Default values
  true,
  false,
  true,
  true,
  false
FROM entities e
WHERE e.entity_type = 'restaurant'
  AND NOT EXISTS (
    SELECT 1 FROM restaurants_normalized rn 
    WHERE rn.entity_id = e.id
  );

COMMIT;
