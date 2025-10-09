const express = require('express');
const AdminController = require('../controllers/adminController');
const ClaimsController = require('../controllers/claimsController');

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

module.exports = router;
