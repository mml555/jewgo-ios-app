-- Migration: Transform to Enhanced Schema (Simplified - No PostGIS)
-- Date: 2025-01-19
-- Description: Migrate from ENUM-based schema to lookup table-based enhanced schema

BEGIN;

-- =============================================================================
-- STEP 1: CREATE LOOKUP TABLES AND POPULATE THEM
-- =============================================================================

-- Create entity types lookup table
CREATE TABLE entity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate entity types from existing enum values
INSERT INTO entity_types (key, name, description, sort_order) VALUES
('restaurant', 'Restaurant', 'Kosher restaurants and eateries', 1),
('synagogue', 'Synagogue', 'Synagogues and prayer halls', 2),
('mikvah', 'Mikvah', 'Mikvah facilities', 3),
('store', 'Store', 'Kosher stores and markets', 4);

-- Create kosher levels lookup table
CREATE TABLE kosher_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate kosher levels from existing enum values
INSERT INTO kosher_levels (key, name, description, sort_order) VALUES
('glatt', 'Glatt Kosher', 'Highest standard of kosher meat', 1),
('chalav_yisrael', 'Chalav Yisrael', 'Milk supervised by Jewish authority', 2),
('pas_yisrael', 'Pas Yisrael', 'Bread supervised by Jewish authority', 3),
('mehadrin', 'Mehadrin', 'Enhanced kosher supervision', 4),
('regular', 'Regular Kosher', 'Standard kosher certification', 5);

-- Create denominations lookup table
CREATE TABLE denominations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate denominations from existing enum values
INSERT INTO denominations (key, name, description, sort_order) VALUES
('orthodox', 'Orthodox', 'Traditional Orthodox Judaism', 1),
('conservative', 'Conservative', 'Conservative Judaism', 2),
('reform', 'Reform', 'Reform Judaism', 3),
('reconstructionist', 'Reconstructionist', 'Reconstructionist Judaism', 4),
('chabad', 'Chabad', 'Chabad-Lubavitch movement', 5),
('sephardic', 'Sephardic', 'Sephardic tradition', 6),
('ashkenazi', 'Ashkenazi', 'Ashkenazi tradition', 7);

-- Create store types lookup table
CREATE TABLE store_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate store types from existing enum values
INSERT INTO store_types (key, name, description, sort_order) VALUES
('grocery', 'Grocery Store', 'General grocery and food items', 1),
('butcher', 'Butcher Shop', 'Specialized meat and poultry', 2),
('bakery', 'Bakery', 'Fresh bread and baked goods', 3),
('deli', 'Deli', 'Deli meats and prepared foods', 4),
('market', 'Market', 'Fresh produce and general items', 5),
('specialty', 'Specialty Store', 'Specialized kosher products', 6);

-- Create services lookup table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'restaurant', 'synagogue', 'mikvah', 'store', 'general'
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate common services
INSERT INTO services (key, name, description, category, sort_order) VALUES
-- Restaurant services
('delivery', 'Delivery', 'Food delivery service', 'restaurant', 1),
('takeout', 'Takeout', 'Takeout orders', 'restaurant', 2),
('dine_in', 'Dine In', 'In-restaurant dining', 'restaurant', 3),
('catering', 'Catering', 'Catering services', 'restaurant', 4),
('outdoor_seating', 'Outdoor Seating', 'Outdoor dining area', 'restaurant', 5),
-- Synagogue services
('daily_services', 'Daily Services', 'Daily prayer services', 'synagogue', 10),
('shabbat_services', 'Shabbat Services', 'Shabbat prayer services', 'synagogue', 11),
('holiday_services', 'Holiday Services', 'Holiday prayer services', 'synagogue', 12),
('hebrew_school', 'Hebrew School', 'Hebrew education classes', 'synagogue', 13),
('adult_education', 'Adult Education', 'Adult learning programs', 'synagogue', 14),
-- Mikvah services
('private_rooms', 'Private Rooms', 'Private mikvah rooms', 'mikvah', 20),
('attendant_assistance', 'Attendant Assistance', 'Mikvah attendant support', 'mikvah', 21),
('supplies', 'Supplies', 'Mikvah supplies available', 'mikvah', 22),
('emergency_access', 'Emergency Access', '24/7 emergency access', 'mikvah', 23),
-- Store services
('fresh_produce', 'Fresh Produce', 'Fresh fruits and vegetables', 'store', 30),
('packaged_goods', 'Packaged Goods', 'Packaged kosher products', 'store', 31),
('prepared_foods', 'Prepared Foods', 'Ready-to-eat kosher foods', 'store', 32),
('kosher_meat', 'Kosher Meat', 'Fresh kosher meat and poultry', 'store', 33);

-- Create days of week lookup table
CREATE TABLE days_of_week (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(20) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Populate days of week
INSERT INTO days_of_week (key, name, sort_order) VALUES
('sunday', 'Sunday', 0),
('monday', 'Monday', 1),
('tuesday', 'Tuesday', 2),
('wednesday', 'Wednesday', 3),
('thursday', 'Thursday', 4),
('friday', 'Friday', 5),
('saturday', 'Saturday', 6);

-- =============================================================================
-- STEP 2: CREATE NEW ENHANCED TABLES
-- =============================================================================

-- Create entity services junction table
CREATE TABLE entity_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, service_id)
);

-- Create social links table
CREATE TABLE social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, platform)
);

-- =============================================================================
-- STEP 3: MIGRATE EXISTING DATA
-- =============================================================================

-- Add new columns to entities table
ALTER TABLE entities 
ADD COLUMN entity_type_id UUID,
ADD COLUMN kosher_level_id UUID,
ADD COLUMN denomination_id UUID,
ADD COLUMN store_type_id UUID,
ADD COLUMN latitude_new DECIMAL(10, 8),
ADD COLUMN longitude_new DECIMAL(11, 8);

-- Update entity_type_id based on existing entity_type enum
UPDATE entities SET entity_type_id = et.id
FROM entity_types et
WHERE entities.entity_type::text = et.key;

-- Update kosher_level_id based on existing kosher_level enum
UPDATE entities SET kosher_level_id = kl.id
FROM kosher_levels kl
WHERE entities.kosher_level::text = kl.key;

-- Update denomination_id based on existing denomination enum
UPDATE entities SET denomination_id = d.id
FROM denominations d
WHERE entities.denomination::text = d.key;

-- Update store_type_id based on existing store_type enum
UPDATE entities SET store_type_id = st.id
FROM store_types st
WHERE entities.store_type::text = st.key;

-- Copy lat/lng to new columns
UPDATE entities SET latitude_new = latitude, longitude_new = longitude
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Migrate social media URLs to social_links table
INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'facebook',
    facebook_url
FROM entities 
WHERE facebook_url IS NOT NULL AND facebook_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'instagram',
    instagram_url
FROM entities 
WHERE instagram_url IS NOT NULL AND instagram_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'twitter',
    twitter_url
FROM entities 
WHERE twitter_url IS NOT NULL AND twitter_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'whatsapp',
    whatsapp_url
FROM entities 
WHERE whatsapp_url IS NOT NULL AND whatsapp_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'tiktok',
    tiktok_url
FROM entities 
WHERE tiktok_url IS NOT NULL AND tiktok_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'youtube',
    youtube_url
FROM entities 
WHERE youtube_url IS NOT NULL AND youtube_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'snapchat',
    snapchat_url
FROM entities 
WHERE snapchat_url IS NOT NULL AND snapchat_url != '';

INSERT INTO social_links (entity_id, platform, url)
SELECT 
    id,
    'linkedin',
    linkedin_url
FROM entities 
WHERE linkedin_url IS NOT NULL AND linkedin_url != '';

-- Migrate services array to entity_services junction table
INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.services IS NOT NULL 
  AND s.key = ANY(e.services);

-- Update business_hours to use lookup table
ALTER TABLE business_hours 
ADD COLUMN day_of_week_id UUID;

UPDATE business_hours SET day_of_week_id = dow.id
FROM days_of_week dow
WHERE business_hours.day_of_week::text = dow.key;

-- =============================================================================
-- STEP 4: ADD CONSTRAINTS AND INDEXES
-- =============================================================================

-- Add foreign key constraints
ALTER TABLE entities 
ADD CONSTRAINT fk_entities_entity_type 
    FOREIGN KEY (entity_type_id) REFERENCES entity_types(id);

ALTER TABLE entities 
ADD CONSTRAINT fk_entities_kosher_level 
    FOREIGN KEY (kosher_level_id) REFERENCES kosher_levels(id);

ALTER TABLE entities 
ADD CONSTRAINT fk_entities_denomination 
    FOREIGN KEY (denomination_id) REFERENCES denominations(id);

ALTER TABLE entities 
ADD CONSTRAINT fk_entities_store_type 
    FOREIGN KEY (store_type_id) REFERENCES store_types(id);

ALTER TABLE entity_services 
ADD CONSTRAINT fk_entity_services_entity 
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE;

ALTER TABLE social_links 
ADD CONSTRAINT fk_social_links_entity 
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE;

ALTER TABLE business_hours 
ADD CONSTRAINT fk_business_hours_day 
    FOREIGN KEY (day_of_week_id) REFERENCES days_of_week(id);

-- Add performance indexes
CREATE INDEX idx_entities_type_id ON entities(entity_type_id);
CREATE INDEX idx_entities_latitude_longitude ON entities(latitude_new, longitude_new);
CREATE INDEX idx_entities_kosher_level ON entities(kosher_level_id);
CREATE INDEX idx_entities_denomination ON entities(denomination_id);
CREATE INDEX idx_entities_store_type ON entities(store_type_id);

CREATE INDEX idx_entity_services_entity_id ON entity_services(entity_id);
CREATE INDEX idx_entity_services_service_id ON entity_services(service_id);
CREATE INDEX idx_social_links_entity_id ON social_links(entity_id);
CREATE INDEX idx_social_links_platform ON social_links(platform);

-- =============================================================================
-- STEP 5: ADD ENHANCED FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to update entity rating aggregation
CREATE OR REPLACE FUNCTION update_entity_rating_aggregation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE entities 
        SET 
            rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0)
                FROM reviews 
                WHERE entity_id = NEW.entity_id AND is_moderated = FALSE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE entity_id = NEW.entity_id AND is_moderated = FALSE
            )
        WHERE id = NEW.entity_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE entities 
        SET 
            rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0)
                FROM reviews 
                WHERE entity_id = NEW.entity_id AND is_moderated = FALSE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE entity_id = NEW.entity_id AND is_moderated = FALSE
            )
        WHERE id = NEW.entity_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE entities 
        SET 
            rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0)
                FROM reviews 
                WHERE entity_id = OLD.entity_id AND is_moderated = FALSE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM reviews 
                WHERE entity_id = OLD.entity_id AND is_moderated = FALSE
            )
        WHERE id = OLD.entity_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for rating aggregation
CREATE TRIGGER update_entity_rating_on_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_entity_rating_aggregation();

CREATE TRIGGER update_entity_rating_on_review_update
    AFTER UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_entity_rating_aggregation();

CREATE TRIGGER update_entity_rating_on_review_delete
    AFTER DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_entity_rating_aggregation();

-- Function to get entities within a radius (using lat/lng)
CREATE OR REPLACE FUNCTION get_entities_within_radius(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    entity_type_key VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    entity_id UUID,
    name VARCHAR(255),
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        -- Simple distance calculation using Haversine formula
        (6371000 * acos(
            cos(radians(lat)) * cos(radians(e.latitude_new)) * 
            cos(radians(e.longitude_new) - radians(lng)) + 
            sin(radians(lat)) * sin(radians(e.latitude_new))
        )) as distance
    FROM entities e
    JOIN entity_types et ON e.entity_type_id = et.id
    WHERE e.is_active = TRUE
        AND (entity_type_key IS NULL OR et.key = entity_type_key)
        AND e.latitude_new IS NOT NULL 
        AND e.longitude_new IS NOT NULL
        AND (6371000 * acos(
            cos(radians(lat)) * cos(radians(e.latitude_new)) * 
            cos(radians(e.longitude_new) - radians(lng)) + 
            sin(radians(lat)) * sin(radians(e.latitude_new))
        )) <= radius_meters
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

COMMIT;
