const Entity = require('../models/Entity');

class EntityController {
  // Get all entities with filtering
  static async getAllEntities(req, res) {
    try {
      const {
        entityType,
        city,
        state,
        kosherLevel,
        denomination,
        storeType,
        isVerified,
        minRating,
        hasKosherCertification,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const params = {
        entityType,
        city,
        state,
        kosherLevel,
        denomination,
        storeType,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        hasKosherCertification: hasKosherCertification === 'true',
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder: sortOrder.toUpperCase()
      };

      const result = await Entity.findAll(params);
      
      res.json({
        success: true,
        data: {
          entities: result.rows,
          pagination: {
            limit: params.limit,
            offset: params.offset,
            total: result.rowCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entities',
        message: error.message
      });
    }
  }

  // Get entities by type
  static async getEntitiesByType(req, res) {
    try {
      const { entityType } = req.params;
      const params = req.query;
      
      const result = await Entity.findByType(entityType, params);
      
      res.json({
        success: true,
        data: {
          entities: result.rows,
          entityType,
          pagination: {
            limit: parseInt(params.limit) || 50,
            offset: parseInt(params.offset) || 0,
            total: result.rowCount
          }
        }
      });
    } catch (error) {
      console.error('Error fetching entities by type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entities',
        message: error.message
      });
    }
  }

  // Get single entity by ID
  static async getEntityById(req, res) {
    try {
      const { id } = req.params;
      
      const entity = await Entity.findById(id);
      if (!entity) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found'
        });
      }

      // Get additional data
      const [businessHoursResult, imagesResult, reviewsResult] = await Promise.all([
        Entity.getBusinessHours(id),
        Entity.getImages(id),
        Entity.getReviews(id, { limit: 5 })
      ]);

      const entityData = {
        ...entity,
        business_hours: businessHoursResult.rows,
        images: imagesResult.rows,
        recent_reviews: reviewsResult.rows
      };

      res.json({
        success: true,
        data: { entity: entityData }
      });
    } catch (error) {
      console.error('Error fetching entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entity',
        message: error.message
      });
    }
  }

  // Search entities
  static async searchEntities(req, res) {
    try {
      const { q, ...params } = req.query;
      
      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      const result = await Entity.search(`%${q}%`, params);
      
      res.json({
        success: true,
        data: {
          entities: result.rows,
          query: q,
          pagination: {
            limit: parseInt(params.limit) || 50,
            offset: parseInt(params.offset) || 0,
            total: result.rowCount
          }
        }
      });
    } catch (error) {
      console.error('Error searching entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search entities',
        message: error.message
      });
    }
  }

  // Get nearby entities
  static async getNearbyEntities(req, res) {
    try {
      const { latitude, longitude, radius = 10, entityType } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      const result = await Entity.getNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        entityType
      );
      
      res.json({
        success: true,
        data: {
          entities: result.rows,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            radius: parseFloat(radius)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching nearby entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch nearby entities',
        message: error.message
      });
    }
  }

  // Create new entity
  static async createEntity(req, res) {
    try {
      const entityData = req.body;
      
      const entity = await Entity.create(entityData);
      
      res.status(201).json({
        success: true,
        data: { entity }
      });
    } catch (error) {
      console.error('Error creating entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create entity',
        message: error.message
      });
    }
  }

  // Update entity
  static async updateEntity(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const entity = await Entity.update(id, updateData);
      if (!entity) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found'
        });
      }

      res.json({
        success: true,
        data: { entity }
      });
    } catch (error) {
      console.error('Error updating entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update entity',
        message: error.message
      });
    }
  }

  // Delete entity (soft delete)
  static async deleteEntity(req, res) {
    try {
      const { id } = req.params;
      
      const entity = await Entity.delete(id);
      if (!entity) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found'
        });
      }

      res.json({
        success: true,
        message: 'Entity deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete entity',
        message: error.message
      });
    }
  }
}

module.exports = EntityController;
