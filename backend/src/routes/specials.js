const express = require('express');
const SpecialsController = require('../controllers/specialsController');

const router = express.Router();

// GET /api/v5/specials - Get all specials
router.get('/', SpecialsController.getAllSpecials);

// GET /api/v5/specials/active - Get active specials (must be before /:id route)
router.get('/active', SpecialsController.getActiveSpecials);

// GET /api/v5/specials/search - Search specials (must be before /:id route)
router.get('/search', SpecialsController.searchSpecials);

// GET /api/v5/specials/:id - Get a specific special
router.get('/:id', SpecialsController.getSpecialById);

// POST /api/v5/specials - Create a new special
router.post('/', SpecialsController.createSpecial);

// PUT /api/v5/specials/:id - Update a special
router.put('/:id', SpecialsController.updateSpecial);

// DELETE /api/v5/specials/:id - Delete a special
router.delete('/:id', SpecialsController.deleteSpecial);

// POST /api/v5/specials/:id/claim - Claim a special offer
router.post('/:id/claim', SpecialsController.claimSpecial);

module.exports = router;
