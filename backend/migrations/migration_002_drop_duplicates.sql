-- Migration 002: Drop Duplicate Tables
-- Purpose: Remove duplicate and normalized tables that are no longer needed
-- Generated: 2025-10-23

-- Drop duplicate entity tables
DROP TABLE IF EXISTS entities_normalized CASCADE;
DROP TABLE IF EXISTS entities_backup CASCADE;
DROP TABLE IF EXISTS entities_unified CASCADE;

-- Drop entity-specific normalized tables
DROP TABLE IF EXISTS restaurants_normalized CASCADE;
DROP TABLE IF EXISTS synagogues_normalized CASCADE;
DROP TABLE IF EXISTS mikvahs_normalized CASCADE;
DROP TABLE IF EXISTS stores_normalized CASCADE;
DROP TABLE IF EXISTS jobs_normalized CASCADE;

-- Drop views that depend on normalized tables
DROP VIEW IF EXISTS v_events_enhanced CASCADE;
DROP VIEW IF EXISTS v_events_search CASCADE;
DROP VIEW IF EXISTS entity_distribution CASCADE;
DROP VIEW IF EXISTS entity_distribution_simple CASCADE;

-- Note: Keep the main entities table and eatery_fields table
-- These will be the foundation of our clean schema
