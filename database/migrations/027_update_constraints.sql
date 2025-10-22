-- Migration: Update Check Constraints for New Enum Values
-- Date: 2025-01-19
-- Description: Update check constraints to allow new dietary type values

BEGIN;

-- Drop existing check constraints
ALTER TABLE restaurants_normalized DROP CONSTRAINT IF EXISTS restaurants_normalized_kosher_level_check;
ALTER TABLE stores_normalized DROP CONSTRAINT IF EXISTS stores_normalized_kosher_level_check;
ALTER TABLE mikvahs_normalized DROP CONSTRAINT IF EXISTS mikvahs_normalized_kosher_level_check;

-- Add new check constraints that include the new values
ALTER TABLE restaurants_normalized 
ADD CONSTRAINT restaurants_normalized_kosher_level_check 
CHECK (kosher_level::text = ANY (ARRAY['glatt', 'chalav_yisrael', 'regular', 'pas_yisrael', 'meat', 'dairy', 'parve']));

ALTER TABLE stores_normalized 
ADD CONSTRAINT stores_normalized_kosher_level_check 
CHECK (kosher_level::text = ANY (ARRAY['glatt', 'chalav_yisrael', 'regular', 'pas_yisrael', 'meat', 'dairy', 'parve']));

ALTER TABLE mikvahs_normalized 
ADD CONSTRAINT mikvahs_normalized_kosher_level_check 
CHECK (kosher_level::text = ANY (ARRAY['glatt', 'chalav_yisrael', 'regular', 'meat', 'dairy', 'parve']));

COMMIT;
