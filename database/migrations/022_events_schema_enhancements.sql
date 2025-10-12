-- Events Schema Enhancements Migration
-- This migration adds new computed fields and views to support enhanced UI features
-- while maintaining backward compatibility with existing schema

-- ============================================================================
-- NEW COMPUTED FIELDS (as columns for performance)
-- ============================================================================

-- Add computed fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN GENERATED ALWAYS AS (NOT is_paid) STORED,
ADD COLUMN IF NOT EXISTS display_date_range TEXT,
ADD COLUMN IF NOT EXISTS organizer_name VARCHAR(255);

-- ============================================================================
-- NEW INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for free events filtering
CREATE INDEX IF NOT EXISTS idx_events_is_free ON events(is_free);

-- Index for zip code filtering  
CREATE INDEX IF NOT EXISTS idx_events_zip_code ON events(zip_code);

-- Composite index for category and date filtering
CREATE INDEX IF NOT EXISTS idx_events_category_date ON events(category_id, event_date);

-- Index for tags filtering (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_events_tags_gin ON events USING gin(tags);

-- ============================================================================
-- ENHANCED VIEW WITH COMPUTED FIELDS
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS v_events_enhanced;

-- Create enhanced events view with all computed fields
CREATE VIEW v_events_enhanced AS
SELECT 
    e.*,
    -- Category information
    ec.name as category_name,
    ec.icon_name as category_icon,
    ec.key as category_key,
    
    -- Event type information  
    et.name as event_type_name,
    et.key as event_type_key,
    
    -- Organizer information
    u.first_name || ' ' || u.last_name as organizer_full_name,
    u.first_name as organizer_first_name,
    u.last_name as organizer_last_name,
    
    -- Computed fields
    CASE 
        WHEN e.event_date > NOW() THEN 'upcoming'
        WHEN e.event_end_date IS NOT NULL AND e.event_end_date < NOW() THEN 'past'
        WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN 'happening_now'
        ELSE 'past'
    END as event_status,
    
    CASE 
        WHEN e.event_date > NOW() THEN false
        WHEN e.event_end_date IS NOT NULL AND e.event_end_date < NOW() THEN true
        WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN false
        ELSE true
    END as is_past,
    
    CASE 
        WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN true
        ELSE false
    END as is_happening_now,
    
    -- Capacity percentage
    CASE 
        WHEN e.capacity IS NOT NULL AND e.capacity > 0 THEN 
            ROUND((e.rsvp_count::DECIMAL / e.capacity::DECIMAL) * 100, 0)
        ELSE NULL
    END as capacity_percentage,
    
    -- Formatted date range for display
    CASE 
        WHEN e.event_end_date IS NOT NULL AND 
             DATE(e.event_date) != DATE(e.event_end_date) THEN
            -- Multi-day event
            TO_CHAR(e.event_date, 'Month DD') || '-' || 
            TO_CHAR(e.event_end_date, 'DD') || ' ' ||
            TO_CHAR(e.event_date, 'Day') || ' ' ||
            TO_CHAR(e.event_date, 'HH12:MI AM')
        ELSE
            -- Single day event
            TO_CHAR(e.event_date, 'Month DD') || ' ' ||
            TO_CHAR(e.event_date, 'Day') || ' ' ||
            TO_CHAR(e.event_date, 'HH12:MI AM')
    END as display_date_range_formatted,
    
    -- Location display
    CASE 
        WHEN e.venue_name IS NOT NULL THEN e.venue_name
        WHEN e.address IS NOT NULL THEN e.address
        ELSE e.city || ', ' || e.state
    END as location_display

FROM events e
JOIN event_categories ec ON e.category_id = ec.id
JOIN event_types et ON e.event_type_id = et.id  
JOIN users u ON e.organizer_id = u.id;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to format date range for display
CREATE OR REPLACE FUNCTION format_event_date_range(
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ DEFAULT NULL,
    timezone_name TEXT DEFAULT 'America/New_York'
) RETURNS TEXT AS $$
DECLARE
    start_tz TIMESTAMPTZ;
    end_tz TIMESTAMPTZ;
    result TEXT;
BEGIN
    -- Convert to specified timezone
    start_tz := start_date AT TIME ZONE timezone_name;
    end_tz := COALESCE(end_date, start_date) AT TIME ZONE timezone_name;
    
    -- Format based on single vs multi-day
    IF DATE(start_tz) = DATE(end_tz) THEN
        -- Single day event
        result := TO_CHAR(start_tz, 'Month DD') || ' ' ||
                 TO_CHAR(start_tz, 'Day') || ' ' ||
                 TO_CHAR(start_tz, 'HH12:MI AM');
    ELSE
        -- Multi-day event  
        result := TO_CHAR(start_tz, 'Month DD') || '-' ||
                 TO_CHAR(end_tz, 'DD') || ' ' ||
                 TO_CHAR(start_tz, 'Day') || ' ' ||
                 TO_CHAR(start_tz, 'HH12:MI AM');
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to generate social share URLs
CREATE OR REPLACE FUNCTION generate_event_share_urls(
    event_id UUID,
    event_title TEXT,
    event_url TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    base_url TEXT;
    share_urls JSONB;
BEGIN
    -- Use provided URL or generate default
    base_url := COALESCE(event_url, 'https://jewgo.app/events/' || event_id);
    
    share_urls := jsonb_build_object(
        'whatsapp', 'whatsapp://send?text=' || url_encode(event_title || ' - ' || base_url),
        'facebook', 'fb://share?link=' || url_encode(base_url),
        'twitter', 'twitter://post?message=' || url_encode(event_title || ' - ' || base_url),
        'email', 'mailto:?subject=' || url_encode(event_title) || '&body=' || url_encode(base_url),
        'copy_link', base_url
    );
    
    RETURN share_urls;
END;
$$ LANGUAGE plpgsql;

-- URL encoding helper function
CREATE OR REPLACE FUNCTION url_encode(text TEXT) RETURNS TEXT AS $$
BEGIN
    RETURN replace(replace(replace(text, ' ', '%20'), '&', '%26'), '#', '%23');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO UPDATE COMPUTED FIELDS
-- ============================================================================

-- Function to update display_date_range when event dates change
CREATE OR REPLACE FUNCTION update_event_display_date_range()
RETURNS TRIGGER AS $$
BEGIN
    NEW.display_date_range := format_event_date_range(NEW.event_date, NEW.event_end_date, NEW.timezone);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update display_date_range
DROP TRIGGER IF EXISTS update_event_display_date_range_trigger ON events;
CREATE TRIGGER update_event_display_date_range_trigger
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_event_display_date_range();

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Update display_date_range for existing events
UPDATE events 
SET display_date_range = format_event_date_range(event_date, event_end_date, timezone)
WHERE display_date_range IS NULL;

-- Update organizer_name for existing events
UPDATE events 
SET organizer_name = u.first_name || ' ' || u.last_name
FROM users u 
WHERE events.organizer_id = u.id 
AND events.organizer_name IS NULL;

-- ============================================================================
-- VIEW FOR FILTERING AND SEARCH
-- ============================================================================

-- Create view for enhanced event search with filters
CREATE OR REPLACE VIEW v_events_search AS
SELECT 
    ve.*,
    -- Search vector for full-text search
    to_tsvector('english', 
        COALESCE(ve.title, '') || ' ' ||
        COALESCE(ve.description, '') || ' ' ||
        COALESCE(ve.venue_name, '') || ' ' ||
        COALESCE(ve.city, '') || ' ' ||
        COALESCE(ve.state, '') || ' ' ||
        COALESCE(ve.category_name, '') || ' ' ||
        COALESCE(ve.event_type_name, '')
    ) as search_vector
FROM v_events_enhanced ve;

-- Create GIN index on search vector
CREATE INDEX IF NOT EXISTS idx_events_search_vector ON events USING gin(
    to_tsvector('english', 
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(venue_name, '') || ' ' ||
        COALESCE(city, '') || ' ' ||
        COALESCE(state, '')
    )
);

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON VIEW v_events_enhanced IS 'Enhanced events view with computed fields for UI display';
COMMENT ON VIEW v_events_search IS 'Events view optimized for search and filtering';
COMMENT ON FUNCTION format_event_date_range IS 'Formats event dates for display with timezone support';
COMMENT ON FUNCTION generate_event_share_urls IS 'Generates social sharing URLs for events';
COMMENT ON COLUMN events.is_free IS 'Computed field: true if event is free (not paid)';
COMMENT ON COLUMN events.display_date_range IS 'Formatted date range for UI display';
COMMENT ON COLUMN events.organizer_name IS 'Full name of event organizer';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the migration worked correctly
DO $$
DECLARE
    event_count INTEGER;
    enhanced_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO event_count FROM events;
    SELECT COUNT(*) INTO enhanced_count FROM v_events_enhanced;
    
    IF event_count != enhanced_count THEN
        RAISE EXCEPTION 'Migration failed: event counts do not match (%, %)', event_count, enhanced_count;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully: % events processed', event_count;
END $$;
