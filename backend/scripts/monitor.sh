#!/bin/bash
# Continuous monitoring script for deployed backend
# Usage: ./scripts/monitor.sh [url] [interval]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKEND_URL=${1:-$BACKEND_URL}
INTERVAL=${2:-10}

if [ -z "$BACKEND_URL" ]; then
  echo -e "${RED}❌ Error: Backend URL required${NC}"
  echo "Usage: ./scripts/monitor.sh [url] [interval-seconds]"
  echo ""
  echo "Example:"
  echo "  ./scripts/monitor.sh https://jewgo-backend.up.railway.app 5"
  exit 1
fi

# Remove trailing slash
BACKEND_URL=${BACKEND_URL%/}

echo -e "${BLUE}📊 Jewgo Backend Monitor${NC}"
echo "========================"
echo ""
echo "Monitoring: $BACKEND_URL"
echo "Interval: ${INTERVAL}s"
echo "Press Ctrl+C to stop"
echo ""

# Track consecutive failures
FAILURE_COUNT=0
MAX_FAILURES=3

while true; do
  timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  # Test health endpoint
  response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health" 2>/dev/null) || {
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    echo -e "${RED}[$timestamp] ❌ Failed - Connection error (failures: $FAILURE_COUNT)${NC}"
    
    if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
      echo -e "${RED}⚠️  ALERT: $MAX_FAILURES consecutive failures detected!${NC}"
      # Here you could add notification logic (email, SMS, Slack, etc.)
    fi
    
    sleep $INTERVAL
    continue
  }
  
  # macOS-compatible parsing
  body=$(echo "$response" | sed '$d')
  status=$(echo "$response" | tail -1)
  
  if [ "$status" -eq 200 ]; then
    FAILURE_COUNT=0
    
    # Parse health status
    health_status=$(echo "$body" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
    
    if [ "$health_status" = "healthy" ]; then
      echo -e "${GREEN}[$timestamp] ✅ Healthy (HTTP $status)${NC}"
    else
      echo -e "${YELLOW}[$timestamp] ⚠️  Status: $health_status (HTTP $status)${NC}"
    fi
  else
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    echo -e "${RED}[$timestamp] ❌ Failed - HTTP $status (failures: $FAILURE_COUNT)${NC}"
    
    if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
      echo -e "${RED}⚠️  ALERT: $MAX_FAILURES consecutive failures detected!${NC}"
    fi
  fi
  
  sleep $INTERVAL
done

