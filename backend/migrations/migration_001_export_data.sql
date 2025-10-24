-- Migration 001: Export Current Data
-- Purpose: Export all data from current tables before schema cleanup
-- Generated: 2025-10-23

-- This script is for reference only - actual data export was done via Node.js script
-- Backup file: migrations/backup/schema_cleanup_backup_[timestamp].sql

-- Data exported from these tables:
-- - entities (25 rows)
-- - eatery_fields (11 rows) 
-- - restaurants_normalized (11 rows)
-- - synagogues_normalized (5 rows)
-- - mikvahs_normalized (4 rows)
-- - stores_normalized (5 rows)
-- - events (0 rows)
-- - jobs (3 rows)
-- - specials (0 rows)
-- - entity_services (1 row)
-- - business_hours (133 rows)
-- - images (23 rows)
-- - reviews (67 rows)

-- All data has been successfully exported to backup file
-- Proceed to migration_002_drop_duplicates.sql
