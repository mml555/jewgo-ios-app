# Quick Fix Guide: Guest Authentication Issue

## The Problem (Confirmed)

From your production logs on 2025-10-13, the guest authentication is failing with:

```
Error validating guest session: {
  "code": "42702",
  "detail": "It could refer to either a PL/pgSQL variable or a table column."
}
```

This causes "Continue as Guest" to fail immediately after a guest session is created.

## The Solution

A database function needs to be updated. I've created the fix migration.

## How to Apply (Choose One Method)

### ⚡ FASTEST: Auto-Deploy Method

The migration will be applied automatically on your next deployment:

```bash
# From your local machine
cd /Users/mendell/JewgoAppFinal
git add backend/migrations/008_fix_guest_session_validation.sql
git add backend/scripts/apply-guest-fix.sh
git commit -m "Fix guest authentication - resolve ambiguous column reference"
git push origin main
```

Render will automatically detect the new migration and apply it during deployment.

### 🔧 IMMEDIATE: Manual Fix via Render Shell

For an immediate fix without redeploying:

1. Go to https://dashboard.render.com
2. Open your `jewgo-backend` service
3. Click **"Shell"** in the left menu
4. Run:

```bash
psql $DATABASE_URL << 'EOF'
DROP FUNCTION IF EXISTS validate_guest_session(VARCHAR);

CREATE OR REPLACE FUNCTION validate_guest_session(p_session_token VARCHAR(255))
RETURNS TABLE(
    session_id UUID,
    device_fingerprint VARCHAR(255),
    is_valid BOOLEAN,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gs.id,
        gs.device_fingerprint,
        (gs.expires_at > NOW()) as is_valid,
        gs.expires_at
    FROM guest_sessions gs
    WHERE gs.session_token = p_session_token;

    UPDATE guest_sessions
    SET last_used_at = NOW()
    WHERE guest_sessions.session_token = p_session_token
      AND guest_sessions.expires_at > NOW();
END;
$$ LANGUAGE plpgsql;
EOF
```

5. Exit the shell (Ctrl+D)
6. Done! No restart needed.

### 📝 ALTERNATIVE: Using psql Directly

If you have your Neon database credentials:

```bash
export DATABASE_URL='your-neon-database-url'
cd /Users/mendell/JewgoAppFinal
psql $DATABASE_URL -f backend/migrations/008_fix_guest_session_validation.sql
```

## Verify the Fix

After applying, test with curl:

```bash
# Create a guest session
curl -X POST https://jewgo-app-oyoh.onrender.com/api/v5/guest/create

# You should get a response like:
# {
#   "sessionId": "...",
#   "sessionToken": "abc123...",
#   "expiresAt": "2025-10-14T...",
#   "guestUser": {...}
# }

# Then test with the token
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  https://jewgo-app-oyoh.onrender.com/api/v5/entities?limit=5

# Should return entities list (not 401)
```

Or use the automated test script:

```bash
./test-guest-auth.sh https://jewgo-app-oyoh.onrender.com
```

## What Changed?

The `validate_guest_session` PostgreSQL function now explicitly qualifies column names with the table name to avoid ambiguity:

**Before (Broken):**

```sql
WHERE session_token = p_session_token
```

**After (Fixed):**

```sql
WHERE guest_sessions.session_token = p_session_token
```

## Files Created/Modified

- ✅ `backend/migrations/008_fix_guest_session_validation.sql` - The fix migration
- ✅ `backend/scripts/apply-guest-fix.sh` - Helper script to apply the fix
- ✅ `test-guest-auth.sh` - Test script to verify the fix works
- ✅ `GUEST_AUTH_FIX.md` - Detailed technical documentation
- ✅ `APPLY_GUEST_FIX.md` - This quick guide

## Recommended Action

**I recommend the AUTO-DEPLOY method** (git push) because:

1. ✅ It's the safest (tested in CI/CD)
2. ✅ It keeps your git history clean
3. ✅ It ensures all environments stay in sync
4. ✅ Migration runs automatically on deployment

## Expected Result

After applying the fix:

- ✅ Guest sessions will be created successfully
- ✅ Guest session validation will work properly
- ✅ "Continue as Guest" button will work in the mobile app
- ✅ No more "ambiguous column reference" errors in logs

## Need Help?

If you encounter any issues:

1. Check Render logs: https://dashboard.render.com → your service → Logs
2. Look for any new error messages
3. Verify the function exists: `SELECT proname FROM pg_proc WHERE proname = 'validate_guest_session';`

The fix is backward-compatible and safe to apply at any time.
