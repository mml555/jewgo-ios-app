-- Enhanced Jobs Schema Migration
-- This migration enhances the jobs and job_seekers tables with new fields and business rules

-- Add new fields to jobs table for enhanced employer listings
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS compensation_structure VARCHAR(50) DEFAULT 'salary' CHECK (compensation_structure IN ('salary', 'hourly', 'commission', 'stipend', 'volunteer', 'freelance'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_rate VARCHAR(100); -- e.g., "$50K-$70K", "$25/hour", "Negotiable"
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cta_link VARCHAR(500); -- Call-to-action link for applications
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'filled', 'expired', 'archived'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_expire_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days');

-- Add new fields to job_seekers table for enhanced job seeker listings
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS headshot_url VARCHAR(500);
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS bio TEXT; -- Optional short bio
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500); -- Optional meeting link (Zoom, etc.)
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'found_work', 'expired', 'archived'));
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS auto_expire_date TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days');

-- Create employer job limits table to track listing limits
CREATE TABLE IF NOT EXISTS employer_job_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    active_job_count INTEGER DEFAULT 0,
    max_jobs INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employer_id)
);

-- Create job seeker limits table to track single listing per account
CREATE TABLE IF NOT EXISTS job_seeker_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    has_active_listing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create job archives table for expired/filled jobs
CREATE TABLE IF NOT EXISTS job_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    archived_reason VARCHAR(50) NOT NULL CHECK (archived_reason IN ('expired', 'filled', 'cancelled', 'reposted')),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT
);

-- Create job seeker archives table for expired listings
CREATE TABLE IF NOT EXISTS job_seeker_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    archived_reason VARCHAR(50) NOT NULL CHECK (archived_reason IN ('expired', 'found_work', 'cancelled', 'reposted')),
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT
);

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_compensation_structure ON jobs(compensation_structure);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_auto_expire_date ON jobs(auto_expire_date) WHERE auto_expire_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_job_seekers_age ON job_seekers(age) WHERE age IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_seekers_gender ON job_seekers(gender) WHERE gender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_seekers_status ON job_seekers(status);
CREATE INDEX IF NOT EXISTS idx_job_seekers_auto_expire_date ON job_seekers(auto_expire_date) WHERE auto_expire_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_employer_job_limits_employer_id ON employer_job_limits(employer_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_limits_user_id ON job_seeker_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_job_archives_job_id ON job_archives(job_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_archives_job_seeker_id ON job_seeker_archives(job_seeker_id);

-- Function to check and enforce employer job limits
CREATE OR REPLACE FUNCTION check_employer_job_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_allowed INTEGER;
BEGIN
    -- Get current active job count for this employer
    SELECT COUNT(*) INTO current_count
    FROM jobs
    WHERE poster_id = NEW.poster_id 
    AND status = 'active' 
    AND (auto_expire_date IS NULL OR auto_expire_date > CURRENT_TIMESTAMP);
    
    -- Get max allowed jobs for this employer
    SELECT COALESCE(max_jobs, 2) INTO max_allowed
    FROM employer_job_limits
    WHERE employer_id = NEW.poster_id;
    
    -- If no record exists, create one with default limit
    IF max_allowed IS NULL THEN
        INSERT INTO employer_job_limits (employer_id, active_job_count, max_jobs)
        VALUES (NEW.poster_id, 0, 2)
        ON CONFLICT (employer_id) DO NOTHING;
        max_allowed := 2;
    END IF;
    
    -- Check if adding this job would exceed the limit
    IF current_count >= max_allowed THEN
        RAISE EXCEPTION 'Employer has reached maximum job listing limit of %', max_allowed;
    END IF;
    
    -- Update the count
    UPDATE employer_job_limits 
    SET active_job_count = current_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE employer_id = NEW.poster_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and enforce job seeker single listing limit
CREATE OR REPLACE FUNCTION check_job_seeker_limit()
RETURNS TRIGGER AS $$
DECLARE
    has_listing BOOLEAN;
BEGIN
    -- Check if user already has an active job seeker listing
    SELECT EXISTS(
        SELECT 1 FROM job_seekers
        WHERE email = NEW.email
        AND status = 'active'
        AND (auto_expire_date IS NULL OR auto_expire_date > CURRENT_TIMESTAMP)
    ) INTO has_listing;
    
    IF has_listing THEN
        RAISE EXCEPTION 'User already has an active job seeker listing. Only one listing per account is allowed.';
    END IF;
    
    -- Update the limit tracking
    INSERT INTO job_seeker_limits (user_id, has_active_listing)
    VALUES (NEW.id, TRUE)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        has_active_listing = TRUE,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically expire jobs and job seekers
CREATE OR REPLACE FUNCTION auto_expire_listings()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-expire jobs
    UPDATE jobs 
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE auto_expire_date IS NOT NULL 
    AND auto_expire_date <= CURRENT_TIMESTAMP
    AND status = 'active';
    
    -- Auto-expire job seekers
    UPDATE job_seekers 
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE auto_expire_date IS NOT NULL 
    AND auto_expire_date <= CURRENT_TIMESTAMP
    AND status = 'active';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER check_employer_job_limit_trigger
    BEFORE INSERT ON jobs
    FOR EACH ROW EXECUTE FUNCTION check_employer_job_limit();

CREATE TRIGGER check_job_seeker_limit_trigger
    BEFORE INSERT ON job_seekers
    FOR EACH ROW EXECUTE FUNCTION check_job_seeker_limit();

-- Create a scheduled function to auto-expire listings (this would typically be run by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_listings()
RETURNS INTEGER AS $$
DECLARE
    expired_jobs INTEGER;
    expired_seekers INTEGER;
BEGIN
    -- Expire old jobs
    UPDATE jobs 
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE auto_expire_date IS NOT NULL 
    AND auto_expire_date <= CURRENT_TIMESTAMP
    AND status = 'active';
    
    GET DIAGNOSTICS expired_jobs = ROW_COUNT;
    
    -- Expire old job seekers
    UPDATE job_seekers 
    SET status = 'expired',
        updated_at = CURRENT_TIMESTAMP
    WHERE auto_expire_date IS NOT NULL 
    AND auto_expire_date <= CURRENT_TIMESTAMP
    AND status = 'active';
    
    GET DIAGNOSTICS expired_seekers = ROW_COUNT;
    
    -- Archive expired listings
    INSERT INTO job_archives (job_id, archived_reason, archived_at)
    SELECT id, 'expired', CURRENT_TIMESTAMP
    FROM jobs
    WHERE status = 'expired'
    AND id NOT IN (SELECT job_id FROM job_archives);
    
    INSERT INTO job_seeker_archives (job_seeker_id, archived_reason, archived_at)
    SELECT id, 'expired', CURRENT_TIMESTAMP
    FROM job_seekers
    WHERE status = 'expired'
    AND id NOT IN (SELECT job_seeker_id FROM job_seeker_archives);
    
    RETURN expired_jobs + expired_seekers;
END;
$$ LANGUAGE plpgsql;

-- Function to repost a job (create new listing from archived one)
CREATE OR REPLACE FUNCTION repost_job(job_id_to_repost UUID, new_poster_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    old_job RECORD;
    new_job_id UUID;
BEGIN
    -- Get the old job data
    SELECT * INTO old_job FROM jobs WHERE id = job_id_to_repost;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job not found';
    END IF;
    
    -- Create new job with updated dates
    INSERT INTO jobs (
        title, description, company_name, poster_id,
        location_type, is_remote, city, state, zip_code, address,
        latitude, longitude,
        compensation_type, compensation_min, compensation_max,
        compensation_currency, compensation_display,
        job_type, category, tags,
        requirements, qualifications, experience_level,
        benefits, schedule, start_date,
        contact_email, contact_phone, application_url,
        kosher_environment, shabbat_observant, jewish_organization,
        is_urgent, industry, compensation_structure, salary_rate, cta_link,
        auto_expire_date
    ) VALUES (
        old_job.title, old_job.description, old_job.company_name, 
        COALESCE(new_poster_id, old_job.poster_id),
        old_job.location_type, old_job.is_remote, old_job.city, old_job.state, 
        old_job.zip_code, old_job.address,
        old_job.latitude, old_job.longitude,
        old_job.compensation_type, old_job.compensation_min, old_job.compensation_max,
        old_job.compensation_currency, old_job.compensation_display,
        old_job.job_type, old_job.category, old_job.tags,
        old_job.requirements, old_job.qualifications, old_job.experience_level,
        old_job.benefits, old_job.schedule, old_job.start_date,
        old_job.contact_email, old_job.contact_phone, old_job.application_url,
        old_job.kosher_environment, old_job.shabbat_observant, old_job.jewish_organization,
        old_job.is_urgent, old_job.industry, old_job.compensation_structure, 
        old_job.salary_rate, old_job.cta_link,
        CURRENT_TIMESTAMP + INTERVAL '14 days'
    ) RETURNING id INTO new_job_id;
    
    -- Archive the old job
    INSERT INTO job_archives (job_id, archived_reason, archived_at)
    VALUES (job_id_to_repost, 'reposted', CURRENT_TIMESTAMP);
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql;

-- Function to repost a job seeker listing
CREATE OR REPLACE FUNCTION repost_job_seeker(job_seeker_id_to_repost UUID)
RETURNS UUID AS $$
DECLARE
    old_seeker RECORD;
    new_seeker_id UUID;
BEGIN
    -- Get the old job seeker data
    SELECT * INTO old_seeker FROM job_seekers WHERE id = job_seeker_id_to_repost;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job seeker not found';
    END IF;
    
    -- Create new job seeker listing with updated dates
    INSERT INTO job_seekers (
        full_name, title, summary, email, phone, linkedin_url, portfolio_url,
        city, state, zip_code, country, is_remote_ok, willing_to_relocate,
        experience_years, experience_level, skills, qualifications, languages,
        desired_job_types, desired_industries, desired_salary_min, desired_salary_max,
        availability, kosher_environment_preferred, shabbat_observant,
        jewish_organization_preferred, age, gender, headshot_url, bio, meeting_link,
        auto_expire_date
    ) VALUES (
        old_seeker.full_name, old_seeker.title, old_seeker.summary, old_seeker.email,
        old_seeker.phone, old_seeker.linkedin_url, old_seeker.portfolio_url,
        old_seeker.city, old_seeker.state, old_seeker.zip_code, old_seeker.country,
        old_seeker.is_remote_ok, old_seeker.willing_to_relocate,
        old_seeker.experience_years, old_seeker.experience_level, old_seeker.skills,
        old_seeker.qualifications, old_seeker.languages,
        old_seeker.desired_job_types, old_seeker.desired_industries,
        old_seeker.desired_salary_min, old_seeker.desired_salary_max,
        old_seeker.availability, old_seeker.kosher_environment_preferred,
        old_seeker.shabbat_observant, old_seeker.jewish_organization_preferred,
        old_seeker.age, old_seeker.gender, old_seeker.headshot_url, old_seeker.bio,
        old_seeker.meeting_link,
        CURRENT_TIMESTAMP + INTERVAL '14 days'
    ) RETURNING id INTO new_seeker_id;
    
    -- Archive the old listing
    INSERT INTO job_seeker_archives (job_seeker_id, archived_reason, archived_at)
    VALUES (job_seeker_id_to_repost, 'reposted', CURRENT_TIMESTAMP);
    
    RETURN new_seeker_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_employer_job_limits_updated_at BEFORE UPDATE ON employer_job_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_seeker_limits_updated_at BEFORE UPDATE ON job_seeker_limits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
