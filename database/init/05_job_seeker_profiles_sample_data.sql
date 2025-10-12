-- Job Seeker Profiles Sample Data
-- This file populates the job_seeker_profiles table with realistic sample data

-- First, ensure we have test users for job seekers
DO $$
DECLARE
    seeker1_id UUID;
    seeker2_id UUID;
    seeker3_id UUID;
    seeker4_id UUID;
    seeker5_id UUID;
    seeker6_id UUID;
    seeker7_id UUID;
    seeker8_id UUID;
BEGIN
    -- Create job seeker users
    INSERT INTO users (email, primary_email, password_hash, first_name, last_name, is_verified)
    VALUES 
        ('sarah.cohen@email.com', 'sarah.cohen@email.com', '$2b$10$EXAMPLEHASHONLY', 'Sarah', 'Cohen', TRUE),
        ('david.goldstein@email.com', 'david.goldstein@email.com', '$2b$10$EXAMPLEHASHONLY', 'David', 'Goldstein', TRUE),
        ('rachel.levine@email.com', 'rachel.levine@email.com', '$2b$10$EXAMPLEHASHONLY', 'Rachel', 'Levine', TRUE),
        ('michael.rosen@email.com', 'michael.rosen@email.com', '$2b$10$EXAMPLEHASHONLY', 'Michael', 'Rosen', TRUE),
        ('jessica.silver@email.com', 'jessica.silver@email.com', '$2b$10$EXAMPLEHASHONLY', 'Jessica', 'Silver', TRUE),
        ('esther.klein@email.com', 'esther.klein@email.com', '$2b$10$EXAMPLEHASHONLY', 'Esther', 'Klein', TRUE),
        ('benjamin.katz@email.com', 'benjamin.katz@email.com', '$2b$10$EXAMPLEHASHONLY', 'Benjamin', 'Katz', TRUE),
        ('miriam.schwartz@email.com', 'miriam.schwartz@email.com', '$2b$10$EXAMPLEHASHONLY', 'Miriam', 'Schwartz', TRUE)
    ON CONFLICT (email) DO NOTHING;

    -- Get user IDs
    SELECT id INTO seeker1_id FROM users WHERE email = 'sarah.cohen@email.com';
    SELECT id INTO seeker2_id FROM users WHERE email = 'david.goldstein@email.com';
    SELECT id INTO seeker3_id FROM users WHERE email = 'rachel.levine@email.com';
    SELECT id INTO seeker4_id FROM users WHERE email = 'michael.rosen@email.com';
    SELECT id INTO seeker5_id FROM users WHERE email = 'jessica.silver@email.com';
    SELECT id INTO seeker6_id FROM users WHERE email = 'esther.klein@email.com';
    SELECT id INTO seeker7_id FROM users WHERE email = 'benjamin.katz@email.com';
    SELECT id INTO seeker8_id FROM users WHERE email = 'miriam.schwartz@email.com';

    -- Insert job seeker profiles
    INSERT INTO job_seeker_profiles (
        user_id,
        name,
        age,
        gender,
        zip_code,
        city,
        state,
        latitude,
        longitude,
        willing_to_relocate,
        willing_to_remote,
        headshot_url,
        bio,
        resume_url,
        skills,
        languages,
        certifications,
        contact_email,
        contact_phone,
        linkedin_url,
        portfolio_url,
        desired_salary_min,
        desired_salary_max,
        availability,
        status,
        is_featured,
        is_verified,
        profile_completion_percentage
    ) VALUES 
    -- Software Developer
    (
        seeker1_id,
        'Sarah Cohen',
        28,
        'female',
        '11201',
        'Brooklyn',
        'NY',
        40.6938,
        -73.9902,
        FALSE,
        TRUE,
        NULL,
        'Passionate full-stack developer with 3 years of experience building scalable web applications. Strong background in React, TypeScript, and Node.js. Committed to writing clean, maintainable code and staying current with latest technologies.',
        NULL,
        '["React", "TypeScript", "Node.js", "Python", "JavaScript", "PostgreSQL", "Git", "AWS"]'::jsonb,
        '["English", "Hebrew"]'::jsonb,
        '["Bachelor of Computer Science", "AWS Certified Developer"]'::jsonb,
        'sarah.cohen@email.com',
        '(555) 123-4567',
        'https://linkedin.com/in/sarahcohen',
        NULL,
        7500000,
        9500000,
        'immediate',
        'active',
        TRUE,
        TRUE,
        95
    ),
    
    -- Marketing Manager
    (
        seeker2_id,
        'David Goldstein',
        32,
        'male',
        '10001',
        'Manhattan',
        'NY',
        40.7508,
        -73.9973,
        TRUE,
        TRUE,
        NULL,
        'Results-driven marketing professional with 5 years of experience in digital marketing, SEO, and campaign management. Proven track record of increasing brand awareness and driving customer engagement through data-driven strategies.',
        NULL,
        '["Digital Marketing", "SEO", "Google Analytics", "Social Media", "Content Marketing", "Email Marketing", "Campaign Management"]'::jsonb,
        '["English", "Spanish"]'::jsonb,
        '["MBA Marketing", "Google Analytics Certified", "HubSpot Certified"]'::jsonb,
        'david.goldstein@email.com',
        '(555) 234-5678',
        'https://linkedin.com/in/davidgoldstein',
        NULL,
        7000000,
        9000000,
        '2-weeks',
        'active',
        FALSE,
        TRUE,
        90
    ),
    
    -- Elementary Teacher
    (
        seeker3_id,
        'Rachel Levine',
        35,
        'female',
        '11375',
        'Queens',
        'NY',
        40.7215,
        -73.8383,
        FALSE,
        FALSE,
        NULL,
        'Dedicated educator with 7 years of experience in elementary education. Passionate about inspiring young minds and creating inclusive learning environments. Specialized in curriculum development and special education.',
        NULL,
        '["Curriculum Development", "Classroom Management", "Special Education", "Reading Instruction", "Math Instruction", "Technology Integration"]'::jsonb,
        '["English", "Hebrew"]'::jsonb,
        '["Master of Education", "Teaching License", "Special Education Certification"]'::jsonb,
        'rachel.levine@email.com',
        '(555) 345-6789',
        'https://linkedin.com/in/rachellevine',
        NULL,
        5500000,
        7000000,
        'summer-2024',
        'active',
        TRUE,
        TRUE,
        100
    ),
    
    -- Graphic Designer
    (
        seeker4_id,
        'Michael Rosen',
        26,
        'male',
        '10451',
        'Bronx',
        'NY',
        40.8206,
        -73.9234,
        FALSE,
        TRUE,
        NULL,
        'Creative designer with 4 years of experience in visual communication. Strong portfolio in branding, UI/UX design, and digital marketing materials. Passionate about creating compelling visual experiences that connect with audiences.',
        NULL,
        '["Adobe Creative Suite", "UI/UX Design", "Branding", "Illustration", "Web Design", "Print Design", "Figma", "Sketch"]'::jsonb,
        '["English", "Hebrew", "Russian"]'::jsonb,
        '["Bachelor of Fine Arts", "Adobe Certified Expert"]'::jsonb,
        'michael.rosen@email.com',
        '(555) 456-7890',
        'https://linkedin.com/in/michaelrosen',
        'https://michaelrosen.design',
        5000000,
        7500000,
        'flexible',
        'active',
        FALSE,
        TRUE,
        85
    ),
    
    -- Accountant
    (
        seeker5_id,
        'Jessica Silver',
        30,
        'female',
        '10301',
        'Staten Island',
        'NY',
        40.6301,
        -74.0756,
        TRUE,
        FALSE,
        NULL,
        'Detail-oriented accountant with 6 years of experience in financial analysis, tax preparation, and compliance. CPA certified with strong analytical skills and experience working with small to medium-sized businesses.',
        NULL,
        '["QuickBooks", "Tax Preparation", "Financial Analysis", "CPA", "Excel", "Financial Reporting", "Auditing", "Compliance"]'::jsonb,
        '["English", "Hebrew"]'::jsonb,
        '["CPA License", "Bachelor of Accounting", "QuickBooks ProAdvisor"]'::jsonb,
        'jessica.silver@email.com',
        '(555) 567-8901',
        'https://linkedin.com/in/jessicasilver',
        NULL,
        6500000,
        8500000,
        'immediate',
        'active',
        TRUE,
        TRUE,
        95
    ),
    
    -- Registered Nurse
    (
        seeker6_id,
        'Esther Klein',
        38,
        'female',
        '11215',
        'Brooklyn',
        'NY',
        40.6645,
        -73.9866,
        FALSE,
        FALSE,
        NULL,
        'Compassionate RN with 8 years of experience in patient care. Specialized in emergency medicine and critical care. Committed to providing high-quality healthcare while respecting diverse cultural and religious needs.',
        NULL,
        '["Patient Care", "Emergency Medicine", "Critical Care", "Medication Administration", "Patient Assessment", "CPR Certified"]'::jsonb,
        '["English", "Hebrew", "Yiddish"]'::jsonb,
        '["Registered Nurse License", "Bachelor of Nursing", "BLS Certification", "ACLS Certification"]'::jsonb,
        'esther.klein@email.com',
        '(555) 678-9012',
        'https://linkedin.com/in/estherklein',
        NULL,
        7000000,
        9500000,
        '1-month',
        'active',
        FALSE,
        TRUE,
        90
    ),
    
    -- Sales Representative
    (
        seeker7_id,
        'Benjamin Katz',
        29,
        'male',
        '10016',
        'Manhattan',
        'NY',
        40.7450,
        -73.9792,
        TRUE,
        TRUE,
        NULL,
        'Results-oriented sales professional with 4 years of experience in B2B sales. Proven track record of exceeding sales targets and building strong client relationships. Excellent communication skills and customer service focus.',
        NULL,
        '["B2B Sales", "Customer Relationship Management", "Salesforce", "Negotiation", "Lead Generation", "Account Management"]'::jsonb,
        '["English", "Hebrew"]'::jsonb,
        '["Bachelor of Business Administration", "Salesforce Certified"]'::jsonb,
        'benjamin.katz@email.com',
        '(555) 789-0123',
        'https://linkedin.com/in/benjaminkatz',
        NULL,
        6000000,
        8000000,
        '2-weeks',
        'active',
        FALSE,
        TRUE,
        80
    ),
    
    -- Social Worker
    (
        seeker8_id,
        'Miriam Schwartz',
        34,
        'female',
        '11426',
        'Queens',
        'NY',
        40.7347,
        -73.7419,
        FALSE,
        FALSE,
        NULL,
        'Licensed social worker with 6 years of experience in community outreach and case management. Passionate about helping individuals and families access resources and support services. Strong advocate for social justice.',
        NULL,
        '["Case Management", "Community Outreach", "Crisis Intervention", "Family Services", "Mental Health Support", "Resource Coordination"]'::jsonb,
        '["English", "Hebrew", "Spanish"]'::jsonb,
        '["Master of Social Work", "Licensed Social Worker", "Crisis Intervention Certification"]'::jsonb,
        'miriam.schwartz@email.com',
        '(555) 890-1234',
        'https://linkedin.com/in/miriamschwartz',
        NULL,
        5000000,
        7000000,
        'immediate',
        'active',
        FALSE,
        TRUE,
        85
    )
    ON CONFLICT (user_id) DO NOTHING;

END $$;

COMMIT;

