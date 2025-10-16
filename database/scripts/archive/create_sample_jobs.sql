-- Create Sample Jobs for Testing Business Jobs Integration
-- This script creates sample job postings linked to existing businesses

-- First, let's get some business entity IDs
-- Run this query first to see available businesses:
-- SELECT id, name, entity_type FROM entities WHERE is_active = true LIMIT 5;

-- Create sample jobs (update the business_entity_id values with real IDs from your database)
INSERT INTO jobs (
    poster_id,
    business_entity_id,
    title,
    description,
    requirements,
    company_name,
    industry_id,
    job_type_id,
    experience_level_id,
    compensation_structure_id,
    compensation_type,
    compensation_min,
    compensation_max,
    show_compensation,
    zip_code,
    city,
    state,
    is_remote,
    is_hybrid,
    location_type,
    is_active,
    posted_date,
    expires_date
)
VALUES
-- Job 1: Restaurant Manager
(
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1), -- poster_id: any user
    (SELECT id FROM entities WHERE entity_type = 'restaurant' AND is_active = true LIMIT 1), -- business_entity_id
    'Restaurant Manager',
    'Manage daily operations of our kosher restaurant. Oversee staff, ensure quality service, handle customer relations, and maintain high kosher standards. Work with our team to create a welcoming dining experience for our community.',
    '3+ years restaurant management experience, knowledge of kosher food preparation, strong leadership skills, excellent communication, ability to work evenings and weekends, food safety certification required.',
    'Kosher Bistro',
    (SELECT id FROM job_industries WHERE key = 'hospitality' LIMIT 1),
    (SELECT id FROM job_types WHERE key = 'full_time' LIMIT 1),
    (SELECT id FROM experience_levels WHERE key = 'mid_level' LIMIT 1),
    (SELECT id FROM compensation_structures WHERE key = 'salary' LIMIT 1),
    'salary',
    5000000, -- $50,000
    7000000, -- $70,000
    true,
    '10001',
    'New York',
    'NY',
    false,
    false,
    'on-site',
    true,
    NOW(),
    NOW() + INTERVAL '30 days'
),

-- Job 2: Sous Chef
(
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1),
    (SELECT id FROM entities WHERE entity_type = 'restaurant' AND is_active = true OFFSET 1 LIMIT 1),
    'Sous Chef',
    'Assist head chef in kitchen management, prepare kosher meals, train kitchen staff, maintain inventory, and ensure food safety standards are met in our busy kosher restaurant.',
    'Culinary degree or equivalent, 2+ years professional cooking experience, knowledge of kosher laws, ability to work in fast-paced environment, weekend availability.',
    'Jerusalem Grill',
    (SELECT id FROM job_industries WHERE key = 'hospitality' LIMIT 1),
    (SELECT id FROM job_types WHERE key = 'full_time' LIMIT 1),
    (SELECT id FROM experience_levels WHERE key = 'entry_level' LIMIT 1),
    (SELECT id FROM compensation_structures WHERE key = 'hourly' LIMIT 1),
    'hourly',
    2500, -- $25/hr
    3500, -- $35/hr
    true,
    '10002',
    'Brooklyn',
    'NY',
    false,
    false,
    'on-site',
    true,
    NOW(),
    NOW() + INTERVAL '30 days'
),

-- Job 3: Store Associate
(
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1),
    (SELECT id FROM entities WHERE entity_type = 'store' AND is_active = true LIMIT 1),
    'Store Associate',
    'Provide excellent customer service in our kosher market. Stock shelves, assist customers, handle cash register, maintain store cleanliness.',
    'High school diploma, customer service experience preferred, basic math skills, friendly personality, ability to lift 30 lbs, flexible schedule including Sundays.',
    'Kosher Market',
    (SELECT id FROM job_industries WHERE key = 'retail' LIMIT 1),
    (SELECT id FROM job_types WHERE key = 'part_time' LIMIT 1),
    (SELECT id FROM experience_levels WHERE key = 'entry_level' LIMIT 1),
    (SELECT id FROM compensation_structures WHERE key = 'hourly' LIMIT 1),
    'hourly',
    1500, -- $15/hr
    2000, -- $20/hr
    true,
    '10003',
    'Manhattan',
    'NY',
    false,
    false,
    'on-site',
    true,
    NOW(),
    NOW() + INTERVAL '30 days'
);

-- Verify jobs were created
SELECT 
    j.id,
    j.title,
    j.company_name,
    e.name as business_name,
    e.entity_type,
    j.is_active
FROM jobs j
LEFT JOIN entities e ON j.business_entity_id = e.id
ORDER BY j.posted_date DESC
LIMIT 10;

