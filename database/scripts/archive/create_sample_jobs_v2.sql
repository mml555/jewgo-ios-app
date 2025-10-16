-- Create Sample Jobs for Testing Business Jobs Integration (Corrected)

-- Create sample jobs with correct field formats
INSERT INTO jobs (
    poster_id,
    business_entity_id,
    title,
    description,
    responsibilities,
    requirements,
    company_name,
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
    job_type,
    is_active,
    status,
    posted_date,
    expires_date
)
VALUES
-- Job 1: Restaurant Manager
(
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1),
    (SELECT id FROM entities WHERE entity_type = 'restaurant' AND is_active = true LIMIT 1),
    'Restaurant Manager',
    'Manage daily operations of our kosher restaurant. Oversee staff, ensure quality service, handle customer relations, and maintain high kosher standards in our community-focused establishment.',
    'Supervise kitchen and front-of-house staff, manage inventory, ensure food quality, handle customer complaints, maintain kosher compliance, schedule shifts, train new employees.',
    ARRAY['3+ years restaurant management', 'Kosher food knowledge', 'Leadership skills', 'Evening/weekend availability', 'Food safety certification'],
    'Kosher Bistro NYC',
    'salary',
    50000.00,
    70000.00,
    true,
    '10001',
    'New York',
    'NY',
    false,
    false,
    'on-site',
    'full-time',
    true,
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
),

-- Job 2: Sous Chef  
(
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1),
    (SELECT id FROM entities WHERE entity_type = 'restaurant' AND is_active = true OFFSET 1 LIMIT 1),
    'Sous Chef',
    'Assist head chef in kitchen management, prepare authentic kosher meals using traditional recipes and modern techniques. Join our award-winning culinary team.',
    'Prepare daily menu items, train junior kitchen staff, maintain food safety standards, manage inventory, assist with menu development, ensure kosher compliance.',
    ARRAY['Culinary degree or 2+ years experience', 'Knowledge of kosher laws', 'Fast-paced environment', 'Weekend availability', 'Team player'],
    'Jerusalem Grill',
    'hourly',
    25.00,
    35.00,
    true,
    '10002',
    'Brooklyn',
    'NY',
    false,
    false,
    'on-site',
    'full-time',
    true,
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
),

-- Job 3: Store Associate
(
    (SELECT id FROM users WHERE email LIKE '%@%' LIMIT 1),
    (SELECT id FROM entities WHERE entity_type = 'store' AND is_active = true LIMIT 1),
    'Store Associate',
    'Provide excellent customer service in our busy kosher market. Help customers find products, maintain store appearance, handle transactions with warmth and efficiency.',
    'Assist customers with product selection, stock shelves and displays, operate cash register, maintain cleanliness, receive deliveries, answer phones.',
    ARRAY['High school diploma', 'Customer service experience preferred', 'Basic math skills', 'Friendly personality', 'Lift 30 lbs', 'Flexible schedule'],
    'Kosher Market',
    'hourly',
    15.00,
    20.00,
    true,
    '10003',
    'Manhattan',
    'NY',
    false,
    false,
    'on-site',
    'part-time',
    true,
    'active',
    NOW(),
    NOW() + INTERVAL '30 days'
);

-- Verify jobs were created and linked to businesses
SELECT 
    j.id,
    j.title,
    j.company_name,
    e.name as business_name,
    e.entity_type as business_type,
    j.compensation_type,
    j.compensation_min,
    j.compensation_max,
    j.is_active,
    j.status
FROM jobs j
LEFT JOIN entities e ON j.business_entity_id = e.id
ORDER BY j.posted_date DESC
LIMIT 10;

