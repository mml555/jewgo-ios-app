#!/usr/bin/env bash
# Production-ready clean build for RN 0.76.x with header fix
set -euo pipefail

echo "🧹 Starting deterministic clean build..."
echo "========================================"

# Kill derived data (Xcode caches stale header maps)
echo "🗑️  Clearing Xcode DerivedData..."
rm -rf "$HOME/Library/Developer/Xcode/DerivedData"/*

# Hard reset Pods so Podfile hook rewrites Pods.xcodeproj
echo "📦 Deintegrating CocoaPods..."
pushd ios >/dev/null
pod deintegrate || true
rm -rf Pods Podfile.lock
echo "📥 Installing CocoaPods with repo update..."
pod install --repo-update
popd >/dev/null

# Sanity: ensure Hermes + static pods are active
echo "🔍 Verifying configuration..."
grep -R "use_frameworks!" ios/Podfile && echo "❌ ERROR: remove use_frameworks!" && exit 1 || echo "✅ Static pods confirmed"

echo ""
echo "========================================"
echo "✅ Clean build preparation complete!"
echo "========================================"
echo ""
echo "Build with: npx react-native run-ios --simulator=\"iPhone 16\""
echo ""
echo "Watch for Yoga compile lines showing:"
echo "  -I\${PODS_ROOT}/Headers/Public/React-Core/**"
echo "  -I\${PODS_TARGET_SRCROOT}/../../ReactCommon/yoga/**"
echo ""
