#!/bin/bash
set -e

echo "🔨 Building JewgoAppFinal for iOS Simulator..."

# Build the app
xcodebuild -workspace JewgoAppFinal.xcworkspace \
  -scheme JewgoAppFinal \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'id=4F2DF094-9D7C-4054-A8CB-3C2ECB024584' \
  build CODE_SIGNING_ALLOWED=NO

echo ""
echo "📦 Copying Hermes framework..."

# Find DerivedData path
DERIVED_DATA=$(find ~/Library/Developer/Xcode/DerivedData -name "JewgoAppFinal-*" -type d -maxdepth 1 | head -1)
APP_PATH="$DERIVED_DATA/Build/Products/Debug-iphonesimulator/JewgoAppFinal.app"

# Create Frameworks directory
mkdir -p "$APP_PATH/Frameworks"

# Copy Hermes framework
cp -R "$(pwd)/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64_x86_64-simulator/hermes.framework" \
  "$APP_PATH/Frameworks/"

echo "✅ Hermes framework copied successfully"
echo ""
echo "🚀 Installing and launching app..."

# Boot simulator if not running
xcrun simctl boot 4F2DF094-9D7C-4054-A8CB-3C2ECB024584 2>/dev/null || true

# Open Simulator app
open -a Simulator

# Wait for simulator to boot
sleep 3

# Uninstall old version
xcrun simctl uninstall 4F2DF094-9D7C-4054-A8CB-3C2ECB024584 org.reactjs.native.example.JewgoAppFinal 2>/dev/null || true

# Install new version
xcrun simctl install 4F2DF094-9D7C-4054-A8CB-3C2ECB024584 "$APP_PATH"

# Launch the app
xcrun simctl launch 4F2DF094-9D7C-4054-A8CB-3C2ECB024584 org.reactjs.native.example.JewgoAppFinal

echo ""
echo "✨ JewgoAppFinal is now running on the simulator!"
echo ""
echo "💡 Tip: For faster builds, use Xcode GUI (Cmd+R) which doesn't have sandbox restrictions."

