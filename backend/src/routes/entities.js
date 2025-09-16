const express = require('express');
const EntityController = require('../controllers/entityController');

const router = express.Router();

// GET /api/v5/entities - Get all entities with filtering
router.get('/', EntityController.getAllEntities);

// GET /api/v5/entities/search - Search entities
router.get('/search', EntityController.searchEntities);

// GET /api/v5/entities/nearby - Get nearby entities
router.get('/nearby', EntityController.getNearbyEntities);

// GET /api/v5/entities/:id - Get single entity
router.get('/:id', EntityController.getEntityById);

// POST /api/v5/entities - Create new entity
router.post('/', EntityController.createEntity);

// PUT /api/v5/entities/:id - Update entity
router.put('/:id', EntityController.updateEntity);

// DELETE /api/v5/entities/:id - Delete entity
router.delete('/:id', EntityController.deleteEntity);

module.exports = router;
