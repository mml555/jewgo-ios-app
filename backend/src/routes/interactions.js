const express = require('express');
const InteractionController = require('../controllers/interactionController');

const router = express.Router();

// POST /api/v5/interactions - Track user interaction (view, like, share)
router.post('/', InteractionController.trackInteraction);

// GET /api/v5/interactions/:entityId/user - Get user's interactions for an entity
router.get('/:entityId/user', InteractionController.getUserInteractions);

// GET /api/v5/interactions/:entityId/counts - Get interaction counts for an entity
router.get('/:entityId/counts', InteractionController.getInteractionCounts);

module.exports = router;
