# rsync Build Issues - Resolution Guide

## Status: ✅ RESOLVED

All rsync build issues have been successfully fixed. The iOS app builds without any rsync-related errors.

## What Was Fixed

### 1. rsync Redirect Script

**Location:** `/ios/rsync`

A redirect script that forces all rsync calls to use the system binary (`/usr/bin/rsync`) instead of any sandboxed or local versions:

```sh
#!/bin/sh
# PERMANENT REDIRECT: Force all rsync calls to use system binary
# This file blocks any attempt to use ios/rsync (which macOS sandboxes)
exec /usr/bin/rsync "$@"
```

**Permissions:** The script is executable (`chmod +x ios/rsync`)

### 2. Podfile Configuration

**Location:** `/ios/Podfile`

The Podfile includes multiple safeguards:

```ruby
# Disable Hermes (lines 32-33)
:hermes_enabled => false

# Post-install hooks (lines 46-74)
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # Completely disable Hermes
      config.build_settings['USE_HERMES'] = 'false'

      # Remove Hermes framework copy scripts
      if target.name == 'hermes-engine'
        target.shell_script_build_phases.each do |phase|
          if phase.name&.include?('hermes') || phase.shell_script&.include?('rsync')
            phase.shell_script = 'echo "Hermes disabled - skipping framework copy"'
          end
        end
      end
    end
  end

  # Replace rsync with ditto in embed frameworks phase
  installer.pods_project.targets.each do |target|
    if target.name == 'JewgoAppFinal'
      target.shell_script_build_phases.each do |phase|
        if phase.name == '[CP] Embed Pods Frameworks' && phase.shell_script&.include?('hermes')
          phase.shell_script = phase.shell_script.gsub(/\brsync\b/, '/usr/bin/ditto')
        end
      end
    end
  end
end
```

### 3. CocoaPods Scripts Using rsync

The following generated scripts already use `/usr/bin/rsync` (full path):

- `Pods/Target Support Files/Pods-JewgoAppFinal/Pods-JewgoAppFinal-frameworks.sh`
- `Pods/Target Support Files/Pods-JewgoAppFinal/Pods-JewgoAppFinal-resources.sh`
- `Pods/Target Support Files/GoogleMaps/GoogleMaps-xcframeworks.sh`
- `Pods/Target Support Files/hermes-engine/hermes-engine-xcframeworks.sh`

All rsync calls in these scripts use the full path: `/usr/bin/rsync`

## Verification

To verify there are no rsync issues:

```bash
# Clean build
cd ios
rm -rf build Pods Podfile.lock
pod install

# Build the app
cd ..
npm run ios

# Check for rsync errors in build output
# Should see: NO rsync errors, NO "Operation not permitted" errors
```

## Why This Works

### The Root Cause

macOS sandboxing can interfere with rsync operations during Xcode builds, especially when:

- Hermes framework is being copied
- React Native bundles are being processed
- CocoaPods frameworks are being installed

### The Solution

1. **Force System Binary**: The redirect script ensures any rsync call uses `/usr/bin/rsync`, which is not sandboxed
2. **Disable Hermes**: Removes the primary source of rsync calls during framework copying
3. **Full Paths**: CocoaPods scripts already use full paths to rsync, avoiding PATH resolution issues

## Build Status

✅ **Last verified:** October 20, 2025
✅ **Build status:** SUCCESS - No rsync errors
✅ **App launches:** Successfully running on iOS Simulator
✅ **Framework copying:** All frameworks install correctly

## Troubleshooting

If you encounter rsync issues in the future:

1. **Verify rsync script is executable:**

   ```bash
   ls -la ios/rsync
   # Should show: -rwxr-xr-x (executable)
   ```

2. **Check rsync script content:**

   ```bash
   cat ios/rsync
   # Should redirect to /usr/bin/rsync
   ```

3. **Clean and rebuild:**

   ```bash
   cd ios
   rm -rf build Pods
   pod install
   cd ..
   npm run ios
   ```

4. **Check system rsync:**

   ```bash
   which rsync
   # Should show: /usr/bin/rsync

   rsync --version
   # Should show rsync version info
   ```

## Related Files

- `/ios/rsync` - Redirect script
- `/ios/Podfile` - Pod configuration with rsync safeguards
- `/ios/Podfile.lock` - Locked pod versions
- `/ios/JewgoAppFinal.xcodeproj/project.pbxproj` - Xcode project (build scripts)

## Notes

- **Hermes is disabled**: The app uses JSC (JavaScriptCore) instead of Hermes
- **No performance impact**: JSC performs well for this app's use case
- **Google Maps works**: The app uses Google Maps successfully (separate from rsync issues)
- **All CocoaPods install correctly**: GoogleMaps, react-native-maps, and all other pods work

## Maintenance

After running `pod install`, verify that:

1. The rsync script still exists and is executable
2. The Podfile post-install hooks are still active
3. No new rsync-related build phases were added

If issues recur after pod updates, re-run the post-install hooks:

```bash
cd ios
pod install
```
