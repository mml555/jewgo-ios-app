# Events System Documentation

## Overview

The Events system provides a comprehensive platform for creating, managing, and discovering events within the Jewgo community. This document outlines the enhanced features, API contracts, field mappings, and UX guidelines.

## Table of Contents

1. [Features](#features)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Field Mappings](#field-mappings)
5. [UI Components](#ui-components)
6. [Deep Linking](#deep-linking)
7. [Testing](#testing)
8. [Deployment](#deployment)

## Features

### Core Features

- **Event Discovery**: Browse events with advanced filtering and search
- **Event Details**: Comprehensive event information with RSVP functionality
- **Event Creation**: Create and manage events with flyer upload
- **Social Sharing**: Share events across multiple platforms
- **Deep Linking**: Direct links to specific events and filtered lists
- **Real-time Updates**: Live RSVP counts and capacity tracking

### Enhanced Features

- **Advanced Filtering**: Filter by date range, category, price, location, tags
- **Category Tabs**: Quick access to event categories
- **Live Map Integration**: View events on interactive map
- **Related Events**: Discover similar events
- **Social Media Integration**: Share to WhatsApp, Facebook, Twitter, Email
- **Accessibility**: Full VoiceOver/TalkBack support

## Database Schema

### Core Tables

#### events
```sql
-- Main events table with computed fields
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  event_end_date TIMESTAMPTZ,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  zip_code VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  venue_name VARCHAR(255),
  flyer_url VARCHAR(500),
  flyer_width INTEGER,
  flyer_height INTEGER,
  flyer_thumbnail_url VARCHAR(500),
  category_id UUID REFERENCES event_categories(id),
  event_type_id UUID REFERENCES event_types(id),
  tags JSONB,
  host VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  cta_link VARCHAR(500),
  capacity INTEGER,
  is_rsvp_required BOOLEAN DEFAULT false,
  rsvp_count INTEGER DEFAULT 0,
  waitlist_count INTEGER DEFAULT 0,
  is_sponsorship_available BOOLEAN DEFAULT false,
  is_nonprofit BOOLEAN DEFAULT false,
  nonprofit_approval_status VARCHAR(50),
  is_paid BOOLEAN DEFAULT false,
  payment_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Computed fields
  is_free BOOLEAN GENERATED ALWAYS AS (NOT is_paid) STORED,
  display_date_range TEXT,
  organizer_name VARCHAR(255)
);
```

#### Enhanced Views

```sql
-- Enhanced events view with computed fields
CREATE VIEW v_events_enhanced AS
SELECT 
  e.*,
  ec.name as category_name,
  ec.icon_name as category_icon,
  ec.key as category_key,
  et.name as event_type_name,
  et.key as event_type_key,
  u.first_name || ' ' || u.last_name as organizer_full_name,
  -- Event status computed fields
  CASE 
    WHEN e.event_date > NOW() THEN 'upcoming'
    WHEN e.event_end_date IS NOT NULL AND e.event_end_date < NOW() THEN 'past'
    WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN 'happening_now'
    ELSE 'past'
  END as event_status,
  -- Additional computed fields...
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
JOIN event_types et ON e.event_type_id = et.id  
JOIN users u ON e.organizer_id = u.id;
```

## API Endpoints

### Events List

```
GET /api/v5/events
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Event category key |
| `eventType` | string | Event type key |
| `dateFrom` | string | Start date (YYYY-MM-DD) |
| `dateTo` | string | End date (YYYY-MM-DD) |
| `isRsvpRequired` | boolean | Filter by RSVP requirement |
| `isSponsorshipAvailable` | boolean | Filter by sponsorship availability |
| `isFree` | boolean | Filter by free events only |
| `zipCode` | string | Filter by zip code |
| `tags` | string[] | Filter by tags (comma-separated) |
| `search` | string | Text search |
| `lat` | number | Latitude for location filtering |
| `lng` | number | Longitude for location filtering |
| `radius` | number | Radius in miles (default: 25) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `sortBy` | string | Sort field (default: event_date) |
| `sortOrder` | string | Sort direction (ASC/DESC) |

#### Response

```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Event Title",
      "description": "Event description",
      "event_date": "2024-01-15T18:00:00Z",
      "event_end_date": "2024-01-15T20:00:00Z",
      "timezone": "America/New_York",
      "venue_name": "Venue Name",
      "flyer_url": "https://example.com/flyer.jpg",
      "category_name": "Religious & Spiritual",
      "category_key": "religious",
      "event_type_name": "Service",
      "is_free": true,
      "rsvp_count": 50,
      "capacity": 100,
      "organizer_full_name": "John Doe",
      "display_date_range_formatted": "January 15 Monday 6:00 PM",
      "event_status": "upcoming",
      "location_display": "Venue Name",
      "tags": ["workshop", "education"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

### Event Details

```
GET /api/v5/events/:id
```

#### Response

```json
{
  "event": {
    // All fields from events list plus:
    "share_urls": {
      "whatsapp": "whatsapp://send?text=...",
      "facebook": "fb://share?link=...",
      "twitter": "twitter://post?message=...",
      "email": "mailto:?subject=...",
      "copy_link": "https://jewgo.app/events/uuid"
    },
    "related_events": [
      {
        "id": "uuid",
        "title": "Related Event",
        "event_date": "2024-01-20T18:00:00Z",
        "venue_name": "Related Venue",
        "flyer_url": "https://example.com/related.jpg"
      }
    ],
    "has_rsvped": false,
    "rsvp_status": null
  }
}
```

## Field Mappings

### Legacy to Enhanced Field Mappings

| Legacy Field | Enhanced Field | Description |
|--------------|----------------|-------------|
| `flyer_url` | `cover_image_url` | Event flyer/cover image |
| `venue_name` | `location_name` | Event location name |
| `organizer_first_name + organizer_last_name` | `organizer_name` | Full organizer name |
| `!is_paid` | `is_free` | Computed free status |
| `event_date + event_end_date + timezone` | `display_date_range` | Formatted date range |
| `event_date + timezone` | `display_date_range_formatted` | Human-readable date |

### New Computed Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_status` | string | 'upcoming', 'happening_now', or 'past' |
| `is_past` | boolean | True if event has ended |
| `is_happening_now` | boolean | True if event is currently happening |
| `capacity_percentage` | number | Percentage of capacity filled |
| `location_display` | string | Formatted location string |
| `organizer_full_name` | string | Complete organizer name |

## UI Components

### EventCard

Reusable card component for displaying events in lists.

**Props:**
- `event: Event` - Event data object
- `onPress: () => void` - Callback when card is pressed
- `onFavoritePress?: () => void` - Callback for favorite button
- `isFavorited?: boolean` - Favorite state

**Features:**
- Category pill overlay
- Heart icon for favorites
- Price badge (Free/Paid)
- Accessibility support

### AdvancedFiltersModal

Full-screen modal for advanced event filtering.

**Props:**
- `visible: boolean` - Modal visibility
- `onClose: () => void` - Close callback
- `onApplyFilters: (filters: EventFilters) => void` - Apply filters callback
- `categories: EventCategory[]` - Available categories
- `eventTypes: EventType[]` - Available event types
- `currentFilters: EventFilters` - Current filter state

**Features:**
- Date range picker
- Category and event type selection
- Tags input
- Location filtering
- Toggle switches for options
- Sort options
- Active filter count display

### SocialShareBar

Component for sharing events across social platforms.

**Props:**
- `event: Event` - Event data with share URLs
- `onShare: (platform: string) => void` - Share callback

**Features:**
- WhatsApp, Facebook, Twitter, Email sharing
- Copy link functionality
- Platform-specific icons

## Deep Linking

### URL Schemes

#### Custom Scheme (jewgo://)
- Events list: `jewgo://events`
- Event detail: `jewgo://events/:eventId`
- Filtered list: `jewgo://events?category=religious&isFree=true`

#### Universal Links (https://jewgo.app)
- Events list: `https://jewgo.app/events`
- Event detail: `https://jewgo.app/events/:eventId`
- Filtered list: `https://jewgo.app/events?category=religious&isFree=true`

### Supported Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Event category filter |
| `search` | string | Text search filter |
| `isFree` | boolean | Free events only |

### Implementation

```typescript
// Generate deep link
const deepLink = eventsDeepLinkService.generateEventDeepLink('event-123');
// Result: "jewgo://events/event-123"

// Generate universal link
const universalLink = eventsDeepLinkService.generateEventUniversalLink('event-123');
// Result: "https://jewgo.app/events/event-123"

// Extract event ID from URL
const eventId = eventsDeepLinkService.extractEventId('jewgo://events/event-123');
// Result: "event-123"
```

## Testing

### Component Tests

- **EventCard.test.tsx**: Tests event card rendering and interactions
- **AdvancedFiltersModal.test.tsx**: Tests filter modal functionality
- **SocialShareBar.test.tsx**: Tests social sharing features

### Service Tests

- **EventsService.test.ts**: Tests API service methods and helpers
- **EventsDeepLinkService.test.ts**: Tests deep linking functionality

### Test Coverage

- Component rendering and props
- User interactions and callbacks
- API error handling
- Deep link parsing and generation
- Helper method edge cases

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test EventCard.test.tsx

# Run with coverage
npm test -- --coverage
```

## Deployment

### Database Migration

1. **Run Migration**: Execute `022_events_schema_enhancements.sql`
2. **Verify Views**: Check that enhanced views are created
3. **Test Queries**: Validate computed fields work correctly
4. **Backup**: Create database backup before migration

### Frontend Deployment

1. **Build**: Create production build
2. **Test**: Run integration tests
3. **Deploy**: Deploy to staging/production
4. **Verify**: Test deep linking and API endpoints

### Configuration

#### Environment Variables

```bash
# API Configuration
API_BASE_URL=https://api.jewgo.app/api/v5

# Deep Linking
UNIVERSAL_LINK_DOMAIN=jewgo.app
CUSTOM_SCHEME=jewgo

# Social Sharing
SHARE_BASE_URL=https://jewgo.app
```

#### App Configuration

```typescript
// Deep linking configuration in app.json
{
  "expo": {
    "scheme": "jewgo",
    "web": {
      "linking": {
        "prefixes": ["https://jewgo.app"]
      }
    }
  }
}
```

## Performance Considerations

### Database Optimization

- **Indexes**: Proper indexing on filtered fields
- **Views**: Materialized views for complex queries
- **Pagination**: Server-side pagination for large datasets

### Frontend Optimization

- **Virtualization**: FlatList for large event lists
- **Image Loading**: Lazy loading and caching
- **Debouncing**: Search input debouncing
- **Memoization**: Component memoization for performance

### Caching Strategy

- **API Responses**: React Query caching
- **Images**: AsyncStorage caching
- **Filters**: Local state persistence
- **Categories**: Static data caching

## Accessibility

### WCAG Compliance

- **Color Contrast**: Minimum 4.5:1 ratio
- **Touch Targets**: Minimum 44x44pt
- **Screen Readers**: Full VoiceOver/TalkBack support
- **Keyboard Navigation**: Tab order and focus management

### Implementation

```typescript
// Accessibility labels
accessibilityLabel="Event: Test Event"
accessibilityHint="Tap to view event details"
accessibilityRole="button"
accessibilityState={{ selected: isSelected }}
```

## Security

### Input Validation

- **API Validation**: Server-side validation for all inputs
- **XSS Prevention**: Proper escaping and sanitization
- **SQL Injection**: Parameterized queries
- **Rate Limiting**: API rate limiting

### Authentication

- **Protected Routes**: Authentication required for event creation
- **User Context**: Proper user context validation
- **Session Management**: Secure session handling

## Monitoring

### Analytics

- **Event Views**: Track event detail views
- **RSVP Actions**: Monitor RSVP conversions
- **Filter Usage**: Track filter popularity
- **Share Actions**: Monitor social sharing

### Error Tracking

- **API Errors**: Track API failures
- **Navigation Errors**: Monitor deep link failures
- **Component Errors**: Track UI component issues
- **Performance**: Monitor slow queries and renders

## Future Enhancements

### Planned Features

- **Event Recommendations**: ML-based event suggestions
- **Calendar Integration**: Export to calendar apps
- **Push Notifications**: Event reminders and updates
- **Offline Support**: Offline event browsing
- **Multi-language**: Internationalization support
- **Event Analytics**: Detailed event performance metrics

### Technical Improvements

- **GraphQL**: Consider GraphQL for complex queries
- **Real-time**: WebSocket for live updates
- **Caching**: Redis for improved performance
- **CDN**: Image CDN for faster loading
- **PWA**: Progressive Web App features
