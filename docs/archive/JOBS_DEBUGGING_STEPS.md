# Jobs Page "No Data Available" - Debugging Steps

## ✅ What's Working:

- ✅ Backend is running on port 3001
- ✅ Database has 12 jobs ready to display
- ✅ API endpoint `/api/v5/jobs/listings` returns data correctly
- ✅ Guest authentication is working

## 🔍 Troubleshooting Steps:

### Step 1: Check if the React Native app is running

```bash
# Make sure Metro bundler is running
cd /Users/mendell/JewgoAppFinal
npx react-native start
```

### Step 2: Restart the mobile app

- Close the app completely on your device/simulator
- Reopen it to load the new code

### Step 3: Check app logs for errors

Look in your React Native debugger console for:

- Network errors (can't connect to backend)
- Authentication errors (guest token issues)
- Any red error messages

### Step 4: Verify backend connectivity

The app should connect to: `http://127.0.0.1:3001/api/v5`

**For iOS Simulator:**

- ✅ `127.0.0.1:3001` should work (already configured in ConfigService)

**For Android Emulator:**

- Need to use `10.0.2.2:3001` instead of `127.0.0.1:3001`

**For Physical Device:**

- Need to use your Mac's IP address (e.g., `192.168.1.x:3001`)
- Make sure device and Mac are on the same WiFi network

### Step 5: Test API manually

Test if you can reach the backend from your browser:

1. Open: http://127.0.0.1:3001/health
2. Should see: `{"success":true,"status":"healthy"...}`

### Step 6: Check guest token creation

The app automatically creates a guest session. Check console logs for:

```
🔐 GuestService: Creating guest session...
🔐 GuestService: Guest session created successfully
```

If you see errors here, the app can't reach the backend.

### Step 7: Clear app data (if needed)

If the app has a stale/invalid guest token:

**iOS Simulator:**

```bash
xcrun simctl uninstall booted com.jewgoappfinal
xcrun simctl install booted ios/build/Build/Products/Debug-iphonesimulator/JewgoAppFinal.app
```

**Android Emulator:**

```bash
adb uninstall com.jewgoappfinal
```

Then reinstall and run the app.

## 🔧 Quick Fix Options:

### Option 1: Force reload the app

1. In simulator/emulator, press `Cmd+R` (iOS) or `RR` (Android)
2. This will reload with the new code

### Option 2: Clear cache and reload

```bash
# Stop Metro
# Clear caches
cd /Users/mendell/JewgoAppFinal
rm -rf node_modules/.cache
watchman watch-del-all

# Restart
npx react-native start --reset-cache
```

### Option 3: Check if you're testing on Vercel

**Important:** If you opened the app from Vercel (web), it won't connect to your local backend!

- The frontend changes need to be deployed to Vercel
- OR test using the React Native mobile app (not web)

## 📱 Expected Behavior:

When working correctly, you should see:

1. App loads
2. Console shows: "🔐 GuestService: Guest session created successfully"
3. Jobs page loads
4. Shows 12 real jobs from database (not 3 mock jobs)
5. Jobs include: "Summer Camp Counselor", "Mikvah Attendant", "Synagogue Administrator", etc.

## 🐛 Common Issues:

### Issue: "Network request failed"

**Cause:** App can't reach backend
**Fix:**

- Check backend is running: `ps aux | grep "node.*server.js"`
- Restart backend: `cd backend && node src/server.js &`
- Try `127.0.0.1:3001` instead of `localhost:3001`

### Issue: "Authentication required"

**Cause:** Guest token not being sent
**Fix:**

- Clear app data and restart
- Check GuestService logs in console

### Issue: Still shows 3 mock jobs

**Cause:** Old code still running
**Fix:**

- Force reload: `Cmd+R` (iOS) or `RR` (Android)
- OR restart Metro with `--reset-cache`

### Issue: Shows empty list

**Cause:** API returning empty array
**Fix:**

- Check backend logs: `tail -f /tmp/jewgo-backend.log`
- Verify database has jobs: `docker exec jewgo_postgres psql -U jewgo_user -d jewgo_dev -c "SELECT COUNT(*) FROM jobs WHERE is_active = true;"`

## 🎯 Next Steps:

1. **Close and reopen** your mobile app
2. **Check the console** for any errors
3. **Look at the Jobs screen** - should see 12 jobs (not 3)
4. If still not working, **share the console logs** so I can help debug further

---

**Backend Status:** ✅ Running and working
**Database Status:** ✅ 12 jobs ready
**API Status:** ✅ Returning data correctly
**Need:** App to reload with new frontend code
