-- =============================================================================
-- ADD BUSINESS ENTITY LINKAGE TO JOB LISTINGS
-- =============================================================================
-- This migration adds the ability to link job listings to business entities
-- (restaurants, synagogues, stores, etc.) so businesses can post jobs on their
-- listing pages.

-- Add business_entity_id to job_listings table
ALTER TABLE job_listings 
ADD COLUMN IF NOT EXISTS business_entity_id UUID REFERENCES entities(id) ON DELETE SET NULL;

-- Add index for performance when querying jobs by business
CREATE INDEX IF NOT EXISTS idx_job_listings_business_entity 
ON job_listings(business_entity_id) 
WHERE business_entity_id IS NOT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN job_listings.business_entity_id IS 
'Optional link to a business entity (restaurant, store, etc.) that is hiring. 
Allows businesses to post job openings that appear on their listing detail pages.';

-- Update view to include business entity information
CREATE OR REPLACE VIEW job_listing_stats AS
SELECT 
    jl.id,
    jl.job_title,
    jl.employer_id,
    jl.business_entity_id,
    jl.status,
    jl.view_count,
    jl.application_count,
    jl.save_count,
    COUNT(DISTINCT ja.id) as total_applications,
    COUNT(DISTINCT CASE WHEN ja.status = 'hired' THEN ja.id END) as hired_count,
    jl.created_at,
    jl.expires_at,
    e.name as business_name,
    e.entity_type as business_type,
    e.city as business_city,
    e.state as business_state
FROM job_listings jl
LEFT JOIN job_applications ja ON jl.id = ja.job_listing_id
LEFT JOIN entities e ON jl.business_entity_id = e.id
GROUP BY jl.id, e.name, e.entity_type, e.city, e.state;

-- Create view for business hiring overview
CREATE OR REPLACE VIEW business_hiring_summary AS
SELECT 
    e.id as entity_id,
    e.name as business_name,
    e.entity_type,
    e.city,
    e.state,
    COUNT(jl.id) as total_jobs,
    COUNT(CASE WHEN jl.status = 'active' THEN 1 END) as active_jobs,
    COUNT(CASE WHEN jl.status = 'filled' THEN 1 END) as filled_jobs,
    SUM(jl.view_count) as total_views,
    SUM(jl.application_count) as total_applications,
    MAX(jl.created_at) as latest_job_posted
FROM entities e
LEFT JOIN job_listings jl ON e.id = jl.business_entity_id
WHERE e.is_active = TRUE
GROUP BY e.id, e.name, e.entity_type, e.city, e.state
HAVING COUNT(jl.id) > 0;

COMMENT ON VIEW business_hiring_summary IS 
'Summary of hiring activity for each business entity showing job counts and metrics';

-- Add sample data to show the relationship (optional - for testing)
-- Update existing job listings to link to sample businesses if they exist
-- This is commented out by default - uncomment if you want to test with existing data
/*
UPDATE job_listings jl
SET business_entity_id = (
    SELECT e.id 
    FROM entities e 
    WHERE e.owner_id = jl.employer_id 
    AND e.is_active = TRUE
    LIMIT 1
)
WHERE jl.business_entity_id IS NULL 
AND jl.employer_id IN (SELECT DISTINCT owner_id FROM entities WHERE owner_id IS NOT NULL);
*/

