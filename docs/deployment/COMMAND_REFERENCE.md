# 🎯 Quick Command Reference

Essential commands for deploying and managing your Jewgo backend.

## 🚀 Initial Deployment

```bash
# 1. Generate secrets (save the output!)
cd backend
node scripts/generate-secrets.js

# 2. Deploy to Railway (after creating project in UI)
npm install -g @railway/cli
railway login
railway link
./scripts/quick-deploy-railway.sh

# 3. Setup database
railway run ./scripts/setup-database.sh $DATABASE_URL

# 4. Test deployment
./scripts/health-check.sh https://your-app.railway.app
```

## 📱 iOS App Configuration

```bash
# 1. Create production config
cp .env .env.production

# 2. Edit API_BASE_URL in .env.production
# API_BASE_URL=https://your-app.railway.app/api/v5

# 3. Build for iOS device
open ios/JewgoAppFinal.xcworkspace
# Select Release scheme, build to device
```

## 🔧 Maintenance Commands

### Backend Monitoring

```bash
# One-time health check
./backend/scripts/health-check.sh https://your-app.railway.app

# Continuous monitoring (every 10 seconds)
./backend/scripts/monitor.sh https://your-app.railway.app 10

# Check Railway logs
railway logs
railway logs --tail  # Follow logs
```

### Database Management

```bash
# Connect to database
railway run psql

# Run SQL command
railway run psql -c "SELECT COUNT(*) FROM entities;"

# Backup database
railway run pg_dump > backup.sql

# Restore database
railway run psql < backup.sql
```

### Deployment Updates

```bash
# Push changes (Railway auto-deploys)
git add .
git commit -m "Update"
git push origin main

# Manual deploy via CLI
./backend/scripts/quick-deploy-railway.sh

# Restart service
railway restart
```

## 🧪 Testing

```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Test API endpoints
curl https://your-app.railway.app/api/v5/dashboard/entities/stats

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.railway.app/api/v5/entities

# Performance test
ab -n 100 -c 10 https://your-app.railway.app/health
```

## 🐛 Troubleshooting

```bash
# View logs
railway logs

# Check environment variables
railway variables

# Restart service
railway restart

# Open Railway dashboard
railway open

# Check database connection
railway run psql -c "SELECT 1"

# Run database migrations manually
railway run psql < ../database/init/01_schema.sql
```

## 📊 Railway CLI Commands

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Check status
railway status

# View logs
railway logs
railway logs --tail

# Run command in Railway environment
railway run [command]

# Open dashboard
railway open

# Get domain
railway domain

# List services
railway service

# List environment variables
railway variables

# Set environment variable
railway variables set KEY=VALUE

# Restart service
railway restart

# Deploy
railway up
```

## 🔄 Common Workflows

### Deploy New Code

```bash
git add .
git commit -m "New feature"
git push origin main
# Railway auto-deploys from GitHub
# Wait 1-2 minutes
./backend/scripts/health-check.sh https://your-app.railway.app
```

### Update Environment Variables

```bash
# Via CLI
railway variables set RATE_LIMIT_MAX_REQUESTS=200

# Or via dashboard
railway open
# Go to Variables → Edit → Save
```

### Database Migration

```bash
# Create new migration file
# database/migrations/00X_migration_name.sql

# Run migration
railway run psql < database/migrations/00X_migration_name.sql

# Verify
railway run psql -c "SELECT version();"
```

### Debug Backend Issues

```bash
# 1. Check logs
railway logs --tail

# 2. Check health
curl https://your-app.railway.app/health

# 3. Check database
railway run psql -c "SELECT COUNT(*) FROM entities;"

# 4. Check environment variables
railway variables

# 5. Restart if needed
railway restart
```

## 🎨 iOS Development

### Build for Testing

```bash
# Simulator (development)
npx react-native run-ios

# Physical device (production)
open ios/JewgoAppFinal.xcworkspace
# Select device, Release scheme, build
```

### Clean Build

```bash
# Clean iOS build
cd ios
rm -rf build
rm -rf Pods
rm Podfile.lock
pod install
cd ..

# Clean React Native cache
watchman watch-del-all
rm -rf node_modules
npm install
npx react-native start --reset-cache
```

### View Device Logs

```bash
# In Xcode
# Window → Devices and Simulators
# Select device → Open Console

# Or use command line
xcrun simctl spawn booted log stream --predicate 'processImagePath contains "JewgoAppFinal"'
```

## 📈 Performance

### Monitor Backend

```bash
# Response time
time curl https://your-app.railway.app/health

# Load test
ab -n 1000 -c 50 https://your-app.railway.app/health

# Continuous monitoring
./backend/scripts/monitor.sh https://your-app.railway.app 5
```

### Database Performance

```bash
# Check slow queries
railway run psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Database size
railway run psql -c "SELECT pg_size_pretty(pg_database_size('railway'));"

# Table sizes
railway run psql -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

## 🔐 Security

### Generate New Secrets

```bash
node backend/scripts/generate-secrets.js
# Copy output to Railway variables
```

### Rotate JWT Secrets

```bash
# 1. Generate new secrets
node backend/scripts/generate-secrets.js

# 2. Update Railway variables
railway variables set JWT_SECRET=new_secret
railway variables set JWT_REFRESH_SECRET=new_refresh_secret

# 3. Restart backend
railway restart

# 4. All users will need to re-authenticate
```

### Check Security

```bash
# SSL certificate
curl -vI https://your-app.railway.app 2>&1 | grep -i ssl

# Security headers
curl -I https://your-app.railway.app

# Rate limiting
for i in {1..100}; do curl https://your-app.railway.app/health; done
```

## 📚 Documentation

```bash
# Quick start
cat docs/deployment/QUICK_START.md

# Full guide
cat docs/deployment/IOS_TESTING_SETUP.md

# Checklist
cat docs/deployment/DEPLOYMENT_CHECKLIST.md

# Scripts help
cat backend/scripts/README.md
```

## 🆘 Emergency Commands

```bash
# Backend is down - restart
railway restart

# Database issues - rollback
railway run psql < backup.sql

# High error rate - check logs
railway logs | grep ERROR

# Rate limited - increase limits
railway variables set RATE_LIMIT_MAX_REQUESTS=10000

# CORS issues - allow all (temporarily)
railway variables set CORS_ORIGIN="*"
railway restart
```

## 💡 Pro Tips

```bash
# Alias for common commands
echo 'alias rw="railway"' >> ~/.zshrc
echo 'alias rwl="railway logs --tail"' >> ~/.zshrc
echo 'alias rwh="./backend/scripts/health-check.sh"' >> ~/.zshrc

# Watch logs in real-time
railway logs --tail | grep ERROR

# Quick database check
railway run psql -c "\dt"  # List tables
railway run psql -c "\d entities"  # Describe table

# Test all endpoints
./backend/scripts/health-check.sh https://your-app.railway.app
```

---

## 🔗 Quick Links

- **Railway Dashboard**: `railway open`
- **Deployment Docs**: `docs/deployment/`
- **Health Endpoint**: `https://your-app.railway.app/health`
- **API Base**: `https://your-app.railway.app/api/v5`

---

**Pro Tip**: Bookmark this file for quick command reference!
