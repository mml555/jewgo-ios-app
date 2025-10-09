-- Job Seekers Schema Migration
-- This migration adds support for job seekers in the Jewgo application

-- Create job_seekers table
CREATE TABLE job_seekers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic job seeker information
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL, -- Job title/position seeking
    summary TEXT, -- Professional summary/bio
    
    -- Contact information
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    resume_url VARCHAR(500),
    
    -- Location information
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'USA',
    is_remote_ok BOOLEAN DEFAULT FALSE,
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    
    -- Experience and skills
    experience_years INTEGER DEFAULT 0, -- Years of experience
    experience_level VARCHAR(20) DEFAULT 'entry' CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    skills TEXT[], -- Array of skills
    qualifications TEXT[], -- Array of qualifications/certifications
    languages TEXT[], -- Array of languages spoken
    
    -- Job preferences
    desired_job_types TEXT[] DEFAULT '{}', -- ['full-time', 'part-time', 'contract', 'freelance']
    desired_industries TEXT[] DEFAULT '{}', -- ['Technology', 'Education', 'Healthcare', etc.]
    desired_salary_min DECIMAL(10, 2),
    desired_salary_max DECIMAL(10, 2),
    availability VARCHAR(50) DEFAULT 'immediate', -- 'immediate', '2-weeks', '1-month', 'flexible'
    
    -- Jewish community specific
    kosher_environment_preferred BOOLEAN DEFAULT FALSE,
    shabbat_observant BOOLEAN DEFAULT FALSE,
    jewish_organization_preferred BOOLEAN DEFAULT FALSE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create job seeker applications table (for tracking applications to jobs)
CREATE TABLE job_seeker_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Application details
    cover_letter TEXT,
    application_notes TEXT,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'interview', 'accepted', 'rejected', 'withdrawn')),
    
    -- Timestamps
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_seeker_id, job_id) -- One application per job seeker per job
);

-- Create indexes for performance
CREATE INDEX idx_job_seekers_email ON job_seekers(email);
CREATE INDEX idx_job_seekers_city_state ON job_seekers(city, state) WHERE city IS NOT NULL AND state IS NOT NULL;
CREATE INDEX idx_job_seekers_title ON job_seekers(title);
CREATE INDEX idx_job_seekers_experience_level ON job_seekers(experience_level);
CREATE INDEX idx_job_seekers_availability ON job_seekers(availability);
CREATE INDEX idx_job_seekers_active ON job_seekers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_job_seekers_featured ON job_seekers(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_job_seekers_verified ON job_seekers(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_job_seekers_created_at ON job_seekers(created_at DESC);
CREATE INDEX idx_job_seekers_skills ON job_seekers USING GIN(skills);
CREATE INDEX idx_job_seekers_desired_job_types ON job_seekers USING GIN(desired_job_types);
CREATE INDEX idx_job_seekers_desired_industries ON job_seekers USING GIN(desired_industries);

-- Indexes for job seeker applications
CREATE INDEX idx_job_seeker_applications_seeker_id ON job_seeker_applications(job_seeker_id);
CREATE INDEX idx_job_seeker_applications_job_id ON job_seeker_applications(job_id);
CREATE INDEX idx_job_seeker_applications_status ON job_seeker_applications(status);
CREATE INDEX idx_job_seeker_applications_applied_at ON job_seeker_applications(applied_at DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_job_seekers_updated_at BEFORE UPDATE ON job_seekers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_seeker_applications_updated_at BEFORE UPDATE ON job_seeker_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update job seeker contact count
CREATE OR REPLACE FUNCTION update_job_seeker_contact_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE job_seekers 
        SET contact_count = contact_count + 1
        WHERE id = NEW.job_seeker_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE job_seekers 
        SET contact_count = GREATEST(contact_count - 1, 0)
        WHERE id = OLD.job_seeker_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for contact count (when someone contacts a job seeker)
CREATE TRIGGER update_job_seeker_contact_count_on_insert
    AFTER INSERT ON job_seeker_applications
    FOR EACH ROW EXECUTE FUNCTION update_job_seeker_contact_count();

-- Function to update last_active_at when job seeker updates their profile
CREATE OR REPLACE FUNCTION update_job_seeker_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active_at on profile updates
CREATE TRIGGER update_job_seeker_last_active_on_update
    BEFORE UPDATE ON job_seekers
    FOR EACH ROW EXECUTE FUNCTION update_job_seeker_last_active();

COMMIT;
