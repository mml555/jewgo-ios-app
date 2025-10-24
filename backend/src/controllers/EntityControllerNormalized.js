const pool = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Normalized Entity Controller
 * Uses proper JOINs with the new normalized database structure
 */
class EntityControllerNormalized {
  // Get all entities with proper JOINs
  static async getAllEntities(req, res) {
    try {
      const {
        entityType,
        city,
        state,
        minRating,
        isVerified,
        kosherLevel, // NEW: dietary type filter
        kosherCertification, // NEW: hechsher filter
        priceMin, // NEW: minimum price filter
        priceMax, // NEW: maximum price filter
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = req.query;

      let query = `
        SELECT 
          e.id,
          e.entity_type,
          e.name,
          e.description,
          e.long_description,
          e.address,
          e.city,
          e.state,
          e.zip_code,
          e.phone,
          e.email,
          e.website,
          e.latitude,
          e.longitude,
          e.rating,
          e.review_count,
          e.is_verified,
          e.is_active,
          ef.kosher_type,
          ef.hechsher,
          ef.price_min,
          ef.price_max,
          ef.price_range,
          e.created_at,
          e.updated_at,
          u.first_name as owner_first_name,
          u.last_name as owner_last_name
        FROM entities e
        LEFT JOIN eatery_fields ef ON e.id = ef.entity_id
        LEFT JOIN users u ON e.owner_id = u.id
        WHERE e.is_active = true
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (entityType) {
        paramCount++;
        query += ` AND e.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      if (city) {
        paramCount++;
        query += ` AND e.city ILIKE $${paramCount}`;
        params.push(`%${city}%`);
      }

      if (state) {
        paramCount++;
        query += ` AND e.state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }

      if (minRating) {
        paramCount++;
        query += ` AND e.rating >= $${paramCount}`;
        params.push(parseFloat(minRating));
      }

      if (isVerified !== undefined) {
        paramCount++;
        query += ` AND e.is_verified = $${paramCount}`;
        params.push(isVerified === 'true');
      }

      // NEW: Dietary type filter (kosher_type now contains meat/dairy/parve)
      if (kosherLevel) {
        paramCount++;
        query += ` AND ef.kosher_type = $${paramCount}`;
        params.push(kosherLevel);
      }

      // NEW: Hechsher certification filter
      if (kosherCertification) {
        paramCount++;
        query += ` AND ef.hechsher = $${paramCount}`;
        params.push(kosherCertification);
      }

      // NEW: Price range filters
      if (priceMin !== undefined) {
        paramCount++;
        query += ` AND ef.price_min >= $${paramCount}`;
        params.push(parseFloat(priceMin));
      }

      if (priceMax !== undefined) {
        paramCount++;
        query += ` AND ef.price_max <= $${paramCount}`;
        params.push(parseFloat(priceMax));
      }

      // Add sorting and pagination
      query += ` ORDER BY e.${sortBy} ${sortOrder}`;
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset, 10));

      const result = await pool.query(query, params);

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) FROM entities WHERE is_active = true';
      const countParams = [];
      let countParamCount = 0;

      if (entityType) {
        countParamCount++;
        countQuery += ` AND entity_type = $${countParamCount}`;
        countParams.push(entityType);
      }

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

      if (minRating) {
        countParamCount++;
        countQuery += ` AND rating >= $${countParamCount}`;
        countParams.push(parseFloat(minRating));
      }

      if (isVerified !== undefined) {
        countParamCount++;
        countQuery += ` AND is_verified = $${countParamCount}`;
        countParams.push(isVerified === 'true');
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count, 10);

      // Enhance entities with specialized data
      const enhancedEntities = await Promise.all(
        result.rows.map(async entity => {
          const specializedData = await this.getSpecializedData(
            entity.id,
            entity.entity_type,
          );
          return {
            ...entity,
            ...specializedData,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          entities: enhancedEntities,
          pagination: {
            total,
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            hasMore: parseInt(offset, 10) + parseInt(limit, 10) < total,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entities',
        message: error.message,
      });
    }
  }

  // Get entities by type with specialized data
  static async getEntitiesByType(req, res) {
    try {
      const { entityType } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      await this.getAllEntities(
        {
          ...req,
          query: { ...req.query, entityType, limit, offset },
        },
        res,
      );
    } catch (error) {
      logger.error('Error fetching entities by type:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entities by type',
        message: error.message,
      });
    }
  }

  // Get single entity by ID with all related data
  static async getEntityById(req, res) {
    try {
      const { id } = req.params;

      // Validate UUID format
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        logger.warn('Invalid UUID format:', id);
        return res.status(404).json({
          success: false,
          error: 'Entity not found',
        });
      }

      // Use the helper function to get entity with all related data
      const result = await pool.query(
        'SELECT * FROM get_entity_with_details($1)',
        [id],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found',
        });
      }

      const entity = result.rows[0];

      // Get additional data (business hours, images, reviews)
      const [businessHoursResult, imagesResult, reviewsResult] =
        await Promise.all([
          this.getBusinessHours(id),
          this.getImages(id),
          this.getReviews(id, { limit: 5 }),
        ]);

      const entityData = {
        ...entity,
        business_hours: businessHoursResult.rows,
        images: imagesResult.rows,
        recent_reviews: reviewsResult.rows,
      };

      res.json({
        success: true,
        data: { entity: entityData },
      });
    } catch (error) {
      logger.error('Error fetching entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch entity',
        message: error.message,
      });
    }
  }

  // Get specialized data for an entity
  static async getSpecializedData(entityId, entityType) {
    try {
      let specializedQuery = '';
      let params = [entityId];

      switch (entityType) {
        case 'mikvah':
          specializedQuery = 'SELECT * FROM mikvah_fields WHERE entity_id = $1';
          break;
        case 'synagogue':
          specializedQuery =
            'SELECT * FROM synagogue_fields WHERE entity_id = $1';
          break;
        case 'restaurant':
          specializedQuery = `
            SELECT 
              ef.price_min,
              ef.price_max,
              ef.price_range,
              ef.kosher_type,
              ef.hechsher,
              ef.kosher_tags,
              ef.amenities
            FROM eatery_fields ef
            WHERE ef.entity_id = $1
          `;
          break;
        case 'store':
          specializedQuery = 'SELECT * FROM store_fields WHERE entity_id = $1';
          break;
        case 'event':
          specializedQuery = 'SELECT * FROM event_fields WHERE entity_id = $1';
          break;
        case 'job':
          specializedQuery = 'SELECT * FROM job_fields WHERE entity_id = $1';
          break;
        default:
          return {};
      }

      const result = await pool.query(specializedQuery, params);
      return result.rows[0] || {};
    } catch (error) {
      logger.error('Error fetching specialized data:', error);
      return {};
    }
  }

  // Get business hours for an entity
  static async getBusinessHours(entityId) {
    const query = `
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
    `;
    return await pool.query(query, [entityId]);
  }

  // Get images for an entity
  static async getImages(entityId) {
    const query = `
      SELECT 
        id,
        url,
        alt_text,
        is_primary,
        sort_order
      FROM images
      WHERE entity_id = $1
      ORDER BY is_primary DESC, sort_order ASC
    `;
    return await pool.query(query, [entityId]);
  }

  // Get reviews for an entity
  static async getReviews(entityId, options = {}) {
    const { limit = 10, offset = 0 } = options;
    const query = `
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
      LIMIT $2 OFFSET $3
    `;
    return await pool.query(query, [entityId, limit, offset]);
  }

  // Search entities with specialized data
  static async searchEntities(req, res) {
    try {
      const { q: searchQuery, entityType, limit = 20, offset = 0 } = req.query;

      if (!searchQuery) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      let query = `
        SELECT 
          e.id,
          e.entity_type,
          e.name,
          e.description,
          e.address,
          e.city,
          e.state,
          e.zip_code,
          e.latitude,
          e.longitude,
          e.rating,
          e.review_count,
          e.is_verified,
          e.is_active
        FROM entities e
        WHERE e.is_active = true 
        AND (
          e.name ILIKE $1 
          OR e.description ILIKE $1 
          OR e.address ILIKE $1 
          OR e.city ILIKE $1 
          OR e.state ILIKE $1
        )
      `;

      const params = [`%${searchQuery}%`];
      let paramCount = 1;

      if (entityType) {
        paramCount++;
        query += ` AND e.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      query += ' ORDER BY e.rating DESC, e.review_count DESC';
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset, 10));

      const result = await pool.query(query, params);

      // Enhance with specialized data
      const enhancedEntities = await Promise.all(
        result.rows.map(async entity => {
          const specializedData = await this.getSpecializedData(
            entity.id,
            entity.entity_type,
          );
          return {
            ...entity,
            ...specializedData,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          entities: enhancedEntities,
          searchQuery,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
          },
        },
      });
    } catch (error) {
      logger.error('Error searching entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search entities',
        message: error.message,
      });
    }
  }

  // Get nearby entities with distance calculation
  static async getNearbyEntities(req, res) {
    try {
      const {
        latitude,
        longitude,
        radius = 10, // in miles
        entityType,
        limit = 20,
      } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required',
        });
      }

      let query = `
        SELECT 
          e.id,
          e.entity_type,
          e.name,
          e.description,
          e.address,
          e.city,
          e.state,
          e.zip_code,
          e.latitude,
          e.longitude,
          e.rating,
          e.review_count,
          e.is_verified,
          -- Calculate distance using Haversine formula
          (3959 * acos(
            cos(radians($1)) * cos(radians(e.latitude)) * 
            cos(radians(e.longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(e.latitude))
          )) as distance_miles
        FROM entities e
        WHERE e.is_active = true 
        AND e.latitude IS NOT NULL 
        AND e.longitude IS NOT NULL
        AND (3959 * acos(
          cos(radians($1)) * cos(radians(e.latitude)) * 
          cos(radians(e.longitude) - radians($2)) + 
          sin(radians($1)) * sin(radians(e.latitude))
        )) <= $3
      `;

      const params = [
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
      ];
      let paramCount = 3;

      if (entityType) {
        paramCount++;
        query += ` AND e.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      query += ' ORDER BY distance_miles ASC';
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      const result = await pool.query(query, params);

      // Enhance with specialized data
      const enhancedEntities = await Promise.all(
        result.rows.map(async entity => {
          const specializedData = await this.getSpecializedData(
            entity.id,
            entity.entity_type,
          );
          return {
            ...entity,
            ...specializedData,
          };
        }),
      );

      res.json({
        success: true,
        data: {
          entities: enhancedEntities,
          location: {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
          },
          radius: parseFloat(radius),
          pagination: {
            limit: parseInt(limit, 10),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching nearby entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch nearby entities',
        message: error.message,
      });
    }
  }

  // Create entity
  static async createEntity(req, res) {
    try {
      const {
        entityType,
        name,
        description,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        phone,
        email,
        website,
      } = req.body;

      // Validate required fields
      if (!entityType || !name || !address || !city || !state || !zip_code) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          required: [
            'entityType',
            'name',
            'address',
            'city',
            'state',
            'zip_code',
          ],
        });
      }

      const query = `
        INSERT INTO entities (
          entity_type, name, description, address, city, state, zip_code,
          latitude, longitude, phone, email, website
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        entityType,
        name,
        description,
        address,
        city,
        state,
        zip_code,
        latitude,
        longitude,
        phone,
        email,
        website,
      ];

      const result = await pool.query(query, values);
      const entity = result.rows[0];

      res.status(201).json({
        success: true,
        data: entity,
      });
    } catch (error) {
      logger.error('Error creating entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create entity',
        message: error.message,
      });
    }
  }

  // Update entity
  static async updateEntity(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'id' && key !== 'created_at') {
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
        });
      }

      values.push(id);
      const query = `
        UPDATE entities 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount} AND is_active = true
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found',
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error updating entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update entity',
        message: error.message,
      });
    }
  }

  // Delete entity (soft delete)
  static async deleteEntity(req, res) {
    try {
      const { id } = req.params;

      const query = `
        UPDATE entities 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found',
        });
      }

      res.json({
        success: true,
        message: 'Entity deleted successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error deleting entity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete entity',
        message: error.message,
      });
    }
  }
}

module.exports = EntityControllerNormalized;
