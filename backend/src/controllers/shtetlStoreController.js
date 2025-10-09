const pool = require('../database/connection');
const logger = require('../utils/logger');

class ShtetlStoreController {
  // Get all stores with filtering
  static async getAllStores(req, res) {
    try {
      const {
        city,
        state,
        storeType,
        kosherLevel,
        isVerified,
        hasDelivery,
        hasPickup,
        hasShipping,
        minRating,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = req.query;

      let query = `
        SELECT 
          s.*,
          u.first_name as owner_name,
          u.email as owner_email
        FROM shtetl_stores s
        LEFT JOIN users u ON s.owner_id = u.id
        WHERE s.is_active = true
      `;
      const params = [];
      let paramCount = 0;

      // Add filters
      if (city) {
        paramCount++;
        query += ` AND s.city ILIKE $${paramCount}`;
        params.push(`%${city}%`);
      }

      if (state) {
        paramCount++;
        query += ` AND s.state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }

      if (storeType) {
        paramCount++;
        query += ` AND s.store_type = $${paramCount}`;
        params.push(storeType);
      }

      if (kosherLevel) {
        paramCount++;
        query += ` AND s.kosher_level = $${paramCount}`;
        params.push(kosherLevel);
      }

      if (isVerified !== undefined) {
        paramCount++;
        query += ` AND s.is_verified = $${paramCount}`;
        params.push(isVerified === 'true');
      }

      if (hasDelivery !== undefined) {
        paramCount++;
        query += ` AND s.delivery_available = $${paramCount}`;
        params.push(hasDelivery === 'true');
      }

      if (hasPickup !== undefined) {
        paramCount++;
        query += ` AND s.pickup_available = $${paramCount}`;
        params.push(hasPickup === 'true');
      }

      if (hasShipping !== undefined) {
        paramCount++;
        query += ` AND s.shipping_available = $${paramCount}`;
        params.push(hasShipping === 'true');
      }

      if (minRating) {
        paramCount++;
        query += ` AND s.rating >= $${paramCount}`;
        params.push(parseFloat(minRating));
      }

      // Add ordering
      const validSortColumns = [
        'name',
        'rating',
        'created_at',
        'updated_at',
        'product_count',
      ];
      const sortColumn = validSortColumns.includes(sortBy)
        ? `s.${sortBy}`
        : 's.created_at';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortColumn} ${orderDirection}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset, 10));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          stores: result.rows,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            total: result.rowCount,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching shtetl stores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stores',
        message: error.message,
      });
    }
  }

  // Get single store by ID
  static async getStoreById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          s.*,
          u.first_name as owner_name,
          u.email as owner_email
        FROM shtetl_stores s
        LEFT JOIN users u ON s.owner_id = u.id
        WHERE s.id = $1 AND s.is_active = true
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Store not found',
        });
      }

      res.json({
        success: true,
        data: {
          store: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error fetching store:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch store',
        message: error.message,
      });
    }
  }

  // Create new store
  static async createStore(req, res) {
    try {
      const {
        name,
        description,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website,
        storeType,
        kosherLevel,
        deliveryAvailable,
        pickupAvailable,
        shippingAvailable,
      } = req.body;

      const ownerId = req.user?.id || req.guest?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const query = `
        INSERT INTO shtetl_stores (
          name, description, owner_id, address, city, state, zip_code,
          phone, email, website, store_type, kosher_level,
          delivery_available, pickup_available, shipping_available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const values = [
        name,
        description,
        ownerId,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        website,
        storeType,
        kosherLevel,
        deliveryAvailable,
        pickupAvailable,
        shippingAvailable,
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        data: {
          store: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error creating store:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create store',
        message: error.message,
      });
    }
  }

  // Update store
  static async updateStore(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const ownerId = req.user?.id || req.guest?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check if user owns the store
      const ownershipQuery = 'SELECT owner_id FROM shtetl_stores WHERE id = $1';
      const ownershipResult = await pool.query(ownershipQuery, [id]);

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Store not found',
        });
      }

      if (ownershipResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this store',
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updateData[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
      }

      paramCount++;
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const query = `
        UPDATE shtetl_stores 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      res.json({
        success: true,
        data: {
          store: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error updating store:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update store',
        message: error.message,
      });
    }
  }

  // Delete store
  static async deleteStore(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.user?.id || req.guest?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check if user owns the store
      const ownershipQuery = 'SELECT owner_id FROM shtetl_stores WHERE id = $1';
      const ownershipResult = await pool.query(ownershipQuery, [id]);

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Store not found',
        });
      }

      if (ownershipResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this store',
        });
      }

      // Soft delete by setting is_active to false
      const query = 'UPDATE shtetl_stores SET is_active = false WHERE id = $1';
      await pool.query(query, [id]);

      res.json({
        success: true,
        message: 'Store deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting store:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete store',
        message: error.message,
      });
    }
  }

  // Get store reviews
  static async getStoreReviews(req, res) {
    try {
      const { id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const query = `
        SELECT 
          r.*,
          u.first_name,
          u.last_name
        FROM shtetl_store_reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.store_id = $1 AND r.is_moderated = false
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await pool.query(query, [
        id,
        parseInt(limit, 10),
        parseInt(offset, 10),
      ]);

      res.json({
        success: true,
        data: {
          reviews: result.rows,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            total: result.rowCount,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching store reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch reviews',
        message: error.message,
      });
    }
  }

  // Add store review
  static async addStoreReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, title, content } = req.body;
      const userId = req.user?.id || req.guest?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check if user already reviewed this store
      const existingReviewQuery =
        'SELECT id FROM shtetl_store_reviews WHERE store_id = $1 AND user_id = $2';
      const existingReview = await pool.query(existingReviewQuery, [
        id,
        userId,
      ]);

      if (existingReview.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'You have already reviewed this store',
        });
      }

      const query = `
        INSERT INTO shtetl_store_reviews (store_id, user_id, rating, title, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const result = await pool.query(query, [
        id,
        userId,
        rating,
        title,
        content,
      ]);

      res.status(201).json({
        success: true,
        data: {
          review: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error adding store review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add review',
        message: error.message,
      });
    }
  }
}

module.exports = ShtetlStoreController;
