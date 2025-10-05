# Normalized Entity Architecture

## Overview

This document describes the migration from a monolithic `entities` table to a properly normalized database architecture using the inheritance pattern. This change improves performance, data integrity, and maintainability.

## Architecture Comparison

### Before: Monolithic Table
```sql
-- Single table with many NULL columns
CREATE TABLE entities (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50),
    name VARCHAR(255),
    -- ... common fields ...
    -- Mikvah-specific fields (NULL for other types)
    kosher_level VARCHAR(50),
    price_per_use DECIMAL(10, 2),
    -- Synagogue-specific fields (NULL for other types)
    rabbi_name VARCHAR(255),
    congregation_size VARCHAR(50),
    -- Restaurant-specific fields (NULL for other types)
    cuisine_type VARCHAR(100),
    -- ... many more NULL columns
);
```

**Problems:**
- Data redundancy with many NULL columns
- Poor performance as table grows
- Difficult to add entity-specific features
- Maintenance complexity

### After: Normalized Inheritance Pattern
```sql
-- Core entity table (shared fields only)
CREATE TABLE entities_normalized (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50),
    name VARCHAR(255),
    -- ... only common fields ...
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Specialized tables (entity-specific fields only)
CREATE TABLE mikvahs_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id),
    kosher_level VARCHAR(50),
    price_per_use DECIMAL(10, 2)
    -- ... only mikvah-specific fields
);

CREATE TABLE synagogues_normalized (
    entity_id UUID PRIMARY KEY REFERENCES entities_normalized(id),
    rabbi_name VARCHAR(255),
    congregation_size VARCHAR(50)
    -- ... only synagogue-specific fields
);
```

**Benefits:**
- No data redundancy
- Better performance with smaller, focused tables
- Easy to add entity-specific features
- Proper data validation and constraints
- Scalable architecture

## Database Schema

### Core Tables

#### `entities_normalized`
Contains all shared fields across entity types:
- Basic information (name, description, address)
- Location data (latitude, longitude)
- Contact information (phone, email, website)
- Ratings and reviews
- Status flags (is_active, is_verified)
- Timestamps

#### Specialized Tables

##### `mikvahs_normalized`
- `kosher_level` - Glatt, chalav yisrael, regular
- `denomination` - Orthodox, conservative, reform, chabad
- Amenities (parking, accessibility, private rooms, etc.)
- Pricing (price_per_use, payment methods)
- Operating hours

##### `synagogues_normalized`
- `denomination` - Orthodox, conservative, reform, etc.
- `rabbi_name` - Name of the rabbi
- `congregation_size` - Small, medium, large, very large
- Amenities (parking, kosher kitchen, library, etc.)
- Services (daily minyan, shabbat services, etc.)

##### `restaurants_normalized`
- `kosher_level` - Glatt, chalav yisrael, regular, pas yisrael
- `kosher_certification` - OU, Chabad, etc.
- `cuisine_type` - Israeli, American, Sephardic, etc.
- `price_range` - $, $$, $$$, $$$$
- Amenities (parking, wifi, delivery, etc.)

##### `stores_normalized`
- `store_type` - Grocery, butcher, bakery, deli, etc.
- `kosher_level` - Glatt, chalav yisrael, regular, pas yisrael
- `kosher_certification` - Certification details
- Payment methods (cash, credit, checks)
- Services (delivery, parking)

## Data Access Patterns

### Using the Normalized Controller

The new `EntityControllerNormalized` provides optimized data access:

```javascript
// Get all entities with specialized data
const entities = await EntityControllerNormalized.getAllEntities(req, res);

// Get entities by type
const mikvahs = await EntityControllerNormalized.getEntitiesByType({
  params: { entityType: 'mikvah' }
}, res);

// Get single entity with all related data
const entity = await EntityControllerNormalized.getEntityById({
  params: { id: 'entity-uuid' }
}, res);

// Search entities
const results = await EntityControllerNormalized.searchEntities({
  query: { q: 'search term', entityType: 'restaurant' }
}, res);

// Get nearby entities with distance
const nearby = await EntityControllerNormalized.getNearbyEntities({
  query: { latitude: 40.7128, longitude: -74.0060, radius: 5 }
}, res);
```

### Database Queries

#### Get Entity with Specialized Data
```sql
-- Using the helper function
SELECT * FROM get_entity_with_details('entity-uuid');

-- Manual JOIN approach
SELECT 
  e.*,
  m.kosher_level,
  m.price_per_use
FROM entities_normalized e
LEFT JOIN mikvahs_normalized m ON e.id = m.entity_id
WHERE e.id = 'entity-uuid';
```

#### Get Entities by Type with Filters
```sql
SELECT 
  e.*,
  m.kosher_level,
  m.has_parking
FROM entities_normalized e
JOIN mikvahs_normalized m ON e.id = m.entity_id
WHERE e.entity_type = 'mikvah'
  AND e.city = 'Brooklyn'
  AND m.kosher_level = 'glatt'
ORDER BY e.rating DESC;
```

#### Distance-Based Queries
```sql
SELECT 
  e.*,
  (3959 * acos(
    cos(radians(40.7128)) * cos(radians(e.latitude)) * 
    cos(radians(e.longitude) - radians(-74.0060)) + 
    sin(radians(40.7128)) * sin(radians(e.latitude))
  )) as distance_miles
FROM entities_normalized e
WHERE e.latitude IS NOT NULL 
  AND e.longitude IS NOT NULL
ORDER BY distance_miles ASC;
```

## Performance Optimizations

### Indexes

The migration creates optimized indexes for common query patterns:

```sql
-- Core entity indexes
CREATE INDEX idx_entities_normalized_type ON entities_normalized(entity_type);
CREATE INDEX idx_entities_normalized_active ON entities_normalized(is_active) WHERE is_active = true;
CREATE INDEX idx_entities_normalized_location ON entities_normalized(latitude, longitude);
CREATE INDEX idx_entities_normalized_city_state ON entities_normalized(city, state);
CREATE INDEX idx_entities_normalized_rating ON entities_normalized(rating DESC);

-- Specialized table indexes
CREATE INDEX idx_mikvahs_normalized_kosher ON mikvahs_normalized(kosher_level);
CREATE INDEX idx_synagogues_normalized_denomination ON synagogues_normalized(denomination);
CREATE INDEX idx_restaurants_normalized_kosher ON restaurants_normalized(kosher_level);
CREATE INDEX idx_stores_normalized_type ON stores_normalized(store_type);
```

### Query Performance

Expected performance improvements:
- **50-70% faster** queries for entity-specific data
- **Reduced memory usage** due to smaller result sets
- **Better cache efficiency** with focused table structures
- **Faster index scans** with smaller, specialized indexes

## Data Integrity

### Constraints

The normalized structure includes proper constraints:

```sql
-- Entity type validation
ALTER TABLE entities_normalized 
ADD CONSTRAINT check_entity_type 
CHECK (entity_type IN ('mikvah', 'synagogue', 'restaurant', 'store', 'job'));

-- Kosher level validation
ALTER TABLE mikvahs_normalized 
ADD CONSTRAINT check_kosher_level 
CHECK (kosher_level IN ('glatt', 'chalav_yisrael', 'regular'));

-- Denomination validation
ALTER TABLE synagogues_normalized 
ADD CONSTRAINT check_denomination 
CHECK (denomination IN ('orthodox', 'conservative', 'reform', 'chabad', 'reconstructionist'));
```

### Triggers

Data consistency triggers ensure integrity:

```sql
-- Validate entity type matches specialized table
CREATE TRIGGER validate_mikvah_consistency 
BEFORE INSERT OR UPDATE ON mikvahs_normalized 
FOR EACH ROW EXECUTE FUNCTION validate_entity_consistency();

-- Auto-update timestamps
CREATE TRIGGER update_entities_normalized_updated_at 
BEFORE UPDATE ON entities_normalized 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Migration Process

### 1. Backup Existing Data
```bash
# Create full backup
pg_dump -h localhost -U postgres -d jewgo_app --table=entities --data-only > backup_entities.sql
```

### 2. Run Migration
```bash
# Execute migration script
./scripts/migrate-to-normalized-architecture.sh
```

### 3. Validate Migration
- Check data integrity
- Verify all entities migrated
- Test API endpoints
- Validate specialized data

### 4. Update Application Code
- Controllers updated to use normalized structure
- Frontend code remains compatible
- Backward compatibility maintained

## Backward Compatibility

### Unified View

A view provides backward compatibility:

```sql
CREATE VIEW entities_unified AS
SELECT 
  e.*,
  m.kosher_level as mikvah_kosher_level,
  s.rabbi_name,
  r.cuisine_type,
  st.store_type
FROM entities_normalized e
LEFT JOIN mikvahs_normalized m ON e.id = m.entity_id
LEFT JOIN synagogues_normalized s ON e.id = s.entity_id
LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
LEFT JOIN stores_normalized st ON e.id = st.entity_id;
```

### API Compatibility

The API maintains the same response format:
- Same JSON structure
- Same field names
- Same endpoints
- Enhanced with specialized data

## Monitoring and Maintenance

### Performance Monitoring

Monitor these metrics:
- Query execution times
- Index usage statistics
- Table sizes and growth
- Cache hit ratios

### Maintenance Tasks

Regular maintenance:
- Update table statistics
- Rebuild indexes if needed
- Monitor constraint violations
- Clean up orphaned records

### Scaling Considerations

Future scaling options:
- Partition large tables by region
- Add read replicas for heavy queries
- Implement caching layers
- Consider NoSQL for specialized data

## Troubleshooting

### Common Issues

1. **Missing Specialized Data**
   - Check entity_type consistency
   - Verify foreign key relationships
   - Run data validation queries

2. **Performance Issues**
   - Check index usage
   - Analyze query plans
   - Monitor table statistics

3. **Data Integrity Problems**
   - Check constraint violations
   - Validate trigger functions
   - Review data migration logs

### Diagnostic Queries

```sql
-- Check data consistency
SELECT 
  e.entity_type,
  COUNT(*) as total_entities,
  COUNT(m.entity_id) as with_mikvah_data,
  COUNT(s.entity_id) as with_synagogue_data,
  COUNT(r.entity_id) as with_restaurant_data,
  COUNT(st.entity_id) as with_store_data
FROM entities_normalized e
LEFT JOIN mikvahs_normalized m ON e.id = m.entity_id
LEFT JOIN synagogues_normalized s ON e.id = s.entity_id
LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
LEFT JOIN stores_normalized st ON e.id = st.entity_id
GROUP BY e.entity_type;

-- Check for orphaned records
SELECT 'mikvahs' as table_name, COUNT(*) as orphaned_count
FROM mikvahs_normalized m
LEFT JOIN entities_normalized e ON m.entity_id = e.id
WHERE e.id IS NULL
UNION ALL
SELECT 'synagogues', COUNT(*)
FROM synagogues_normalized s
LEFT JOIN entities_normalized e ON s.entity_id = e.id
WHERE e.id IS NULL;

-- Performance analysis
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE tablename LIKE '%normalized%'
ORDER BY tablename, attname;
```

## Conclusion

The normalized architecture provides:
- **Better Performance** - Optimized queries and indexes
- **Data Integrity** - Proper constraints and validation
- **Maintainability** - Clear separation of concerns
- **Scalability** - Easy to extend and modify
- **Backward Compatibility** - Existing code continues to work

This migration transforms the database from a monolithic structure to a properly normalized, scalable architecture that follows database design best practices.
