#!/bin/bash

# Batch migration script for AsyncStorage to SafeAsyncStorage
# This script updates import statements in remaining service files

cd /Users/mendell/JewgoAppFinal

SERVICES=(
  "src/services/LocationService.ts"
  "src/services/LocationServiceSimple.ts"
  "src/services/LocationPrivacyService.ts"
  "src/services/LocalFavoritesService.ts"
  "src/services/FormAnalytics.ts"
  "src/services/CrashReporting.ts"
  "src/services/ClaimsService.ts"
  "src/services/AdminService.ts"
)

for SERVICE in "${SERVICES[@]}"; do
  if [ -f "$SERVICE" ]; then
    echo "Updating import in $SERVICE..."
    # Replace import statement
    sed -i '' "s/import AsyncStorage from '@react-native-async-storage\/async-storage';/import { safeAsyncStorage } from '.\/SafeAsyncStorage';/g" "$SERVICE"
    echo "✓ Updated $SERVICE"
  else
    echo "⚠ File not found: $SERVICE"
  fi
done

echo ""
echo "Import statements updated! Now you need to replace AsyncStorage method calls with safeAsyncStorage methods."

