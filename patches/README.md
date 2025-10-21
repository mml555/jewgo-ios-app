# Patches Directory

This directory contains patches applied to `node_modules` using `patch-package`.

## What is patch-package?

`patch-package` allows us to make permanent fixes to npm dependencies that are automatically reapplied after `npm install`.

## Current Patches

### `react-native+0.76.9.patch`

**Purpose:** Fixes Yoga layout engine header search paths for iOS builds

**What it does:**
- Modifies `node_modules/react-native/ReactCommon/yoga/Yoga.podspec`
- Adds the parent directory to `HEADER_SEARCH_PATHS`
- Allows Yoga C++ files to find their own headers (e.g., `yoga/numeric/Comparison.h`)

**Why it's needed:**
- React Native 0.76.x reorganized Yoga's directory structure
- Yoga uses self-referencing includes that break without correct paths
- Without this patch, iOS builds fail with "file not found" errors

**Modified file:**
```
node_modules/react-native/ReactCommon/yoga/Yoga.podspec
```

**Change:**
```ruby
# Before:
spec.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
}.merge!(ENV['USE_FRAMEWORKS'] != nil ? {
    'HEADER_SEARCH_PATHS' => '"$(PODS_TARGET_SRCROOT)"'
} : {})

# After:
spec.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'HEADER_SEARCH_PATHS' => '"$(PODS_ROOT)/../../node_modules/react-native/ReactCommon/yoga" "$(PODS_TARGET_SRCROOT)"'
}
```

**Auto-applied:** Yes, via `postinstall` script in `package.json`

---

## How Patches Work

1. **Creation:**
   ```bash
   # Make changes to files in node_modules
   npx patch-package package-name
   ```

2. **Application:**
   ```bash
   # Automatically applied on npm install via postinstall script
   npm install
   ```

3. **Verification:**
   ```bash
   # Check if patch is applied
   grep "HEADER_SEARCH_PATHS" node_modules/react-native/ReactCommon/yoga/Yoga.podspec
   ```

---

## Maintaining Patches

### When Updating React Native

1. Update React Native version:
   ```bash
   npm install react-native@latest
   ```

2. Check if patch still applies:
   - If successful: No action needed
   - If fails: Manually reapply the fix and regenerate patch

3. Regenerate patch if needed:
   ```bash
   # Make the fix again
   # Then:
   npx patch-package react-native
   ```

### If Patch Fails to Apply

If you see warnings like:
```
patch-package: ERROR
  Failed to apply patch for package react-native
```

**Solution:**
1. Delete the patch: `rm patches/react-native+0.76.9.patch`
2. Manually edit: `node_modules/react-native/ReactCommon/yoga/Yoga.podspec`
3. Apply the fix shown above
4. Regenerate: `npx patch-package react-native`

---

## Documentation

For complete information about the Yoga fix:
- **What is Yoga:** `docs/ios/YOGA_EXPLANATION.md`
- **Complete fixes:** `docs/ios/IOS_BUILD_FIXES.md`
- **Quick start:** `docs/ios/QUICK_START_IOS.md`

---

## ⚠️ Important

- **DO NOT delete this directory** - patches are essential for iOS builds
- **DO commit patches to git** - other developers need them
- **DO run `fix-yoga-headers.sh`** after `pod install` even with patches applied

---

**Patches are a critical part of the iOS build process!**

