const { Pool } = require('pg');
const pool = require('../database/connection');

class SynagogueController {
  // Get all synagogues with filtering
  static async getAllSynagogues(req, res) {
    try {
      const {
        city,
        state,
        denomination,
        hasParking,
        hasAccessibility,
        hasWifi,
        isVerified,
        minRating,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      let query = 'SELECT * FROM synagogues WHERE is_active = true';
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
      
      if (denomination) {
        paramCount++;
        query += ` AND denomination = $${paramCount}`;
        params.push(denomination);
      }
      
      if (hasParking !== undefined) {
        paramCount++;
        query += ` AND has_parking = $${paramCount}`;
        params.push(hasParking === 'true');
      }
      
      if (hasAccessibility !== undefined) {
        paramCount++;
        query += ` AND has_accessibility = $${paramCount}`;
        params.push(hasAccessibility === 'true');
      }
      
      if (hasWifi !== undefined) {
        paramCount++;
        query += ` AND has_wifi = $${paramCount}`;
        params.push(hasWifi === 'true');
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
      let countQuery = 'SELECT COUNT(*) FROM synagogues WHERE is_active = true';
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
      
      if (denomination) {
        countParamCount++;
        countQuery += ` AND denomination = $${countParamCount}`;
        countParams.push(denomination);
      }
      
      if (hasParking !== undefined) {
        countParamCount++;
        countQuery += ` AND has_parking = $${countParamCount}`;
        countParams.push(hasParking === 'true');
      }
      
      if (hasAccessibility !== undefined) {
        countParamCount++;
        countQuery += ` AND has_accessibility = $${countParamCount}`;
        countParams.push(hasAccessibility === 'true');
      }
      
      if (hasWifi !== undefined) {
        countParamCount++;
        countQuery += ` AND has_wifi = $${countParamCount}`;
        countParams.push(hasWifi === 'true');
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
      console.error('Error getting synagogues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get synagogues',
        message: error.message
      });
    }
  }

  // Get synagogue by ID
  static async getSynagogueById(req, res) {
    try {
      const { id } = req.params;
      
      const query = 'SELECT * FROM synagogues WHERE id = $1 AND is_active = true';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Synagogue not found'
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
      console.error('Error getting synagogue by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get synagogue',
        message: error.message
      });
    }
  }

  // Search synagogues
  static async searchSynagogues(req, res) {
    try {
      const {
        q: query,
        city,
        state,
        denomination,
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
        SELECT * FROM synagogues 
        WHERE is_active = true 
        AND (
          name ILIKE $1 
          OR description ILIKE $1 
          OR address ILIKE $1 
          OR city ILIKE $1 
          OR state ILIKE $1
          OR denomination ILIKE $1
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
      
      if (denomination) {
        paramCount++;
        searchQuery += ` AND denomination = $${paramCount}`;
        params.push(denomination);
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
      console.error('Error searching synagogues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search synagogues',
        message: error.message
      });
    }
  }

  // Get nearby synagogues
  static async getNearbySynagogues(req, res) {
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
        FROM synagogues 
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
      console.error('Error getting nearby synagogues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nearby synagogues',
        message: error.message
      });
    }
  }

  // Create new synagogue
  static async createSynagogue(req, res) {
    try {
      const {
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
        denomination,
        rabbi_name,
        congregation_size,
        has_parking,
        has_accessibility,
        has_wifi,
        has_kosher_kitchen,
        has_mikvah,
        has_library,
        has_youth_programs,
        has_adult_education,
        has_social_events,
        daily_minyan,
        shabbat_services,
        holiday_services,
        lifecycle_services,
        operating_hours,
        facebook_url,
        instagram_url,
        twitter_url,
        website_url
      } = req.body;

      // Validate required fields
      if (!name || !address || !city || !state || !zip_code || !denomination) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, address, city, state, zip_code, denomination'
        });
      }

      const query = `
        INSERT INTO synagogues (
          name, description, address, city, state, zip_code, latitude, longitude,
          phone, email, website, denomination, rabbi_name, congregation_size,
          has_parking, has_accessibility, has_wifi, has_kosher_kitchen, has_mikvah,
          has_library, has_youth_programs, has_adult_education, has_social_events,
          daily_minyan, shabbat_services, holiday_services, lifecycle_services,
          operating_hours, facebook_url, instagram_url, twitter_url, website_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
        ) RETURNING *
      `;

      const values = [
        name, description, address, city, state, zip_code, latitude, longitude,
        phone, email, website, denomination, rabbi_name, congregation_size,
        has_parking, has_accessibility, has_wifi, has_kosher_kitchen, has_mikvah,
        has_library, has_youth_programs, has_adult_education, has_social_events,
        daily_minyan, shabbat_services, holiday_services, lifecycle_services,
        JSON.stringify(operating_hours || {}), facebook_url, instagram_url, twitter_url, website_url
      ];

      const result = await pool.query(query, values);
      
      res.status(201).json({
        success: true,
        data: {
          synagogue: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Error creating synagogue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create synagogue',
        message: error.message
      });
    }
  }

  // Update synagogue
  static async updateSynagogue(req, res) {
    try {
      const { id } = req.params;
      const updateFields = req.body;
      
      // Build dynamic update query
      const setClause = Object.keys(updateFields)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      if (!setClause) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }

      const query = `
        UPDATE synagogues 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;

      const values = [id, ...Object.values(updateFields)];
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Synagogue not found'
        });
      }

      res.json({
        success: true,
        data: {
          synagogue: result.rows[0]
        }
      });
    } catch (error) {
      console.error('Error updating synagogue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update synagogue',
        message: error.message
      });
    }
  }

  // Delete synagogue (soft delete)
  static async deleteSynagogue(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        UPDATE synagogues 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Synagogue not found'
        });
      }

      res.json({
        success: true,
        message: 'Synagogue deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting synagogue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete synagogue',
        message: error.message
      });
    }
  }
}

module.exports = SynagogueController;
