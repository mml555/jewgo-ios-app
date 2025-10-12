-- Migration: Fix jobs table schema to match frontend expectations
-- This adds all missing columns and updates the structure to use proper lookup tables

BEGIN;

-- Add missing reference columns to lookup tables
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES job_industries(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type_id UUID REFERENCES job_types(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level_id UUID REFERENCES experience_levels(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_structure_id UUID REFERENCES compensation_structures(id);

-- Add missing job details columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS show_compensation BOOLEAN DEFAULT TRUE;

-- Add missing status and metadata columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_hybrid BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS expires_date TIMESTAMPTZ;

-- Add missing company information columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_website VARCHAR(500);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url VARCHAR(500);

-- Add missing compensation display column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_display VARCHAR(255);

-- Add analytics columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0;

-- Add metadata columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for new foreign key columns
CREATE INDEX IF NOT EXISTS idx_jobs_industry_id ON jobs(industry_id);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type_id ON jobs(job_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level_id ON jobs(experience_level_id);
CREATE INDEX IF NOT EXISTS idx_jobs_compensation_structure_id ON jobs(compensation_structure_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date);

-- Update existing rows to set default posted_date if null
UPDATE jobs SET posted_date = created_at WHERE posted_date IS NULL;

-- Update existing rows to set is_active = true if null
UPDATE jobs SET is_active = true WHERE is_active IS NULL;

COMMIT;

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

