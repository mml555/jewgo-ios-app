// Import the shared database connection
const logger = require('../utils/logger');
let pool = null;

// Initialize pool if not already done
function getPool() {
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5433,
      database: process.env.DB_NAME || 'jewgo_dev',
      user: process.env.DB_USER || 'jewgo_user',
      password: process.env.DB_PASSWORD || 'jewgo_password',
      ssl:
        process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

class FavoritesController {
  // GET /api/v5/favorites - Get user's favorites
  static async getUserFavorites(req, res) {
    try {
      const userId = req.user?.type === 'guest' ? null : req.user?.id;
      const guestSessionId =
        req.user?.type === 'guest' ? req.user.sessionId : req.guestSession?.id;
      const { limit = 50, offset = 0 } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      logger.info(`📋 Getting favorites for user: ${userId || 'guest'}`);

      if (!userId && !guestSessionId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access favorites',
        });
      }

      // For now, only authenticated users can have favorites
      // Guest favorites could be implemented later with local storage
      if (!userId) {
        return res.status(200).json({
          success: true,
          data: {
            favorites: [],
            total: 0,
            limit: limitNum,
            offset: offsetNum,
          },
        });
      }

      const favoritesQuery = `
        SELECT 
          f.*,
          e.name as entity_name,
          e.entity_type,
          e.description,
          e.address,
          e.city,
          e.state,
          e.rating,
          e.review_count,
          e.is_active,
          (
            SELECT url 
            FROM images img 
            WHERE img.entity_id = e.id 
            AND img.is_primary = true 
            LIMIT 1
          ) as primary_image_url
        FROM favorites f
        JOIN entities e ON f.entity_id = e.id
        WHERE f.user_id = $1
        ORDER BY f.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM favorites f
        WHERE f.user_id = $1
      `;

      const [favoritesResult, countResult] = await Promise.all([
        getPool().query(favoritesQuery, [userId, limitNum, offsetNum]),
        getPool().query(countQuery, [userId]),
      ]);

      const favorites = favoritesResult.rows.map(favorite => ({
        id: favorite.id,
        entity_id: favorite.entity_id,
        entity_name: favorite.entity_name,
        entity_type: favorite.entity_type,
        description: favorite.description,
        address: favorite.address,
        city: favorite.city,
        state: favorite.state,
        rating: favorite.rating,
        review_count: favorite.review_count,
        is_active: favorite.is_active,
        image_url: favorite.primary_image_url,
        favorited_at: favorite.created_at.toISOString(),
        // Additional computed fields
        category: favorite.entity_type,
        distance: null, // Would need user location to calculate
        phone: null, // Would need to join with entity details if needed
      }));

      res.json({
        success: true,
        data: {
          favorites: favorites,
          total: parseInt(countResult.rows[0].total, 10),
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      logger.error('Error getting user favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // POST /api/v5/favorites - Add entity to favorites
  static async addToFavorites(req, res) {
    const client = await getPool().connect();
    try {
      const { entity_id } = req.body;
      const userId = req.user?.type === 'guest' ? null : req.user?.id;
      const guestSessionId =
        req.user?.type === 'guest' ? req.user.sessionId : req.guestSession?.id;

      logger.info(
        `💖 Adding to favorites: entity ${entity_id} for user ${
          userId || 'guest'
        }`,
      );

      if (!userId && !guestSessionId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to add favorites',
        });
      }

      // For now, only authenticated users can have favorites
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Guest favorites not supported',
          message: 'Please create an account to save favorites',
        });
      }

      if (!entity_id) {
        return res.status(400).json({
          success: false,
          error: 'Entity ID required',
          message: 'entity_id is required in request body',
        });
      }

      await client.query('BEGIN');

      // Check if entity exists and is active
      const entityCheck = await client.query(
        `
        SELECT id, name, entity_type, is_active
        FROM entities
        WHERE id = $1
      `,
        [entity_id],
      );

      if (entityCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Entity not found',
          message: `Entity with ID ${entity_id} not found`,
        });
      }

      const entity = entityCheck.rows[0];

      if (!entity.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Entity not available',
          message: 'This entity is no longer active',
        });
      }

      // Check if already favorited
      const existingFavorite = await client.query(
        `
        SELECT id FROM favorites
        WHERE user_id = $1 AND entity_id = $2
      `,
        [userId, entity_id],
      );

      if (existingFavorite.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Already favorited',
          message: 'This entity is already in your favorites',
        });
      }

      // Add to favorites
      const favoriteResult = await client.query(
        `
        INSERT INTO favorites (user_id, entity_id)
        VALUES ($1, $2)
        RETURNING id, created_at
      `,
        [userId, entity_id],
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        data: {
          message: 'Added to favorites successfully!',
          favorite: {
            id: favoriteResult.rows[0].id,
            entity_id: entity_id,
            entity_name: entity.name,
            entity_type: entity.entity_type,
            favorited_at: favoriteResult.rows[0].created_at.toISOString(),
          },
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error adding to favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    } finally {
      client.release();
    }
  }

  // DELETE /api/v5/favorites/:entity_id - Remove entity from favorites
  static async removeFromFavorites(req, res) {
    try {
      const { entity_id } = req.params;
      const userId = req.user?.type === 'guest' ? null : req.user?.id;
      const guestSessionId =
        req.user?.type === 'guest' ? req.user.sessionId : req.guestSession?.id;

      logger.info(
        `💔 Removing from favorites: entity ${entity_id} for user ${
          userId || 'guest'
        }`,
      );

      if (!userId && !guestSessionId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to manage favorites',
        });
      }

      // For now, only authenticated users can have favorites
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Guest favorites not supported',
          message: 'Please create an account to manage favorites',
        });
      }

      const result = await getPool().query(
        `
        DELETE FROM favorites
        WHERE user_id = $1 AND entity_id = $2
        RETURNING id
      `,
        [userId, entity_id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Favorite not found',
          message: 'This entity is not in your favorites',
        });
      }

      res.json({
        success: true,
        data: {
          message: 'Removed from favorites successfully!',
          entity_id: entity_id,
        },
      });
    } catch (error) {
      logger.error('Error removing from favorites:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // GET /api/v5/favorites/check/:entity_id - Check if entity is favorited
  static async checkFavorite(req, res) {
    try {
      const { entity_id } = req.params;
      const userId = req.user?.type === 'guest' ? null : req.user?.id;
      const guestSessionId =
        req.user?.type === 'guest' ? req.user.sessionId : req.guestSession?.id;

      logger.info(
        `🔍 Checking favorite status: entity ${entity_id} for user ${
          userId || 'guest'
        }`,
      );

      if (!userId && !guestSessionId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to check favorites',
        });
      }

      // For now, only authenticated users can have favorites
      if (!userId) {
        return res.json({
          success: true,
          data: {
            is_favorited: false,
            entity_id: entity_id,
          },
        });
      }

      const result = await getPool().query(
        `
        SELECT id, created_at
        FROM favorites
        WHERE user_id = $1 AND entity_id = $2
      `,
        [userId, entity_id],
      );

      const isFavorited = result.rows.length > 0;

      res.json({
        success: true,
        data: {
          is_favorited: isFavorited,
          entity_id: entity_id,
          favorited_at: isFavorited
            ? result.rows[0].created_at.toISOString()
            : null,
        },
      });
    } catch (error) {
      logger.error('Error checking favorite status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // POST /api/v5/favorites/toggle - Toggle favorite status
  static async toggleFavorite(req, res) {
    try {
      const { entity_id } = req.body;
      const userId = req.user?.type === 'guest' ? null : req.user?.id;
      const guestSessionId =
        req.user?.type === 'guest' ? req.user.sessionId : req.guestSession?.id;

      logger.info(
        `🔄 Toggling favorite: entity ${entity_id} for user ${
          userId || 'guest'
        }`,
      );

      if (!userId && !guestSessionId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to toggle favorites',
        });
      }

      // For now, only authenticated users can have favorites
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'Guest favorites not supported',
          message: 'Please create an account to manage favorites',
        });
      }

      if (!entity_id) {
        return res.status(400).json({
          success: false,
          error: 'Entity ID required',
          message: 'entity_id is required in request body',
        });
      }

      // Check current status
      const currentStatus = await getPool().query(
        `
        SELECT id FROM favorites
        WHERE user_id = $1 AND entity_id = $2
      `,
        [userId, entity_id],
      );

      const isCurrentlyFavorited = currentStatus.rows.length > 0;

      if (isCurrentlyFavorited) {
        // Remove from favorites
        await getPool().query(
          `
          DELETE FROM favorites
          WHERE user_id = $1 AND entity_id = $2
        `,
          [userId, entity_id],
        );

        res.json({
          success: true,
          data: {
            message: 'Removed from favorites',
            is_favorited: false,
            entity_id: entity_id,
          },
        });
      } else {
        // Add to favorites (reuse the add logic)
        const entityCheck = await getPool().query(
          `
          SELECT id, name, entity_type, is_active
          FROM entities
          WHERE id = $1
        `,
          [entity_id],
        );

        if (entityCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Entity not found',
            message: `Entity with ID ${entity_id} not found`,
          });
        }

        const entity = entityCheck.rows[0];

        if (!entity.is_active) {
          return res.status(400).json({
            success: false,
            error: 'Entity not available',
            message: 'This entity is no longer active',
          });
        }

        const favoriteResult = await getPool().query(
          `
          INSERT INTO favorites (user_id, entity_id)
          VALUES ($1, $2)
          RETURNING id, created_at
        `,
          [userId, entity_id],
        );

        res.json({
          success: true,
          data: {
            message: 'Added to favorites',
            is_favorited: true,
            entity_id: entity_id,
            favorite_id: favoriteResult.rows[0].id,
            favorited_at: favoriteResult.rows[0].created_at.toISOString(),
          },
        });
      }
    } catch (error) {
      logger.error('Error toggling favorite:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

module.exports = FavoritesController;
