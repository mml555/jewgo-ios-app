-- =============================================================================
-- POSTGIS OPTIMIZATION MIGRATION
-- =============================================================================
-- This migration adds PostGIS support and optimizes spatial queries for
-- server-side distance computation and location-based features.

-- =============================================================================
-- STEP 1: ADD POSTGIS EXTENSION
-- =============================================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- STEP 2: ADD SPATIAL COLUMNS TO ENTITIES
-- =============================================================================

-- Add PostGIS geography column for spatial indexing
ALTER TABLE entities_normalized 
ADD COLUMN IF NOT EXISTS geom GEOGRAPHY(Point, 4326);

-- Update existing records to populate the geometry column
UPDATE entities_normalized 
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL 
  AND longitude IS NOT NULL 
  AND geom IS NULL;

-- =============================================================================
-- STEP 3: CREATE SPATIAL INDEXES
-- =============================================================================

-- Create GIST index for spatial queries (most important for performance)
CREATE INDEX IF NOT EXISTS entities_normalized_geom_gix 
ON entities_normalized USING GIST (geom);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS entities_normalized_type_geom_gix 
ON entities_normalized (entity_type, geom) 
WHERE is_active = true;

-- Create index for bounding box queries
CREATE INDEX IF NOT EXISTS entities_normalized_bbox_gix 
ON entities_normalized USING GIST (ST_Envelope(geom::geometry))
WHERE geom IS NOT NULL;

-- =============================================================================
-- STEP 4: CREATE SPATIAL FUNCTIONS
-- =============================================================================

-- Function to get nearby entities with distance
CREATE OR REPLACE FUNCTION get_nearby_entities(
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
    -- Calculate distance in meters using PostGIS
    ST_DistanceSphere(
      e.geom::geometry,
      ST_MakePoint(user_lng, user_lat)
    ) as distance_m
  FROM entities_normalized e
  WHERE e.is_active = true
    AND e.geom IS NOT NULL
    AND ST_DWithin(
      e.geom,
      ST_MakePoint(user_lng, user_lat)::geography,
      radius_meters
    )
    AND (entity_type_filter IS NULL OR e.entity_type = entity_type_filter)
    AND (after_cursor IS NULL OR e.id > after_cursor)
  ORDER BY distance_m ASC, e.rating DESC, e.review_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get entities within bounding box (for map views)
CREATE OR REPLACE FUNCTION get_entities_in_bounds(
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
    AND e.geom IS NOT NULL
    AND e.latitude BETWEEN min_lat AND max_lat
    AND e.longitude BETWEEN min_lng AND max_lng
    AND (entity_type_filter IS NULL OR e.entity_type = entity_type_filter)
  ORDER BY e.rating DESC, e.review_count DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 5: CREATE TRIGGERS FOR GEOMETRY UPDATES
-- =============================================================================

-- Function to update geometry when coordinates change
CREATE OR REPLACE FUNCTION update_entity_geometry()
RETURNS TRIGGER AS $$
BEGIN
  -- Update geometry column when latitude or longitude changes
  IF (NEW.latitude IS DISTINCT FROM OLD.latitude) OR 
     (NEW.longitude IS DISTINCT FROM OLD.longitude) THEN
    
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSE
      NEW.geom = NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update geometry
DROP TRIGGER IF EXISTS update_entity_geometry_trigger ON entities_normalized;
CREATE TRIGGER update_entity_geometry_trigger
  BEFORE INSERT OR UPDATE ON entities_normalized
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_geometry();

-- =============================================================================
-- STEP 6: CREATE PERFORMANCE MONITORING VIEWS
-- =============================================================================

-- View for spatial query performance monitoring
CREATE OR REPLACE VIEW spatial_query_stats AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%geom%' OR indexname LIKE '%spatial%'
ORDER BY idx_scan DESC;

-- View for entity distribution by region
CREATE OR REPLACE VIEW entity_distribution AS
SELECT 
  entity_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) as with_coordinates,
  ROUND(
    COUNT(CASE WHEN geom IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 
    2
  ) as coordinate_coverage_percent
FROM entities_normalized
WHERE is_active = true
GROUP BY entity_type
ORDER BY total_count DESC;

-- =============================================================================
-- STEP 7: CREATE MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to analyze spatial indexes
CREATE OR REPLACE FUNCTION analyze_spatial_indexes()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  rec RECORD;
BEGIN
  -- Analyze all spatial indexes
  FOR rec IN 
    SELECT indexname 
    FROM pg_indexes 
    WHERE indexname LIKE '%geom%' OR indexname LIKE '%spatial%'
  LOOP
    EXECUTE 'ANALYZE ' || rec.indexname;
    result := result || 'Analyzed: ' || rec.indexname || E'\n';
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get spatial query performance metrics
CREATE OR REPLACE FUNCTION get_spatial_performance_metrics()
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
  WHERE is_active = true AND geom IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'spatial_index_size_mb'::TEXT,
    ROUND(
      SUM(pg_relation_size(indexname::regclass)) / 1024.0 / 1024.0, 
      2
    )::NUMERIC,
    'Total size of spatial indexes in MB'::TEXT
  FROM pg_indexes 
  WHERE indexname LIKE '%geom%' OR indexname LIKE '%spatial%';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- STEP 8: CREATE CONSTRAINTS FOR DATA QUALITY
-- =============================================================================

-- Add constraint to ensure valid coordinates
ALTER TABLE entities_normalized 
ADD CONSTRAINT check_valid_coordinates 
CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude IS NOT NULL AND longitude IS NOT NULL AND
   latitude BETWEEN -90 AND 90 AND
   longitude BETWEEN -180 AND 180)
);

-- Add constraint to ensure geometry matches coordinates
ALTER TABLE entities_normalized 
ADD CONSTRAINT check_geometry_consistency 
CHECK (
  (geom IS NULL AND (latitude IS NULL OR longitude IS NULL)) OR
  (geom IS NOT NULL AND latitude IS NOT NULL AND longitude IS NOT NULL)
);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'PostGIS optimization migration completed successfully!';
  RAISE NOTICE 'Spatial indexes created for optimal performance';
  RAISE NOTICE 'Spatial functions and triggers installed';
  RAISE NOTICE 'Performance monitoring views created';
  RAISE NOTICE 'Data quality constraints added';
END $$;
