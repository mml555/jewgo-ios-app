# Jewgo API Documentation

Complete API documentation for the Jewgo V5 backend system with enhanced data features.

## Overview

The Jewgo API provides comprehensive access to Jewish business listings including restaurants, synagogues, mikvahs, and stores. Each category has dedicated endpoints that return enhanced data including business hours, images, and reviews.

## Base Configuration

### Base URL
```
http://localhost:3001/api/v5
```

### Authentication
Currently no authentication required for development. Production will implement JWT-based authentication.

### Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination info (for list endpoints)
  }
}
```

## Category-Specific Endpoints

### Restaurants

#### GET /restaurants
Get all restaurants with enhanced data.

**Query Parameters:**
- `limit` (number, default: 50) - Number of results
- `offset` (number, default: 0) - Number of results to skip
- `city` (string) - Filter by city
- `state` (string) - Filter by state
- `kosherLevel` (string) - Filter by kosher level
- `cuisineType` (string) - Filter by cuisine type
- `priceRange` (string) - Filter by price range
- `hasDelivery` (boolean) - Filter by delivery availability
- `hasTakeout` (boolean) - Filter by takeout availability
- `hasCatering` (boolean) - Filter by catering availability
- `isVerified` (boolean) - Filter by verification status
- `minRating` (number) - Minimum rating filter
- `sortBy` (string, default: created_at) - Sort field
- `sortOrder` (string, default: DESC) - Sort direction

**Response:**
```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "uuid",
        "name": "Restaurant Name",
        "description": "Short description",
        "long_description": "Detailed description",
        "address": "123 Main St",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11201",
        "phone": "(555) 123-4567",
        "email": "info@restaurant.com",
        "website": "https://restaurant.com",
        "latitude": "40.6782",
        "longitude": "-73.9442",
        "rating": "4.5",
        "review_count": 42,
        "is_verified": true,
        "is_active": true,
        "kosher_level": "glatt",
        "kosher_certification": "OU",
        "kosher_certificate_number": "OU12345",
        "kosher_expires_at": "2024-12-31",
        "cuisine_type": "Israeli",
        "price_range": "$$",
        "has_delivery": true,
        "has_takeout": true,
        "has_catering": false,
        "created_at": "2025-09-16T02:40:11.615Z",
        "updated_at": "2025-09-16T02:40:11.615Z",
        "business_hours": [
          {
            "day_of_week": "sunday",
            "open_time": "09:00:00",
            "close_time": "21:00:00",
            "is_closed": false
          }
          // ... 6 more days
        ],
        "images": [
          {
            "id": "uuid",
            "url": "https://images.unsplash.com/photo-1234567890",
            "alt_text": "Restaurant interior",
            "is_primary": true,
            "sort_order": 1
          }
          // ... 3 more images
        ],
        "recent_reviews": [
          {
            "id": "uuid",
            "rating": 5,
            "title": "Excellent food!",
            "content": "Amazing kosher restaurant with great service.",
            "is_verified": true,
            "created_at": "2025-09-15T10:30:00.000Z",
            "first_name": "Sarah",
            "last_name": "Cohen"
          }
          // ... 4 more reviews
        ]
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 25,
      "page": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### GET /restaurants/:id
Get a specific restaurant with full details.

**Response:** Same structure as list endpoint but with single entity in `data.entity`.

### Synagogues

#### GET /synagogues
Get all synagogues with enhanced data.

**Query Parameters:** Similar to restaurants, plus:
- `denomination` (string) - Filter by denomination

**Response:** Similar structure to restaurants with synagogue-specific fields:
```json
{
  "denomination": "orthodox",
  "services": ["daily_minyan", "shabbat_services", "youth_programs"]
}
```

#### GET /synagogues/:id
Get a specific synagogue with full details.

### Mikvahs

#### GET /mikvahs
Get all mikvahs with enhanced data.

**Query Parameters:** Similar to other categories, plus mikvah-specific filters.

**Response:** Similar structure with mikvah-specific fields:
```json
{
  "privacy_level": "private_rooms",
  "services": ["preparation_rooms", "supplies", "attendant_assistance"]
}
```

#### GET /mikvahs/:id
Get a specific mikvah with full details.

### Stores

#### GET /stores
Get all stores with enhanced data.

**Query Parameters:** Similar to other categories, plus:
- `storeType` (string) - Filter by store type

**Response:** Similar structure with store-specific fields:
```json
{
  "store_type": "grocery",
  "kosher_level": "glatt",
  "kosher_certification": "OU"
}
```

#### GET /stores/:id
Get a specific store with full details.

## Reviews Endpoints

### GET /reviews/entity/:entityId
Get reviews for a specific entity.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Reviews per page

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "rating": 5,
        "title": "Great experience",
        "content": "Excellent service and quality.",
        "is_verified": true,
        "created_at": "2025-09-15T10:30:00.000Z",
        "first_name": "David",
        "last_name": "Levy"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### POST /reviews/entity/:entityId
Create a new review for an entity.

**Request Body:**
```json
{
  "rating": 5,
  "title": "Great experience",
  "content": "Excellent service and quality.",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "uuid",
      "rating": 5,
      "title": "Great experience",
      "content": "Excellent service and quality.",
      "is_verified": false,
      "created_at": "2025-09-16T10:30:00.000Z",
      "first_name": "David",
      "last_name": "Levy"
    },
    "listing": {
      "id": "entity-uuid",
      "title": "Restaurant Name",
      "rating": "4.6",
      "review_count": 43
    }
  }
}
```

## Health Check

### GET /health
Check API health status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-16T10:30:00.000Z",
    "version": "5.0.0",
    "database": "connected"
  }
}
```

## Field Mappings

### Backend to Frontend Transformation

The API service transforms backend entity data to frontend-compatible format:

#### Business Hours Mapping
```typescript
// Backend format
{
  "day_of_week": "sunday",
  "open_time": "09:00:00",
  "close_time": "21:00:00",
  "is_closed": false
}

// Frontend format
{
  "day_of_week": 0,  // 0=sunday, 1=monday, etc.
  "open_time": "09:00:00",
  "close_time": "21:00:00",
  "is_closed": false
}
```

#### Images Mapping
```typescript
// Backend format
{
  "images": [
    {
      "id": "uuid",
      "url": "https://images.unsplash.com/photo-123",
      "alt_text": "Restaurant image",
      "is_primary": true,
      "sort_order": 1
    }
  ]
}

// Frontend format
{
  "images": ["https://images.unsplash.com/photo-123"]
}
```

#### Entity Type Mapping
```typescript
// Category key mapping
const categoryToEntityType = {
  'mikvah': 'mikvah',
  'eatery': 'restaurant',
  'shul': 'synagogue',
  'stores': 'store',
  'shuk': 'store'
};
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (entity not found)
- `500` - Internal Server Error

### Example Error Responses
```json
// 404 Not Found
{
  "success": false,
  "error": "Restaurant not found"
}

// 400 Bad Request
{
  "success": false,
  "error": "Invalid query parameters",
  "message": "limit must be a positive integer"
}
```

## Rate Limiting

- **Development**: No rate limiting
- **Production**: 100 requests per 15 minutes per IP

## CORS Configuration

- **Development**: All origins allowed
- **Production**: Specific origins only

## Usage Examples

### Frontend Integration

```typescript
import { apiV5Service } from './services/api-v5';

// Get restaurants with enhanced data
const restaurants = await apiV5Service.getEntities('restaurant', {
  limit: 20,
  city: 'Brooklyn',
  kosherLevel: 'glatt'
});

// Get specific restaurant details
const restaurant = await apiV5Service.getEntity('restaurant', 'restaurant-id');

// Get reviews for a restaurant
const reviews = await apiV5Service.getReviews({
  entityId: 'restaurant-id',
  page: 1,
  limit: 10
});

// Create a new review
const newReview = await apiV5Service.createReview({
  entityId: 'restaurant-id',
  entityType: 'restaurant',
  rating: 5,
  title: 'Great experience',
  content: 'Excellent food and service!',
  userId: 'user-id'
});
```

### cURL Examples

```bash
# Get all restaurants
curl "http://localhost:3001/api/v5/restaurants?limit=5"

# Get restaurants in Brooklyn
curl "http://localhost:3001/api/v5/restaurants?city=Brooklyn&state=NY"

# Get glatt kosher restaurants
curl "http://localhost:3001/api/v5/restaurants?kosherLevel=glatt"

# Get specific restaurant
curl "http://localhost:3001/api/v5/restaurants/restaurant-id"

# Get reviews for a restaurant
curl "http://localhost:3001/api/v5/reviews/entity/restaurant-id"

# Health check
curl "http://localhost:3001/api/v5/health"
```

## Performance Considerations

### Database Optimization
- Indexed fields: `entity_type`, `city`, `state`, `is_active`, `is_verified`
- Location indexes on `latitude`, `longitude`
- Composite indexes for common query patterns

### Response Optimization
- Pagination for large result sets
- Selective field loading
- Efficient JOIN queries for related data
- Caching for frequently accessed data

### Best Practices
- Use appropriate filters to limit result sets
- Implement client-side caching
- Use pagination for large datasets
- Cache frequently accessed entities

## Development vs Production

### Development Environment
- Base URL: `http://localhost:3001/api/v5`
- No authentication required
- Debug logging enabled
- No rate limiting

### Production Environment
- Base URL: `https://api.jewgo.app/api/v5`
- JWT authentication required
- Rate limiting enabled
- Optimized logging
- SSL/TLS encryption

## Support

For API support:
1. Check the health endpoint: `GET /health`
2. Review error messages in responses
3. Verify query parameters are correct
4. Check database connection status
5. Review server logs for detailed error information
