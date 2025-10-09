# Rate Limiting Implementation Guide

## 📋 Overview

Rate limiting middleware has been created to protect API endpoints from abuse and DDoS attacks. The middleware is located at `backend/src/middleware/rateLimiter.js`.

## 🚀 Quick Start

### 1. Apply to All API Routes

Add to your main server file (e.g., `backend/src/server.js`):

```javascript
const { rateLimiters } = require('./middleware/rateLimiter');

// Apply general rate limiter to all API routes
app.use('/api/', rateLimiters.general);
```

### 2. Apply to Specific Endpoints

For different rate limits on specific endpoints:

```javascript
const { rateLimiters } = require('./middleware/rateLimiter');

// Authentication endpoints (stricter limits)
app.use('/api/v5/auth/login', rateLimiters.auth);
app.use('/api/v5/auth/register', rateLimiters.auth);
app.use('/api/v5/auth/verify', rateLimiters.auth);

// Write operations (moderate limits)
app.use('/api/v5/reviews', rateLimiters.write);
app.use('/api/v5/favorites', rateLimiters.write);

// Search endpoints (higher frequency allowed)
app.use('/api/v5/search', rateLimiters.search);
app.use('/api/v5/entities/search', rateLimiters.search);
```

### 3. Custom Rate Limits

Create custom rate limiters for specific needs:

```javascript
const { createRateLimiter } = require('./middleware/rateLimiter');

const imageUploadLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // 20 uploads per hour
  message: 'Too many file uploads, please try again later.',
});

app.post('/api/v5/upload', imageUploadLimiter, uploadController.handleUpload);
```

## ⚙️ Configuration

### Default Rate Limits

| Endpoint Type        | Window | Max Requests | Description                   |
| -------------------- | ------ | ------------ | ----------------------------- |
| **General**          | 15 min | 100          | Default for all API endpoints |
| **Authentication**   | 15 min | 5            | Login, register, verify       |
| **Write Operations** | 15 min | 50           | POST, PUT, DELETE             |
| **Search**           | 1 min  | 30           | Search and query endpoints    |

### Blocking

- IPs that exceed limits by **50%** are automatically blocked for **1 hour**
- Blocked IPs receive a `403 Forbidden` response

### Response Headers

All rate-limited responses include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-10-09T15:30:00.000Z
```

### Error Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": 600
}
```

## 📊 Monitoring

### Get Rate Limiting Statistics

```javascript
const { getStats } = require('./middleware/rateLimiter');

// In your admin/monitoring endpoint
app.get('/api/v5/admin/rate-limit-stats', (req, res) => {
  const stats = getStats();
  res.json(stats);
});
```

**Example Response:**

```json
{
  "activeClients": 150,
  "blockedIPs": 3,
  "blockedIPsList": [
    {
      "ip": "192.168.1.100",
      "reason": "Excessive rate limit violations",
      "blockedAt": "2025-10-09T14:30:00.000Z",
      "expiresAt": "2025-10-09T15:30:00.000Z"
    }
  ]
}
```

## 🔧 Advanced Configuration

### Environment-Based Limits

```javascript
const RATE_LIMIT_CONFIG = {
  general: {
    windowMs: 15 * 60 * 1000,
    maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: 'Too many requests, please try again later.',
  },
};
```

### Skip Paths

Add paths to skip in development:

```javascript
skipPaths: ['/health', '/api/v5/health', '/api/v5/docs'];
```

### Custom IP Detection

Modify `getClientId()` function for custom proxy setups:

```javascript
const getClientId = req => {
  // Your custom logic
  return (
    req.headers['cf-connecting-ip'] || // Cloudflare
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.ip
  );
};
```

## 🚨 Production Considerations

### 1. Use Redis for Distributed Systems

For production with multiple servers, replace the in-memory Map with Redis:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Update requestCounts to use Redis
const getRequestCount = async key => {
  return await client.get(key);
};

const setRequestCount = async (key, value, ttl) => {
  await client.setex(key, ttl, value);
};
```

### 2. Install Express Rate Limit Package (Optional)

For production-ready solution with Redis support:

```bash
npm install express-rate-limit rate-limit-redis
```

### 3. Configure Behind Proxy

If behind a proxy (nginx, Cloudflare), enable trust proxy:

```javascript
// In server.js
app.set('trust proxy', 1);
```

### 4. Set Up Monitoring Alerts

Monitor for:

- High number of blocked IPs
- Unusual spike in rate limit violations
- Specific IPs hitting limits repeatedly

## 🧪 Testing

### Test Rate Limiting

```bash
# Send multiple requests to trigger rate limit
for i in {1..110}; do
  curl -X GET http://localhost:3001/api/v5/entities
done
```

### Expected Results

- Requests 1-100: `200 OK`
- Requests 101+: `429 Too Many Requests`
- After blocking threshold: `403 Forbidden`

## 📝 Implementation Checklist

- [ ] Add rate limiter middleware to server.js
- [ ] Apply to all API routes (`/api/`)
- [ ] Add stricter limits to auth endpoints
- [ ] Configure custom limits for specific endpoints
- [ ] Set up monitoring endpoint
- [ ] Test rate limiting in development
- [ ] Configure trust proxy if behind load balancer
- [ ] Plan Redis migration for production
- [ ] Add rate limit monitoring to dashboard
- [ ] Document API rate limits in API documentation

## 🔍 Troubleshooting

### Issue: Rate limits too strict

**Solution:** Adjust `maxRequests` in configuration or create custom limiters

### Issue: Rate limits not working behind proxy

**Solution:** Enable trust proxy and verify IP detection

### Issue: Legitimate users getting blocked

**Solution:** Increase limits or whitelist specific IPs

## 📚 Additional Resources

- Express Rate Limit: https://www.npmjs.com/package/express-rate-limit
- Redis for Node.js: https://www.npmjs.com/package/redis
- Rate Limiting Best Practices: https://blog.logrocket.com/rate-limiting-node-js/

---

**Created:** October 9, 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team
