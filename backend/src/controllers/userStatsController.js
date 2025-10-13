// User Statistics Controller
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

class UserStatsController {
  /**
   * GET /api/v5/users/stats
   * Get user's overall statistics (reviews, listings, favorites, views)
   */
  static async getUserStats(req, res) {
    try {
      const userId = req.user?.id;
      const userType = req.user?.type;

      logger.info(`📊 Getting stats for user: ${userId} (type: ${userType})`);

      // Guest users don't have stats
      if (userType === 'guest' || !userId) {
        return res.status(200).json({
          success: true,
          data: {
            stats: {
              reviews: 0,
              listings: 0,
              favorites: 0,
              views: 0,
            },
          },
        });
      }

      // Get review count
      const reviewsQuery = `
        SELECT COUNT(*) as count
        FROM reviews
        WHERE user_id = $1
      `;

      // Get favorites count
      const favoritesQuery = `
        SELECT COUNT(*) as count
        FROM favorites
        WHERE user_id = $1
      `;

      // Get user-created listings count (entities, events, jobs, stores)
      const listingsQuery = `
        SELECT 
          (SELECT COUNT(*) FROM entities WHERE created_by = $1 AND is_active = true) +
          (SELECT COUNT(*) FROM events WHERE created_by = $1 AND status != 'cancelled') +
          (SELECT COUNT(*) FROM jobs WHERE created_by = $1 AND is_active = true) +
          (SELECT COUNT(*) FROM shtetl_stores WHERE owner_id = $1 AND is_active = true) as count
      `;

      // Get total views (from interactions or a views table if exists)
      // For now, we'll calculate based on interaction type 'view'
      const viewsQuery = `
        SELECT COALESCE(SUM(view_count), 0) as count
        FROM (
          SELECT COUNT(*) as view_count
          FROM interactions
          WHERE entity_id IN (
            SELECT id FROM entities WHERE created_by = $1
          ) AND interaction_type = 'view'
          
          UNION ALL
          
          SELECT COUNT(*) as view_count
          FROM event_interactions
          WHERE event_id IN (
            SELECT id FROM events WHERE created_by = $1
          ) AND interaction_type = 'view'
        ) as total_views
      `;

      // Execute all queries in parallel
      const [reviewsResult, favoritesResult, listingsResult, viewsResult] =
        await Promise.all([
          getPool().query(reviewsQuery, [userId]),
          getPool().query(favoritesQuery, [userId]),
          getPool().query(listingsQuery, [userId]),
          getPool()
            .query(viewsQuery, [userId])
            .catch(() => ({ rows: [{ count: '0' }] })), // Fallback if tables don't exist
        ]);

      const stats = {
        reviews: parseInt(reviewsResult.rows[0]?.count || 0, 10),
        listings: parseInt(listingsResult.rows[0]?.count || 0, 10),
        favorites: parseInt(favoritesResult.rows[0]?.count || 0, 10),
        views: parseInt(viewsResult.rows[0]?.count || 0, 10),
      };

      logger.info(`✅ User stats retrieved: ${JSON.stringify(stats)}`);

      return res.status(200).json({
        success: true,
        data: {
          stats,
        },
      });
    } catch (error) {
      logger.error('❌ Error getting user stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve user statistics',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/v5/users/listings
   * Get user's detailed listings with engagement metrics
   */
  static async getUserListings(req, res) {
    try {
      const userId = req.user?.id;
      const userType = req.user?.type;
      const { limit = 50, offset = 0 } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      logger.info(
        `📋 Getting listings for user: ${userId} (type: ${userType})`,
      );

      // Guest users don't have listings
      if (userType === 'guest' || !userId) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      // Get user's entities with metrics
      const entitiesQuery = `
        SELECT 
          e.id,
          e.name as title,
          'listing' as type,
          e.entity_type as category_key,
          e.created_at,
          e.updated_at,
          COALESCE(
            (SELECT COUNT(*) FROM interactions 
             WHERE entity_id = e.id AND interaction_type = 'view'), 
            0
          ) as views,
          COALESCE(
            (SELECT COUNT(*) FROM favorites WHERE entity_id = e.id), 
            0
          ) as favorites,
          COALESCE(
            (SELECT COUNT(*) FROM interactions 
             WHERE entity_id = e.id AND interaction_type = 'share'), 
            0
          ) as shares
        FROM entities e
        WHERE e.created_by = $1 AND e.is_active = true
      `;

      // Get user's events with metrics
      const eventsQuery = `
        SELECT 
          ev.id,
          ev.title,
          'event' as type,
          NULL as category_key,
          ev.created_at,
          ev.updated_at,
          COALESCE(
            (SELECT COUNT(*) FROM event_interactions 
             WHERE event_id = ev.id AND interaction_type = 'view'), 
            0
          ) as views,
          COALESCE(
            (SELECT COUNT(*) FROM event_favorites WHERE event_id = ev.id), 
            0
          ) as favorites,
          COALESCE(
            (SELECT COUNT(*) FROM event_interactions 
             WHERE event_id = ev.id AND interaction_type = 'share'), 
            0
          ) as shares
        FROM events ev
        WHERE ev.created_by = $1 AND ev.status != 'cancelled'
      `;

      // Get user's jobs with metrics
      const jobsQuery = `
        SELECT 
          j.id,
          j.title,
          'job' as type,
          NULL as category_key,
          j.created_at,
          j.updated_at,
          COALESCE(j.view_count, 0) as views,
          0 as favorites,
          0 as shares
        FROM jobs j
        WHERE j.created_by = $1 AND j.is_active = true
      `;

      // Get user's stores with metrics
      const storesQuery = `
        SELECT 
          s.id,
          s.name as title,
          'store' as type,
          s.store_type as category_key,
          s.created_at,
          s.updated_at,
          COALESCE(s.view_count, 0) as views,
          0 as favorites,
          0 as shares
        FROM shtetl_stores s
        WHERE s.owner_id = $1 AND s.is_active = true
      `;

      // Get user's specials with metrics
      const specialsQuery = `
        SELECT 
          sp.id,
          sp.title,
          'special' as type,
          sp.business_id,
          sp.created_at,
          sp.updated_at,
          COALESCE(sp.view_count, 0) as views,
          COALESCE(
            (SELECT COUNT(*) FROM special_favorites WHERE special_id = sp.id), 
            0
          ) as favorites,
          0 as shares
        FROM specials sp
        WHERE sp.created_by = $1 AND sp.is_active = true
      `;

      // Execute queries in parallel (with fallbacks for tables that might not exist)
      const [
        entitiesResult,
        eventsResult,
        jobsResult,
        storesResult,
        specialsResult,
      ] = await Promise.all([
        getPool()
          .query(entitiesQuery, [userId])
          .catch(() => ({ rows: [] })),
        getPool()
          .query(eventsQuery, [userId])
          .catch(() => ({ rows: [] })),
        getPool()
          .query(jobsQuery, [userId])
          .catch(() => ({ rows: [] })),
        getPool()
          .query(storesQuery, [userId])
          .catch(() => ({ rows: [] })),
        getPool()
          .query(specialsQuery, [userId])
          .catch(() => ({ rows: [] })),
      ]);

      // Combine all listings
      const allListings = [
        ...entitiesResult.rows,
        ...eventsResult.rows,
        ...jobsResult.rows,
        ...storesResult.rows,
        ...specialsResult.rows,
      ];

      // Sort by updated_at (most recent first)
      allListings.sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      );

      // Apply pagination
      const paginatedListings = allListings
        .slice(offsetNum, offsetNum + limitNum)
        .map(listing => ({
          id: listing.id,
          title: listing.title,
          type: listing.type,
          views: parseInt(listing.views, 10),
          favorites: parseInt(listing.favorites, 10),
          shares: parseInt(listing.shares, 10),
          createdAt: listing.created_at,
          updatedAt: listing.updated_at,
          ...(listing.category_key && { categoryKey: listing.category_key }),
          ...(listing.business_id && { businessId: listing.business_id }),
        }));

      logger.info(
        `✅ User listings retrieved: ${paginatedListings.length} items`,
      );

      return res.status(200).json({
        success: true,
        data: paginatedListings,
        meta: {
          total: allListings.length,
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      logger.error('❌ Error getting user listings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve user listings',
        message: error.message,
      });
    }
  }
}

module.exports = UserStatsController;

