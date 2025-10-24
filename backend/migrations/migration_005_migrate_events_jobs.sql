-- Migration 005: Migrate Events and Jobs to Entities
-- Purpose: Convert events and jobs tables to use the entities table structure
-- Generated: 2025-10-23

-- Migrate events to entities table
INSERT INTO entities (
    id,
    entity_type,
    name,
    description,
    long_description,
    owner_id,
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
    created_at,
    updated_at
)
SELECT 
    id,
    'event'::entity_type,
    title as name,
    description,
    description as long_description,
    organizer_id as owner_id,
    location as address,
    city,
    state,
    zip_code,
    country,
    contact_phone as phone,
    contact_email as email,
    website,
    latitude,
    longitude,
    COALESCE(rating, 0),
    COALESCE(attendee_count, 0) as review_count,
    COALESCE(is_verified, false),
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM events
WHERE id IS NOT NULL;

-- Migrate event-specific fields to event_fields table
INSERT INTO event_fields (
    entity_id,
    event_type,
    start_time,
    end_time,
    capacity,
    registration_required,
    cost,
    organizer_id,
    created_at,
    updated_at
)
SELECT 
    id as entity_id,
    event_type,
    start_time,
    end_time,
    capacity,
    COALESCE(registration_required, false),
    cost,
    organizer_id,
    created_at,
    updated_at
FROM events
WHERE id IS NOT NULL;

-- Migrate jobs to entities table
INSERT INTO entities (
    id,
    entity_type,
    name,
    description,
    long_description,
    owner_id,
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
    created_at,
    updated_at
)
SELECT 
    id,
    'job'::entity_type,
    title as name,
    description,
    requirements as long_description,
    employer_id as owner_id,
    location as address,
    city,
    state,
    zip_code,
    country,
    contact_phone as phone,
    contact_email as email,
    application_url as website,
    latitude,
    longitude,
    0 as rating,
    0 as review_count,
    COALESCE(is_verified, false),
    COALESCE(is_active, true),
    created_at,
    updated_at
FROM jobs
WHERE id IS NOT NULL;

-- Migrate job-specific fields to job_fields table
INSERT INTO job_fields (
    entity_id,
    job_type,
    job_industry,
    experience_level,
    salary_min,
    salary_max,
    employment_type,
    application_deadline,
    employer_id,
    created_at,
    updated_at
)
SELECT 
    id as entity_id,
    job_type,
    industry as job_industry,
    experience_level,
    salary_min,
    salary_max,
    employment_type,
    application_deadline,
    employer_id,
    created_at,
    updated_at
FROM jobs
WHERE id IS NOT NULL;
