# iOS App - Specials Not Loading - Debug Guide

## ✅ Backend Status: WORKING PERFECTLY
- Backend running on port 3001 ✅
- 14 active specials in database ✅
- Guest authentication working ✅
- All endpoints responding correctly ✅

## Problem: iOS App Can't Connect to Backend

### Step 1: Check What Screen You're On

#### Option A: You're on the Welcome Screen
**Solution**: Tap the **"Continue as Guest"** button

This will:
1. Create a guest session with the backend
2. Navigate you to the home screen
3. Load specials automatically

#### Option B: You're in the App But Specials Screen is Empty/Loading
**Problem**: iOS app can't connect to your local backend

---

## Debugging Steps

### 1. Check iOS Simulator is Running

```bash
xcrun simctl list devices | grep Booted
```

### 2. Restart Metro Bundler

```bash
cd /Users/mendell/JewgoAppFinal
npm start -- --reset-cache
```

### 3. Rebuild iOS App

```bash
cd /Users/mendell/JewgoAppFinal
# Clean build
cd ios
xcodebuild clean
cd ..

# Reinstall pods
cd ios && pod install && cd ..

# Run app
npx react-native run-ios
```

### 4. Check App Logs for Errors

While the app is running, look for errors in Metro bundler terminal:
- Look for "Network request failed"
- Look for "AUTH_REQUIRED" errors
- Look for "Connection refused" errors

### 5. Test Backend Connectivity from Simulator

Your iOS app is configured to connect to:
```
http://127.0.0.1:3001/api/v5
```

This should work in the iOS simulator. To verify:

```bash
# Test backend is accessible
curl http://127.0.0.1:3001/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  ...
}
```

---

## Common Issues & Solutions

### Issue 1: "Continue as Guest" Button Not Working

**Symptoms**: Tapping the button does nothing or shows error

**Solution**:
1. Check Metro bundler console for errors
2. Try restarting the backend:
   ```bash
   # Find and kill the backend process
   lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill
   
   # Start backend again
   cd /Users/mendell/JewgoAppFinal/backend
   npm start
   ```

### Issue 2: Guest Session Creates But Specials Don't Load

**Symptoms**: You see the main app but specials screen is empty/loading forever

**Check**:
1. Open Metro bundler console
2. Look for network errors like:
   ```
   Network request failed
   TypeError: Network request failed
   ```

**Solution**: The app might be trying wrong URL. Check your ConfigService:

```bash
# Check current config
grep -A 5 "apiBaseUrl" /Users/mendell/JewgoAppFinal/src/config/ConfigService.ts
```

Should show:
```typescript
const apiBaseUrl = __DEV__
  ? 'http://127.0.0.1:3001/api/v5'
  : Config.API_BASE_URL || 'https://api.jewgo.app/api/v5';
```

### Issue 3: iOS Simulator Can't Reach localhost

**Rare Issue**: Some network configurations prevent simulator from reaching localhost

**Solution**: Use your Mac's IP address instead

```bash
# Get your Mac's IP
ipconfig getifaddr en0

# Example output: 192.168.1.100
```

Then update ConfigService.ts to use your IP:
```typescript
const apiBaseUrl = __DEV__
  ? 'http://192.168.1.100:3001/api/v5'  // Use your IP
  : Config.API_BASE_URL || 'https://api.jewgo.app/api/v5';
```

---

## Verify Backend is Working

Run these tests from terminal:

### Test 1: Health Check
```bash
curl http://localhost:3001/health
```

Expected: `{"success":true,"status":"healthy"...}`

### Test 2: Create Guest Session
```bash
curl -X POST http://localhost:3001/api/v5/guest/create \
  -H "Content-Type: application/json"
```

Expected: Returns `sessionToken`

### Test 3: Get Specials (with guest token from step 2)
```bash
TOKEN="<paste_token_from_step_2>"
curl "http://localhost:3001/api/v5/specials/active?limit=5" \
  -H "x-guest-token: $TOKEN" \
  -H "Content-Type: application/json"
```

Expected: Returns list of 14 specials

---

## Enable Debug Logging in iOS App

Your app already has debug logging enabled (`DEBUG_MODE=true` in .env).

To see detailed logs:
1. Open Xcode
2. Run the app from Xcode (not from terminal)
3. View console output in Xcode's debug area
4. Look for messages starting with:
   - `🔐` (Auth/Guest session messages)
   - `🌐` (API requests)
   - `❌` (Errors)

---

## Quick Fix: Force Guest Session Creation

If you want to automatically create a guest session when the app starts (instead of showing Welcome screen):

Edit: `/Users/mendell/JewgoAppFinal/src/contexts/AuthContext.tsx`

Find the `initializeAuth` function around line 79 and add:

```typescript
const initializeAuth = async () => {
  try {
    setIsInitializing(true);

    // Initialize auth services
    await Promise.all([authService.initialize(), guestService.initialize()]);

    if (authService.isAuthenticated()) {
      // Try to get user profile
      try {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      } catch (error) {
        errorLog('Failed to get user profile:', error);
        await authService.logout();
        setUser(null);
      }
    }

    // Set guest user if guest session exists
    if (guestService.isGuestAuthenticated()) {
      const guest = guestService.getGuestUser();
      if (guest) {
        setGuestUser(guest);
      }
    } else {
      // ⭐ ADD THIS: Auto-create guest session if no auth exists
      if (!authService.isAuthenticated()) {
        try {
          const guestSession = await guestService.createGuestSession();
          setGuestUser(guestSession.guestUser);
          debugLog('🔐 Auto-created guest session on app start');
        } catch (error) {
          errorLog('Failed to auto-create guest session:', error);
        }
      }
    }
  } catch (error) {
    errorLog('Auth initialization error:', error);
  } finally {
    setIsInitializing(false);
  }
};
```

This will automatically create a guest session when the app starts, bypassing the Welcome screen.

---

## Still Not Working?

### Check These:

1. **Is backend running?**
   ```bash
   lsof -i :3001 | grep LISTEN
   ```

2. **Is Metro bundler running?**
   ```bash
   lsof -i :8081 | grep LISTEN
   ```

3. **Is iOS simulator running?**
   ```bash
   xcrun simctl list | grep Booted
   ```

4. **Can you see any error messages in:**
   - Metro bundler terminal
   - Xcode console
   - iOS simulator

### Share Error Messages

If still not working, look for error messages and share:
- What screen you're on
- Any error messages shown
- Console logs from Metro bundler
- Any network errors

---

## Summary

Your backend is **100% working**. The issue is likely:
1. You haven't tapped "Continue as Guest" yet
2. OR the iOS app can't connect to localhost:3001

Follow the debugging steps above to identify and fix the issue.

