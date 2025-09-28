-- Mikvah and Synagogue Schema
-- This migration adds support for mikvah and synagogue (ashul) entities

-- Create mikvahs table
CREATE TABLE mikvahs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Mikvah-specific fields
    kosher_level VARCHAR(50) NOT NULL, -- 'glatt', 'chalav_yisrael', 'regular'
    denomination VARCHAR(50), -- 'orthodox', 'conservative', 'reform', 'chabad'
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Amenities and services
    has_parking BOOLEAN DEFAULT FALSE,
    has_accessibility BOOLEAN DEFAULT FALSE,
    has_private_rooms BOOLEAN DEFAULT FALSE,
    has_heating BOOLEAN DEFAULT FALSE,
    has_air_conditioning BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    
    -- Pricing information
    price_per_use DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    accepts_cash BOOLEAN DEFAULT TRUE,
    accepts_credit BOOLEAN DEFAULT FALSE,
    accepts_checks BOOLEAN DEFAULT FALSE,
    
    -- Operating hours (stored as JSON for flexibility)
    operating_hours JSONB DEFAULT '{}',
    
    -- Social media links
    facebook_url VARCHAR(500),
    instagram_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Ratings and reviews (denormalized for performance)
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create synagogues table
CREATE TABLE synagogues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Synagogue-specific fields
    denomination VARCHAR(50) NOT NULL, -- 'orthodox', 'conservative', 'reform', 'chabad', 'reconstructionist'
    rabbi_name VARCHAR(255),
    congregation_size VARCHAR(50), -- 'small', 'medium', 'large', 'very_large'
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Amenities and services
    has_parking BOOLEAN DEFAULT FALSE,
    has_accessibility BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT FALSE,
    has_kosher_kitchen BOOLEAN DEFAULT FALSE,
    has_mikvah BOOLEAN DEFAULT FALSE,
    has_library BOOLEAN DEFAULT FALSE,
    has_youth_programs BOOLEAN DEFAULT FALSE,
    has_adult_education BOOLEAN DEFAULT FALSE,
    has_social_events BOOLEAN DEFAULT FALSE,
    
    -- Services offered
    daily_minyan BOOLEAN DEFAULT FALSE,
    shabbat_services BOOLEAN DEFAULT TRUE,
    holiday_services BOOLEAN DEFAULT TRUE,
    lifecycle_services BOOLEAN DEFAULT TRUE,
    
    -- Operating hours (stored as JSON for flexibility)
    operating_hours JSONB DEFAULT '{}',
    
    -- Social media links
    facebook_url VARCHAR(500),
    instagram_url VARCHAR(500),
    twitter_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Ratings and reviews (denormalized for performance)
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_mikvahs_city_state ON mikvahs(city, state);
CREATE INDEX idx_mikvahs_active ON mikvahs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_mikvahs_verified ON mikvahs(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_mikvahs_rating ON mikvahs(rating DESC);
CREATE INDEX idx_mikvahs_kosher_level ON mikvahs(kosher_level);
CREATE INDEX idx_mikvahs_denomination ON mikvahs(denomination);
CREATE INDEX idx_mikvahs_created_at ON mikvahs(created_at DESC);
CREATE INDEX idx_mikvahs_location ON mikvahs(latitude, longitude);

CREATE INDEX idx_synagogues_city_state ON synagogues(city, state);
CREATE INDEX idx_synagogues_active ON synagogues(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_synagogues_verified ON synagogues(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_synagogues_rating ON synagogues(rating DESC);
CREATE INDEX idx_synagogues_denomination ON synagogues(denomination);
CREATE INDEX idx_synagogues_created_at ON synagogues(created_at DESC);
CREATE INDEX idx_synagogues_location ON synagogues(latitude, longitude);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_mikvahs_updated_at BEFORE UPDATE ON mikvahs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_synagogues_updated_at BEFORE UPDATE ON synagogues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO mikvahs (name, description, address, city, state, zip_code, phone, email, kosher_level, denomination, has_parking, has_accessibility, has_private_rooms, has_heating, has_air_conditioning, price_per_use) VALUES
('Community Mikvah', 'A beautiful community mikvah serving the local Jewish community', '123 Main St', 'Brooklyn', 'NY', '11201', '(555) 123-4567', 'info@communitymikvah.org', 'glatt', 'orthodox', true, true, true, true, true, 15.00),
('Temple Mikvah', 'Modern mikvah facility with private rooms', '456 Oak Ave', 'Los Angeles', 'CA', '90210', '(555) 987-6543', 'mikvah@temple.org', 'chalav_yisrael', 'conservative', true, true, true, true, true, 12.00);

INSERT INTO synagogues (name, description, address, city, state, zip_code, phone, email, denomination, rabbi_name, congregation_size, has_parking, has_accessibility, has_wifi, has_kosher_kitchen, has_mikvah, has_library, has_youth_programs, daily_minyan, shabbat_services, holiday_services, lifecycle_services) VALUES
('Congregation Beth Israel', 'A warm and welcoming Orthodox congregation', '789 Pine St', 'Brooklyn', 'NY', '11202', '(555) 234-5678', 'info@bethisrael.org', 'orthodox', 'Rabbi David Cohen', 'large', true, true, true, true, true, true, true, true, true, true, true),
('Temple Emanuel', 'Progressive Reform synagogue serving the community', '321 Elm St', 'Los Angeles', 'CA', '90211', '(555) 876-5432', 'office@templeemanuel.org', 'reform', 'Rabbi Sarah Johnson', 'medium', true, true, true, false, false, true, true, false, true, true, true);

COMMIT;
