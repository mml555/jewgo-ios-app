-- Migration 006: Reimport Cleaned Data
-- Purpose: Reimport and consolidate data into the clean schema
-- Generated: 2025-10-23

-- This migration will be executed after the data has been cleaned and consolidated
-- The actual data reimport will be done via Node.js script to handle the complex transformations

-- For now, we'll create the necessary field records for existing entities
-- based on their entity_type

-- Create synagogue_fields records for synagogue entities
INSERT INTO synagogue_fields (entity_id, denomination_details, created_at, updated_at)
SELECT 
    id,
    denomination::text,
    created_at,
    updated_at
FROM entities 
WHERE entity_type = 'synagogue'
AND id NOT IN (SELECT entity_id FROM synagogue_fields);

-- Create mikvah_fields records for mikvah entities  
INSERT INTO mikvah_fields (entity_id, created_at, updated_at)
SELECT 
    id,
    created_at,
    updated_at
FROM entities 
WHERE entity_type = 'mikvah'
AND id NOT IN (SELECT entity_id FROM mikvah_fields);

-- Create store_fields records for store entities
INSERT INTO store_fields (entity_id, created_at, updated_at)
SELECT 
    id,
    created_at,
    updated_at
FROM entities 
WHERE entity_type = 'store'
AND id NOT IN (SELECT entity_id FROM store_fields);

-- Note: eatery_fields already exists and contains data for restaurants
-- No need to recreate those records

-- Update any missing timestamps
UPDATE synagogue_fields SET created_at = NOW() WHERE created_at IS NULL;
UPDATE synagogue_fields SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE mikvah_fields SET created_at = NOW() WHERE created_at IS NULL;
UPDATE mikvah_fields SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE store_fields SET created_at = NOW() WHERE created_at IS NULL;
UPDATE store_fields SET updated_at = NOW() WHERE updated_at IS NULL;
