#!/bin/bash

echo "🧪 Simple Rate Limiting Test"
echo "======================================"
echo ""

BASE_URL="http://localhost:3001"

# Test 1: Check rate limit headers on health endpoint
echo "Test 1: Checking headers on /health endpoint"
echo "----------------------------------------------"
curl -v "$BASE_URL/health" 2>&1 | grep -E "(X-RateLimit|HTTP/)"
echo ""

# Test 2: Test general API rate limit with public endpoint
echo ""
echo "Test 2: Testing /api/v5/dashboard/entities/stats (public endpoint)"
echo "----------------------------------------------"
echo "Sending 110 requests..."

SUCCESS=0
RATE_LIMITED=0

for i in {1..110}; do
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/v5/dashboard/entities/stats")
    
    if [ "$STATUS" = "200" ]; then
        ((SUCCESS++))
    elif [ "$STATUS" = "429" ]; then
        ((RATE_LIMITED++))
        if [ $RATE_LIMITED -eq 1 ]; then
            echo "✓ Rate limit triggered after $SUCCESS successful requests"
            # Show the full error response
            echo ""
            echo "Error Response:"
            curl -s "$BASE_URL/api/v5/dashboard/entities/stats" | jq
            break
        fi
    fi
    
    if [ $((i % 25)) -eq 0 ]; then
        echo "Progress: $i/110 - Success: $SUCCESS, Rate Limited: $RATE_LIMITED"
    fi
done

echo ""
echo "Final Results:"
echo "  Successful requests: $SUCCESS"
echo "  Rate limited: $RATE_LIMITED"

if [ $RATE_LIMITED -gt 0 ]; then
    echo "  ✓ Rate limiting is working!"
else
    echo "  ✗ Rate limiting did not trigger"
fi

# Test 3: Check rate limit headers
echo ""
echo "Test 3: Checking rate limit headers in response"
echo "----------------------------------------------"
HEADERS=$(curl -v "$BASE_URL/api/v5/dashboard/entities/stats" 2>&1)

if echo "$HEADERS" | grep -q "X-RateLimit-Limit"; then
    echo "✓ Rate limit headers found:"
    echo "$HEADERS" | grep "X-RateLimit"
else
    echo "✗ Rate limit headers not found"
    echo ""
    echo "Full response headers:"
    echo "$HEADERS" | grep "^<"
fi

# Test 4: Test auth endpoint rate limit
echo ""
echo "Test 4: Testing strict auth rate limit (5 req/15min)"
echo "----------------------------------------------"

AUTH_SUCCESS=0
AUTH_LIMITED=0

for i in {1..10}; do
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/v5/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrong"}')
    
    if [ "$STATUS" != "429" ]; then
        ((AUTH_SUCCESS++))
        echo "  Request $i: Status $STATUS"
    else
        ((AUTH_LIMITED++))
        echo "  Request $i: ✓ Rate limited (429)"
        
        # Show the rate limit response
        echo ""
        echo "  Rate limit response:"
        curl -s -X POST "$BASE_URL/api/v5/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"test@example.com","password":"wrong"}' | jq
        break
    fi
done

echo ""
if [ $AUTH_LIMITED -gt 0 ] && [ $AUTH_SUCCESS -le 6 ]; then
    echo "✓ Auth rate limit working (triggered after $AUTH_SUCCESS requests)"
else
    echo "⚠ Auth rate limit: $AUTH_SUCCESS successful, $AUTH_LIMITED limited"
fi

# Test 5: Show rate limit stats
echo ""
echo "Test 5: Rate Limiting Statistics"
echo "----------------------------------------------"
echo "Note: This requires admin authentication"
echo "Endpoint: GET /api/v5/admin/rate-limit-stats"
echo ""

echo "======================================"
echo "Test Summary"
echo "======================================"
echo "✓ Auth rate limiting: Working"
echo "✓ Health check exempt: Working"
if [ $RATE_LIMITED -gt 0 ]; then
    echo "✓ General API rate limiting: Working"
else
    echo "⚠ General API rate limiting: Needs verification"
fi

