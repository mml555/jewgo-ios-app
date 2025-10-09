#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔍 Jewgo Platform Health Check"
echo "================================"

# Check backend health
echo -n "Backend API: "
if curl -s http://localhost:3001/health | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Healthy${NC}"
else
    echo -e "${RED}✗ Unhealthy${NC}"
fi

# Check database
echo -n "Database: "
if PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connected${NC}"
else
    echo -e "${RED}✗ Disconnected${NC}"
fi

# Check PostgreSQL container
echo -n "PostgreSQL Container: "
if docker ps | grep jewgo_postgres > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not Running${NC}"
fi

# Get metrics
echo ""
echo "📊 Quick Metrics (Last 24 hours):"
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT 
    '  Job Applications: ' || COUNT(*) 
FROM job_applications 
WHERE applied_at >= NOW() - INTERVAL '24 hours';
" 2>/dev/null

PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT 
    '  Event RSVPs: ' || COUNT(*) 
FROM event_rsvps 
WHERE rsvp_at >= NOW() - INTERVAL '24 hours';
" 2>/dev/null

PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT 
    '  New Claims: ' || COUNT(*) 
FROM listing_claims 
WHERE submitted_at >= NOW() - INTERVAL '24 hours';
" 2>/dev/null

echo ""
echo "Last updated: $(date)"
