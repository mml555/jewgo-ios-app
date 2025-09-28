-- Ready-to-Use Specials Queries
-- Date: 2025-01-19
-- Description: Production-ready SQL queries for the enhanced specials system

-- =============================================================================
-- BASIC QUERIES
-- =============================================================================

-- 1. Get all restaurants that currently have at least one active special
SELECT e.id, e.name, e.city, e.state, COUNT(s.id) as active_specials_count
FROM entities e
JOIN entity_types et ON e.entity_type_id = et.id
JOIN specials s ON s.business_id = e.id
WHERE e.is_active = TRUE
  AND et.key = 'restaurant'
  AND s.is_enabled
  AND s.validity @> now()
  AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
GROUP BY e.id, e.name, e.city, e.state
ORDER BY active_specials_count DESC;

-- 2. Get restaurants + their single best active special
SELECT 
    e.id, 
    e.name, 
    e.city,
    s.id as special_id,
    s.title,
    s.discount_label,
    s.priority,
    s.valid_until
FROM entities e
JOIN entity_types et ON e.entity_type_id = et.id
JOIN LATERAL (
    SELECT s.*
    FROM specials s
    WHERE s.business_id = e.id
      AND s.is_enabled
      AND s.validity @> now()
      AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
    ORDER BY s.priority DESC, s.valid_until ASC
    LIMIT 1
) s ON TRUE
WHERE e.is_active = TRUE
  AND et.key = 'restaurant'
ORDER BY s.priority DESC;

-- 3. Get all active specials for a specific restaurant as JSON
SELECT 
    e.name as restaurant_name,
    get_restaurant_active_specials_json(e.id) as active_specials
FROM entities e
WHERE e.name = 'Kosher Delight';

-- =============================================================================
-- LOCATION-BASED QUERIES
-- =============================================================================

-- 4. Find restaurants with active specials within 1km of Brooklyn coordinates
SELECT * FROM get_restaurants_with_active_specials_within_radius(
    40.6782,  -- Brooklyn latitude
    -73.9442, -- Brooklyn longitude  
    1000,     -- 1km radius
    20        -- limit to 20 results
);

-- 5. Find nearby restaurants using materialized view (faster)
SELECT * FROM get_nearby_restaurants_with_specials(
    40.6782,  -- Brooklyn latitude
    -73.9442, -- Brooklyn longitude
    1000,     -- 1km radius
    15        -- limit to 15 results
);

-- 6. Get top special for a specific restaurant
SELECT * FROM get_top_special_per_restaurant(
    (SELECT id FROM entities WHERE name = 'Kosher Delight')
);

-- =============================================================================
-- ANALYTICS QUERIES
-- =============================================================================

-- 7. Get specials performance metrics for the last 30 days
SELECT * FROM get_specials_performance_metrics(
    now() - interval '30 days',
    now()
);

-- 8. Most claimed specials (top performers)
SELECT 
    s.title,
    e.name as restaurant_name,
    s.claims_total,
    s.max_claims_total,
    ROUND((s.claims_total::numeric / NULLIF(s.max_claims_total, 0)) * 100, 2) as claim_percentage
FROM specials s
JOIN entities e ON s.business_id = e.id
WHERE s.claims_total > 0
ORDER BY s.claims_total DESC
LIMIT 10;

-- 9. Specials expiring soon (next 7 days)
SELECT 
    s.title,
    e.name as restaurant_name,
    s.valid_until,
    s.claims_total,
    s.max_claims_total,
    (s.valid_until - now()) as time_remaining
FROM specials s
JOIN entities e ON s.business_id = e.id
WHERE s.is_enabled
  AND s.valid_until BETWEEN now() AND now() + interval '7 days'
ORDER BY s.valid_until ASC;

-- =============================================================================
-- USER-SPECIFIC QUERIES
-- =============================================================================

-- 10. Get all specials claimed by a specific user
SELECT 
    s.title,
    e.name as restaurant_name,
    sc.claimed_at,
    sc.status,
    s.valid_until
FROM special_claims sc
JOIN specials s ON sc.special_id = s.id
JOIN entities e ON s.business_id = e.id
WHERE sc.user_id = (SELECT id FROM users WHERE email = 'user1@example.com')
ORDER BY sc.claimed_at DESC;

-- 11. Available specials for a user (not yet claimed, still valid)
SELECT 
    s.id,
    s.title,
    s.discount_label,
    e.name as restaurant_name,
    e.city,
    s.valid_until,
    s.priority
FROM specials s
JOIN entities e ON s.business_id = e.id
WHERE s.is_enabled
  AND s.validity @> now()
  AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
  AND NOT EXISTS (
    SELECT 1 FROM special_claims sc 
    WHERE sc.special_id = s.id 
      AND sc.user_id = (SELECT id FROM users WHERE email = 'user1@example.com')
      AND sc.status IN ('claimed', 'redeemed')
  )
ORDER BY s.priority DESC, s.valid_until ASC;

-- =============================================================================
-- BUSINESS INTELLIGENCE QUERIES
-- =============================================================================

-- 12. Specials by discount type performance
SELECT 
    s.discount_type,
    COUNT(*) as total_specials,
    SUM(s.claims_total) as total_claims,
    AVG(s.claims_total) as avg_claims_per_special,
    MAX(s.claims_total) as max_claims
FROM specials s
WHERE s.created_at >= now() - interval '30 days'
GROUP BY s.discount_type
ORDER BY total_claims DESC;

-- 13. Restaurant specials performance ranking
SELECT 
    e.name as restaurant_name,
    e.city,
    COUNT(s.id) as total_specials,
    SUM(s.claims_total) as total_claims,
    AVG(s.claims_total) as avg_claims_per_special,
    MAX(s.priority) as max_priority_used
FROM entities e
JOIN entity_types et ON e.entity_type_id = et.id
LEFT JOIN specials s ON s.business_id = e.id
WHERE et.key = 'restaurant'
  AND s.created_at >= now() - interval '30 days'
GROUP BY e.id, e.name, e.city
HAVING COUNT(s.id) > 0
ORDER BY total_claims DESC;

-- 14. Time-based specials analysis (by hour of day created)
SELECT 
    EXTRACT(hour FROM s.created_at) as hour_created,
    COUNT(*) as specials_created,
    AVG(s.claims_total) as avg_claims
FROM specials s
WHERE s.created_at >= now() - interval '30 days'
GROUP BY EXTRACT(hour FROM s.created_at)
ORDER BY hour_created;

-- =============================================================================
-- MATERIALIZED VIEW QUERIES (Ultra-Fast)
-- =============================================================================

-- 15. Get all active specials (using materialized view)
SELECT * FROM mv_active_specials
ORDER BY priority DESC, valid_until ASC;

-- 16. Restaurants with most active specials (using materialized view)
SELECT * FROM mv_restaurants_with_specials
ORDER BY active_specials_count DESC, max_priority DESC;

-- 17. Find restaurants by city with active specials (using materialized view)
SELECT * FROM mv_restaurants_with_specials
WHERE city = 'Brooklyn'
ORDER BY max_priority DESC;

-- =============================================================================
-- MAINTENANCE QUERIES
-- =============================================================================

-- 18. Clean up expired specials (run this periodically)
SELECT cleanup_expired_specials();

-- 19. Sync claims counters (if data gets out of sync)
SELECT sync_specials_claims_counters();

-- 20. Refresh materialized views (run this periodically or via cron)
SELECT refresh_specials_materialized_views();

-- =============================================================================
-- COMPLEX BUSINESS QUERIES
-- =============================================================================

-- 21. Find restaurants with overlapping specials (business rule violation)
SELECT 
    e.name as restaurant_name,
    s1.title as special1_title,
    s2.title as special2_title,
    s1.valid_from as overlap_start,
    LEAST(s1.valid_until, s2.valid_until) as overlap_end
FROM entities e
JOIN specials s1 ON s1.business_id = e.id
JOIN specials s2 ON s2.business_id = e.id
WHERE s1.id < s2.id
  AND s1.is_enabled = TRUE
  AND s2.is_enabled = TRUE
  AND s1.validity && s2.validity
ORDER BY e.name, overlap_start;

-- 22. Specials that are close to hitting their claim limits
SELECT 
    s.title,
    e.name as restaurant_name,
    s.claims_total,
    s.max_claims_total,
    s.max_claims_total - s.claims_total as remaining_claims,
    ROUND((s.claims_total::numeric / s.max_claims_total) * 100, 2) as utilization_percentage
FROM specials s
JOIN entities e ON s.business_id = e.id
WHERE s.max_claims_total IS NOT NULL
  AND s.is_enabled
  AND s.validity @> now()
  AND s.claims_total >= (s.max_claims_total * 0.8) -- 80% utilized
ORDER BY utilization_percentage DESC;

-- 23. Specials with no claims (underperforming)
SELECT 
    s.title,
    e.name as restaurant_name,
    s.created_at,
    s.valid_until,
    (s.valid_until - now()) as time_remaining,
    s.priority
FROM specials s
JOIN entities e ON s.business_id = e.id
WHERE s.claims_total = 0
  AND s.is_enabled
  AND s.validity @> now()
  AND s.created_at < now() - interval '3 days' -- At least 3 days old
ORDER BY s.priority DESC, s.created_at ASC;
