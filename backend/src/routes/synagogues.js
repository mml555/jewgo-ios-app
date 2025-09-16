const express = require('express');
const SynagogueController = require('../controllers/synagogueController');

const router = express.Router();

// GET /api/v5/synagogues - Get all synagogues
router.get('/', SynagogueController.getAllSynagogues);

// GET /api/v5/synagogues/search - Search synagogues
router.get('/search', SynagogueController.searchSynagogues);

// GET /api/v5/synagogues/nearby - Get nearby synagogues
router.get('/nearby', SynagogueController.getNearbySynagogues);

// GET /api/v5/synagogues/:id - Get single synagogue
router.get('/:id', SynagogueController.getSynagogueById);

module.exports = router;
