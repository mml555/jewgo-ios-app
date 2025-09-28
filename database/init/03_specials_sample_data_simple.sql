-- Simple Sample Specials Data for Enhanced Schema
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
    '1d54b621-ccbc-4c18-b86c-5158c0a996a1', -- Kosher Delight ID
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
    (SELECT id FROM users LIMIT 1)
),

-- Special 2: Jerusalem Grill - Free Appetizer
(
    '41ee990e-f672-4767-895d-d9081ae1ae62', -- Jerusalem Grill ID
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
    (SELECT id FROM users LIMIT 1)
),

-- Special 3: Test Restaurant - Family Meal Deal
(
    'ad0e852b-1c4d-423f-9883-a44438f7d284', -- Test Restaurant ID
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
    (SELECT id FROM users LIMIT 1)
);

-- =============================================================================
-- SAMPLE SPECIAL MEDIA
-- =============================================================================

-- Add multiple images for specials
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
    (SELECT id FROM users LIMIT 1),
    '2025-01-15T12:30:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)',
    'claimed'
),
(
    (SELECT id FROM specials WHERE title = 'Free Hummus with Entree'),
    (SELECT id FROM users LIMIT 1),
    '2025-01-17T19:20:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)',
    'claimed'
);

-- =============================================================================
-- SAMPLE SPECIAL EVENTS (Analytics)
-- =============================================================================

-- Add some view and click events for analytics
INSERT INTO special_events (special_id, user_id, event_type, occurred_at, ip_address, user_agent) VALUES
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    (SELECT id FROM users LIMIT 1),
    'view',
    '2025-01-15T12:25:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)'
),
(
    (SELECT id FROM specials WHERE title = '20% Off Kosher Deli'),
    (SELECT id FROM users LIMIT 1),
    'click',
    '2025-01-15T12:28:00Z'::timestamptz,
    '192.168.1.100'::inet,
    'JewgoApp/1.0 (iOS)'
),
(
    (SELECT id FROM specials WHERE title = 'Free Hummus with Entree'),
    (SELECT id FROM users LIMIT 1),
    'view',
    '2025-01-16T18:30:00Z'::timestamptz,
    '192.168.1.101'::inet,
    'JewgoApp/1.0 (Android)'
);

COMMIT;
