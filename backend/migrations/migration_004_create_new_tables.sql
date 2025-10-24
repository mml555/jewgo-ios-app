-- Migration 004: Create New Field Tables
-- Purpose: Create entity-specific field tables for clean schema
-- Generated: 2025-10-23

-- Create synagogue_fields table
CREATE TABLE IF NOT EXISTS synagogue_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    denomination_details TEXT,
    rabbi_name VARCHAR(255),
    seating_capacity INTEGER,
    mechitza_type VARCHAR(100),
    mikvah_on_site BOOLEAN DEFAULT FALSE,
    eruv_within BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mikvah_fields table
CREATE TABLE IF NOT EXISTS mikvah_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    supervision VARCHAR(100),
    appointment_required BOOLEAN DEFAULT FALSE,
    separate_entrances BOOLEAN DEFAULT FALSE,
    accessibility_features TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create store_fields table
CREATE TABLE IF NOT EXISTS store_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    product_categories TEXT[],
    accepts_returns BOOLEAN DEFAULT FALSE,
    shipping_available BOOLEAN DEFAULT FALSE,
    online_ordering BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_fields table
CREATE TABLE IF NOT EXISTS event_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    event_type VARCHAR(100),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT FALSE,
    cost DECIMAL(10,2),
    organizer_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_fields table
CREATE TABLE IF NOT EXISTS job_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    job_type VARCHAR(100),
    job_industry VARCHAR(100),
    experience_level VARCHAR(50),
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    employment_type VARCHAR(50),
    application_deadline DATE,
    employer_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_synagogue_fields_entity_id ON synagogue_fields(entity_id);
CREATE INDEX IF NOT EXISTS idx_mikvah_fields_entity_id ON mikvah_fields(entity_id);
CREATE INDEX IF NOT EXISTS idx_store_fields_entity_id ON store_fields(entity_id);
CREATE INDEX IF NOT EXISTS idx_event_fields_entity_id ON event_fields(entity_id);
CREATE INDEX IF NOT EXISTS idx_job_fields_entity_id ON job_fields(entity_id);
CREATE INDEX IF NOT EXISTS idx_event_fields_start_time ON event_fields(start_time);
CREATE INDEX IF NOT EXISTS idx_job_fields_deadline ON job_fields(application_deadline);
