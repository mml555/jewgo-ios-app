#!/bin/bash
# Health check script for deployed backend
# Usage: ./scripts/health-check.sh [url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Jewgo Backend Health Check${NC}"
echo "=============================="
echo ""

# Get URL from argument or environment
BACKEND_URL=${1:-$BACKEND_URL}

if [ -z "$BACKEND_URL" ]; then
  echo -e "${RED}❌ Error: Backend URL required${NC}"
  echo "Usage: ./scripts/health-check.sh [url]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/health-check.sh https://jewgo-backend.up.railway.app"
  echo "  BACKEND_URL=https://jewgo-backend.up.railway.app ./scripts/health-check.sh"
  exit 1
fi

# Remove trailing slash
BACKEND_URL=${BACKEND_URL%/}

echo -e "${BLUE}Testing: ${BACKEND_URL}${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local description=$2
  local expected_status=${3:-200}
  
  echo -n "Testing $description... "
  
  response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>/dev/null) || {
    echo -e "${RED}❌ Failed (connection error)${NC}"
    return 1
  }
  
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
  if [ "$status" -eq "$expected_status" ]; then
    echo -e "${GREEN}✅ OK (HTTP $status)${NC}"
    return 0
  else
    echo -e "${RED}❌ Failed (HTTP $status, expected $expected_status)${NC}"
    return 1
  fi
}

# Test health endpoint
echo -e "${YELLOW}Core Health Check:${NC}"
if test_endpoint "/health" "Health endpoint" 200; then
  echo ""
  echo "Response:"
  curl -s "$BACKEND_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$BACKEND_URL/health"
  echo ""
else
  echo -e "${RED}⚠️  Backend is not responding correctly${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}API Endpoints:${NC}"

# Test various API endpoints
test_endpoint "/api/v5/dashboard/entities/stats" "Dashboard stats" 200
test_endpoint "/api/v5/entities" "Entities endpoint" 401  # Should require auth
test_endpoint "/api/v5/events" "Events endpoint" 401      # Should require auth
test_endpoint "/api/notfound" "404 handler" 404

echo ""
echo -e "${YELLOW}Performance Check:${NC}"

# Measure response time
echo -n "Response time... "
start_time=$(date +%s%N)
curl -s -o /dev/null "$BACKEND_URL/health"
end_time=$(date +%s%N)
elapsed=$((($end_time - $start_time) / 1000000))

if [ $elapsed -lt 500 ]; then
  echo -e "${GREEN}✅ ${elapsed}ms (Excellent)${NC}"
elif [ $elapsed -lt 1000 ]; then
  echo -e "${YELLOW}⚠️  ${elapsed}ms (Good)${NC}"
else
  echo -e "${RED}⚠️  ${elapsed}ms (Slow)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✨ Health check complete!${NC}"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Status: Operational"
echo ""
echo "Next steps:"
echo "  1. Update your iOS app .env.production with this URL"
echo "  2. Build your iOS app in Release mode"
echo "  3. Test on physical device"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

