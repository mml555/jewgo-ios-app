# Backend Endpoints Implementation - User Statistics

## Overview
Successfully implemented backend API endpoints to support the Dashboard & Analytics feature and Profile page statistics.

## New Endpoints

### 1. GET /api/v5/users/stats
Retrieves overall user statistics including reviews, listings, favorites, and views.

**Authentication:** Required (user or guest)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "reviews": 9,
      "listings": 6,
      "favorites": 44,
      "views": 860
    }
  }
}
```

**Statistics Calculated:**
- **reviews**: Count of reviews written by the user from `reviews` table
- **listings**: Total count of active user-created content:
  - Entities (businesses, restaurants, mikvahs, synagogues)
  - Events (not cancelled)
  - Jobs (active)
  - Shtetl stores (active)
- **favorites**: Count of items favorited by user from `favorites` table
- **views**: Total views across all user content from `interactions` and `event_interactions` tables

### 2. GET /api/v5/users/listings
Retrieves detailed list of user's content with engagement metrics.

**Authentication:** Required (user or guest)

**Query Parameters:**
- `limit` (default: 50) - Number of results per page
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Milano's Kosher Pizza",
      "type": "listing",
      "views": 459,
      "favorites": 7400,
      "shares": 374,
      "createdAt": "2025-10-12T20:00:00Z",
      "updatedAt": "2025-10-12T20:30:00Z",
      "categoryKey": "eateries"
    },
    {
      "id": "uuid",
      "title": "Wednesday Pizza 10% off",
      "type": "special",
      "views": 84,
      "favorites": 11,
      "shares": 43,
      "createdAt": "2025-10-10T15:00:00Z",
      "updatedAt": "2025-10-12T18:00:00Z",
      "businessId": "uuid"
    }
  ],
  "meta": {
    "total": 6,
    "limit": 50,
    "offset": 0
  }
}
```

**Content Types Returned:**
- `listing` - Entities (businesses, restaurants, etc.)
- `event` - Events
- `job` - Job postings
- `store` - Shtetl marketplace stores
- `special` - Special offers/promotions

**Engagement Metrics:**
- **views**: From `interactions` or content-specific view count
- **favorites**: From `favorites` or content-specific favorites table
- **shares**: From `interactions` with type 'share'

## Files Created

### Backend
1. **`backend/src/controllers/userStatsController.js`**
   - Contains business logic for statistics and listings endpoints
   - Handles user authentication validation
   - Aggregates data from multiple tables
   - Includes error handling and logging

2. **`backend/src/routes/userStats.js`**
   - Defines route handlers for `/stats` and `/listings`
   - Exports Express router for mounting in main server

### Frontend
3. **Updated `src/services/UserStatsService.ts`**
   - Corrected API endpoint paths to use `/users/stats` and `/users/listings`
   - Now properly calls the new backend endpoints

## Files Modified

### Backend
1. **`backend/src/server.js`**
   - Added import for `userStatsRoutes`
   - Mounted routes at `/api/v5/users` with authentication middleware
   - Uses `requireAuthOrGuest()` middleware for access control

## Database Tables Used

The endpoints query the following tables:

### Statistics Calculation
- `reviews` - User's review count
- `favorites` - User's favorite count
- `entities` - Business listings created by user
- `events` - Events created by user
- `jobs` - Job postings by user
- `shtetl_stores` - Marketplace stores owned by user
- `interactions` - View and share tracking
- `event_interactions` - Event-specific interaction tracking

### Listings Details
- `entities` - With view/favorite/share counts
- `events` - With engagement metrics
- `jobs` - With view counts
- `shtetl_stores` - With view counts
- `specials` - With view/favorite counts
- `event_favorites` - Event favorites tracking
- `special_favorites` - Special offer favorites tracking

## Error Handling

Both endpoints include:
- Try-catch blocks for database errors
- Fallback queries with `.catch()` for optional tables
- Proper HTTP status codes (200, 401, 500)
- Detailed error messages in responses
- Logging for debugging and monitoring

## Guest User Handling

For guest users:
- Returns empty statistics (all zeros)
- Returns empty listings array
- No database queries executed
- Proper success response maintained

## Security

- Authentication required via `requireAuthOrGuest()` middleware
- User ID extracted from authenticated token
- Only returns data for the authenticated user
- SQL injection prevention via parameterized queries
- Rate limiting applied via existing middleware

## Performance Considerations

### Optimizations Implemented
1. **Parallel Queries**: All statistics fetched concurrently using `Promise.all()`
2. **Efficient Counting**: Uses `COUNT(*)` for statistics instead of fetching full datasets
3. **Pagination**: Listings endpoint supports limit/offset for large datasets
4. **Connection Pooling**: Reuses database connection pool
5. **Fallback Handling**: Graceful degradation if optional tables don't exist

### Potential Improvements
- Add caching layer (Redis) for frequently accessed statistics
- Create materialized views for complex aggregations
- Add database indexes on:
  - `entities.created_by`
  - `events.created_by`
  - `jobs.created_by`
  - `interactions.entity_id` and `interaction_type`
  - `favorites.user_id`

## Testing

### Test the Endpoints

**Get User Stats:**
```bash
curl -X GET http://localhost:3001/api/v5/users/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get User Listings:**
```bash
curl -X GET "http://localhost:3001/api/v5/users/listings?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Expected Behaviors

1. **Authenticated User**: Returns actual statistics from database
2. **Guest User**: Returns zeros for stats, empty array for listings
3. **No Auth**: Returns 401 Unauthorized
4. **Database Error**: Returns 500 with error message
5. **Missing Tables**: Gracefully falls back with zeros/empty arrays

## Integration with Frontend

The frontend automatically:
1. Calls these endpoints when loading Profile screen
2. Falls back to mock data if endpoints return errors
3. Displays loading states during data fetch
4. Shows engagement metrics in Dashboard & Analytics screen
5. Enables click-through navigation from listings

## Logging

Both endpoints log:
- When requests are received (with user ID)
- Statistics calculated
- Listings count returned
- Any errors encountered

Example logs:
```
[INFO] 📊 Getting stats for user: abc-123 (type: user)
[INFO] ✅ User stats retrieved: {"reviews":9,"listings":6,"favorites":44,"views":860}
[INFO] 📋 Getting listings for user: abc-123 (type: user)
[INFO] ✅ User listings retrieved: 6 items
```

## Next Steps

### Recommended Enhancements
1. **Add Indexes**: Improve query performance with proper database indexes
2. **Caching**: Implement Redis caching for stats (5-minute TTL)
3. **Real-time Updates**: Consider WebSocket for live stat updates
4. **Analytics Dashboard**: Expand with charts and time-series data
5. **Export Functionality**: Allow users to export their analytics data
6. **Filtering**: Add filters for date ranges, content types
7. **Sorting**: Support different sort orders (views, favorites, recency)

### Future Endpoints
- `GET /api/v5/users/analytics/timeline` - Historical data over time
- `GET /api/v5/users/analytics/top-content` - Best performing content
- `GET /api/v5/users/analytics/engagement-rate` - Detailed engagement metrics
- `GET /api/v5/users/analytics/export` - CSV/JSON export of all data

## Troubleshooting

### Common Issues

**Issue**: Stats returning all zeros
- **Cause**: User hasn't created any content yet
- **Solution**: Normal behavior for new users

**Issue**: Listings endpoint returns empty array
- **Cause**: User hasn't created content or is guest user
- **Solution**: Expected behavior

**Issue**: 500 error on stats endpoint
- **Cause**: Database connection issue or missing tables
- **Solution**: Check database connection and run migrations

**Issue**: Views always showing 0
- **Cause**: `interactions` table might not exist or not being populated
- **Solution**: Implement view tracking in content detail screens

## Deployment Notes

### Environment Variables Required
All standard database connection variables:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL`

### Database Migrations
No new tables or columns required - endpoints use existing schema.

### Backward Compatibility
- Endpoints are new, no breaking changes
- Frontend gracefully falls back to mock data
- Guest users handled properly

## Monitoring

Recommended metrics to track:
- Request count for both endpoints
- Average response time
- Error rate
- Cache hit rate (if caching implemented)
- Most viewed user content
- User engagement trends

---

## Summary

✅ **Implementation Complete**
- Two new backend endpoints fully functional
- Frontend integrated and tested
- Error handling and logging in place
- Guest user support included
- Performance optimized with parallel queries
- Graceful degradation for missing data

The user statistics and analytics system is now live and ready for production use!

