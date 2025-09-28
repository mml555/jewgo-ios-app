const express = require('express');
const ShtetlStoreController = require('../controllers/shtetlStoreController');

const router = express.Router();

// GET /api/v5/shtetl-stores - Get all stores
router.get('/', ShtetlStoreController.getAllStores);

// GET /api/v5/shtetl-stores/:id - Get single store
router.get('/:id', ShtetlStoreController.getStoreById);

// POST /api/v5/shtetl-stores - Create new store
router.post('/', ShtetlStoreController.createStore);

// PUT /api/v5/shtetl-stores/:id - Update store
router.put('/:id', ShtetlStoreController.updateStore);

// DELETE /api/v5/shtetl-stores/:id - Delete store
router.delete('/:id', ShtetlStoreController.deleteStore);

// GET /api/v5/shtetl-stores/:id/reviews - Get store reviews
router.get('/:id/reviews', ShtetlStoreController.getStoreReviews);

// POST /api/v5/shtetl-stores/:id/reviews - Add store review
router.post('/:id/reviews', ShtetlStoreController.addStoreReview);

module.exports = router;

