const express = require('express');
const ClaimsController = require('../controllers/claimsController');

const router = express.Router();

// Submit and manage claims
router.post(
  '/:entityType/:entityId',
  /* authenticate(), */ ClaimsController.submitClaim,
);
router.get('/my-claims', /* authenticate(), */ ClaimsController.getMyClaims);
router.get('/:claimId', /* authenticate(), */ ClaimsController.getClaimDetails);
router.delete('/:claimId', /* authenticate(), */ ClaimsController.cancelClaim);

// Evidence upload
router.post(
  '/:claimId/evidence',
  /* authenticate(), */ ClaimsController.uploadEvidence,
);

// Admin routes (for pending claims)
router.get(
  '/admin/pending',
  /* authenticate(), */ ClaimsController.getPendingClaims,
);
router.post(
  '/admin/:claimId/review',
  /* authenticate(), */ ClaimsController.reviewClaim,
);

module.exports = router;
