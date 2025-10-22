-- Migration: Update Existing Data to Eateries Format
-- Date: 2025-01-19
-- Description: Update existing kosher_level values to dietary types and add sample data

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

-- Step 3: Add sample restaurant data with new format
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
  has_outdoor_seating,
  operating_hours
) VALUES 
-- Meat restaurants
(
  (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1),
  'meat',
  'KM',
  'Kosher',
  '$10-20',
  10.00,
  20.00,
  true,
  true,
  true,
  true,
  true,
  false,
  '{"monday": {"open": "11:00", "close": "22:00", "closed": false}, "tuesday": {"open": "11:00", "close": "22:00", "closed": false}, "wednesday": {"open": "11:00", "close": "22:00", "closed": false}, "thursday": {"open": "11:00", "close": "22:00", "closed": false}, "friday": {"open": "11:00", "close": "15:00", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "11:00", "close": "22:00", "closed": false}}'::jsonb
),
-- Dairy restaurant
(
  (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 1),
  'dairy',
  'ORB',
  'Kosher',
  '$5-10',
  5.00,
  10.00,
  true,
  true,
  false,
  true,
  true,
  true,
  '{"monday": {"open": "08:00", "close": "20:00", "closed": false}, "tuesday": {"open": "08:00", "close": "20:00", "closed": false}, "wednesday": {"open": "08:00", "close": "20:00", "closed": false}, "thursday": {"open": "08:00", "close": "20:00", "closed": false}, "friday": {"open": "08:00", "close": "14:00", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "08:00", "close": "20:00", "closed": false}}'::jsonb
),
-- Parve restaurant
(
  (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 2),
  'parve',
  'OU',
  'Kosher',
  '$20-30',
  20.00,
  30.00,
  false,
  true,
  true,
  true,
  true,
  false,
  '{"monday": {"open": "12:00", "close": "21:00", "closed": false}, "tuesday": {"open": "12:00", "close": "21:00", "closed": false}, "wednesday": {"open": "12:00", "close": "21:00", "closed": false}, "thursday": {"open": "12:00", "close": "21:00", "closed": false}, "friday": {"open": "12:00", "close": "15:00", "closed": false}, "saturday": {"open": "20:00", "close": "23:00", "closed": false}, "sunday": {"open": "12:00", "close": "21:00", "closed": false}}'::jsonb
)
ON CONFLICT (entity_id) DO UPDATE SET
  kosher_level = EXCLUDED.kosher_level,
  kosher_certification = EXCLUDED.kosher_certification,
  cuisine_type = EXCLUDED.cuisine_type,
  price_range = EXCLUDED.price_range,
  price_min = EXCLUDED.price_min,
  price_max = EXCLUDED.price_max,
  has_parking = EXCLUDED.has_parking,
  has_wifi = EXCLUDED.has_wifi,
  has_delivery = EXCLUDED.has_delivery,
  has_takeout = EXCLUDED.has_takeout,
  has_dine_in = EXCLUDED.has_dine_in,
  has_outdoor_seating = EXCLUDED.has_outdoor_seating,
  operating_hours = EXCLUDED.operating_hours;

-- Step 4: Update any existing kosher_certification values to standardized format
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
