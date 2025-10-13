#!/bin/bash

# Jewgo App Icon Generator Script
# This script generates iOS and Android app icons from the brand SVG

set -e  # Exit on error

echo "🎨 Jewgo App Icon Generator"
echo "================================"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed."
    echo "   Install it with: brew install imagemagick (macOS)"
    echo "   Or visit: https://imagemagick.org/script/download.php"
    exit 1
fi

# Source SVG file
SVG_SOURCE="jewgo brand concept.svg.svg"

# Check if source file exists
if [ ! -f "$SVG_SOURCE" ]; then
    echo "❌ Source file not found: $SVG_SOURCE"
    exit 1
fi

# Create temporary directory for generated icons
TEMP_DIR="temp_icons"
mkdir -p "$TEMP_DIR"

echo "📦 Generating base 1024x1024 icon..."
convert "$SVG_SOURCE" -resize 1024x1024 -background none "$TEMP_DIR/icon_1024.png"

# =====================
# iOS Icons
# =====================
echo ""
echo "📱 Generating iOS icons..."

IOS_DIR="ios/JewgoAppFinal/Images.xcassets/AppIcon.appiconset"

# iOS Icon sizes (name -> pixel size)
declare -A IOS_ICONS=(
    ["Icon-App-20x20@2x.png"]="40"
    ["Icon-App-20x20@3x.png"]="60"
    ["Icon-App-29x29@2x.png"]="58"
    ["Icon-App-29x29@3x.png"]="87"
    ["Icon-App-40x40@2x.png"]="80"
    ["Icon-App-40x40@3x.png"]="120"
    ["Icon-App-60x60@2x.png"]="120"
    ["Icon-App-60x60@3x.png"]="180"
    ["Icon-App-1024x1024@1x.png"]="1024"
)

for filename in "${!IOS_ICONS[@]}"; do
    size="${IOS_ICONS[$filename]}"
    echo "  → Generating $filename (${size}x${size})"
    convert "$TEMP_DIR/icon_1024.png" \
        -resize "${size}x${size}" \
        -background none \
        "$IOS_DIR/$filename"
done

echo "✅ iOS icons generated in: $IOS_DIR"

# =====================
# Android Icons
# =====================
echo ""
echo "🤖 Generating Android icons..."

ANDROID_BASE="android/app/src/main/res"

# Android Icon sizes (folder -> size)
declare -A ANDROID_ICONS=(
    ["mipmap-mdpi"]="48"
    ["mipmap-hdpi"]="72"
    ["mipmap-xhdpi"]="96"
    ["mipmap-xxhdpi"]="144"
    ["mipmap-xxxhdpi"]="192"
)

for folder in "${!ANDROID_ICONS[@]}"; do
    size="${ANDROID_ICONS[$folder]}"
    
    # Generate square icon
    echo "  → Generating $folder/ic_launcher.png (${size}x${size})"
    convert "$TEMP_DIR/icon_1024.png" \
        -resize "${size}x${size}" \
        -background none \
        "$ANDROID_BASE/$folder/ic_launcher.png"
    
    # Generate round icon (with circular mask)
    echo "  → Generating $folder/ic_launcher_round.png (${size}x${size})"
    convert "$TEMP_DIR/icon_1024.png" \
        -resize "${size}x${size}" \
        \( +clone -threshold -1 -negate -fill white -draw "circle $((size/2)),$((size/2)) $((size/2)),0" \) \
        -alpha off -compose copy_opacity -composite \
        -background none \
        "$ANDROID_BASE/$folder/ic_launcher_round.png"
done

echo "✅ Android icons generated in: $ANDROID_BASE/mipmap-*"

# =====================
# Cleanup
# =====================
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "✨ Done! App icons have been generated successfully."
echo ""
echo "📋 Next steps:"
echo "   1. Review the generated icons in iOS and Android directories"
echo "   2. Clean and rebuild your projects:"
echo "      iOS:     cd ios && xcodebuild clean && cd .."
echo "      Android: cd android && ./gradlew clean && cd .."
echo "   3. Run the app to verify icons:"
echo "      npx react-native run-ios"
echo "      npx react-native run-android"
echo ""

