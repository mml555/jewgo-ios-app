# Jewgo Database Schema Documentation

Complete database schema documentation for the Jewgo V5 system with category-specific tables and enhanced data features.

## Overview

The Jewgo database uses PostgreSQL with **category-specific tables** for optimized performance and maintainability. Each business type (restaurants, synagogues, mikvahs, stores) has its own dedicated table with specialized fields, while shared data (business hours, images, reviews) uses separate tables with foreign key relationships.

## Database Architecture

### Table Structure
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   restaurants   │    │  business_hours  │    │     images      │
│   synagogues    │◄───┤                  │◄───┤                 │
│   mikvahs       │    │  entity_id (FK)  │    │  entity_id (FK) │
│   stores        │    │  day_of_week     │    │  url, alt_text  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐            │
         └──────────────┤     reviews      │◄───────────┘
                        │                  │
                        │  entity_id (FK)  │
                        │  user_id (FK)    │
                        └──────────────────┘
```

## Core Tables

### Category-Specific Tables

#### restaurants
Primary table for restaurant listings with kosher-specific fields.

```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    twitter_url VARCHAR(255),
    whatsapp_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    youtube_url VARCHAR(255),
    snapchat_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Restaurant-specific fields
    kosher_level VARCHAR(50),
    kosher_certification VARCHAR(100),
    kosher_certificate_number VARCHAR(100),
    kosher_expires_at TIMESTAMP,
    cuisine_type VARCHAR(100),
    price_range VARCHAR(20),
    has_delivery BOOLEAN DEFAULT false,
    has_takeout BOOLEAN DEFAULT false,
    has_catering BOOLEAN DEFAULT false,
    
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### synagogues
Primary table for synagogue listings with denomination-specific fields.

```sql
CREATE TABLE synagogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    twitter_url VARCHAR(255),
    whatsapp_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    youtube_url VARCHAR(255),
    snapchat_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Synagogue-specific fields
    denomination VARCHAR(100),
    services TEXT[], -- Array of services offered
    capacity INTEGER,
    accessibility_features TEXT[],
    
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### mikvahs
Primary table for mikvah listings with privacy and service-specific fields.

```sql
CREATE TABLE mikvahs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    twitter_url VARCHAR(255),
    whatsapp_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    youtube_url VARCHAR(255),
    snapchat_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Mikvah-specific fields
    privacy_level VARCHAR(50), -- private_rooms, shared, etc.
    services TEXT[], -- preparation_rooms, supplies, attendant_assistance
    appointment_required BOOLEAN DEFAULT false,
    emergency_access BOOLEAN DEFAULT false,
    
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### stores
Primary table for store listings with product type-specific fields.

```sql
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    long_description TEXT,
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    facebook_url VARCHAR(255),
    instagram_url VARCHAR(255),
    twitter_url VARCHAR(255),
    whatsapp_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    youtube_url VARCHAR(255),
    snapchat_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Store-specific fields
    store_type VARCHAR(100), -- grocery, butcher, bakery, deli, market, specialty
    kosher_level VARCHAR(50),
    kosher_certification VARCHAR(100),
    products TEXT[], -- fresh_produce, packaged_goods, prepared_foods
    has_delivery BOOLEAN DEFAULT false,
    has_catering BOOLEAN DEFAULT false,
    
    owner_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Shared Data Tables

#### business_hours
Operating hours for all entity types.

```sql
CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, -- References any category table
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### images
Photos and media for all entity types.

```sql
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, -- References any category table
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### reviews
User reviews and ratings for all entity types.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, -- References any category table
    user_id UUID NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_moderated BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### users
User accounts and business owners.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### favorites
User's favorite listings.

```sql
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    entity_id UUID NOT NULL, -- References any category table
    entity_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entity_id, entity_type)
);
```

#### search_history
Search analytics and user behavior.

```sql
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    query VARCHAR(255) NOT NULL,
    filters JSONB,
    results_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes

### Performance Indexes

```sql
-- Category tables
CREATE INDEX idx_restaurants_city_state ON restaurants(city, state);
CREATE INDEX idx_restaurants_kosher_level ON restaurants(kosher_level);
CREATE INDEX idx_restaurants_active ON restaurants(is_active);
CREATE INDEX idx_restaurants_verified ON restaurants(is_verified);
CREATE INDEX idx_restaurants_location ON restaurants(latitude, longitude);

CREATE INDEX idx_synagogues_denomination ON synagogues(denomination);
CREATE INDEX idx_synagogues_city_state ON synagogues(city, state);
CREATE INDEX idx_synagogues_active ON synagogues(is_active);

CREATE INDEX idx_mikvahs_city_state ON mikvahs(city, state);
CREATE INDEX idx_mikvahs_active ON mikvahs(is_active);

CREATE INDEX idx_stores_type ON stores(store_type);
CREATE INDEX idx_stores_city_state ON stores(city, state);
CREATE INDEX idx_stores_active ON stores(is_active);

-- Shared tables
CREATE INDEX idx_business_hours_entity ON business_hours(entity_id);
CREATE INDEX idx_images_entity ON images(entity_id);
CREATE INDEX idx_images_primary ON images(entity_id, is_primary);
CREATE INDEX idx_reviews_entity ON reviews(entity_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_search_history_user ON search_history(user_id);
```

### Composite Indexes

```sql
-- Common query patterns
CREATE INDEX idx_restaurants_city_kosher_active ON restaurants(city, kosher_level, is_active);
CREATE INDEX idx_synagogues_city_denomination_active ON synagogues(city, denomination, is_active);
CREATE INDEX idx_stores_city_type_active ON stores(city, store_type, is_active);

-- Location-based searches
CREATE INDEX idx_restaurants_location_active ON restaurants(latitude, longitude, is_active);
CREATE INDEX idx_synagogues_location_active ON synagogues(latitude, longitude, is_active);
CREATE INDEX idx_mikvahs_location_active ON mikvahs(latitude, longitude, is_active);
CREATE INDEX idx_stores_location_active ON stores(latitude, longitude, is_active);
```

## Enums and Constraints

### Day of Week Enum
```sql
CREATE TYPE day_of_week AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
```

### Kosher Level Enum
```sql
CREATE TYPE kosher_level AS ENUM ('glatt', 'chalav_yisrael', 'pas_yisrael', 'mehadrin', 'regular');
```

### Denomination Enum
```sql
CREATE TYPE denomination AS ENUM ('orthodox', 'conservative', 'reform', 'reconstructionist', 'chabad', 'sephardic', 'ashkenazi');
```

### Store Type Enum
```sql
CREATE TYPE store_type AS ENUM ('grocery', 'butcher', 'bakery', 'deli', 'market', 'specialty');
```

## Data Relationships

### Foreign Key Constraints

```sql
-- Business hours can reference any entity table
-- Note: PostgreSQL doesn't support cross-table foreign keys directly
-- We rely on application-level validation

-- Images can reference any entity table
-- Note: Same limitation as business_hours

-- Reviews can reference any entity table
-- Note: Same limitation as business_hours

-- Favorites can reference any entity table
-- Note: Same limitation as business_hours

-- Direct foreign keys
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE favorites ADD CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE search_history ADD CONSTRAINT fk_search_history_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Owner relationships
ALTER TABLE restaurants ADD CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id);
ALTER TABLE synagogues ADD CONSTRAINT fk_synagogues_owner FOREIGN KEY (owner_id) REFERENCES users(id);
ALTER TABLE mikvahs ADD CONSTRAINT fk_mikvahs_owner FOREIGN KEY (owner_id) REFERENCES users(id);
ALTER TABLE stores ADD CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id);
```

## Sample Data Structure

### Current Data Volume
- **80+ restaurants** with complete enhanced data
- **80+ synagogues** with complete enhanced data
- **80+ mikvahs** with complete enhanced data
- **80+ stores** with complete enhanced data
- **320+ business hours records** (7 days × 80+ entities per category)
- **1,280+ images** (4 images × 320+ entities)
- **1,600+ reviews** (10 reviews × 160+ entities)

### Enhanced Data Features
Each entity includes:
- **7 business hours** (one for each day of the week)
- **4 stock images** from Unsplash with professional quality
- **10 reviews** with varied ratings (1-5 stars) and realistic content
- **Complete location data** with accurate coordinates
- **Kosher certification details** where applicable

## Database Functions and Triggers

### Update Timestamp Trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_synagogues_updated_at BEFORE UPDATE ON synagogues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mikvahs_updated_at BEFORE UPDATE ON mikvahs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Rating Calculation Function
```sql
CREATE OR REPLACE FUNCTION calculate_entity_rating(entity_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT ROUND(AVG(rating)::DECIMAL(3,2), 2)
    INTO avg_rating
    FROM reviews
    WHERE entity_id = entity_uuid AND is_moderated = true;
    
    RETURN COALESCE(avg_rating, 0.0);
END;
$$ LANGUAGE plpgsql;
```

## Performance Optimization

### Query Optimization Strategies

1. **Category-Specific Queries**: Use dedicated table queries instead of filtering by type
2. **Selective Loading**: Load only required fields for list views
3. **Efficient JOINs**: Use proper indexes for related data queries
4. **Pagination**: Implement proper LIMIT/OFFSET for large result sets
5. **Caching**: Cache frequently accessed data at application level

### Recommended Query Patterns

```sql
-- Get restaurants with enhanced data
SELECT r.*, 
       COUNT(DISTINCT bh.id) as hours_count,
       COUNT(DISTINCT img.id) as images_count,
       COUNT(DISTINCT rev.id) as reviews_count
FROM restaurants r
LEFT JOIN business_hours bh ON bh.entity_id = r.id
LEFT JOIN images img ON img.entity_id = r.id
LEFT JOIN reviews rev ON rev.entity_id = r.id AND rev.is_moderated = true
WHERE r.is_active = true
GROUP BY r.id
ORDER BY r.created_at DESC
LIMIT 50;

-- Get nearby entities with distance calculation
SELECT *, 
       (6371 * acos(cos(radians(40.7128)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(-74.0060)) + 
        sin(radians(40.7128)) * sin(radians(latitude)))) AS distance
FROM restaurants
WHERE is_active = true
  AND latitude BETWEEN 40.7128 - 0.1 AND 40.7128 + 0.1
  AND longitude BETWEEN -74.0060 - 0.1 AND -74.0060 + 0.1
ORDER BY distance
LIMIT 20;
```

## Maintenance and Monitoring

### Regular Maintenance Tasks

1. **Index Maintenance**: Monitor and rebuild indexes as needed
2. **Statistics Updates**: Keep table statistics current
3. **Vacuum Operations**: Regular VACUUM and ANALYZE
4. **Performance Monitoring**: Track query performance and slow queries
5. **Data Validation**: Ensure referential integrity

### Monitoring Queries

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Security Considerations

### Access Control
- Database users with minimal required permissions
- Application-level authentication and authorization
- Encrypted connections (SSL/TLS)
- Regular security updates

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- Sensitive data encryption
- Regular backups with encryption

## Backup and Recovery

### Backup Strategy
```bash
# Full database backup
pg_dump -h localhost -p 5433 -U jewgo_user -d jewgo_dev > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema-only backup
pg_dump -h localhost -p 5433 -U jewgo_user -d jewgo_dev --schema-only > schema_backup.sql

# Data-only backup
pg_dump -h localhost -p 5433 -U jewgo_user -d jewgo_dev --data-only > data_backup.sql
```

### Recovery Procedures
```bash
# Restore from backup
psql -h localhost -p 5433 -U jewgo_user -d jewgo_dev < backup_file.sql

# Restore schema only
psql -h localhost -p 5433 -U jewgo_user -d jewgo_dev < schema_backup.sql

# Restore data only
psql -h localhost -p 5433 -U jewgo_user -d jewgo_dev < data_backup.sql
```

This schema provides a robust foundation for the Jewgo application with optimized performance, comprehensive data relationships, and enhanced features for all business categories.
