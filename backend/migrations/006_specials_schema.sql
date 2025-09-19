-- Migration: Add specials schema and sample data
-- Date: 2025-01-19
-- Description: Create specials tables with proper schema and add 10 sample specials

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for specials
CREATE TYPE discount_kind AS ENUM ('percentage', 'fixed_amount', 'bogo', 'free_item', 'other');
CREATE TYPE claim_status AS ENUM ('claimed', 'redeemed', 'expired', 'cancelled', 'revoked');

-- Create specials table
CREATE TABLE IF NOT EXISTS specials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    
    -- Discount Information
    discount_type discount_kind NOT NULL,
    discount_value NUMERIC(10,2), -- percentage or amount
    discount_label VARCHAR(100) NOT NULL, -- Display text like "20% OFF"
    
    -- Validity Period
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    
    -- Limits and Status
    max_claims_total INTEGER, -- hard cap on total claims
    max_claims_per_user INTEGER DEFAULT 1, -- rate limit per user
    per_visit BOOLEAN DEFAULT FALSE, -- allow repeat per day/visit
    is_active BOOLEAN DEFAULT true,
    
    -- Terms and Conditions
    requires_code BOOLEAN DEFAULT FALSE,
    code_hint VARCHAR(100),
    terms TEXT,
    
    -- Media
    hero_image_url TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT ck_valid_window CHECK (valid_until > valid_from),
    CONSTRAINT ck_discount_value CHECK (
        (discount_type <> 'percentage') OR (discount_value IS NULL OR (discount_value > 0 AND discount_value <= 100))
    )
);

-- Create special media table
CREATE TABLE IF NOT EXISTS special_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create special claims table
CREATE TABLE IF NOT EXISTS special_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    status claim_status NOT NULL DEFAULT 'claimed',
    redeemed_at TIMESTAMPTZ,
    redeemed_by UUID REFERENCES users(id), -- business staff
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,
    
    -- Ensure either user_id or guest_session_id is provided
    CONSTRAINT ck_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

-- Create special events table for analytics
CREATE TABLE IF NOT EXISTS special_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    special_id UUID NOT NULL REFERENCES specials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'share', 'click', 'claim')),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address INET,
    user_agent TEXT,
    
    -- Ensure either user_id or guest_session_id is provided
    CONSTRAINT ck_ev_user_or_guest CHECK (
        (user_id IS NOT NULL AND guest_session_id IS NULL) OR 
        (user_id IS NULL AND guest_session_id IS NOT NULL)
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_specials_business_id ON specials(business_id);
CREATE INDEX IF NOT EXISTS idx_specials_active_window ON specials(valid_from, valid_until) INCLUDE (is_active);
CREATE INDEX IF NOT EXISTS idx_specials_is_active ON specials(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_specials_created_at ON specials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_specials_valid_until ON specials(valid_until ASC);

CREATE INDEX IF NOT EXISTS idx_special_media_special_id ON special_media(special_id);
CREATE INDEX IF NOT EXISTS idx_special_media_position ON special_media(special_id, position);

-- One active claim per user per special (unless per_visit is true)
CREATE UNIQUE INDEX IF NOT EXISTS uq_special_claim_once ON special_claims(special_id, user_id) 
    WHERE user_id IS NOT NULL AND status IN ('claimed', 'redeemed');

CREATE INDEX IF NOT EXISTS idx_special_claims_special_id ON special_claims(special_id);
CREATE INDEX IF NOT EXISTS idx_special_claims_user_id ON special_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_special_claims_status ON special_claims(status);
CREATE INDEX IF NOT EXISTS idx_special_claims_claimed_at ON special_claims(claimed_at DESC);

CREATE INDEX IF NOT EXISTS idx_special_events_special_id ON special_events(special_id);
CREATE INDEX IF NOT EXISTS idx_special_events_user_id ON special_events(user_id);
CREATE INDEX IF NOT EXISTS idx_special_events_type_time ON special_events(special_id, event_type, occurred_at DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER trigger_update_specials_updated_at
    BEFORE UPDATE ON specials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update claim counts (for analytics)
CREATE OR REPLACE FUNCTION update_specials_claim_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment view count for claim events
        INSERT INTO special_events (special_id, user_id, guest_session_id, event_type, ip_address, user_agent)
        VALUES (NEW.special_id, NEW.user_id, NEW.guest_session_id, 'claim', NEW.ip_address, NEW.user_agent);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for claim count updates
CREATE TRIGGER trigger_update_specials_claim_count
    AFTER INSERT ON special_claims
    FOR EACH ROW EXECUTE FUNCTION update_specials_claim_count();

-- Insert 10 sample specials
INSERT INTO specials (
    business_id, title, subtitle, description, discount_type, discount_value, 
    discount_label, valid_from, valid_until, max_claims_total, terms, 
    hero_image_url, created_by
) VALUES 
-- Special 1: Kosher Deli
(
    (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1),
    '20% Off Kosher Deli',
    'Get 20% off your next meal',
    'Get 20% off your next meal at Kosher Deli & Market. Valid until end of month.',
    'percentage',
    20.00,
    '20% OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-03-31T23:59:59Z'::timestamptz,
    100,
    'Cannot be combined with other offers. Valid for dine-in only.',
    'https://picsum.photos/400/300?random=1',
    (SELECT id FROM users LIMIT 1)
),
-- Special 2: Pizza Deal
(
    (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 1),
    'BOGO Pizza Deal',
    'Buy one, get one free!',
    'Order any large pizza and get a second one absolutely free! Perfect for families.',
    'bogo',
    100.00,
    'BOGO',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-02-28T23:59:59Z'::timestamptz,
    50,
    'Valid for large pizzas only. Toppings may vary.',
    'https://picsum.photos/400/300?random=2',
    (SELECT id FROM users LIMIT 1)
),
-- Special 3: Free Bagel
(
    (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 2),
    'Free Bagel + Coffee',
    'Start your morning right!',
    'Get a free bagel with any coffee purchase.',
    'free_item',
    0.00,
    'FREE BAGEL',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-02-15T23:59:59Z'::timestamptz,
    200,
    'Valid Monday-Friday 6AM-11AM only.',
    'https://picsum.photos/400/300?random=3',
    (SELECT id FROM users LIMIT 1)
),
-- Special 4: Catering Deal
(
    (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 3),
    '$10 Off Catering',
    'Planning an event?',
    'Get $10 off any catering order over $100.',
    'fixed_amount',
    10.00,
    '$10 OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-04-30T23:59:59Z'::timestamptz,
    75,
    'Minimum order $100. Must book 48 hours in advance.',
    'https://picsum.photos/400/300?random=4',
    (SELECT id FROM users LIMIT 1)
),
-- Special 5: Shabbat Catering
(
    (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 4),
    'Shabbat Catering Deal',
    'Complete Shabbat meals',
    'Complete Shabbat meals for families. Order by Thursday!',
    'percentage',
    15.00,
    '15% OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-03-31T23:59:59Z'::timestamptz,
    40,
    'Order by Thursday 5PM for weekend delivery.',
    'https://picsum.photos/400/300?random=5',
    (SELECT id FROM users LIMIT 1)
),
-- Special 6: Synagogue Event
(
    (SELECT id FROM entities WHERE entity_type = 'synagogue' LIMIT 1),
    'Community Shabbat Dinner',
    'Join us for Friday night',
    'Special community Shabbat dinner with reduced pricing for families.',
    'fixed_amount',
    5.00,
    '$5 OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-02-28T23:59:59Z'::timestamptz,
    150,
    'Advance registration required. Children under 12 free.',
    'https://picsum.photos/400/300?random=6',
    (SELECT id FROM users LIMIT 1)
),
-- Special 7: Store Discount
(
    (SELECT id FROM entities WHERE entity_type = 'store' LIMIT 1),
    'Grocery Store Sale',
    'Fresh produce special',
    'Get 25% off all fresh produce and kosher meat.',
    'percentage',
    25.00,
    '25% OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-02-14T23:59:59Z'::timestamptz,
    300,
    'Valid on fresh produce and kosher meat only. Cannot be combined with other offers.',
    'https://picsum.photos/400/300?random=7',
    (SELECT id FROM users LIMIT 1)
),
-- Special 8: Mikvah Service
(
    (SELECT id FROM entities WHERE entity_type = 'mikvah' LIMIT 1),
    'New Member Special',
    'Welcome to the community',
    'Free mikvah service for new community members.',
    'free_item',
    0.00,
    'FREE SERVICE',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-06-30T23:59:59Z'::timestamptz,
    50,
    'For new community members only. Valid for first 6 months of membership.',
    'https://picsum.photos/400/300?random=8',
    (SELECT id FROM users LIMIT 1)
),
-- Special 9: Restaurant Lunch
(
    (SELECT id FROM entities WHERE entity_type = 'restaurant' LIMIT 1 OFFSET 5),
    'Lunch Special Combo',
    'Perfect midday meal',
    'Any sandwich combo with soup or salad for just $12.',
    'fixed_amount',
    3.00,
    '$3 OFF',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-01-31T23:59:59Z'::timestamptz,
    120,
    'Valid Monday-Friday 11AM-3PM only.',
    'https://picsum.photos/400/300?random=9',
    (SELECT id FROM users LIMIT 1)
),
-- Special 10: Store Membership
(
    (SELECT id FROM entities WHERE entity_type = 'store' LIMIT 1 OFFSET 1),
    'Loyalty Program Bonus',
    'Earn extra points',
    'Double loyalty points on all purchases this month.',
    'other',
    0.00,
    '2X POINTS',
    '2025-01-01T00:00:00Z'::timestamptz,
    '2025-01-31T23:59:59Z'::timestamptz,
    500,
    'Valid for existing loyalty program members. Points will be added automatically.',
    'https://picsum.photos/400/300?random=10',
    (SELECT id FROM users LIMIT 1)
);

-- Add some sample media for the specials
INSERT INTO special_media (special_id, url, alt_text, position) VALUES
((SELECT id FROM specials LIMIT 1), 'https://picsum.photos/400/300?random=11', 'Kosher Deli Interior', 1),
((SELECT id FROM specials LIMIT 1), 'https://picsum.photos/400/300?random=12', 'Kosher Deli Food', 2),
((SELECT id FROM specials LIMIT 1 OFFSET 1), 'https://picsum.photos/400/300?random=13', 'Pizza Display', 1),
((SELECT id FROM specials LIMIT 1 OFFSET 1), 'https://picsum.photos/400/300?random=14', 'Pizza Making', 2),
((SELECT id FROM specials LIMIT 1 OFFSET 2), 'https://picsum.photos/400/300?random=15', 'Coffee Shop', 1),
((SELECT id FROM specials LIMIT 1 OFFSET 2), 'https://picsum.photos/400/300?random=16', 'Fresh Bagels', 2);

-- Add some sample events for analytics
INSERT INTO special_events (special_id, guest_session_id, event_type, ip_address, user_agent) VALUES
((SELECT id FROM specials LIMIT 1), (SELECT id FROM guest_sessions LIMIT 1), 'view', '127.0.0.1'::inet, 'JewgoApp/1.0'),
((SELECT id FROM specials LIMIT 1), (SELECT id FROM guest_sessions LIMIT 1), 'view', '127.0.0.1'::inet, 'JewgoApp/1.0'),
((SELECT id FROM specials LIMIT 1 OFFSET 1), (SELECT id FROM guest_sessions LIMIT 1), 'view', '127.0.0.1'::inet, 'JewgoApp/1.0'),
((SELECT id FROM specials LIMIT 1 OFFSET 2), (SELECT id FROM guest_sessions LIMIT 1), 'view', '127.0.0.1'::inet, 'JewgoApp/1.0'),
((SELECT id FROM specials LIMIT 1 OFFSET 3), (SELECT id FROM guest_sessions LIMIT 1), 'view', '127.0.0.1'::inet, 'JewgoApp/1.0');

COMMIT;
