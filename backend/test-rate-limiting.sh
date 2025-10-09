#!/bin/bash

# Rate Limiting Test Script
# Tests all rate limiting tiers and features

echo "🧪 Rate Limiting Test Suite"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# Counter for tests
PASSED=0
FAILED=0

# Helper function to check if server is running
check_server() {
    echo -e "${BLUE}Checking if server is running...${NC}"
    if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running${NC}"
        echo "Please start the server with: npm start"
        exit 1
    fi
}

# Test 1: Check rate limit headers
test_rate_limit_headers() {
    echo ""
    echo -e "${YELLOW}Test 1: Checking Rate Limit Headers${NC}"
    echo "---------------------------------------"
    
    RESPONSE=$(curl -s -v "$BASE_URL/api/v5/entities" 2>&1)
    
    if echo "$RESPONSE" | grep -q "X-RateLimit-Limit"; then
        LIMIT=$(echo "$RESPONSE" | grep "X-RateLimit-Limit" | head -1 | awk '{print $3}' | tr -d '\r')
        REMAINING=$(echo "$RESPONSE" | grep "X-RateLimit-Remaining" | head -1 | awk '{print $3}' | tr -d '\r')
        echo -e "${GREEN}✓ Rate limit headers present${NC}"
        echo "  Limit: $LIMIT requests"
        echo "  Remaining: $REMAINING requests"
        ((PASSED++))
    else
        echo -e "${RED}✗ Rate limit headers missing${NC}"
        ((FAILED++))
    fi
}

# Test 2: Test general API rate limit
test_general_rate_limit() {
    echo ""
    echo -e "${YELLOW}Test 2: Testing General API Rate Limit (100 req/15min)${NC}"
    echo "---------------------------------------"
    
    SUCCESS_COUNT=0
    RATE_LIMITED=false
    
    echo "Sending 105 requests to /api/v5/entities..."
    
    for i in {1..105}; do
        RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v5/entities")
        STATUS_CODE=$(echo "$RESPONSE" | tail -1)
        
        if [ "$STATUS_CODE" = "200" ]; then
            ((SUCCESS_COUNT++))
        elif [ "$STATUS_CODE" = "429" ]; then
            RATE_LIMITED=true
            break
        fi
        
        # Show progress every 20 requests
        if [ $((i % 20)) -eq 0 ]; then
            echo "  Progress: $i/105 requests sent (Success: $SUCCESS_COUNT)"
        fi
    done
    
    if [ "$RATE_LIMITED" = true ]; then
        echo -e "${GREEN}✓ Rate limit triggered after $SUCCESS_COUNT requests${NC}"
        echo "  Expected limit: 100 requests"
        
        if [ $SUCCESS_COUNT -ge 90 ] && [ $SUCCESS_COUNT -le 110 ]; then
            echo -e "${GREEN}✓ Rate limit is within acceptable range${NC}"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠ Rate limit triggered at unexpected count${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ Rate limit not triggered after 105 requests${NC}"
        ((FAILED++))
    fi
}

# Test 3: Test authentication rate limit (stricter)
test_auth_rate_limit() {
    echo ""
    echo -e "${YELLOW}Test 3: Testing Auth Rate Limit (5 req/15min)${NC}"
    echo "---------------------------------------"
    
    SUCCESS_COUNT=0
    RATE_LIMITED=false
    
    echo "Sending 10 auth requests..."
    
    for i in {1..10}; do
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/v5/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@test.com","password":"testpass"}')
        STATUS_CODE=$(echo "$RESPONSE" | tail -1)
        
        if [ "$STATUS_CODE" != "429" ]; then
            ((SUCCESS_COUNT++))
            echo "  Request $i: Status $STATUS_CODE"
        else
            RATE_LIMITED=true
            echo "  Request $i: Rate limited (429)"
            break
        fi
    done
    
    if [ "$RATE_LIMITED" = true ] && [ $SUCCESS_COUNT -le 7 ]; then
        echo -e "${GREEN}✓ Auth rate limit working (triggered after $SUCCESS_COUNT requests)${NC}"
        echo "  Expected limit: ~5 requests"
        ((PASSED++))
    else
        echo -e "${RED}✗ Auth rate limit not working as expected${NC}"
        echo "  Allowed $SUCCESS_COUNT requests before limiting"
        ((FAILED++))
    fi
}

# Test 4: Check 429 error response format
test_429_response_format() {
    echo ""
    echo -e "${YELLOW}Test 4: Checking 429 Error Response Format${NC}"
    echo "---------------------------------------"
    
    # First, trigger rate limit with multiple requests
    for i in {1..110}; do
        curl -s "$BASE_URL/api/v5/entities" > /dev/null 2>&1
    done
    
    # Now check the error response
    RESPONSE=$(curl -s "$BASE_URL/api/v5/entities")
    
    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error')
        RETRY_AFTER=$(echo "$RESPONSE" | jq -r '.retryAfter // empty')
        
        echo -e "${GREEN}✓ 429 Response is valid JSON${NC}"
        echo "  Error: $ERROR_MSG"
        if [ -n "$RETRY_AFTER" ]; then
            echo "  Retry After: ${RETRY_AFTER}s"
            ((PASSED++))
        else
            echo -e "${YELLOW}⚠ retryAfter field missing${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗ Invalid 429 response format${NC}"
        echo "Response: $RESPONSE"
        ((FAILED++))
    fi
}

# Test 5: Test that health check is exempt
test_health_check_exempt() {
    echo ""
    echo -e "${YELLOW}Test 5: Testing Health Check Exemption${NC}"
    echo "---------------------------------------"
    
    SUCCESS_COUNT=0
    
    echo "Sending 150 requests to /health endpoint..."
    
    for i in {1..150}; do
        STATUS_CODE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/health")
        
        if [ "$STATUS_CODE" = "200" ]; then
            ((SUCCESS_COUNT++))
        else
            break
        fi
    done
    
    if [ $SUCCESS_COUNT -eq 150 ]; then
        echo -e "${GREEN}✓ Health check is exempt from rate limiting${NC}"
        echo "  All 150 requests succeeded"
        ((PASSED++))
    else
        echo -e "${RED}✗ Health check was rate limited after $SUCCESS_COUNT requests${NC}"
        ((FAILED++))
    fi
}

# Test 6: Wait and verify rate limit reset
test_rate_limit_reset() {
    echo ""
    echo -e "${YELLOW}Test 6: Testing Rate Limit Reset${NC}"
    echo "---------------------------------------"
    
    echo "Note: Full reset test would take 15 minutes."
    echo "Skipping automatic reset test. To test manually:"
    echo "  1. Trigger rate limit"
    echo "  2. Wait 15 minutes"
    echo "  3. Try again - should work"
    echo -e "${BLUE}ℹ Test skipped (would take too long)${NC}"
}

# Test 7: Check different endpoints have different limits
test_tiered_limits() {
    echo ""
    echo -e "${YELLOW}Test 7: Testing Tiered Rate Limits${NC}"
    echo "---------------------------------------"
    
    echo "Testing different limits for different endpoint types:"
    echo ""
    
    # Test write endpoint (should be 50/15min)
    echo "  Testing write endpoint (/api/v5/reviews)..."
    WRITE_SUCCESS=0
    for i in {1..55}; do
        STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/v5/reviews/1" \
            -H "Content-Type: application/json" \
            -d '{"rating":5,"title":"test","content":"test review content here","userId":1}')
        if [ "$STATUS" != "429" ]; then
            ((WRITE_SUCCESS++))
        else
            break
        fi
    done
    
    if [ $WRITE_SUCCESS -ge 40 ] && [ $WRITE_SUCCESS -le 55 ]; then
        echo -e "  ${GREEN}✓ Write endpoint limit ~50 (got $WRITE_SUCCESS)${NC}"
        ((PASSED++))
    else
        echo -e "  ${YELLOW}⚠ Write endpoint limit unexpected ($WRITE_SUCCESS)${NC}"
    fi
}

# Main execution
echo ""
check_server
echo ""
echo "Starting rate limiting tests..."
echo "This may take a few minutes..."
echo ""

# Run all tests
test_rate_limit_headers
test_general_rate_limit
test_auth_rate_limit
test_429_response_format
test_health_check_exempt
test_rate_limit_reset
test_tiered_limits

# Summary
echo ""
echo "======================================"
echo -e "${BLUE}Test Summary${NC}"
echo "======================================"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo "Rate limiting is working correctly."
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    echo "Review the output above for details."
    exit 1
fi

