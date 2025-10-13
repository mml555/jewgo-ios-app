#!/bin/bash

# Replace AsyncStorage method calls with safeAsyncStorage
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
    echo "Migrating AsyncStorage calls in $SERVICE..."
    
    # Replace simple method calls
    sed -i '' 's/AsyncStorage\.getItem(/safeAsyncStorage.getItem(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.setItem(/safeAsyncStorage.setItem(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.removeItem(/safeAsyncStorage.removeItem(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.clear(/safeAsyncStorage.clear(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.multiGet(/safeAsyncStorage.multiGet(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.multiSet(/safeAsyncStorage.multiSet(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.multiRemove(/safeAsyncStorage.multiRemove(/g' "$SERVICE"
    sed -i '' 's/AsyncStorage\.getAllKeys(/safeAsyncStorage.getAllKeys(/g' "$SERVICE"
    
    echo "✓ Migrated $SERVICE"
  fi
done

echo ""
echo "✅ Method calls updated! Note: JSON.parse/stringify patterns may need manual review."

