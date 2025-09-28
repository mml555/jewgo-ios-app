-- Specials Performance Optimizations
-- Date: 2025-01-19
-- Description: Materialized views and additional performance enhancements for specials

BEGIN;

-- =============================================================================
-- MATERIALIZED VIEW FOR ACTIVE SPECIALS (Hot Path Optimization)
-- =============================================================================

-- Materialized view for frequently accessed "active specials" data
CREATE MATERIALIZED VIEW mv_active_specials AS
SELECT 
    s.id,
    s.business_id,
    s.title,
    s.discount_label,
    s.priority,
    s.valid_until,
    s.claims_total,
    s.max_claims_total,
    e.name as business_name,
    e.city,
    e.state,
    e.location
FROM specials s
JOIN entities e ON s.business_id = e.id
JOIN entity_types et ON e.entity_type_id = et.id
WHERE s.is_enabled 
  AND s.validity @> now()
  AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
  AND et.key = 'restaurant';

-- Create indexes on materialized view
CREATE UNIQUE INDEX mv_active_specials_pk ON mv_active_specials(id);
CREATE INDEX mv_active_specials_business_id ON mv_active_specials(business_id);
CREATE INDEX mv_active_specials_priority ON mv_active_specials(priority DESC);
CREATE INDEX mv_active_specials_valid_until ON mv_active_specials(valid_until);
CREATE INDEX mv_active_specials_location ON mv_active_specials USING GIST(location);

-- =============================================================================
-- MATERIALIZED VIEW FOR RESTAURANTS WITH ACTIVE SPECIALS
-- =============================================================================

CREATE MATERIALIZED VIEW mv_restaurants_with_specials AS
SELECT 
    e.id as entity_id,
    e.name,
    e.city,
    e.state,
    e.location,
    COUNT(s.id) as active_specials_count,
    MAX(s.priority) as max_priority,
    MIN(s.valid_until) as earliest_expiry,
    jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'discount_label', s.discount_label,
            'priority', s.priority,
            'valid_until', s.valid_until
        ) ORDER BY s.priority DESC, s.valid_until ASC
    ) as active_specials
FROM entities e
JOIN entity_types et ON e.entity_type_id = et.id
LEFT JOIN specials s ON (
    s.business_id = e.id
    AND s.is_enabled
    AND s.validity @> now()
    AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
)
WHERE e.is_active = TRUE
  AND et.key = 'restaurant'
GROUP BY e.id, e.name, e.city, e.state, e.location
HAVING COUNT(s.id) > 0;

-- Create indexes on restaurants with specials view
CREATE UNIQUE INDEX mv_restaurants_with_specials_pk ON mv_restaurants_with_specials(entity_id);
CREATE INDEX mv_restaurants_with_specials_count ON mv_restaurants_with_specials(active_specials_count DESC);
CREATE INDEX mv_restaurants_with_specials_priority ON mv_restaurants_with_specials(max_priority DESC);
CREATE INDEX mv_restaurants_with_specials_location ON mv_restaurants_with_specials USING GIST(location);

-- =============================================================================
-- REFRESH FUNCTIONS
-- =============================================================================

-- Function to refresh all specials materialized views
CREATE OR REPLACE FUNCTION refresh_specials_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_active_specials;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_restaurants_with_specials;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views when specials change
CREATE OR REPLACE FUNCTION trigger_refresh_specials_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Use pg_notify to trigger async refresh (can be picked up by background worker)
    PERFORM pg_notify('refresh_specials_views', '');
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to notify when materialized views need refreshing
CREATE TRIGGER trigger_refresh_on_specials_change
    AFTER INSERT OR UPDATE OR DELETE ON specials
    FOR EACH ROW EXECUTE FUNCTION trigger_refresh_specials_views();

CREATE TRIGGER trigger_refresh_on_entities_change
    AFTER UPDATE ON entities
    FOR EACH ROW 
    WHEN (OLD.is_active != NEW.is_active OR OLD.name != NEW.name)
    EXECUTE FUNCTION trigger_refresh_specials_views();

-- =============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- =============================================================================

-- Composite index for complex specials queries
CREATE INDEX idx_specials_business_enabled_priority 
  ON specials (business_id, is_enabled, priority DESC) 
  WHERE is_enabled = TRUE;

-- Partial index for active specials only
CREATE INDEX idx_specials_active_only 
  ON specials (business_id, priority DESC, valid_until ASC)
  WHERE is_enabled = TRUE 
    AND validity @> now()
    AND (max_claims_total IS NULL OR claims_total < max_claims_total);

-- Index for claims limit checking
CREATE INDEX idx_specials_claims_limit 
  ON specials (id) 
  WHERE max_claims_total IS NOT NULL;

-- =============================================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =============================================================================

-- Optimized function for getting top special per restaurant
CREATE OR REPLACE FUNCTION get_top_special_per_restaurant(restaurant_id UUID)
RETURNS TABLE (
    special_id UUID,
    title VARCHAR(255),
    discount_label VARCHAR(100),
    priority INTEGER,
    valid_until TIMESTAMPTZ,
    claims_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.discount_label,
        s.priority,
        s.valid_until,
        CASE 
            WHEN s.max_claims_total IS NULL THEN NULL
            ELSE s.max_claims_total - s.claims_total
        END as claims_remaining
    FROM specials s
    WHERE s.business_id = restaurant_id
      AND s.is_enabled
      AND s.validity @> now()
      AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
    ORDER BY s.priority DESC, s.valid_until ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Optimized function for nearby restaurants with specials (using materialized view)
CREATE OR REPLACE FUNCTION get_nearby_restaurants_with_specials(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    entity_id UUID,
    name VARCHAR(255),
    city VARCHAR(50),
    state VARCHAR(50),
    distance_meters DOUBLE PRECISION,
    active_specials_count INTEGER,
    max_priority INTEGER,
    top_special JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rws.entity_id,
        rws.name,
        rws.city,
        rws.state,
        ST_Distance(
            rws.location::geography,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
        ) as distance,
        rws.active_specials_count,
        rws.max_priority,
        (
            SELECT jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'discount_label', s.discount_label,
                'priority', s.priority,
                'valid_until', s.valid_until
            )
            FROM mv_active_specials s
            WHERE s.business_id = rws.entity_id
            ORDER BY s.priority DESC, s.valid_until ASC
            LIMIT 1
        ) as top_special
    FROM mv_restaurants_with_specials rws
    WHERE ST_DWithin(
        rws.location::geography,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY rws.max_priority DESC, distance
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ANALYTICS AND REPORTING FUNCTIONS
-- =============================================================================

-- Function to get specials performance metrics
CREATE OR REPLACE FUNCTION get_specials_performance_metrics(
    start_date TIMESTAMPTZ DEFAULT NULL,
    end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_specials INTEGER,
    active_specials INTEGER,
    expired_specials INTEGER,
    total_claims INTEGER,
    avg_claims_per_special NUMERIC,
    top_performing_special JSONB
) AS $$
DECLARE
    start_dt TIMESTAMPTZ := COALESCE(start_date, now() - interval '30 days');
    end_dt TIMESTAMPTZ := COALESCE(end_date, now());
BEGIN
    RETURN QUERY
    WITH specials_stats AS (
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE is_enabled AND validity @> now()) as active_count,
            COUNT(*) FILTER (WHERE valid_until < now()) as expired_count,
            SUM(claims_total) as total_claims,
            AVG(claims_total) as avg_claims
        FROM specials
        WHERE created_at BETWEEN start_dt AND end_dt
    ),
    top_special AS (
        SELECT jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'business_name', e.name,
            'claims_total', s.claims_total,
            'discount_label', s.discount_label
        )
        FROM specials s
        JOIN entities e ON s.business_id = e.id
        WHERE s.created_at BETWEEN start_dt AND end_dt
        ORDER BY s.claims_total DESC
        LIMIT 1
    )
    SELECT 
        ss.total_count::INTEGER,
        ss.active_count::INTEGER,
        ss.expired_count::INTEGER,
        ss.total_claims::INTEGER,
        ss.avg_claims,
        ts.jsonb_build_object
    FROM specials_stats ss
    CROSS JOIN top_special ts;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP AND MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to clean up expired specials (soft delete by setting is_enabled = false)
CREATE OR REPLACE FUNCTION cleanup_expired_specials()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE specials 
    SET is_enabled = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE is_enabled = TRUE 
      AND valid_until < now() - interval '7 days'; -- Keep for 7 days after expiry
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Refresh materialized views after cleanup
    PERFORM refresh_specials_materialized_views();
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update claims counters (in case of data inconsistency)
CREATE OR REPLACE FUNCTION sync_specials_claims_counters()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE specials 
    SET claims_total = (
        SELECT COUNT(*)
        FROM special_claims sc
        WHERE sc.special_id = specials.id
          AND sc.status IN ('claimed', 'redeemed')
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE EXISTS (
        SELECT 1 FROM special_claims sc 
        WHERE sc.special_id = specials.id
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
