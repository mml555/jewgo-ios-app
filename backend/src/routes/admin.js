const express = require('express');
const AdminController = require('../controllers/adminController');
const ClaimsController = require('../controllers/claimsController');
const { getStats, clearBlockedIPs, clearIPBlock, resetCounts } = require('../middleware/rateLimiter');

const router = express.Router();

// Dashboard
router.get('/dashboard', /* authenticate(), */ AdminController.getDashboard);

// Review Queue
router.get(
  '/review-queue',
  /* authenticate(), */ AdminController.getReviewQueue,
);
router.post(
  '/reviews/:reviewId/assign',
  /* authenticate(), */ AdminController.assignReview,
);
router.post(
  '/reviews/:reviewId/review',
  /* authenticate(), */ AdminController.reviewContent,
);

// Claims Management
router.get(
  '/claims/pending',
  /* authenticate(), */ ClaimsController.getPendingClaims,
);
router.post(
  '/claims/:claimId/review',
  /* authenticate(), */ ClaimsController.reviewClaim,
);

// Content Flags
router.get('/flags', /* authenticate(), */ AdminController.getContentFlags);
router.post('/flag/:entityType/:entityId', AdminController.flagContent); // Can be anonymous
router.post(
  '/flags/:flagId/resolve',
  /* authenticate(), */ AdminController.resolveFlag,
);

// Admin Actions Log
router.get('/actions', /* authenticate(), */ AdminController.getAdminActions);

// Admin User Management
router.post(
  '/users/:userId/grant-access',
  /* authenticate(), */ AdminController.grantAdminAccess,
);

// Rate Limiting Management (Development Only)
if (process.env.NODE_ENV === 'development') {
  // Get rate limiting stats
  router.get('/rate-limit/stats', (req, res) => {
    try {
      const stats = getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Clear all blocked IPs
  router.post('/rate-limit/clear-blocks', (req, res) => {
    try {
      const count = clearBlockedIPs();
      res.json({
        success: true,
        message: `Cleared ${count} blocked IP(s)`,
        count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Clear specific IP block
  router.post('/rate-limit/clear-ip/:ip', (req, res) => {
    try {
      const { ip } = req.params;
      const wasBlocked = clearIPBlock(ip);
      res.json({
        success: true,
        message: wasBlocked ? `Cleared block for IP: ${ip}` : `IP was not blocked: ${ip}`,
        wasBlocked,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // Reset all request counts
  router.post('/rate-limit/reset-counts', (req, res) => {
    try {
      const count = resetCounts();
      res.json({
        success: true,
        message: `Reset ${count} request count(s)`,
        count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });
}

module.exports = router;
