#!/bin/bash
# Test guest authentication flow
# Usage: ./test-guest-auth.sh [api-url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL=${1:-"https://jewgo-app-oyoh.onrender.com"}

echo "🧪 Testing Guest Authentication Flow"
echo "====================================="
echo "API URL: $API_URL"
echo ""

# Step 1: Create guest session
echo "📝 Step 1: Creating guest session..."
RESPONSE=$(curl -s -X POST "$API_URL/api/v5/guest/create" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceInfo": {
      "platform": "test",
      "model": "test-device",
      "osVersion": "1.0"
    }
  }')

echo "Response: $RESPONSE"
echo ""

# Extract session token
SESSION_TOKEN=$(echo $RESPONSE | grep -o '"sessionToken":"[^"]*"' | sed 's/"sessionToken":"\([^"]*\)"/\1/')

if [ -z "$SESSION_TOKEN" ]; then
  echo -e "${RED}❌ FAILED: No session token received${NC}"
  echo "Full response: $RESPONSE"
  exit 1
else
  echo -e "${GREEN}✅ SUCCESS: Guest session created${NC}"
  echo "Session Token: ${SESSION_TOKEN:0:20}..."
  echo ""
fi

# Step 2: Test guest session validation (by accessing protected resource)
echo "📝 Step 2: Testing guest session validation..."
ENTITIES_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  "$API_URL/api/v5/entities?limit=5")

# Split response and status code
HTTP_CODE=$(echo "$ENTITIES_RESPONSE" | tail -n1)
BODY=$(echo "$ENTITIES_RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ SUCCESS: Guest session validated successfully${NC}"
  echo "Response preview:"
  echo "$BODY" | head -n 5
  echo "..."
  echo ""
else
  echo -e "${RED}❌ FAILED: Guest session validation failed${NC}"
  echo "Expected: 200, Got: $HTTP_CODE"
  echo "Response: $BODY"
  exit 1
fi

# Step 3: Test accessing another endpoint
echo "📝 Step 3: Testing access to another endpoint..."
SPECIALS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $SESSION_TOKEN" \
  "$API_URL/api/v5/specials?limit=3")

HTTP_CODE=$(echo "$SPECIALS_RESPONSE" | tail -n1)
BODY=$(echo "$SPECIALS_RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ SUCCESS: Multiple endpoints work with guest session${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️  Warning: Specials endpoint returned $HTTP_CODE${NC}"
  echo "This might be expected if guest users don't have access to specials"
  echo ""
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Guest Authentication Test Complete!${NC}"
echo ""
echo "Summary:"
echo "  ✅ Guest session creation: Working"
echo "  ✅ Guest session validation: Working"
echo "  ✅ API access with guest token: Working"
echo ""
echo "The 'Continue as Guest' functionality is now fixed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

