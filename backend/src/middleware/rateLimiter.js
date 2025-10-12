/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

const logger = require('../utils/logger');

// In-memory store for rate limiting (for production, use Redis)
const requestCounts = new Map();
const blockedIPs = new Map();
const blockedIPLogTracker = new Map(); // Track when we last logged about a blocked IP

// Configuration
const RATE_LIMIT_CONFIG = {
  // General API limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === 'development' ? 50000 : 100, // Very high for dev to prevent blocking during debugging
    message: 'Too many requests from this IP, please try again later.',
  },

  // Authentication endpoints (more restrictive)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === 'development' ? 20 : 5,
    message: 'Too many authentication attempts, please try again later.',
  },

  // Write operations (POST, PUT, DELETE)
  write: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === 'development' ? 200 : 50,
    message: 'Too many write operations, please try again later.',
  },

  // Search and query endpoints
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: process.env.NODE_ENV === 'development' ? 100 : 30,
    message: 'Too many search requests, please slow down.',
  },

  // Block duration for abusive IPs
  blockDuration: process.env.NODE_ENV === 'development' 
    ? 5 * 60 * 1000  // 5 minutes in development
    : 60 * 60 * 1000, // 1 hour in production

  // Skip rate limiting for these paths in development
  skipPaths: ['/health', '/api/v5/health', '/api/v5/guest/create'],
};

/**
 * Get client identifier (IP address)
 */
const getClientId = req => {
  // Try to get real IP from various headers (for proxied requests)
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  const direct = req.ip || req.connection.remoteAddress;

  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  return real || direct || 'unknown';
};

/**
 * Check if IP is blocked
 */
const isBlocked = clientId => {
  const blockInfo = blockedIPs.get(clientId);
  if (!blockInfo) return false;

  // Check if block has expired
  if (Date.now() > blockInfo.expiresAt) {
    blockedIPs.delete(clientId);
    return false;
  }

  return true;
};

/**
 * Block an IP address
 */
const blockIP = (clientId, reason = 'Rate limit exceeded') => {
  const expiresAt = Date.now() + RATE_LIMIT_CONFIG.blockDuration;
  blockedIPs.set(clientId, {
    blockedAt: Date.now(),
    expiresAt,
    reason,
  });

  logger.warn('IP blocked', {
    clientId,
    reason,
    duration: `${RATE_LIMIT_CONFIG.blockDuration / 1000}s`,
  });
};

/**
 * Create rate limiter middleware
 */
const createRateLimiter = (config = RATE_LIMIT_CONFIG.general) => {
  return (req, res, next) => {
    const clientId = getClientId(req);
    
    // Skip rate limiting for localhost in development
    if (
      process.env.NODE_ENV === 'development' ||
      clientId === '::ffff:127.0.0.1' ||
      clientId === '127.0.0.1' ||
      clientId === '::1' ||
      RATE_LIMIT_CONFIG.skipPaths.includes(req.path)
    ) {
      return next();
    }

    // Check if IP is blocked
    if (isBlocked(clientId)) {
      const blockInfo = blockedIPs.get(clientId);
      const remainingTime = Math.ceil(
        (blockInfo.expiresAt - Date.now()) / 1000 / 60,
      );

      // Only log blocked access once every 5 minutes to prevent log spam
      const lastLogTime = blockedIPLogTracker.get(clientId) || 0;
      const now = Date.now();
      if (now - lastLogTime > 5 * 60 * 1000) {
        logger.warn('Blocked IP attempted access', {
          clientId,
          path: req.path,
          remainingTime: `${remainingTime} minutes`,
        });
        blockedIPLogTracker.set(clientId, now);
      }

      return res.status(403).json({
        success: false,
        error: 'Access temporarily blocked',
        message: `Your IP has been temporarily blocked. Please try again in ${remainingTime} minutes.`,
        retryAfter: remainingTime * 60,
      });
    }

    // Get or create request count for this client
    const now = Date.now();
    const clientKey = `${clientId}:${config.windowMs}`;
    let requestInfo = requestCounts.get(clientKey);

    if (!requestInfo || now > requestInfo.resetTime) {
      // Create new window
      requestInfo = {
        count: 0,
        resetTime: now + config.windowMs,
        firstRequestTime: now,
      };
      requestCounts.set(clientKey, requestInfo);
    }

    // Increment request count
    requestInfo.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests);
    res.setHeader(
      'X-RateLimit-Remaining',
      Math.max(0, config.maxRequests - requestInfo.count),
    );
    res.setHeader(
      'X-RateLimit-Reset',
      new Date(requestInfo.resetTime).toISOString(),
    );

    // Check if limit exceeded
    if (requestInfo.count > config.maxRequests) {
      // Only log in production to reduce dev noise
      if (process.env.NODE_ENV !== 'development') {
        logger.warn('Rate limit exceeded', {
          clientId,
          path: req.path,
          method: req.method,
          count: requestInfo.count,
          limit: config.maxRequests,
          userAgent: req.headers['user-agent'],
        });
      }

      // Block IP if they exceed limit by 50%
      if (requestInfo.count > config.maxRequests * 1.5) {
        blockIP(clientId, 'Excessive rate limit violations');
      }

      return res.status(429).json({
        success: false,
        error: 'Too Many Requests',
        message: config.message,
        retryAfter: Math.ceil((requestInfo.resetTime - now) / 1000),
      });
    }

    // Don't log every request in development
    // if (requestInfo.count === 1) {
    //   logger.debug('New client request', {
    //     clientId,
    //     path: req.path,
    //     userAgent: req.headers['user-agent']?.substring(0, 50),
    //   });
    // }

    next();
  };
};

/**
 * Cleanup old entries periodically
 */
const cleanup = () => {
  const now = Date.now();

  // Clean up request counts
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }

  // Clean up blocked IPs
  for (const [key, value] of blockedIPs.entries()) {
    if (now > value.expiresAt) {
      blockedIPs.delete(key);
      blockedIPLogTracker.delete(key); // Also clear log tracker
    }
  }

  // Clean up log tracker for IPs that are no longer blocked
  for (const [key] of blockedIPLogTracker.entries()) {
    if (!blockedIPs.has(key)) {
      blockedIPLogTracker.delete(key);
    }
  }

  logger.debug('Rate limiter cleanup completed', {
    activeClients: requestCounts.size,
    blockedIPs: blockedIPs.size,
  });
};

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

/**
 * Pre-configured rate limiters
 */
const rateLimiters = {
  // General API rate limiter
  general: createRateLimiter(RATE_LIMIT_CONFIG.general),

  // Authentication endpoints (stricter)
  auth: createRateLimiter(RATE_LIMIT_CONFIG.auth),

  // Write operations
  write: createRateLimiter(RATE_LIMIT_CONFIG.write),

  // Search endpoints
  search: createRateLimiter(RATE_LIMIT_CONFIG.search),

  // Custom rate limiter creator
  custom: createRateLimiter,
};

/**
 * Get rate limiting statistics
 */
const getStats = () => {
  return {
    activeClients: requestCounts.size,
    blockedIPs: blockedIPs.size,
    blockedIPsList: Array.from(blockedIPs.entries()).map(([ip, info]) => ({
      ip,
      reason: info.reason,
      blockedAt: new Date(info.blockedAt).toISOString(),
      expiresAt: new Date(info.expiresAt).toISOString(),
    })),
  };
};

/**
 * Clear all blocked IPs (for development/debugging)
 */
const clearBlockedIPs = () => {
  const count = blockedIPs.size;
  blockedIPs.clear();
  blockedIPLogTracker.clear();
  logger.info('Cleared all blocked IPs', { count });
  return count;
};

/**
 * Clear specific IP block (for development/debugging)
 */
const clearIPBlock = (clientId) => {
  const wasBlocked = blockedIPs.has(clientId);
  blockedIPs.delete(clientId);
  blockedIPLogTracker.delete(clientId);
  if (wasBlocked) {
    logger.info('Cleared IP block', { clientId });
  }
  return wasBlocked;
};

/**
 * Reset request counts (for development/debugging)
 */
const resetCounts = () => {
  const count = requestCounts.size;
  requestCounts.clear();
  logger.info('Reset all request counts', { count });
  return count;
};

module.exports = {
  rateLimiters,
  createRateLimiter,
  getStats,
  clearBlockedIPs,
  clearIPBlock,
  resetCounts,
  RATE_LIMIT_CONFIG,
};
