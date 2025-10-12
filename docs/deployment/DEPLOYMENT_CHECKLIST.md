# 📋 Deployment Checklist for iOS Testing

Use this checklist to ensure successful deployment of your backend for iOS device testing.

## Pre-Deployment

### Code Preparation

- [ ] All changes committed to git
- [ ] Code tested locally
- [ ] No console errors in development
- [ ] Database migrations tested locally
- [ ] Environment variables documented

### Backend Setup

- [ ] Backend runs successfully locally (`npm start`)
- [ ] Health endpoint works (`curl http://localhost:3001/health`)
- [ ] Database connection working
- [ ] All API endpoints tested with Postman/curl

### Frontend Setup

- [ ] iOS app builds successfully
- [ ] App connects to local backend
- [ ] All features work on iOS simulator
- [ ] No TypeScript errors
- [ ] No linting errors

---

## Hosting Platform Setup

### Choose Your Platform

- [ ] Railway (recommended - easiest)
- [ ] Render (good alternative)
- [ ] Heroku (classic option)
- [ ] Other: ********\_********

### Account Setup

- [ ] Created account on hosting platform
- [ ] Connected GitHub account
- [ ] Payment method added (if needed)
- [ ] Email verified

---

## Backend Deployment (Railway)

### Step 1: Generate Secrets

- [ ] Run `node backend/scripts/generate-secrets.js`
- [ ] Copy secrets to secure location (password manager)
- [ ] Keep secrets ready for environment variable setup

### Step 2: Create Project

- [ ] Create new project on Railway
- [ ] Deploy from GitHub repository
- [ ] Select correct repository
- [ ] Set root directory to `/backend`
- [ ] Wait for initial deployment

### Step 3: Add Database

- [ ] Add PostgreSQL database
- [ ] Database provisioned successfully
- [ ] Database credentials available

### Step 4: Configure Environment Variables

- [ ] Set `NODE_ENV=production`
- [ ] Set `PORT=3001`
- [ ] Set `DB_SSL=true`
- [ ] Add `JWT_SECRET` (from Step 1)
- [ ] Add `JWT_REFRESH_SECRET` (from Step 1)
- [ ] Set JWT configuration (`JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, etc.)
- [ ] Set `CORS_ORIGIN=*` (for testing)
- [ ] Link database (adds `DATABASE_URL`, `DB_HOST`, etc.)
- [ ] Set rate limiting variables
- [ ] Set logging variables

### Step 5: Generate Domain

- [ ] Generate public domain in Railway
- [ ] Copy domain URL (e.g., `https://jewgo-backend.up.railway.app`)
- [ ] Test domain is accessible

### Step 6: Setup Database

- [ ] Install Railway CLI: `npm install -g @railway/cli`
- [ ] Login: `railway login`
- [ ] Link project: `railway link`
- [ ] Run setup script: `railway run ./backend/scripts/setup-database.sh $DATABASE_URL`
- [ ] Verify tables created: `railway run psql -c "SELECT COUNT(*) FROM entities;"`

### Step 7: Verify Deployment

- [ ] Run health check: `./backend/scripts/health-check.sh https://your-url.railway.app`
- [ ] Health endpoint returns `"status": "healthy"`
- [ ] Database connection working
- [ ] Check Railway logs for errors
- [ ] No critical errors in logs

---

## iOS App Configuration

### Step 1: Create Production Config

- [ ] Copy `.env` to `.env.production`
- [ ] Update `API_BASE_URL` with Railway URL + `/api/v5`
- [ ] Verify `NODE_ENV=production`
- [ ] Add Google API keys if needed
- [ ] Save file

### Step 2: Verify Configuration

- [ ] Check `ConfigService.ts` uses `Config.API_BASE_URL` in production
- [ ] Verify `__DEV__` flag detection working
- [ ] No hardcoded localhost URLs in code

### Step 3: Build for Testing

- [ ] Open Xcode: `open ios/JewgoAppFinal.xcworkspace`
- [ ] Connect iOS device via USB
- [ ] Select physical device in Xcode
- [ ] Change scheme to "Release" (Product → Scheme → Edit Scheme)
- [ ] Clean build folder (⌘+Shift+K)
- [ ] Build and run (⌘+R)

### Step 4: Test on Device

- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Network requests go to Railway URL (check logs)
- [ ] Login/authentication works
- [ ] Can fetch entities, events, jobs
- [ ] Can create favorites
- [ ] Can view details screens
- [ ] Maps and location work
- [ ] Images load correctly
- [ ] No network errors in app

---

## Verification & Testing

### Backend Health

- [ ] Health endpoint accessible
- [ ] Response time < 1 second
- [ ] No database connection errors
- [ ] All API endpoints responding

### API Endpoints Test

- [ ] `GET /api/v5/entities` (with auth/guest token)
- [ ] `GET /api/v5/events` (with auth/guest token)
- [ ] `GET /api/v5/jobs` (with auth/guest token)
- [ ] `GET /api/v5/specials` (with auth/guest token)
- [ ] `POST /api/v5/auth/login` (authentication)
- [ ] `POST /api/v5/guest/token` (guest access)

### iOS App Functionality

- [ ] App connects to production backend
- [ ] Authentication flow works
- [ ] Guest mode works
- [ ] Data loads on all screens
- [ ] Search functionality works
- [ ] Favorites system works
- [ ] Navigation smooth
- [ ] No performance issues
- [ ] No memory leaks

### Performance

- [ ] App launch time acceptable
- [ ] List scrolling smooth
- [ ] Images load quickly
- [ ] API responses < 2 seconds
- [ ] No lag in UI interactions

---

## Security Check

### Backend Security

- [ ] JWT secrets are strong (64+ chars)
- [ ] Secrets not committed to git
- [ ] Database credentials secure
- [ ] Rate limiting enabled
- [ ] CORS configured (not `*` in production)
- [ ] SSL/HTTPS working
- [ ] No sensitive data in logs

### iOS App Security

- [ ] API keys not hardcoded
- [ ] Using environment variables
- [ ] HTTPS only (no HTTP)
- [ ] User data encrypted locally
- [ ] Tokens stored securely

---

## Monitoring Setup

### Basic Monitoring

- [ ] Health checks set up
- [ ] Can view Railway logs
- [ ] Error tracking configured
- [ ] Uptime monitoring (optional)

### Optional Advanced Monitoring

- [ ] Sentry integration
- [ ] Application performance monitoring
- [ ] Custom analytics
- [ ] Alerts configured

---

## Documentation

### Record Deployment Info

- [ ] Backend URL: ********\_********
- [ ] Database URL: ********\_******** (keep secure!)
- [ ] Deployment date: ********\_********
- [ ] Platform: ********\_********
- [ ] Environment variables documented
- [ ] Secrets backed up securely

### Update Documentation

- [ ] Add deployment notes to project docs
- [ ] Document any issues encountered
- [ ] Update team on new backend URL
- [ ] Create rollback plan

---

## Post-Deployment

### Immediate Actions

- [ ] Monitor logs for first hour
- [ ] Test all major features
- [ ] Verify no error spikes
- [ ] Check database performance

### 24-Hour Follow-up

- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify uptime
- [ ] Test on multiple iOS devices

### Week-Long Monitoring

- [ ] Monitor usage patterns
- [ ] Check for memory leaks
- [ ] Review API response times
- [ ] Optimize if needed

---

## Rollback Plan (If Needed)

- [ ] Know how to revert deployment on Railway
- [ ] Have local backup of database
- [ ] Can quickly switch iOS app back to local backend
- [ ] Team knows rollback procedure

---

## TestFlight Preparation (Next Step)

Once everything is working on physical device:

- [ ] App runs smoothly for 1+ week
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Backend stable and monitored
- [ ] Ready to submit to TestFlight
- [ ] App Store Connect account ready
- [ ] TestFlight build prepared

---

## Common Issues & Solutions

### Backend won't start

- Check environment variables
- Review Railway logs
- Verify database connection
- Check Node.js version

### Database connection fails

- Verify `DB_SSL=true`
- Check database credentials
- Ensure database is running

### iOS app can't connect

- Verify `API_BASE_URL` in `.env.production`
- Check CORS settings
- Ensure building in Release mode
- Test health endpoint manually

### Slow performance

- Check database indexes
- Review API query efficiency
- Monitor Railway metrics
- Consider upgrading plan

---

## Success Criteria

✅ **Ready for iOS Testing** when:

- Backend deployed and healthy
- iOS app connects successfully
- All features working on device
- No critical errors in logs
- Performance acceptable
- Team can access and test

✅ **Ready for TestFlight** when:

- Tested on physical device for 1+ week
- No crashes or major bugs
- Performance optimized
- Backend stable and monitored
- Documentation complete

---

## Support Resources

- **Railway Docs**: https://docs.railway.app
- **Project Docs**: `docs/deployment/IOS_TESTING_SETUP.md`
- **Quick Start**: `docs/deployment/QUICK_START.md`
- **Scripts**: `backend/scripts/README.md`

---

**Last Updated**: January 2025
**Status**: Ready for Deployment
