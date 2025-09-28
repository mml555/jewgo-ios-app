-- Performance optimizations for specials (simplified version without location column)
-- This creates materialized views and triggers for enhanced performance

BEGIN;

-- Create materialized view for active specials (without location for now)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_active_specials AS
SELECT 
    s.id,
    s.business_id,
    s.title,
    s.discount_label,
    s.priority,
    s.claims_total,
    s.valid_from,
    s.valid_until,
    e.name as business_name,
    e.city,
    e.state
FROM specials s
JOIN entities e ON s.business_id = e.id
WHERE s.is_enabled = true
  AND s.valid_from <= NOW()
  AND s.valid_until >= NOW()
  AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total);

-- Create indexes on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS mv_active_specials_pk ON mv_active_specials(id);
CREATE INDEX IF NOT EXISTS mv_active_specials_business ON mv_active_specials(business_id);
CREATE INDEX IF NOT EXISTS mv_active_specials_priority ON mv_active_specials(priority DESC);

-- Create materialized view for restaurants with specials (without location for now)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_restaurants_with_specials AS
SELECT 
    e.id as entity_id,
    e.name,
    e.city,
    e.state,
    COUNT(s.id) as active_specials_count,
    MAX(s.priority) as max_priority,
    MIN(s.valid_until) as earliest_expiry
FROM entities e
JOIN specials s ON s.business_id = e.id
WHERE e.entity_type = 'restaurant'
  AND s.is_enabled = true
  AND s.valid_from <= NOW()
  AND s.valid_until >= NOW()
  AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
GROUP BY e.id, e.name, e.city, e.state;

-- Create indexes on restaurants materialized view
CREATE UNIQUE INDEX IF NOT EXISTS mv_restaurants_with_specials_pk ON mv_restaurants_with_specials(entity_id);
CREATE INDEX IF NOT EXISTS mv_restaurants_with_specials_count ON mv_restaurants_with_specials(active_specials_count DESC);
CREATE INDEX IF NOT EXISTS mv_restaurants_with_specials_priority ON mv_restaurants_with_specials(max_priority DESC);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_specials_materialized_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_specials;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_restaurants_with_specials;
END;
$$;

-- Function to get specials analytics
CREATE OR REPLACE FUNCTION get_specials_analytics(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_specials BIGINT,
    active_specials BIGINT,
    expired_specials BIGINT,
    total_claims BIGINT,
    avg_claims_per_special NUMERIC,
    top_performing_special_id UUID,
    top_performing_special_title TEXT,
    top_performing_business_name TEXT,
    top_performing_claims_total BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
    start_dt TIMESTAMPTZ;
    end_dt TIMESTAMPTZ;
BEGIN
    -- Default to last 30 days if no dates provided
    start_dt := COALESCE(start_date, NOW() - INTERVAL '30 days');
    end_dt := COALESCE(end_date, NOW());
    
    RETURN QUERY
    SELECT 
        COUNT(*) as total_specials,
        COUNT(*) FILTER (WHERE is_enabled AND valid_from <= NOW() AND valid_until >= NOW()) as active_specials,
        COUNT(*) FILTER (WHERE valid_until < NOW()) as expired_specials,
        COALESCE(SUM(claims_total), 0) as total_claims,
        COALESCE(AVG(claims_total), 0) as avg_claims_per_special,
        (SELECT s.id FROM specials s WHERE s.claims_total = (SELECT MAX(claims_total) FROM specials)) as top_performing_special_id,
        (SELECT s.title FROM specials s WHERE s.claims_total = (SELECT MAX(claims_total) FROM specials)) as top_performing_special_title,
        (SELECT e.name FROM specials s JOIN entities e ON s.business_id = e.id WHERE s.claims_total = (SELECT MAX(claims_total) FROM specials) LIMIT 1) as top_performing_business_name,
        (SELECT MAX(claims_total) FROM specials) as top_performing_claims_total
    FROM specials
    WHERE created_at >= start_dt AND created_at <= end_dt;
END;
$$;

-- Function to get nearby restaurants with specials (simplified without distance calculation)
CREATE OR REPLACE FUNCTION get_nearby_restaurants_with_specials(
    user_lat DECIMAL(10,8),
    user_lng DECIMAL(11,8),
    radius_meters INTEGER DEFAULT 5000,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    entity_id UUID,
    name TEXT,
    city TEXT,
    state TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    active_specials_count BIGINT,
    max_priority INTEGER,
    top_special_id UUID,
    top_special_title TEXT,
    top_special_discount_label TEXT,
    top_special_claims_total INTEGER,
    top_special_max_claims_total INTEGER,
    top_special_valid_until TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as entity_id,
        e.name,
        e.city,
        e.state,
        e.latitude,
        e.longitude,
        COUNT(s.id) as active_specials_count,
        MAX(s.priority) as max_priority,
        (SELECT s2.id FROM specials s2 WHERE s2.business_id = e.id AND s2.is_enabled = true ORDER BY s2.priority DESC, s2.valid_until ASC LIMIT 1) as top_special_id,
        (SELECT s2.title FROM specials s2 WHERE s2.business_id = e.id AND s2.is_enabled = true ORDER BY s2.priority DESC, s2.valid_until ASC LIMIT 1) as top_special_title,
        (SELECT s2.discount_label FROM specials s2 WHERE s2.business_id = e.id AND s2.is_enabled = true ORDER BY s2.priority DESC, s2.valid_until ASC LIMIT 1) as top_special_discount_label,
        (SELECT s2.claims_total FROM specials s2 WHERE s2.business_id = e.id AND s2.is_enabled = true ORDER BY s2.priority DESC, s2.valid_until ASC LIMIT 1) as top_special_claims_total,
        (SELECT s2.max_claims_total FROM specials s2 WHERE s2.business_id = e.id AND s2.is_enabled = true ORDER BY s2.priority DESC, s2.valid_until ASC LIMIT 1) as top_special_max_claims_total,
        (SELECT s2.valid_until FROM specials s2 WHERE s2.business_id = e.id AND s2.is_enabled = true ORDER BY s2.priority DESC, s2.valid_until ASC LIMIT 1) as top_special_valid_until
    FROM entities e
    JOIN specials s ON s.business_id = e.id
    WHERE e.entity_type = 'restaurant'
      AND s.is_enabled = true
      AND s.valid_from <= NOW()
      AND s.valid_until >= NOW()
      AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
    GROUP BY e.id, e.name, e.city, e.state, e.latitude, e.longitude
    ORDER BY MAX(s.priority) DESC, COUNT(s.id) DESC
    LIMIT limit_count;
END;
$$;

-- Create triggers to refresh materialized views when specials change
CREATE OR REPLACE FUNCTION trigger_refresh_specials_materialized_views()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Refresh materialized views asynchronously
    PERFORM pg_notify('refresh_specials_materialized_views', '');
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for specials table
DROP TRIGGER IF EXISTS trg_specials_refresh_materialized_views ON specials;
CREATE TRIGGER trg_specials_refresh_materialized_views
    AFTER INSERT OR UPDATE OR DELETE ON specials
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_specials_materialized_views();

-- Create triggers for entities table (when restaurants are updated)
DROP TRIGGER IF EXISTS trg_entities_refresh_materialized_views ON entities;
CREATE TRIGGER trg_entities_refresh_materialized_views
    AFTER UPDATE ON entities
    FOR EACH ROW
    WHEN (OLD.entity_type = 'restaurant' OR NEW.entity_type = 'restaurant')
    EXECUTE FUNCTION trigger_refresh_specials_materialized_views();

-- Initial refresh of materialized views
REFRESH MATERIALIZED VIEW mv_active_specials;
REFRESH MATERIALIZED VIEW mv_restaurants_with_specials;

COMMIT;

-- Grant permissions
GRANT SELECT ON mv_active_specials TO jewgo_user;
GRANT SELECT ON mv_restaurants_with_specials TO jewgo_user;
GRANT EXECUTE ON FUNCTION refresh_specials_materialized_views() TO jewgo_user;
GRANT EXECUTE ON FUNCTION get_specials_analytics(TIMESTAMPTZ, TIMESTAMPTZ) TO jewgo_user;
GRANT EXECUTE ON FUNCTION get_nearby_restaurants_with_specials(DECIMAL(10,8), DECIMAL(11,8), INTEGER, INTEGER) TO jewgo_user;
