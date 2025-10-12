# 🚀 Quick Start - Deploy Backend for iOS Testing

**Goal**: Get your backend online in 10 minutes so you can test your iOS app on a physical device.

---

## Step 1: Generate Secrets (1 minute)

```bash
cd backend
node scripts/generate-secrets.js
```

**Copy the output** - you'll paste these into Railway in Step 3.

---

## Step 2: Deploy to Railway (2 minutes)

1. Go to **[railway.app](https://railway.app)** and sign in with GitHub

2. Click **"New Project"**

3. Select **"Deploy from GitHub repo"**

4. Choose **`JewgoAppFinal`** repository

5. Railway will ask for the service directory:

   - Set **Root Directory**: `/backend`
   - Click **"Deploy"**

6. Railway will automatically:
   - Detect Node.js
   - Install dependencies
   - Start your server

---

## Step 3: Add Database (1 minute)

1. In your Railway project, click **"New"**

2. Select **"Database"** → **"Add PostgreSQL"**

3. Railway will provision a PostgreSQL database

4. Click your **backend service**

5. Go to **"Variables"** tab

6. Click **"Add Reference"** → Select your PostgreSQL database

This automatically adds: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, etc.

---

## Step 4: Add Environment Variables (2 minutes)

In your backend service → **"Variables"** tab, add these:

```env
NODE_ENV=production
DB_SSL=true

# Paste the secrets from Step 1
JWT_SECRET=[paste your generated secret]
JWT_REFRESH_SECRET=[paste your generated secret]
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_ISSUER=jewgo-auth
JWT_AUDIENCE=jewgo-api

# For testing, allow all origins
CORS_ORIGIN=*

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

Click **"Deploy"** to restart with new variables.

---

## Step 5: Get Your URL & Setup Database (2 minutes)

1. In your backend service, go to **"Settings"** tab

2. Click **"Generate Domain"**

3. Copy your URL (e.g., `https://jewgo-backend.up.railway.app`)

4. **Setup Database**:

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link project
   cd backend
   railway link

   # Setup database
   ./scripts/setup-database.sh $DATABASE_URL
   ```

   Or manually in Railway:

   - Click your PostgreSQL database
   - Go to **"Data"** tab
   - Copy/paste content from `database/init/` files

---

## Step 6: Test Your Backend (1 minute)

```bash
# Replace with your actual Railway URL
curl https://jewgo-backend.up.railway.app/health
```

Expected response:

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "2.0.0"
}
```

✅ **If you see this, your backend is live!**

---

## Step 7: Update iOS App (1 minute)

1. Create `.env.production` in your project root:

```bash
cp .env .env.production
```

2. Edit `.env.production`:

```env
NODE_ENV=production
API_BASE_URL=https://your-railway-url.up.railway.app/api/v5

# Add your other keys
GOOGLE_PLACES_API_KEY=your-key
GOOGLE_OAUTH_CLIENT_ID=your-client-id
```

3. Update `ConfigService.ts` to use production URL when not in `__DEV__` mode (already configured!)

---

## Step 8: Build & Test iOS App (2 minutes)

### Option A: Test in Simulator

```bash
npx react-native run-ios --configuration Release
```

### Option B: Test on Physical Device

1. Open Xcode:

   ```bash
   open ios/JewgoAppFinal.xcworkspace
   ```

2. Select your physical device (connected via USB)

3. Select **"Release"** scheme (Product → Scheme → Edit Scheme → Run → Release)

4. Click **Run** (⌘+R)

5. Test the app - it should now connect to your Railway backend!

---

## 🎉 Done!

Your backend is now live and your iOS app can connect to it!

### Next Steps:

- **Monitor**: Check Railway dashboard for logs and metrics
- **Test**: Try all features in your app
- **TestFlight**: Ready to distribute to beta testers
- **Production**: Add custom domain, Redis, email service

---

## Troubleshooting

### Backend won't start

- Check logs: Railway dashboard → Your service → "Deployments" → "View Logs"
- Verify all environment variables are set

### iOS app can't connect

```bash
# Test if backend is accessible
curl https://your-url.railway.app/health

# If this works but app doesn't connect:
# 1. Check API_BASE_URL in .env.production
# 2. Rebuild iOS app (clean build folder in Xcode)
# 3. Check ConfigService.ts is reading .env.production
```

### Database errors

```bash
# Verify database connection
railway run psql -c "SELECT COUNT(*) FROM entities;"

# If errors, re-run database setup
railway run ./scripts/setup-database.sh $DATABASE_URL
```

### CORS errors

- Set `CORS_ORIGIN=*` in Railway variables (for testing)
- Redeploy backend

---

## Cost

**Railway Free Tier**: $5 credit/month

- Perfect for testing
- Enough for 1-2 apps
- No credit card required

**Railway Hobby**: $5/month

- For production
- 8GB RAM, unlimited projects

---

## Support

**Railway Docs**: https://docs.railway.app
**Community**: https://discord.gg/railway

**Jewgo Docs**: See `docs/deployment/IOS_TESTING_SETUP.md` for detailed guide
