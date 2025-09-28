const express = require('express');
const FavoritesController = require('../controllers/favoritesController');

const router = express.Router();

// GET /api/v5/favorites - Get user's favorites
router.get('/', FavoritesController.getUserFavorites);

// POST /api/v5/favorites - Add entity to favorites
router.post('/', FavoritesController.addToFavorites);

// DELETE /api/v5/favorites/:entity_id - Remove entity from favorites
router.delete('/:entity_id', FavoritesController.removeFromFavorites);

// GET /api/v5/favorites/check/:entity_id - Check if entity is favorited
router.get('/check/:entity_id', FavoritesController.checkFavorite);

// POST /api/v5/favorites/toggle - Toggle favorite status
router.post('/toggle', FavoritesController.toggleFavorite);

module.exports = router;
