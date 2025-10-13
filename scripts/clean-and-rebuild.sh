#!/bin/bash

# Comprehensive Clean and Rebuild Script for React Native
# This ensures new app icons are properly applied

set -e  # Exit on error

echo "🧹 React Native Clean and Rebuild"
echo "===================================="
echo ""

cd /Users/mendell/JewgoAppFinal

# Metro Cache
echo "📦 Clearing Metro bundler cache..."
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
echo "✅ Metro cache cleared"

# iOS Clean
echo ""
echo "📱 Cleaning iOS build..."
rm -rf ios/build 2>/dev/null || true
rm -rf ios/DerivedData 2>/dev/null || true
echo "✅ iOS build cleaned"

# Android Clean
echo ""
echo "🤖 Cleaning Android build..."
rm -rf android/build 2>/dev/null || true
rm -rf android/app/build 2>/dev/null || true
rm -rf android/.gradle 2>/dev/null || true
echo "✅ Android build cleaned"

echo ""
echo "✨ Clean complete!"
echo ""
echo "📋 Next steps to rebuild:"
echo ""
echo "🔵 For iOS:"
echo "   npx react-native run-ios"
echo ""
echo "🟢 For Android:"
echo "   npx react-native run-android"
echo ""
echo "💡 Optional: Start Metro bundler with reset cache:"
echo "   npx react-native start --reset-cache"
echo ""
echo "🎨 Your new app icons are ready!"
echo "   They will be visible after rebuilding the app."
echo ""

