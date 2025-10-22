#!/usr/bin/env bash
set -euo pipefail

APP_SCHEME="${APP_SCHEME:-JewgoAppFinal}"
APP_CONFIGURATION="${APP_CONFIGURATION:-Debug}"
SIM_NAME="${SIM_NAME:-iPhone 16}"
WORKSPACE="JewgoAppFinal.xcworkspace"

# Find a matching simulator device ID dynamically
DEVICE_ID="$(xcrun simctl list devices booted | awk -v n="$SIM_NAME" '$0 ~ n {print $NF}' | tr -d '()' || true)"
if [[ -z "${DEVICE_ID}" ]]; then
  xcrun simctl bootstatus booted >/dev/null 2>&1 || true
  xcrun simctl boot "${SIM_NAME}" || true
  DEVICE_ID="$(xcrun simctl list devices | awk -v n="$SIM_NAME" '$0 ~ n && $0 ~ /(Booted|Shutdown)/ {print $NF}' | head -1 | tr -d '()')"
fi

pushd ios >/dev/null
  bundle exec pod install || pod install
popd >/dev/null

watchman watch-del-all || true
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Start Metro if not running
if ! lsof -i :8081 >/dev/null 2>&1; then
  echo "Starting Metro…"
  (node --version; npx react-native start) &
  sleep 2
fi

# Build
xcodebuild \
  -workspace "ios/${WORKSPACE}" \
  -scheme "${APP_SCHEME}" \
  -configuration "${APP_CONFIGURATION}" \
  -destination "platform=iOS Simulator,id=${DEVICE_ID}" \
  -derivedDataPath "ios/build" \
  build | xcpretty || exit 1

# Install & launch
npx react-native run-ios --simulator "${SIM_NAME}"
