-- Migration: Migrate new eatery data from entities_normalized to entities table
-- Date: 2025-01-19
-- Description: Move our 6 new eateries from entities_normalized to the main entities table

BEGIN;

-- Insert new eateries into the main entities table
INSERT INTO entities (
  id,
  entity_type,
  name,
  description,
  long_description,
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
  kosher_level,
  kosher_certification,
  created_at,
  updated_at
)
SELECT 
  en.id,
  en.entity_type::entity_type, -- Cast to enum
  en.name,
  en.description,
  en.description as long_description, -- Use description as long_description
  en.address,
  en.city,
  en.state,
  en.zip_code,
  en.country,
  en.phone,
  en.email,
  en.website,
  en.latitude,
  en.longitude,
  en.rating,
  en.review_count,
  en.is_verified,
  en.is_active,
  rn.kosher_level::kosher_level, -- Cast to enum
  rn.kosher_certification,
  en.created_at,
  en.updated_at
FROM entities_normalized en
LEFT JOIN restaurants_normalized rn ON en.id = rn.entity_id
WHERE en.entity_type = 'restaurant'
  AND NOT EXISTS (
    SELECT 1 FROM entities e 
    WHERE e.id = en.id
  );

-- Update the restaurants_normalized table to reference the entities table
-- (This should already be correct, but let's verify)

COMMIT;
