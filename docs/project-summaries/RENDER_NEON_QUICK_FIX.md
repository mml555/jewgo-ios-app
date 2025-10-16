# ⚡ Render + Neon Quick Fix Guide

**Backend**: Render (https://jewgo-app-oyoh.onrender.com)  
**Database**: Neon (PostgreSQL)  
**Current Status**: ❌ Connection Failed  
**Time to Fix**: ~20 minutes

---

## 🚨 Critical Issues Detected

From deployment logs (2025-10-13 06:56:54):

1. **Database Connection Failed** - `ECONNREFUSED`
2. **Auth System Undefined** - Code bug
3. **Health Check 404** - Wrong path
4. **Missing JWT Secrets** - Not configured

---

## ✅ Quick Fix Steps

### Step 1: Get Neon Database Connection String (2 minutes)

1. Go to: https://console.neon.tech
2. Select your project: `jewgo_prod` (or your database name)
3. Click **"Connection Details"** or **"Dashboard"**
4. Copy the **Connection String** (it looks like):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
5. **Keep this safe** - you'll need it in Step 3

---

### Step 2: Generate JWT Secrets (2 minutes)

Run locally:

```bash
cd backend/scripts
./generate-jwt-secrets.sh
```

**Copy the output** - you'll paste it into Render in Step 3.

---

### Step 3: Configure Render Environment Variables (5 minutes)

1. Go to: https://dashboard.render.com
2. Select your service: **jewgo-backend**
3. Go to **"Environment"** tab
4. Add/Update these variables:

#### Database Connection (from Step 1):

```bash
DATABASE_URL=<paste-neon-connection-string>
```

**Example**:

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/jewgo_prod?sslmode=require
```

#### Parsed Database Variables (extract from connection string):

```bash
# If your Neon string is: postgresql://user:pass@host:5432/dbname?sslmode=require
DB_HOST=ep-xxx-xxx.us-east-2.aws.neon.tech
DB_PORT=5432
DB_NAME=jewgo_prod
DB_USER=<your-neon-username>
DB_PASSWORD=<your-neon-password>
DB_SSL=true
```

#### JWT Configuration (from Step 2):

```bash
JWT_SECRET=<paste-from-step-2>
JWT_REFRESH_SECRET=<paste-from-step-2>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_ISSUER=jewgo-auth
JWT_AUDIENCE=jewgo-api
```

#### Node Configuration:

```bash
NODE_ENV=production
PORT=3001
```

4. Click **"Save Changes"**

**⚠️ Important**: Render will automatically redeploy when you save environment variables.

---

### Step 4: Update Health Check Path (1 minute)

While environment variables are being saved:

1. In **jewgo-backend** service, go to **"Settings"** tab
2. Scroll to **"Health Check Path"**
3. Change from `/` to `/health`
4. Click **"Save Changes"**

---

### Step 5: Check if Neon Database is Initialized (3 minutes)

Connect to your Neon database to check if tables exist:

```bash
# Use the connection string from Step 1
psql "postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/jewgo_prod?sslmode=require"

# Once connected, check for tables:
\dt

# Check specific tables:
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM entities;
```

**If tables exist**: Skip to Step 7 ✅  
**If tables DON'T exist**: Continue to Step 6 👇

---

### Step 6: Initialize Neon Database (10 minutes)

**Only do this if Step 5 showed no tables!**

#### Option A: Use the Script (Recommended)

```bash
# Set your Neon connection string
export DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/jewgo_prod?sslmode=require"

# Run initialization
cd backend/scripts
./render-init-db.sh
```

#### Option B: Manual SQL Execution

```bash
# Run each file in order
psql "<neon-connection-string>" -f database/init/01-create-extensions.sql
psql "<neon-connection-string>" -f database/init/02-create-tables.sql
psql "<neon-connection-string>" -f database/init/03-create-indexes.sql
psql "<neon-connection-string>" -f database/init/04-create-rbac.sql
psql "<neon-connection-string>" -f database/init/05-create-guest-system.sql
psql "<neon-connection-string>" -f database/init/06-seed-data.sql
```

---

### Step 7: Deploy Code Fix (3 minutes)

The code fix is ready. Commit and push:

```bash
# Add fixed files
git add backend/src/server.js
git add backend/scripts/render-init-db.sh
git add backend/scripts/generate-jwt-secrets.sh
git add RENDER_NEON_QUICK_FIX.md
git add DEPLOYMENT_STATUS.md

# Commit
git commit -m "fix: Resolve Render deployment with Neon database - connection, auth system, health check"

# Push (Render will auto-deploy)
git push origin main
```

Wait ~2-3 minutes for Render to deploy.

---

### Step 8: Verify Everything Works (2 minutes)

Once deployment shows "Live" on Render:

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
    "rbac": "operational",
    "captcha": "operational",
    "mfa": "operational",
    "email": "operational",
    "oidc": "operational",
    "keyRotation": "operational"
  }
}
```

**If you see this**, you're done! ✅

---

## 🔍 Troubleshooting

### Still Getting ECONNREFUSED?

**Check Neon Database Status**:

1. Go to Neon console
2. Verify database is "Active" (not "Suspended")
3. Check compute endpoint is running
4. Neon auto-suspends after inactivity - it may need to wake up (takes ~1-2 seconds)

**Check Connection String**:

- Must include `?sslmode=require` at the end
- Password may contain special characters (URL-encode them)
- Use the **pooled connection** string if available (faster)

**Test Connection Manually**:

```bash
psql "<your-neon-connection-string>" -c "SELECT 1"
```

### Auth System Still Shows Undefined?

- Ensure you pushed the code fix (Step 7)
- Check Render deployed the latest commit (check commit hash in Render dashboard)
- Review Render logs for startup errors

### Health Check Returns 404?

- Verify path is `/health` in Settings
- Wait 1 minute after changing settings
- Try direct access: `curl https://jewgo-app-oyoh.onrender.com/health`

### Neon Connection Pooling Errors?

Neon has connection limits. If you see "too many connections":

1. Use Neon's **Pooled Connection** string instead
2. Or reduce `max: 20` to `max: 10` in backend/src/server.js (line 47)

---

## 📋 Neon-Specific Notes

### Connection String Types

Neon provides two types of connection strings:

**Direct Connection** (lower latency, limited connections):

```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech:5432/dbname
```

**Pooled Connection** (recommended for production, unlimited connections):

```
postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech:5432/dbname?sslmode=require
```

**Use the pooled connection for production!**

### Auto-Suspend

Neon automatically suspends compute after 5 minutes of inactivity (free tier).

- First request after suspend takes ~1-2 seconds (cold start)
- Subsequent requests are fast
- This is normal and expected behavior

### SSL Mode

Neon **requires** SSL connections:

- Always include `?sslmode=require` in connection string
- Set `DB_SSL=true` in Render environment variables

---

## ✅ Success Checklist

- [ ] Neon connection string obtained
- [ ] JWT secrets generated
- [ ] Render environment variables configured
- [ ] Health check path updated to `/health`
- [ ] Neon database initialized (tables created)
- [ ] Code fix committed and pushed
- [ ] Render deployment shows "Live"
- [ ] Health endpoint returns 200 OK
- [ ] No errors in Render logs

---

## 🎯 Next Steps After Fix

### 1. Test API Endpoints

```bash
# Get guest token
curl -X POST https://jewgo-app-oyoh.onrender.com/api/v5/guest/token

# Test entities endpoint
curl https://jewgo-app-oyoh.onrender.com/api/v5/entities \
  -H "Authorization: Bearer <guest-token>"
```

### 2. Update iOS App

Edit `.env.production` (or your production config):

```bash
API_BASE_URL=https://jewgo-app-oyoh.onrender.com/api/v5
```

### 3. Monitor for 24 Hours

- Watch Render logs for errors
- Check response times
- Verify Neon compute doesn't suspend too often
- Monitor error rates

---

## 📞 Additional Resources

- **Neon Console**: https://console.neon.tech
- **Render Dashboard**: https://dashboard.render.com
- **Detailed Fix Guide**: `RENDER_DEPLOYMENT_FIX.md`
- **Backend Scripts**: `backend/scripts/README.md`
- **Neon Docs**: https://neon.tech/docs/introduction

---

**Once all steps are complete, your Render + Neon backend is ready!** 🎉
