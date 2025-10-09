-- Complete Jobs System Migration
-- This migration creates the complete jobs system with employer and seeker listings

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- Job Industries
CREATE TABLE job_industries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- for frontend icons
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Types
CREATE TABLE job_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compensation Structures
CREATE TABLE compensation_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experience Levels
CREATE TABLE experience_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    years_min INTEGER,
    years_max INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EMPLOYER JOB LISTINGS
-- ============================================================================

CREATE TABLE job_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    job_title VARCHAR(255) NOT NULL,
    industry_id UUID NOT NULL REFERENCES job_industries(id),
    job_type_id UUID NOT NULL REFERENCES job_types(id),
    experience_level_id UUID REFERENCES experience_levels(id),
    
    -- Compensation
    compensation_structure_id UUID NOT NULL REFERENCES compensation_structures(id),
    salary_min INTEGER, -- in cents
    salary_max INTEGER, -- in cents
    hourly_rate_min INTEGER, -- in cents
    hourly_rate_max INTEGER, -- in cents
    currency VARCHAR(3) DEFAULT 'USD',
    show_salary BOOLEAN DEFAULT TRUE,
    
    -- Location
    zip_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_remote BOOLEAN DEFAULT FALSE,
    is_hybrid BOOLEAN DEFAULT FALSE,
    
    -- Job Details
    description TEXT NOT NULL,
    requirements TEXT,
    benefits TEXT,
    responsibilities TEXT,
    skills JSONB DEFAULT '[]', -- Array of required skills
    
    -- Application Details
    cta_link VARCHAR(500), -- external application URL
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    company_name VARCHAR(255),
    company_website VARCHAR(500),
    company_logo_url VARCHAR(500),
    
    -- Status and Metrics
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'filled', 'expired', 'archived', 'paused'
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    filled_at TIMESTAMPTZ,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    application_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_salary_range CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
    CONSTRAINT valid_hourly_rate CHECK (hourly_rate_max IS NULL OR hourly_rate_min IS NULL OR hourly_rate_max >= hourly_rate_min),
    CONSTRAINT max_active_listings_per_user CHECK (
        (SELECT COUNT(*) FROM job_listings WHERE employer_id = job_listings.employer_id AND status = 'active') <= 2
    )
);

-- ============================================================================
-- JOB SEEKER PROFILES
-- ============================================================================

CREATE TABLE job_seeker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Personal Information
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20), -- 'male', 'female', 'non_binary', 'prefer_not_to_say'
    
    -- Preferences
    preferred_industry_id UUID REFERENCES job_industries(id),
    preferred_job_type_id UUID REFERENCES job_types(id),
    experience_level_id UUID REFERENCES experience_levels(id),
    
    -- Location
    zip_code VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    willing_to_remote BOOLEAN DEFAULT TRUE,
    
    -- Profile Content
    headshot_url VARCHAR(500),
    bio TEXT,
    resume_url VARCHAR(500),
    skills JSONB DEFAULT '[]', -- Array of skills
    languages JSONB DEFAULT '[]', -- Array of languages
    certifications JSONB DEFAULT '[]', -- Array of certifications
    
    -- Contact Details
    meeting_link VARCHAR(500), -- Zoom, Google Meet, etc.
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    
    -- Preferences
    desired_salary_min INTEGER, -- in cents
    desired_salary_max INTEGER, -- in cents
    desired_hourly_rate_min INTEGER, -- in cents
    desired_hourly_rate_max INTEGER, -- in cents
    availability VARCHAR(50), -- 'immediate', '2_weeks', '1_month', 'negotiable'
    
    -- Status and Metrics
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'found_job', 'expired', 'archived', 'paused'
    is_featured BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    profile_completion_percentage INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_age CHECK (age IS NULL OR (age >= 16 AND age <= 100))
);

-- ============================================================================
-- JOB APPLICATIONS
-- ============================================================================

CREATE TABLE job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Application Content
    cover_letter TEXT,
    resume_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    answers JSONB DEFAULT '{}', -- Answers to custom questions
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'
    
    -- Timeline
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    interview_scheduled_at TIMESTAMPTZ,
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Notes
    employer_notes TEXT,
    applicant_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(job_listing_id, applicant_id)
);

-- ============================================================================
-- JOB SEEKER CONTACTS
-- ============================================================================

CREATE TABLE job_seeker_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_seeker_profile_id UUID NOT NULL REFERENCES job_seeker_profiles(id) ON DELETE CASCADE,
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_listing_id UUID REFERENCES job_listings(id) ON DELETE SET NULL,
    
    -- Contact Details
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'contacted', 'responded', 'interviewed', 'hired', 'not_interested'
    
    -- Timeline
    contacted_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    status_changed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Notes
    employer_notes TEXT,
    seeker_notes TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(job_seeker_profile_id, employer_id, job_listing_id)
);

-- ============================================================================
-- SAVED JOBS AND PROFILES
-- ============================================================================

CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_listing_id UUID NOT NULL REFERENCES job_listings(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_listing_id)
);

CREATE TABLE saved_seeker_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_seeker_profile_id UUID NOT NULL REFERENCES job_seeker_profiles(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employer_id, job_seeker_profile_id)
);

-- ============================================================================
-- JOB ALERTS
-- ============================================================================

CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Alert Criteria
    name VARCHAR(255) NOT NULL,
    industry_id UUID REFERENCES job_industries(id),
    job_type_id UUID REFERENCES job_types(id),
    experience_level_id UUID REFERENCES experience_levels(id),
    keywords JSONB DEFAULT '[]',
    location VARCHAR(255),
    radius_miles INTEGER DEFAULT 25,
    salary_min INTEGER,
    is_remote BOOLEAN,
    
    -- Settings
    is_active BOOLEAN DEFAULT TRUE,
    frequency VARCHAR(20) DEFAULT 'daily', -- 'immediate', 'daily', 'weekly'
    last_sent_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Job Listings Indexes
CREATE INDEX idx_job_listings_employer ON job_listings(employer_id);
CREATE INDEX idx_job_listings_industry ON job_listings(industry_id);
CREATE INDEX idx_job_listings_job_type ON job_listings(job_type_id);
CREATE INDEX idx_job_listings_status ON job_listings(status);
CREATE INDEX idx_job_listings_expires_at ON job_listings(expires_at);
CREATE INDEX idx_job_listings_location ON job_listings(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_job_listings_created_at ON job_listings(created_at DESC);
CREATE INDEX idx_job_listings_search ON job_listings USING gin(to_tsvector('english', job_title || ' ' || COALESCE(description, '')));

-- Job Seeker Profiles Indexes
CREATE INDEX idx_job_seeker_profiles_user ON job_seeker_profiles(user_id);
CREATE INDEX idx_job_seeker_profiles_industry ON job_seeker_profiles(preferred_industry_id);
CREATE INDEX idx_job_seeker_profiles_job_type ON job_seeker_profiles(preferred_job_type_id);
CREATE INDEX idx_job_seeker_profiles_status ON job_seeker_profiles(status);
CREATE INDEX idx_job_seeker_profiles_location ON job_seeker_profiles(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_job_seeker_profiles_created_at ON job_seeker_profiles(created_at DESC);

-- Applications Indexes
CREATE INDEX idx_job_applications_listing ON job_applications(job_listing_id);
CREATE INDEX idx_job_applications_applicant ON job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_applied_at ON job_applications(applied_at DESC);

-- Saved Jobs Indexes
CREATE INDEX idx_saved_jobs_user ON saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_listing ON saved_jobs(job_listing_id);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Job Industries
INSERT INTO job_industries (key, name, description, icon_name, sort_order) VALUES
('technology', 'Technology', 'Software, IT, and tech services', 'laptop-code', 1),
('healthcare', 'Healthcare', 'Medical, dental, mental health', 'heartbeat', 2),
('education', 'Education', 'Teaching, tutoring, administration', 'graduation-cap', 3),
('finance', 'Finance & Accounting', 'Banking, accounting, finance', 'dollar-sign', 4),
('retail', 'Retail & Sales', 'Sales, customer service, retail', 'shopping-cart', 5),
('hospitality', 'Hospitality & Food Service', 'Restaurants, hotels, tourism', 'utensils', 6),
('real_estate', 'Real Estate', 'Property management, sales', 'home', 7),
('nonprofit', 'Nonprofit', 'Community organizations, charities', 'hands-helping', 8),
('legal', 'Legal Services', 'Law firms, legal support', 'gavel', 9),
('marketing', 'Marketing & Communications', 'Marketing, PR, communications', 'bullhorn', 10),
('construction', 'Construction & Trades', 'Building, plumbing, electrical', 'hard-hat', 11),
('administrative', 'Administrative', 'Office support, administration', 'briefcase', 12),
('other', 'Other', 'Other industries', 'ellipsis-h', 13);

-- Job Types
INSERT INTO job_types (key, name, description, sort_order) VALUES
('full_time', 'Full Time', '40+ hours per week', 1),
('part_time', 'Part Time', 'Less than 40 hours per week', 2),
('contract', 'Contract', 'Fixed-term project work', 3),
('freelance', 'Freelance', 'Independent contractor', 4),
('internship', 'Internship', 'Entry-level learning position', 5),
('temporary', 'Temporary', 'Short-term position', 6);

-- Compensation Structures
INSERT INTO compensation_structures (key, name, description, sort_order) VALUES
('salary', 'Annual Salary', 'Fixed annual compensation', 1),
('hourly', 'Hourly Wage', 'Paid by the hour', 2),
('commission', 'Commission Only', 'Compensation based on sales', 3),
('salary_plus_commission', 'Salary + Commission', 'Base salary plus commission', 4),
('stipend', 'Stipend', 'Fixed amount for period', 5),
('volunteer', 'Volunteer', 'Unpaid position', 6);

-- Experience Levels
INSERT INTO experience_levels (key, name, description, years_min, years_max, sort_order) VALUES
('entry_level', 'Entry Level', '0-2 years experience', 0, 2, 1),
('mid_level', 'Mid Level', '3-5 years experience', 3, 5, 2),
('senior_level', 'Senior Level', '6-10 years experience', 6, 10, 3),
('executive', 'Executive', '10+ years experience', 10, NULL, 4);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_job_listings_updated_at BEFORE UPDATE ON job_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_seeker_profiles_updated_at BEFORE UPDATE ON job_seeker_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_seeker_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
    completion_percentage INTEGER := 0;
BEGIN
    -- Base fields (20 points each)
    IF NEW.name IS NOT NULL AND NEW.name != '' THEN completion_percentage := completion_percentage + 20; END IF;
    IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN completion_percentage := completion_percentage + 20; END IF;
    IF NEW.headshot_url IS NOT NULL THEN completion_percentage := completion_percentage + 20; END IF;
    
    -- Contact info (10 points each)
    IF NEW.contact_email IS NOT NULL THEN completion_percentage := completion_percentage + 10; END IF;
    IF NEW.contact_phone IS NOT NULL THEN completion_percentage := completion_percentage + 10; END IF;
    
    -- Skills and resume (10 points each)
    IF jsonb_array_length(NEW.skills) > 0 THEN completion_percentage := completion_percentage + 10; END IF;
    IF NEW.resume_url IS NOT NULL THEN completion_percentage := completion_percentage + 10; END IF;
    
    NEW.profile_completion_percentage := completion_percentage;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_seeker_profile_completion_trigger 
BEFORE INSERT OR UPDATE ON job_seeker_profiles
    FOR EACH ROW EXECUTE FUNCTION calculate_seeker_profile_completion();

-- Function to auto-expire jobs
CREATE OR REPLACE FUNCTION auto_expire_jobs()
RETURNS void AS $$
BEGIN
    UPDATE job_listings
    SET status = 'expired'
    WHERE status = 'active' 
    AND expires_at < NOW();
    
    UPDATE job_seeker_profiles
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW job_listing_stats AS
SELECT 
    jl.id,
    jl.job_title,
    jl.employer_id,
    jl.status,
    jl.view_count,
    jl.application_count,
    jl.save_count,
    COUNT(DISTINCT ja.id) as total_applications,
    COUNT(DISTINCT CASE WHEN ja.status = 'hired' THEN ja.id END) as hired_count,
    jl.created_at,
    jl.expires_at
FROM job_listings jl
LEFT JOIN job_applications ja ON jl.id = ja.job_listing_id
GROUP BY jl.id;

CREATE OR REPLACE VIEW job_seeker_profile_stats AS
SELECT 
    jsp.id,
    jsp.name,
    jsp.user_id,
    jsp.status,
    jsp.view_count,
    jsp.contact_count,
    jsp.profile_completion_percentage,
    COUNT(DISTINCT jsc.id) as total_contacts,
    jsp.created_at,
    jsp.expires_at
FROM job_seeker_profiles jsp
LEFT JOIN job_seeker_contacts jsc ON jsp.id = jsc.job_seeker_profile_id
GROUP BY jsp.id;

COMMENT ON TABLE job_listings IS 'Employer job postings with 2 listing limit per user and 14-day expiration';
COMMENT ON TABLE job_seeker_profiles IS 'Job seeker profiles with 1 profile per user and 14-day expiration';
COMMENT ON TABLE job_applications IS 'Applications submitted by job seekers to job listings';
COMMENT ON TABLE job_seeker_contacts IS 'Contacts initiated by employers to job seekers';

