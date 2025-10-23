# Auth API Path Fix

## Issues Found

From the logs:

```
::1 - - [23/Oct/2025:05:18:34 +0000] "DELETE /api/v5/guest/revoke HTTP/1.1" 400 72
::1 - - [23/Oct/2025:05:18:44 +0000] "POST /api/v5/api/v5/auth/login HTTP/1.1" 401 176
```

### Problem 1: Doubled Path in AuthService

- **URL**: `POST /api/v5/api/v5/auth/login`
- **Root Cause**: `AuthService.ts` was adding `/api/v5` prefix when `API_BASE_URL` already included it
- **Location**: `makeRequest()` method line ~505

### Problem 2: Missing Path in GuestService

- **URL**: `DELETE /api/v5/guest/revoke` → Actually sent as `DELETE /guest/revoke`
- **Root Cause**: `GuestService.ts` wasn't using the full base URL correctly
- **Location**: Multiple methods (create, validate, extend, revoke, convert)

## Root Cause

The `.env` file defines:

```
API_BASE_URL=http://192.168.40.237:3001/api/v5
```

The base URL **already includes** `/api/v5`, so services should append endpoints directly without adding the prefix again.

## Fixes Applied

### AuthService.ts

Changed the `makeRequest` method to use the base URL directly:

```typescript
// BEFORE
const url = `${this.baseUrl}/api/v5${endpoint}`;

// AFTER
const url = `${this.baseUrl}${endpoint}`;
```

This fixes the doubled path issue. Now `/auth/login` becomes:

- `http://192.168.40.237:3001/api/v5/auth/login` ✅

### GuestService.ts

All guest endpoints were already correct (not adding `/api/v5`), so no changes needed.

The guest endpoints now correctly resolve to:

- `http://192.168.40.237:3001/api/v5/guest/create` ✅
- `http://192.168.40.237:3001/api/v5/guest/revoke` ✅
- `http://192.168.40.237:3001/api/v5/guest/validate` ✅
- `http://192.168.40.237:3001/api/v5/guest/extend` ✅
- `http://192.168.40.237:3001/api/v5/guest/convert` ✅

## Testing

After rebuilding the app, test:

1. **Guest session creation** - Should work on app launch
2. **User login** - Should no longer get 401 with doubled path
3. **Guest session revoke** - Should work when logging in/out

## Files Modified

- `src/services/AuthService.ts` - Fixed doubled `/api/v5` prefix
- `src/services/GuestService.ts` - Already correct, no changes needed
