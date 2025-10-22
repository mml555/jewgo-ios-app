-- Migration: Migrate remaining entities from old table to normalized table
-- Date: 2025-01-19
-- Description: Move remaining entities from 'entities' to 'entities_normalized'

BEGIN;

-- Insert remaining entities from old table to normalized table
-- Only insert if they don't already exist
INSERT INTO entities_normalized (
  id,
  entity_type,
  name,
  description,
  long_description,
  owner_id,
  address,
  city,
  state,
  zip_code,
  country,
  phone,
  email,
  website,
  latitude,
  longitude,
  rating,
  review_count,
  is_verified,
  is_active,
  created_at,
  updated_at
)
SELECT 
  e.id,
  e.entity_type::text, -- Convert enum to text
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
  e.updated_at
FROM entities e
WHERE NOT EXISTS (
  SELECT 1 FROM entities_normalized en 
  WHERE en.id = e.id
);

-- For restaurants in the old table, create corresponding entries in restaurants_normalized
INSERT INTO restaurants_normalized (
  entity_id,
  kosher_level,
  kosher_certification,
  cuisine_type,
  price_range,
  has_parking,
  has_wifi,
  has_delivery,
  has_takeout,
  has_dine_in,
  has_outdoor_seating
)
SELECT 
  e.id,
  e.kosher_level::text, -- Convert enum to text
  e.kosher_certification,
  'General', -- Default cuisine type
  '$$', -- Default price range
  true, -- Default values
  true,
  false,
  true,
  true,
  false
FROM entities e
WHERE e.entity_type = 'restaurant'
  AND e.kosher_level IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM restaurants_normalized rn 
    WHERE rn.entity_id = e.id
  );

-- For stores in the old table, create corresponding entries in stores_normalized
INSERT INTO stores_normalized (
  entity_id,
  store_type,
  kosher_level,
  kosher_certification,
  accepts_credit,
  accepts_cash,
  accepts_checks,
  has_delivery,
  has_parking
)
SELECT 
  e.id,
  e.store_type::text, -- Convert enum to text
  e.kosher_level::text, -- Convert enum to text
  e.kosher_certification,
  true, -- Default values
  true,
  false,
  false,
  true
FROM entities e
WHERE e.entity_type = 'store'
  AND e.kosher_level IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM stores_normalized sn 
    WHERE sn.entity_id = e.id
  );

-- For synagogues in the old table, create corresponding entries in synagogues_normalized
INSERT INTO synagogues_normalized (
  entity_id,
  denomination,
  has_parking,
  has_accessibility,
  has_wifi,
  has_kosher_kitchen,
  has_mikvah,
  has_library,
  has_youth_programs,
  has_adult_education,
  has_social_events
)
SELECT 
  e.id,
  CASE 
    WHEN e.denomination::text = 'sephardic' THEN 'orthodox' -- Map sephardic to orthodox
    ELSE e.denomination::text
  END,
  true, -- Default values
  true,
  true,
  false,
  false,
  false,
  false,
  false,
  false
FROM entities e
WHERE e.entity_type = 'synagogue'
  AND NOT EXISTS (
    SELECT 1 FROM synagogues_normalized sn 
    WHERE sn.entity_id = e.id
  );

-- For mikvahs in the old table, create corresponding entries in mikvahs_normalized
INSERT INTO mikvahs_normalized (
  entity_id,
  kosher_level,
  denomination,
  has_parking,
  has_accessibility,
  has_private_rooms,
  has_heating,
  has_air_conditioning,
  has_wifi,
  price_per_use,
  currency,
  accepts_cash,
  accepts_credit,
  accepts_checks
)
SELECT 
  e.id,
  COALESCE(e.kosher_level::text, 'regular'), -- Default to 'regular' if null
  COALESCE(e.denomination::text, 'orthodox'), -- Default to 'orthodox' if null
  true, -- Default values
  true,
  true,
  true,
  true,
  true,
  0.00, -- Default price
  'USD',
  true,
  true,
  false
FROM entities e
WHERE e.entity_type = 'mikvah'
  AND NOT EXISTS (
    SELECT 1 FROM mikvahs_normalized mn 
    WHERE mn.entity_id = e.id
  );

COMMIT;
