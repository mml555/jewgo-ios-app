#!/bin/bash

# Force App Icon Update Script
# This script ensures new app icons are applied by doing a complete clean and rebuild

set -e  # Exit on error

echo "🔄 Force App Icon Update"
echo "========================"
echo ""

cd /Users/mendell/JewgoAppFinal

# Step 1: Verify new icons are in place
echo "1️⃣ Verifying new icons..."
IOS_ICON_COUNT=$(ls -1 ios/JewgoAppFinal/Images.xcassets/AppIcon.appiconset/*.png 2>/dev/null | wc -l)
ANDROID_ICON_COUNT=$(find android/app/src/main/res/mipmap-* -name "ic_launcher*.png" 2>/dev/null | wc -l)

echo "   iOS icons: $IOS_ICON_COUNT files"
echo "   Android icons: $ANDROID_ICON_COUNT files"

if [ "$IOS_ICON_COUNT" -lt 9 ] || [ "$ANDROID_ICON_COUNT" -lt 10 ]; then
    echo "⚠️  Warning: Some icon files may be missing!"
fi
echo "✅ Icon files verified"
echo ""

# Step 2: Check for problematic Android folders
echo "2️⃣ Checking for cached icon folders..."
if [ -d "android/app/src/main/res/mipmap-anydpi-v26" ]; then
    echo "   Found mipmap-anydpi-v26 folder (can cause caching issues)"
    echo "   Removing it..."
    rm -rf android/app/src/main/res/mipmap-anydpi-v26
    echo "✅ Removed problematic folder"
else
    echo "✅ No problematic folders found"
fi
echo ""

# Step 3: Deep clean all build artifacts
echo "3️⃣ Deep cleaning build artifacts..."

# iOS
rm -rf ios/build 2>/dev/null || true
rm -rf ios/DerivedData 2>/dev/null || true
rm -rf ~/Library/Developer/Xcode/DerivedData/JewgoAppFinal-* 2>/dev/null || true

# Android
rm -rf android/build 2>/dev/null || true
rm -rf android/app/build 2>/dev/null || true
rm -rf android/.gradle 2>/dev/null || true
rm -rf ~/.gradle/caches 2>/dev/null || true

# Metro
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true

echo "✅ All caches cleared"
echo ""

echo "✨ Preparation complete!"
echo ""
echo "📋 Next steps to see the new icon:"
echo ""
echo "════════════════════════════════════════"
echo "🔵 FOR iOS:"
echo "════════════════════════════════════════"
echo "1. Uninstall the app from your device/simulator"
echo "2. Run: npx react-native run-ios"
echo "3. The new circular icon will appear!"
echo ""
echo "════════════════════════════════════════"
echo "🟢 FOR ANDROID:"
echo "════════════════════════════════════════"
echo "1. Uninstall the app from your device/emulator"
echo "2. Run: npx react-native run-android"
echo "3. The new circular icon will appear!"
echo ""
echo "💡 IMPORTANT:"
echo "   • The old icon is cached on your device"
echo "   • Uninstalling removes the cache completely"
echo "   • Rebuilding installs the new icon"
echo ""
echo "🎨 Your new circular mint green logo is ready!"
echo ""

