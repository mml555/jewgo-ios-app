#!/bin/bash
echo "🧹 Step 1: Cleaning all caches and builds..."
rm -rf ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/JewgoAppFinal-*

echo "🗑️ Step 2: Uninstalling app from simulator..."
xcrun simctl uninstall booted org.reactjs.native.example.JewgoAppFinal 2>/dev/null || true

echo "🔄 Step 3: Reinstalling pods..."
cd ios && pod install && cd ..

echo "📱 Step 4: Building fresh app..."
npx react-native run-ios --simulator="iPhone 17 Pro"

echo "✅ Done!"
