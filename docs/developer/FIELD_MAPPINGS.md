# Jewgo Field Mappings Documentation

Complete field mapping documentation between backend API responses and frontend components for the Jewgo V5 system.

## Overview

This document describes how data flows from the backend API through the frontend services to the UI components, including all transformations and mappings applied to ensure compatibility between the backend database schema and frontend interfaces.

## Backend to Frontend Data Flow

```
Backend API → API Service → Frontend Interfaces → UI Components
     ↓              ↓              ↓                ↓
Database Fields → Transform → TypeScript Types → React Components
```

## API Response Structure

### Backend Entity Response
```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "id": "uuid",
        "name": "Business Name",
        "description": "Short description",
        "long_description": "Detailed description",
        "address": "123 Main St",
        "city": "Brooklyn",
        "state": "NY",
        "zip_code": "11201",
        "phone": "(555) 123-4567",
        "email": "info@business.com",
        "website": "https://business.com",
        "facebook_url": "https://facebook.com/business",
        "instagram_url": "https://instagram.com/business",
        "latitude": "40.6782",
        "longitude": "-73.9442",
        "rating": "4.5",
        "review_count": 42,
        "is_verified": true,
        "is_active": true,
        "created_at": "2025-09-16T02:40:11.615Z",
        "updated_at": "2025-09-16T02:40:11.615Z",
        "business_hours": [...],
        "images": [...],
        "recent_reviews": [...]
      }
    ]
  }
}
```

### Frontend Listing Interface
```typescript
interface Listing {
  id: string;
  title: string;
  description: string;
  long_description?: string;
  category_id: string;
  owner_id: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  facebook_url?: string;
  instagram_url?: string;
  whatsapp_url?: string;
  tiktok_url?: string;
  rating: string;
  review_count: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name: string;
  category_emoji: string;
  latitude: number;
  longitude: number;
  // Enhanced data fields
  business_hours?: BusinessHours[];
  images?: string[];
  recent_reviews?: Review[];
  kosher_certifications?: KosherCertification[];
}
```

## Core Field Mappings

### Basic Entity Fields

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `id` | `id` | Direct mapping | UUID string |
| `name` | `title` | Direct mapping | Business name |
| `description` | `description` | Direct mapping | Short description |
| `long_description` | `long_description` | Direct mapping | Detailed description |
| `address` | `address` | Direct mapping | Street address |
| `city` | `city` | Direct mapping | City name |
| `state` | `state` | Direct mapping | State abbreviation |
| `zip_code` | `zip_code` | Direct mapping | ZIP code |
| `phone` | `phone` | Direct mapping | Phone number |
| `email` | `email` | Direct mapping | Email address |
| `website` | `website` | Direct mapping | Website URL |
| `latitude` | `latitude` | `parseFloat(entity.latitude)` | Convert to number |
| `longitude` | `longitude` | `parseFloat(entity.longitude)` | Convert to number |
| `rating` | `rating` | `entity.rating.toString()` | Convert to string |
| `review_count` | `review_count` | Direct mapping | Number of reviews |
| `is_verified` | `is_verified` | Direct mapping | Verification status |
| `is_active` | `is_active` | Direct mapping | Active status |
| `created_at` | `created_at` | Direct mapping | Creation timestamp |
| `updated_at` | `updated_at` | Direct mapping | Update timestamp |

### Category and Type Fields

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `entity_type` | `category_id` | Direct mapping | restaurant, synagogue, mikvah, store |
| `entity_type` | `category_name` | Direct mapping | Same as category_id |
| `entity_type` | `category_emoji` | `getCategoryEmoji(entity_type)` | Map to emoji |
| N/A | `owner_id` | `''` | Not available in V5 API |

### Category Emoji Mapping
```typescript
const getCategoryEmoji = (entityType: string): string => {
  const emojis: Record<string, string> = {
    'restaurant': '🍽️',
    'synagogue': '🕍',
    'mikvah': '🛁',
    'store': '🏪',
    'eatery': '🍽️',
    'shul': '🕍'
  };
  return emojis[entityType] || '📍';
};
```

### Category Key Mapping (Frontend to Backend)
```typescript
const categoryToEntityType: Record<string, string> = {
  'mikvah': 'mikvah',
  'eatery': 'restaurant',
  'shul': 'synagogue',
  'stores': 'store',
  'shuk': 'store',
  'restaurant': 'restaurant',
  'synagogue': 'synagogue',
  'store': 'store'
};
```

## Enhanced Data Mappings

### Business Hours Mapping

#### Backend Format
```json
{
  "business_hours": [
    {
      "day_of_week": "sunday",
      "open_time": "09:00:00",
      "close_time": "21:00:00",
      "is_closed": false
    }
  ]
}
```

#### Frontend Format
```typescript
interface BusinessHours {
  day_of_week: number;  // 0=sunday, 1=monday, etc.
  open_time: string;
  close_time: string;
  is_closed: boolean;
}
```

#### Transformation Logic
```typescript
const business_hours = entity.business_hours ? entity.business_hours.map((hour: any) => ({
  day_of_week: getDayOfWeekNumber(hour.day_of_week),
  open_time: hour.open_time,
  close_time: hour.close_time,
  is_closed: hour.is_closed
})) : [];

const getDayOfWeekNumber = (dayName: string): number => {
  const days = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };
  return days[dayName.toLowerCase()] ?? 0;
};
```

### Images Mapping

#### Backend Format
```json
{
  "images": [
    {
      "id": "uuid",
      "url": "https://images.unsplash.com/photo-1234567890",
      "alt_text": "Restaurant interior",
      "is_primary": true,
      "sort_order": 1
    }
  ]
}
```

#### Frontend Format
```typescript
interface Listing {
  images?: string[];  // Array of image URLs
}
```

#### Transformation Logic
```typescript
const images = entity.images ? entity.images.map((img: any) => img.url) : [];
```

### Reviews Mapping

#### Backend Format
```json
{
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
  ]
}
```

#### Frontend Format
```typescript
interface Review {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  title?: string;
  content?: string;
  is_verified: boolean;
  created_at: string;
  user_name?: string;
}
```

#### Transformation Logic
```typescript
const recent_reviews = entity.recent_reviews || [];
// Reviews are passed through with minimal transformation
// Frontend components handle display formatting
```

### Kosher Certifications Mapping

#### Backend Format (Restaurant-specific)
```json
{
  "kosher_level": "glatt",
  "kosher_certification": "OU",
  "kosher_certificate_number": "OU12345",
  "kosher_expires_at": "2024-12-31"
}
```

#### Frontend Format
```typescript
interface KosherCertification {
  level: string;
  certifying_body: string;
  certificate_number: string;
  expires_at: string | null;
}
```

#### Transformation Logic
```typescript
const kosher_certifications = entity.kosher_level ? [{
  level: entity.kosher_level,
  certifying_body: entity.kosher_certification || 'Unknown',
  certificate_number: entity.kosher_certificate_number || '',
  expires_at: entity.kosher_expires_at
}] : [];
```

## Category-Specific Field Mappings

### Restaurant Fields

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `kosher_level` | `kosher_certifications[0].level` | Direct mapping | glatt, chalav_yisrael, etc. |
| `kosher_certification` | `kosher_certifications[0].certifying_body` | Direct mapping | OU, Chabad, etc. |
| `kosher_certificate_number` | `kosher_certifications[0].certificate_number` | Direct mapping | Certificate number |
| `kosher_expires_at` | `kosher_certifications[0].expires_at` | Direct mapping | Expiration date |
| `cuisine_type` | N/A | Not used in frontend | Cuisine type |
| `price_range` | N/A | Not used in frontend | Price range |
| `has_delivery` | N/A | Not used in frontend | Delivery availability |
| `has_takeout` | N/A | Not used in frontend | Takeout availability |
| `has_catering` | N/A | Not used in frontend | Catering availability |

### Synagogue Fields

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `denomination` | N/A | Not used in frontend | orthodox, conservative, etc. |
| `services` | N/A | Not used in frontend | Array of services |
| `capacity` | N/A | Not used in frontend | Seating capacity |
| `accessibility_features` | N/A | Not used in frontend | Accessibility features |

### Mikvah Fields

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `privacy_level` | N/A | Not used in frontend | private_rooms, shared, etc. |
| `services` | N/A | Not used in frontend | Array of services |
| `appointment_required` | N/A | Not used in frontend | Appointment requirement |
| `emergency_access` | N/A | Not used in frontend | Emergency access |

### Store Fields

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `store_type` | N/A | Not used in frontend | grocery, butcher, etc. |
| `kosher_level` | `kosher_certifications[0].level` | Direct mapping | Same as restaurants |
| `kosher_certification` | `kosher_certifications[0].certifying_body` | Direct mapping | Same as restaurants |
| `products` | N/A | Not used in frontend | Array of products |
| `has_delivery` | N/A | Not used in frontend | Delivery availability |
| `has_catering` | N/A | Not used in frontend | Catering availability |

## Social Media URL Mappings

| Backend Field | Frontend Field | Transformation | Notes |
|---------------|----------------|----------------|-------|
| `facebook_url` | `facebook_url` | Direct mapping | Facebook page URL |
| `instagram_url` | `instagram_url` | Direct mapping | Instagram profile URL |
| `twitter_url` | N/A | Not used in frontend | Twitter profile URL |
| `whatsapp_url` | `whatsapp_url` | Direct mapping | WhatsApp contact |
| `tiktok_url` | `tiktok_url` | Direct mapping | TikTok profile URL |
| `youtube_url` | N/A | Not used in frontend | YouTube channel URL |
| `snapchat_url` | N/A | Not used in frontend | Snapchat profile |
| `linkedin_url` | N/A | Not used in frontend | LinkedIn page |

## UI Component Field Usage

### CategoryCard Component
```typescript
// Fields used in CategoryCard
interface CategoryCardProps {
  item: {
    title: string;           // From entity.name
    rating: number;          // From entity.rating (converted to number)
    price: string;           // Default: '$$'
    zip_code: string;        // From entity.zip_code
    distance?: number;       // Calculated from coordinates
    coordinate?: {           // From entity.latitude/longitude
      latitude: number;
      longitude: number;
    };
    category: string;        // From entity.entity_type
  };
}
```

### ListingDetailScreen Component
```typescript
// Fields used in ListingDetailScreen
interface DetailedListing {
  // Basic fields (same as Listing)
  id: string;
  title: string;
  description: string;
  long_description?: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email: string;
  website: string;
  latitude: number;
  longitude: number;
  rating: string;
  review_count: number;
  is_verified: boolean;
  
  // Enhanced fields
  business_hours: BusinessHours[];
  images: string[];
  recent_reviews: Review[];
  kosher_certifications: KosherCertification[];
}
```

### LiveMapScreen Component
```typescript
// Fields used in LiveMapScreen
interface MapListing {
  id: string;               // From entity.id
  title: string;            // From entity.name
  description: string;      // From entity.description
  category: string;         // From entity.entity_type
  rating?: number;          // From entity.rating (converted to number)
  distance?: number;        // Calculated from coordinates
  latitude: number;         // From entity.latitude (converted to number)
  longitude: number;        // From entity.longitude (converted to number)
  imageUrl?: string;        // From entity.images[0].url
}
```

## Data Transformation Pipeline

### 1. API Service Layer (`api.ts`)
```typescript
class ApiService {
  private transformEntityToLegacyListing(entity: any): Listing {
    // Apply all transformations
    return {
      id: entity.id,
      title: entity.name,  // name → title
      // ... other mappings
      business_hours: this.transformBusinessHours(entity.business_hours),
      images: this.transformImages(entity.images),
      recent_reviews: entity.recent_reviews || [],
      kosher_certifications: this.transformKosherCertifications(entity)
    };
  }
}
```

### 2. Category Data Hook (`useCategoryData.ts`)
```typescript
const useCategoryData = () => {
  const loadData = async () => {
    const response = await apiService.getListingsByCategory(categoryKey);
    // Data is already transformed by apiService
    const listings = response.data.listings;
    
    // Additional frontend-specific processing
    const processedListings = listings.map(listing => ({
      ...listing,
      distance: calculateDistance(userLocation, listing.coordinate)
    }));
    
    setData(processedListings);
  };
};
```

### 3. UI Components
```typescript
// Components receive fully transformed data
const CategoryCard = ({ item }: { item: Listing }) => {
  return (
    <View>
      <Text>{item.title}</Text>        {/* entity.name */}
      <Text>{item.rating}</Text>       {/* entity.rating */}
      <Text>{item.zip_code}</Text>     {/* entity.zip_code */}
    </View>
  );
};
```

## Error Handling and Fallbacks

### Missing Data Handling
```typescript
const transformEntityToLegacyListing = (entity: any): Listing => {
  return {
    // Required fields with fallbacks
    title: entity.name || 'Unknown Business',
    rating: entity.rating ? entity.rating.toString() : '0.0',
    review_count: entity.review_count || 0,
    
    // Optional fields with defaults
    phone: entity.phone || '',
    email: entity.email || '',
    website: entity.website || '',
    
    // Enhanced fields with safe defaults
    business_hours: entity.business_hours || [],
    images: entity.images || [],
    recent_reviews: entity.recent_reviews || [],
    kosher_certifications: entity.kosher_level ? [{
      level: entity.kosher_level,
      certifying_body: entity.kosher_certification || 'Unknown',
      certificate_number: entity.kosher_certificate_number || '',
      expires_at: entity.kosher_expires_at || null
    }] : []
  };
};
```

### Type Safety
```typescript
// Ensure numeric fields are properly converted
latitude: parseFloat(entity.latitude) || 0,
longitude: parseFloat(entity.longitude) || 0,
rating: entity.rating ? parseFloat(entity.rating).toString() : '0.0',

// Ensure boolean fields are properly converted
is_verified: Boolean(entity.is_verified),
is_active: Boolean(entity.is_active),

// Ensure array fields are arrays
business_hours: Array.isArray(entity.business_hours) ? entity.business_hours : [],
images: Array.isArray(entity.images) ? entity.images : [],
recent_reviews: Array.isArray(entity.recent_reviews) ? entity.recent_reviews : []
```

## Performance Considerations

### Efficient Transformations
- Transform data once at the API service level
- Cache transformed data in React hooks
- Use memoization for expensive calculations
- Minimize re-transformations on re-renders

### Memory Optimization
- Use selective field loading for list views
- Implement pagination to limit data volume
- Clean up unused data in component unmount
- Use lazy loading for images and heavy data

This comprehensive mapping ensures that all backend data is properly transformed and accessible to frontend components while maintaining type safety and performance optimization.
