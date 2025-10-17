-- Add missing restaurant amenities fields
-- This migration adds has_catering and has_shabbos_meals fields to restaurants_normalized table

BEGIN;

-- Add missing amenities fields to restaurants_normalized table
ALTER TABLE restaurants_normalized 
ADD COLUMN IF NOT EXISTS has_catering BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_shabbos_meals BOOLEAN DEFAULT FALSE;

-- Update the entities_unified view to include the new fields
DROP VIEW IF EXISTS entities_unified;

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
    
    -- Mikvah fields
    m.kosher_level as mikvah_kosher_level,
    m.denomination as mikvah_denomination,
    m.has_parking as mikvah_has_parking,
    m.has_accessibility as mikvah_has_accessibility,
    m.has_private_rooms as mikvah_has_private_rooms,
    m.has_heating as mikvah_has_heating,
    m.has_air_conditioning as mikvah_has_air_conditioning,
    m.has_wifi as mikvah_has_wifi,
    m.price_per_use,
    m.currency,
    m.accepts_cash as mikvah_accepts_cash,
    m.accepts_credit as mikvah_accepts_credit,
    m.accepts_checks as mikvah_accepts_checks,
    m.operating_hours as mikvah_operating_hours,
    
    -- Synagogue fields
    s.denomination as synagogue_denomination,
    s.rabbi_name,
    s.congregation_size,
    s.has_parking as synagogue_has_parking,
    s.has_accessibility as synagogue_has_accessibility,
    s.has_wifi as synagogue_has_wifi,
    s.has_kosher_kitchen,
    s.has_mikvah as synagogue_has_mikvah,
    s.has_library,
    s.has_youth_programs,
    s.has_adult_education,
    s.has_social_events,
    s.daily_minyan,
    s.shabbat_services,
    s.holiday_services,
    s.lifecycle_services,
    s.operating_hours as synagogue_operating_hours,
    
    -- Restaurant fields
    r.kosher_level as restaurant_kosher_level,
    r.kosher_certification,
    r.kosher_certificate_number,
    r.kosher_expires_at,
    r.cuisine_type,
    r.price_range,
    r.has_parking as restaurant_has_parking,
    r.has_wifi as restaurant_has_wifi,
    r.has_delivery as restaurant_has_delivery,
    r.has_takeout,
    r.has_dine_in,
    r.has_outdoor_seating,
    r.has_catering,
    r.has_shabbos_meals,
    r.operating_hours as restaurant_operating_hours,
    
    -- Store fields
    st.store_type,
    st.kosher_level as store_kosher_level,
    st.kosher_certification as store_kosher_certification,
    st.kosher_certificate_number as store_kosher_certificate_number,
    st.kosher_expires_at as store_kosher_expires_at,
    st.accepts_credit as store_accepts_credit,
    st.accepts_cash as store_accepts_cash,
    st.accepts_checks as store_accepts_checks,
    st.has_delivery as store_has_delivery,
    st.has_parking as store_has_parking,
    st.operating_hours as store_operating_hours

FROM entities_normalized e
LEFT JOIN mikvahs_normalized m ON e.id = m.entity_id
LEFT JOIN synagogues_normalized s ON e.id = s.entity_id
LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
LEFT JOIN stores_normalized st ON e.id = st.entity_id;

COMMIT;
