const express = require('express');
const ReviewController = require('../controllers/reviewController');

const router = express.Router();

// GET /api/v5/reviews/entity/:entityId - Get reviews for a specific entity
router.get('/entity/:entityId', ReviewController.getEntityReviews);

// GET /api/v5/reviews/stats/:entityId - Get review statistics for an entity
router.get('/stats/:entityId', ReviewController.getReviewStats);

// GET /api/v5/reviews/:id - Get single review
router.get('/:id', ReviewController.getReviewById);

// POST /api/v5/reviews/entity/:entityId - Create new review for entity
router.post('/entity/:entityId', ReviewController.createReview);

// PUT /api/v5/reviews/:id - Update review (moderation)
router.put('/:id', ReviewController.updateReview);

// DELETE /api/v5/reviews/:id - Delete review
router.delete('/:id', ReviewController.deleteReview);

module.exports = router;
