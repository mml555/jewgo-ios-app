# iOS Build Fixes for React Native 0.76.x

## Overview

This document details all the fixes required to successfully build the JewgoAppFinal iOS app with React Native 0.76.x. These fixes address multiple compatibility issues between React Native 0.76.x and various dependencies.

---

## Critical Issues & Solutions

### 🚨 **CRITICAL: Yoga Layout Engine Fix (React Native 0.76.x)**

**What is Yoga?**
Yoga is React Native's **core layout engine** that powers ALL layout in your app. It implements the CSS Flexbox model and is absolutely essential - React Native cannot function without it. Every `<View>`, `<Text>`, and component uses Yoga to calculate positions and sizes.

**Issue:** React Native 0.76.x changed the Yoga directory structure. Yoga's C++ source files use self-referencing includes like `#include <yoga/numeric/Comparison.h>`, but CocoaPods doesn't set up the header search paths correctly for these internal references.

**Symptoms:**
```
error: 'yoga/numeric/Comparison.h' file not found
error: 'yoga/algorithm/Cache.h' file not found
error: 'yoga/debug/AssertFatal.h' file not found
error: 'yoga/algorithm/PixelGrid.h' file not found
```

**Solution - TWO PARTS:**

#### Part 1: Yoga.podspec Modification (Permanent)
The file `node_modules/react-native/ReactCommon/yoga/Yoga.podspec` has been modified to add the correct header search path. This change is preserved via `patch-package`:

```ruby
spec.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/../../node_modules/react-native/ReactCommon/yoga" "$(PODS_TARGET_SRCROOT)"'
}
```

**Patch File:** `patches/react-native+0.76.9.patch`

**To Apply:** Run `npm install` which automatically applies patches via `postinstall`

#### Part 2: Symbolic Links (After Every `pod install`)
After running `pod install`, you **MUST** create symbolic links for Yoga subdirectories:

```bash
# Quick fix - run this script:
./scripts/fix-yoga-headers.sh

# Or manually create the symbolic links:
cd ios/Pods/Headers/Public/Yoga

ln -sf $PWD/../../../../../node_modules/react-native/ReactCommon/yoga/yoga/numeric numeric
ln -sf $PWD/../../../../../node_modules/react-native/ReactCommon/yoga/yoga/enums enums
ln -sf $PWD/../../../../../node_modules/react-native/ReactCommon/yoga/yoga/config config
ln -sf $PWD/../../../../../node_modules/react-native/ReactCommon/yoga/yoga/debug debug
ln -sf $PWD/../../../../../node_modules/react-native/ReactCommon/yoga/yoga/algorithm algorithm
ln -sf $PWD/../../../../../node_modules/react-native/ReactCommon/yoga/yoga/event event
```

**Why Both Are Needed:**
1. **Yoga.podspec fix**: Adds the parent directory to header search paths so `yoga/numeric/...` can resolve
2. **Symbolic links**: Ensure headers are accessible in the Public headers directory
3. **Together**: They provide multiple resolution paths, ensuring Yoga compiles successfully

**When to Run:**
- ✅ After `npm install` (patch applied automatically)
- ✅ **After `pod install`** (run `./scripts/fix-yoga-headers.sh`)
- ✅ After `pod install --repo-update`
- ✅ After deleting and reinstalling the `Pods` directory  
- ✅ Before building the iOS app for the first time
- ✅ When you see Yoga header errors during build

---

### 2. **rsync Sandbox Restrictions**

**Issue:** macOS sandboxing prevents `rsync` from executing in Xcode build scripts, causing build failures.

**Symptoms:**
```
error: Command PhaseScriptExecution failed with a nonzero exit code
rsync: failed to set times on "...": Operation not permitted
```

**Solution:**
Modified `ios/Podfile` to replace `rsync` with `ditto` (macOS-native, sandbox-safe tool).

**Podfile Changes:**
```ruby
post_install do |installer|
  # ... existing code ...
  
  # SECTION 2: Rsync Sandbox Fix
  puts "\n🔧 Replacing rsync with ditto in CocoaPods scripts..."
  
  rsync_fixes_applied = 0
  Dir.glob("Pods/Target Support Files/**/*.sh") do |script_path|
    script_content = File.read(script_path)
    original_content = script_content.dup
    
    # Replace rsync commands with ditto
    script_content.gsub!(/rsync\s+--delete.*?\s+"?\$\{source\}"?\/?(\*\s+)?"?\$\{destination\}"?/) do |match|
      'ditto "${source}" "${destination}"'
    end
    
    if script_content != original_content
      File.write(script_path, script_content)
      rsync_fixes_applied += 1
    end
  end
  
  puts "  📊 Total rsync->ditto fixes applied: #{rsync_fixes_applied} files"
end
```

**Status:** ✅ Permanently fixed in `ios/Podfile`

---

### 3. **Yoga Header Search Paths**

**Issue:** Xcode couldn't find Yoga headers even though they exist in the Pods directory.

**Solution:**
Added comprehensive header search paths in `ios/Podfile`.

**Podfile Changes:**
```ruby
post_install do |installer|
  # ... existing code ...
  
  # SECTION 3: Yoga Header Fix
  puts "\n🧘 Fixing Yoga header paths for React Native 0.76.x..."
  
  yoga_header_paths = [
    '"$(PODS_ROOT)/Yoga/yoga"',
    '"$(PODS_ROOT)/Headers/Public/Yoga"',
    '"$(SRCROOT)/../node_modules/react-native/ReactCommon/yoga/yoga"',
    '"$(SRCROOT)/../node_modules/react-native/ReactCommon/yoga/yoga/numeric"',
    '"$(SRCROOT)/../node_modules/react-native/ReactCommon/yoga/yoga/enums"',
    '"$(SRCROOT)/../node_modules/react-native/ReactCommon/yoga/yoga/config"'
  ]
  
  installer.pods_project.targets.each do |target|
    if ['Yoga', 'React-Core', 'React-Fabric', 'React-FabricComponents'].include?(target.name)
      target.build_configurations.each do |config|
        config.build_settings['HEADER_SEARCH_PATHS'] ||= []
        yoga_header_paths.each do |path|
          config.build_settings['HEADER_SEARCH_PATHS'] << path
        end
      end
    end
  end
end
```

**Status:** ✅ Permanently fixed in `ios/Podfile`

---

### 4. **Deployment Target Standardization**

**Issue:** CocoaPods warnings about mismatched deployment targets across dependencies.

**Solution:**
Standardized all pods to iOS 15.0 in `ios/Podfile`.

**Podfile Changes:**
```ruby
post_install do |installer|
  puts "\n📱 Configuring deployment targets..."
  
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
      puts "  ✅ #{target.name}: iOS 15.0"
    end
  end
end
```

**Status:** ✅ Permanently fixed in `ios/Podfile`

---

## Complete Build Workflow

### First Time Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Install CocoaPods
cd ios
pod install --repo-update

# 3. Fix Yoga headers (CRITICAL!)
cd ..
./scripts/fix-yoga-headers.sh

# 4. Clean build directories
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 5. Build the app
npx react-native run-ios --simulator="iPhone 16"
```

### After Running `pod install`

```bash
# ALWAYS run this after pod install!
./scripts/fix-yoga-headers.sh

# Then build normally
npx react-native run-ios
```

### Clean Build

```bash
# Full clean and rebuild
rm -rf node_modules
rm -rf ios/Pods ios/Podfile.lock ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*

npm install --legacy-peer-deps
cd ios && pod install && cd ..

# CRITICAL: Fix Yoga headers
./scripts/fix-yoga-headers.sh

# Build
npx react-native run-ios
```

---

## Troubleshooting

### "yoga/numeric/Comparison.h file not found"

**Cause:** Yoga symbolic links are missing.

**Fix:**
```bash
./scripts/fix-yoga-headers.sh
```

### "Command PhaseScriptExecution failed with a nonzero exit code"

**Cause:** rsync sandbox restrictions.

**Fix:** This should be permanently fixed in the Podfile. If you still see this:
```bash
cd ios
pod install  # Re-run to apply Podfile fixes
```

### Build Succeeds But App Crashes on Launch

**Causes:**
1. Metro bundler not running
2. Stale bundle cache

**Fix:**
```bash
# Kill any existing Metro processes
pkill -f "react-native start"

# Start Metro with clean cache
npx react-native start --reset-cache

# In a new terminal, build the app
npx react-native run-ios
```

### Xcode DerivedData Issues

**Symptoms:** Random build failures, "file not found" errors that don't make sense.

**Fix:**
```bash
# Clear Xcode's derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Clean and rebuild
cd ios
xcodebuild clean -workspace JewgoAppFinal.xcworkspace -scheme JewgoAppFinal
cd ..
npx react-native run-ios
```

---

## Automated Fix Script

We've created a helper script that automatically fixes the Yoga headers: `scripts/fix-yoga-headers.sh`

**Usage:**
```bash
./scripts/fix-yoga-headers.sh
```

**What it does:**
1. Checks if Yoga source and headers directories exist
2. Removes old symbolic links
3. Creates new symbolic links for all Yoga subdirectories
4. Displays verification output

**Add to your workflow:**
```bash
# After pod install, always run:
cd ios && pod install && cd .. && ./scripts/fix-yoga-headers.sh
```

---

## Files Modified

### `ios/Podfile`
- Added deployment target standardization (iOS 15.0)
- Added rsync → ditto replacement script
- Added Yoga header search paths configuration

### `scripts/fix-yoga-headers.sh` (NEW)
- Automated script to create Yoga symbolic links
- Run after every `pod install`

### Symbolic Links Created
Located in `ios/Pods/Headers/Public/Yoga/`:
- `numeric` → `node_modules/react-native/ReactCommon/yoga/yoga/numeric`
- `enums` → `node_modules/react-native/ReactCommon/yoga/yoga/enums`
- `config` → `node_modules/react-native/ReactCommon/yoga/yoga/config`
- `debug` → `node_modules/react-native/ReactCommon/yoga/yoga/debug`
- `algorithm` → `node_modules/react-native/ReactCommon/yoga/yoga/algorithm`
- `event` → `node_modules/react-native/ReactCommon/yoga/yoga/event`

---

## React Native Version Info

- **React Native**: 0.76.0
- **React**: 18.3.1
- **iOS Deployment Target**: 15.0
- **CocoaPods**: Latest
- **Xcode**: 15.x or later required

---

## Common Errors Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `'yoga/numeric/Comparison.h' file not found` | Missing Yoga symbolic links | Run `./scripts/fix-yoga-headers.sh` |
| `'yoga/algorithm/Cache.h' file not found` | Missing Yoga symbolic links | Run `./scripts/fix-yoga-headers.sh` |
| `'yoga/debug/AssertFatal.h' file not found` | Missing Yoga symbolic links | Run `./scripts/fix-yoga-headers.sh` |
| `Command PhaseScriptExecution failed` | rsync sandbox issue | Should be fixed in Podfile; re-run `pod install` |
| `'folly/Expected.h' file not found` | Stale build cache | Clear DerivedData: `rm -rf ~/Library/Developer/Xcode/DerivedData/*` |
| `UIScrollView+RNScreens.mm not found` | Outdated Pods cache | Delete Pods and reinstall: `rm -rf ios/Pods && cd ios && pod install` |

---

## Prevention Checklist

Before building iOS:

- [ ] Run `npm install --legacy-peer-deps`
- [ ] Run `cd ios && pod install`
- [ ] **CRITICAL:** Run `./scripts/fix-yoga-headers.sh`
- [ ] Clear DerivedData if needed: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
- [ ] Ensure Metro is not running on port 8081
- [ ] Build with `npx react-native run-ios`

---

## Notes for Future Updates

1. **When updating React Native:** These fixes may need to be re-evaluated for newer versions
2. **When updating dependencies:** Re-run the complete build workflow
3. **When onboarding new developers:** Ensure they run `fix-yoga-headers.sh` after setup
4. **CI/CD Integration:** Add `fix-yoga-headers.sh` to your CI/CD pipeline after `pod install`

---

## Success Indicators

Your build is successful when you see:

```
✓ Building the app...
✓ Installing the app...
✓ Launching the app...
info Successfully launched the app
```

And the app appears in the iOS Simulator with the JewgoAppFinal icon visible on the home screen.

---

## Support

If you encounter issues not covered in this document:

1. Check the full build log for specific error messages
2. Verify all symbolic links are in place: `ls -la ios/Pods/Headers/Public/Yoga/`
3. Ensure the Podfile modifications are present
4. Try a complete clean build following the "Clean Build" workflow above

---

**Last Updated:** October 21, 2025  
**Tested With:** React Native 0.76.0, iOS 15.0+, Xcode 15.x

