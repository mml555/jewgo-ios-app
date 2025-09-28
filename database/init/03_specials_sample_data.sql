-- Sample Specials Data for Enhanced Schema
-- Date: 2025-01-19
-- Description: Realistic sample specials data with proper relationships

-- =============================================================================
-- SAMPLE SPECIALS DATA
-- =============================================================================

INSERT INTO specials (
    business_id, title, subtitle, description, discount_type, discount_value, 
    discount_label, valid_from, valid_until, max_claims_total, max_claims_per_user,
    priority, requires_code, code_hint, terms, hero_image_url, created_by
) VALUES 

-- Special 1: Kosher Delight - 20% Off Deli
(
    (SELECT id FROM entities WHERE name = 'Kosher Delight'),
    '20% Off Kosher Deli',
    'Get 20% off your next meal',
    'Get 20% off your next meal at Kosher Delight & Market. Valid until end of month. Perfect for trying our famous pastrami sandwich or our daily soup specials.',
    'percentage',
    20.00,
    '20% OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-03-31T23:59:59Z'::timestamptz,
    100,
    1,
    10,
    false,
    null,
    'Cannot be combined with other offers. Valid for dine-in only. Excludes alcohol.',
    'https://picsum.photos/400/300?random=101',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com')
),

-- Special 2: Kosher Delight - BOGO Sandwich
(
    (SELECT id FROM entities WHERE name = 'Kosher Delight'),
    'BOGO Sandwich Deal',
    'Buy one, get one free!',
    'Order any deli sandwich and get a second one absolutely free! Perfect for sharing or taking home for later. Our sandwiches are made with the freshest kosher ingredients.',
    'bogo',
    100.00,
    'BOGO',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-02-28T23:59:59Z'::timestamptz,
    50,
    1,
    5,
    false,
    null,
    'Valid for deli sandwiches only. Cannot be combined with other offers.',
    'https://picsum.photos/400/300?random=102',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com')
),

-- Special 3: Jerusalem Grill - Free Appetizer
(
    (SELECT id FROM entities WHERE name = 'Jerusalem Grill'),
    'Free Hummus with Entree',
    'Start your meal right!',
    'Get a free order of our famous hummus with any entree purchase. Made fresh daily with traditional Israeli spices and served with warm pita bread.',
    'free_item',
    0.00,
    'FREE HUMMUS',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-02-15T23:59:59Z'::timestamptz,
    200,
    1,
    8,
    false,
    null,
    'Valid with any entree purchase. Dine-in only.',
    'https://picsum.photos/400/300?random=103',
    (SELECT id FROM users WHERE email = 'chef@jerusalemgrill.com')
),

-- Special 4: Jerusalem Grill - Family Meal Deal
(
    (SELECT id FROM entities WHERE name = 'Jerusalem Grill'),
    '$15 Off Family Meal',
    'Perfect for families!',
    'Get $15 off any family meal package. Includes appetizer, main course, side dishes, and dessert for 4 people. Great for Shabbat dinner or special occasions.',
    'fixed_amount',
    15.00,
    '$15 OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-04-30T23:59:59Z'::timestamptz,
    75,
    1,
    7,
    true,
    'FAMILY15',
    'Minimum order $75. Must mention code at ordering. Valid for family meal packages only.',
    'https://picsum.photos/400/300?random=104',
    (SELECT id FROM users WHERE email = 'chef@jerusalemgrill.com')
),

-- Special 5: Brooklyn Bagel Co. - Coffee & Bagel Combo
(
    (SELECT id FROM entities WHERE name = 'Brooklyn Bagel Co.'),
    'Coffee & Bagel Combo',
    'Perfect morning combo',
    'Get any coffee with a fresh bagel for just $6. Available all day, but perfect for breakfast or lunch. Our bagels are baked fresh every morning.',
    'fixed_amount',
    2.00,
    '$2 OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-01-31T23:59:59Z'::timestamptz,
    120,
    2,
    6,
    false,
    null,
    'Valid Monday-Friday 6AM-3PM only. Cannot be combined with other offers.',
    'https://picsum.photos/400/300?random=105',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com')
),

-- Special 6: Brooklyn Bagel Co. - Weekend Brunch Special
(
    (SELECT id FROM entities WHERE name = 'Brooklyn Bagel Co.'),
    'Weekend Brunch Special',
    'Saturday & Sunday only',
    'Special weekend brunch menu with 25% off all brunch items. Includes bagels, lox, cream cheese, and specialty coffee drinks.',
    'percentage',
    25.00,
    '25% OFF BRUNCH',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-03-31T23:59:59Z'::timestamptz,
    80,
    1,
    4,
    false,
    null,
    'Valid Saturday-Sunday 8AM-2PM only. Brunch menu items only.',
    'https://picsum.photos/400/300?random=106',
    (SELECT id FROM users WHERE email = 'owner@kosherdeli.com')
);

-- =============================================================================
-- SAMPLE SPECIAL MEDIA
-- =============================================================================

-- Add multiple images for Kosher Delight specials
INSERT INTO special_media (special_id, url, alt_text, position) VALUES
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    'https://picsum.photos/400/300?random=201',
    'Kosher Delight deli counter',
    1
),
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    'https://picsum.photos/400/300?random=202',
    'Fresh pastrami sandwich',
    2
),
(
    (SELECT id FROM specials WHERE title = 'BOGO Sandwich Deal'),
    'https://picsum.photos/400/300?random=203',
    'Delicious deli sandwiches',
    1
),
(
    (SELECT id FROM specials WHERE title = 'Free Hummus with Entree'),
    'https://picsum.photos/400/300?random=204',
    'Fresh hummus and pita',
    1
),
(
    (SELECT id FROM specials WHERE title = 'Free Hummus with Entree'),
    'https://picsum.photos/400/300?random=205',
    'Jerusalem Grill interior',
    2
),
(
    (SELECT id FROM specials WHERE title = '$15 Off Family Meal'),
    'https://picsum.photos/400/300?random=206',
    'Family meal spread',
    1
);

-- =============================================================================
-- SAMPLE SPECIAL CLAIMS
-- =============================================================================

-- Add some sample claims to show the system working
INSERT INTO special_claims (special_id, user_id, claimed_at, ip_address, user_agent, status) VALUES
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    (SELECT id FROM users WHERE email = 'user1@example.com'),
    '2025-01-15T12:30:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)',
    'claimed'
),
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    (SELECT id FROM users WHERE email = 'user2@example.com'),
    '2025-01-16T14:45:00Z'::timestamptz,
    '192.168.1.101'::inet,
    'JewgoApp/1.0 (Android)',
    'redeemed'
),
(
    (SELECT id FROM specials WHERE title = 'Free Hummus with Entree'),
    (SELECT id FROM users WHERE email = 'user1@example.com'),
    '2025-01-17T19:20:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)',
    'claimed'
),
(
    (SELECT id FROM specials WHERE title = 'Coffee & Bagel Combo'),
    (SELECT id FROM users WHERE email = 'user2@example.com'),
    '2025-01-18T08:15:00Z'::timestamptz,
    '192.168.1.101'::inet,
    'JewgoApp/1.0 (Android)',
    'claimed'
);

-- =============================================================================
-- SAMPLE SPECIAL EVENTS (Analytics)
-- =============================================================================

-- Add some view and click events for analytics
INSERT INTO special_events (special_id, user_id, event_type, occurred_at, ip_address, user_agent) VALUES
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    (SELECT id FROM users WHERE email = 'user1@example.com'),
    'view',
    '2025-01-15T12:25:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)'
),
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    (SELECT id FROM users WHERE email = 'user1@example.com'),
    'click',
    '2025-01-15T12:28:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)'
),
(
    (SELECT id FROM specials WHERE title = 'Free Hummus with Entree'),
    (SELECT id FROM users WHERE email = 'user2@example.com'),
    'view',
    '2025-01-16T18:30:00Z'::timestamptz,
    '192.168.1.101'::inet,
    'JewgoApp/1.0 (Android)'
),
(
    (SELECT id FROM specials WHERE title = 'Coffee & Bagel Combo'),
    (SELECT id FROM users WHERE email = 'user1@example.com'),
    'view',
    '2025-01-17T07:45:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)'
),
(
    (SELECT id FROM specials WHERE title = 'Coffee & Bagel Combo'),
    (SELECT id FROM users WHERE email = 'user2@example.com'),
    'view',
    '2025-01-18T08:10:00Z'::timestamptz,
    '192.168.1.101'::inet,
    'JewgoApp/1.0 (Android)'
),
(
    (SELECT id FROM specials WHERE title = 'Coffee & Bagel Combo'),
    (SELECT id FROM users WHERE email = 'user2@example.com'),
    'click',
    '2025-01-18T08:12:00Z'::timestamptz,
    '192.168.1.101'::inet,
    'JewgoApp/1.0 (Android)'
);

-- =============================================================================
-- INITIALIZE MATERIALIZED VIEWS
-- =============================================================================

-- Refresh the materialized views with the new data
REFRESH MATERIALIZED VIEW mv_active_specials;
REFRESH MATERIALIZED VIEW mv_restaurants_with_specials;

COMMIT;
