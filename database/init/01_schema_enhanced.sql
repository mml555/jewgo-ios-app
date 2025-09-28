-- Enhanced Jewgo Database Schema - Future-Proof Version
-- This file creates the enhanced database schema with improved flexibility and scalability

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================================================
-- LOOKUP TABLES (Replacing ENUMs for flexibility)
-- =============================================================================

-- Entity types lookup table
CREATE TABLE entity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Kosher levels lookup table
CREATE TABLE kosher_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Denominations lookup table
CREATE TABLE denominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Store types lookup table
CREATE TABLE store_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services lookup table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'restaurant', 'synagogue', 'mikvah', 'store', 'general'
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Day of week lookup (keeping as simple table for consistency)
CREATE TABLE days_of_week (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(20) NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- Users table (unchanged)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table (unchanged)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced entities table with PostGIS and lookup references
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type_id UUID NOT NULL REFERENCES entity_types(id),
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
    
    -- PostGIS location data
    location GEOGRAPHY(POINT, 4326),
    
    -- Ratings and reviews (denormalized for performance)
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Status flags
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Kosher information (Restaurant-specific)
    kosher_level_id UUID REFERENCES kosher_levels(id),
    kosher_certification VARCHAR(255),
    kosher_certificate_number VARCHAR(100),
    kosher_expires_at DATE,
    
    -- Entity-specific fields
    denomination_id UUID REFERENCES denominations(id), -- for synagogues
    store_type_id UUID REFERENCES store_types(id), -- for stores
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RELATIONSHIP TABLES
-- =============================================================================

-- Entity services junction table
CREATE TABLE entity_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, service_id)
);

-- Social links table (replacing URL explosion)
CREATE TABLE social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'twitter', etc.
    url VARCHAR(500) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, platform)
);

-- =============================================================================
-- SUPPORTING TABLES
-- =============================================================================

-- Business hours table with lookup reference
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    day_of_week_id UUID NOT NULL REFERENCES days_of_week(id),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(entity_id, day_of_week_id)
);

-- Reviews table (unchanged structure)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Images table (unchanged)
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favorites table (unchanged)
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entity_id)
);

-- Search history table (unchanged)
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Entity types indexes
CREATE INDEX idx_entity_types_key ON entity_types(key);
CREATE INDEX idx_entity_types_active ON entity_types(is_active) WHERE is_active = TRUE;

-- Kosher levels indexes
CREATE INDEX idx_kosher_levels_key ON kosher_levels(key);
CREATE INDEX idx_kosher_levels_active ON kosher_levels(is_active) WHERE is_active = TRUE;

-- Denominations indexes
CREATE INDEX idx_denominations_key ON denominations(key);
CREATE INDEX idx_denominations_active ON denominations(is_active) WHERE is_active = TRUE;

-- Store types indexes
CREATE INDEX idx_store_types_key ON store_types(key);
CREATE INDEX idx_store_types_active ON store_types(is_active) WHERE is_active = TRUE;

-- Services indexes
CREATE INDEX idx_services_key ON services(key);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = TRUE;

-- Days of week indexes
CREATE INDEX idx_days_of_week_key ON days_of_week(key);
CREATE INDEX idx_days_of_week_sort ON days_of_week(sort_order);

-- Entities indexes
CREATE INDEX idx_entities_type_id ON entities(entity_type_id);
CREATE INDEX idx_entities_city_state ON entities(city, state);
CREATE INDEX idx_entities_location ON entities USING GIST(location); -- PostGIS spatial index
CREATE INDEX idx_entities_active ON entities(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_entities_verified ON entities(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_entities_rating ON entities(rating DESC);
CREATE INDEX idx_entities_created_at ON entities(created_at DESC);
CREATE INDEX idx_entities_kosher_level ON entities(kosher_level_id);
CREATE INDEX idx_entities_denomination ON entities(denomination_id);
CREATE INDEX idx_entities_store_type ON entities(store_type_id);

-- Relationship tables indexes
CREATE INDEX idx_entity_services_entity_id ON entity_services(entity_id);
CREATE INDEX idx_entity_services_service_id ON entity_services(service_id);
CREATE INDEX idx_social_links_entity_id ON social_links(entity_id);
CREATE INDEX idx_social_links_platform ON social_links(platform);

-- Supporting tables indexes
CREATE INDEX idx_business_hours_entity_id ON business_hours(entity_id);
CREATE INDEX idx_business_hours_day_id ON business_hours(day_of_week_id);
CREATE INDEX idx_reviews_entity_id ON reviews(entity_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_images_entity_id ON images(entity_id);
CREATE INDEX idx_images_primary ON images(entity_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_entity_id ON favorites(entity_id);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- =============================================================================
-- TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update entity rating aggregation
CREATE OR REPLACE FUNCTION update_entity_rating_aggregation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update rating and review count for the entity
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
        -- Update rating and review count for the entity
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
        -- Update rating and review count for the entity
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

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at BEFORE UPDATE ON business_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at BEFORE UPDATE ON social_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get entities within a radius (using PostGIS)
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
        ST_Distance(
            e.location::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance
    FROM entities e
    JOIN entity_types et ON e.entity_type_id = et.id
    WHERE e.is_active = TRUE
        AND (entity_type_key IS NULL OR et.key = entity_type_key)
        AND ST_DWithin(
            e.location::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

COMMIT;
