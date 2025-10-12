# 🚀 Neon Database Setup (Recommended!)

## Why Neon + Render is the Perfect Combo

**Backend**: Render (https://jewgo-app-oyoh.onrender.com)  
**Database**: Neon (serverless PostgreSQL)

### Benefits

- ✅ Better free tier (3GB vs 1GB)
- ✅ No cold starts on database
- ✅ Faster queries
- ✅ Branch databases for testing
- ✅ Better performance overall
- ✅ Can switch backend providers anytime

---

## Step 1: Create Neon Database (3 minutes)

1. **Go to [Neon](https://neon.tech)** and sign up (free)

2. Click **"Create Project"**

3. Configure:

   - **Project name**: `jewgo-prod`
   - **Postgres version**: 15 (default)
   - **Region**: **US East (Ohio)** or **US West (Oregon)** - choose closest to your users
   - Click **"Create Project"**

4. **Copy your connection string** - you'll see it immediately:

   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

   Keep this safe! You'll need it in Step 2.

---

## Step 2: Update Render Environment Variables (2 minutes)

1. Go to your Render backend: https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg

2. Click **"Environment"** tab

3. Add/Update these variables:

### Database Connection (from Neon)

```
DATABASE_URL = postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

DB_SSL = true
```

**Note:** Neon requires `sslmode=require` in the connection string, which is already included!

### Core Configuration

```
NODE_ENV = production
PORT = 3001
```

### JWT Secrets (generated earlier)

```
JWT_SECRET = 89b4c5e0b4c773120c5cd050f969a3649ac8a6a9b5a6b454886890f96d0b9610f6dac3c8cc618d5eca710cec48e423cce88700923038db22c90ca7c01b068021

JWT_REFRESH_SECRET = db153d8e57c50efafda89529359f199561d437f94dcf970a3bd5ca0ff1fe1fbcc950902dc7d276d47429d17b3580ba4c8be5f41a7506c76fcd5e7638995eb075

JWT_ACCESS_TTL = 15m
JWT_REFRESH_TTL = 7d
JWT_ISSUER = jewgo-auth
JWT_AUDIENCE = jewgo-api
```

### Other Settings

```
CORS_ORIGIN = *
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 100
LOG_LEVEL = info
LOG_FORMAT = combined
```

4. Click **"Save Changes"**

5. Render will redeploy (takes 2-3 minutes)

---

## Step 3: Setup Database Schema (5 minutes)

### Option A: Using SQL Editor in Neon (Easiest!)

1. Go to **[Neon Console](https://console.neon.tech)**

2. Select your `jewgo-prod` project

3. Click **"SQL Editor"** in the left sidebar

4. Copy and paste the contents of each SQL file (in order):

#### Main Schema

```sql
-- Copy/paste from: database/init/01_schema.sql
-- Then click "Run"
```

#### Sample Data

```sql
-- Copy/paste from: database/init/02_sample_data.sql
-- Then click "Run"
```

#### Specials Data

```sql
-- Copy/paste from: database/init/03_specials_sample_data.sql
-- Then click "Run"
```

#### Events Data

```sql
-- Copy/paste from: database/init/04_events_sample_data.sql
-- Then click "Run"
```

#### Jobs Data

```sql
-- Copy/paste from: database/init/04_jobs_sample_data.sql
-- Then click "Run"
```

#### Job Seeker Profiles

```sql
-- Copy/paste from: database/init/05_job_seeker_profiles_sample_data.sql
-- Then click "Run"
```

#### Backend Migrations (in order)

```sql
-- Copy/paste from: backend/migrations/001_auth_schema.sql
-- Then click "Run"

-- Repeat for:
-- 002_auth_migration_fixed.sql
-- 003_jwt_keys.sql
-- 004_guest_accounts.sql
-- 005_engagement_metrics.sql
-- 006_specials_schema.sql
-- 007_fix_specials_guest_constraints.sql
```

### Option B: Using psql from Local Machine

1. **Install psql** (if you don't have it):

```bash
brew install postgresql
```

2. **Get your Neon connection string** from the Neon console

3. **Run migrations:**

```bash
cd /Users/mendell/JewgoAppFinal

# Set your Neon connection string
export DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Main schema and data
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

# Verify
psql $DATABASE_URL -c "SELECT COUNT(*) FROM entities;"
```

### Option C: Using Render Shell

1. Go to your Render backend: https://dashboard.render.com/web/srv-d2ieq27diees739vo1pg

2. Click **"Shell"** tab

3. Run migrations:

```bash
cd /opt/render/project/src

# Main schema
psql $DATABASE_URL < ../database/init/01_schema.sql
psql $DATABASE_URL < ../database/init/02_sample_data.sql
psql $DATABASE_URL < ../database/init/03_specials_sample_data.sql
psql $DATABASE_URL < ../database/init/04_events_sample_data.sql
psql $DATABASE_URL < ../database/init/04_jobs_sample_data.sql
psql $DATABASE_URL < ../database/init/05_job_seeker_profiles_sample_data.sql

# Backend migrations
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

---

## Step 4: Verify Everything Works

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

### Check Database in Neon Console

1. Go to Neon console → Your project
2. Click **"Tables"** in the left sidebar
3. You should see all your tables: `entities`, `events`, `jobs`, etc.

---

## Step 5: Update iOS App

Create/edit `.env.production`:

```bash
cd /Users/mendell/JewgoAppFinal
cat > .env.production << 'EOF'
NODE_ENV=production
API_BASE_URL=https://jewgo-app-oyoh.onrender.com/api/v5
GOOGLE_PLACES_API_KEY=your-google-places-key
GOOGLE_OAUTH_CLIENT_ID=your-google-oauth-client-id
EOF
```

---

## 🎯 Architecture Overview

```
┌─────────────────┐
│   iOS Device    │
│  (Release App)  │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────┐
│  Render Backend             │
│  jewgo-app-oyoh.onrender.com│
│  (Node.js API)              │
└────────┬────────────────────┘
         │ PostgreSQL
         │ (SSL)
         ▼
┌─────────────────────────────┐
│  Neon Database              │
│  (Serverless PostgreSQL)    │
│  3GB Storage (Free)         │
└─────────────────────────────┘
```

**Why this is great:**

- Backend can scale independently
- Database always fast (no cold starts)
- Can switch backend hosting anytime
- Better free tier limits
- Professional architecture

---

## 💰 Cost Comparison

### Neon (Database)

- **Free Tier**: 3GB storage, 300 compute hours/month
- **Pro**: $19/month - unlimited projects, more storage
- **Perfect for**: Testing and small production apps

### Render (Backend)

- **Free Tier**: 750 hours/month (services sleep after 15min)
- **Starter**: $7/month - always-on
- **Perfect for**: API backend

### Total Cost

- **Free**: $0 (Neon free + Render free)
- **Production**: $7/month (Neon free + Render Starter)
- **Optimized**: Both services complement each other perfectly!

---

## 🚀 Neon Features You'll Love

### 1. Instant Database Branches

Create test databases instantly:

```bash
# In Neon console, click "Branching"
# Create a branch for testing new features
# Each branch is a complete copy!
```

### 2. Point-in-Time Recovery

Travel back in time if you mess up:

- Restore to any point in last 7 days (free tier)
- No need for manual backups

### 3. Monitoring

Built-in monitoring in Neon console:

- Query performance
- Storage usage
- Connection stats
- No extra setup needed

### 4. Auto-scaling

Automatically scales up during high load, down during low usage

---

## 🔧 Managing Your Neon Database

### Access SQL Editor

1. Go to https://console.neon.tech
2. Select your project
3. Click "SQL Editor"
4. Run queries directly!

### Connection String

You can get connection strings for:

- **Main branch** (production)
- **Development branch** (testing)
- **Feature branches** (experiments)

### Create a Development Branch

1. In Neon console, click "Branching"
2. Click "Create Branch"
3. Name it "development"
4. Now you have two databases:
   - `main` - production
   - `development` - safe testing

---

## 🐛 Troubleshooting

### Connection Errors

```bash
# Test connection locally
psql "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" -c "SELECT 1"

# Should return: 1
```

### SSL Errors

Ensure your connection string has `?sslmode=require` at the end.

### Render Can't Connect

1. Check DATABASE_URL in Render environment variables
2. Verify it includes `sslmode=require`
3. Check Neon database is running (should always be)
4. Look at Render logs for specific error

### Backend Shows "Database Disconnected"

```bash
# Check Render logs
# Go to Render dashboard → Your service → Logs

# Common issues:
# 1. Wrong DATABASE_URL
# 2. Missing sslmode=require
# 3. Neon project suspended (unlikely on free tier)
```

---

## 📊 Monitor Performance

### Neon Console

- Go to your project
- Click "Monitoring"
- View:
  - Query performance
  - Storage usage
  - Connection counts
  - CPU usage

### From Your Local Machine

```bash
# Monitor backend
./backend/scripts/monitor.sh https://jewgo-app-oyoh.onrender.com 10

# Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM entities;"
```

---

## ✅ Setup Checklist

- [ ] Created Neon account and project
- [ ] Copied Neon connection string
- [ ] Added DATABASE_URL to Render environment
- [ ] Added all other environment variables (JWT, CORS, etc.)
- [ ] Saved and redeployed on Render
- [ ] Ran all database migrations
- [ ] Verified tables exist in Neon
- [ ] Tested health endpoint (returns "healthy")
- [ ] Created .env.production with Render URL
- [ ] Built iOS app in Release mode
- [ ] Tested on physical iOS device

---

## 🎊 You're Done!

**Your Setup:**

- ✅ Backend: https://jewgo-app-oyoh.onrender.com
- ✅ Database: Neon (serverless PostgreSQL)
- ✅ Free tier: 3GB storage, fast performance
- ✅ No cold starts on database
- ✅ Ready for iOS testing!

**Next Steps:**

1. Complete the setup (Steps 1-4)
2. Test on iOS device
3. Monitor performance
4. Deploy to TestFlight when ready

---

## 💡 Pro Tips

### Use Neon CLI

```bash
# Install
npm install -g neonctl

# Login
neonctl auth

# List projects
neonctl projects list

# Create branch
neonctl branches create --name development
```

### Connection Pooling

For production, use Neon's pooled connection:

```
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

(Notice `-pooler` in the hostname)

### Monitor Queries

In Neon console:

- Click "Query"
- See all recent queries
- Identify slow queries
- Optimize as needed

---

**This is a much better setup than Render PostgreSQL!** 🚀

Let me know when you've created your Neon database and I'll help you configure it!
