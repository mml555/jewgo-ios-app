-- =============================================================================
-- NORMALIZED ENTITY ARCHITECTURE MIGRATION
-- =============================================================================
-- This migration transforms the monolithic entities table into a proper
-- normalized structure with inheritance pattern for better performance,
-- data integrity, and maintainability.

-- =============================================================================
-- STEP 1: BACKUP EXISTING DATA
-- =============================================================================

-- Create backup table for safety
CREATE TABLE entities_backup AS SELECT * FROM entities;

-- =============================================================================
-- STEP 2: CREATE NORMALIZED CORE ENTITIES TABLE
-- =============================================================================

-- Create new normalized entities table with only shared fields
CREATE TABLE entities_normalized (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('mikvah', 'synagogue', 'restaurant', 'store', 'job')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Ratings and reviews (denormalized for performance)
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Status flags
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- STEP 3: CREATE SPECIALIZED ENTITY TABLES
-- =============================================================================

-- Mikvah-specific fields
CREATE TABLE mikvahs_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id) ON DELETE CASCADE,
    kosher_level VARCHAR(50) NOT NULL CHECK (kosher_level IN ('glatt', 'chalav_yisrael', 'regular')),
    denomination VARCHAR(50) CHECK (denomination IN ('orthodox', 'conservative', 'reform', 'chabad')),
    
    -- Amenities
    has_parking BOOLEAN DEFAULT FALSE,
    has_accessibility BOOLEAN DEFAULT FALSE,
    has_private_rooms BOOLEAN DEFAULT FALSE,
    has_heating BOOLEAN DEFAULT FALSE,
    has_air_conditioning BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    
    -- Pricing
    price_per_use DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    accepts_cash BOOLEAN DEFAULT TRUE,
    accepts_credit BOOLEAN DEFAULT FALSE,
    accepts_checks BOOLEAN DEFAULT FALSE,
    
    -- Operating hours (JSON for flexibility)
    operating_hours JSONB DEFAULT '{}'
);

-- Synagogue-specific fields
CREATE TABLE synagogues_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id) ON DELETE CASCADE,
    denomination VARCHAR(50) NOT NULL CHECK (denomination IN ('orthodox', 'conservative', 'reform', 'chabad', 'reconstructionist')),
    rabbi_name VARCHAR(255),
    congregation_size VARCHAR(50) CHECK (congregation_size IN ('small', 'medium', 'large', 'very_large')),
    
    -- Amenities
    has_parking BOOLEAN DEFAULT FALSE,
    has_accessibility BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    has_kosher_kitchen BOOLEAN DEFAULT FALSE,
    has_mikvah BOOLEAN DEFAULT FALSE,
    has_library BOOLEAN DEFAULT FALSE,
    has_youth_programs BOOLEAN DEFAULT FALSE,
    has_adult_education BOOLEAN DEFAULT FALSE,
    has_social_events BOOLEAN DEFAULT FALSE,
    
    -- Services
    daily_minyan BOOLEAN DEFAULT FALSE,
    shabbat_services BOOLEAN DEFAULT TRUE,
    holiday_services BOOLEAN DEFAULT TRUE,
    lifecycle_services BOOLEAN DEFAULT TRUE,
    
    -- Operating hours
    operating_hours JSONB DEFAULT '{}'
);

-- Restaurant-specific fields
CREATE TABLE restaurants_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id) ON DELETE CASCADE,
    kosher_level VARCHAR(50) CHECK (kosher_level IN ('glatt', 'chalav_yisrael', 'regular', 'pas_yisrael')),
    kosher_certification VARCHAR(255),
    kosher_certificate_number VARCHAR(100),
    kosher_expires_at DATE,
    
    -- Restaurant-specific
    cuisine_type VARCHAR(100),
    price_range VARCHAR(10) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    
    -- Amenities
    has_parking BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    has_delivery BOOLEAN DEFAULT FALSE,
    has_takeout BOOLEAN DEFAULT TRUE,
    has_dine_in BOOLEAN DEFAULT TRUE,
    has_outdoor_seating BOOLEAN DEFAULT FALSE,
    
    -- Operating hours
    operating_hours JSONB DEFAULT '{}'
);

-- Store-specific fields
CREATE TABLE stores_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id) ON DELETE CASCADE,
    store_type VARCHAR(50) CHECK (store_type IN ('grocery', 'butcher', 'bakery', 'deli', 'general', 'specialty')),
    kosher_level VARCHAR(50) CHECK (kosher_level IN ('glatt', 'chalav_yisrael', 'regular', 'pas_yisrael')),
    kosher_certification VARCHAR(255),
    kosher_certificate_number VARCHAR(100),
    kosher_expires_at DATE,
    
    -- Store-specific
    accepts_credit BOOLEAN DEFAULT TRUE,
    accepts_cash BOOLEAN DEFAULT TRUE,
    accepts_checks BOOLEAN DEFAULT FALSE,
    has_delivery BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    
    -- Operating hours
    operating_hours JSONB DEFAULT '{}'
);

-- Job-specific fields (if needed)
CREATE TABLE jobs_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id) ON DELETE CASCADE,
    job_type VARCHAR(50) CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'volunteer')),
    location_type VARCHAR(50) CHECK (location_type IN ('remote', 'hybrid', 'onsite')),
    is_remote BOOLEAN DEFAULT FALSE,
    is_urgent BOOLEAN DEFAULT FALSE,
    
    -- Compensation
    compensation_type VARCHAR(20) CHECK (compensation_type IN ('hourly', 'salary', 'commission', 'stipend', 'volunteer')),
    compensation_min DECIMAL(10, 2),
    compensation_max DECIMAL(10, 2),
    compensation_display VARCHAR(100),
    
    -- Requirements
    experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    requirements TEXT,
    qualifications TEXT,
    
    -- Tags
    tags TEXT[] DEFAULT '{}'
);

-- =============================================================================
-- STEP 4: MIGRATE DATA FROM OLD ENTITIES TABLE
-- =============================================================================

-- Migrate core entity data
INSERT INTO entities_normalized (
    id, entity_type, name, description, long_description, owner_id,
    address, city, state, zip_code, country, phone, email, website,
    latitude, longitude, rating, review_count, is_verified, is_active,
    created_at, updated_at
)
SELECT 
    id, entity_type, name, description, long_description, owner_id,
    address, city, state, zip_code, country, phone, email, website,
    latitude, longitude, rating, review_count, is_verified, is_active,
    created_at, updated_at
FROM entities
WHERE is_active = true;

-- Migrate mikvah-specific data
INSERT INTO mikvahs_normalized (
    entity_id, kosher_level, denomination, has_parking, has_accessibility,
    has_private_rooms, has_heating, has_air_conditioning, has_wifi,
    price_per_use, currency, accepts_cash, accepts_credit, accepts_checks,
    operating_hours
)
SELECT 
    e.id,
    COALESCE(e.kosher_level, 'regular') as kosher_level,
    e.denomination,
    COALESCE(e.has_parking, false) as has_parking,
    COALESCE(e.has_accessibility, false) as has_accessibility,
    COALESCE(e.has_private_rooms, false) as has_private_rooms,
    COALESCE(e.has_heating, false) as has_heating,
    COALESCE(e.has_air_conditioning, false) as has_air_conditioning,
    COALESCE(e.has_wifi, false) as has_wifi,
    e.price_per_use,
    COALESCE(e.currency, 'USD') as currency,
    COALESCE(e.accepts_cash, true) as accepts_cash,
    COALESCE(e.accepts_credit, false) as accepts_credit,
    COALESCE(e.accepts_checks, false) as accepts_checks,
    COALESCE(e.operating_hours, '{}') as operating_hours
FROM entities e
WHERE e.entity_type = 'mikvah' AND e.is_active = true;

-- Migrate synagogue-specific data
INSERT INTO synagogues_normalized (
    entity_id, denomination, rabbi_name, congregation_size,
    has_parking, has_accessibility, has_wifi, has_kosher_kitchen,
    has_mikvah, has_library, has_youth_programs, has_adult_education,
    has_social_events, daily_minyan, shabbat_services, holiday_services,
    lifecycle_services, operating_hours
)
SELECT 
    e.id,
    COALESCE(e.denomination, 'orthodox') as denomination,
    e.rabbi_name,
    e.congregation_size,
    COALESCE(e.has_parking, false) as has_parking,
    COALESCE(e.has_accessibility, false) as has_accessibility,
    COALESCE(e.has_wifi, false) as has_wifi,
    COALESCE(e.has_kosher_kitchen, false) as has_kosher_kitchen,
    COALESCE(e.has_mikvah, false) as has_mikvah,
    COALESCE(e.has_library, false) as has_library,
    COALESCE(e.has_youth_programs, false) as has_youth_programs,
    COALESCE(e.has_adult_education, false) as has_adult_education,
    COALESCE(e.has_social_events, false) as has_social_events,
    COALESCE(e.daily_minyan, false) as daily_minyan,
    COALESCE(e.shabbat_services, true) as shabbat_services,
    COALESCE(e.holiday_services, true) as holiday_services,
    COALESCE(e.lifecycle_services, true) as lifecycle_services,
    COALESCE(e.operating_hours, '{}') as operating_hours
FROM entities e
WHERE e.entity_type = 'synagogue' AND e.is_active = true;

-- Migrate restaurant-specific data
INSERT INTO restaurants_normalized (
    entity_id, kosher_level, kosher_certification, kosher_certificate_number,
    kosher_expires_at, cuisine_type, price_range, has_parking, has_wifi,
    has_delivery, has_takeout, has_dine_in, has_outdoor_seating, operating_hours
)
SELECT 
    e.id,
    e.kosher_level,
    e.kosher_certification,
    e.kosher_certificate_number,
    e.kosher_expires_at,
    e.cuisine_type,
    COALESCE(e.price_range, '$$') as price_range,
    COALESCE(e.has_parking, false) as has_parking,
    COALESCE(e.has_wifi, false) as has_wifi,
    COALESCE(e.has_delivery, false) as has_delivery,
    COALESCE(e.has_takeout, true) as has_takeout,
    COALESCE(e.has_dine_in, true) as has_dine_in,
    COALESCE(e.has_outdoor_seating, false) as has_outdoor_seating,
    COALESCE(e.operating_hours, '{}') as operating_hours
FROM entities e
WHERE e.entity_type = 'restaurant' AND e.is_active = true;

-- Migrate store-specific data
INSERT INTO stores_normalized (
    entity_id, store_type, kosher_level, kosher_certification,
    kosher_certificate_number, kosher_expires_at, accepts_credit,
    accepts_cash, accepts_checks, has_delivery, has_parking, operating_hours
)
SELECT 
    e.id,
    e.store_type,
    e.kosher_level,
    e.kosher_certification,
    e.kosher_certificate_number,
    e.kosher_expires_at,
    COALESCE(e.accepts_credit, true) as accepts_credit,
    COALESCE(e.accepts_cash, true) as accepts_cash,
    COALESCE(e.accepts_checks, false) as accepts_checks,
    COALESCE(e.has_delivery, false) as has_delivery,
    COALESCE(e.has_parking, false) as has_parking,
    COALESCE(e.operating_hours, '{}') as operating_hours
FROM entities e
WHERE e.entity_type = 'store' AND e.is_active = true;

-- =============================================================================
-- STEP 5: CREATE PERFORMANCE INDEXES
-- =============================================================================

-- Core entities indexes
CREATE INDEX idx_entities_normalized_type ON entities_normalized(entity_type);
CREATE INDEX idx_entities_normalized_active ON entities_normalized(is_active) WHERE is_active = true;
CREATE INDEX idx_entities_normalized_location ON entities_normalized(latitude, longitude);
CREATE INDEX idx_entities_normalized_city_state ON entities_normalized(city, state);
CREATE INDEX idx_entities_normalized_rating ON entities_normalized(rating DESC);
CREATE INDEX idx_entities_normalized_created_at ON entities_normalized(created_at DESC);

-- Specialized table indexes
CREATE INDEX idx_mikvahs_normalized_kosher ON mikvahs_normalized(kosher_level);
CREATE INDEX idx_mikvahs_normalized_denomination ON mikvahs_normalized(denomination);

CREATE INDEX idx_synagogues_normalized_denomination ON synagogues_normalized(denomination);
CREATE INDEX idx_synagogues_normalized_services ON synagogues_normalized(daily_minyan, shabbat_services);

CREATE INDEX idx_restaurants_normalized_kosher ON restaurants_normalized(kosher_level);
CREATE INDEX idx_restaurants_normalized_cuisine ON restaurants_normalized(cuisine_type);
CREATE INDEX idx_restaurants_normalized_price ON restaurants_normalized(price_range);

CREATE INDEX idx_stores_normalized_type ON stores_normalized(store_type);
CREATE INDEX idx_stores_normalized_kosher ON stores_normalized(kosher_level);

-- =============================================================================
-- STEP 6: CREATE VIEWS FOR BACKWARD COMPATIBILITY
-- =============================================================================

-- Create unified view that mimics the old entities table structure
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

-- =============================================================================
-- STEP 7: CREATE TRIGGERS FOR DATA CONSISTENCY
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to all tables
CREATE TRIGGER update_entities_normalized_updated_at 
    BEFORE UPDATE ON entities_normalized 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mikvahs_normalized_updated_at 
    BEFORE UPDATE ON mikvahs_normalized 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synagogues_normalized_updated_at 
    BEFORE UPDATE ON synagogues_normalized 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_normalized_updated_at 
    BEFORE UPDATE ON restaurants_normalized 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_normalized_updated_at 
    BEFORE UPDATE ON stores_normalized 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 8: DATA VALIDATION FUNCTIONS
-- =============================================================================

-- Function to validate entity consistency
CREATE OR REPLACE FUNCTION validate_entity_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure entity_type matches the specialized table
    IF TG_TABLE_NAME = 'mikvahs_normalized' AND 
       (SELECT entity_type FROM entities_normalized WHERE id = NEW.entity_id) != 'mikvah' THEN
        RAISE EXCEPTION 'Entity type mismatch: mikvah expected';
    END IF;
    
    IF TG_TABLE_NAME = 'synagogues_normalized' AND 
       (SELECT entity_type FROM entities_normalized WHERE id = NEW.entity_id) != 'synagogue' THEN
        RAISE EXCEPTION 'Entity type mismatch: synagogue expected';
    END IF;
    
    IF TG_TABLE_NAME = 'restaurants_normalized' AND 
       (SELECT entity_type FROM entities_normalized WHERE id = NEW.entity_id) != 'restaurant' THEN
        RAISE EXCEPTION 'Entity type mismatch: restaurant expected';
    END IF;
    
    IF TG_TABLE_NAME = 'stores_normalized' AND 
       (SELECT entity_type FROM entities_normalized WHERE id = NEW.entity_id) != 'store' THEN
        RAISE EXCEPTION 'Entity type mismatch: store expected';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add validation triggers
CREATE TRIGGER validate_mikvah_consistency 
    BEFORE INSERT OR UPDATE ON mikvahs_normalized 
    FOR EACH ROW EXECUTE FUNCTION validate_entity_consistency();

CREATE TRIGGER validate_synagogue_consistency 
    BEFORE INSERT OR UPDATE ON synagogues_normalized 
    FOR EACH ROW EXECUTE FUNCTION validate_entity_consistency();

CREATE TRIGGER validate_restaurant_consistency 
    BEFORE INSERT OR UPDATE ON restaurants_normalized 
    FOR EACH ROW EXECUTE FUNCTION validate_entity_consistency();

CREATE TRIGGER validate_store_consistency 
    BEFORE INSERT OR UPDATE ON stores_normalized 
    FOR EACH ROW EXECUTE FUNCTION validate_entity_consistency();

-- =============================================================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get entity with all related data
CREATE OR REPLACE FUNCTION get_entity_with_details(entity_id UUID)
RETURNS TABLE (
    id UUID,
    entity_type VARCHAR(50),
    name VARCHAR(255),
    description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2),
    review_count INTEGER,
    is_verified BOOLEAN,
    is_active BOOLEAN,
    -- Specialized fields as JSON
    specialized_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.entity_type,
        e.name,
        e.description,
        e.address,
        e.city,
        e.state,
        e.zip_code,
        e.latitude,
        e.longitude,
        e.rating,
        e.review_count,
        e.is_verified,
        e.is_active,
        CASE 
            WHEN e.entity_type = 'mikvah' THEN 
                (SELECT to_jsonb(m) FROM mikvahs_normalized m WHERE m.entity_id = e.id)
            WHEN e.entity_type = 'synagogue' THEN 
                (SELECT to_jsonb(s) FROM synagogues_normalized s WHERE s.entity_id = e.id)
            WHEN e.entity_type = 'restaurant' THEN 
                (SELECT to_jsonb(r) FROM restaurants_normalized r WHERE r.entity_id = e.id)
            WHEN e.entity_type = 'store' THEN 
                (SELECT to_jsonb(st) FROM stores_normalized st WHERE st.entity_id = e.id)
            ELSE NULL
        END as specialized_data
    FROM entities_normalized e
    WHERE e.id = entity_id AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Normalized entity architecture migration completed successfully!';
    RAISE NOTICE 'Backup table created: entities_backup';
    RAISE NOTICE 'New normalized tables created with proper indexes and constraints';
    RAISE NOTICE 'Data validation triggers and helper functions installed';
    RAISE NOTICE 'Backward compatibility view created: entities_unified';
END $$;
