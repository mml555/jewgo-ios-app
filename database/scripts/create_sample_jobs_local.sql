-- Create sample jobs linked to businesses for local development
-- These jobs will have the business_entity_id populated

BEGIN;

-- Job 1: Restaurant Manager at Jerusalem Grill
INSERT INTO jobs (
    poster_id, title, description, company_name,
    location_type, is_remote, city, state, zip_code,
    compensation_type, compensation_min, compensation_max,
    compensation_display, job_type, category,
    requirements, benefits,
    contact_email, kosher_environment, jewish_organization,
    is_active, posted_date, expires_date,
    business_entity_id
) VALUES (
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com' LIMIT 1),
    'Restaurant Manager',
    'Manage daily operations of our kosher restaurant. Oversee staff, ensure quality service, handle customer relations, and maintain high kosher standards in our community-focused establishment. This is a great opportunity for someone passionate about hospitality and kosher dining.',
    'Jerusalem Grill',
    'on-site', FALSE, 'Manhattan', 'NY', '10001',
    'salary', 5000000, 7000000,
    '$50,000 - $70,000/year', 'full-time', 'hospitality',
    ARRAY['3+ years restaurant management experience', 'Knowledge of kosher food preparation', 'Strong leadership skills', 'Excellent communication', 'Ability to work evenings and weekends', 'Food safety certification required'],
    ARRAY['Health, Dental, Vision Insurance', 'Paid Time Off', 'Employee Discounts', 'Professional Development', '401k matching'],
    'hiring@jerusalemgrill.com', TRUE, TRUE,
    TRUE, NOW(), NOW() + INTERVAL '30 days',
    (SELECT id FROM entities_normalized WHERE name = 'Jerusalem Grill' LIMIT 1)
);

-- Job 2: Sous Chef at Kosher Delight
INSERT INTO jobs (
    poster_id, title, description, company_name,
    location_type, is_remote, city, state, zip_code,
    compensation_type, compensation_min, compensation_max,
    compensation_display, job_type, category,
    requirements, benefits,
    contact_email, kosher_environment, jewish_organization,
    is_active, posted_date, expires_date,
    business_entity_id
) VALUES (
    (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com' LIMIT 1),
    'Sous Chef',
    'Assist the Head Chef in all kitchen operations, including food preparation, cooking, and managing kitchen staff. Ensure high-quality dishes and adherence to kosher dietary laws. Perfect for a culinary professional looking to grow.',
    'Kosher Delight',
    'on-site', FALSE, 'Brooklyn', 'NY', '11201',
    'hourly', 2500, 3500,
    '$25 - $35/hour', 'full-time', 'hospitality',
    ARRAY['2+ years culinary experience', 'Experience in kosher kitchens preferred', 'Ability to work in a fast-paced environment', 'Culinary degree or certification', 'Team player with positive attitude'],
    ARRAY['Competitive hourly wage', 'Meal benefits', 'Opportunity for growth', 'Flexible scheduling'],
    'jobs@kosherdelight.com', TRUE, TRUE,
    TRUE, NOW(), NOW() + INTERVAL '30 days',
    (SELECT id FROM entities_normalized WHERE name = 'Kosher Delight' LIMIT 1)
);

-- Job 3: Administrative Assistant at Congregation Beth Israel
INSERT INTO jobs (
    poster_id, title, description, company_name,
    location_type, is_remote, city, state, zip_code,
    compensation_type, compensation_min, compensation_max,
    compensation_display, job_type, category,
    requirements, benefits,
    contact_email, kosher_environment, jewish_organization,
    is_active, posted_date, expires_date,
    business_entity_id
) VALUES (
    (SELECT id FROM users WHERE email = 'admin@jewgo.com' LIMIT 1),
    'Administrative Assistant',
    'Support synagogue operations by managing communications, scheduling, and administrative tasks. Assist with event planning, member services, and office management. Ideal for someone organized and familiar with synagogue life.',
    'Congregation Beth Israel',
    'hybrid', FALSE, 'Brooklyn', 'NY', '11210',
    'hourly', 2000, 2800,
    '$20 - $28/hour', 'part-time', 'administrative',
    ARRAY['Administrative experience', 'Proficiency in Microsoft Office', 'Excellent communication skills', 'Knowledge of Jewish community preferred', 'Reliable and detail-oriented'],
    ARRAY['Flexible hours', 'Supportive work environment', 'Paid holidays', 'Professional development opportunities'],
    'office@bethisrael.org', FALSE, TRUE,
    TRUE, NOW(), NOW() + INTERVAL '30 days',
    (SELECT id FROM entities_normalized WHERE name = 'Congregation Beth Israel' LIMIT 1)
);

-- Job 4: Server/Wait Staff at Test Kosher Restaurant
INSERT INTO jobs (
    poster_id, title, description, company_name,
    location_type, is_remote, city, state, zip_code,
    compensation_type, compensation_min, compensation_max,
    compensation_display, job_type, category,
    requirements, benefits,
    contact_email, kosher_environment, jewish_organization,
    is_active, posted_date, expires_date,
    business_entity_id
) VALUES (
    (SELECT id FROM users WHERE email = 'manager@mikvah.org' LIMIT 1),
    'Server / Wait Staff',
    'Join our front-of-house team at a busy kosher restaurant. Provide excellent customer service, take orders, serve food, and ensure a pleasant dining experience for our guests. Great for students or those seeking flexible hours.',
    'Test Kosher Restaurant',
    'on-site', FALSE, 'Brooklyn', 'NY', '11230',
    'hourly', 1500, 2500,
    '$15 - $25/hour (including tips)', 'part-time', 'hospitality',
    ARRAY['Customer service experience preferred', 'Ability to work evenings and weekends', 'Friendly and professional demeanor', 'Basic math skills', 'Must be able to lift trays and stand for long periods'],
    ARRAY['Flexible scheduling', 'Employee meals', 'Tips', 'Training provided'],
    'hiring@testkosher.com', TRUE, FALSE,
    TRUE, NOW(), NOW() + INTERVAL '30 days',
    (SELECT id FROM entities_normalized WHERE name = 'Test Kosher Restaurant' LIMIT 1)
);

COMMIT;

-- Verify the jobs were created
SELECT 
    j.id, 
    j.title, 
    j.company_name,
    e.name AS business_name,
    j.city,
    j.state,
    ARRAY_LENGTH(j.requirements, 1) AS num_requirements,
    j.is_active
FROM jobs j
LEFT JOIN entities_normalized e ON j.business_entity_id = e.id
WHERE j.business_entity_id IS NOT NULL
ORDER BY j.posted_date DESC;

