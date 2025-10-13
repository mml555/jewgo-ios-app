# Uninstall and Rebuild - Quick Guide

Follow these steps to see your new circular mint green logo on the home screen!

## 🔵 iOS Instructions

### Step 1: Uninstall Old App

**On iPhone/iPad Device:**

1. Find the Jewgo app on your home screen
2. Long press the app icon
3. Tap "Remove App"
4. Tap "Delete App"
5. Confirm deletion

**On iOS Simulator:**

1. Open the simulator
2. Long press the Jewgo app icon
3. Click the X button
4. Or use: `xcrun simctl uninstall booted com.jewgoappfinal`

### Step 2: Rebuild and Install

Open terminal in project root and run:

```bash
npx react-native run-ios
```

**Wait for the build to complete** (2-5 minutes)

### Step 3: Check Home Screen

- New circular mint green icon with "J" character should appear!
- Launch the app to see the circular logo inside too

---

## 🟢 Android Instructions

### Step 1: Uninstall Old App

**On Android Device:**

1. Find the Jewgo app in your app drawer
2. Long press the app icon
3. Drag to "Uninstall" or tap "Uninstall"
4. Confirm

**On Android Emulator:**

1. Open app drawer
2. Long press Jewgo app
3. Drag to uninstall
4. Or use ADB: `adb uninstall com.jewgoappfinal`

**Via Terminal (Fastest):**

```bash
adb uninstall com.jewgoappfinal
```

### Step 2: Rebuild and Install

Open terminal in project root and run:

```bash
npx react-native run-android
```

**Wait for the build to complete** (2-5 minutes)

### Step 3: Check Home Screen

- New circular mint green icon with "J" character should appear!
- Launch the app to see the circular logo inside too

---

## ⚡ Quick Commands (Copy & Paste)

### iOS - Full Flow

```bash
# Uninstall from simulator (if using simulator)
xcrun simctl uninstall booted com.jewgoappfinal

# Rebuild and install
npx react-native run-ios
```

### Android - Full Flow

```bash
# Uninstall
adb uninstall com.jewgoappfinal

# Rebuild and install
npx react-native run-android
```

---

## 🔍 Verify Installation

After rebuilding, check:

✅ **Home Screen Icon:**

- Should be circular
- Mint green background (#c6ffd1)
- Dark charcoal "J" character (#292b2d)

✅ **In-App Logo:**

- Same circular design
- In navigation bar (small)
- On auth screens (large)

---

## 🆘 Troubleshooting

### Icon Still Shows Old Logo?

**Try this:**

1. Restart your device/simulator completely
2. Uninstall again (make sure it's gone)
3. Run clean script: `./scripts/clean-and-rebuild.sh`
4. Rebuild: `npx react-native run-ios` or `run-android`

### Build Errors?

**Clean everything:**

```bash
# Run our comprehensive clean script
./scripts/clean-and-rebuild.sh

# Then rebuild
npx react-native run-ios  # or run-android
```

### Metro Bundler Issues?

**Reset Metro cache:**

```bash
npx react-native start --reset-cache
```

Then in a new terminal:

```bash
npx react-native run-ios  # or run-android
```

---

## 📊 Expected Results

**Before (Old):**

- Square or old icon design
- Old colors
- Old branding

**After (New):**

- ⭕ Circular icon
- 🎨 Mint green background
- 🔤 Hebrew-inspired "J" character
- ✨ Modern, professional look

---

## 💡 Tips

- **First time?** The build may take longer (5-10 minutes)
- **Subsequent builds** are faster (2-3 minutes)
- **Metro bundler** will start automatically
- **App opens automatically** when build completes

---

## ✅ Success Checklist

After rebuild, you should see:

- [ ] New circular icon on home screen
- [ ] App launches successfully
- [ ] Circular logo in navigation bar
- [ ] Circular logo on Welcome screen
- [ ] Circular logo on Login screen
- [ ] Mint green + charcoal colors

---

**Ready? Let's do this!** 🚀

Choose your platform and follow the steps above. Your new beautiful logo is waiting! 🎨
