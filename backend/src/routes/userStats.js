const express = require('express');
const UserStatsController = require('../controllers/userStatsController');

const router = express.Router();

// GET /api/v5/users/stats - Get user's overall statistics
router.get('/stats', UserStatsController.getUserStats);

// GET /api/v5/users/listings - Get user's listings with engagement metrics
router.get('/listings', UserStatsController.getUserListings);

module.exports = router;

