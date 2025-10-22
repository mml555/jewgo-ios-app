#!/bin/bash

# Script to build release version with bundle generation
# This ensures the JavaScript bundle is created before building

set -e

echo "🚀 Building release version of JewgoAppFinal..."

# Generate the JavaScript bundle
echo "📦 Generating JavaScript bundle..."
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/

# Copy bundle to app directory
echo "📁 Copying bundle to app directory..."
cp ios/main.jsbundle ios/JewgoAppFinal/

# Build the iOS app
echo "🔨 Building iOS app..."
cd ios
xcodebuild -workspace JewgoAppFinal.xcworkspace \
  -scheme JewgoAppFinal \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/JewgoAppFinal.xcarchive \
  archive

echo "✅ Release build completed successfully!"
echo "📱 Archive created at: ios/build/JewgoAppFinal.xcarchive"
