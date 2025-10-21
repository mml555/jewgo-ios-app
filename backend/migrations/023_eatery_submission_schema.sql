-- Migration: Add eatery submission support
-- Date: 2025-10-21
-- Description: Adds approval_status, geom column, and eatery_fields table

-- 1. Add approval_status column to entities table
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'approved'
CHECK (approval_status IN ('pending_review', 'approved', 'rejected'));

-- Update existing entities to 'approved' status
UPDATE entities 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;

-- 2. Add geom column for PostGIS spatial queries (if not exists)
ALTER TABLE entities 
ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);

-- Update existing entities with geom from lat/lng
UPDATE entities 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE longitude IS NOT NULL AND latitude IS NOT NULL AND geom IS NULL;

-- Create spatial index on geom
CREATE INDEX IF NOT EXISTS idx_entities_geom ON entities USING GIST (geom);

-- 3. Create eatery_fields table for eatery-specific data
CREATE TABLE IF NOT EXISTS eatery_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    kosher_type VARCHAR(50), -- 'meat', 'dairy', 'pareve', 'vegan'
    hechsher VARCHAR(100), -- 'orb', 'ok', 'kosher miami', etc.
    kosher_tags TEXT[], -- array of kosher tags like ['cholov yisroel', 'pas yisroel']
    price_range VARCHAR(20), -- '$10-$20' format
    amenities JSONB DEFAULT '[]'::jsonb, -- array of amenities
    google_reviews_link VARCHAR(500),
    is_owner_submission BOOLEAN DEFAULT FALSE,
    hours_json JSONB, -- parsed hours in JSON format
    business_images TEXT[], -- array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id)
);

-- Create index on entity_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_eatery_fields_entity_id ON eatery_fields(entity_id);

-- Create index on approval_status for admin queries
CREATE INDEX IF NOT EXISTS idx_entities_approval_status ON entities(approval_status);

-- Create index on kosher_type for filtering
CREATE INDEX IF NOT EXISTS idx_eatery_fields_kosher_type ON eatery_fields(kosher_type);

-- 4. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_eatery_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_eatery_fields_updated_at
    BEFORE UPDATE ON eatery_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_eatery_fields_updated_at();

-- 5. Add comments for documentation
COMMENT ON COLUMN entities.approval_status IS 'Status of entity submission: pending_review, approved, or rejected';
COMMENT ON COLUMN entities.geom IS 'PostGIS geometry point for spatial queries';
COMMENT ON TABLE eatery_fields IS 'Extended fields specific to eatery/restaurant entities';
COMMENT ON COLUMN eatery_fields.kosher_type IS 'Type of kosher: meat, dairy, pareve, or vegan';
COMMENT ON COLUMN eatery_fields.hechsher IS 'Kosher certification agency (lowercase)';
COMMENT ON COLUMN eatery_fields.kosher_tags IS 'Additional kosher attributes like cholov yisroel, pas yisroel';
COMMENT ON COLUMN eatery_fields.price_range IS 'Price range in format like $10-$20';
COMMENT ON COLUMN eatery_fields.amenities IS 'JSON array of amenities offered';
COMMENT ON COLUMN eatery_fields.is_owner_submission IS 'Whether submitted by business owner for Eatery Boost';
