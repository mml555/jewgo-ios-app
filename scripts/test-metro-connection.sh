#!/bin/bash

# Script to test Metro bundler connection
# Tests various endpoints to ensure Metro is accessible

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Testing Metro Bundler Connection..."
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description... "
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# Test Metro endpoints
METRO_HOST="127.0.0.1"
METRO_PORT="8081"

echo "Metro Bundler: http://$METRO_HOST:$METRO_PORT"
echo "-------------------------------------------"

# Test basic connection
test_endpoint "http://$METRO_HOST:$METRO_PORT/status" "Metro Status Endpoint"

# Test bundle endpoint
test_endpoint "http://$METRO_HOST:$METRO_PORT/" "Metro Root Endpoint"

echo ""
echo "-------------------------------------------"
echo "Connection Test Complete!"
echo ""

# Additional diagnostics
echo "📊 Additional Diagnostics:"
echo "-------------------------------------------"

# Check if Metro process is running
if pgrep -f "react-native start" > /dev/null; then
    echo -e "${GREEN}✓${NC} Metro bundler process is running"
    echo "  PID: $(pgrep -f 'react-native start')"
else
    echo -e "${RED}✗${NC} Metro bundler process not found"
    echo "  Run: npm start or npx react-native start"
fi

# Check if port is in use
if lsof -i :$METRO_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Port $METRO_PORT is in use"
    echo "  Process: $(lsof -i :$METRO_PORT | grep LISTEN | awk '{print $1}')"
else
    echo -e "${RED}✗${NC} Port $METRO_PORT is not in use"
fi

# Check logs
if [ -f "logs/metro.log" ]; then
    echo ""
    echo "📝 Last 10 lines of Metro log:"
    echo "-------------------------------------------"
    tail -n 10 logs/metro.log
fi

echo ""

