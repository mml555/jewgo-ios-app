# 🚀 Deployment Documentation

Complete guide for deploying the Jewgo backend and testing on iOS devices.

## 📚 Documentation Index

### Getting Started

1. **[Quick Start Guide](QUICK_START.md)** ⭐ START HERE

   - 10-minute setup for iOS testing
   - Step-by-step Railway deployment
   - Fastest way to get backend online

2. **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)**

   - Complete checklist for deployment
   - Pre-flight checks
   - Testing verification
   - Rollback procedures

3. **[iOS Testing Setup](IOS_TESTING_SETUP.md)**
   - Detailed deployment options (Railway, Render, Heroku)
   - Environment configuration
   - iOS app setup
   - Troubleshooting guide

### Scripts & Tools

4. **[Backend Scripts](../../backend/scripts/README.md)**
   - Generate secrets
   - Setup database
   - Health checks
   - Monitoring tools

---

## 🎯 Quick Navigation

### First Time Deploying?

→ Start with **[Quick Start Guide](QUICK_START.md)**

### Need Detailed Steps?

→ See **[iOS Testing Setup](IOS_TESTING_SETUP.md)**

### Ready to Deploy?

→ Use **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)**

### Already Deployed?

→ Check **[Backend Scripts](../../backend/scripts/README.md)** for monitoring

---

## 📋 Deployment Options

### Option 1: Railway (Recommended)

**Best for**: Quick testing, easy setup, modern interface

**Pros**:

- ✅ Fastest setup (10 minutes)
- ✅ Auto-deploys from GitHub
- ✅ Free tier ($5 credit/month)
- ✅ Built-in PostgreSQL
- ✅ Easy environment variables
- ✅ Automatic SSL
- ✅ Great developer experience

**Cons**:

- ⚠️ Free tier has limits
- ⚠️ Services sleep after inactivity (on free tier)

**Cost**: Free tier → $5/month hobby

→ **[Railway Deployment Guide](IOS_TESTING_SETUP.md#option-1-deploy-to-railway-recommended)**

---

### Option 2: Render

**Best for**: Free hosting, similar to Railway

**Pros**:

- ✅ True free tier
- ✅ Auto-deploys from GitHub
- ✅ Built-in PostgreSQL
- ✅ Automatic SSL
- ✅ Blueprint deployment (YAML config)

**Cons**:

- ⚠️ Services spin down after 15min inactivity (free tier)
- ⚠️ Slower cold starts

**Cost**: Free → $7/month for always-on

→ **[Render Deployment Guide](IOS_TESTING_SETUP.md#option-2-deploy-to-render-alternative)**

---

### Option 3: Heroku

**Best for**: Established platform, lots of add-ons

**Pros**:

- ✅ Mature platform
- ✅ Many add-ons (Redis, monitoring, etc.)
- ✅ Good documentation
- ✅ Procfile deployment

**Cons**:

- ⚠️ No free tier (removed Nov 2022)
- ⚠️ More expensive ($5 backend + $5 DB = $10/month)

**Cost**: ~$10/month minimum

→ **[Heroku Deployment Guide](IOS_TESTING_SETUP.md#option-3-deploy-to-heroku-classic)**

---

## 🛠️ What's Included

### Configuration Files Created

```
backend/
├── railway.json          # Railway deployment config
├── render.yaml           # Render Blueprint config
├── Procfile              # Heroku/generic deployment
└── scripts/
    ├── generate-secrets.js        # Generate JWT secrets
    ├── setup-database.sh          # Initialize database
    ├── quick-deploy-railway.sh    # One-command deploy
    ├── health-check.sh            # Test deployment
    ├── monitor.sh                 # Monitor backend
    └── README.md                  # Scripts documentation

docs/deployment/
├── README.md                      # This file
├── QUICK_START.md                 # 10-minute guide
├── IOS_TESTING_SETUP.md          # Detailed guide
└── DEPLOYMENT_CHECKLIST.md       # Deployment checklist

.env.production.example            # Production config template
```

---

## 🚦 Deployment Workflow

### 1. Pre-Deployment (Local)

```bash
# Verify everything works locally
npm start                    # Backend
npx react-native run-ios     # iOS app

# Generate secrets
cd backend
node scripts/generate-secrets.js
```

### 2. Deploy Backend

```bash
# Choose your platform (Railway recommended)
# Follow Quick Start guide
```

### 3. Setup Database

```bash
# Install Railway CLI
npm install -g @railway/cli

# Setup database
railway run ./backend/scripts/setup-database.sh $DATABASE_URL
```

### 4. Verify Deployment

```bash
# Health check
./backend/scripts/health-check.sh https://your-app.railway.app
```

### 5. Configure iOS App

```bash
# Create production config
cp .env .env.production

# Edit API_BASE_URL
API_BASE_URL=https://your-app.railway.app/api/v5
```

### 6. Build & Test iOS

```bash
# Build for physical device in Xcode
# Select Release scheme
# Install on iOS device
# Test all features
```

---

## ✅ Success Checklist

Your deployment is successful when:

- [ ] Backend health endpoint returns `"status": "healthy"`
- [ ] Database contains sample data
- [ ] iOS app connects to backend
- [ ] Can login/authenticate
- [ ] Can view entities, events, jobs
- [ ] Can create favorites
- [ ] Images load correctly
- [ ] No console errors
- [ ] Performance is acceptable

---

## 📊 Monitoring

### Basic Health Check

```bash
# One-time check
./backend/scripts/health-check.sh https://your-app.railway.app
```

### Continuous Monitoring

```bash
# Monitor every 10 seconds
./backend/scripts/monitor.sh https://your-app.railway.app 10
```

### Platform Dashboards

- **Railway**: Built-in metrics, logs, usage
- **Render**: Logs, metrics, health checks
- **Heroku**: Logs, metrics, add-ons

---

## 🐛 Troubleshooting

### Backend Issues

| Problem                   | Solution                                |
| ------------------------- | --------------------------------------- |
| Backend won't start       | Check logs, verify env vars             |
| Database connection error | Verify `DB_SSL=true`, check credentials |
| Slow performance          | Check database indexes, upgrade plan    |
| Rate limiting errors      | Increase `RATE_LIMIT_MAX_REQUESTS`      |

### iOS Issues

| Problem                  | Solution                                  |
| ------------------------ | ----------------------------------------- |
| Can't connect to backend | Check `API_BASE_URL` in `.env.production` |
| CORS errors              | Set `CORS_ORIGIN=*` temporarily           |
| SSL/certificate errors   | Ensure using `https://`                   |
| Authentication fails     | Check JWT secrets match                   |

→ **[Full Troubleshooting Guide](IOS_TESTING_SETUP.md#troubleshooting)**

---

## 💰 Cost Comparison

| Platform    | Free Tier          | Hobby/Basic | Notes            |
| ----------- | ------------------ | ----------- | ---------------- |
| **Railway** | $5 credit/month    | $5/month    | Best for testing |
| **Render**  | Free (with limits) | $7/month    | True free tier   |
| **Heroku**  | None               | ~$10/month  | Most expensive   |

**Recommendation for Testing**: Railway or Render free tier

**Recommendation for Production**: Railway Hobby ($5/mo) or Render Starter ($7/mo)

---

## 📱 Next Steps After Deployment

Once your backend is deployed and iOS app is working:

1. **Test Thoroughly**

   - Test all features on physical device
   - Test on multiple iOS devices if possible
   - Monitor for crashes and errors
   - Check performance under load

2. **Prepare for TestFlight**

   - Create App Store Connect account
   - Set up TestFlight
   - Add beta testers
   - Submit build

3. **Production Readiness**

   - Add custom domain
   - Set up Redis for caching
   - Configure email service
   - Add error tracking (Sentry)
   - Set up automated backups
   - Implement CI/CD

4. **Launch**
   - Beta test for 1-2 weeks
   - Fix reported issues
   - Optimize performance
   - Submit to App Store

---

## 📚 Additional Resources

### Official Documentation

- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Heroku Docs](https://devcenter.heroku.com)

### React Native iOS

- [Building for iOS](https://reactnative.dev/docs/running-on-device)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)
- [App Store Connect](https://appstoreconnect.apple.com)

### Jewgo Project Docs

- [Database Setup](../database/DATABASE_SETUP.md)
- [Authentication Guide](../authentication/FRONTEND_IMPLEMENTATION_SUMMARY.md)
- [System Status](../SYSTEM_STATUS.md)

---

## 🆘 Getting Help

### Check These First

1. Health endpoint: `https://your-app.railway.app/health`
2. Backend logs in platform dashboard
3. iOS device logs in Xcode (Window → Devices and Simulators)
4. Troubleshooting section in docs

### Common Commands

```bash
# Test backend
curl https://your-app.railway.app/health

# Check Railway logs
railway logs

# Monitor backend
./backend/scripts/monitor.sh https://your-app.railway.app

# Rebuild iOS app
cd ios && pod install && cd ..
npx react-native run-ios --configuration Release
```

---

## ✨ Summary

You now have:

- ✅ Complete deployment configuration for Railway, Render, and Heroku
- ✅ Helper scripts for deployment and monitoring
- ✅ Step-by-step guides for iOS testing
- ✅ Troubleshooting documentation
- ✅ Production-ready configuration templates

**Next**: Follow the **[Quick Start Guide](QUICK_START.md)** to deploy your backend in 10 minutes!

---

**Last Updated**: January 2025
**Status**: Production Ready 🚀
