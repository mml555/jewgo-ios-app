#!/bin/bash

echo "=== Testing API Connection ==="
echo ""

echo "1. Testing Render backend health:"
curl -s -w "\nHTTP Status: %{http_code}\n" https://jewgo-app-oyoh.onrender.com/health
echo ""

echo "2. Testing guest session creation:"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST https://jewgo-app-oyoh.onrender.com/api/v5/guest/create \
  -H "Content-Type: application/json" \
  -d '{"deviceInfo":{"platform":"ios"}}'
echo ""

echo "3. Testing entities endpoint:"
curl -s -w "\nHTTP Status: %{http_code}\n" https://jewgo-app-oyoh.onrender.com/api/v5/entities?entityType=mikvah&limit=5
echo ""

echo "=== Checking .env configuration ==="
cat .env | grep API_BASE_URL
echo ""

