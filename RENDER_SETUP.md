# 🎨 Your Render Setup Guide

## Your Render Service Info

- **URL**: https://jewgo-app-oyoh.onrender.com
- **Service ID**: srv-d2ieq27diees739vo1pg
- **GitHub**: mml555/jewgo-ios-app (main branch)

---

## Step 1: Add PostgreSQL Database

1. Go to your **[Render Dashboard](https://dashboard.render.com)**

2. Click **"New +"** → **"PostgreSQL"**

3. Configure:

   - **Name**: `jewgo-postgres`
   - **Database**: `jewgo_prod`
   - **User**: `jewgo_user`
   - **Region**: Oregon (US West) - same as your backend
   - **Plan**: Free

4. Click **"Create Database"**

5. **Wait 2-3 minutes** for database to provision

6. Once ready, go to the database → **"Info"** tab
   - Copy the **Internal Database URL** (starts with `postgresql://`)
   - You'll need this in Step 2

---

## Step 2: Configure Environment Variables

1. Go to your backend service: https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg

2. Click **"Environment"** in the left sidebar

3. Add these environment variables (click "Add Environment Variable" for each):

### Core Configuration

```
NODE_ENV = production
PORT = 3001
```

### Database Configuration

```
DB_SSL = true
DATABASE_URL = [paste Internal Database URL from your PostgreSQL]
```

**After pasting DATABASE_URL, Render will auto-parse it into these:**

- It should automatically populate DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

**OR manually add:**

```
DB_HOST = [from your database Info tab]
DB_PORT = 5432
DB_NAME = jewgo_prod
DB_USER = jewgo_user
DB_PASSWORD = [from your database Info tab]
```

### JWT Configuration (use the secrets generated above)

```
JWT_SECRET = 89b4c5e0b4c773120c5cd050f969a3649ac8a6a9b5a6b454886890f96d0b9610f6dac3c8cc618d5eca710cec48e423cce88700923038db22c90ca7c01b068021

JWT_REFRESH_SECRET = db153d8e57c50efafda89529359f199561d437f94dcf970a3bd5ca0ff1fe1fbcc950902dc7d276d47429d17b3580ba4c8be5f41a7506c76fcd5e7638995eb075

JWT_ACCESS_TTL = 15m
JWT_REFRESH_TTL = 7d
JWT_ISSUER = jewgo-auth
JWT_AUDIENCE = jewgo-api
```

### CORS Configuration

```
CORS_ORIGIN = *
```

_Note: For production, replace `_` with your actual domain\*

### Rate Limiting

```
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
```

### Logging

```
LOG_LEVEL = info
LOG_FORMAT = combined
```

4. Click **"Save Changes"**

5. Render will automatically **redeploy** your service (takes 2-3 minutes)

---

## Step 3: Setup Database

Once your service is deployed with the new environment variables, you need to populate the database with the schema and sample data.

### Option A: Using Render Shell (Easiest)

1. Go to your backend service in Render dashboard

2. Click **"Shell"** tab (or https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg/shell)

3. In the shell, run each command one by one:

```bash
# Navigate to project root
cd /opt/render/project/src

# Run migrations in order
psql $DATABASE_URL < ../database/init/01_schema.sql
psql $DATABASE_URL < ../database/init/02_sample_data.sql
psql $DATABASE_URL < ../database/init/03_specials_sample_data.sql
psql $DATABASE_URL < ../database/init/04_events_sample_data.sql
psql $DATABASE_URL < ../database/init/04_jobs_sample_data.sql
psql $DATABASE_URL < ../database/init/05_job_seeker_profiles_sample_data.sql

# Run backend migrations
psql $DATABASE_URL < migrations/001_auth_schema.sql
psql $DATABASE_URL < migrations/002_auth_migration_fixed.sql
psql $DATABASE_URL < migrations/003_jwt_keys.sql
psql $DATABASE_URL < migrations/004_guest_accounts.sql
psql $DATABASE_URL < migrations/005_engagement_metrics.sql
psql $DATABASE_URL < migrations/006_specials_schema.sql
psql $DATABASE_URL < migrations/007_fix_specials_guest_constraints.sql

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM entities;"
```

### Option B: Using Your PostgreSQL Database Shell

1. Go to your PostgreSQL database in Render dashboard

2. Click **"Connect"** → **"External Connection"** → Get connection details

3. Install psql locally if you don't have it:

```bash
brew install postgresql
```

4. Run the setup script from your local machine:

```bash
cd /Users/mendell/JewgoAppFinal

# Get the External Database URL from Render
export DATABASE_URL="postgresql://jewgo_user:YOUR_PASSWORD@dpg-XXXXX-a.oregon-postgres.render.com/jewgo_prod"

# Run migrations
psql $DATABASE_URL < database/init/01_schema.sql
psql $DATABASE_URL < database/init/02_sample_data.sql
psql $DATABASE_URL < database/init/03_specials_sample_data.sql
psql $DATABASE_URL < database/init/04_events_sample_data.sql
psql $DATABASE_URL < database/init/04_jobs_sample_data.sql
psql $DATABASE_URL < database/init/05_job_seeker_profiles_sample_data.sql

# Backend migrations
psql $DATABASE_URL < backend/migrations/001_auth_schema.sql
psql $DATABASE_URL < backend/migrations/002_auth_migration_fixed.sql
psql $DATABASE_URL < backend/migrations/003_jwt_keys.sql
psql $DATABASE_URL < backend/migrations/004_guest_accounts.sql
psql $DATABASE_URL < backend/migrations/005_engagement_metrics.sql
psql $DATABASE_URL < backend/migrations/006_specials_schema.sql
psql $DATABASE_URL < backend/migrations/007_fix_specials_guest_constraints.sql
```

---

## Step 4: Test Your Deployment

### Test Health Endpoint

```bash
curl https://jewgo-app-oyoh.onrender.com/health
```

**Expected response:**

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.0.0",
  "services": {
    "database": "healthy",
    "auth": "healthy"
  }
}
```

### Use Health Check Script

```bash
cd /Users/mendell/JewgoAppFinal/backend
./scripts/health-check.sh https://jewgo-app-oyoh.onrender.com
```

---

## Step 5: Update iOS App Configuration

1. Create/edit `.env.production` in your project root:

```bash
cd /Users/mendell/JewgoAppFinal
```

Create `.env.production` with:

```env
NODE_ENV=production
API_BASE_URL=https://jewgo-app-oyoh.onrender.com/api/v5

# Add your Google keys
GOOGLE_PLACES_API_KEY=your-google-places-api-key
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
```

2. Your `ConfigService.ts` is already configured to use this in production!

---

## Step 6: Build & Test on iOS Device

1. **Open Xcode:**

```bash
cd /Users/mendell/JewgoAppFinal
open ios/JewgoAppFinal.xcworkspace
```

2. **Configure for Release:**

   - Product → Scheme → Edit Scheme
   - Click "Run" in left sidebar
   - Change "Build Configuration" to **"Release"**
   - Click "Close"

3. **Connect your iOS device** via USB

4. **Select your device** in the device dropdown (top of Xcode)

5. **Build and Run:**

   - Press ⌘+R or click the Play button
   - Xcode will build and install on your device

6. **Test the app:**
   - App should connect to https://jewgo-app-oyoh.onrender.com
   - Try logging in
   - View entities, events, jobs
   - Test all features

---

## 🎯 Verification Checklist

- [ ] PostgreSQL database created on Render
- [ ] Environment variables added to backend service
- [ ] Service redeployed successfully
- [ ] Database migrations completed (all tables created)
- [ ] Health endpoint returns "healthy"
- [ ] Can query entities from database
- [ ] `.env.production` created with Render URL
- [ ] iOS app builds in Release mode
- [ ] App installs on physical device
- [ ] App connects to Render backend
- [ ] Can authenticate and view data

---

## 📊 Monitor Your Service

### View Logs

1. Go to https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg
2. Click **"Logs"** tab
3. Watch for errors or issues

### Continuous Monitoring

```bash
# From your local machine
./backend/scripts/monitor.sh https://jewgo-app-oyoh.onrender.com 10
```

### Check Database

```bash
# Connect to your database
# Get connection string from Render dashboard
psql "postgresql://jewgo_user:PASSWORD@dpg-xxx.oregon-postgres.render.com/jewgo_prod"

# Check tables
\dt

# Count entities
SELECT COUNT(*) FROM entities;
```

---

## 🐛 Troubleshooting

### Service Won't Start

- Check logs in Render dashboard
- Verify all environment variables are set
- Check if DATABASE_URL is correct

### Database Connection Errors

- Ensure DB_SSL=true is set
- Verify DATABASE_URL is the **Internal** URL
- Check database is running (should show "Available" in dashboard)

### iOS App Can't Connect

```bash
# Test if backend is accessible
curl https://jewgo-app-oyoh.onrender.com/health

# If this works:
# - Check API_BASE_URL in .env.production
# - Rebuild iOS app (clean build)
# - Ensure building in Release mode

# If this fails:
# - Check Render service is running
# - Check Render logs for errors
```

### Cold Starts (Free Tier)

- Render free tier services spin down after 15 minutes of inactivity
- First request after idle will be slow (15-30 seconds)
- Subsequent requests will be fast
- **Solution**: Upgrade to paid plan ($7/month) for always-on service

---

## 💰 Render Pricing

### Free Tier (Current)

- ✅ 750 hours/month
- ✅ Services spin down after 15min inactivity
- ✅ PostgreSQL database included
- ⚠️ Slower cold starts

### Starter Plan ($7/month)

- ✅ Always-on (no spin down)
- ✅ Faster performance
- ✅ More resources

---

## 🚀 Next Steps

1. **Test thoroughly** on iOS device (1-2 days)
2. **Monitor** for errors and performance
3. **Optimize** if needed
4. **Prepare for TestFlight** beta testing
5. **Consider upgrading** to paid plan for production

---

## 📱 Your iOS App Setup

Your app will automatically use the production URL when built in Release mode because:

1. `ConfigService.ts` checks `__DEV__` flag
2. When `__DEV__ === false` (Release builds), it uses `Config.API_BASE_URL`
3. `.env.production` provides the Render URL

**No code changes needed!** Just build in Release mode and it works! ✨

---

## Quick Commands

```bash
# Test health
curl https://jewgo-app-oyoh.onrender.com/health

# Monitor (continuous)
./backend/scripts/monitor.sh https://jewgo-app-oyoh.onrender.com 10

# View logs (requires Render CLI)
render logs -s srv-d2ieq27diees739vo1pg

# Open dashboard
open https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg
```

---

## 🎊 You're All Set!

Your backend URL: **https://jewgo-app-oyoh.onrender.com**

Follow the steps above to complete your setup. Once the health endpoint returns "healthy", you're ready to test on your iOS device!

**Questions?** Check the logs in Render dashboard or run the health check script.

Good luck! 🚀
