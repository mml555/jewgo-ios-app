-- Migration 007: Update Foreign Keys
-- Purpose: Update all foreign key constraints to point to the new structure
-- Generated: 2025-10-23

-- Update event-related tables to use entity_id from events
-- Note: These updates will be done after events are migrated to entities table

-- Update event_rsvps table to reference entities instead of events
-- (This will be done after events are migrated)

-- Update event_sponsors table to reference entities instead of events  
-- (This will be done after events are migrated)

-- Update event_payments table to reference entities instead of events
-- (This will be done after events are migrated)

-- Update job-related tables to use entity_id from jobs
-- Note: These updates will be done after jobs are migrated to entities table

-- Update job_applications table to reference entities instead of jobs
-- (This will be done after jobs are migrated)

-- Update job_seeker_profiles table to reference entities instead of jobs
-- (This will be done after jobs are migrated)

-- Ensure all foreign key constraints are properly set
-- Check for any orphaned records and clean them up

-- Verify that all foreign keys are working correctly
-- This will be validated after the migration is complete
