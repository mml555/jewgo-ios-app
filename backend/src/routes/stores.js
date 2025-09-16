const express = require('express');
const StoreController = require('../controllers/storeController');

const router = express.Router();

// GET /api/v5/stores - Get all stores
router.get('/', StoreController.getAllStores);

// GET /api/v5/stores/search - Search stores
router.get('/search', StoreController.searchStores);

// GET /api/v5/stores/nearby - Get nearby stores
router.get('/nearby', StoreController.getNearbyStores);

// GET /api/v5/stores/:id - Get single store
router.get('/:id', StoreController.getStoreById);

module.exports = router;
