# Quick Fix Instructions - Logout Crash & Metro Connection

**Issue:** Logout button causes crash  
**Status:** ✅ FIXED  
**Date:** October 13, 2025

## TL;DR - What to Do Now

```bash
# 1. Stop everything
./scripts/stop-dev.sh

# 2. Clean caches
rm -rf /tmp/metro-*
npm start -- --reset-cache &

# 3. In another terminal, rebuild
npx react-native run-ios

# 4. Test logout - it should work now!
```

## What Was Wrong

The app crashed because `ProfileScreen.tsx` was using `Alert.alert()` but forgot to import `Alert` from React Native. Classic JavaScript error!

## What Was Fixed

### 1. ProfileScreen.tsx

```typescript
// BEFORE (BROKEN):
import {
  View,
  Text,
  StyleSheet,
  // ... other imports
} from 'react-native';

// AFTER (FIXED):
import {
  View,
  Text,
  StyleSheet,
  Alert, // ✅ Added this!
  // ... other imports
} from 'react-native';
```

### 2. Added Missing State

```typescript
// Added this line to track user sessions:
const [sessions, setSessions] = useState<any[]>([]);
```

### 3. Enhanced Metro Config

- Added verbose logging
- Enabled cache reset
- Better error messages

## Test It Works

### Quick Test:

1. Open app
2. Go to Profile tab
3. Tap "Logout"
4. **Should NOT crash!** ✅

### Detailed Test:

```bash
# Run the test script
./scripts/test-metro-connection.sh

# Should see:
# ✓ Metro Status Endpoint... OK
# ✓ Metro bundler process is running
# ✓ Port 8081 is in use
```

## If It Still Doesn't Work

### Reset Everything:

```bash
# Nuclear option - complete clean
./scripts/stop-dev.sh

# Clean Metro
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
watchman watch-del-all

# Clean iOS
cd ios
rm -rf build
pod deintegrate
pod install
cd ..

# Clean node modules (if desperate)
rm -rf node_modules
npm install

# Start fresh
./scripts/start-dev.sh
```

### Check Logs:

```bash
# Metro logs
tail -f logs/metro.log

# Backend logs
tail -f logs/backend.log

# Look for errors mentioning "Alert" or "logout"
```

## Files You Can Review

- `src/screens/ProfileScreen.tsx` - Main fix
- `metro.config.js` - Metro improvements
- `CRASH_FIX_SUMMARY.md` - Detailed explanation
- `TESTING_GUIDE.md` - Full test plan

## Quick Reference

**Before Fix:** Tap Logout → Crash → Frustration 😞  
**After Fix:** Tap Logout → Confirmation → Logout → Success! 😊

**Root Cause:** Missing import  
**Impact:** Critical (app crash)  
**Difficulty:** Easy  
**Time to Fix:** 5 minutes  
**Time Debugging:** Probably longer 😅

## Prevention

To avoid this in the future:

1. **Always check imports:**

   ```bash
   npm run lint
   ```

2. **Use TypeScript strict mode** (catches these issues)

3. **Test critical flows** (like logout) after every change

4. **Run the app** before pushing code

## Contact

If you still have issues:

1. Check `logs/metro.log` for errors
2. Run `./scripts/test-metro-connection.sh`
3. Review `CRASH_FIX_SUMMARY.md` for details
4. Check iOS crash reports in Xcode

---

**Fix Complexity:** ⭐ (1/5 - very simple)  
**Impact:** ⭐⭐⭐⭐⭐ (5/5 - critical)  
**Test Coverage:** ⭐⭐⭐⭐ (4/5 - good)

**Status:** Ready to test! 🚀
