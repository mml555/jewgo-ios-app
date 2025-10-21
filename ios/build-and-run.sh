#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

APP_SCHEME="JewgoAppFinal"
WORKSPACE="ios/JewgoAppFinal.xcworkspace"
CONFIGURATION="Debug"

# Discover bundle identifier from Info.plist unless overridden
default_bundle_id=$( /usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' ios/JewgoAppFinal/Info.plist ) || default_bundle_id="org.reactjs.native.example.JewgoAppFinal"
BUNDLE_ID="${BUNDLE_ID_OVERRIDE:-$default_bundle_id}"

# Prefer an already booted simulator; otherwise fall back to a common device name
if destination_id=$(xcrun simctl list devices booted | awk -F'[()]' '/iPhone/{print $2; exit}'); then
  DESTINATION="id=$destination_id"
else
  DESTINATION="platform=iOS Simulator,name=iPhone 16"
fi

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$APP_SCHEME" \
  -configuration "$CONFIGURATION" \
  -destination "$DESTINATION" \
  clean build

# Install and launch when destination resolved to a concrete simulator ID
if [[ "$DESTINATION" == id=* ]]; then
  UDID="${DESTINATION#id=}"
  BUILD_DIR=$(xcodebuild -workspace "$WORKSPACE" -scheme "$APP_SCHEME" -configuration "$CONFIGURATION" -showBuildSettings | awk -F' = ' '/CONFIGURATION_BUILD_DIR/{dir=$2} /FULL_PRODUCT_NAME/{name=$2} END{if(dir && name) print dir "/" name}')
  if [[ -n "$BUILD_DIR" && -d "$BUILD_DIR" ]]; then
    xcrun simctl install "$UDID" "$BUILD_DIR" || true
    xcrun simctl launch "$UDID" "$BUNDLE_ID" || true
  fi
fi
