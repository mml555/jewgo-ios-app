const pool = require('../database/connection');
const logger = require('../utils/logger');

/**
 * Nearby Entities Controller
 * Server-side distance computation with proper API contract
 */
class NearbyEntitiesController {
  // Get nearby entities with server-side distance computation
  static async getNearbyEntities(req, res) {
    try {
      const {
        lat,
        lng,
        radius_m = 5000, // Default 5km
        limit = 20,
        after, // Cursor for pagination
        entity_type,
        client_accuracy,
        client_ttff_ms,
      } = req.query;

      // Validate required parameters
      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required',
          code: 'MISSING_COORDINATES',
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      // Validate coordinate ranges
      if (
        isNaN(latitude) ||
        isNaN(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          error: 'Invalid coordinates',
          code: 'INVALID_COORDINATES',
        });
      }

      // Enforce server-side limits
      const maxRadius = Math.min(parseInt(radius_m, 10), 25000); // 25km max
      const maxLimit = Math.min(parseInt(limit, 10), 50); // 50 max

      // Log telemetry
      logger.debug('📍 Nearby request:', {
        lat: latitude,
        lng: longitude,
        radius_m: maxRadius,
        limit: maxLimit,
        entity_type,
        client_accuracy,
        client_ttff_ms: client_ttff_ms ? parseInt(client_ttff_ms, 10) : null,
      });

      // Use the optimized spatial function for distance computation
      const startTime = Date.now();
      const result = await pool.query(
        'SELECT * FROM get_nearby_entities_simple($1, $2, $3, $4, $5, $6)',
        [
          latitude,
          longitude,
          maxRadius,
          entity_type || null,
          maxLimit + 1,
          after || null,
        ],
      );
      const queryTime = Date.now() - startTime;

      // Check if there are more results
      const hasMore = result.rows.length > maxLimit;
      const items = hasMore ? result.rows.slice(0, maxLimit) : result.rows;

      // Get the last item's ID for cursor
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      // Enhance items with specialized data
      const enhancedItems = await Promise.all(
        items.map(async item => {
          const specializedData =
            await NearbyEntitiesController.getSpecializedData(
              item.id,
              item.entity_type,
            );
          return {
            id: item.id,
            name: item.name,
            category: item.entity_type,
            coords: {
              lat: parseFloat(item.latitude),
              lng: parseFloat(item.longitude),
            },
            distance_m: Math.round(item.distance_m),
            address: item.address,
            city: item.city,
            state: item.state,
            zip_code: item.zip_code,
            rating: parseFloat(item.rating) || 0,
            review_count: item.review_count || 0,
            is_verified: item.is_verified,
            badges: NearbyEntitiesController.generateBadges(
              item,
              specializedData,
            ),
            ...specializedData,
          };
        }),
      );

      // Log performance metrics
      logger.debug('📍 Nearby query performance:', {
        queryTime,
        resultCount: enhancedItems.length,
        hasMore,
        radius_m: maxRadius,
      });

      res.json({
        success: true,
        data: {
          items: enhancedItems,
          page: {
            cursor: nextCursor,
            count: enhancedItems.length,
            hasMore,
          },
          location: {
            lat: latitude,
            lng: longitude,
          },
          radius_m: maxRadius,
          performance: {
            queryTime,
            resultCount: enhancedItems.length,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching nearby entities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch nearby entities',
        code: 'INTERNAL_ERROR',
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
          specializedQuery =
            'SELECT * FROM mikvahs_normalized WHERE entity_id = $1';
          break;
        case 'synagogue':
          specializedQuery =
            'SELECT * FROM synagogues_normalized WHERE entity_id = $1';
          break;
        case 'restaurant':
          specializedQuery =
            'SELECT * FROM restaurants_normalized WHERE entity_id = $1';
          break;
        case 'store':
          specializedQuery =
            'SELECT * FROM stores_normalized WHERE entity_id = $1';
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

  // Generate badges for entities
  static generateBadges(entity, specializedData) {
    const badges = [];

    // Open now badge (simplified - would need business hours logic)
    if (entity.is_verified) {
      badges.push('verified');
    }

    // Entity-specific badges
    if (specializedData) {
      if (specializedData.kosher_level === 'glatt') {
        badges.push('glatt_kosher');
      }

      if (specializedData.has_parking) {
        badges.push('parking');
      }

      if (specializedData.has_wifi) {
        badges.push('wifi');
      }
    }

    return badges;
  }

  // Health check endpoint for nearby functionality
  static async healthCheck(req, res) {
    try {
      const { lat = 40.7128, lng = -74.006 } = req.query;

      const startTime = Date.now();

      // Test query with sample coordinates
      const query = `
        SELECT COUNT(*) as count,
               AVG(ST_DistanceSphere(
                 ST_MakePoint(longitude, latitude),
                 ST_MakePoint($2, $1)
               )) as avg_distance
        FROM entities_normalized 
        WHERE is_active = true 
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
      `;

      const result = await pool.query(query, [
        parseFloat(lat),
        parseFloat(lng),
      ]);
      const queryTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          status: 'healthy',
          totalEntities: parseInt(result.rows[0].count, 10),
          avgDistance: Math.round(result.rows[0].avg_distance),
          queryTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: error.message,
      });
    }
  }
}

module.exports = NearbyEntitiesController;
