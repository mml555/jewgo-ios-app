#!/bin/bash

# Comprehensive API Endpoint Testing Script for Jewgo Backend
# Tests all major endpoints to verify deployment

BASE_URL="https://jewgo-app-oyoh.onrender.com"
API_V5="$BASE_URL/api/v5"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}
    local data=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Test $TOTAL_TESTS: $description${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Endpoint: ${BLUE}$method $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$endpoint")
    elif [ "$method" = "POST" ]; then
        if [ -z "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "$endpoint" -H "Content-Type: application/json")
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$endpoint" -H "Content-Type: application/json" -d "$data")
        fi
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract body (all but last line)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $status_code"
    
    # Pretty print JSON if valid
    if echo "$body" | python3 -m json.tool > /dev/null 2>&1; then
        echo -e "\n${GREEN}Response:${NC}"
        echo "$body" | python3 -m json.tool | head -20
        if [ $(echo "$body" | wc -l) -gt 20 ]; then
            echo "... (truncated)"
        fi
    else
        echo -e "\n${YELLOW}Response (not JSON):${NC}"
        echo "$body" | head -10
    fi
    
    # Check status code
    if [ "$status_code" = "$expected_status" ] || [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
        echo -e "\n${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "\n${RED}❌ FAILED (Expected $expected_status, got $status_code)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Jewgo Backend API - Comprehensive Test Suite      ║${NC}"
echo -e "${GREEN}║             Testing Render + Neon Deployment          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "API Version: v5"
echo "Test Start: $(date)"
echo ""

# ============================================================================
# CORE SYSTEM TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 CORE SYSTEM TESTS                      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$BASE_URL/health" "Health Check"

# ============================================================================
# DASHBOARD TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 DASHBOARD ENDPOINTS                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/dashboard/entities/stats" "Dashboard Statistics"
test_endpoint "GET" "$API_V5/dashboard/entities/recent?limit=5" "Recent Entities"
test_endpoint "GET" "$API_V5/dashboard/entities/analytics" "Dashboard Analytics"

# ============================================================================
# ENTITY TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 ENTITY ENDPOINTS                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/entities?limit=5" "Get All Entities (Limited)"
test_endpoint "GET" "$API_V5/restaurants?limit=5" "Get Restaurants"
test_endpoint "GET" "$API_V5/synagogues?limit=5" "Get Synagogues"
test_endpoint "GET" "$API_V5/mikvahs?limit=5" "Get Mikvahs"
test_endpoint "GET" "$API_V5/stores?limit=5" "Get Stores"

# ============================================================================
# EVENTS TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 EVENTS ENDPOINTS                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/events?limit=5" "Get Events"
test_endpoint "GET" "$API_V5/events?limit=5&upcoming=true" "Get Upcoming Events"

# ============================================================================
# JOBS TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 JOBS ENDPOINTS                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/jobs?limit=5" "Get Jobs"
test_endpoint "GET" "$API_V5/jobs/industries" "Get Job Industries"
test_endpoint "GET" "$API_V5/jobs/job-types" "Get Job Types"
test_endpoint "GET" "$API_V5/jobs/compensation-structures" "Get Compensation Structures"
test_endpoint "GET" "$API_V5/jobs/experience-levels" "Get Experience Levels"

# ============================================================================
# JOB SEEKERS TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 JOB SEEKERS ENDPOINTS                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/job-seekers?limit=5" "Get Job Seekers"

# ============================================================================
# SHTETL (MARKETPLACE) TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              SHTETL MARKETPLACE ENDPOINTS              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/shtetl-stores?limit=5" "Get Shtetl Stores"
test_endpoint "GET" "$API_V5/shtetl-products?limit=5" "Get Shtetl Products"

# ============================================================================
# SPECIALS TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 SPECIALS ENDPOINTS                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/specials?limit=5" "Get Special Offers"

# ============================================================================
# SEARCH TESTS
# ============================================================================
echo -e "\n${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                 SEARCH ENDPOINTS                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"

test_endpoint "GET" "$API_V5/search?q=kosher" "Search Entities"

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
    echo -e "${GREEN}🎉 All tests passed! Backend is fully operational.${NC}"
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}⚠️  Some tests failed. Success rate: ${SUCCESS_RATE}%${NC}"
fi

echo ""
echo "Test End: $(date)"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi

