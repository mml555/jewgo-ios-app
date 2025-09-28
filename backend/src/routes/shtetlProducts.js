const express = require('express');
const ShtetlProductController = require('../controllers/shtetlProductController');

const router = express.Router();

// GET /api/v5/shtetl-products/search - Search products across all stores
router.get('/search', ShtetlProductController.searchProducts);

// GET /api/v5/shtetl-products/:id - Get single product
router.get('/:id', ShtetlProductController.getProductById);

// GET /api/v5/shtetl-stores/:storeId/products - Get products for a specific store
router.get('/stores/:storeId/products', ShtetlProductController.getStoreProducts);

// POST /api/v5/shtetl-stores/:storeId/products - Create new product
router.post('/stores/:storeId/products', ShtetlProductController.createProduct);

// PUT /api/v5/shtetl-products/:id - Update product
router.put('/:id', ShtetlProductController.updateProduct);

// DELETE /api/v5/shtetl-products/:id - Delete product
router.delete('/:id', ShtetlProductController.deleteProduct);

module.exports = router;

