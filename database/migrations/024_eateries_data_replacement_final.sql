-- Migration: Eateries Data Replacement (Final)
-- Date: 2025-01-19
-- Description: Add new enum values, update data, add price_min/max

BEGIN;

-- Step 1: Drop the view that depends on kosher_level
DROP VIEW IF EXISTS entities_unified;

-- Step 2: Add new enum values to existing kosher_level type
ALTER TYPE kosher_level ADD VALUE IF NOT EXISTS 'meat';
ALTER TYPE kosher_level ADD VALUE IF NOT EXISTS 'dairy';
ALTER TYPE kosher_level ADD VALUE IF NOT EXISTS 'parve';

-- Step 3: Update kosher_level values to dietary types
-- For entities table
UPDATE entities 
SET kosher_level = CASE
  WHEN kosher_level::text = 'glatt' THEN 'meat'::kosher_level
  WHEN kosher_level::text = 'chalav_yisrael' THEN 'dairy'::kosher_level
  WHEN kosher_level::text = 'pas_yisrael' THEN 'parve'::kosher_level
  WHEN kosher_level::text = 'regular' THEN 'parve'::kosher_level
  ELSE kosher_level
END
WHERE kosher_level::text IN ('glatt', 'chalav_yisrael', 'pas_yisrael', 'regular');

-- For entities_backup table
UPDATE entities_backup 
SET kosher_level = CASE
  WHEN kosher_level::text = 'glatt' THEN 'meat'::kosher_level
  WHEN kosher_level::text = 'chalav_yisrael' THEN 'dairy'::kosher_level
  WHEN kosher_level::text = 'pas_yisrael' THEN 'parve'::kosher_level
  WHEN kosher_level::text = 'regular' THEN 'parve'::kosher_level
  ELSE kosher_level
END
WHERE kosher_level::text IN ('glatt', 'chalav_yisrael', 'pas_yisrael', 'regular');

-- For restaurants_normalized table
UPDATE restaurants_normalized 
SET kosher_level = CASE
  WHEN kosher_level::text = 'glatt' THEN 'meat'::kosher_level
  WHEN kosher_level::text = 'chalav_yisrael' THEN 'dairy'::kosher_level
  WHEN kosher_level::text = 'pas_yisrael' THEN 'parve'::kosher_level
  WHEN kosher_level::text = 'regular' THEN 'parve'::kosher_level
  ELSE kosher_level
END
WHERE kosher_level::text IN ('glatt', 'chalav_yisrael', 'pas_yisrael', 'regular');

-- Step 4: Standardize kosher_certification values
-- Update to common hechsher abbreviations
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

-- Step 5: Add price_min and price_max fields
ALTER TABLE restaurants_normalized 
  ADD COLUMN IF NOT EXISTS price_min DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS price_max DECIMAL(10, 2);

-- Migrate price_range to min/max
UPDATE restaurants_normalized
SET 
  price_min = CASE price_range
    WHEN '$' THEN 5.00
    WHEN '$$' THEN 10.00
    WHEN '$$$' THEN 20.00
    WHEN '$$$$' THEN 40.00
    ELSE 10.00
  END,
  price_max = CASE price_range
    WHEN '$' THEN 10.00
    WHEN '$$' THEN 20.00
    WHEN '$$$' THEN 40.00
    WHEN '$$$$' THEN 100.00
    ELSE 20.00
  END
WHERE price_range IS NOT NULL;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_kosher_level ON restaurants_normalized(kosher_level);
CREATE INDEX IF NOT EXISTS idx_restaurants_kosher_cert ON restaurants_normalized(kosher_certification);
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range ON restaurants_normalized(price_min, price_max);

-- Recreate the entities_unified view
CREATE VIEW entities_unified AS
SELECT 
    e.id,
    e.entity_type,
    e.name,
    e.description,
    e.long_description,
    e.owner_id,
    e.address,
    e.city,
    e.state,
    e.zip_code,
    e.country,
    e.phone,
    e.email,
    e.website,
    e.latitude,
    e.longitude,
    e.rating,
    e.review_count,
    e.is_verified,
    e.is_active,
    e.created_at,
    e.updated_at,
    m.kosher_level AS mikvah_kosher_level,
    m.denomination AS mikvah_denomination,
    m.has_parking AS mikvah_has_parking,
    m.has_accessibility AS mikvah_has_accessibility,
    m.has_private_rooms AS mikvah_has_private_rooms,
    m.has_heating AS mikvah_has_heating,
    m.has_air_conditioning AS mikvah_has_air_conditioning,
    m.has_wifi AS mikvah_has_wifi,
    m.price_per_use,
    m.currency,
    m.accepts_cash AS mikvah_accepts_cash,
    m.accepts_credit AS mikvah_accepts_credit,
    m.accepts_checks AS mikvah_accepts_checks,
    m.operating_hours AS mikvah_operating_hours,
    s.denomination AS synagogue_denomination,
    s.rabbi_name,
    s.congregation_size,
    s.has_parking AS synagogue_has_parking,
    s.has_accessibility AS synagogue_has_accessibility,
    s.has_wifi AS synagogue_has_wifi,
    s.has_kosher_kitchen,
    s.has_mikvah AS synagogue_has_mikvah,
    s.has_library,
    s.has_youth_programs,
    s.has_adult_education,
    s.has_social_events,
    s.daily_minyan,
    s.shabbat_services,
    s.holiday_services,
    s.lifecycle_services,
    s.operating_hours AS synagogue_operating_hours,
    r.kosher_level AS restaurant_kosher_level,
    r.kosher_certification,
    r.kosher_certificate_number,
    r.kosher_expires_at,
    r.cuisine_type,
    r.price_range,
    r.price_min,
    r.price_max,
    r.has_parking AS restaurant_has_parking,
    r.has_wifi AS restaurant_has_wifi,
    r.has_delivery AS restaurant_has_delivery,
    r.has_takeout,
    r.has_dine_in,
    r.has_outdoor_seating,
    r.operating_hours AS restaurant_operating_hours,
    st.store_type,
    st.kosher_level AS store_kosher_level,
    st.kosher_certification AS store_kosher_certification,
    st.kosher_certificate_number AS store_kosher_certificate_number,
    st.kosher_expires_at AS store_kosher_expires_at,
    st.accepts_credit AS store_accepts_credit,
    st.accepts_cash AS store_accepts_cash,
    st.accepts_checks AS store_accepts_checks,
    st.has_delivery AS store_has_delivery,
    st.has_parking AS store_has_parking,
    st.operating_hours AS store_operating_hours
FROM entities_normalized e
LEFT JOIN mikvahs_normalized m ON e.id = m.entity_id
LEFT JOIN synagogues_normalized s ON e.id = s.entity_id
LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
LEFT JOIN stores_normalized st ON e.id = st.entity_id;

COMMIT;
