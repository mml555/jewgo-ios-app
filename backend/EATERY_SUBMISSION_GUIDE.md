# Eatery Submission System

## Overview

The eatery submission system allows users to submit new restaurant/eatery listings through the mobile app. All submissions go through a review process before appearing on the platform.

## Database Schema

### New Tables

#### `eatery_fields`
Extended fields specific to eatery entities:
- `kosher_type`: meat, dairy, pareve, or vegan
- `hechsher`: Kosher certification agency (lowercase)
- `kosher_tags`: Array of additional kosher attributes
- `price_range`: Price range in format like "$10-$20"
- `amenities`: JSON array of amenities offered
- `google_reviews_link`: Link to Google Business page
- `is_owner_submission`: Whether submitted by business owner
- `hours_json`: Parsed hours in JSON format
- `business_images`: Array of image URLs

### Updated Tables

#### `entities`
- Added `approval_status`: 'pending_review', 'approved', or 'rejected'
- Added `geom`: PostGIS geometry point for spatial queries

## API Endpoints

### Submit New Eatery
```
POST /api/v5/eatery-submit
```

**Request Body:**
```json
{
  "type": "eatery",
  "name": "Restaurant Name",
  "address": "123 Main St, City, State ZIP",
  "phone": "(555) 123-4567",
  "email": "contact@restaurant.com",
  "website": "https://restaurant.com",
  "hours_of_operation": "monday: 9:00 AM-5:00 PM, tuesday: 9:00 AM-5:00 PM...",
  "business_images": ["url1", "url2"],
  "kosher_type": "meat",
  "hechsher": "orb",
  "kosher_tags": ["pas yisroel", "glatt kosher"],
  "short_description": "Description (max 70 chars)",
  "price_range": "$20-$30",
  "amenities": ["Free Wi-Fi", "Parking Available"],
  "services": ["dine_in", "delivery"],
  "google_reviews_link": "https://maps.google.com/...",
  "is_owner_submission": true,
  "user_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entity_id": "uuid",
    "status": "pending_review",
    "submitted_at": "2025-10-21T...",
    "message": "Your eatery has been submitted for review..."
  }
}
```

### Get Pending Submissions (Admin)
```
GET /api/v5/eatery-submissions?status=pending_review&limit=50&offset=0
```

### Approve Submission (Admin)
```
PUT /api/v5/eatery-submissions/:id/approve
```

### Reject Submission (Admin)
```
PUT /api/v5/eatery-submissions/:id/reject
Body: { "reason": "Reason for rejection" }
```

## Features

### 1. Automatic Geocoding
- Converts address string to latitude/longitude
- Creates PostGIS geometry point for spatial queries
- Falls back to default coordinates if geocoding fails

### 2. Hours Parsing
- Parses hours string into structured JSON format
- Supports various time formats
- Handles closed days

### 3. Validation
- Required fields: name, address, phone, kosher_type, hechsher, short_description
- Minimum 2 images required
- Validates data types and formats

### 4. Approval Workflow
- All submissions start with `approval_status = 'pending_review'`
- Admin can approve or reject submissions
- Approved submissions appear in public listings
- Rejected submissions are hidden

### 5. Owner Submissions
- `is_owner_submission` flag for Eatery Boost features
- Allows business owners to claim their listings

## Environment Variables

Add to `.env`:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

If not set, geocoding will use fallback coordinates.

## Testing

Run the test script:
```bash
node backend/scripts/test-eatery-submission.js
```

Or test manually with curl:
```bash
curl -X POST http://localhost:3001/api/v5/eatery-submit \
  -H "Content-Type: application/json" \
  -d @test-eatery.json
```

## Migration

The migration `023_eatery_submission_schema.sql` has been applied and includes:
- ✅ Added `approval_status` column to entities
- ✅ Added `geom` column for PostGIS
- ✅ Created `eatery_fields` table
- ✅ Created indexes for performance
- ✅ Added triggers for timestamp updates

## Frontend Integration

The React Native app sends data to `/api/v5/eatery-submit` with the format above. The backend:
1. Validates required fields
2. Geocodes the address
3. Parses hours string
4. Inserts into `entities` table with `approval_status = 'pending_review'`
5. Inserts into `eatery_fields` table
6. Returns success response

## Admin Dashboard

Admins can:
- View pending submissions at `/api/v5/eatery-submissions`
- Approve submissions to make them public
- Reject submissions with a reason
- Filter by status (pending_review, approved, rejected)

## Status Flow

```
User Submits → pending_review → Admin Reviews → approved/rejected
                                                      ↓
                                                 Appears on app
```

## Notes

- All kosher_type and hechsher values are normalized to lowercase
- Price range is stored as string (e.g., "$10-$20")
- Amenities are stored as JSONB array
- Business images are stored as text array
- Hours are stored as JSONB for flexible querying
