-- Migration: Update Price Range Constraints
-- Date: 2025-01-19
-- Description: Update price_range check constraint to allow new 11 price brackets

BEGIN;

-- Drop existing price_range check constraint
ALTER TABLE restaurants_normalized DROP CONSTRAINT IF EXISTS restaurants_normalized_price_range_check;

-- Add new check constraint that includes the 11 price brackets
ALTER TABLE restaurants_normalized 
ADD CONSTRAINT restaurants_normalized_price_range_check 
CHECK (price_range::text = ANY (ARRAY[
  '$', '$$', '$$$', '$$$$',  -- Legacy values
  '$5-10', '$10-20', '$20-30', '$30-40', '$40-50', '$50-60', 
  '$60-70', '$70-80', '$80-90', '$90-100', '$100+'  -- New 11 brackets
]));

COMMIT;
