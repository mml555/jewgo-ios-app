# 📊 **MONITORING & ANALYTICS SETUP GUIDE**

## **Complete Monitoring Solution for Jewgo Platform**

---

## 🎯 **MONITORING OBJECTIVES**

1. Track API performance and errors
2. Monitor database health and queries
3. Track user engagement metrics
4. Monitor payment success rates
5. Track admin review times
6. Alert on critical issues

---

## 📈 **1. BACKEND MONITORING**

### **Application Logs**

```bash
# Real-time log monitoring
tail -f /Users/mendell/JewgoAppFinal/logs/backend.log

# Error-only monitoring
grep "ERROR" /Users/mendell/JewgoAppFinal/logs/backend.log | tail -50

# Search for specific patterns
grep "payment" /Users/mendell/JewgoAppFinal/logs/backend.log
```

### **Server Health Monitoring**

```bash
# Health check endpoint
curl http://localhost:3001/health | jq

# Monitor response time
time curl -s http://localhost:3001/health > /dev/null

# Continuous monitoring (every 30 seconds)
watch -n 30 'curl -s http://localhost:3001/health | jq'
```

### **Process Monitoring**

```bash
# Check if backend is running
lsof -i :3001

# Monitor CPU and memory usage
ps aux | grep "node src/server.js"

# Get process details
top -pid $(lsof -ti:3001)
```

---

## 🗄️ **2. DATABASE MONITORING**

### **Connection Monitoring**

```bash
# Check active connections
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT count(*) as active_connections,
       max_conn.setting::int as max_connections
FROM pg_stat_activity,
     (SELECT setting FROM pg_settings WHERE name = 'max_connections') max_conn
WHERE state = 'active';
"
```

### **Query Performance**

```bash
# Check slow queries (requires pg_stat_statements extension)
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
" 2>/dev/null || echo "pg_stat_statements not enabled"
```

### **Table Statistics**

```bash
# Check table sizes
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  schemaname,
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  pg_size_pretty(pg_relation_size(relid)) as table_size,
  pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as indexes_size
FROM pg_catalog.pg_statio_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
"
```

### **Database Health**

```bash
# Check for bloated tables
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  schemaname,
  relname,
  n_live_tup,
  n_dead_tup,
  round(n_dead_tup * 100.0 / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 100
ORDER BY n_dead_tup DESC
LIMIT 10;
"
```

---

## 📊 **3. APPLICATION METRICS**

### **User Engagement Metrics**

```bash
# Get job application metrics
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  COUNT(*) as total_applications,
  COUNT(DISTINCT applicant_id) as unique_applicants,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'reviewing' THEN 1 END) as reviewing,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted
FROM job_applications
WHERE applied_at >= NOW() - INTERVAL '30 days';
"

# Get event RSVP metrics
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  COUNT(*) as total_rsvps,
  COUNT(DISTINCT attendee_id) as unique_attendees,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
  COUNT(CASE WHEN status = 'waitlist' THEN 1 END) as waitlisted
FROM event_rsvps
WHERE rsvp_at >= NOW() - INTERVAL '30 days';
"

# Get claim submission metrics
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  COUNT(*) as total_claims,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_review,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  AVG(EXTRACT(EPOCH FROM (updated_at - submitted_at))/3600) as avg_review_hours
FROM listing_claims
WHERE submitted_at >= NOW() - INTERVAL '30 days';
"
```

### **Payment Metrics**

```bash
# Get event payment statistics
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "
SELECT
  COUNT(*) as total_payments,
  SUM(amount) / 100.0 as total_revenue,
  COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as successful,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(COUNT(CASE WHEN status = 'succeeded' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM event_payments
WHERE created_at >= NOW() - INTERVAL '30 days';
"
```

---

## 🔔 **4. ALERTING SETUP**

### **Create Monitoring Script**

```bash
# Create monitoring script
cat > /Users/mendell/JewgoAppFinal/scripts/monitor.sh << 'EOF'
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
EOF

chmod +x /Users/mendell/JewgoAppFinal/scripts/monitor.sh
```

### **Run Monitoring Script**

```bash
# Run once
/Users/mendell/JewgoAppFinal/scripts/monitor.sh

# Run every 5 minutes (keep terminal open)
watch -n 300 /Users/mendell/JewgoAppFinal/scripts/monitor.sh
```

---

## 📱 **5. SENTRY INTEGRATION (ERROR TRACKING)**

### **Install Sentry**

```bash
# Install Sentry packages
cd /Users/mendell/JewgoAppFinal/backend
npm install @sentry/node

cd /Users/mendell/JewgoAppFinal
npm install @sentry/react-native --legacy-peer-deps
```

### **Configure Backend Sentry**

Add to `/backend/src/server.js` (top of file):

```javascript
const Sentry = require('@sentry/node');

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
  });
}

// Add error handler (before your error handling middleware)
app.use(Sentry.Handlers.errorHandler());
```

### **Configure Frontend Sentry**

Add to `src/App.tsx`:

```typescript
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
  });
}
```

### **Add to .env**

```bash
# Backend .env
SENTRY_DSN=your-sentry-dsn-here

# Frontend .env (if using react-native-config)
SENTRY_DSN=your-sentry-dsn-here
```

---

## 📊 **6. CUSTOM METRICS DASHBOARD**

### **Create Dashboard Script**

```bash
cat > /Users/mendell/JewgoAppFinal/scripts/dashboard.sh << 'EOF'
#!/bin/bash

clear
echo "╔════════════════════════════════════════════════╗"
echo "║        JEWGO PLATFORM DASHBOARD                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# System Status
echo "🔧 SYSTEM STATUS"
echo "────────────────────────────────────────────────"
echo -n "Backend API: "
curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "DOWN"
echo ""

# Database Metrics
echo "🗄️  DATABASE METRICS"
echo "────────────────────────────────────────────────"
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT
  'Total Tables: ' || count(*)
FROM information_schema.tables
WHERE table_schema = 'public';
" 2>/dev/null

PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT
  'Database Size: ' || pg_size_pretty(pg_database_size('jewgo_dev'));
" 2>/dev/null
echo ""

# User Activity (30 days)
echo "👥 USER ACTIVITY (Last 30 Days)"
echo "────────────────────────────────────────────────"
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT 'Job Applications: ' || COUNT(*) FROM job_applications
WHERE applied_at >= NOW() - INTERVAL '30 days';
" 2>/dev/null

PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT 'Event RSVPs: ' || COUNT(*) FROM event_rsvps
WHERE rsvp_at >= NOW() - INTERVAL '30 days';
" 2>/dev/null

PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -t -c "
SELECT 'Claim Submissions: ' || COUNT(*) FROM listing_claims
WHERE submitted_at >= NOW() - INTERVAL '30 days';
" 2>/dev/null
echo ""

# Performance Metrics
echo "⚡ PERFORMANCE"
echo "────────────────────────────────────────────────"
echo -n "API Response Time: "
time_result=$( { time curl -s http://localhost:3001/health > /dev/null; } 2>&1 | grep real | awk '{print $2}')
echo "$time_result"
echo ""

# Recent Errors
echo "🚨 RECENT ERRORS (Last 10)"
echo "────────────────────────────────────────────────"
grep -i "error" /Users/mendell/JewgoAppFinal/logs/backend.log 2>/dev/null | tail -5 || echo "No recent errors"
echo ""

echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════════"
EOF

chmod +x /Users/mendell/JewgoAppFinal/scripts/dashboard.sh
```

### **Run Dashboard**

```bash
# Run once
/Users/mendell/JewgoAppFinal/scripts/dashboard.sh

# Auto-refresh every 10 seconds
watch -n 10 /Users/mendell/JewgoAppFinal/scripts/dashboard.sh
```

---

## 🎯 **7. KEY PERFORMANCE INDICATORS (KPIs)**

### **Track These Metrics:**

1. **API Performance:**

   - Response time < 200ms (target)
   - Error rate < 1%
   - Uptime > 99.9%

2. **Database Performance:**

   - Query time < 50ms (target)
   - Connection pool usage < 80%
   - Dead tuple ratio < 5%

3. **User Engagement:**

   - Daily active users
   - Job applications per day
   - Event RSVPs per day
   - Claims submitted per day

4. **Business Metrics:**
   - Event payment success rate > 95%
   - Average claim review time < 48 hours
   - Admin response time < 24 hours

---

## 📧 **8. EMAIL ALERTS (Optional)**

### **Setup Email Notifications**

```bash
# Install nodemailer (already installed)
cd /Users/mendell/JewgoAppFinal/backend
npm list nodemailer
```

### **Create Alert Script**

```bash
cat > /Users/mendell/JewgoAppFinal/scripts/alert.sh << 'EOF'
#!/bin/bash

# Check if backend is down
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "Backend is down!" | mail -s "🚨 Jewgo Alert: Backend Down" your-email@example.com
fi

# Check if database is down
if ! PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433 -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database is down!" | mail -s "🚨 Jewgo Alert: Database Down" your-email@example.com
fi
EOF

chmod +x /Users/mendell/JewgoAppFinal/scripts/alert.sh

# Add to crontab (check every 5 minutes)
# crontab -e
# */5 * * * * /Users/mendell/JewgoAppFinal/scripts/alert.sh
```

---

## ✅ **MONITORING SETUP COMPLETE**

### **Quick Start:**

```bash
# 1. Run health check
/Users/mendell/JewgoAppFinal/scripts/monitor.sh

# 2. View dashboard
/Users/mendell/JewgoAppFinal/scripts/dashboard.sh

# 3. Monitor logs
tail -f /Users/mendell/JewgoAppFinal/logs/backend.log

# 4. Check database
PGPASSWORD=jewgo_dev_password psql -U jewgo_user -d jewgo_dev -h localhost -p 5433
```

### **Daily Monitoring Routine:**

1. Check health dashboard (morning)
2. Review error logs
3. Monitor database performance
4. Check user engagement metrics
5. Review payment success rates

---

## 📞 **SUPPORT**

- **Health Check:** http://localhost:3001/health
- **Logs:** `/Users/mendell/JewgoAppFinal/logs/`
- **Scripts:** `/Users/mendell/JewgoAppFinal/scripts/`
- **Database:** `psql -U jewgo_user -d jewgo_dev -h localhost -p 5433`

**Setup Completed:** October 9, 2025
**Status:** ✅ Ready for monitoring
