# Testing Guide - Logout & Metro Fix

**Created:** October 13, 2025  
**Status:** Ready for Testing

## Quick Test

### 1. Clean Start

```bash
# Stop everything
./scripts/stop-dev.sh

# Clean Metro cache
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*

# Start fresh
./scripts/start-dev.sh
```

### 2. Test Metro Connection

```bash
# In a new terminal
./scripts/test-metro-connection.sh
```

Expected output:

```
🔍 Testing Metro Bundler Connection...
Testing Metro Status Endpoint... ✓ OK
Testing Metro Root Endpoint... ✓ OK
✓ Metro bundler process is running
✓ Port 8081 is in use
```

### 3. Test Logout (Critical)

#### Test Regular Logout:

1. Open the app in iOS Simulator
2. If you see the welcome screen, tap "Sign In"
3. Use test credentials or create an account
4. Navigate to Profile tab (bottom navigation)
5. Scroll to bottom and tap "Logout" button
6. Confirm logout in the alert dialog
7. ✅ **Expected:** You return to Welcome screen, NO CRASH

#### Test Guest Logout:

1. From Welcome screen, tap "Continue as Guest"
2. Navigate to Profile tab
3. Scroll to bottom and tap "Logout" button
4. Confirm in the alert dialog
5. ✅ **Expected:** You return to Welcome screen, NO CRASH

## What Was Fixed

### Critical Issues

1. **Missing Alert Import in ProfileScreen.tsx**

   - Caused: Crash when pressing logout button
   - Fixed: Added `Alert` to react-native imports
   - Impact: Critical - prevents app crash

2. **Undefined sessions Variable**

   - Caused: Reference error in handleSessions function
   - Fixed: Added `const [sessions, setSessions] = useState<any[]>([]);`
   - Impact: High - prevents potential crashes

3. **Metro Configuration**
   - Enhanced: Added verbose logging
   - Added: Cache reset option
   - Impact: Medium - helps with debugging

### Files Modified

```
✅ src/screens/ProfileScreen.tsx - Added Alert import & sessions state
✅ src/screens/EnhancedJobsScreen.tsx - Added Alert import
✅ metro.config.js - Enhanced logging
✅ scripts/test-metro-connection.sh - New diagnostic tool
✅ scripts/fix-alert-imports.js - Automated fix tool
```

## Detailed Test Cases

### Test Case 1: Profile Screen Logout

**Precondition:** User is authenticated

**Steps:**

1. Launch app
2. Login with valid credentials
3. Navigate to Profile tab
4. Tap "Logout" button

**Expected Result:**

- Alert dialog appears with "Sign Out" title
- Dialog has "Cancel" and "Sign Out" buttons
- After confirming, user is logged out
- Navigation returns to Welcome screen
- No JavaScript errors in Metro logs
- No crash

**Actual Result:** ********\_\_\_\_********

**Status:** [ ] Pass [ ] Fail

---

### Test Case 2: Guest Session Logout

**Precondition:** User is in guest mode

**Steps:**

1. Launch app
2. Tap "Continue as Guest"
3. Navigate to Profile tab
4. Tap "Logout" button

**Expected Result:**

- Alert dialog appears with "End Guest Session" title
- Dialog has "Cancel" and "End Session" buttons
- After confirming, guest session ends
- Navigation returns to Welcome screen
- No JavaScript errors in Metro logs
- No crash

**Actual Result:** ********\_\_\_\_********

**Status:** [ ] Pass [ ] Fail

---

### Test Case 3: Metro Connection

**Steps:**

1. Run `./scripts/test-metro-connection.sh`

**Expected Result:**

- Metro Status Endpoint: ✓ OK
- Metro Root Endpoint: ✓ OK
- Metro bundler process is running
- Port 8081 is in use

**Actual Result:** ********\_\_\_\_********

**Status:** [ ] Pass [ ] Fail

---

### Test Case 4: Alert Dialogs Work Throughout App

**Steps:**
Test various features that use Alert:

1. Profile > Edit Profile (should show alert)
2. Profile > Favorites (guest - should show alert)
3. Profile > Reviews (guest - should show alert)
4. Settings > Clear Cache (should show alert)
5. Create Store > Save (validation - should show alert)

**Expected Result:**

- All alerts display properly
- No crashes
- No "Alert is not defined" errors

**Actual Result:** ********\_\_\_\_********

**Status:** [ ] Pass [ ] Fail

---

## Troubleshooting

### Issue: Metro won't connect

```bash
# Kill any existing Metro processes
pkill -f "react-native start"
lsof -ti:8081 | xargs kill -9

# Clear all caches
rm -rf /tmp/metro-*
rm -rf /tmp/haste-*
watchman watch-del-all

# Restart Metro
npm start -- --reset-cache
```

### Issue: App still crashes on logout

```bash
# Check Metro logs
tail -f logs/metro.log

# Check for JavaScript errors
# Look for "RCTExceptionsManager" or "Alert is not defined"
```

### Issue: iOS build fails

```bash
# Clean iOS build
cd ios
rm -rf build
pod deintegrate
pod install
cd ..

# Rebuild
npx react-native run-ios
```

## Monitoring After Deployment

### Key Metrics to Watch

1. **Crash Reports**

   - Location: Xcode > Window > Organizer > Crashes
   - Watch for: "RCTExceptionsManager" crashes
   - Expected: Zero crashes related to Alert or logout

2. **Metro Logs**

   ```bash
   tail -f logs/metro.log | grep -i "error\|exception\|alert"
   ```

3. **User Behavior**
   - Monitor logout success rate
   - Track session management
   - Check for unexpected navigation issues

### Health Checks

Run these periodically:

```bash
# 1. Metro connection test
./scripts/test-metro-connection.sh

# 2. Lint check
npm run lint

# 3. Backend health
curl http://localhost:3001/health
```

## Regression Testing

After any future code changes, test:

1. ✅ All Alert dialogs still work
2. ✅ Logout functionality (regular & guest)
3. ✅ Metro bundler connection
4. ✅ Navigation after logout
5. ✅ Profile screen rendering

## Success Criteria

- [ ] No crashes when pressing logout
- [ ] Alert dialogs appear properly
- [ ] Metro bundler connects successfully
- [ ] No TypeScript/ESLint errors
- [ ] All navigation flows work correctly
- [ ] Guest and regular logout both work
- [ ] Session state clears properly

## Notes

- The crash was caused by a missing import, not a logic error
- 42 other files already had the correct Alert import
- Metro configuration now has better debugging
- Added automated tools for future similar issues

---

**Tester:** ******\_\_\_******  
**Date:** ******\_\_\_******  
**Version:** 1.0 (Build 1)  
**Device:** iOS Simulator  
**Pass/Fail:** ******\_\_\_******

## Next Steps After Testing

If all tests pass:

- [ ] Deploy to TestFlight for beta testing
- [ ] Monitor crash reports for 48 hours
- [ ] Collect user feedback on logout flow
- [ ] Document any edge cases found

If any tests fail:

- [ ] Document the failure in detail
- [ ] Check Metro logs for errors
- [ ] Review crash reports
- [ ] Contact development team with findings
