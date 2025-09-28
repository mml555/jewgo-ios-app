const express = require('express');
const SynagogueController = require('../controllers/synagogueController');

const router = express.Router();

// GET /api/v5/synagogues - Get all synagogues
router.get('/', SynagogueController.getAllSynagogues);

// GET /api/v5/synagogues/search - Search synagogues
router.get('/search', SynagogueController.searchSynagogues);

// GET /api/v5/synagogues/nearby - Get nearby synagogues
router.get('/nearby', SynagogueController.getNearbySynagogues);

// POST /api/v5/synagogues - Create new synagogue
router.post('/', SynagogueController.createSynagogue);

// GET /api/v5/synagogues/:id - Get single synagogue
router.get('/:id', SynagogueController.getSynagogueById);

// PUT /api/v5/synagogues/:id - Update synagogue
router.put('/:id', SynagogueController.updateSynagogue);

// DELETE /api/v5/synagogues/:id - Delete synagogue
router.delete('/:id', SynagogueController.deleteSynagogue);

module.exports = router;
