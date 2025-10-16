#!/bin/bash

# Test Guest Authentication Fix
# This script verifies that guest tokens work via Authorization: Bearer header

set -e

BASE_URL="https://jewgo-app-oyoh.onrender.com"
API_URL="${BASE_URL}/api/v5"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Testing Guest Authentication Fix                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Create a guest session
echo "📝 Step 1: Creating guest session..."
echo "----------------------------------------------------------------------"

GUEST_RESPONSE=$(curl -s -X POST "${API_URL}/guest/create" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceInfo": {
      "platform": "test",
      "model": "script",
      "osVersion": "1.0"
    }
  }')

echo "Response:"
echo "$GUEST_RESPONSE" | jq '.'

# Extract guest token
GUEST_TOKEN=$(echo "$GUEST_RESPONSE" | jq -r '.data.sessionToken')

if [ "$GUEST_TOKEN" = "null" ] || [ -z "$GUEST_TOKEN" ]; then
  echo "❌ Failed to create guest session!"
  exit 1
fi

echo ""
echo "✅ Guest session created successfully!"
echo "Token: ${GUEST_TOKEN:0:30}..."
echo ""

# Step 2: Test using guest token in Authorization header
echo "📝 Step 2: Testing Authorization: Bearer header with guest token..."
echo "----------------------------------------------------------------------"

ENTITIES_RESPONSE=$(curl -s -X GET "${API_URL}/entities?limit=5" \
  -H "Authorization: Bearer ${GUEST_TOKEN}")

echo "Response:"
echo "$ENTITIES_RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo "$ENTITIES_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo ""
  echo "✅ SUCCESS! Guest token works via Authorization header!"
  COUNT=$(echo "$ENTITIES_RESPONSE" | jq -r '.data | length')
  echo "   Retrieved $COUNT entities"
else
  echo ""
  echo "❌ FAILED! Guest token not accepted"
  ERROR=$(echo "$ENTITIES_RESPONSE" | jq -r '.error')
  echo "   Error: $ERROR"
  exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       ✅ All Tests Passed!                                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"

