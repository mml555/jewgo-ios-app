# iOS Build Quick Start Guide

## 🚀 Quick Commands

### First Time Build
```bash
npm install --legacy-peer-deps
cd ios && pod install && cd ..
./scripts/fix-yoga-headers.sh
npx react-native run-ios
```

### After `pod install`
```bash
./scripts/fix-yoga-headers.sh
```

### Clean Rebuild
```bash
rm -rf ios/Pods ios/build ~/Library/Developer/Xcode/DerivedData/*
cd ios && pod install && cd ..
./scripts/fix-yoga-headers.sh
npx react-native run-ios
```

---

## ⚠️ CRITICAL: Always Run After `pod install`

```bash
./scripts/fix-yoga-headers.sh
```

**Why?** Yoga is React Native's **core layout engine** that powers ALL UI components (View, Text, ScrollView, etc.). It implements Flexbox and is absolutely essential to React Native.

React Native 0.76.x changed Yoga's directory structure, requiring:
1. **Yoga.podspec patch** (automatic via `npm install`) ✅
2. **Symbolic links** (manual after each `pod install`) ⚠️

Without the symbolic links, the build will fail with errors like:
- `'yoga/numeric/Comparison.h' file not found`
- `'yoga/algorithm/Cache.h' file not found`
- `'yoga/debug/AssertFatal.h' file not found`

**Cannot be skipped** - Yoga must compile for React Native to work!

---

## 📋 Build Checklist

- [ ] `npm install --legacy-peer-deps` completed
- [ ] `cd ios && pod install` completed
- [ ] **`./scripts/fix-yoga-headers.sh` executed** ✅ CRITICAL!
- [ ] No Metro bundler running on port 8081
- [ ] DerivedData cleared if needed

---

## 🛠️ Common Issues

### Build fails with "yoga/numeric/Comparison.h file not found"
```bash
./scripts/fix-yoga-headers.sh
```

### Build fails with "Command PhaseScriptExecution failed"
```bash
cd ios && pod install && cd ..
```

### App builds but doesn't launch
```bash
# Kill Metro and restart with clean cache
pkill -f "react-native start"
npx react-native start --reset-cache

# In new terminal:
npx react-native run-ios
```

---

## 📖 Full Documentation

For detailed information about all fixes and troubleshooting, see:
- [iOS Build Fixes](./IOS_BUILD_FIXES.md) - Complete guide with all fixes and explanations

---

## ✅ Success

Your build is successful when you see:
- `✓ Building the app...`
- `✓ Installing the app...`  
- `✓ Launching the app...`
- App appears in iOS Simulator

---

**Remember:** Always run `./scripts/fix-yoga-headers.sh` after `pod install`! 🎯

