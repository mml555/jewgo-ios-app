#!/bin/bash

echo "Quick Rate Limit Test"
echo "====================="
echo ""

# Test with production-like behavior
echo "Test 1: Auth endpoint (strict limit)"
echo "--------------------------------------"
for i in {1..8}; do
    STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST http://localhost:3001/api/v5/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"test"}')
    echo "Request $i: HTTP $STATUS"
    if [ "$STATUS" = "429" ]; then
        echo "✓ Rate limit triggered!"
        break
    fi
done

echo ""
echo "Test 2: Check rate limiter config"
echo "--------------------------------------"
node -e "
const { RATE_LIMIT_CONFIG } = require('./src/middleware/rateLimiter');
console.log('Skip paths:', RATE_LIMIT_CONFIG.skipPaths);
console.log('General limit:', RATE_LIMIT_CONFIG.general.maxRequests);
console.log('Auth limit:', RATE_LIMIT_CONFIG.auth.maxRequests);
console.log('Environment:', process.env.NODE_ENV || 'not set');
"

echo ""
echo "Test 3: Manual rate limiter test"
echo "--------------------------------------"
node -e "
const { createRateLimiter, RATE_LIMIT_CONFIG } = require('./src/middleware/rateLimiter');

// Create a test limiter
const testLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 5,
  message: 'Test limit exceeded'
});

console.log('✓ Rate limiter created successfully');
console.log('Type:', typeof testLimiter);
"

