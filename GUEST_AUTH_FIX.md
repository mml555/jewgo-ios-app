# Guest Authentication Fix

## Problem

The "Continue as Guest" functionality is failing in production with a PostgreSQL error:

```
Error validating guest session: {
  "code": "42702",
  "detail": "It could refer to either a PL/pgSQL variable or a table column.",
  "internalQuery": "UPDATE guest_sessions \n    SET last_used_at = NOW()\n    WHERE session_token = p_session_token \n      AND expires_at > NOW()",
  "where": "PL/pgSQL function validate_guest_session(character varying) line 13 at SQL statement"
}
```

### Root Cause

The `validate_guest_session` PostgreSQL function has an **ambiguous column reference**. PostgreSQL error code `42702` occurs when a column name in a SQL statement could refer to either:

1. A function parameter (e.g., `p_session_token`)
2. A table column (e.g., `session_token` in the `guest_sessions` table)

In the UPDATE statement, the WHERE clause uses `session_token = p_session_token` without the table prefix `guest_sessions.`, causing PostgreSQL to be unable to determine if `session_token` refers to the parameter or the column.

## Solution

The fix requires updating the `validate_guest_session` function to explicitly qualify all column names with the table name prefix.

### Migration Created

- **File**: `backend/migrations/008_fix_guest_session_validation.sql`
- **Purpose**: Drops and recreates the function with proper table qualification

## How to Apply the Fix

### Option 1: Using Render Shell (Recommended)

1. Go to your Render dashboard: https://dashboard.render.com
2. Navigate to your `jewgo-backend` service
3. Click on "Shell" in the left sidebar
4. Run the following commands:

```bash
cd backend/scripts
./apply-guest-fix.sh
```

The script will automatically use the `DATABASE_URL` environment variable that's available in the Render shell.

### Option 2: Manual Application via psql

If you have direct database access:

```bash
# Set your database URL (from Neon dashboard)
export DATABASE_URL='your-production-database-url'

# Apply the migration
psql $DATABASE_URL -f backend/migrations/008_fix_guest_session_validation.sql
```

### Option 3: Through Next Deployment

The migration will automatically be applied on the next deployment since it's in the `backend/migrations/` directory.

## Verification

After applying the fix, test the guest authentication:

```bash
# Create a guest session
curl -X POST https://jewgo-app-oyoh.onrender.com/api/v5/guest/create

# Expected response (should include sessionToken):
# {
#   "sessionId": "...",
#   "sessionToken": "...",
#   "expiresAt": "...",
#   "guestUser": {...}
# }

# Test with the session token
curl -H "Authorization: Bearer <sessionToken>" \
  https://jewgo-app-oyoh.onrender.com/api/v5/entities?limit=5

# Expected: Should return entities list (not 401 error)
```

## Technical Details

### Before (Broken)

```sql
UPDATE guest_sessions
SET last_used_at = NOW()
WHERE session_token = p_session_token
  AND expires_at > NOW();
```

### After (Fixed)

```sql
UPDATE guest_sessions
SET last_used_at = NOW()
WHERE guest_sessions.session_token = p_session_token
  AND guest_sessions.expires_at > NOW();
```

## Files Changed

1. **backend/migrations/008_fix_guest_session_validation.sql** - New migration file
2. **backend/scripts/apply-guest-fix.sh** - Script to apply the fix
3. **GUEST_AUTH_FIX.md** - This documentation

## Related Files

- `backend/src/auth/GuestService.js` - Guest session management logic
- `backend/migrations/004_guest_accounts.sql` - Original guest session setup
- `database/scripts/fix-validate-guest-session.sql` - Earlier fix attempt (not applied)

## Status

- [x] Issue identified
- [x] Migration created
- [x] Application script created
- [ ] Applied to production
- [ ] Verified working

## Next Steps

1. Apply the migration to production using one of the methods above
2. Test guest authentication functionality
3. Monitor logs for any remaining errors
4. Update this document with verification results
