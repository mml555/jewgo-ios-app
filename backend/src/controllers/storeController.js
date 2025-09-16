const { Pool } = require('pg');
const pool = require('../database/connection');

class StoreController {
  // Get all stores with filtering
  static async getAllStores(req, res) {
    try {
      const {
        city,
        state,
        kosherLevel,
        storeType,
        hasParking,
        hasDelivery,
        hasOnlineOrdering,
        isVerified,
        minRating,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      let query = 'SELECT * FROM stores WHERE is_active = true';
      const params = [];
      let paramCount = 0;

      // Add filters
      if (city) {
        paramCount++;
        query += ` AND city ILIKE $${paramCount}`;
        params.push(`%${city}%`);
      }
      
      if (state) {
        paramCount++;
        query += ` AND state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }
      
      if (kosherLevel) {
        paramCount++;
        query += ` AND kosher_level = $${paramCount}`;
        params.push(kosherLevel);
      }
      
      if (storeType) {
        paramCount++;
        query += ` AND store_type = $${paramCount}`;
        params.push(storeType);
      }
      
      if (hasParking !== undefined) {
        paramCount++;
        query += ` AND has_parking = $${paramCount}`;
        params.push(hasParking === 'true');
      }
      
      if (hasDelivery !== undefined) {
        paramCount++;
        query += ` AND has_delivery = $${paramCount}`;
        params.push(hasDelivery === 'true');
      }
      
      if (hasOnlineOrdering !== undefined) {
        paramCount++;
        query += ` AND has_online_ordering = $${paramCount}`;
        params.push(hasOnlineOrdering === 'true');
      }
      
      if (isVerified !== undefined) {
        paramCount++;
        query += ` AND is_verified = $${paramCount}`;
        params.push(isVerified === 'true');
      }
      
      if (minRating) {
        paramCount++;
        query += ` AND rating >= $${paramCount}`;
        params.push(parseFloat(minRating));
      }

      // Add ordering
      const validSortColumns = ['name', 'rating', 'created_at', 'updated_at'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortColumn} ${orderDirection}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await pool.query(query, params);
      
      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM stores WHERE is_active = true';
      const countParams = [];
      let countParamCount = 0;

      if (city) {
        countParamCount++;
        countQuery += ` AND city ILIKE $${countParamCount}`;
        countParams.push(`%${city}%`);
      }
      
      if (state) {
        countParamCount++;
        countQuery += ` AND state ILIKE $${countParamCount}`;
        countParams.push(`%${state}%`);
      }
      
      if (kosherLevel) {
        countParamCount++;
        countQuery += ` AND kosher_level = $${countParamCount}`;
        countParams.push(kosherLevel);
      }
      
      if (storeType) {
        countParamCount++;
        countQuery += ` AND store_type = $${countParamCount}`;
        countParams.push(storeType);
      }
      
      if (hasParking !== undefined) {
        countParamCount++;
        countQuery += ` AND has_parking = $${countParamCount}`;
        countParams.push(hasParking === 'true');
      }
      
      if (hasDelivery !== undefined) {
        countParamCount++;
        countQuery += ` AND has_delivery = $${countParamCount}`;
        countParams.push(hasDelivery === 'true');
      }
      
      if (hasOnlineOrdering !== undefined) {
        countParamCount++;
        countQuery += ` AND has_online_ordering = $${countParamCount}`;
        countParams.push(hasOnlineOrdering === 'true');
      }
      
      if (isVerified !== undefined) {
        countParamCount++;
        countQuery += ` AND is_verified = $${countParamCount}`;
        countParams.push(isVerified === 'true');
      }
      
      if (minRating) {
        countParamCount++;
        countQuery += ` AND rating >= $${countParamCount}`;
        countParams.push(parseFloat(minRating));
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      // Enhance entities with business hours, images, and reviews
      const enhancedEntities = await Promise.all(
        result.rows.map(async (entity) => {
          const entityId = entity.id;
          
          // Get business hours
          const hoursResult = await pool.query(`
            SELECT 
              day_of_week,
              open_time,
              close_time,
              is_closed
            FROM business_hours
            WHERE entity_id = $1
            ORDER BY 
              CASE day_of_week 
                WHEN 'sunday' THEN 0
                WHEN 'monday' THEN 1
                WHEN 'tuesday' THEN 2
                WHEN 'wednesday' THEN 3
                WHEN 'thursday' THEN 4
                WHEN 'friday' THEN 5
                WHEN 'saturday' THEN 6
              END
          `, [entityId]);
          
          // Get images
          const imagesResult = await pool.query(`
            SELECT 
              id,
              url,
              alt_text,
              is_primary,
              sort_order
            FROM images
            WHERE entity_id = $1
            ORDER BY is_primary DESC, sort_order ASC
          `, [entityId]);
          
          // Get recent reviews (limit to 5)
          const reviewsResult = await pool.query(`
            SELECT 
              r.id,
              r.rating,
              r.title,
              r.content,
              r.is_verified,
              r.created_at,
              u.first_name,
              u.last_name
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.entity_id = $1 AND r.is_moderated = true
            ORDER BY r.created_at DESC
            LIMIT 5
          `, [entityId]);
          
          return {
            ...entity,
            business_hours: hoursResult.rows,
            images: imagesResult.rows,
            recent_reviews: reviewsResult.rows
          };
        })
      );

      res.json({
        success: true,
        data: {
          entities: enhancedEntities,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: total,
            page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
            hasNext: parseInt(offset) + parseInt(limit) < total,
            hasPrev: parseInt(offset) > 0
          }
        }
      });
    } catch (error) {
      console.error('Error getting stores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stores',
        message: error.message
      });
    }
  }

  // Get store by ID
  static async getStoreById(req, res) {
    try {
      const { id } = req.params;
      
      const query = 'SELECT * FROM stores WHERE id = $1 AND is_active = true';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Store not found'
        });
      }
      
      const entity = result.rows[0];
      const entityId = entity.id;
      
      // Get business hours
      const hoursResult = await pool.query(`
        SELECT 
          day_of_week,
          open_time,
          close_time,
          is_closed
        FROM business_hours
        WHERE entity_id = $1
        ORDER BY 
          CASE day_of_week 
            WHEN 'sunday' THEN 0
            WHEN 'monday' THEN 1
            WHEN 'tuesday' THEN 2
            WHEN 'wednesday' THEN 3
            WHEN 'thursday' THEN 4
            WHEN 'friday' THEN 5
            WHEN 'saturday' THEN 6
          END
      `, [entityId]);
      
      // Get images
      const imagesResult = await pool.query(`
        SELECT 
          id,
          url,
          alt_text,
          is_primary,
          sort_order
        FROM images
        WHERE entity_id = $1
        ORDER BY is_primary DESC, sort_order ASC
      `, [entityId]);
      
      // Get recent reviews (limit to 5)
      const reviewsResult = await pool.query(`
        SELECT 
          r.id,
          r.rating,
          r.title,
          r.content,
          r.is_verified,
          r.created_at,
          u.first_name,
          u.last_name
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.entity_id = $1 AND r.is_moderated = true
        ORDER BY r.created_at DESC
        LIMIT 5
      `, [entityId]);
      
      const enhancedEntity = {
        ...entity,
        business_hours: hoursResult.rows,
        images: imagesResult.rows,
        recent_reviews: reviewsResult.rows
      };
      
      res.json({
        success: true,
        data: {
          entity: enhancedEntity
        }
      });
    } catch (error) {
      console.error('Error getting store by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get store',
        message: error.message
      });
    }
  }

  // Search stores
  static async searchStores(req, res) {
    try {
      const {
        q: query,
        city,
        state,
        storeType,
        limit = 50,
        offset = 0
      } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
      }

      let searchQuery = `
        SELECT * FROM stores 
        WHERE is_active = true 
        AND (
          name ILIKE $1 
          OR description ILIKE $1 
          OR address ILIKE $1 
          OR city ILIKE $1 
          OR state ILIKE $1
          OR store_type ILIKE $1
        )
      `;
      
      const params = [`%${query}%`];
      let paramCount = 1;

      if (city) {
        paramCount++;
        searchQuery += ` AND city ILIKE $${paramCount}`;
        params.push(`%${city}%`);
      }
      
      if (state) {
        paramCount++;
        searchQuery += ` AND state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }
      
      if (storeType) {
        paramCount++;
        searchQuery += ` AND store_type = $${paramCount}`;
        params.push(storeType);
      }

      searchQuery += ` ORDER BY name ASC`;
      
      paramCount++;
      searchQuery += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      
      paramCount++;
      searchQuery += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await pool.query(searchQuery, params);
      
      res.json({
        success: true,
        data: {
          entities: result.rows,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: result.rows.length
          }
        }
      });
    } catch (error) {
      console.error('Error searching stores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search stores',
        message: error.message
      });
    }
  }

  // Get nearby stores
  static async getNearbyStores(req, res) {
    try {
      const {
        latitude,
        longitude,
        radius = 10,
        limit = 50
      } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);

      // Using Haversine formula for distance calculation
      const query = `
        SELECT *,
          (6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(latitude))
          )) AS distance
        FROM stores 
        WHERE is_active = true
        HAVING distance <= $3
        ORDER BY distance ASC
        LIMIT $4
      `;

      const result = await pool.query(query, [lat, lng, radiusKm, parseInt(limit)]);
      
      res.json({
        success: true,
        data: {
          entities: result.rows
        }
      });
    } catch (error) {
      console.error('Error getting nearby stores:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nearby stores',
        message: error.message
      });
    }
  }
}

module.exports = StoreController;
