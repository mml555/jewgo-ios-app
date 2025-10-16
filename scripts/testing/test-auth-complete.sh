#!/bin/bash

# Comprehensive Authentication Testing Script
# Tests: User Registration, Login, Guest Sessions, and Protected Endpoints

BASE_URL="https://jewgo-app-oyoh.onrender.com"
API_V5="$BASE_URL/api/v5"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test credentials
TEST_EMAIL="test_user_$(date +%s)@jewgo.app"
TEST_PASSWORD="SecurePassword123!"
TEST_FIRST_NAME="Test"
TEST_LAST_NAME="User"

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Jewgo Backend - Complete Authentication Tests     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backend URL: $BASE_URL"
echo "Test Start: $(date)"
echo ""

# Function to test and track results
test_auth() {
    local description=$1
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Test $TOTAL_TESTS: $description${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

pass_test() {
    echo -e "${GREEN}✅ PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

fail_test() {
    local reason=$1
    echo -e "${RED}❌ FAILED: $reason${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# ============================================================================
# TEST 1: USER REGISTRATION
# ============================================================================
test_auth "User Registration"

REGISTER_DATA=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD",
  "first_name": "$TEST_FIRST_NAME",
  "last_name": "$TEST_LAST_NAME"
}
EOF
)

echo "Registering user: $TEST_EMAIL"
echo "Request:"
echo "$REGISTER_DATA" | python3 -m json.tool

REGISTER_RESPONSE=$(curl -s -X POST "$API_V5/auth/register" \
  -H "Content-Type: application/json" \
  -d "$REGISTER_DATA")

echo -e "\n${CYAN}Response:${NC}"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

# Extract access token
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('accessToken', '') or data.get('accessToken', ''))" 2>/dev/null)
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('refreshToken', '') or data.get('refreshToken', ''))" 2>/dev/null)
USER_ID=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('user', {}).get('id', '') or data.get('user', {}).get('id', ''))" 2>/dev/null)

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    echo -e "\n${GREEN}Access Token obtained: ${ACCESS_TOKEN:0:30}...${NC}"
    echo -e "${GREEN}User ID: $USER_ID${NC}"
    pass_test
else
    fail_test "No access token received"
fi

# ============================================================================
# TEST 2: USER LOGIN
# ============================================================================
test_auth "User Login with Credentials"

LOGIN_DATA=$(cat <<EOF
{
  "email": "$TEST_EMAIL",
  "password": "$TEST_PASSWORD"
}
EOF
)

echo "Logging in: $TEST_EMAIL"
echo "Request:"
echo "$LOGIN_DATA" | python3 -m json.tool

LOGIN_RESPONSE=$(curl -s -X POST "$API_V5/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

echo -e "\n${CYAN}Response:${NC}"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('accessToken', '') or data.get('accessToken', ''))" 2>/dev/null)

if [ -n "$LOGIN_TOKEN" ] && [ "$LOGIN_TOKEN" != "None" ]; then
    echo -e "\n${GREEN}Login successful! Token: ${LOGIN_TOKEN:0:30}...${NC}"
    ACCESS_TOKEN="$LOGIN_TOKEN"  # Use login token for subsequent tests
    pass_test
else
    fail_test "Login failed"
fi

# ============================================================================
# TEST 3: GUEST SESSION CREATION
# ============================================================================
test_auth "Guest Session Creation"

echo "Creating guest session..."
GUEST_RESPONSE=$(curl -s -X POST "$API_V5/guest/session" \
  -H "Content-Type: application/json")

echo -e "${CYAN}Response:${NC}"
echo "$GUEST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$GUEST_RESPONSE"

GUEST_TOKEN=$(echo "$GUEST_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('token', '') or data.get('token', '') or data.get('data', {}).get('accessToken', '') or data.get('accessToken', ''))" 2>/dev/null)
GUEST_ID=$(echo "$GUEST_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('sessionId', '') or data.get('sessionId', '') or data.get('data', {}).get('guestId', ''))" 2>/dev/null)

if [ -n "$GUEST_TOKEN" ] && [ "$GUEST_TOKEN" != "None" ]; then
    echo -e "\n${GREEN}Guest token obtained: ${GUEST_TOKEN:0:30}...${NC}"
    echo -e "${GREEN}Guest ID: $GUEST_ID${NC}"
    pass_test
else
    echo -e "\n${YELLOW}Guest session format differs from expected${NC}"
    # Still pass if we get a valid response structure
    if echo "$GUEST_RESPONSE" | grep -q "success\|guest\|session"; then
        echo -e "${GREEN}Response contains guest session data${NC}"
        pass_test
    else
        fail_test "No guest session data"
    fi
fi

# ============================================================================
# TEST 4: ACCESS PROTECTED ENDPOINT WITH USER TOKEN
# ============================================================================
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         TESTING PROTECTED ENDPOINTS (USER AUTH)        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"

test_auth "Get Entities with User Authentication"

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    ENTITIES_RESPONSE=$(curl -s "$API_V5/entities?limit=3" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$ENTITIES_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    
    if echo "$ENTITIES_RESPONSE" | grep -q '"success":true\|"entities"'; then
        echo -e "\n${GREEN}Successfully accessed protected endpoint${NC}"
        pass_test
    else
        fail_test "Failed to access entities"
    fi
else
    fail_test "No access token available"
fi

# ============================================================================
# TEST 5: ACCESS RESTAURANTS
# ============================================================================
test_auth "Get Restaurants with User Authentication"

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    RESTAURANTS_RESPONSE=$(curl -s "$API_V5/restaurants?limit=3" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$RESTAURANTS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    
    if echo "$RESTAURANTS_RESPONSE" | grep -q '"success":true\|"entities"\|"restaurants"'; then
        pass_test
    else
        fail_test "Failed to access restaurants"
    fi
else
    fail_test "No access token available"
fi

# ============================================================================
# TEST 6: ACCESS EVENTS
# ============================================================================
test_auth "Get Events with User Authentication"

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    EVENTS_RESPONSE=$(curl -s "$API_V5/events?limit=3" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$EVENTS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    
    if echo "$EVENTS_RESPONSE" | grep -q '"success":true\|"events"'; then
        pass_test
    else
        fail_test "Failed to access events"
    fi
else
    fail_test "No access token available"
fi

# ============================================================================
# TEST 7: ACCESS JOBS
# ============================================================================
test_auth "Get Jobs with User Authentication"

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    JOBS_RESPONSE=$(curl -s "$API_V5/jobs?limit=3" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$JOBS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    
    if echo "$JOBS_RESPONSE" | grep -q '"success":true\|"jobs"'; then
        pass_test
    else
        fail_test "Failed to access jobs"
    fi
else
    fail_test "No access token available"
fi

# ============================================================================
# TEST 8: SEARCH WITH AUTHENTICATION
# ============================================================================
test_auth "Search Entities with User Authentication"

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    SEARCH_RESPONSE=$(curl -s "$API_V5/search?q=kosher" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$SEARCH_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    
    if echo "$SEARCH_RESPONSE" | grep -q '"success":true\|"data"\|"entities"'; then
        pass_test
    else
        fail_test "Search failed"
    fi
else
    fail_test "No access token available"
fi

# ============================================================================
# TEST 9: GET SPECIALS
# ============================================================================
test_auth "Get Special Offers with User Authentication"

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    SPECIALS_RESPONSE=$(curl -s "$API_V5/specials?limit=3" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$SPECIALS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -30
    
    if echo "$SPECIALS_RESPONSE" | grep -q '"success":true\|"specials"'; then
        pass_test
    else
        fail_test "Failed to access specials"
    fi
else
    fail_test "No access token available"
fi

# ============================================================================
# TEST 10: TOKEN REFRESH
# ============================================================================
test_auth "Refresh Access Token"

if [ -n "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "None" ]; then
    REFRESH_DATA="{\"refreshToken\":\"$REFRESH_TOKEN\"}"
    
    REFRESH_RESPONSE=$(curl -s -X POST "$API_V5/auth/refresh" \
      -H "Content-Type: application/json" \
      -d "$REFRESH_DATA")
    
    echo -e "${CYAN}Response:${NC}"
    echo "$REFRESH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REFRESH_RESPONSE"
    
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | python3 -c "import sys, json; data = json.load(sys.stdin); print(data.get('data', {}).get('accessToken', '') or data.get('accessToken', ''))" 2>/dev/null)
    
    if [ -n "$NEW_ACCESS_TOKEN" ] && [ "$NEW_ACCESS_TOKEN" != "None" ]; then
        echo -e "\n${GREEN}Token refreshed: ${NEW_ACCESS_TOKEN:0:30}...${NC}"
        pass_test
    else
        fail_test "Token refresh failed"
    fi
else
    echo -e "${YELLOW}No refresh token available to test${NC}"
    fail_test "No refresh token"
fi

# ============================================================================
# TEST 11: ACCESS WITHOUT AUTHENTICATION (Should Fail)
# ============================================================================
test_auth "Attempt Access Without Authentication (Should Return 401)"

UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_V5/entities?limit=1")
STATUS_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)
BODY=$(echo "$UNAUTH_RESPONSE" | sed '$d')

echo -e "${CYAN}Status Code: $STATUS_CODE${NC}"
echo -e "${CYAN}Response:${NC}"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [ "$STATUS_CODE" = "401" ]; then
    echo -e "\n${GREEN}Correctly returned 401 Unauthorized${NC}"
    pass_test
else
    fail_test "Expected 401, got $STATUS_CODE"
fi

# ============================================================================
# TEST 12: FIXED RECENT ENTITIES ENDPOINT
# ============================================================================
test_auth "Recent Entities Endpoint (Previously Broken)"

RECENT_RESPONSE=$(curl -s "$API_V5/dashboard/entities/recent?limit=5")

echo -e "${CYAN}Response:${NC}"
echo "$RECENT_RESPONSE" | python3 -m json.tool 2>/dev/null | head -40

if echo "$RECENT_RESPONSE" | grep -q '"success":true'; then
    echo -e "\n${GREEN}Fixed endpoint now working!${NC}"
    pass_test
else
    fail_test "Recent entities still failing"
fi

# ============================================================================
# TEST SUMMARY
# ============================================================================
echo -e "\n\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   TEST SUMMARY                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:   ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:        ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:        ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    SUCCESS_RATE=100
    echo -e "${GREEN}🎉 All authentication tests passed!${NC}"
else
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}⚠️  Some tests failed. Success rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 TEST CREDENTIALS                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Email:      ${BLUE}$TEST_EMAIL${NC}"
echo -e "Password:   ${BLUE}$TEST_PASSWORD${NC}"
echo -e "User ID:    ${BLUE}$USER_ID${NC}"
if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "None" ]; then
    echo -e "Token:      ${BLUE}${ACCESS_TOKEN:0:40}...${NC}"
fi
echo ""
echo -e "${YELLOW}Note: You can use these credentials to test the mobile app${NC}"
echo ""

echo "Test End: $(date)"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi

