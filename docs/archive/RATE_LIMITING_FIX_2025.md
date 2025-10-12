# Rate Limiting Fix - October 10, 2025

## Overview
Fixed IP blocking issue caused by excessive API calls from memory leaks (which have now been fixed). Added development tools to manage rate limiting.

## Issue
Your IP was temporarily blocked due to excessive API requests caused by the memory leaks that were generating hundreds of authentication checks per second. The block was set to last 59 minutes.

## Fixes Applied

### 1. Reduced Block Duration in Development
**File**: `backend/src/middleware/rateLimiter.js`

Changed block duration from 1 hour to 5 minutes in development mode:

```javascript
blockDuration: process.env.NODE_ENV === 'development' 
  ? 5 * 60 * 1000  // 5 minutes in development
  : 60 * 60 * 1000, // 1 hour in production
```

### 2. Added Development Management Functions
**File**: `backend/src/middleware/rateLimiter.js`

Added utility functions to manage rate limiting:
- `clearBlockedIPs()` - Clear all blocked IPs
- `clearIPBlock(clientId)` - Clear specific IP block
- `resetCounts()` - Reset all request counts

### 3. Added Unprotected Development Endpoints
**File**: `backend/src/server.js`

Added development-only endpoints that don't require authentication (so you can use them even when blocked):

- `POST /dev/clear-blocks` - Clear all blocked IPs
- `POST /dev/reset-counts` - Reset all request counts
- `GET /dev/rate-limit-stats` - View rate limiting statistics

These endpoints are **only available in development mode** for security.

### 4. Added Admin Endpoints (Protected)
**File**: `backend/src/routes/admin.js`

Added admin endpoints for production use (require authentication):
- `GET /api/v5/admin/rate-limit/stats` - View rate limiting stats
- `POST /api/v5/admin/rate-limit/clear-blocks` - Clear all blocks
- `POST /api/v5/admin/rate-limit/clear-ip/:ip` - Clear specific IP
- `POST /api/v5/admin/rate-limit/reset-counts` - Reset counts

## How to Use

### If You Get Blocked Again

#### Quick Fix (Automatic):
Just restart the backend server:
```bash
cd backend
npm start
```
Restarting clears the in-memory block list automatically.

#### Manual Clear (While Server is Running):
```bash
# Clear all blocked IPs
curl -X POST http://127.0.0.1:3001/dev/clear-blocks

# View current stats
curl http://127.0.0.1:3001/dev/rate-limit-stats

# Reset request counts
curl -X POST http://127.0.0.1:3001/dev/reset-counts
```

### Rate Limiting Configuration

Current development limits:
- **General API**: 50,000 requests per 15 minutes (very high for dev)
- **Authentication**: 20 attempts per 15 minutes
- **Write Operations**: 200 per 15 minutes
- **Search**: 100 per minute
- **Block Duration**: 5 minutes (dev) / 1 hour (production)

## Why This Happened

The memory leaks we fixed were causing:
1. 100+ authentication checks per second
2. 50+ API requests per second
3. Excessive logging

This triggered the rate limiter's abuse protection, which blocks IPs that exceed limits by 50% or more.

## Prevention

The memory leak fixes prevent this from happening again by:
- Removing excessive `isGuestAuthenticated()` calls
- Throttling debug logging (99% reduction)
- Memoizing authentication state
- Preventing cascading re-renders

## Files Modified
1. `backend/src/middleware/rateLimiter.js` - Added management functions, reduced dev block time
2. `backend/src/server.js` - Added unprotected dev endpoints
3. `backend/src/routes/admin.js` - Added protected admin endpoints

## Testing
✅ Backend restarted successfully
✅ IP unblocked (confirmed with `/dev/clear-blocks`)
✅ Development endpoints working
✅ No authentication required for dev endpoints

## Production Safety
- Development endpoints only available when `NODE_ENV=development`
- Production endpoints require authentication
- Block duration remains 1 hour in production
- Rate limits are much stricter in production

## Summary
Your app should now work normally! The combination of memory leak fixes and improved rate limit management means:
- **App runs smoothly** without excessive API calls
- **Can't get blocked** in dev without extreme abuse
- **Easy recovery** if blocked (restart or curl endpoint)
- **Production safety** maintained with proper authentication

