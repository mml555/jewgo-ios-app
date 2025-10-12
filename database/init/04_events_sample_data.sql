-- =============================================================================
-- EVENTS SYSTEM SAMPLE DATA
-- This file populates the events system with realistic sample data
-- Ensures the Events page displays diverse content for testing and demo
-- =============================================================================

BEGIN;

-- =============================================================================
-- EVENT CATEGORIES
-- =============================================================================

INSERT INTO event_categories (key, name, icon_name, description, is_active, sort_order) VALUES
('religious', 'Religious & Spiritual', 'synagogue', 'Religious services, prayers, and spiritual gatherings', true, 1),
('education', 'Education & Workshops', 'book', 'Learning programs, workshops, and educational events', true, 2),
('community', 'Community Events', 'people', 'Social gatherings and community activities', true, 3),
('holidays', 'Holiday Celebrations', 'calendar', 'Jewish holiday events and celebrations', true, 4),
('youth', 'Youth & Family', 'heart', 'Events for children, teens, and families', true, 5),
('cultural', 'Cultural & Arts', 'music', 'Cultural programs, concerts, and arts', true, 6),
('fundraising', 'Fundraising & Charity', 'gift', 'Charity events and fundraising activities', true, 7),
('social', 'Social & Networking', 'chat', 'Social mixers and networking events', true, 8)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- EVENT TYPES
-- =============================================================================

INSERT INTO event_types (key, name, description, is_active, sort_order) VALUES
('service', 'Service', 'Religious services and prayers', true, 1),
('shiur', 'Shiur/Class', 'Torah classes and lectures', true, 2),
('farbrengen', 'Farbrengen', 'Chassidic gatherings and inspiration', true, 3),
('workshop', 'Workshop', 'Interactive learning workshops', true, 4),
('concert', 'Concert', 'Musical performances', true, 5),
('dinner', 'Dinner', 'Community meals and dinners', true, 6),
('gala', 'Gala', 'Formal fundraising events', true, 7),
('lecture', 'Lecture', 'Educational talks and lectures', true, 8),
('social', 'Social', 'Social gatherings', true, 9),
('holiday', 'Holiday', 'Holiday celebrations', true, 10)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- SAMPLE EVENTS
-- Creating diverse events across different categories, dates, and locations
-- =============================================================================

-- Helper: Get category and type IDs
DO $$
DECLARE
    religious_cat_id UUID;
    education_cat_id UUID;
    community_cat_id UUID;
    holidays_cat_id UUID;
    youth_cat_id UUID;
    cultural_cat_id UUID;
    fundraising_cat_id UUID;
    social_cat_id UUID;
    
    service_type_id UUID;
    shiur_type_id UUID;
    farbrengen_type_id UUID;
    workshop_type_id UUID;
    concert_type_id UUID;
    dinner_type_id UUID;
    gala_type_id UUID;
    lecture_type_id UUID;
    social_type_id UUID;
    holiday_type_id UUID;
    
    rabbi_user_id UUID;
    admin_user_id UUID;
    user1_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO religious_cat_id FROM event_categories WHERE key = 'religious';
    SELECT id INTO education_cat_id FROM event_categories WHERE key = 'education';
    SELECT id INTO community_cat_id FROM event_categories WHERE key = 'community';
    SELECT id INTO holidays_cat_id FROM event_categories WHERE key = 'holidays';
    SELECT id INTO youth_cat_id FROM event_categories WHERE key = 'youth';
    SELECT id INTO cultural_cat_id FROM event_categories WHERE key = 'cultural';
    SELECT id INTO fundraising_cat_id FROM event_categories WHERE key = 'fundraising';
    SELECT id INTO social_cat_id FROM event_categories WHERE key = 'social';
    
    -- Get event type IDs
    SELECT id INTO service_type_id FROM event_types WHERE key = 'service';
    SELECT id INTO shiur_type_id FROM event_types WHERE key = 'shiur';
    SELECT id INTO farbrengen_type_id FROM event_types WHERE key = 'farbrengen';
    SELECT id INTO workshop_type_id FROM event_types WHERE key = 'workshop';
    SELECT id INTO concert_type_id FROM event_types WHERE key = 'concert';
    SELECT id INTO dinner_type_id FROM event_types WHERE key = 'dinner';
    SELECT id INTO gala_type_id FROM event_types WHERE key = 'gala';
    SELECT id INTO lecture_type_id FROM event_types WHERE key = 'lecture';
    SELECT id INTO social_type_id FROM event_types WHERE key = 'social';
    SELECT id INTO holiday_type_id FROM event_types WHERE key = 'holiday';
    
    -- Get user IDs
    SELECT id INTO rabbi_user_id FROM users WHERE email = 'rabbi.cohen@example.com' LIMIT 1;
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@jewgo.com' LIMIT 1;
    SELECT id INTO user1_id FROM users WHERE email = 'user1@example.com' LIMIT 1;
    
    -- If no users exist, use first user
    IF rabbi_user_id IS NULL THEN
        SELECT id INTO rabbi_user_id FROM users LIMIT 1;
    END IF;
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users LIMIT 1;
    END IF;
    IF user1_id IS NULL THEN
        SELECT id INTO user1_id FROM users LIMIT 1;
    END IF;

    -- =============================================================================
    -- UPCOMING EVENTS (Next 30 days)
    -- =============================================================================
    
    -- Event 1: Rabbi Paltiel Farbrengen (matches screenshot)
    INSERT INTO events (
        organizer_id, title, description, event_date, event_end_date, timezone,
        zip_code, address, city, state, latitude, longitude, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, contact_phone, cta_link,
        capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        rabbi_user_id,
        'Rabbi Paltiel Farbrengen',
        'Join us for an inspiring farbrengen with Rabbi Paltiel. Experience uplifting stories, chassidic teachings, and joyous singing. Light refreshments will be served.',
        (CURRENT_DATE + INTERVAL '5 days')::timestamptz + TIME '16:30',
        (CURRENT_DATE + INTERVAL '7 days')::timestamptz + TIME '21:00',
        'America/New_York',
        '33110',
        '21345 4th Ave',
        'Brooklyn',
        'NY',
        40.6782,
        -73.9442,
        'Chabad of Brooklyn',
        'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop',
        religious_cat_id,
        farbrengen_type_id,
        '["chassidus", "inspiration", "community"]'::jsonb,
        'Rabbi Menachem Paltiel',
        'rabbi@chabadbrooklyn.org',
        '718-555-0301',
        'https://chabadbrooklyn.org/events/farbrengen',
        150,
        true,
        false,
        'approved'
    );
    
    -- Event 2: Shabbat Services
    INSERT INTO events (
        organizer_id, title, description, event_date, event_end_date, timezone,
        zip_code, address, city, state, latitude, longitude, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, is_rsvp_required, is_paid, status
    ) VALUES (
        rabbi_user_id,
        'Shabbat Morning Services',
        'Weekly Shabbat morning services followed by Kiddush. All are welcome to join us for prayers and community fellowship.',
        (CURRENT_DATE + INTERVAL '2 days')::timestamptz + TIME '09:00',
        (CURRENT_DATE + INTERVAL '2 days')::timestamptz + TIME '12:30',
        'America/New_York',
        '11230',
        '987 Elm St',
        'Brooklyn',
        'NY',
        40.6293,
        -73.9613,
        'Congregation Beth Israel',
        'https://images.unsplash.com/photo-1509515837298-2c67a3933321?w=800&h=600&fit=crop',
        religious_cat_id,
        service_type_id,
        '["shabbat", "prayer", "community"]'::jsonb,
        'Congregation Beth Israel',
        'info@bethisrael.org',
        false,
        false,
        'approved'
    );
    
    -- Event 3: Women's Torah Study
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        admin_user_id,
        'Women''s Torah Study Circle',
        'Weekly women''s Torah study group exploring the Parsha of the week with contemporary insights and discussion.',
        (CURRENT_DATE + INTERVAL '3 days')::timestamptz + TIME '19:00',
        'America/New_York',
        '10023',
        '147 Oak St',
        'Manhattan',
        'NY',
        'Temple Emanuel',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
        education_cat_id,
        shiur_type_id,
        '["women", "torah", "study"]'::jsonb,
        'Rebbetzin Sarah Levine',
        'sarah@templeemanuel.org',
        30,
        true,
        false,
        'approved'
    );
    
    -- Event 4: Community Purim Carnival
    INSERT INTO events (
        organizer_id, title, description, event_date, event_end_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, contact_phone, capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        admin_user_id,
        'Purim Carnival & Megillah Reading',
        'Family-friendly Purim carnival with games, prizes, face painting, and live Megillah reading. Costumes encouraged!',
        (CURRENT_DATE + INTERVAL '10 days')::timestamptz + TIME '15:00',
        (CURRENT_DATE + INTERVAL '10 days')::timestamptz + TIME '19:00',
        'America/New_York',
        '11204',
        '321 Maple Dr',
        'Brooklyn',
        'NY',
        'Jewish Community Center',
        'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
        holidays_cat_id,
        holiday_type_id,
        '["purim", "family", "children", "carnival"]'::jsonb,
        'Brooklyn JCC',
        'events@brooklynjcc.org',
        '718-555-0401',
        200,
        true,
        false,
        'approved'
    );
    
    -- Event 5: Jewish History Lecture
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, payment_amount, status
    ) VALUES (
        admin_user_id,
        'Jewish History Through the Ages',
        'Acclaimed historian Dr. David Weinstein presents a captivating lecture on Jewish history from ancient times to modern Israel.',
        (CURRENT_DATE + INTERVAL '8 days')::timestamptz + TIME '19:30',
        'America/New_York',
        '10001',
        '456 Oak Ave',
        'Manhattan',
        'NY',
        'Jewish Cultural Center',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop',
        education_cat_id,
        lecture_type_id,
        '["history", "education", "culture"]'::jsonb,
        'Dr. David Weinstein',
        'events@jewishcultural.org',
        100,
        true,
        true,
        25.00,
        'approved'
    );
    
    -- Event 6: Kabbalat Shabbat with Live Music
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, is_rsvp_required, is_paid, status
    ) VALUES (
        rabbi_user_id,
        'Kabbalat Shabbat with Live Music',
        'Uplifting Kabbalat Shabbat services featuring live acoustic music. Come early for pre-service socializing.',
        (CURRENT_DATE + INTERVAL '9 days')::timestamptz + TIME '18:00',
        'America/New_York',
        '11218',
        '654 Cedar Ln',
        'Brooklyn',
        'NY',
        'Or Hadash Synagogue',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
        religious_cat_id,
        service_type_id,
        '["shabbat", "music", "prayer"]'::jsonb,
        'Cantor Michael Goldstein',
        'cantor@orhadash.org',
        false,
        false,
        'approved'
    );
    
    -- Event 7: Israeli Cooking Workshop
    INSERT INTO events (
        organizer_id, title, description, event_date, event_end_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, payment_amount, status
    ) VALUES (
        user1_id,
        'Israeli Cooking Workshop: Shakshuka & More',
        'Learn to make authentic Israeli dishes including shakshuka, hummus, and sabich. All ingredients provided.',
        (CURRENT_DATE + INTERVAL '12 days')::timestamptz + TIME '18:30',
        (CURRENT_DATE + INTERVAL '12 days')::timestamptz + TIME '21:00',
        'America/New_York',
        '11201',
        '123 Main St',
        'Brooklyn',
        'NY',
        'Kosher Delight Kitchen',
        'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop',
        education_cat_id,
        workshop_type_id,
        '["cooking", "israeli", "workshop", "food"]'::jsonb,
        'Chef Rachel Cohen',
        'chef@kosherdeli.com',
        25,
        true,
        true,
        45.00,
        'approved'
    );
    
    -- Event 8: Young Professionals Social Mixer
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        admin_user_id,
        'Young Jewish Professionals Networking',
        'Connect with other young Jewish professionals in a relaxed social setting. Complimentary appetizers and drinks.',
        (CURRENT_DATE + INTERVAL '15 days')::timestamptz + TIME '19:00',
        'America/New_York',
        '10001',
        '789 Broadway',
        'Manhattan',
        'NY',
        'Manhattan Social Club',
        'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
        social_cat_id,
        social_type_id,
        '["networking", "young professionals", "social"]'::jsonb,
        'Jewish Professionals Network',
        'info@jewishpro.org',
        75,
        true,
        false,
        'approved'
    );
    
    -- Event 9: Kids Shabbat Program
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        rabbi_user_id,
        'Junior Congregation & Shabbat Party',
        'Age-appropriate Shabbat program for kids ages 4-10. Songs, stories, games, and snacks. Parents can attend services.',
        (CURRENT_DATE + INTERVAL '16 days')::timestamptz + TIME '10:30',
        'America/New_York',
        '11230',
        '987 Elm St',
        'Brooklyn',
        'NY',
        'Congregation Beth Israel - Youth Wing',
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop',
        youth_cat_id,
        service_type_id,
        '["children", "shabbat", "youth"]'::jsonb,
        'Morah Debbie Schwartz',
        'youth@bethisrael.org',
        40,
        true,
        false,
        'approved'
    );
    
    -- Event 10: Klezmer Concert
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, contact_phone, capacity, is_rsvp_required, is_paid, payment_amount, status
    ) VALUES (
        admin_user_id,
        'Klezmer Band Live Performance',
        'Enjoy an evening of traditional and contemporary klezmer music performed by the acclaimed New York Klezmer Band.',
        (CURRENT_DATE + INTERVAL '20 days')::timestamptz + TIME '20:00',
        'America/New_York',
        '10023',
        '147 Oak St',
        'Manhattan',
        'NY',
        'Temple Emanuel Concert Hall',
        'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop',
        cultural_cat_id,
        concert_type_id,
        '["music", "klezmer", "concert", "culture"]'::jsonb,
        'NY Klezmer Band',
        'booking@nyklezmer.com',
        '212-555-0501',
        250,
        true,
        true,
        35.00,
        'approved'
    );
    
    -- Event 11: Charity Gala Dinner
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, contact_phone, cta_link, capacity, is_rsvp_required, is_paid, payment_amount, is_nonprofit, status
    ) VALUES (
        admin_user_id,
        'Annual Charity Gala: Building Tomorrow',
        'Join us for our annual charity gala supporting local Jewish education. Gourmet dinner, silent auction, and entertainment.',
        (CURRENT_DATE + INTERVAL '25 days')::timestamptz + TIME '18:30',
        'America/New_York',
        '11201',
        '500 Grand Avenue',
        'Brooklyn',
        'NY',
        'Brooklyn Convention Center',
        'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
        fundraising_cat_id,
        gala_type_id,
        '["fundraising", "charity", "gala", "formal"]'::jsonb,
        'Jewish Education Foundation',
        'gala@jedfoundation.org',
        '718-555-0601',
        'https://jedfoundation.org/gala',
        300,
        true,
        true,
        150.00,
        true,
        'approved'
    );
    
    -- Event 12: Beginners Hebrew Class
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, payment_amount, status
    ) VALUES (
        admin_user_id,
        'Beginners Hebrew: 6-Week Course',
        'Learn to read Hebrew in just 6 weeks! Perfect for adults with no prior knowledge. Includes workbook and materials.',
        (CURRENT_DATE + INTERVAL '6 days')::timestamptz + TIME '19:00',
        'America/New_York',
        '10001',
        '456 Oak Ave',
        'Manhattan',
        'NY',
        'Jewish Learning Center',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
        education_cat_id,
        shiur_type_id,
        '["hebrew", "education", "language", "beginner"]'::jsonb,
        'Morah Tamar Rosen',
        'hebrew@jlc.org',
        20,
        true,
        true,
        180.00,
        'approved'
    );

    -- Event 13: Family Game Night
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        user1_id,
        'Family Board Game Night',
        'Bring the whole family for an evening of board games, snacks, and fun. Games provided or bring your own favorite!',
        (CURRENT_DATE + INTERVAL '7 days')::timestamptz + TIME '17:00',
        'America/New_York',
        '11204',
        '321 Maple Dr',
        'Brooklyn',
        'NY',
        'Brooklyn JCC Game Room',
        'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800&h=600&fit=crop',
        youth_cat_id,
        social_type_id,
        '["family", "games", "children", "fun"]'::jsonb,
        'Brooklyn JCC',
        'family@brooklynjcc.org',
        50,
        true,
        false,
        'approved'
    );

    -- Event 14: Talmud Study Group
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, is_rsvp_required, is_paid, status
    ) VALUES (
        rabbi_user_id,
        'Weekly Talmud Study - Daf Yomi',
        'Join our Daf Yomi study group. All levels welcome, from beginners to advanced scholars.',
        (CURRENT_DATE + INTERVAL '1 day')::timestamptz + TIME '06:30',
        'America/New_York',
        '11230',
        '987 Elm St',
        'Brooklyn',
        'NY',
        'Congregation Beth Israel Study Hall',
        'https://images.unsplash.com/photo-1476357471311-43c0db9fb2b4?w=800&h=600&fit=crop',
        education_cat_id,
        shiur_type_id,
        '["talmud", "daf yomi", "study", "torah"]'::jsonb,
        'Rabbi David Cohen',
        'rabbi@bethisrael.org',
        false,
        false,
        'approved'
    );

    -- Event 15: Passover Prep Workshop
    INSERT INTO events (
        organizer_id, title, description, event_date, timezone,
        zip_code, address, city, state, venue_name,
        flyer_url, category_id, event_type_id, tags, host,
        contact_email, capacity, is_rsvp_required, is_paid, status
    ) VALUES (
        admin_user_id,
        'Passover Preparation Workshop',
        'Everything you need to know about preparing for Passover. Topics include cleaning, kashering, and cooking.',
        (CURRENT_DATE + INTERVAL '14 days')::timestamptz + TIME '10:00',
        'America/New_York',
        '11218',
        '654 Cedar Ln',
        'Brooklyn',
        'NY',
        'Or Hadash Community Room',
        'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
        education_cat_id,
        workshop_type_id,
        '["passover", "pesach", "workshop", "holiday"]'::jsonb,
        'Rebbetzin Miriam Goldstein',
        'rebbetzin@orhadash.org',
        40,
        true,
        false,
        'approved'
    );

END $$;

-- =============================================================================
-- ADD SOME RSVPS TO EVENTS
-- =============================================================================

-- Add RSVPs to show events with activity
INSERT INTO event_rsvps (event_id, user_id, status, guest_count, attendee_name, attendee_email, registered_at)
SELECT 
    e.id,
    u.id,
    'confirmed',
    CASE WHEN random() > 0.7 THEN 2 ELSE 1 END,
    u.first_name || ' ' || u.last_name,
    u.email,
    e.created_at + (random() * (NOW() - e.created_at))
FROM events e
CROSS JOIN LATERAL (
    SELECT id, first_name, last_name, email
    FROM users
    WHERE id != e.organizer_id
    ORDER BY random()
    LIMIT CASE WHEN e.capacity IS NOT NULL THEN LEAST(3, e.capacity) ELSE 3 END
) u
WHERE e.is_rsvp_required = true
LIMIT 20;

-- Update RSVP counts
UPDATE events SET rsvp_count = (
    SELECT COALESCE(SUM(guest_count), 0)
    FROM event_rsvps
    WHERE event_rsvps.event_id = events.id
    AND status = 'confirmed'
);

-- =============================================================================
-- ADD EVENT ANALYTICS (Views)
-- =============================================================================

INSERT INTO event_analytics (event_id, metric_type, user_id, ip_address, user_agent, created_at)
SELECT 
    e.id,
    'view',
    u.id,
    ('192.168.' || floor(random() * 255)::int || '.' || floor(random() * 255)::int)::inet,
    CASE floor(random() * 2)
        WHEN 0 THEN 'JewgoApp/1.0 (iOS)'
        ELSE 'JewgoApp/1.0 (Android)'
    END,
    e.created_at + (random() * (NOW() - e.created_at))
FROM events e
CROSS JOIN LATERAL (
    SELECT id
    FROM users
    ORDER BY random()
    LIMIT floor(random() * 50 + 10)::int
) u
LIMIT 200;

-- Update view counts
UPDATE events SET view_count = (
    SELECT COUNT(*)
    FROM event_analytics
    WHERE event_analytics.event_id = events.id
    AND metric_type = 'view'
);

COMMIT;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Show summary of created data
DO $$
DECLARE
    total_events INTEGER;
    upcoming_events INTEGER;
    free_events INTEGER;
    paid_events INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_events FROM events;
    SELECT COUNT(*) INTO upcoming_events FROM events WHERE event_date > NOW();
    SELECT COUNT(*) INTO free_events FROM events WHERE is_paid = false;
    SELECT COUNT(*) INTO paid_events FROM events WHERE is_paid = true;
    
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Events Sample Data Created Successfully!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Total Events: %', total_events;
    RAISE NOTICE 'Upcoming Events: %', upcoming_events;
    RAISE NOTICE 'Free Events: %', free_events;
    RAISE NOTICE 'Paid Events: %', paid_events;
    RAISE NOTICE '===========================================';
END $$;
