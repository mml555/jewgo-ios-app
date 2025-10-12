-- Quick script to update event images to working Unsplash URLs
-- Run this to fix image loading without resetting all data

BEGIN;

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop'
WHERE title = 'Rabbi Paltiel Farbrengen';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1509515837298-2c67a3933321?w=800&h=600&fit=crop'
WHERE title = 'Shabbat Morning Services';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop'
WHERE title = 'Women''s Torah Study Circle';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop'
WHERE title = 'Purim Carnival & Megillah Reading';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop'
WHERE title = 'Jewish History Through the Ages';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
WHERE title = 'Kabbalat Shabbat with Live Music';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop'
WHERE title = 'Israeli Cooking Workshop: Shakshuka & More';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop'
WHERE title = 'Young Jewish Professionals Networking';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&h=600&fit=crop'
WHERE title = 'Junior Congregation & Shabbat Party';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop'
WHERE title = 'Klezmer Band Live Performance';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop'
WHERE title = 'Annual Charity Gala: Building Tomorrow';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop'
WHERE title = 'Beginners Hebrew: 6-Week Course';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1606503153255-59d7c15ea31e?w=800&h=600&fit=crop'
WHERE title = 'Family Board Game Night';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1476357471311-43c0db9fb2b4?w=800&h=600&fit=crop'
WHERE title = 'Weekly Talmud Study - Daf Yomi';

UPDATE events SET flyer_url = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'
WHERE title = 'Passover Preparation Workshop';

COMMIT;

-- Verify the updates
SELECT title, flyer_url FROM events ORDER BY event_date;

