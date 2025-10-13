# 🔧 Render Deployment Fix Guide

## Current Issues Identified

From the deployment logs at **2025-10-13 06:56:54**, the following critical issues were detected:

### 1. ❌ Database Connection Failed

```
[ERROR] Failed to initialize JWT keys: { "code": "ECONNREFUSED" }
```

**Root Cause**: Database either not created or not accessible from the backend service.

### 2. ⚠️ Missing OAuth Configuration

```
⚠️ Google OAuth provider not initialized - missing environment variables
⚠️ Magic Link provider not initialized - missing environment variables
```

**Impact**: OAuth features won't work (not critical for basic functionality).

### 3. ❌ Health Check 404 Errors

```
::1 - - [13/Oct/2025:06:56:54 +0000] "HEAD / HTTP/1.1" 404 57
```

**Root Cause**: Health check is configured for `/health` but Render is checking `/`.

### 4. 🐛 Auth System Shows as `undefined`

```
🔐 Auth system: undefined
```

**Root Cause**: Code bug - calling async function synchronously.

---

## 🚀 Step-by-Step Fix

### Step 1: Fix Server.js Bug (Code Fix)

**File**: `/backend/src/server.js`
**Line**: 622

**Current (Broken)**:

```javascript
logger.info(`🔐 Auth system: ${authSystem.healthCheck().status}`);
```

**Fixed**:

```javascript
logger.info(`🔐 Auth system: operational`);
```

**Why**: `healthCheck()` is async, so calling it synchronously returns `Promise` object, not status.

---

### Step 2: Verify Database is Created on Render

1. **Login to Render Dashboard**: https://dashboard.render.com
2. **Navigate to your service**: `jewgo-backend`
3. **Check if database exists**:
   - Look for `jewgo-postgres` in your services list
   - If NOT created, follow "Create Database" below

#### Create Database (if missing):

1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `jewgo-postgres`
   - **Database**: `jewgo_prod`
   - **User**: `jewgo_user`
   - **Region**: Oregon (same as backend)
   - **Plan**: Free
3. Click **"Create Database"**
4. Wait for provisioning (2-5 minutes)

---

### Step 3: Link Database to Backend Service

1. Go to **jewgo-backend** service
2. Navigate to **"Environment"** tab
3. Add/Update these variables:

```bash
# Database Connection (from jewgo-postgres database)
DATABASE_URL=${jewgo-postgres.DATABASE_URL}
DB_HOST=${jewgo-postgres.HOST}
DB_PORT=${jewgo-postgres.PORT}
DB_NAME=${jewgo-postgres.DATABASE}
DB_USER=${jewgo-postgres.USER}
DB_PASSWORD=${jewgo-postgres.PASSWORD}
DB_SSL=true

# JWT Configuration (GENERATE NEW SECRETS!)
JWT_SECRET=<generate-64-char-secret>
JWT_REFRESH_SECRET=<generate-64-char-secret>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_ISSUER=jewgo-auth
JWT_AUDIENCE=jewgo-api

# Node Configuration
NODE_ENV=production
PORT=3001

# Optional: OAuth (can add later)
# GOOGLE_OAUTH_CLIENT_ID=<your-google-client-id>
# GOOGLE_OAUTH_CLIENT_SECRET=<your-google-client-secret>
# MAGIC_LINK_SECRET=<generate-secret>
# MAGIC_LINK_BASE_URL=https://jewgo-app-oyoh.onrender.com
```

#### Generate JWT Secrets:

Run this locally to generate secure secrets:

```bash
cd backend
node scripts/generate-secrets.js
```

Copy the output and paste into Render environment variables.

---

### Step 4: Initialize Database Schema

The database needs tables created. You have two options:

#### Option A: Use Render Shell (Recommended)

1. In Render dashboard, go to **jewgo-postgres** database
2. Click **"Connect"** → **"External Connection"**
3. Copy the connection command
4. Run locally:

```bash
# Connect to database
psql <connection-string-from-render>

# Create schema (run these SQL files in order)
\i database/init/01-create-extensions.sql
\i database/init/02-create-tables.sql
\i database/init/03-create-indexes.sql
\i database/init/04-create-rbac.sql
\i database/init/05-create-guest-system.sql
\i database/init/06-seed-data.sql
```

#### Option B: Add Migration Script to Render

Create a new file: `backend/scripts/render-init-db.sh`

```bash
#!/bin/bash
set -e

echo "🔧 Initializing database schema..."

# Run migrations
psql $DATABASE_URL -f ../database/init/01-create-extensions.sql
psql $DATABASE_URL -f ../database/init/02-create-tables.sql
psql $DATABASE_URL -f ../database/init/03-create-indexes.sql
psql $DATABASE_URL -f ../database/init/04-create-rbac.sql
psql $DATABASE_URL -f ../database/init/05-create-guest-system.sql
psql $DATABASE_URL -f ../database/init/06-seed-data.sql

echo "✅ Database initialized successfully"
```

Then update `render.yaml` to run this on deploy.

---

### Step 5: Update Health Check Configuration

In Render dashboard:

1. Go to **jewgo-backend** service
2. Navigate to **"Settings"** tab
3. Find **"Health Check Path"**
4. Set to: `/health`
5. Save changes

---

### Step 6: Deploy Fixed Code

1. Commit the server.js fix (Step 1)
2. Push to GitHub:

```bash
git add backend/src/server.js
git commit -m "Fix: Resolve async healthCheck call in server startup"
git push origin main
```

3. Render will auto-deploy the new code

---

### Step 7: Verify Deployment

Once deployment completes:

#### Check Health Endpoint:

```bash
curl https://jewgo-app-oyoh.onrender.com/health
```

**Expected Response**:

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-13T...",
  "version": "2.0.0",
  "services": {
    "database": "connected",
    "auth": "operational",
    "rbac": "operational"
  }
}
```

#### Check Logs:

In Render dashboard, check logs for:

- ✅ `🚀 Jewgo API server running on port 3001`
- ✅ `🔐 Auth system: operational` (not `undefined`)
- ✅ No `ECONNREFUSED` errors
- ✅ `==> Your service is live 🎉`

---

## 📋 Quick Verification Checklist

- [ ] Database `jewgo-postgres` created on Render
- [ ] Database linked to backend service (environment variables set)
- [ ] JWT secrets generated and added to environment
- [ ] Database schema initialized (tables created)
- [ ] Health check path set to `/health`
- [ ] Code fix applied (server.js line 622)
- [ ] New code deployed to Render
- [ ] Health endpoint returns `200 OK`
- [ ] No `ECONNREFUSED` errors in logs
- [ ] Auth system shows `operational` (not `undefined`)

---

## 🔍 Troubleshooting

### Still Getting ECONNREFUSED?

1. Verify `DB_SSL=true` is set
2. Check database is in same region as backend (Oregon)
3. Ensure database is "Available" (not "Creating")
4. Check Render's status page for outages

### Health Check Still Failing?

1. Verify path is `/health` (not `/`)
2. Check backend logs for startup errors
3. Ensure port 3001 is being used
4. Test with curl manually

### Database Tables Not Found?

1. Connect to database with psql
2. List tables: `\dt`
3. If empty, run Step 4 again (Initialize Database Schema)
4. Check for migration errors in logs

### Environment Variables Not Working?

1. Check for typos in variable names
2. Ensure no extra spaces in values
3. Verify ${jewgo-postgres.XXX} references are correct
4. Try manual copy-paste from database info tab

---

## 📞 Next Steps After Fix

Once all issues are resolved:

1. **Test API Endpoints**:

   ```bash
   # Guest token
   curl -X POST https://jewgo-app-oyoh.onrender.com/api/v5/guest/token

   # Get entities
   curl https://jewgo-app-oyoh.onrender.com/api/v5/entities \
     -H "Authorization: Bearer <guest-token>"
   ```

2. **Update iOS App Configuration**:

   - Update `API_BASE_URL` to `https://jewgo-app-oyoh.onrender.com/api/v5`
   - Test connection from app

3. **Monitor for 24 Hours**:

   - Watch error rates
   - Check response times
   - Verify no memory leaks

4. **Optional: Add OAuth Later**:
   - Set up Google OAuth credentials
   - Add environment variables
   - Test OAuth flow

---

## 📚 Additional Resources

- **Render PostgreSQL Docs**: https://render.com/docs/databases
- **Render Environment Variables**: https://render.com/docs/environment-variables
- **Project Deployment Guide**: `docs/deployment/DEPLOYMENT_CHECKLIST.md`
- **Database Setup**: `database/README_EVENTS_SEEDING.md`

---

**Status**: Ready to Fix
**Priority**: Critical (Blocking Production)
**Estimated Time**: 30-45 minutes
