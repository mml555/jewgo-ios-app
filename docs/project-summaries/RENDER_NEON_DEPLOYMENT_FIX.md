# Render + Neon Database Deployment Fix

## Problem Summary

Your backend is deployed to Render but configured to use Render's PostgreSQL service instead of your Neon database. This causes a `ECONNREFUSED` error when the backend tries to initialize JWT keys.

**Error in logs:**

```
[2025-10-13T07:19:48.031Z] [ERROR] Failed to initialize JWT keys: {
  "code": "ECONNREFUSED"
}
[2025-10-13T07:19:48.031Z] [INFO] 🔐 Auth system: unhealthy
```

## Solution

### Step 1: Get Your Neon Database Connection String

1. Log in to your [Neon Console](https://console.neon.tech)
2. Select your project
3. Go to the **Dashboard** or **Connection Details**
4. Copy the **Connection String** (it should look like this):
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Configure Environment Variables in Render

1. Go to your [Render Dashboard](https://dashboard.render.com)
2. Navigate to your `jewgo-backend` service
3. Click on **Environment** in the left sidebar
4. Add the following environment variable:

   - **Key:** `DATABASE_URL`
   - **Value:** Your Neon connection string (paste the full string from Step 1)

5. Verify these environment variables are also set (they should already be there):
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `DB_SSL` = `true`
   - `JWT_SECRET` (should be auto-generated)
   - `JWT_REFRESH_SECRET` (should be auto-generated)
   - `JWT_ACCESS_TTL` = `15m`
   - `JWT_REFRESH_TTL` = `7d`
   - `JWT_ISSUER` = `jewgo-auth`
   - `JWT_AUDIENCE` = `jewgo-api`

### Step 3: Verify Neon Database Schema

Before deploying, make sure your Neon database has all the required tables. You need to run the migrations on your Neon database.

#### Option A: Run migrations manually in Neon SQL Editor

1. Go to your Neon Console
2. Open the **SQL Editor**
3. Run the migrations from `/database/init/` and `/database/migrations/` in order

#### Option B: Use a migration script locally

1. Set the `DATABASE_URL` environment variable locally:

   ```bash
   export DATABASE_URL="your-neon-connection-string"
   ```

2. Run migrations using psql or a migration tool:
   ```bash
   # If you have psql installed
   psql $DATABASE_URL -f database/init/01-schema.sql
   psql $DATABASE_URL -f database/init/02-entity-types.sql
   # ... continue with all init and migration files
   ```

### Step 4: Deploy the Updated Code

1. Commit the changes to your repository:

   ```bash
   git add backend/render.yaml backend/src/server.js backend/src/database/connection.js
   git commit -m "Fix: Configure backend for Neon database"
   git push origin main
   ```

2. Render will automatically detect the changes and redeploy

### Step 5: Monitor the Deployment

1. Go to your Render Dashboard
2. Click on your `jewgo-backend` service
3. Go to the **Logs** tab
4. Watch for these success messages:
   ```
   ✅ Connected to PostgreSQL database
   🔐 Auth system: healthy
   🚀 Jewgo API server running on port 3001
   ```

### Step 6: Test the Deployment

1. Open your backend health check endpoint:

   ```
   https://jewgo-app-oyoh.onrender.com/health
   ```

2. You should see a response like:
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "2025-10-13T...",
     "version": "2.0.0",
     "services": {
       "database": "connected",
       "auth": "operational",
       ...
     }
   }
   ```

## Troubleshooting

### If you still see connection errors:

1. **Check DATABASE_URL format:** Ensure it ends with `?sslmode=require`
2. **Verify Neon IP allowlist:** Make sure Render's IP addresses are allowed in Neon (Neon free tier usually allows all IPs)
3. **Check Neon database is active:** Neon may pause databases after inactivity - check your Neon console

### If migrations haven't been run:

You'll see errors like:

```
relation "jwt_keys" does not exist
```

Solution: Run all migration files from `/database/init/` and `/database/migrations/` on your Neon database.

### Common Migration Order:

1. `/database/init/01-schema.sql` - Core tables
2. `/database/init/02-entity-types.sql` - Entity type data
3. `/database/init/03-users-auth.sql` - Auth system tables
4. Continue with remaining init files and migration files in order

## What Changed

### 1. `backend/render.yaml`

- Removed reference to Render's PostgreSQL service (`jewgo-postgres`)
- Added comment to configure `DATABASE_URL` manually in Render dashboard

### 2. `backend/src/server.js`

- Updated database pool configuration to support `DATABASE_URL`
- Increased connection timeout for Neon (10 seconds vs 2 seconds)
- Falls back to individual DB\_\* env vars if DATABASE_URL not provided

### 3. `backend/src/database/connection.js`

- Same updates as server.js for consistency

## Next Steps

After the backend is successfully deployed and connected to Neon:

1. Update your mobile app's API endpoint to use the Render URL
2. Test all API endpoints
3. Monitor logs for any database performance issues
4. Consider upgrading Neon plan if you need more connections/storage

## Additional Resources

- [Neon Documentation](https://neon.tech/docs)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
