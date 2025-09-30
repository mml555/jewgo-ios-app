-- Jobs Schema Migration
-- This migration adds support for job listings in the Jewgo application

-- Create jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic job information
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Company/Organization details
    company_name VARCHAR(255),
    company_id UUID REFERENCES users(id) ON DELETE SET NULL,
    poster_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Location information
    location_type VARCHAR(20) NOT NULL DEFAULT 'on-site' CHECK (location_type IN ('on-site', 'remote', 'hybrid')),
    is_remote BOOLEAN DEFAULT FALSE,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    address VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Compensation details
    compensation_type VARCHAR(20) NOT NULL DEFAULT 'hourly' CHECK (compensation_type IN ('hourly', 'salary', 'commission', 'stipend', 'volunteer')),
    compensation_min DECIMAL(10, 2),
    compensation_max DECIMAL(10, 2),
    compensation_currency VARCHAR(3) DEFAULT 'USD',
    compensation_display VARCHAR(100), -- e.g., "$18/hr" or "$60K-$80K"
    
    -- Job type and category
    job_type VARCHAR(20) NOT NULL DEFAULT 'full-time' CHECK (job_type IN ('part-time', 'full-time', 'contract', 'seasonal', 'internship', 'volunteer')),
    category VARCHAR(100), -- e.g., 'Education', 'Food Service', 'Retail', etc.
    tags TEXT[] DEFAULT '{}', -- ['urgent', 'seasonal', 'entry-level', etc.]
    
    -- Requirements and qualifications
    requirements TEXT[], -- Array of requirement strings
    qualifications TEXT[], -- Array of qualification strings
    experience_level VARCHAR(20) CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
    
    -- Additional information
    benefits TEXT[], -- Array of benefits
    schedule VARCHAR(255), -- e.g., "Monday-Friday, 9am-5pm"
    start_date DATE,
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    application_url VARCHAR(500),
    
    -- Jewish community specific
    kosher_environment BOOLEAN DEFAULT FALSE,
    shabbat_observant BOOLEAN DEFAULT FALSE,
    jewish_organization BOOLEAN DEFAULT FALSE,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_date TIMESTAMP WITH TIME ZONE,
    
    -- Engagement metrics (denormalized for performance)
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create job applications table
CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application details
    cover_letter TEXT,
    resume_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interview', 'accepted', 'rejected', 'withdrawn')),
    
    -- Additional information
    notes TEXT, -- Internal notes from employer
    
    -- Timestamps
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_id, applicant_id) -- One application per user per job
);

-- Create indexes for performance
CREATE INDEX idx_jobs_poster_id ON jobs(poster_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_is_remote ON jobs(is_remote) WHERE is_remote = TRUE;
CREATE INDEX idx_jobs_city_state ON jobs(city, state) WHERE city IS NOT NULL AND state IS NOT NULL;
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_category ON jobs(category) WHERE category IS NOT NULL;
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_urgent ON jobs(is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX idx_jobs_featured ON jobs(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX idx_jobs_expires_date ON jobs(expires_date) WHERE expires_date IS NOT NULL;
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_compensation_range ON jobs(compensation_min, compensation_max) WHERE compensation_min IS NOT NULL;
CREATE INDEX idx_jobs_jewish_org ON jobs(jewish_organization) WHERE jewish_organization = TRUE;

-- Indexes for job applications
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs 
        SET application_count = (
            SELECT COUNT(*)
            FROM job_applications 
            WHERE job_id = NEW.job_id
        )
        WHERE id = NEW.job_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs 
        SET application_count = (
            SELECT COUNT(*)
            FROM job_applications 
            WHERE job_id = OLD.job_id
        )
        WHERE id = OLD.job_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for application count
CREATE TRIGGER update_job_application_count_on_insert
    AFTER INSERT ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

CREATE TRIGGER update_job_application_count_on_delete
    AFTER DELETE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

-- Function to automatically expire old jobs
CREATE OR REPLACE FUNCTION check_job_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_date IS NOT NULL AND NEW.expires_date < CURRENT_TIMESTAMP THEN
        NEW.is_active = FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check expiration on update
CREATE TRIGGER check_job_expiration_on_update
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION check_job_expiration();

COMMIT;
