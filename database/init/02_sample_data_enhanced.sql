-- Enhanced Sample Data for Jewgo Application
-- This file populates the enhanced database with realistic sample data

-- =============================================================================
-- SAMPLE LOOKUP DATA (Additional entries beyond basic ones)
-- =============================================================================

-- Add more kosher levels
INSERT INTO kosher_levels (key, name, description, sort_order) VALUES
('badatz', 'Badatz', 'Badatz kosher certification', 6),
('chabad_kosher', 'Chabad Kosher', 'Chabad kosher supervision', 7),
('crc', 'CRC', 'Chicago Rabbinical Council', 8);

-- Add more services
INSERT INTO services (key, name, description, category, sort_order) VALUES
-- Additional restaurant services
('brunch', 'Brunch', 'Brunch service', 'restaurant', 6),
('late_night', 'Late Night', 'Late night dining', 'restaurant', 7),
('wine_bar', 'Wine Bar', 'Kosher wine selection', 'restaurant', 8),
('live_music', 'Live Music', 'Live entertainment', 'restaurant', 9),
-- Additional synagogue services
('bar_mitzvah', 'Bar Mitzvah', 'Bar mitzvah services', 'synagogue', 15),
('bat_mitzvah', 'Bat Mitzvah', 'Bat mitzvah services', 'synagogue', 16),
('wedding_services', 'Wedding Services', 'Wedding ceremonies', 'synagogue', 17),
('funeral_services', 'Funeral Services', 'Funeral and memorial services', 'synagogue', 18),
-- Additional mikvah services
('bridal_mikvah', 'Bridal Mikvah', 'Special bridal mikvah services', 'mikvah', 24),
('postpartum_mikvah', 'Postpartum Mikvah', 'Postpartum mikvah services', 'mikvah', 25),
-- Additional store services
('bulk_orders', 'Bulk Orders', 'Large quantity orders', 'store', 34),
('specialty_items', 'Specialty Items', 'Hard-to-find kosher products', 'store', 35),
('custom_cakes', 'Custom Cakes', 'Custom kosher cake orders', 'store', 36);

-- =============================================================================
-- SAMPLE USERS
-- =============================================================================

INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified) VALUES
('admin@jewgo.com', '$2b$10$example_hash', 'Admin', 'User', '+1-555-0001', true),
('rabbi.cohen@example.com', '$2b$10$example_hash', 'David', 'Cohen', '+1-555-0002', true),
('owner@kosherdeli.com', '$2b$10$example_hash', 'Sarah', 'Goldberg', '+1-555-0003', true),
('manager@mikvah.org', '$2b$10$example_hash', 'Rebecca', 'Levine', '+1-555-0004', true),
('chef@jerusalemgrill.com', '$2b$10$example_hash', 'Moshe', 'Rosenberg', '+1-555-0005', true),
('user1@example.com', '$2b$10$example_hash', 'Michael', 'Rosenberg', '+1-555-0006', false),
('user2@example.com', '$2b$10$example_hash', 'Rachel', 'Stein', '+1-555-0007', false);

-- =============================================================================
-- SAMPLE ENTITIES WITH ENHANCED DATA
-- =============================================================================

-- Sample Restaurants
INSERT INTO entities (
    entity_type_id, name, description, long_description, owner_id, 
    address, city, state, zip_code, phone, email, website,
    location, kosher_level_id, kosher_certification, kosher_certificate_number, 
    kosher_expires_at, is_verified, is_active
) VALUES 
-- Restaurant 1: Kosher Delight
(
    (SELECT id FROM entity_types WHERE key = 'restaurant'),
    'Kosher Delight',
    'Authentic kosher deli serving traditional Jewish cuisine',
    'Kosher Delight has been serving the Jewish community for over 30 years. We specialize in traditional deli sandwiches, fresh soups, and homemade desserts. All our meat is glatt kosher and our dairy products are chalav yisrael. Our experienced chefs prepare everything fresh daily using only the finest ingredients.',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com'),
    '123 Main St', 'Brooklyn', 'NY', '11201', '(718) 555-0101', 'info@kosherdeli.com', 'https://kosherdeli.com',
    ST_SetSRID(ST_MakePoint(-73.9442, 40.6782), 4326)::geography,
    (SELECT id FROM kosher_levels WHERE key = 'glatt'),
    'OU', 'OU-D-12345', '2025-12-31', true, true
),

-- Restaurant 2: Jerusalem Grill
(
    (SELECT id FROM entity_types WHERE key = 'restaurant'),
    'Jerusalem Grill',
    'Mediterranean kosher cuisine with Israeli specialties',
    'Experience authentic Israeli cuisine in the heart of the city. Our chef brings traditional recipes from Jerusalem, featuring fresh hummus, falafel, shawarma, and grilled meats. We pride ourselves on using only the freshest ingredients and traditional cooking methods.',
    (SELECT id FROM users WHERE email = 'chef@jerusalemgrill.com'),
    '456 Oak Ave', 'Manhattan', 'NY', '10001', '(212) 555-0102', 'info@jerusalemgrill.com', 'https://jerusalemgrill.com',
    ST_SetSRID(ST_MakePoint(-73.9934, 40.7505), 4326)::geography,
    (SELECT id FROM kosher_levels WHERE key = 'glatt'),
    'OU', 'OU-D-12346', '2025-11-30', true, true
),

-- Restaurant 3: Brooklyn Bagel Co.
(
    (SELECT id FROM entity_types WHERE key = 'restaurant'),
    'Brooklyn Bagel Co.',
    'Fresh kosher bagels and coffee',
    'Brooklyn Bagel Co. has been making the best kosher bagels in Brooklyn for over 20 years. We bake fresh bagels every morning using traditional methods and only the finest ingredients. Stop by for a fresh bagel, hot coffee, and friendly service.',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com'),
    '789 Flatbush Ave', 'Brooklyn', 'NY', '11225', '(718) 555-0103', 'info@brooklynbagel.com', 'https://brooklynbagel.com',
    ST_SetSRID(ST_MakePoint(-73.9614, 40.6629), 4326)::geography,
    (SELECT id FROM kosher_levels WHERE key = 'pas_yisrael'),
    'CRC', 'CRC-78901', '2025-10-15', true, true
);

-- Sample Synagogues
INSERT INTO entities (
    entity_type_id, name, description, long_description, owner_id,
    address, city, state, zip_code, phone, email, website,
    location, denomination_id, is_verified, is_active
) VALUES
-- Synagogue 1: Beth El Synagogue
(
    (SELECT id FROM entity_types WHERE key = 'synagogue'),
    'Beth El Synagogue',
    'Conservative synagogue serving the community',
    'Beth El Synagogue is a vibrant Conservative congregation that has been serving the Jewish community for over 50 years. We offer daily services, Hebrew school, adult education, and a warm, welcoming community for all ages.',
    (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com'),
    '321 Park Ave', 'Brooklyn', 'NY', '11205', '(718) 555-0201', 'info@bethelsynagogue.org', 'https://bethelsynagogue.org',
    ST_SetSRID(ST_MakePoint(-73.9583, 40.6957), 4326)::geography,
    (SELECT id FROM denominations WHERE key = 'conservative'),
    true, true
),

-- Synagogue 2: Chabad House
(
    (SELECT id FROM entity_types WHERE key = 'synagogue'),
    'Chabad House Brooklyn',
    'Chabad-Lubavitch community center',
    'Chabad House Brooklyn is a welcoming community center that serves Jews from all backgrounds. We offer daily services, educational programs, holiday celebrations, and community events. Our mission is to make Judaism accessible and meaningful for everyone.',
    (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com'),
    '654 Ocean Pkwy', 'Brooklyn', 'NY', '11218', '(718) 555-0202', 'info@chabadbrooklyn.org', 'https://chabadbrooklyn.org',
    ST_SetSRID(ST_MakePoint(-73.9778, 40.6344), 4326)::geography,
    (SELECT id FROM denominations WHERE key = 'chabad'),
    true, true
);

-- Sample Mikvahs
INSERT INTO entities (
    entity_type_id, name, description, long_description, owner_id,
    address, city, state, zip_code, phone, email, website,
    location, is_verified, is_active
) VALUES
-- Mikvah 1: Community Mikvah
(
    (SELECT id FROM entity_types WHERE key = 'mikvah'),
    'Community Mikvah',
    'Beautiful mikvah facility serving the community',
    'Our community mikvah provides a beautiful, comfortable, and private space for women to fulfill this important mitzvah. We offer private rooms, attendant assistance, and all necessary supplies. The facility is meticulously maintained and follows all halachic requirements.',
    (SELECT id FROM users WHERE email = 'manager@mikvah.org'),
    '987 Eastern Pkwy', 'Brooklyn', 'NY', '11213', '(718) 555-0301', 'info@communitymikvah.org', 'https://communitymikvah.org',
    ST_SetSRID(ST_MakePoint(-73.9442, 40.6782), 4326)::geography,
    true, true
);

-- Sample Stores
INSERT INTO entities (
    entity_type_id, name, description, long_description, owner_id,
    address, city, state, zip_code, phone, email, website,
    location, kosher_level_id, kosher_certification, kosher_certificate_number,
    kosher_expires_at, store_type_id, is_verified, is_active
) VALUES
-- Store 1: Kosher Market
(
    (SELECT id FROM entity_types WHERE key = 'store'),
    'Kosher Market',
    'Full-service kosher grocery store',
    'Kosher Market is your one-stop shop for all kosher grocery needs. We carry a wide selection of fresh produce, kosher meats, dairy products, and packaged goods. Our knowledgeable staff can help you find exactly what you need.',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com'),
    '147 Atlantic Ave', 'Brooklyn', 'NY', '11201', '(718) 555-0401', 'info@koshermarket.com', 'https://koshermarket.com',
    ST_SetSRID(ST_MakePoint(-73.9978, 40.6907), 4326)::geography,
    (SELECT id FROM kosher_levels WHERE key = 'glatt'),
    'OU', 'OU-D-54321', '2025-09-30',
    (SELECT id FROM store_types WHERE key = 'grocery'),
    true, true
);

-- =============================================================================
-- SAMPLE ENTITY SERVICES
-- =============================================================================

-- Restaurant services
INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Kosher Delight'
  AND s.key IN ('delivery', 'takeout', 'dine_in', 'catering');

INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Jerusalem Grill'
  AND s.key IN ('delivery', 'takeout', 'dine_in', 'outdoor_seating', 'live_music');

INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Brooklyn Bagel Co.'
  AND s.key IN ('takeout', 'dine_in', 'brunch');

-- Synagogue services
INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Beth El Synagogue'
  AND s.key IN ('daily_services', 'shabbat_services', 'holiday_services', 'hebrew_school', 'adult_education', 'bar_mitzvah', 'bat_mitzvah', 'wedding_services');

INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Chabad House Brooklyn'
  AND s.key IN ('daily_services', 'shabbat_services', 'holiday_services', 'hebrew_school', 'adult_education', 'bar_mitzvah', 'bat_mitzvah');

-- Mikvah services
INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Community Mikvah'
  AND s.key IN ('private_rooms', 'attendant_assistance', 'supplies', 'bridal_mikvah', 'postpartum_mikvah');

-- Store services
INSERT INTO entity_services (entity_id, service_id)
SELECT 
    e.id,
    s.id
FROM entities e,
     services s
WHERE e.name = 'Kosher Market'
  AND s.key IN ('fresh_produce', 'packaged_goods', 'kosher_meat', 'bulk_orders', 'specialty_items');

-- =============================================================================
-- SAMPLE SOCIAL LINKS
-- =============================================================================

INSERT INTO social_links (entity_id, platform, url, is_verified)
SELECT 
    e.id,
    'facebook',
    'https://facebook.com/kosherdelight',
    true
FROM entities e
WHERE e.name = 'Kosher Delight';

INSERT INTO social_links (entity_id, platform, url, is_verified)
SELECT 
    e.id,
    'instagram',
    'https://instagram.com/kosherdelight',
    true
FROM entities e
WHERE e.name = 'Kosher Delight';

INSERT INTO social_links (entity_id, platform, url, is_verified)
SELECT 
    e.id,
    'facebook',
    'https://facebook.com/jerusalemgrill',
    true
FROM entities e
WHERE e.name = 'Jerusalem Grill';

INSERT INTO social_links (entity_id, platform, url, is_verified)
SELECT 
    e.id,
    'instagram',
    'https://instagram.com/jerusalemgrill',
    true
FROM entities e
WHERE e.name = 'Jerusalem Grill';

-- =============================================================================
-- SAMPLE BUSINESS HOURS
-- =============================================================================

-- Kosher Delight hours
INSERT INTO business_hours (entity_id, day_of_week_id, open_time, close_time, is_closed)
SELECT 
    e.id,
    dow.id,
    '08:00'::time,
    '20:00'::time,
    false
FROM entities e,
     days_of_week dow
WHERE e.name = 'Kosher Delight'
  AND dow.key IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday');

-- Kosher Delight - closed on Saturday
INSERT INTO business_hours (entity_id, day_of_week_id, open_time, close_time, is_closed)
SELECT 
    e.id,
    dow.id,
    NULL,
    NULL,
    true
FROM entities e,
     days_of_week dow
WHERE e.name = 'Kosher Delight'
  AND dow.key = 'saturday';

-- Kosher Delight - Sunday hours
INSERT INTO business_hours (entity_id, day_of_week_id, open_time, close_time, is_closed)
SELECT 
    e.id,
    dow.id,
    '09:00'::time,
    '19:00'::time,
    false
FROM entities e,
     days_of_week dow
WHERE e.name = 'Kosher Delight'
  AND dow.key = 'sunday';

-- Jerusalem Grill hours
INSERT INTO business_hours (entity_id, day_of_week_id, open_time, close_time, is_closed)
SELECT 
    e.id,
    dow.id,
    '11:00'::time,
    '22:00'::time,
    false
FROM entities e,
     days_of_week dow
WHERE e.name = 'Jerusalem Grill'
  AND dow.key IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday');

-- Jerusalem Grill - Friday hours (early close for Shabbat)
INSERT INTO business_hours (entity_id, day_of_week_id, open_time, close_time, is_closed)
SELECT 
    e.id,
    dow.id,
    '11:00'::time,
    '15:00'::time,
    false
FROM entities e,
     days_of_week dow
WHERE e.name = 'Jerusalem Grill'
  AND dow.key = 'friday';

-- Jerusalem Grill - closed on Saturday
INSERT INTO business_hours (entity_id, day_of_week_id, open_time, close_time, is_closed)
SELECT 
    e.id,
    dow.id,
    NULL,
    NULL,
    true
FROM entities e,
     days_of_week dow
WHERE e.name = 'Jerusalem Grill'
  AND dow.key = 'saturday';

-- =============================================================================
-- SAMPLE REVIEWS
-- =============================================================================

INSERT INTO reviews (entity_id, user_id, rating, title, content, is_verified, is_moderated)
SELECT 
    e.id,
    u.id,
    5,
    'Excellent kosher deli!',
    'The food here is absolutely amazing. The pastrami sandwich was perfect and the service was friendly. Highly recommend!',
    true,
    false
FROM entities e,
     users u
WHERE e.name = 'Kosher Delight'
  AND u.email = 'user1@example.com';

INSERT INTO reviews (entity_id, user_id, rating, title, content, is_verified, is_moderated)
SELECT 
    e.id,
    u.id,
    4,
    'Great Mediterranean food',
    'The hummus and falafel were delicious. The atmosphere is nice and the staff is helpful. Will definitely come back.',
    true,
    false
FROM entities e,
     users u
WHERE e.name = 'Jerusalem Grill'
  AND u.email = 'user2@example.com';

-- =============================================================================
-- SAMPLE IMAGES
-- =============================================================================

INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://picsum.photos/800/600?random=1',
    'Kosher Delight restaurant exterior',
    true,
    1
FROM entities e
WHERE e.name = 'Kosher Delight';

INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://picsum.photos/800/600?random=2',
    'Kosher Delight interior dining area',
    false,
    2
FROM entities e
WHERE e.name = 'Kosher Delight';

INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://picsum.photos/800/600?random=3',
    'Jerusalem Grill restaurant front',
    true,
    1
FROM entities e
WHERE e.name = 'Jerusalem Grill';

-- =============================================================================
-- SAMPLE FAVORITES
-- =============================================================================

INSERT INTO favorites (user_id, entity_id)
SELECT 
    u.id,
    e.id
FROM users u,
     entities e
WHERE u.email = 'user1@example.com'
  AND e.name = 'Kosher Delight';

INSERT INTO favorites (user_id, entity_id)
SELECT 
    u.id,
    e.id
FROM users u,
     entities e
WHERE u.email = 'user1@example.com'
  AND e.name = 'Jerusalem Grill';

INSERT INTO favorites (user_id, entity_id)
SELECT 
    u.id,
    e.id
FROM users u,
     entities e
WHERE u.email = 'user2@example.com'
  AND e.name = 'Beth El Synagogue';

COMMIT;
