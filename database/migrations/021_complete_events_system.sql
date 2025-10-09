-- Complete Events System Migration
-- This migration creates the complete events system with flyer upload, RSVP, and payment integration

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

-- Event Categories
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Types
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic Information
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Date & Time
    event_date TIMESTAMPTZ NOT NULL,
    event_end_date TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Location
    zip_code VARCHAR(10) NOT NULL,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    venue_name VARCHAR(255),
    
    -- Flyer (MUST be 8.5x11" portrait - 0.773 aspect ratio)
    flyer_url VARCHAR(500) NOT NULL,
    flyer_width INTEGER, -- for validation
    flyer_height INTEGER, -- for validation
    flyer_aspect_ratio DECIMAL(5, 3), -- should be ~0.773
    flyer_thumbnail_url VARCHAR(500),
    flyer_file_size INTEGER, -- in bytes
    
    -- Categorization
    category_id UUID REFERENCES event_categories(id),
    event_type_id UUID REFERENCES event_types(id),
    tags JSONB DEFAULT '[]',
    
    -- Event Details
    host VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    cta_link VARCHAR(500), -- RSVP, tickets, registration URL
    
    -- RSVP & Capacity
    capacity INTEGER,
    is_rsvp_required BOOLEAN DEFAULT FALSE,
    rsvp_count INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    
    -- Sponsorship
    is_sponsorship_available BOOLEAN DEFAULT FALSE,
    sponsorship_details TEXT,
    sponsor_contact_email VARCHAR(255),
    
    -- Monetization & Payment
    is_nonprofit BOOLEAN DEFAULT FALSE,
    nonprofit_approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    nonprofit_approval_notes TEXT,
    nonprofit_approved_by UUID REFERENCES users(id),
    nonprofit_approved_at TIMESTAMPTZ,
    
    is_paid BOOLEAN DEFAULT FALSE, -- true if this event required payment
    payment_amount INTEGER DEFAULT 999, -- $9.99 in cents
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    payment_completed_at TIMESTAMPTZ,
    
    -- Status & Moderation
    status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected', 'active', 'cancelled', 'completed'
    moderation_notes TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0, -- CTA clicks
    share_count INTEGER DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    
    -- Constraints
    CONSTRAINT valid_event_dates CHECK (event_end_date IS NULL OR event_end_date >= event_date),
    CONSTRAINT valid_flyer_aspect_ratio CHECK (flyer_aspect_ratio IS NULL OR (flyer_aspect_ratio >= 0.70 AND flyer_aspect_ratio <= 0.85)),
    CONSTRAINT valid_capacity CHECK (capacity IS NULL OR capacity > 0)
);

-- ============================================================================
-- EVENT RSVPS
-- ============================================================================

CREATE TABLE event_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- RSVP Details
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'waitlisted', 'attended', 'no_show', 'cancelled'
    guest_count INTEGER DEFAULT 1,
    guest_names JSONB DEFAULT '[]',
    
    -- Contact
    attendee_name VARCHAR(255),
    attendee_email VARCHAR(255),
    attendee_phone VARCHAR(20),
    
    -- Notes
    notes TEXT,
    dietary_restrictions TEXT,
    special_requests TEXT,
    
    -- Timeline
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    checked_in_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(event_id, user_id),
    CONSTRAINT valid_guest_count CHECK (guest_count > 0)
);

-- ============================================================================
-- EVENT WAITLIST
-- ============================================================================

CREATE TABLE event_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Waitlist Details
    position INTEGER,
    guest_count INTEGER DEFAULT 1,
    notes TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'notified', 'converted', 'expired', 'cancelled'
    notified_at TIMESTAMPTZ,
    converted_to_rsvp_at TIMESTAMPTZ,
    
    -- Timeline
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(event_id, user_id)
);

-- ============================================================================
-- EVENT ANALYTICS
-- ============================================================================

CREATE TABLE event_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Metric Type
    metric_type VARCHAR(50) NOT NULL, -- 'view', 'rsvp', 'cta_click', 'share', 'flyer_download'
    
    -- User Info (optional for anonymous tracking)
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    
    -- Request Info
    ip_address INET,
    user_agent TEXT,
    referrer VARCHAR(500),
    device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop'
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EVENT PAYMENTS
-- ============================================================================

CREATE TABLE event_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Payment Details
    amount INTEGER NOT NULL, -- in cents
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Stripe Integration
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded'
    failure_reason TEXT,
    
    -- Timeline
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ============================================================================
-- EVENT SPONSORS
-- ============================================================================

CREATE TABLE event_sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    
    -- Sponsor Details
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_logo_url VARCHAR(500),
    sponsor_website VARCHAR(500),
    sponsor_description TEXT,
    
    -- Sponsorship Level
    sponsorship_level VARCHAR(50), -- 'platinum', 'gold', 'silver', 'bronze', 'supporter'
    sponsorship_amount INTEGER, -- in cents
    
    -- Contact
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    
    -- Display
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Events Indexes
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_event_type ON events(event_type_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_location ON events(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || description));
CREATE INDEX idx_events_nonprofit ON events(is_nonprofit, nonprofit_approval_status) WHERE is_nonprofit = true;
CREATE INDEX idx_events_payment_status ON events(payment_status) WHERE is_paid = true;

-- RSVPs Indexes
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_status ON event_rsvps(status);

-- Analytics Indexes
CREATE INDEX idx_event_analytics_event ON event_analytics(event_id);
CREATE INDEX idx_event_analytics_metric ON event_analytics(metric_type);
CREATE INDEX idx_event_analytics_created ON event_analytics(created_at);

-- Payments Indexes
CREATE INDEX idx_event_payments_event ON event_payments(event_id);
CREATE INDEX idx_event_payments_organizer ON event_payments(organizer_id);
CREATE INDEX idx_event_payments_status ON event_payments(status);

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Event Categories
INSERT INTO event_categories (key, name, description, icon_name, sort_order) VALUES
('shabbat', 'Shabbat', 'Shabbat services and meals', 'candle', 1),
('holiday', 'Holiday', 'Jewish holidays and celebrations', 'star', 2),
('education', 'Education', 'Classes, lectures, and learning', 'book', 3),
('social', 'Social', 'Social gatherings and networking', 'users', 4),
('fundraising', 'Fundraising', 'Charity events and fundraisers', 'heart', 5),
('cultural', 'Cultural', 'Cultural events and performances', 'theater', 6),
('sports', 'Sports & Recreation', 'Sports and recreational activities', 'basketball', 7),
('business', 'Business', 'Business networking and events', 'briefcase', 8),
('youth', 'Youth', 'Events for children and teens', 'child', 9),
('senior', 'Senior', 'Events for seniors', 'elderly', 10),
('wedding', 'Wedding', 'Weddings and celebrations', 'ring', 11),
('other', 'Other', 'Other types of events', 'calendar', 12);

-- Event Types
INSERT INTO event_types (key, name, description, sort_order) VALUES
('service', 'Service', 'Religious services', 1),
('meal', 'Meal', 'Meals and dining events', 2),
('class', 'Class', 'Educational classes and workshops', 3),
('lecture', 'Lecture', 'Lectures and presentations', 4),
('concert', 'Concert', 'Musical performances', 5),
('party', 'Party', 'Celebrations and parties', 6),
('meeting', 'Meeting', 'Meetings and gatherings', 7),
('tournament', 'Tournament', 'Competitions and tournaments', 8),
('conference', 'Conference', 'Conferences and conventions', 9),
('retreat', 'Retreat', 'Retreats and getaways', 10),
('other', 'Other', 'Other types of events', 11);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at_trigger 
BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_events_updated_at();

-- Function to calculate flyer aspect ratio
CREATE OR REPLACE FUNCTION calculate_flyer_aspect_ratio()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.flyer_width IS NOT NULL AND NEW.flyer_height IS NOT NULL AND NEW.flyer_height > 0 THEN
        NEW.flyer_aspect_ratio := ROUND((NEW.flyer_width::DECIMAL / NEW.flyer_height::DECIMAL)::NUMERIC, 3);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_flyer_aspect_ratio_trigger 
BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION calculate_flyer_aspect_ratio();

-- Function to update RSVP count
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE events SET rsvp_count = rsvp_count + NEW.guest_count WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE events SET rsvp_count = rsvp_count + (NEW.guest_count - OLD.guest_count) WHERE id = NEW.event_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE events SET rsvp_count = rsvp_count - OLD.guest_count WHERE id = OLD.event_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_rsvp_count_trigger
AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
    FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- Function to auto-expire events
CREATE OR REPLACE FUNCTION auto_expire_events()
RETURNS void AS $$
BEGIN
    UPDATE events
    SET status = 'completed'
    WHERE status = 'approved' 
    AND event_date < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Function to check if user's first event is free
CREATE OR REPLACE FUNCTION is_first_event_free(p_organizer_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    event_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO event_count
    FROM events
    WHERE organizer_id = p_organizer_id
    AND status NOT IN ('rejected', 'cancelled');
    
    RETURN event_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW event_stats AS
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.event_date,
    e.status,
    e.view_count,
    e.rsvp_count,
    e.capacity,
    CASE 
        WHEN e.capacity IS NOT NULL THEN ROUND((e.rsvp_count::DECIMAL / e.capacity::DECIMAL) * 100, 2)
        ELSE NULL
    END as capacity_percentage,
    COUNT(DISTINCT ea.id) FILTER (WHERE ea.metric_type = 'view') as total_views,
    COUNT(DISTINCT ea.id) FILTER (WHERE ea.metric_type = 'cta_click') as total_cta_clicks,
    COUNT(DISTINCT ea.id) FILTER (WHERE ea.metric_type = 'share') as total_shares,
    e.created_at
FROM events e
LEFT JOIN event_analytics ea ON e.id = ea.event_id
GROUP BY e.id;

CREATE OR REPLACE VIEW upcoming_events AS
SELECT 
    e.*,
    ec.name as category_name,
    ec.icon_name as category_icon,
    et.name as event_type_name,
    u.first_name as organizer_first_name,
    u.last_name as organizer_last_name
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
JOIN event_types et ON e.event_type_id = et.id
JOIN users u ON e.organizer_id = u.id
WHERE e.status = 'approved'
AND e.event_date > NOW()
ORDER BY e.event_date ASC;

-- ============================================================================
-- MATERIALIZED VIEW FOR PERFORMANCE
-- ============================================================================

CREATE MATERIALIZED VIEW mv_active_events AS
SELECT 
    e.*,
    ec.name as category_name,
    et.name as event_type_name,
    u.first_name || ' ' || u.last_name as organizer_name
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
JOIN event_types et ON e.event_type_id = et.id
JOIN users u ON e.organizer_id = u.id
WHERE e.status = 'approved'
AND e.event_date > NOW();

CREATE INDEX idx_mv_active_events_date ON mv_active_events(event_date);
CREATE INDEX idx_mv_active_events_category ON mv_active_events(category_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_active_events()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_events;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE events IS 'Events with flyer upload (8.5x11"), RSVP system, and payment integration. First event free, $9.99 after. Nonprofit events free with approval.';
COMMENT ON TABLE event_rsvps IS 'Event registrations with capacity management and waitlist support';
COMMENT ON TABLE event_analytics IS 'Detailed analytics for event performance tracking';
