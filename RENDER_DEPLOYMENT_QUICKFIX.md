# 🚨 Render Deployment Quick Fix - Neon Database Connection

## Current Issue

Your backend is deployed to Render but **cannot connect to the Neon database**, resulting in:

- `ECONNREFUSED` errors
- Auth system showing as "unhealthy"
- 404 responses from API endpoints

## Root Cause

The `render.yaml` was configured for Render's built-in PostgreSQL service, but you're using **Neon** as your database provider.

## Quick Fix (5 minutes)

### 1️⃣ Get Your Neon Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Select your project
3. Copy your connection string (looks like):
   ```
   postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

### 2️⃣ Add Environment Variable in Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your `jewgo-backend` service
3. Click **Environment** in sidebar
4. Click **Add Environment Variable**
5. Add:
   - **Key:** `DATABASE_URL`
   - **Value:** [paste your Neon connection string]
6. Click **Save Changes**

### 3️⃣ Deploy Updated Code

```bash
# Commit the fixes
git add backend/render.yaml backend/src/server.js backend/src/database/connection.js
git commit -m "Fix: Configure backend for Neon database connection"
git push origin main
```

Render will automatically redeploy (takes ~2-3 minutes).

### 4️⃣ Verify It Works

After deployment completes, check:

```
https://jewgo-app-oyoh.onrender.com/health
```

You should see:

```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected",
    "auth": "operational"
  }
}
```

## ⚠️ Important: Database Schema

Your Neon database must have all the required tables. If you see errors about missing tables:

### Quick Setup (Using Automated Script)

```bash
# Set your Neon connection string
export DATABASE_URL="your-neon-connection-string-here"

# Run setup script
cd database/scripts
./setup_neon.sh
```

The script will:

- Create all required tables
- Set up auth system tables (jwt_keys, users, sessions, etc.)
- Optionally add sample data for testing
- Verify everything is set up correctly

**OR** manually run migrations - see `database/NEON_SETUP_GUIDE.md` for details.

## Files Changed

✅ `backend/render.yaml` - Removed Render PostgreSQL, added DATABASE_URL config  
✅ `backend/src/server.js` - Updated to support DATABASE_URL  
✅ `backend/src/database/connection.js` - Updated to support DATABASE_URL

## What These Changes Do

1. **Support DATABASE_URL**: Backend now reads Neon's connection string format
2. **Increased timeout**: Changed from 2s to 10s (Neon can be slower to connect)
3. **SSL enforced**: Always use SSL for Neon connections
4. **Backward compatible**: Still works with individual DB\_\* env vars for local dev

## Troubleshooting

### Still getting ECONNREFUSED?

✅ Check DATABASE_URL is set in Render  
✅ Verify Neon database is active (not paused)  
✅ Ensure connection string includes `?sslmode=require`

### Getting "relation does not exist" errors?

✅ Run database migrations (see above)  
✅ Check `database/NEON_SETUP_GUIDE.md`

### Health check shows "unhealthy"?

✅ Check Render logs for specific error  
✅ Verify JWT_SECRET and JWT_REFRESH_SECRET are set in Render

## Next Steps After Fix

1. ✅ Verify health endpoint works
2. ✅ Test a few API endpoints
3. ✅ Update mobile app to use Render URL
4. ✅ Monitor logs for any issues

## Related Documentation

- 📖 **Full deployment guide:** `RENDER_NEON_DEPLOYMENT_FIX.md`
- 📖 **Database setup guide:** `database/NEON_SETUP_GUIDE.md`
- 📖 **Migration reference:** `database/migrations/`

---

**Need help?** Check the full guide in `RENDER_NEON_DEPLOYMENT_FIX.md`
