#!/bin/bash

# Script to install generated app icons to iOS and Android projects

echo "📦 Installing App Icons..."
echo "=========================="

# iOS Icons
echo ""
echo "📱 Installing iOS icons..."

IOS_DEST="ios/JewgoAppFinal/Images.xcassets/AppIcon.appiconset"
IOS_SOURCE="temp_appicons/Assets.xcassets/AppIcon.appiconset"

# Copy iOS icons
cp "$IOS_SOURCE/1024.png" "$IOS_DEST/Icon-App-1024x1024@1x.png"
cp "$IOS_SOURCE/40.png" "$IOS_DEST/Icon-App-20x20@2x.png"
cp "$IOS_SOURCE/60.png" "$IOS_DEST/Icon-App-20x20@3x.png"
cp "$IOS_SOURCE/58.png" "$IOS_DEST/Icon-App-29x29@2x.png"
cp "$IOS_SOURCE/87.png" "$IOS_DEST/Icon-App-29x29@3x.png"
cp "$IOS_SOURCE/80.png" "$IOS_DEST/Icon-App-40x40@2x.png"
cp "$IOS_SOURCE/120.png" "$IOS_DEST/Icon-App-40x40@3x.png"
cp "$IOS_SOURCE/120.png" "$IOS_DEST/Icon-App-60x60@2x.png"
cp "$IOS_SOURCE/180.png" "$IOS_DEST/Icon-App-60x60@3x.png"

echo "✅ iOS icons installed: $IOS_DEST"

# Android Icons
echo ""
echo "🤖 Installing Android icons..."

ANDROID_DEST="android/app/src/main/res"
ANDROID_SOURCE="temp_appicons/android"

# Copy Android icons (square)
for density in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  echo "  → Installing mipmap-$density"
  cp "$ANDROID_SOURCE/mipmap-$density/ic_launcher.png" "$ANDROID_DEST/mipmap-$density/ic_launcher.png"
  # Also copy as round (they're the same for our logo)
  cp "$ANDROID_SOURCE/mipmap-$density/ic_launcher.png" "$ANDROID_DEST/mipmap-$density/ic_launcher_round.png"
done

echo "✅ Android icons installed: $ANDROID_DEST/mipmap-*"

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf temp_appicons

echo ""
echo "✨ App icons installed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Clean and rebuild your projects:"
echo "      iOS:     cd ios && xcodebuild clean && cd .."
echo "      Android: cd android && ./gradlew clean && cd .."
echo "   2. Run the app to verify icons:"
echo "      npx react-native run-ios"
echo "      npx react-native run-android"
echo ""

