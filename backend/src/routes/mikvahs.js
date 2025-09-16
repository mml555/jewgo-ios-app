const express = require('express');
const MikvahController = require('../controllers/mikvahController');

const router = express.Router();

// GET /api/v5/mikvahs - Get all mikvahs
router.get('/', MikvahController.getAllMikvahs);

// GET /api/v5/mikvahs/search - Search mikvahs
router.get('/search', MikvahController.searchMikvahs);

// GET /api/v5/mikvahs/nearby - Get nearby mikvahs
router.get('/nearby', MikvahController.getNearbyMikvahs);

// GET /api/v5/mikvahs/:id - Get single mikvah
router.get('/:id', MikvahController.getMikvahById);

module.exports = router;
