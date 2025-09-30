-- Sample Jobs Data
-- This file populates the jobs table with realistic Jewish community job listings

-- First, ensure we have a test user to be the job poster
-- In production, this would use actual user IDs
DO $$
DECLARE
    test_user_id UUID;
    community_user_id UUID;
    school_user_id UUID;
BEGIN
    -- Get or create test users for job posting
    SELECT id INTO test_user_id FROM users WHERE email = 'test@jewgo.com' LIMIT 1;
    
    IF test_user_id IS NULL THEN
        INSERT INTO users (email, primary_email, password_hash, first_name, last_name, is_verified)
        VALUES ('test@jewgo.com', 'test@jewgo.com', '$2b$10$EXAMPLEHASHONLY', 'Test', 'Recruiter', TRUE)
        RETURNING id INTO test_user_id;
    END IF;
    
    -- Create community center user
    SELECT id INTO community_user_id FROM users WHERE email = 'jcc@jewgo.com' LIMIT 1;
    
    IF community_user_id IS NULL THEN
        INSERT INTO users (email, primary_email, password_hash, first_name, last_name, is_verified)
        VALUES ('jcc@jewgo.com', 'jcc@jewgo.com', '$2b$10$EXAMPLEHASHONLY', 'Jewish', 'Community Center', TRUE)
        RETURNING id INTO community_user_id;
    END IF;
    
    -- Create school user
    SELECT id INTO school_user_id FROM users WHERE email = 'school@jewgo.com' LIMIT 1;
    
    IF school_user_id IS NULL THEN
        INSERT INTO users (email, primary_email, password_hash, first_name, last_name, is_verified)
        VALUES ('school@jewgo.com', 'school@jewgo.com', '$2b$10$EXAMPLEHASHONLY', 'Jewish Day', 'School', TRUE)
        RETURNING id INTO school_user_id;
    END IF;

    -- Insert sample jobs
    INSERT INTO jobs (
        title, description, company_name, poster_id,
        location_type, is_remote, city, state, zip_code,
        latitude, longitude,
        compensation_type, compensation_min, compensation_max, compensation_display,
        job_type, category, tags,
        requirements, qualifications, experience_level,
        benefits, schedule, start_date,
        contact_email, contact_phone,
        kosher_environment, shabbat_observant, jewish_organization,
        is_active, is_urgent
    ) VALUES
    
    -- Job 1: Hebrew School Teacher
    (
        'Hebrew School Teacher',
        'Join our vibrant Jewish day school as a Hebrew language teacher. We are seeking an enthusiastic educator to teach Hebrew language and Jewish studies to elementary school students. The ideal candidate will have a passion for Jewish education and experience working with children.',
        'Torah Academy',
        school_user_id,
        'on-site',
        FALSE,
        'Brooklyn',
        'NY',
        '11230',
        40.6195,
        -73.9735,
        'salary',
        45000,
        60000,
        '$45K-$60K',
        'full-time',
        'Education',
        ARRAY['full-time', 'education', 'hebrew'],
        ARRAY['Bachelor''s degree in Education or related field', 'Fluent in Hebrew', 'Experience teaching children'],
        ARRAY['Teaching certification preferred', 'Knowledge of Jewish curriculum', 'Classroom management skills'],
        'mid',
        ARRAY['Health insurance', 'Paid holidays (Jewish and secular)', 'Professional development', 'Summer vacation'],
        'Monday-Thursday 8am-4pm, Friday 8am-2pm',
        '2025-08-15'::DATE,
        'hr@torahacademy.org',
        '718-555-0101',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 2: Kosher Chef
    (
        'Kosher Chef - Fine Dining',
        'Upscale kosher restaurant seeking experienced chef to lead our kitchen team. Must have extensive knowledge of kosher dietary laws and experience with high-end culinary techniques. This is an exciting opportunity to showcase your culinary creativity while maintaining strict kosher standards.',
        'Levana Restaurant',
        test_user_id,
        'on-site',
        FALSE,
        'Manhattan',
        'NY',
        '10023',
        40.7789,
        -73.9822,
        'salary',
        65000,
        85000,
        '$65K-$85K',
        'full-time',
        'Food Service',
        ARRAY['full-time', 'culinary', 'kosher'],
        ARRAY['5+ years chef experience', 'Knowledge of kashrut laws', 'Culinary degree or equivalent'],
        ARRAY['Fine dining experience', 'Menu development', 'Team leadership'],
        'senior',
        ARRAY['Health insurance', 'Paid time off', 'Staff meals', 'Career growth'],
        'Tuesday-Sunday, variable shifts',
        '2025-10-01'::DATE,
        'chef@levanarestaurant.com',
        '212-555-0102',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE
    ),
    
    -- Job 3: Community Engagement Coordinator (Remote)
    (
        'Community Engagement Coordinator',
        'Remote position for a dynamic individual to coordinate our virtual and in-person community programs. You''ll work with Jewish communities across North America to plan events, manage social media, and foster connections. Perfect for someone passionate about Jewish community building.',
        'Hillel International',
        community_user_id,
        'remote',
        TRUE,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'salary',
        50000,
        65000,
        '$50K-$65K',
        'full-time',
        'Community Services',
        ARRAY['full-time', 'remote', 'community'],
        ARRAY['Bachelor''s degree', 'Strong communication skills', 'Social media experience'],
        ARRAY['Event planning experience', 'Knowledge of Jewish life', 'CRM software proficiency'],
        'mid',
        ARRAY['Remote work', 'Flexible hours', 'Health insurance', 'Professional development budget'],
        'Flexible - 40 hours/week',
        '2025-11-01'::DATE,
        'jobs@hillel.org',
        NULL,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 4: Part-time Synagogue Administrator
    (
        'Synagogue Administrator',
        'Conservative synagogue seeking part-time administrator to manage daily operations, coordinate with clergy, handle member communications, and oversee facility scheduling. Ideal for someone with excellent organizational skills and familiarity with synagogue life.',
        'Beth Shalom Synagogue',
        test_user_id,
        'hybrid',
        FALSE,
        'Queens',
        'NY',
        '11375',
        40.7215,
        -73.8383,
        'hourly',
        25,
        30,
        '$25-$30/hr',
        'part-time',
        'Administrative',
        ARRAY['part-time', 'hybrid', 'administrative'],
        ARRAY['2+ years administrative experience', 'Proficient in MS Office', 'Excellent communication'],
        ARRAY['Synagogue experience preferred', 'Knowledge of Jewish calendar', 'Event coordination'],
        'entry',
        ARRAY['Flexible schedule', 'Paid Jewish holidays', 'Friendly work environment'],
        '20 hours/week - flexible days',
        '2025-10-15'::DATE,
        'office@bethshalom.org',
        '718-555-0103',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 5: Camp Counselor (Seasonal, Urgent)
    (
        'Summer Camp Counselor',
        'Exciting summer opportunity at our Jewish overnight camp! Lead activities, supervise campers, and create unforgettable Jewish experiences. We''re looking for energetic, responsible individuals who love working with kids ages 8-15. Prior camp experience preferred.',
        'Camp Ramah',
        community_user_id,
        'on-site',
        FALSE,
        'Berkshires',
        'MA',
        '01247',
        42.2876,
        -73.2090,
        'stipend',
        2500,
        3500,
        '$2,500-$3,500 stipend',
        'seasonal',
        'Education',
        ARRAY['seasonal', 'summer', 'urgent'],
        ARRAY['18+ years old', 'CPR/First Aid certified', 'Ability to work with children'],
        ARRAY['Camp experience', 'Activity skills (sports, arts, music)', 'Jewish background'],
        'entry',
        ARRAY['Room and board included', 'All meals provided', 'Amazing community', 'Leadership training'],
        'June 15 - August 15, 24/7 residential',
        '2025-06-15'::DATE,
        'hiring@campramah.org',
        '413-555-0104',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        TRUE
    ),
    
    -- Job 6: Mikvah Attendant
    (
        'Mikvah Attendant',
        'Join our team as a mikvah attendant. This sensitive role involves preparing the mikvah facility, assisting guests, and ensuring proper procedures are followed. Must be a Jewish woman with understanding of taharat hamishpacha laws. Evening hours required.',
        'Community Mikvah',
        test_user_id,
        'on-site',
        FALSE,
        'Lakewood',
        'NJ',
        '08701',
        40.0967,
        -74.2177,
        'hourly',
        18,
        22,
        '$18-$22/hr',
        'part-time',
        'Religious Services',
        ARRAY['part-time', 'evening', 'religious'],
        ARRAY['Must be Jewish woman', 'Understanding of mikvah laws', 'Discreet and respectful'],
        ARRAY['Training provided', 'Familiarity with Orthodox practice'],
        'entry',
        ARRAY['Flexible evening hours', 'Meaningful work', 'Paid training'],
        'Sunday-Thursday evenings, 6pm-10pm',
        '2025-10-01'::DATE,
        'mikvah@community.org',
        '732-555-0105',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 7: Jewish Bookstore Manager
    (
        'Bookstore Manager',
        'Manage our Jewish bookstore specializing in religious texts, gifts, and Judaica. Responsibilities include inventory management, customer service, staff supervision, and ordering. Knowledge of Jewish texts and holidays essential. Great opportunity for someone passionate about Jewish literature.',
        'Eichler''s Judaica',
        test_user_id,
        'on-site',
        FALSE,
        'Borough Park',
        'NY',
        '11219',
        40.6342,
        -73.9963,
        'salary',
        45000,
        55000,
        '$45K-$55K',
        'full-time',
        'Retail',
        ARRAY['full-time', 'retail', 'management'],
        ARRAY['3+ years retail management', 'Knowledge of Jewish texts and holidays', 'Inventory management'],
        ARRAY['Point-of-sale systems', 'Vendor relationships', 'Staff development'],
        'mid',
        ARRAY['Health insurance', 'Employee discount', 'Paid Jewish holidays', 'Shabbat off'],
        'Sunday-Thursday 9am-7pm, Friday 9am-2pm',
        '2025-10-20'::DATE,
        'jobs@eichlers.com',
        '718-555-0106',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 8: Shabbat Program Coordinator
    (
        'Shabbat Program Coordinator',
        'Chabad seeks dynamic coordinator to organize weekly Shabbat dinners, services, and programs for young professionals. Plan menus, coordinate volunteers, manage RSVPs, and create welcoming atmosphere. Must be organized, friendly, and knowledgeable about Shabbat traditions.',
        'Chabad Young Professionals',
        community_user_id,
        'on-site',
        FALSE,
        'Upper West Side',
        'NY',
        '10024',
        40.7870,
        -73.9754,
        'hourly',
        20,
        25,
        '$20-$25/hr',
        'part-time',
        'Community Services',
        ARRAY['part-time', 'weekend', 'community'],
        ARRAY['Event planning experience', 'Knowledge of Shabbat customs', 'Strong organizational skills'],
        ARRAY['Experience with Jewish young adults', 'Cooking skills', 'Outgoing personality'],
        'entry',
        ARRAY['Meaningful work', 'Flexible weekday hours', 'Free Shabbat meals', 'Networking opportunities'],
        'Thursdays & Fridays 10am-4pm, some Shabbat attendance',
        '2025-10-01'::DATE,
        'shabbat@chabadyp.org',
        '212-555-0107',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 9: Software Developer (Hybrid)
    (
        'Software Developer - EdTech',
        'Jewish educational technology company seeking full-stack developer to build innovative learning platforms. Work on apps and websites that make Jewish education accessible and engaging. Tech stack: React, Node.js, PostgreSQL. Hybrid work with flexible Shabbat observant schedule.',
        'Torah Tech Solutions',
        test_user_id,
        'hybrid',
        FALSE,
        'Teaneck',
        'NJ',
        '07666',
        40.8976,
        -74.0160,
        'salary',
        80000,
        110000,
        '$80K-$110K',
        'full-time',
        'Technology',
        ARRAY['full-time', 'hybrid', 'tech'],
        ARRAY['3+ years development experience', 'React and Node.js proficiency', 'Portfolio of work'],
        ARRAY['EdTech experience', 'Mobile development', 'UI/UX skills'],
        'mid',
        ARRAY['Health insurance', '401k matching', 'Flexible hours', 'Shabbat-friendly', 'Remote work options'],
        'Flexible 40 hours, Sunday-Thursday primarily',
        '2025-11-01'::DATE,
        'careers@torahtech.com',
        '201-555-0108',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 10: Development Director
    (
        'Development Director',
        'Lead fundraising efforts for growing Jewish nonprofit. Develop donor relationships, plan events, write grants, and manage annual giving campaign. Must have proven fundraising track record and passion for our mission of supporting Jewish families in need.',
        'Jewish Family Services',
        community_user_id,
        'on-site',
        FALSE,
        'Monsey',
        'NY',
        '10952',
        41.1087,
        -74.0687,
        'salary',
        70000,
        90000,
        '$70K-$90K',
        'full-time',
        'Nonprofit',
        ARRAY['full-time', 'nonprofit', 'fundraising'],
        ARRAY['5+ years fundraising experience', 'Proven donor cultivation', 'Excellent writing skills'],
        ARRAY['Grant writing', 'Event planning', 'CRM database management'],
        'senior',
        ARRAY['Health insurance', 'Retirement plan', 'Paid time off', 'Professional development'],
        'Sunday-Thursday 9am-5pm, some evening events',
        '2025-10-15'::DATE,
        'hr@jfservices.org',
        '845-555-0109',
        FALSE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 11: Kosher Butcher
    (
        'Kosher Butcher',
        'Experienced butcher needed for busy kosher meat market. Must have knowledge of kosher slaughtering and butchering practices. Responsibilities include cutting meat, customer service, and maintaining kashrus standards. Great pay and benefits.',
        'Glatt Mart',
        test_user_id,
        'on-site',
        FALSE,
        'Flatbush',
        'NY',
        '11230',
        40.6282,
        -73.9571,
        'hourly',
        22,
        28,
        '$22-$28/hr',
        'full-time',
        'Food Service',
        ARRAY['full-time', 'kosher', 'skilled-trade'],
        ARRAY['Kosher butchering experience', 'Knowledge of kashrus laws', 'Customer service skills'],
        ARRAY['Certification from kashrus organization', '3+ years experience'],
        'mid',
        ARRAY['Health insurance', 'Paid Jewish holidays', 'Employee discount', 'Overtime available'],
        'Sunday-Thursday 7am-5pm, Friday 6am-2pm',
        '2025-10-01'::DATE,
        'jobs@glattmart.com',
        '718-555-0110',
        TRUE,
        TRUE,
        TRUE,
        TRUE,
        FALSE
    ),
    
    -- Job 12: Social Media Manager (Remote)
    (
        'Social Media Manager',
        'Remote position managing social media for Jewish nonprofit. Create engaging content, grow our online presence, and connect with Jewish community worldwide. Must understand Jewish culture and be creative storyteller. Flexible hours, work from anywhere.',
        'Stand With Us',
        community_user_id,
        'remote',
        TRUE,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'salary',
        45000,
        60000,
        '$45K-$60K',
        'full-time',
        'Marketing',
        ARRAY['full-time', 'remote', 'social-media'],
        ARRAY['2+ years social media management', 'Content creation skills', 'Analytics experience'],
        ARRAY['Jewish education background', 'Graphic design', 'Video editing'],
        'mid',
        ARRAY['Remote work', 'Flexible schedule', 'Health stipend', 'Equipment provided'],
        'Flexible 40 hours/week',
        '2025-11-01'::DATE,
        'jobs@standwithus.org',
        NULL,
        FALSE,
        FALSE,
        TRUE,
        TRUE,
        FALSE
    );

END $$;

COMMIT;
