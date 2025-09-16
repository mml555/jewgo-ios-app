-- Sample data for Jewgo application
-- This file populates the database with realistic sample data

-- Insert sample categories
INSERT INTO categories (key, name, emoji, description, sort_order) VALUES
('restaurants', 'Restaurants', '🍽️', 'Kosher restaurants and eateries', 1),
('synagogues', 'Synagogues', '🏛️', 'Synagogues and prayer halls', 2),
('mikvahs', 'Mikvahs', '💧', 'Mikvah facilities', 3),
('stores', 'Stores', '🛒', 'Kosher stores and markets', 4);

-- Insert sample users
INSERT INTO users (email, password_hash, first_name, last_name, phone, is_verified) VALUES
('admin@jewgo.com', '$2b$10$example_hash', 'Admin', 'User', '+1-555-0001', true),
('rabbi.cohen@example.com', '$2b$10$example_hash', 'David', 'Cohen', '+1-555-0002', true),
('owner@kosherdeli.com', '$2b$10$example_hash', 'Sarah', 'Goldberg', '+1-555-0003', true),
('manager@mikvah.org', '$2b$10$example_hash', 'Rebecca', 'Levine', '+1-555-0004', true),
('user1@example.com', '$2b$10$example_hash', 'Michael', 'Rosenberg', '+1-555-0005', false),
('user2@example.com', '$2b$10$example_hash', 'Rachel', 'Stein', '+1-555-0006', false);

-- Insert sample restaurants
INSERT INTO entities (entity_type, name, description, long_description, owner_id, address, city, state, zip_code, phone, email, website, latitude, longitude, kosher_level, kosher_certification, kosher_certificate_number, kosher_expires_at) VALUES
('restaurant', 'Kosher Delight', 'Authentic kosher deli serving traditional Jewish cuisine', 'Kosher Delight has been serving the Jewish community for over 30 years. We specialize in traditional deli sandwiches, fresh soups, and homemade desserts. All our meat is glatt kosher and our dairy products are chalav yisrael.', (SELECT id FROM users WHERE email = 'owner@kosherdeli.com'), '123 Main St', 'Brooklyn', 'NY', '11201', '(718) 555-0101', 'info@kosherdeli.com', 'https://kosherdeli.com', 40.6782, -73.9442, 'glatt', 'OU', 'OU-D-12345', '2025-12-31'),
('restaurant', 'Jerusalem Grill', 'Mediterranean kosher cuisine with Israeli specialties', 'Experience authentic Israeli cuisine in the heart of the city. Our chef brings traditional recipes from Jerusalem, featuring fresh hummus, falafel, shawarma, and grilled meats.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '456 Oak Ave', 'Manhattan', 'NY', '10001', '(212) 555-0102', 'info@jerusalemgrill.com', 'https://jerusalemgrill.com', 40.7505, -73.9934, 'glatt', 'OU', 'OU-D-12346', '2025-11-30'),
('restaurant', 'Chabad House Cafe', 'Cozy cafe with kosher breakfast and lunch options', 'A warm, welcoming space for the community to gather over delicious kosher food. We serve fresh pastries, coffee, sandwiches, and light meals in a comfortable setting.', (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com'), '789 Pine St', 'Queens', 'NY', '11375', '(718) 555-0103', 'cafe@chabadhouse.org', 'https://chabadhouse.org/cafe', 40.7282, -73.7949, 'chalav_yisrael', 'Chabad', 'CHABAD-C-001', '2025-10-15'),
('restaurant', 'Mazel Tov Bakery', 'Artisanal kosher bakery with fresh breads and pastries', 'Traditional Jewish bakery using time-honored recipes passed down through generations. We bake fresh challah, bagels, rugelach, and custom cakes daily.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '321 Maple Dr', 'Brooklyn', 'NY', '11204', '(718) 555-0104', 'orders@mazeltovbakery.com', 'https://mazeltovbakery.com', 40.6215, -73.9595, 'pas_yisrael', 'OU', 'OU-P-12347', '2025-09-30'),
('restaurant', 'Sephardic Kitchen', 'Traditional Sephardic cuisine with Moroccan and Turkish influences', 'Discover the rich flavors of Sephardic Jewish cuisine. Our menu features traditional dishes from Morocco, Turkey, and Spain, all prepared according to kosher standards.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '654 Cedar Ln', 'Brooklyn', 'NY', '11218', '(718) 555-0105', 'info@sephardickitchen.com', 'https://sephardickitchen.com', 40.6403, -73.9768, 'glatt', 'OU', 'OU-D-12348', '2025-08-31');

-- Insert sample synagogues
INSERT INTO entities (entity_type, name, description, long_description, owner_id, address, city, state, zip_code, phone, email, website, facebook_url, latitude, longitude, denomination, services) VALUES
('synagogue', 'Congregation Beth Israel', 'Modern Orthodox synagogue serving the local community', 'Congregation Beth Israel is a vibrant Modern Orthodox community committed to Torah learning, prayer, and acts of kindness. We welcome families and individuals of all backgrounds.', (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com'), '987 Elm St', 'Brooklyn', 'NY', '11230', '(718) 555-0201', 'info@bethisrael.org', 'https://bethisrael.org', 'https://facebook.com/bethisrael', 40.6293, -73.9613, 'orthodox', ARRAY['Daily Minyan', 'Shabbat Services', 'Youth Programs', 'Adult Education', 'Community Events']),
('synagogue', 'Temple Emanuel', 'Conservative synagogue with rich history and active community', 'Temple Emanuel has been a cornerstone of the Jewish community for over 75 years. We offer traditional and egalitarian services, comprehensive educational programs, and social action initiatives.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '147 Oak St', 'Manhattan', 'NY', '10023', '(212) 555-0202', 'office@templeemanuel.org', 'https://templeemanuel.org', 'https://facebook.com/templeemanuel', 40.7831, -73.9712, 'conservative', ARRAY['Shabbat Services', 'High Holiday Services', 'Hebrew School', 'Adult Education', 'Social Action', 'Youth Groups']),
('synagogue', 'Chabad Lubavitch', 'Chabad center offering services and community programs', 'Our Chabad center provides a warm, welcoming environment for Jews of all backgrounds. We offer daily minyanim, Shabbat services, educational programs, and community events.', (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com'), '258 Pine Ave', 'Queens', 'NY', '11367', '(718) 555-0203', 'info@chabadcenter.org', 'https://chabadcenter.org', 'https://facebook.com/chabadcenter', 40.7282, -73.7949, 'chabad', ARRAY['Daily Minyan', 'Shabbat Services', 'Holiday Programs', 'Children''s Programs', 'Adult Classes', 'Community Outreach']),
('synagogue', 'Reform Temple Sinai', 'Progressive Reform synagogue with inclusive community', 'Temple Sinai is a welcoming Reform congregation committed to social justice, spiritual growth, and Jewish learning. We embrace diversity and promote interfaith understanding.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '369 Maple Blvd', 'Brooklyn', 'NY', '11215', '(718) 555-0204', 'info@templesinai.org', 'https://templesinai.org', 'https://facebook.com/templesinai', 40.6602, -73.9690, 'reform', ARRAY['Friday Night Services', 'Saturday Morning Services', 'Religious School', 'Adult Education', 'Social Justice', 'Community Outreach']),
('synagogue', 'Sephardic Center', 'Sephardic Orthodox synagogue preserving Sephardic traditions', 'The Sephardic Center is dedicated to preserving and promoting Sephardic Jewish traditions, customs, and culture. We offer traditional Sephardic prayer services and cultural programs.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '741 Cedar Dr', 'Brooklyn', 'NY', '11204', '(718) 555-0205', 'info@sephardiccenter.org', 'https://sephardiccenter.org', 'https://facebook.com/sephardiccenter', 40.6215, -73.9595, 'sephardic', ARRAY['Daily Minyan', 'Shabbat Services', 'Sephardic Customs', 'Cultural Programs', 'Youth Education', 'Community Events']);

-- Insert sample mikvahs
INSERT INTO entities (entity_type, name, description, long_description, owner_id, address, city, state, zip_code, phone, email, website, latitude, longitude) VALUES
('mikvah', 'Community Mikvah Center', 'Modern mikvah facility serving the entire community', 'The Community Mikvah Center provides a clean, comfortable, and dignified environment for mikvah use. Our facility features modern amenities while maintaining traditional standards of kashrut.', (SELECT id FROM users WHERE email = 'manager@mikvah.org'), '852 Birch St', 'Brooklyn', 'NY', '11219', '(718) 555-0301', 'info@communitymikvah.org', 'https://communitymikvah.org', 40.6342, -73.9969),
('mikvah', 'Chabad Mikvah', 'Chabad-operated mikvah with warm, welcoming atmosphere', 'Our Chabad mikvah offers a serene and spiritual environment for this sacred mitzvah. We provide all necessary amenities and maintain the highest standards of cleanliness and kashrut.', (SELECT id FROM users WHERE email = 'rabbi.cohen@example.com'), '963 Spruce Ave', 'Queens', 'NY', '11375', '(718) 555-0302', 'mikvah@chabadcenter.org', 'https://chabadcenter.org/mikvah', 40.7282, -73.7949),
('mikvah', 'Temple Mikvah', 'Temple-affiliated mikvah open to all community members', 'The Temple Mikvah welcomes all members of the Jewish community. Our facility is designed to provide comfort, privacy, and spiritual fulfillment in accordance with halachic requirements.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '147 Walnut Ln', 'Manhattan', 'NY', '10025', '(212) 555-0303', 'mikvah@templeemanuel.org', 'https://templeemanuel.org/mikvah', 40.7831, -73.9712),
('mikvah', 'Sephardic Mikvah', 'Traditional Sephardic mikvah preserving ancient customs', 'Our Sephardic mikvah maintains traditional customs and practices while providing modern amenities. We serve the Sephardic community and welcome all who wish to observe this important mitzvah.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '258 Ash St', 'Brooklyn', 'NY', '11204', '(718) 555-0304', 'mikvah@sephardiccenter.org', 'https://sephardiccenter.org/mikvah', 40.6215, -73.9595);

-- Insert sample stores
INSERT INTO entities (entity_type, name, description, long_description, owner_id, address, city, state, zip_code, phone, email, website, latitude, longitude, store_type, kosher_level, kosher_certification, kosher_certificate_number, kosher_expires_at) VALUES
('store', 'Kosher World Market', 'Full-service kosher grocery store with fresh produce and prepared foods', 'Kosher World Market is your one-stop shop for all kosher needs. We carry a wide selection of fresh produce, meats, dairy products, packaged goods, and prepared foods from around the world.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '159 Main St', 'Brooklyn', 'NY', '11201', '(718) 555-0401', 'info@kosherworld.com', 'https://kosherworld.com', 40.6782, -73.9442, 'grocery', 'glatt', 'OU', 'OU-K-12349', '2025-12-31'),
('store', 'Glatt Kosher Butcher', 'Premium kosher butcher shop with fresh meats and poultry', 'For over 40 years, we have been providing the community with the finest kosher meats and poultry. All our products are glatt kosher and sourced from the most reputable suppliers.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '357 Oak Ave', 'Manhattan', 'NY', '10001', '(212) 555-0402', 'info@glattbutcher.com', 'https://glattbutcher.com', 40.7505, -73.9934, 'butcher', 'glatt', 'OU', 'OU-M-12350', '2025-11-30'),
('store', 'Challah Corner Bakery', 'Specialty kosher bakery focusing on traditional breads', 'Challah Corner specializes in traditional Jewish breads and pastries. We bake fresh challah, bagels, and other traditional items daily using time-honored recipes and the finest ingredients.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '468 Pine St', 'Queens', 'NY', '11375', '(718) 555-0403', 'orders@challahcorner.com', 'https://challahcorner.com', 40.7282, -73.7949, 'bakery', 'pas_yisrael', 'OU', 'OU-P-12351', '2025-10-15'),
('store', 'Gourmet Kosher Deli', 'Upscale deli counter with prepared foods and catering', 'Our gourmet deli offers an extensive selection of prepared foods, sandwiches, salads, and catering options. Perfect for busy families and special occasions.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '579 Maple Dr', 'Brooklyn', 'NY', '11204', '(718) 555-0404', 'catering@gourmetkosher.com', 'https://gourmetkosher.com', 40.6215, -73.9595, 'deli', 'glatt', 'OU', 'OU-D-12352', '2025-09-30'),
('store', 'Sephardic Specialty Market', 'Specialty market featuring Sephardic and Mediterranean products', 'We specialize in Sephardic and Mediterranean kosher products that are hard to find elsewhere. From imported spices to traditional foods, we bring the flavors of the Sephardic world to your table.', (SELECT id FROM users WHERE email = 'admin@jewgo.com'), '680 Cedar Ln', 'Brooklyn', 'NY', '11218', '(718) 555-0405', 'info@sephardicspecialty.com', 'https://sephardicspecialty.com', 40.6403, -73.9768, 'specialty', 'glatt', 'OU', 'OU-K-12353', '2025-08-31');

-- Insert business hours for restaurants
INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) 
SELECT e.id, 'sunday'::day_of_week, '09:00:00'::time, '21:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant'
UNION ALL
SELECT e.id, 'monday'::day_of_week, '09:00:00'::time, '21:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant'
UNION ALL
SELECT e.id, 'tuesday'::day_of_week, '09:00:00'::time, '21:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant'
UNION ALL
SELECT e.id, 'wednesday'::day_of_week, '09:00:00'::time, '21:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant'
UNION ALL
SELECT e.id, 'thursday'::day_of_week, '09:00:00'::time, '21:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant'
UNION ALL
SELECT e.id, 'friday'::day_of_week, '09:00:00'::time, '15:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant'
UNION ALL
SELECT e.id, 'saturday'::day_of_week, '20:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'restaurant';

-- Insert business hours for synagogues
INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) 
SELECT e.id, 'sunday'::day_of_week, '08:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue'
UNION ALL
SELECT e.id, 'monday'::day_of_week, '06:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue'
UNION ALL
SELECT e.id, 'tuesday'::day_of_week, '06:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue'
UNION ALL
SELECT e.id, 'wednesday'::day_of_week, '06:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue'
UNION ALL
SELECT e.id, 'thursday'::day_of_week, '06:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue'
UNION ALL
SELECT e.id, 'friday'::day_of_week, '06:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue'
UNION ALL
SELECT e.id, 'saturday'::day_of_week, '06:00:00'::time, '22:00:00'::time, false
FROM entities e WHERE e.entity_type = 'synagogue';

-- Insert business hours for mikvahs
INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) 
SELECT e.id, 'sunday'::day_of_week, '19:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah'
UNION ALL
SELECT e.id, 'monday'::day_of_week, '19:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah'
UNION ALL
SELECT e.id, 'tuesday'::day_of_week, '19:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah'
UNION ALL
SELECT e.id, 'wednesday'::day_of_week, '19:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah'
UNION ALL
SELECT e.id, 'thursday'::day_of_week, '19:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah'
UNION ALL
SELECT e.id, 'friday'::day_of_week, '19:00:00'::time, '20:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah'
UNION ALL
SELECT e.id, 'saturday'::day_of_week, '20:30:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'mikvah';

-- Insert business hours for stores
INSERT INTO business_hours (entity_id, day_of_week, open_time, close_time, is_closed) 
SELECT e.id, 'sunday'::day_of_week, '08:00:00'::time, '20:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store'
UNION ALL
SELECT e.id, 'monday'::day_of_week, '07:00:00'::time, '20:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store'
UNION ALL
SELECT e.id, 'tuesday'::day_of_week, '07:00:00'::time, '20:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store'
UNION ALL
SELECT e.id, 'wednesday'::day_of_week, '07:00:00'::time, '20:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store'
UNION ALL
SELECT e.id, 'thursday'::day_of_week, '07:00:00'::time, '20:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store'
UNION ALL
SELECT e.id, 'friday'::day_of_week, '07:00:00'::time, '15:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store'
UNION ALL
SELECT e.id, 'saturday'::day_of_week, '20:00:00'::time, '23:00:00'::time, false
FROM entities e WHERE e.entity_type = 'store';

-- Insert sample reviews
INSERT INTO reviews (entity_id, user_id, rating, title, content, is_verified) 
SELECT 
    e.id,
    u.id,
    r.rating,
    r.title,
    r.content,
    r.is_verified
FROM entities e
CROSS JOIN users u
CROSS JOIN (VALUES 
    (5, 'Excellent food and service!', 'The food was absolutely delicious and the service was outstanding. Highly recommend this place to anyone looking for authentic kosher cuisine.', true),
    (4, 'Great atmosphere', 'Nice place with good food. The atmosphere is welcoming and the staff is friendly. Will definitely come back.', true),
    (5, 'Perfect for families', 'Great place to bring the whole family. The kids loved it and the food was fresh and tasty.', false),
    (4, 'Good value', 'Good quality food at reasonable prices. The portions are generous and everything tastes fresh.', true),
    (5, 'Highly recommended', 'One of the best kosher restaurants in the area. The food is consistently excellent and the service is top-notch.', true)
) AS r(rating, title, content, is_verified)
WHERE e.entity_type = 'restaurant' 
LIMIT 25;

-- Insert more reviews for synagogues
INSERT INTO reviews (entity_id, user_id, rating, title, content, is_verified) 
SELECT 
    e.id,
    u.id,
    r.rating,
    r.title,
    r.content,
    r.is_verified
FROM entities e
CROSS JOIN users u
CROSS JOIN (VALUES 
    (5, 'Welcoming community', 'The community is very welcoming and the services are meaningful. Great place for families and individuals.', true),
    (4, 'Beautiful services', 'The services are conducted beautifully with meaningful prayers and good music. The rabbi gives excellent sermons.', true),
    (5, 'Great for families', 'Perfect place for families with children. The youth programs are excellent and the community is very supportive.', false),
    (4, 'Good education programs', 'The educational programs are well-structured and the teachers are knowledgeable. Great place to learn and grow.', true)
) AS r(rating, title, content, is_verified)
WHERE e.entity_type = 'synagogue' 
LIMIT 20;

-- Insert reviews for stores
INSERT INTO reviews (entity_id, user_id, rating, title, content, is_verified) 
SELECT 
    e.id,
    u.id,
    r.rating,
    r.title,
    r.content,
    r.is_verified
FROM entities e
CROSS JOIN users u
CROSS JOIN (VALUES 
    (5, 'Fresh and high quality', 'The products are always fresh and of high quality. The staff is knowledgeable about kosher requirements.', true),
    (4, 'Good selection', 'Good selection of kosher products. Sometimes the prices are a bit high but the quality makes it worth it.', true),
    (5, 'Excellent service', 'The staff is very helpful and knowledgeable. They can answer any questions about kosher products.', false),
    (4, 'Convenient location', 'Convenient location with good parking. The store is clean and well-organized.', true)
) AS r(rating, title, content, is_verified)
WHERE e.entity_type = 'store' 
LIMIT 20;

-- Insert sample images
INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://images.unsplash.com/photo-' || (1500000000000 + (random() * 1000000000))::bigint || '?w=800&h=600&fit=crop',
    e.name || ' exterior view',
    true,
    1
FROM entities e
WHERE e.entity_type = 'restaurant';

-- Insert additional images for restaurants
INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://images.unsplash.com/photo-' || (1500000000000 + (random() * 1000000000))::bigint || '?w=800&h=600&fit=crop',
    e.name || ' interior dining area',
    false,
    2
FROM entities e
WHERE e.entity_type = 'restaurant';

-- Insert images for synagogues
INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://images.unsplash.com/photo-' || (1500000000000 + (random() * 1000000000))::bigint || '?w=800&h=600&fit=crop',
    e.name || ' building exterior',
    true,
    1
FROM entities e
WHERE e.entity_type = 'synagogue';

-- Insert images for stores
INSERT INTO images (entity_id, url, alt_text, is_primary, sort_order)
SELECT 
    e.id,
    'https://images.unsplash.com/photo-' || (1500000000000 + (random() * 1000000000))::bigint || '?w=800&h=600&fit=crop',
    e.name || ' store front',
    true,
    1
FROM entities e
WHERE e.entity_type = 'store';

-- Insert some favorites
INSERT INTO favorites (user_id, entity_id)
SELECT 
    u.id,
    e.id
FROM users u
CROSS JOIN entities e
WHERE u.email IN ('user1@example.com', 'user2@example.com')
AND e.entity_type IN ('restaurant', 'synagogue')
ORDER BY random()
LIMIT 10;
