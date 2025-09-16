const express = require('express');
const RestaurantController = require('../controllers/restaurantController');

const router = express.Router();

// GET /api/v5/restaurants - Get all restaurants
router.get('/', RestaurantController.getAllRestaurants);

// GET /api/v5/restaurants/search - Search restaurants
router.get('/search', RestaurantController.searchRestaurants);

// GET /api/v5/restaurants/nearby - Get nearby restaurants
router.get('/nearby', RestaurantController.getNearbyRestaurants);

// GET /api/v5/restaurants/:id - Get single restaurant
router.get('/:id', RestaurantController.getRestaurantById);

module.exports = router;
