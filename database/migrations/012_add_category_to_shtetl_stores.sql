-- Add category field to shtetl_stores table
-- This will allow us to distinguish between 'shtetl' and 'shuk' stores

BEGIN;

-- Add category column to shtetl_stores table
ALTER TABLE shtetl_stores 
ADD COLUMN category VARCHAR(50) DEFAULT 'shuk';

-- Update existing stores to have 'shuk' category (marketplace stores)
-- Since we want to distinguish between community centers (shtetl) and marketplace stores (shuk)
UPDATE shtetl_stores 
SET category = 'shuk' 
WHERE category IS NULL;

-- Make category NOT NULL after setting default values
ALTER TABLE shtetl_stores 
ALTER COLUMN category SET NOT NULL;

-- Create index for category filtering
CREATE INDEX idx_shtetl_stores_category ON shtetl_stores(category);

-- Add comment to explain the category field
COMMENT ON COLUMN shtetl_stores.category IS 'Store category: shtetl/shuk (show product dashboard), other categories (hide product dashboard)';

COMMIT;
