#!/bin/bash

# Cleanup script for Jewgo iOS App
# Removes temporary files, logs, and build artifacts

set -e

echo "🧹 Cleaning up Jewgo iOS App..."
echo ""

# Clean log files
echo "📝 Cleaning log files..."
rm -f logs/*.log logs/*.pid
rm -f backend/logs/*.log backend/logs/*.pid
echo "   ✅ Logs cleaned"

# Clean node_modules (optional - uncomment if needed)
# echo "📦 Cleaning node_modules..."
# rm -rf node_modules
# rm -rf backend/node_modules
# echo "   ✅ node_modules cleaned"

# Clean iOS build artifacts
echo "🍎 Cleaning iOS build artifacts..."
rm -rf ios/build
rm -rf ios/DerivedData
echo "   ✅ iOS build artifacts cleaned"

# Clean Android build artifacts (if present)
if [ -d "android/app/build" ]; then
  echo "🤖 Cleaning Android build artifacts..."
  rm -rf android/app/build
  rm -rf android/build
  echo "   ✅ Android build artifacts cleaned"
fi

# Clean Metro bundler cache
echo "📦 Cleaning Metro bundler cache..."
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true
echo "   ✅ Metro cache cleaned"

# Clean watchman (if installed)
if command -v watchman &> /dev/null; then
  echo "👁️  Cleaning watchman..."
  watchman watch-del-all 2>/dev/null || true
  echo "   ✅ Watchman cleaned"
fi

# Clean CocoaPods cache (optional - uncomment if needed)
# echo "☕ Cleaning CocoaPods cache..."
# rm -rf ios/Pods
# rm -f ios/Podfile.lock
# echo "   ✅ CocoaPods cache cleaned"

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "Next steps:"
echo "  - Run 'npm install' to reinstall dependencies (if you cleaned node_modules)"
echo "  - Run 'cd ios && pod install' to reinstall pods (if you cleaned Pods)"
echo "  - Run './scripts/start-dev.sh' to start development"

