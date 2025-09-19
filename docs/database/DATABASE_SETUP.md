# Jewgo Database Setup Guide

This guide covers the complete setup of the PostgreSQL database for the Jewgo application, including schema design, sample data, and API integration.

## Overview

The Jewgo database is designed to support a comprehensive directory of Jewish businesses and institutions, including restaurants, synagogues, mikvahs, and stores. The database uses PostgreSQL with **category-specific tables** that provide optimized performance and maintainability while supporting enhanced data features.

## Architecture

### Database Schema

The database uses **category-specific tables** where each business type (restaurants, synagogues, mikvahs, stores) has its own dedicated table. This design provides:

- **Optimized Performance**: Category-specific queries without type filtering
- **Enhanced Data**: Rich business hours, images, and reviews for each listing
- **Dedicated Controllers**: Specialized API endpoints for each category
- **Scalable Design**: Easy to add new categories and features

### Core Tables

1. **restaurants** - Restaurant listings with kosher details
2. **synagogues** - Synagogue listings with denomination info
3. **mikvahs** - Mikvah listings with privacy and services
4. **stores** - Store listings with product types
5. **users** - User accounts and business owners
6. **business_hours** - Operating hours for each entity (all categories)
7. **reviews** - User reviews and ratings (all categories)
8. **images** - Photos and media for entities (all categories)
9. **favorites** - User's favorite listings
10. **search_history** - Search analytics and user behavior

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for backend API)
- PostgreSQL client tools (optional, for direct database access)

### 1. Start the Database

```bash
# Start PostgreSQL, Redis, and MailHog services
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Verify Database Connection

```bash
# Test database connection
docker exec jewgo_postgres psql -U jewgo_user -d jewgo_dev -c "SELECT COUNT(*) FROM entities;"

# Expected output: count showing number of sample entities
```

### 3. Start the Backend API

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the API server
npm start

# The API will be available at http://localhost:3001
```

### 4. Test API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Get all entities
curl "http://localhost:3001/api/v5/entities?limit=5"

# Get restaurants only
curl "http://localhost:3001/api/v5/restaurants?limit=3"

# Search entities
curl "http://localhost:3001/api/v5/search?q=kosher&limit=5"
```

## Database Schema Details

### Entity Types

The system supports four main entity types:

#### Restaurants
- **Kosher Level**: glatt, chalav_yisrael, pas_yisrael, mehadrin, regular
- **Certification**: OU, Chabad, local rabbinical authority
- **Special Features**: Catering, delivery, takeout, outdoor seating

#### Synagogues
- **Denomination**: orthodox, conservative, reform, reconstructionist, chabad, sephardic, ashkenazi
- **Services**: Daily minyan, Shabbat services, youth programs, adult education
- **Capacity**: Seating capacity, accessibility features

#### Mikvahs
- **Privacy**: Individual rooms, appointment scheduling
- **Services**: Preparation rooms, supplies, attendant assistance
- **Hours**: Extended hours, emergency access

#### Stores
- **Store Type**: grocery, butcher, bakery, deli, market, specialty
- **Products**: Fresh produce, packaged goods, prepared foods
- **Services**: Delivery, catering, special orders

### Key Fields

#### Common Fields (All Entities)
- `id` - UUID primary key
- `entity_type` - restaurant, synagogue, mikvah, store
- `name` - Business name
- `description` - Short description
- `long_description` - Detailed description
- `address`, `city`, `state`, `zip_code` - Location
- `phone`, `email`, `website` - Contact information
- `latitude`, `longitude` - GPS coordinates
- `rating` - Average rating (1-5)
- `review_count` - Number of reviews
- `is_verified` - Verification status
- `is_active` - Active/disabled status

#### Type-Specific Fields
- **Restaurants**: `kosher_level`, `kosher_certification`, `kosher_certificate_number`, `kosher_expires_at`
- **Synagogues**: `denomination`, `services` (array)
- **Stores**: `store_type`, `kosher_level`, `kosher_certification`

## API Endpoints

### Base URL
```
http://localhost:3001/api/v5
```

### Available Endpoints

#### Category-Specific Endpoints (Enhanced Data)
- `GET /restaurants` - Get restaurants with business hours, images, and reviews
- `GET /restaurants/:id` - Get specific restaurant with full details
- `GET /synagogues` - Get synagogues with business hours, images, and reviews
- `GET /synagogues/:id` - Get specific synagogue with full details
- `GET /mikvahs` - Get mikvahs with business hours, images, and reviews
- `GET /mikvahs/:id` - Get specific mikvah with full details
- `GET /stores` - Get stores with business hours, images, and reviews
- `GET /stores/:id` - Get specific store with full details

#### Reviews Endpoints
- `GET /reviews/entity/:entityId` - Get reviews for a specific entity
- `POST /reviews/entity/:entityId` - Create a new review for an entity
- `GET /reviews` - Get all reviews with filtering

#### Health Check
- `GET /health` - API health status

### Query Parameters

#### Filtering
- `entityType` - Filter by entity type
- `city` - Filter by city
- `state` - Filter by state
- `kosherLevel` - Filter by kosher level
- `denomination` - Filter by denomination (synagogues)
- `storeType` - Filter by store type
- `isVerified` - Filter by verification status
- `minRating` - Minimum rating filter

#### Pagination
- `limit` - Number of results (default: 50)
- `offset` - Number of results to skip (default: 0)

#### Sorting
- `sortBy` - Field to sort by (default: created_at)
- `sortOrder` - asc or desc (default: desc)

#### Location
- `latitude` - User's latitude for nearby search
- `longitude` - User's longitude for nearby search
- `radius` - Search radius in kilometers (default: 10)

### Example API Calls

```bash
# Get all restaurants in Brooklyn
curl "http://localhost:3001/api/v5/restaurants?city=Brooklyn&state=NY"

# Search for kosher restaurants
curl "http://localhost:3001/api/v5/search?q=kosher&entityType=restaurant"

# Get nearby synagogues
curl "http://localhost:3001/api/v5/synagogues/nearby?latitude=40.6782&longitude=-73.9442&radius=5"

# Get verified stores with high ratings
curl "http://localhost:3001/api/v5/stores?isVerified=true&minRating=4.0"
```

## Sample Data

The database includes **80+ enhanced entities** across all categories:

- **20+ Restaurants**: Woodmere Wraps, Brooklyn Kosher Delight, Jerusalem Grill, Chabad House Cafe, Mazel Tov Bakery, Sephardic Kitchen, and more
- **20+ Synagogues**: Woodmere Synagogue, Congregation Beth Israel, Temple Emanuel, Chabad Lubavitch, Reform Temple Sinai, Sephardic Center, and more
- **20+ Mikvahs**: Seaford Mikvah, Community Mikvah Center, Chabad Mikvah, Temple Mikvah, Sephardic Mikvah, and more
- **20+ Stores**: Woodmere Wine Shop, Kosher World Market, Glatt Kosher Butcher, Challah Corner Bakery, Gourmet Kosher Deli, and more

### Enhanced Data Features

Each entity now includes **complete enhanced data**:

#### Business Hours
- **7 days of the week** with realistic Jewish business hours
- **Shabbat-aware scheduling** (early Friday close, Saturday evening open)
- **Holiday considerations** and special hours

#### Images
- **4 high-quality stock images** per listing from Unsplash
- **Primary image** for main display
- **Additional images** for galleries and detail views
- **Professional photography** showing interior/exterior views

#### Reviews
- **10 authentic reviews** per listing with varied ratings (1-5 stars)
- **Realistic review content** with specific details
- **User attribution** with first and last names
- **Verification status** for review authenticity

#### Location Data
- **Accurate coordinates** for GPS mapping
- **Real addresses** in Jewish communities
- **Distance calculations** for nearby search

## Environment Configuration

### Development Environment (.env.development)
```env
NODE_ENV=development
API_BASE_URL=http://localhost:3001/api/v5
DB_HOST=localhost
DB_PORT=5433
DB_NAME=jewgo_dev
DB_USER=jewgo_user
DB_PASSWORD=jewgo_dev_password
DB_SSL=false
```

### Database Connection Details
- **Host**: localhost
- **Port**: 5433 (mapped from container port 5432)
- **Database**: jewgo_dev
- **Username**: jewgo_user
- **Password**: jewgo_dev_password

## Frontend Integration

### React Native Configuration

Update your React Native app's configuration to use the local API:

```typescript
// src/config/ConfigService.ts
const config = {
  apiBaseUrl: __DEV__ ? 'http://localhost:3001/api/v5' : 'https://api.jewgo.app/api/v5'
};
```

### API Service Usage

```typescript
import { apiV5Service } from './src/services/api-v5';

// Get restaurants
const restaurants = await apiV5Service.getEntities('restaurants', {
  limit: 20,
  city: 'Brooklyn',
  kosherLevel: 'glatt'
});

// Search entities
const results = await apiV5Service.search({
  query: 'kosher',
  filters: { entityType: 'restaurant' },
  latitude: 40.6782,
  longitude: -73.9442,
  radius: 5
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Docker containers are running: `docker-compose ps`
   - Check database logs: `docker logs jewgo_postgres`
   - Ensure port 5433 is not in use

2. **API Server Won't Start**
   - Check if port 3001 is available: `lsof -i :3001`
   - Verify environment variables are loaded
   - Check server logs for error messages

3. **No Data Returned**
   - Verify sample data was loaded: `docker exec jewgo_postgres psql -U jewgo_user -d jewgo_dev -c "SELECT COUNT(*) FROM entities;"`
   - Check database connection from API
   - Verify query parameters are correct

### Useful Commands

```bash
# View database logs
docker logs jewgo_postgres

# Connect to database directly
docker exec -it jewgo_postgres psql -U jewgo_user -d jewgo_dev

# Restart all services
docker-compose restart

# Reset database (removes all data)
docker-compose down
docker volume rm jewgoappfinal_postgres_data
docker-compose up -d
```

## Performance Considerations

### Indexing Strategy
- Primary indexes on `entity_type`, `city`, `state`
- Location indexes on `latitude`, `longitude`
- Performance indexes on `is_active`, `is_verified`, `rating`
- Composite indexes for common query patterns

### Query Optimization
- Use appropriate filters to limit result sets
- Implement pagination for large datasets
- Cache frequently accessed data
- Use prepared statements for repeated queries

## Security Notes

- Database uses trust authentication for local development
- API includes rate limiting (100 requests per 15 minutes)
- Input validation and sanitization on all endpoints
- CORS configured for specific origins only
- Environment variables for sensitive configuration

## Next Steps

1. **Production Setup**: Configure production database with proper security
2. **Authentication**: Implement user authentication and authorization
3. **File Uploads**: Add image upload functionality for entity photos
4. **Real-time Updates**: Implement WebSocket connections for live updates
5. **Analytics**: Add comprehensive analytics and reporting
6. **Mobile Optimization**: Optimize API responses for mobile devices

## Support

For issues or questions about the database setup:
1. Check the troubleshooting section above
2. Review the API logs for error messages
3. Verify all prerequisites are installed
4. Ensure all services are running properly
