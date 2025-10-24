-- Migration 003: Alter Entities Table
-- Purpose: Remove kosher fields from entities table and update entity_type enum
-- Generated: 2025-10-23

-- First, remove kosher fields from entities table (these will be in eatery_fields)
ALTER TABLE entities DROP COLUMN IF EXISTS kosher_level;
ALTER TABLE entities DROP COLUMN IF EXISTS kosher_certification;
ALTER TABLE entities DROP COLUMN IF EXISTS kosher_certificate_number;
ALTER TABLE entities DROP COLUMN IF EXISTS kosher_expires_at;

-- Update entity_type enum to include new types
-- First, add new values to the enum
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'event';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'job';

-- Note: PostgreSQL doesn't support removing enum values directly
-- The old values (restaurant, synagogue, mikvah, store) will remain
-- New values (event, job) are now available
