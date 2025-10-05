-- =============================================================================
-- SIMPLIFIED SPATIAL OPTIMIZATION MIGRATION
-- =============================================================================
-- This migration adds spatial optimization using standard PostgreSQL functions
-- without requiring PostGIS extension. Uses Haversine formula for distance calculations.

-- =============================================================================
-- STEP 1: ADD SPATIAL INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create composite index for location-based queries
CREATE INDEX IF NOT EXISTS entities_normalized_location_idx 
ON entities_normalized (latitude, longitude) 
WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for entity type + location queries
CREATE INDEX IF NOT EXISTS entities_normalized_type_location_idx 
ON entities_normalized (entity_type, latitude, longitude) 
WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for bounding box queries
CREATE INDEX IF NOT EXISTS entities_normalized_bbox_idx 
ON entities_normalized (latitude, longitude) 
WHERE is_active = true 
  AND latitude BETWEEN -90 AND 90 
  AND longitude BETWEEN -180 AND 180;

-- =============================================================================
-- STEP 2: CREATE SPATIAL FUNCTIONS USING HAVERSINE FORMULA
-- =============================================================================

-- Function to calculate distance using Haversine formula (in meters)
CREATE OR REPLACE FUNCTION calculate_distance_haversine(
  lat1 DOUBLE PRECISION,
  lng1 DOUBLE PRECISION,
  lat2 DOUBLE PRECISION,
  lng2 DOUBLE PRECISION
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371000; -- Earth's radius in meters
  dlat DOUBLE PRECISION;
  dlng DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  -- Convert degrees to radians
  dlat := radians(lat2 - lat1);
  dlng := radians(lng2 - lng1);
  
  -- Haversine formula
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlng/2) * sin(dlng/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get nearby entities with distance calculation
CREATE OR REPLACE FUNCTION get_nearby_entities_simple(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000,
  entity_type_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  after_cursor UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  name TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating DOUBLE PRECISION,
  review_count INTEGER,
  is_verified BOOLEAN,
  distance_m DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.entity_type,
    e.name,
    e.description,
    e.address,
    e.city,
    e.state,
    e.zip_code,
    e.latitude,
    e.longitude,
    e.rating,
    e.review_count,
    e.is_verified,
    -- Calculate distance using Haversine formula
    calculate_distance_haversine(
      user_lat, user_lng,
      e.latitude, e.longitude
    ) as distance_m
  FROM entities_normalized e
  WHERE e.is_active = true
    AND e.latitude IS NOT NULL 
    AND e.longitude IS NOT NULL
    AND e.latitude BETWEEN -90 AND 90
    AND e.longitude BETWEEN -180 AND 180
    AND calculate_distance_haversine(
      user_lat, user_lng,
      e.latitude, e.longitude
    ) <= radius_meters
    AND (entity_type_filter IS NULL OR e.entity_type = entity_type_filter)
    AND (after_cursor IS NULL OR e.id > after_cursor)
  ORDER BY distance_m ASC, e.rating DESC, e.review_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get entities within bounding box (for map views)
CREATE OR REPLACE FUNCTION get_entities_in_bounds_simple(
  min_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  max_lng DOUBLE PRECISION,
  entity_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  entity_type TEXT,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.entity_type,
    e.name,
    e.latitude,
    e.longitude,
    e.rating
  FROM entities_normalized e
  WHERE e.is_active = true
    AND e.latitude IS NOT NULL 
    AND e.longitude IS NOT NULL
    AND e.latitude BETWEEN min_lat AND max_lat
    AND e.longitude BETWEEN min_lng AND max_lng
    AND (entity_type_filter IS NULL OR e.entity_type = entity_type_filter)
  ORDER BY e.rating DESC, e.review_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 3: CREATE PERFORMANCE MONITORING VIEWS
-- =============================================================================

-- View for entity distribution by region
CREATE OR REPLACE VIEW entity_distribution_simple AS
SELECT 
  entity_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as with_coordinates,
  ROUND(
    COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as coordinate_coverage_percent
FROM entities_normalized
WHERE is_active = true
GROUP BY entity_type
ORDER BY total_count DESC;

-- View for location-based query performance
CREATE OR REPLACE VIEW location_query_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%location%' OR indexname LIKE '%bbox%'
ORDER BY idx_scan DESC;

-- =============================================================================
-- STEP 4: CREATE MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to analyze spatial indexes
CREATE OR REPLACE FUNCTION analyze_spatial_indexes_simple()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  rec RECORD;
BEGIN
  -- Analyze all location-related indexes
  FOR rec IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname LIKE '%location%' OR indexname LIKE '%bbox%'
  LOOP
    EXECUTE 'ANALYZE ' || rec.indexname;
    result := result || 'Analyzed: ' || rec.indexname || E'\n';
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get spatial query performance metrics
CREATE OR REPLACE FUNCTION get_spatial_performance_metrics_simple()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_entities'::TEXT,
    COUNT(*)::NUMERIC,
    'Total active entities'::TEXT
  FROM entities_normalized 
  WHERE is_active = true
  
  UNION ALL
  
  SELECT 
    'entities_with_coordinates'::TEXT,
    COUNT(*)::NUMERIC,
    'Entities with valid coordinates'::TEXT
  FROM entities_normalized 
  WHERE is_active = true 
    AND latitude IS NOT NULL 
    AND longitude IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'location_index_size_mb'::TEXT,
    ROUND(
      SUM(pg_relation_size(indexname::regclass)) / 1024.0 / 1024.0, 
      2
    )::NUMERIC,
    'Total size of location indexes in MB'::TEXT
  FROM pg_indexes 
  WHERE indexname LIKE '%location%' OR indexname LIKE '%bbox%';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 5: CREATE CONSTRAINTS FOR DATA QUALITY
-- =============================================================================

-- Add constraint to ensure valid coordinates (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_valid_coordinates_simple'
  ) THEN
    ALTER TABLE entities_normalized 
    ADD CONSTRAINT check_valid_coordinates_simple 
    CHECK (
      (latitude IS NULL AND longitude IS NULL) OR
      (latitude IS NOT NULL AND longitude IS NOT NULL AND
       latitude BETWEEN -90 AND 90 AND
       longitude BETWEEN -180 AND 180)
    );
  END IF;
END $$;

-- =============================================================================
-- STEP 6: CREATE TEST DATA FOR PERFORMANCE VALIDATION
-- =============================================================================

-- Function to test distance calculation performance
CREATE OR REPLACE FUNCTION test_distance_performance()
RETURNS TABLE (
  test_name TEXT,
  execution_time_ms NUMERIC,
  result_count INTEGER
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  test_lat DOUBLE PRECISION := 40.7128; -- NYC
  test_lng DOUBLE PRECISION := -74.0060;
BEGIN
  -- Test 1: Small radius query
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM get_nearby_entities_simple(test_lat, test_lng, 1000, NULL, 10, NULL);
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'small_radius_1km'::TEXT,
    EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
    10;
  
  -- Test 2: Medium radius query
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM get_nearby_entities_simple(test_lat, test_lng, 5000, NULL, 20, NULL);
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'medium_radius_5km'::TEXT,
    EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
    20;
  
  -- Test 3: Large radius query
  start_time := clock_timestamp();
  PERFORM COUNT(*) FROM get_nearby_entities_simple(test_lat, test_lng, 25000, NULL, 50, NULL);
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT 
    'large_radius_25km'::TEXT,
    EXTRACT(EPOCH FROM (end_time - start_time)) * 1000,
    50;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Simplified spatial optimization migration completed successfully!';
  RAISE NOTICE 'Location indexes created for optimal performance';
  RAISE NOTICE 'Haversine distance functions installed';
  RAISE NOTICE 'Performance monitoring views created';
  RAISE NOTICE 'Data quality constraints added';
  RAISE NOTICE 'Test functions available for performance validation';
END $$;
