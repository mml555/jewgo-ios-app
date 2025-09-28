const express = require('express');
const MikvahController = require('../controllers/mikvahController');

const router = express.Router();

// GET /api/v5/mikvahs - Get all mikvahs
router.get('/', MikvahController.getAllMikvahs);

// GET /api/v5/mikvahs/search - Search mikvahs
router.get('/search', MikvahController.searchMikvahs);

// GET /api/v5/mikvahs/nearby - Get nearby mikvahs
router.get('/nearby', MikvahController.getNearbyMikvahs);

// POST /api/v5/mikvahs - Create new mikvah
router.post('/', MikvahController.createMikvah);

// GET /api/v5/mikvahs/:id - Get single mikvah
router.get('/:id', MikvahController.getMikvahById);

// PUT /api/v5/mikvahs/:id - Update mikvah
router.put('/:id', MikvahController.updateMikvah);

// DELETE /api/v5/mikvahs/:id - Delete mikvah
router.delete('/:id', MikvahController.deleteMikvah);

module.exports = router;
