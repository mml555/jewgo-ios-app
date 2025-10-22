-- Migration: Add New Enum Values for Eateries
-- Date: 2025-01-19
-- Description: Add meat, dairy, parve to kosher_level enum

BEGIN;

-- Add new enum values to existing kosher_level type
ALTER TYPE kosher_level ADD VALUE IF NOT EXISTS 'meat';
ALTER TYPE kosher_level ADD VALUE IF NOT EXISTS 'dairy';
ALTER TYPE kosher_level ADD VALUE IF NOT EXISTS 'parve';

COMMIT;
