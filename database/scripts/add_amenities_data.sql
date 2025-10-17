-- Add amenities data to existing restaurants/eateries
-- This script adds realistic amenities data to existing restaurants

BEGIN;

-- Update existing restaurants with realistic amenities data
-- Most restaurants will have basic amenities
UPDATE restaurants_normalized SET
    has_parking = CASE 
        WHEN random() < 0.7 THEN true  -- 70% have parking
        ELSE false
    END,
    has_wifi = CASE 
        WHEN random() < 0.8 THEN true  -- 80% have wifi
        ELSE false
    END,
    has_delivery = CASE 
        WHEN random() < 0.6 THEN true  -- 60% have delivery
        ELSE false
    END,
    has_takeout = CASE 
        WHEN random() < 0.9 THEN true  -- 90% have takeout
        ELSE false
    END,
    has_dine_in = CASE 
        WHEN random() < 0.85 THEN true  -- 85% have dine-in
        ELSE false
    END,
    has_outdoor_seating = CASE 
        WHEN random() < 0.4 THEN true  -- 40% have outdoor seating
        ELSE false
    END,
    has_catering = CASE 
        WHEN random() < 0.5 THEN true  -- 50% have catering
        ELSE false
    END,
    has_shabbos_meals = CASE 
        WHEN random() < 0.3 THEN true  -- 30% have shabbos meals
        ELSE false
    END;

-- Add some specific amenities for certain types of restaurants
-- Fine dining restaurants are more likely to have parking and outdoor seating
UPDATE restaurants_normalized r
SET 
    has_parking = true,
    has_outdoor_seating = CASE WHEN random() < 0.6 THEN true ELSE false END
FROM entities_normalized e
WHERE r.entity_id = e.id 
    AND e.name ILIKE '%fine dining%'
    OR e.name ILIKE '%steakhouse%'
    OR e.name ILIKE '%restaurant%';

-- Fast casual restaurants are more likely to have delivery and takeout
UPDATE restaurants_normalized r
SET 
    has_delivery = true,
    has_takeout = true
FROM entities_normalized e
WHERE r.entity_id = e.id 
    AND (e.name ILIKE '%pizza%'
    OR e.name ILIKE '%burger%'
    OR e.name ILIKE '%sandwich%'
    OR e.name ILIKE '%delivery%');

-- Kosher restaurants are more likely to have shabbos meals and catering
UPDATE restaurants_normalized r
SET 
    has_shabbos_meals = CASE WHEN random() < 0.6 THEN true ELSE false END,
    has_catering = CASE WHEN random() < 0.7 THEN true ELSE false END
FROM entities_normalized e
WHERE r.entity_id = e.id 
    AND (e.name ILIKE '%kosher%'
    OR e.name ILIKE '%jewish%'
    OR e.name ILIKE '%delicatessen%'
    OR e.name ILIKE '%deli%');

-- Coffee shops and cafes are more likely to have wifi
UPDATE restaurants_normalized r
SET 
    has_wifi = true,
    has_outdoor_seating = CASE WHEN random() < 0.5 THEN true ELSE false END
FROM entities_normalized e
WHERE r.entity_id = e.id 
    AND (e.name ILIKE '%coffee%'
    OR e.name ILIKE '%cafe%'
    OR e.name ILIKE '%espresso%'
    OR e.name ILIKE '%latte%');

-- Ensure at least some restaurants have multiple amenities for testing
UPDATE restaurants_normalized 
SET 
    has_parking = true,
    has_wifi = true,
    has_delivery = true,
    has_takeout = true,
    has_dine_in = true,
    has_catering = true
WHERE entity_id IN (
    SELECT entity_id 
    FROM restaurants_normalized 
    ORDER BY random() 
    LIMIT 5
);

-- Add some restaurants with shabbos meals specifically
UPDATE restaurants_normalized 
SET 
    has_shabbos_meals = true,
    has_catering = true,
    has_dine_in = true
WHERE entity_id IN (
    SELECT entity_id 
    FROM restaurants_normalized 
    ORDER BY random() 
    LIMIT 3
);

COMMIT;

-- Display summary of amenities data
SELECT 
    'Amenities Summary' as summary,
    COUNT(*) as total_restaurants,
    COUNT(*) FILTER (WHERE has_parking) as with_parking,
    COUNT(*) FILTER (WHERE has_wifi) as with_wifi,
    COUNT(*) FILTER (WHERE has_delivery) as with_delivery,
    COUNT(*) FILTER (WHERE has_takeout) as with_takeout,
    COUNT(*) FILTER (WHERE has_dine_in) as with_dine_in,
    COUNT(*) FILTER (WHERE has_outdoor_seating) as with_outdoor_seating,
    COUNT(*) FILTER (WHERE has_catering) as with_catering,
    COUNT(*) FILTER (WHERE has_shabbos_meals) as with_shabbos_meals
FROM restaurants_normalized;
