# ⚡ Quick Start: Render + Neon (5 Minutes)

**Your backend is already on Render, just needs a database!**

## 🎯 Your Current Setup

- ✅ Backend: https://jewgo-app-oyoh.onrender.com (deployed)
- ⏳ Database: Need to add Neon

---

## Step 1: Create Neon Database (2 min)

1. Go to **[neon.tech](https://neon.tech)** → Sign up (free)
2. Click **"Create a Project"**
3. Name: `jewgo-prod`
4. Region: **US East** or **US West**
5. Click **"Create Project"**
6. **COPY THE CONNECTION STRING** - it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Add to Render (1 min)

1. Go to: https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg
2. Click **"Environment"**
3. Add these variables:

```
DATABASE_URL = [paste Neon connection string from Step 1]
DB_SSL = true
NODE_ENV = production

JWT_SECRET = 89b4c5e0b4c773120c5cd050f969a3649ac8a6a9b5a6b454886890f96d0b9610f6dac3c8cc618d5eca710cec48e423cce88700923038db22c90ca7c01b068021

JWT_REFRESH_SECRET = db153d8e57c50efafda89529359f199561d437f94dcf970a3bd5ca0ff1fe1fbcc950902dc7d276d47429d17b3580ba4c8be5f41a7506c76fcd5e7638995eb075

JWT_ACCESS_TTL = 15m
JWT_REFRESH_TTL = 7d
JWT_ISSUER = jewgo-auth
JWT_AUDIENCE = jewgo-api
CORS_ORIGIN = *
```

4. Click **"Save Changes"** - Render will redeploy (2-3 min)

---

## Step 3: Setup Database (from your Mac)

```bash
# Install psql if needed
brew install postgresql

# Set your Neon connection string (from Step 1)
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Go to project
cd /Users/mendell/JewgoAppFinal

# Run migrations (one command each)
psql $DATABASE_URL < database/init/01_schema.sql
psql $DATABASE_URL < database/init/02_sample_data.sql
psql $DATABASE_URL < database/init/03_specials_sample_data.sql
psql $DATABASE_URL < database/init/04_events_sample_data.sql
psql $DATABASE_URL < backend/migrations/001_auth_schema.sql
psql $DATABASE_URL < backend/migrations/002_auth_migration_fixed.sql
psql $DATABASE_URL < backend/migrations/003_jwt_keys.sql
psql $DATABASE_URL < backend/migrations/004_guest_accounts.sql
psql $DATABASE_URL < backend/migrations/005_engagement_metrics.sql
psql $DATABASE_URL < backend/migrations/006_specials_schema.sql

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM entities;"
```

---

## Step 4: Test (30 sec)

```bash
curl https://jewgo-app-oyoh.onrender.com/health
```

Should return `"status": "healthy"` ✅

---

## Step 5: Update iOS App (1 min)

```bash
cd /Users/mendell/JewgoAppFinal

cat > .env.production << 'EOF'
NODE_ENV=production
API_BASE_URL=https://jewgo-app-oyoh.onrender.com/api/v5
GOOGLE_PLACES_API_KEY=your-key
EOF
```

---

## Step 6: Build iOS App

1. Open Xcode: `open ios/JewgoAppFinal.xcworkspace`
2. Select **Release** scheme
3. Select your **physical device**
4. Build & Run (⌘+R)

Done! 🎉

---

## 🆘 Issues?

### Backend still unhealthy

```bash
# Check Render logs
open https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg

# Look for database connection errors
```

### Can't connect to Neon

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# If fails: check connection string includes ?sslmode=require
```

---

## 📚 Full Guide

See **NEON_SETUP.md** for detailed instructions and troubleshooting.

---

**Total Time: ~5-10 minutes** ⚡
