# App Reload Instructions

**Date**: October 13, 2025  
**Status**: Metro Bundler Running ✅

---

## ✅ Frontend Reload - COMPLETE

Metro bundler is running with cache reset.

### Next Steps for Frontend:

#### For iOS:

```bash
# Option 1: Run in simulator
npx react-native run-ios

# Option 2: Run on specific device
npx react-native run-ios --device "iPhone Name"

# Option 3: Just reload in running app
# Press Cmd+R in iOS Simulator
```

#### For Android:

```bash
# Option 1: Run in emulator
npx react-native run-android

# Option 2: Reload in running app
# Press R+R (double tap R) in terminal or shake device and tap "Reload"
```

---

## 🌐 Backend Reload - Render Deployment

### Option 1: Manual Deploy (Recommended)

1. **Go to Render Dashboard**:

   - Visit: https://dashboard.render.com
   - Find your service: `jewgo-backend` (or similar name)

2. **Trigger Manual Deploy**:

   - Click on your service
   - Click "Manual Deploy" → "Deploy latest commit"
   - Or click "Deploy" → "Clear build cache & deploy"

3. **Monitor Deployment**:
   - Watch the logs in real-time
   - Wait for "Deploy live" status
   - Usually takes 2-5 minutes

### Option 2: Render CLI Deploy

```bash
# Install Render CLI (if not already installed)
brew install render

# Login to Render
render login

# Deploy your service
render deploy
```

### Option 3: Git Push Deploy (Auto)

```bash
# If you have auto-deploy enabled on main branch
git add .
git commit -m "Deploy: AsyncStorage migration and crash fixes"
git push origin main

# Render will auto-deploy if connected to repo
```

### Option 4: Render API Deploy

```bash
# Get your deploy hook URL from Render Dashboard
# Settings → Deploy Hook

# Trigger deploy via curl
curl -X POST https://api.render.com/deploy/YOUR_DEPLOY_HOOK_ID
```

---

## 🔍 Verify Backend Deployment

### Check Backend Health

```bash
# Replace with your Render URL
curl https://your-app.onrender.com/health

# Or check a specific endpoint
curl https://your-app.onrender.com/api/status
```

### Check Logs

```bash
# In Render Dashboard
# Click your service → Logs tab
# Watch for:
# - "Server started on port XXXX"
# - "Database connected"
# - No error messages
```

---

## 📱 Complete Reload Process

### Step-by-Step:

1. ✅ **Metro Bundler** - Already running with cache reset
2. **Deploy Backend** - Use one of the methods above
3. **Wait for Backend** - 2-5 minutes for Render deploy
4. **Run Frontend App**:

   ```bash
   # iOS
   npx react-native run-ios

   # OR Android
   npx react-native run-android
   ```

5. **Test Critical Flows**:
   - Login/Authentication
   - Navigation between screens
   - Form saving/loading
   - Guest session

---

## 🚨 If Backend Won't Start

### Check Render Logs

Look for common issues:

- Database connection errors
- Environment variable missing
- Port binding issues
- Memory/CPU limits

### Quick Fixes

```bash
# 1. Check environment variables in Render Dashboard
# Settings → Environment → Verify all required vars

# 2. Check build logs for errors
# Look in Render Dashboard → Deploy logs

# 3. Restart service
# In Render Dashboard → Settings → Restart Service
```

---

## 🔧 Environment Variables to Verify on Render

Make sure these are set in Render Dashboard:

```env
NODE_ENV=production
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
PORT=10000  # Or whatever Render assigns
```

---

## 📊 Post-Reload Checklist

After reload, verify:

- [ ] Metro bundler running (localhost:8081)
- [ ] Backend deployed and healthy on Render
- [ ] Frontend app launches without errors
- [ ] Can navigate between screens
- [ ] Authentication works
- [ ] Forms save/load correctly
- [ ] No console errors
- [ ] New crash fixes are active

---

## 🎯 Quick Commands Summary

```bash
# Frontend (already running)
# Metro is running on http://localhost:8081

# Run iOS
npx react-native run-ios

# Run Android
npx react-native run-android

# Backend (Render)
# Go to: https://dashboard.render.com
# Click: Manual Deploy → Deploy latest commit

# Test backend
curl https://your-app.onrender.com/health
```

---

## 💡 Tips

### Metro Bundler

- If Metro stops, run: `npx react-native start --reset-cache`
- Clear cache if issues: `npx react-native start --reset-cache`
- Check port 8081 is not in use

### Render Backend

- First deploy after code changes takes longer (build + deploy)
- Subsequent deploys are faster
- Free tier may spin down after inactivity (takes ~30 sec to wake)
- Check "Deploys" tab for deploy history

### Testing New Fixes

- Test navigation with missing params (should show alert)
- Test offline mode (should not crash)
- Test form persistence (should save/restore)
- Test error scenarios (should show error boundaries)

---

**Metro Status**: ✅ Running  
**Backend Status**: Awaiting manual deploy on Render  
**Next Action**: Deploy backend on Render Dashboard

---

Need help? Check the logs:

- Metro: `tail -f logs/metro.log`
- Render: Dashboard → Logs tab
