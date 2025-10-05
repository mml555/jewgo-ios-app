const express = require('express');
const router = express.Router();
const NearbyEntitiesController = require('../controllers/NearbyEntitiesController');

/**
 * Nearby Entities Routes
 * Server-side distance computation with proper API contract
 */

// GET /api/v1/entities/nearby - Get nearby entities with distance computation
router.get('/entities/nearby', NearbyEntitiesController.getNearbyEntities);

// GET /api/v1/diag/nearby-sample - Health check and performance testing
router.get('/diag/nearby-sample', NearbyEntitiesController.healthCheck);

module.exports = router;
