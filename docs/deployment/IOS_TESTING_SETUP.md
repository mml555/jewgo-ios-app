# iOS Testing Setup - Backend Hosting Guide

This guide will help you deploy your backend to test the Jewgo app on physical iOS devices.

## Quick Start (Recommended: Railway)

Railway offers the fastest setup with a generous free tier perfect for testing.

### Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Your iOS device for testing

---

## Option 1: Deploy to Railway (Recommended - Easiest)

### Step 1: Prepare Your Backend

1. **Generate JWT Secrets** (run in terminal):

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Save these secrets - you'll need them in Step 3.

### Step 2: Push to GitHub

```bash
# Make sure your code is committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 3: Deploy to Railway

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub

2. **Click "New Project" → "Deploy from GitHub repo"**

3. **Select your `JewgoAppFinal` repository**

4. **Select the `backend` folder** as the root directory

   - Railway will auto-detect it's a Node.js project

5. **Add PostgreSQL Database**:

   - Click "New" in your project
   - Select "Database" → "Add PostgreSQL"
   - Railway will automatically provision a database

6. **Configure Environment Variables**:
   Click on your backend service → "Variables" tab and add:

   ```env
   NODE_ENV=production
   PORT=3001

   # Database (auto-filled by Railway when you link the database)
   DB_SSL=true

   # JWT Secrets (use the ones you generated in Step 1)
   JWT_SECRET=your-generated-secret-here
   JWT_REFRESH_SECRET=your-generated-refresh-secret-here
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=7d
   JWT_ISSUER=jewgo-auth
   JWT_AUDIENCE=jewgo-api

   # CORS (add your domain if you have one)
   CORS_ORIGIN=*

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=info
   LOG_FORMAT=combined
   ```

7. **Link Database to Backend**:

   - Click on your backend service
   - Go to "Variables" tab
   - Click "Reference" and select your PostgreSQL database
   - This will automatically add `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

8. **Generate Domain**:
   - Go to "Settings" tab in your backend service
   - Click "Generate Domain"
   - You'll get a URL like: `https://jewgo-backend.up.railway.app`
   - **Save this URL - you'll need it for the iOS app**

### Step 4: Run Database Migrations

1. **Connect to Railway PostgreSQL**:

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Link to your project
   cd backend
   railway link
   ```

2. **Run migrations**:

   ```bash
   # Option A: Using Railway CLI
   railway run psql < ../database/init/01_schema.sql
   railway run psql < ../database/init/02_sample_data.sql
   railway run psql < ../database/init/03_specials_sample_data.sql
   railway run psql < ../database/init/04_events_sample_data.sql
   railway run psql < ../database/init/04_jobs_sample_data.sql
   railway run psql < ../database/init/05_job_seeker_profiles_sample_data.sql

   # Option B: Use Railway dashboard
   # Go to your PostgreSQL database → "Data" tab
   # Copy and paste the SQL files content one by one
   ```

### Step 5: Update iOS App Configuration

1. **Create production config** file:

   ```bash
   # In your project root
   cp .env .env.production
   ```

2. **Edit `.env.production`**:

   ```env
   NODE_ENV=production
   API_BASE_URL=https://your-app-name.up.railway.app/api/v5

   # Add your other production keys
   GOOGLE_PLACES_API_KEY=your-key
   GOOGLE_OAUTH_CLIENT_ID=your-client-id
   ```

3. **Update ConfigService** (if needed):
   - The app should automatically use `API_BASE_URL` from `.env.production` in production builds

### Step 6: Build and Test on iOS

1. **Build for iOS**:

   ```bash
   # Install pods
   cd ios
   pod install
   cd ..

   # Build with production config
   npx react-native run-ios --configuration Release
   ```

2. **Or build for physical device in Xcode**:

   - Open `ios/JewgoAppFinal.xcworkspace`
   - Select your physical device
   - Select "Release" scheme
   - Build and run (⌘+R)

3. **Test the connection**:
   - Open the app on your iOS device
   - It should now connect to your Railway backend
   - Check the health endpoint: `https://your-app.railway.app/health`

---

## Option 2: Deploy to Render (Alternative)

Render is another great option with a free tier.

### Quick Steps:

1. **Go to [render.com](https://render.com)** and sign up

2. **New Blueprint** → Connect your GitHub repository

3. **Use the `backend/render.yaml`** configuration we created

4. **Add environment variables** in Render dashboard (same as Railway)

5. **Render will**:

   - Automatically provision PostgreSQL
   - Deploy your backend
   - Give you a URL like: `https://jewgo-backend.onrender.com`

6. **Follow Steps 4-6 from Railway guide** to set up database and iOS app

---

## Option 3: Deploy to Heroku (Classic)

### Quick Steps:

1. **Install Heroku CLI**:

   ```bash
   brew tap heroku/brew && brew install heroku
   ```

2. **Login and create app**:

   ```bash
   heroku login
   cd backend
   heroku create jewgo-backend
   ```

3. **Add PostgreSQL**:

   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set environment variables**:

   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   heroku config:set JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   # ... add other variables
   ```

5. **Deploy**:

   ```bash
   git push heroku main
   ```

6. **Run migrations**:
   ```bash
   heroku pg:psql < ../database/init/01_schema.sql
   # ... run other migration files
   ```

---

## Verify Deployment

### Test Backend Health

```bash
# Replace with your actual URL
curl https://your-app-name.up.railway.app/health
```

Expected response:

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

### Test API Endpoints

```bash
# Test entities endpoint (requires auth or guest token)
curl https://your-app-name.up.railway.app/api/v5/entities
```

---

## Troubleshooting

### Backend won't start

- Check Railway/Render logs for errors
- Verify all environment variables are set
- Check database connection string

### Database connection errors

- Ensure `DB_SSL=true` is set
- Verify database credentials
- Check if database is running (Railway/Render dashboard)

### CORS errors from iOS app

- Add `*` to `CORS_ORIGIN` for testing
- Or add your specific domain

### Rate limiting issues during testing

- Temporarily increase `RATE_LIMIT_MAX_REQUESTS` to `1000`
- Or disable rate limiting in development

### iOS app can't connect

- Verify API_BASE_URL in `.env.production`
- Check if backend URL is accessible from browser
- Test health endpoint: `https://your-url.railway.app/health`
- Rebuild iOS app with production configuration

---

## Production Checklist

Before going live with real users:

- [ ] Generate strong JWT secrets (64+ characters)
- [ ] Set up proper CORS origins (not `*`)
- [ ] Configure proper rate limiting
- [ ] Set up email service (SendGrid, Mailgun, etc.)
- [ ] Configure Redis for better rate limiting (optional)
- [ ] Set up monitoring (Railway/Render has built-in monitoring)
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure backups for PostgreSQL
- [ ] Set up SSL certificate (automatic on Railway/Render)
- [ ] Test all API endpoints
- [ ] Load test with expected traffic

---

## Cost Estimates

### Railway (Recommended for Testing)

- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month
- Includes: 512MB RAM, PostgreSQL database
- Perfect for testing and small deployments

### Render

- **Free Tier**: Free (with limitations)
- Services spin down after inactivity
- Perfect for testing

### Heroku

- **Mini**: $5/month (backend)
- **Mini Postgres**: $5/month (database)
- Total: ~$10/month

---

## Next Steps

1. ✅ Deploy backend to Railway/Render
2. ✅ Run database migrations
3. ✅ Update iOS app configuration
4. ✅ Build and test on physical iOS device
5. 📱 Submit to TestFlight for beta testing
6. 🚀 Launch to App Store

---

## Support

If you run into issues:

1. Check backend logs in Railway/Render dashboard
2. Test health endpoint
3. Verify environment variables
4. Check database connection

For Railway-specific help: [Railway Docs](https://docs.railway.app)
For Render-specific help: [Render Docs](https://render.com/docs)
