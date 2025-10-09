// Import the shared database connection from the auth system
// We'll get the pool from the request context or use a shared instance
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

class SpecialsController {
  // GET /api/v5/specials/active - Get active specials with priority sorting
  static async getActiveSpecials(req, res) {
    try {
      const {
        limit = 20,
        offset = 0,
        sortBy = 'priority',
        sortOrder = 'desc',
        page = 1,
      } = req.query;

      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);
      const pageNum = parseInt(page, 10);

      logger.info(
        `🔥 Getting active specials with limit: ${limitNum}, offset: ${offsetNum}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`,
      );

      // Build ORDER BY clause based on sortBy parameter
      let orderByClause = '';
      switch (sortBy) {
        case 'priority':
          orderByClause = `s.priority ${sortOrder.toUpperCase()}, s.valid_until ASC`;
          break;
        case 'claims_total':
          orderByClause = `s.claims_total ${sortOrder.toUpperCase()}, s.priority DESC`;
          break;
        case 'valid_until':
          orderByClause = `s.valid_until ${sortOrder.toUpperCase()}, s.priority DESC`;
          break;
        case 'created_at':
          orderByClause = `s.created_at ${sortOrder.toUpperCase()}, s.priority DESC`;
          break;
        default:
          orderByClause = `s.priority DESC, s.valid_until ASC`;
      }

      // Query database for active specials with business information
      const specialsQuery = `
        SELECT 
          s.*,
          e.name as business_name,
          e.address as business_address,
          e.city as business_city,
          e.state as business_state,
          e.zip_code as business_zip_code,
          e.phone as business_phone,
          e.email as business_email,
          e.website as business_website,
          e.facebook_url,
          e.instagram_url,
          e.whatsapp_url,
          e.rating,
          e.entity_type as category,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_claims sc 
            WHERE sc.special_id = s.id 
            AND sc.status IN ('claimed', 'redeemed')
          ), 0) as claims_count,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_events se 
            WHERE se.special_id = s.id 
            AND se.event_type = 'view'
          ), 0) as views_count,
          CASE 
            WHEN s.max_claims_total IS NULL THEN 999999
            ELSE s.max_claims_total - COALESCE((
              SELECT COUNT(*) 
              FROM special_claims sc 
              WHERE sc.special_id = s.id 
              AND sc.status IN ('claimed', 'redeemed')
            ), 0)
          END as claims_left
        FROM specials s
        JOIN entities e ON s.business_id = e.id
        WHERE s.is_active = true
          AND s.valid_from <= NOW()
          AND s.valid_until >= NOW()
          AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
        ORDER BY ${orderByClause}
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM specials s
        WHERE s.is_active = true
          AND s.valid_from <= NOW()
          AND s.valid_until >= NOW()
          AND (s.max_claims_total IS NULL OR s.claims_total < s.max_claims_total)
      `;

      const [specialsResult, countResult] = await Promise.all([
        getPool().query(specialsQuery, [limitNum, offsetNum]),
        getPool().query(countQuery),
      ]);

      const specials = specialsResult.rows.map(special => ({
        id: special.id,
        title: special.title,
        subtitle: special.subtitle,
        description: special.description,
        businessId: special.business_id,
        business: {
          id: special.business_id,
          name: special.business_name,
          address: special.business_address,
          city: special.business_city,
          state: special.business_state,
          zipCode: special.business_zip_code,
          phone: special.business_phone,
          email: special.business_email,
          website: special.business_website,
          facebookUrl: special.facebook_url,
          instagramUrl: special.instagram_url,
          whatsappUrl: special.whatsapp_url,
          rating: special.rating,
          entityType: special.category,
        },
        discountType: special.discount_type,
        discountValue: special.discount_value?.toString(),
        discountLabel: special.discount_label,
        validFrom: special.valid_from.toISOString(),
        validUntil: special.valid_until.toISOString(),
        claimsTotal: special.claims_total,
        maxClaimsTotal: special.max_claims_total,
        priority: special.priority,
        heroImageUrl: special.hero_image_url,
        isActive: special.is_active,
        isExpiring:
          new Date(special.valid_until) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms: special.terms,
        gallery: [], // Will be populated separately if needed
        rating: special.rating,
        priceRange:
          special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
        createdAt: special.created_at.toISOString(),
        updatedAt: special.updated_at.toISOString(),
        claimsLeft: special.claims_left,
        viewsCount: special.views_count,
        originalPrice:
          special.rating >= 4.5
            ? '$25.99'
            : special.rating >= 3.5
            ? '$18.99'
            : '$12.99',
      }));

      res.json({
        success: true,
        data: {
          specials: specials,
          total: parseInt(countResult.rows[0].total, 10),
          limit: limitNum,
          offset: offsetNum,
          page: pageNum,
          hasNext:
            offsetNum + limitNum < parseInt(countResult.rows[0].total, 10),
          hasPrev: offsetNum > 0,
        },
      });
    } catch (error) {
      logger.error('Error getting active specials:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // GET /api/v5/specials - Get all specials
  static async getAllSpecials(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      logger.info(
        `📋 Getting specials with limit: ${limitNum}, offset: ${offsetNum}`,
      );

      // Query database for specials with business information
      const specialsQuery = `
        SELECT 
          s.*,
          e.name as business_name,
          e.address as business_address,
          e.city as business_city,
          e.state as business_state,
          e.zip_code as business_zip_code,
          e.phone as business_phone,
          e.email as business_email,
          e.website as business_website,
          e.facebook_url,
          e.instagram_url,
          e.whatsapp_url,
          e.rating,
          e.entity_type as category,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_claims sc 
            WHERE sc.special_id = s.id 
            AND sc.status IN ('claimed', 'redeemed')
          ), 0) as claims_count,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_events se 
            WHERE se.special_id = s.id 
            AND se.event_type = 'view'
          ), 0) as views_count,
          CASE 
            WHEN s.max_claims_total IS NULL THEN 999999
            ELSE s.max_claims_total - COALESCE((
              SELECT COUNT(*) 
              FROM special_claims sc 
              WHERE sc.special_id = s.id 
              AND sc.status IN ('claimed', 'redeemed')
            ), 0)
          END as claims_left
        FROM specials s
        JOIN entities e ON s.business_id = e.id
        WHERE s.is_active = true
        ORDER BY s.valid_until ASC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = `
        SELECT COUNT(*) as total
        FROM specials s
        WHERE s.is_active = true
      `;

      const [specialsResult, countResult] = await Promise.all([
        getPool().query(specialsQuery, [limitNum, offsetNum]),
        getPool().query(countQuery),
      ]);

      const specials = specialsResult.rows.map(special => ({
        id: special.id,
        title: special.title,
        subtitle: special.subtitle,
        description: special.description,
        business_id: special.business_id,
        business_name: special.business_name,
        category: special.category,
        discount_type: special.discount_type,
        discount_value: special.discount_value?.toString(),
        discount_display: special.discount_label,
        valid_from: special.valid_from.toISOString(),
        valid_until: special.valid_until.toISOString(),
        is_active: special.is_active,
        is_expiring:
          new Date(special.valid_until) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires within 7 days
        terms_conditions: special.terms,
        image_url: special.hero_image_url,
        gallery: [], // Will be populated separately if needed
        rating: special.rating,
        price_range:
          special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
        created_at: special.created_at.toISOString(),
        updated_at: special.updated_at.toISOString(),
        claims_left: special.claims_left,
        views_count: special.views_count,
        business_address: special.business_address,
        business_city: special.business_city,
        business_state: special.business_state,
        business_zip_code: special.business_zip_code,
        business_phone: special.business_phone,
        business_email: special.business_email,
        business_website: special.business_website,
        facebook_url: special.facebook_url,
        instagram_url: special.instagram_url,
        whatsapp_url: special.whatsapp_url,
        original_price:
          special.rating >= 4.5
            ? '$25.99'
            : special.rating >= 3.5
            ? '$18.99'
            : '$12.99',
      }));

      res.json({
        success: true,
        data: {
          specials: specials,
          total: parseInt(countResult.rows[0].total, 10),
          limit: limitNum,
          offset: offsetNum,
        },
      });
    } catch (error) {
      logger.error('Error getting specials:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // GET /api/v5/specials/:id - Get a specific special
  static async getSpecialById(req, res) {
    try {
      const { id } = req.params;
      logger.info(`🔍 Getting special by ID: ${id}`);

      const specialQuery = `
        SELECT 
          s.*,
          e.name as business_name,
          e.address as business_address,
          e.city as business_city,
          e.state as business_state,
          e.zip_code as business_zip_code,
          e.phone as business_phone,
          e.email as business_email,
          e.website as business_website,
          e.facebook_url,
          e.instagram_url,
          e.whatsapp_url,
          e.rating,
          e.entity_type as category,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_claims sc 
            WHERE sc.special_id = s.id 
            AND sc.status IN ('claimed', 'redeemed')
          ), 0) as claims_count,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_events se 
            WHERE se.special_id = s.id 
            AND se.event_type = 'view'
          ), 0) as views_count,
          CASE 
            WHEN s.max_claims_total IS NULL THEN 999999
            ELSE s.max_claims_total - COALESCE((
              SELECT COUNT(*) 
              FROM special_claims sc 
              WHERE sc.special_id = s.id 
              AND sc.status IN ('claimed', 'redeemed')
            ), 0)
          END as claims_left,
          (
            SELECT json_agg(
              json_build_object(
                'url', sm.url,
                'alt_text', sm.alt_text,
                'position', sm.position
              ) ORDER BY sm.position
            )
            FROM special_media sm 
            WHERE sm.special_id = s.id
          ) as gallery
        FROM specials s
        JOIN entities e ON s.business_id = e.id
        WHERE s.id = $1
      `;

      const result = await getPool().query(specialQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Special not found',
          message: `Special with ID ${id} not found`,
        });
      }

      const special = result.rows[0];

      // Record view event
      try {
        const userId = req.user?.type === 'guest' ? null : req.user?.id;
        const guestSessionId =
          req.user?.type === 'guest'
            ? req.user.sessionId
            : req.guestSession?.id;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        await getPool().query(
          `
          INSERT INTO special_events (special_id, user_id, guest_session_id, event_type, ip_address, user_agent)
          VALUES ($1, $2, $3, 'view', $4, $5)
        `,
          [id, userId, guestSessionId, ipAddress, userAgent],
        );
      } catch (viewError) {
        logger.warn('Failed to record view event:', viewError);
      }

      const specialData = {
        id: special.id,
        title: special.title,
        subtitle: special.subtitle,
        description: special.description,
        business_id: special.business_id,
        business_name: special.business_name,
        category: special.category,
        discount_type: special.discount_type,
        discount_value: special.discount_value?.toString(),
        discount_display: special.discount_label,
        valid_from: special.valid_from.toISOString(),
        valid_until: special.valid_until.toISOString(),
        is_active: special.is_active,
        is_expiring:
          new Date(special.valid_until) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms_conditions: special.terms,
        image_url: special.hero_image_url,
        gallery: special.gallery || [],
        rating: special.rating,
        price_range:
          special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
        created_at: special.created_at.toISOString(),
        updated_at: special.updated_at.toISOString(),
        claims_left: special.claims_left,
        views_count: special.views_count,
        business_address: special.business_address,
        business_city: special.business_city,
        business_state: special.business_state,
        business_zip_code: special.business_zip_code,
        business_phone: special.business_phone,
        business_email: special.business_email,
        business_website: special.business_website,
        facebook_url: special.facebook_url,
        instagram_url: special.instagram_url,
        whatsapp_url: special.whatsapp_url,
        original_price:
          special.rating >= 4.5
            ? '$25.99'
            : special.rating >= 3.5
            ? '$18.99'
            : '$12.99',
      };

      res.json({
        success: true,
        data: {
          special: specialData,
        },
      });
    } catch (error) {
      logger.error('Error getting special:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // POST /api/v5/specials/:id/claim - Claim a special offer
  static async claimSpecial(req, res) {
    const client = await getPool().connect();
    try {
      const { id } = req.params;
      const userId = req.user?.type === 'guest' ? null : req.user?.id;
      const guestSessionId =
        req.user?.type === 'guest' ? req.user.sessionId : req.guestSession?.id;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      logger.info(`🎯 Claiming special: ${id}`);

      await client.query('BEGIN');

      // 1. Check if the special exists and is active
      const specialQuery = `
        SELECT 
          s.*,
          e.name as business_name,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_claims sc 
            WHERE sc.special_id = s.id 
            AND sc.status IN ('claimed', 'redeemed')
          ), 0) as current_claims
        FROM specials s
        JOIN entities e ON s.business_id = e.id
        WHERE s.id = $1
      `;

      const specialResult = await client.query(specialQuery, [id]);

      if (specialResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Special not found',
          message: `Special with ID ${id} not found`,
        });
      }

      const special = specialResult.rows[0];

      if (!special.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Special not active',
          message: 'This special offer is no longer active',
        });
      }

      // 2. Check if there are claims left
      const claimsLeft = special.max_claims_total
        ? Math.max(0, special.max_claims_total - special.current_claims)
        : 999999;

      if (claimsLeft <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'No claims left',
          message: 'This special offer has been fully claimed',
        });
      }

      // 3. Check if user has already claimed it (unless per_visit is true)
      if (!special.per_visit && userId) {
        const existingClaimQuery = `
          SELECT id FROM special_claims 
          WHERE special_id = $1 AND user_id = $2 AND status IN ('claimed', 'redeemed')
        `;
        const existingClaim = await client.query(existingClaimQuery, [
          id,
          userId,
        ]);

        if (existingClaim.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            error: 'Already claimed',
            message: 'You have already claimed this special offer',
          });
        }
      }

      // 4. Record the claim in database
      const claimQuery = `
        INSERT INTO special_claims (special_id, user_id, guest_session_id, ip_address, user_agent, status)
        VALUES ($1, $2, $3, $4, $5, 'claimed')
        RETURNING id, claimed_at
      `;

      const claimResult = await client.query(claimQuery, [
        id,
        userId,
        guestSessionId,
        ipAddress,
        userAgent,
      ]);

      await client.query('COMMIT');

      // 5. Return success response
      res.json({
        success: true,
        data: {
          message: 'Special offer claimed successfully!',
          claim: {
            id: claimResult.rows[0].id,
            claimed_at: claimResult.rows[0].claimed_at.toISOString(),
            status: 'claimed',
          },
          special: {
            id: special.id,
            title: special.title,
            business_name: special.business_name,
            claims_left: claimsLeft - 1,
          },
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error claiming special:', error);

      // Handle duplicate claim error
      if (
        error.code === '23505' &&
        error.constraint === 'uq_special_claim_guest'
      ) {
        return res.status(400).json({
          success: false,
          error: 'Already claimed',
          message: 'You have already claimed this special offer',
        });
      }

      if (
        error.code === '23505' &&
        error.constraint === 'uq_special_claim_user'
      ) {
        return res.status(400).json({
          success: false,
          error: 'Already claimed',
          message: 'You have already claimed this special offer',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    } finally {
      client.release();
    }
  }

  // GET /api/v5/specials/search - Search specials
  static async searchSpecials(req, res) {
    try {
      const { q, category, business_id, active_only = 'true' } = req.query;
      logger.debug(
        `🔍 Searching specials with query: ${q}, category: ${category}, business_id: ${business_id}`,
      );

      // Build dynamic WHERE clause
      const conditions = [];
      const params = [];
      let paramCount = 0;

      // Filter by active status
      if (active_only === 'true') {
        conditions.push('s.is_active = true');
      }

      // Filter by search query
      if (q) {
        paramCount++;
        conditions.push(`(
          s.title ILIKE $${paramCount} OR 
          s.description ILIKE $${paramCount} OR 
          e.name ILIKE $${paramCount}
        )`);
        params.push(`%${q}%`);
      }

      // Filter by category
      if (category) {
        paramCount++;
        conditions.push(`e.entity_type = $${paramCount}`);
        params.push(category.toLowerCase());
      }

      // Filter by business ID
      if (business_id) {
        paramCount++;
        conditions.push(`s.business_id = $${paramCount}`);
        params.push(business_id);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const searchQuery = `
        SELECT 
          s.*,
          e.name as business_name,
          e.address as business_address,
          e.city as business_city,
          e.state as business_state,
          e.zip_code as business_zip_code,
          e.phone as business_phone,
          e.email as business_email,
          e.website as business_website,
          e.facebook_url,
          e.instagram_url,
          e.whatsapp_url,
          e.rating,
          e.entity_type as category,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_claims sc 
            WHERE sc.special_id = s.id 
            AND sc.status IN ('claimed', 'redeemed')
          ), 0) as claims_count,
          COALESCE((
            SELECT COUNT(*) 
            FROM special_events se 
            WHERE se.special_id = s.id 
            AND se.event_type = 'view'
          ), 0) as views_count,
          CASE 
            WHEN s.max_claims_total IS NULL THEN 999999
            ELSE s.max_claims_total - COALESCE((
              SELECT COUNT(*) 
              FROM special_claims sc 
              WHERE sc.special_id = s.id 
              AND sc.status IN ('claimed', 'redeemed')
            ), 0)
          END as claims_left
        FROM specials s
        JOIN entities e ON s.business_id = e.id
        ${whereClause}
        ORDER BY s.valid_until ASC
      `;

      const result = await getPool().query(searchQuery, params);

      const specials = result.rows.map(special => ({
        id: special.id,
        title: special.title,
        subtitle: special.subtitle,
        description: special.description,
        business_id: special.business_id,
        business_name: special.business_name,
        category: special.category,
        discount_type: special.discount_type,
        discount_value: special.discount_value?.toString(),
        discount_display: special.discount_label,
        valid_from: special.valid_from.toISOString(),
        valid_until: special.valid_until.toISOString(),
        is_active: special.is_active,
        is_expiring:
          new Date(special.valid_until) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms_conditions: special.terms,
        image_url: special.hero_image_url,
        gallery: [],
        rating: special.rating,
        price_range:
          special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
        created_at: special.created_at.toISOString(),
        updated_at: special.updated_at.toISOString(),
        claims_left: special.claims_left,
        views_count: special.views_count,
        business_address: special.business_address,
        business_city: special.business_city,
        business_state: special.business_state,
        business_zip_code: special.business_zip_code,
        business_phone: special.business_phone,
        business_email: special.business_email,
        business_website: special.business_website,
        facebook_url: special.facebook_url,
        instagram_url: special.instagram_url,
        whatsapp_url: special.whatsapp_url,
        original_price:
          special.rating >= 4.5
            ? '$25.99'
            : special.rating >= 3.5
            ? '$18.99'
            : '$12.99',
      }));

      res.json({
        success: true,
        data: {
          specials: specials,
          total: specials.length,
          query: { q, category, business_id, active_only },
        },
      });
    } catch (error) {
      logger.error('Error searching specials:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // POST /api/v5/specials - Create a new special
  static async createSpecial(req, res) {
    try {
      const {
        business_id,
        title,
        subtitle,
        description,
        discount_type,
        discount_value,
        discount_label,
        valid_from,
        valid_until,
        priority = 0,
        max_claims_total,
        max_claims_per_user = 1,
        requires_code = false,
        code_hint,
        terms,
        hero_image_url,
        is_active = true,
      } = req.body;

      logger.info(
        `📝 Creating new special: ${title} for business: ${business_id}`,
      );

      // Validate required fields
      if (
        !business_id ||
        !title ||
        !discount_type ||
        !discount_label ||
        !valid_from ||
        !valid_until
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Missing required fields: business_id, title, discount_type, discount_label, valid_from, valid_until',
        });
      }

      // Validate date range
      const validFromDate = new Date(valid_from);
      const validUntilDate = new Date(valid_until);

      if (validUntilDate <= validFromDate) {
        return res.status(400).json({
          success: false,
          error: 'valid_until must be after valid_from',
        });
      }

      const insertQuery = `
        INSERT INTO specials (
          business_id, title, subtitle, description, discount_type, discount_value,
          discount_label, valid_from, valid_until, priority, max_claims_total,
          max_claims_per_user, requires_code, code_hint, terms, hero_image_url,
          is_active, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
        ) RETURNING *
      `;

      const values = [
        business_id,
        title,
        subtitle || null,
        description || null,
        discount_type,
        discount_value || null,
        discount_label,
        valid_from,
        valid_until,
        priority,
        max_claims_total || null,
        max_claims_per_user,
        requires_code,
        code_hint || null,
        terms || null,
        hero_image_url || null,
        is_active,
      ];

      const result = await getPool().query(insertQuery, values);
      const newSpecial = result.rows[0];

      // Transform the response to match frontend expectations
      const transformedSpecial = {
        id: newSpecial.id,
        title: newSpecial.title,
        subtitle: newSpecial.subtitle,
        description: newSpecial.description,
        businessId: newSpecial.business_id,
        discountType: newSpecial.discount_type,
        discountValue: newSpecial.discount_value?.toString(),
        discountLabel: newSpecial.discount_label,
        validFrom: newSpecial.valid_from,
        validUntil: newSpecial.valid_until,
        priority: newSpecial.priority,
        maxClaimsTotal: newSpecial.max_claims_total,
        maxClaimsPerUser: newSpecial.max_claims_per_user,
        requiresCode: newSpecial.requires_code,
        codeHint: newSpecial.code_hint,
        terms: newSpecial.terms,
        heroImageUrl: newSpecial.hero_image_url,
        isEnabled: newSpecial.is_active,
        createdAt: newSpecial.created_at,
        updatedAt: newSpecial.updated_at,
      };

      res.status(201).json({
        success: true,
        data: {
          special: transformedSpecial,
        },
      });
    } catch (error) {
      logger.error('Error creating special:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // PUT /api/v5/specials/:id - Update a special
  static async updateSpecial(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.debug(`📝 Updating special: ${id} with data:`, updateData);

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      // Map frontend field names to database field names
      const fieldMapping = {
        business_id: 'business_id',
        title: 'title',
        subtitle: 'subtitle',
        description: 'description',
        discount_type: 'discount_type',
        discount_value: 'discount_value',
        discount_label: 'discount_label',
        valid_from: 'valid_from',
        valid_until: 'valid_until',
        priority: 'priority',
        max_claims_total: 'max_claims_total',
        max_claims_per_user: 'max_claims_per_user',
        requires_code: 'requires_code',
        code_hint: 'code_hint',
        terms: 'terms',
        hero_image_url: 'hero_image_url',
        is_active: 'is_active',
      };

      Object.entries(updateData).forEach(([key, value]) => {
        if (fieldMapping[key] && value !== undefined) {
          paramCount++;
          updateFields.push(`${fieldMapping[key]} = $${paramCount}`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
        });
      }

      // Add updated_at and id to values
      paramCount++;
      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const updateQuery = `
        UPDATE specials 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await getPool().query(updateQuery, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Special not found',
        });
      }

      const updatedSpecial = result.rows[0];

      // Transform the response
      const transformedSpecial = {
        id: updatedSpecial.id,
        title: updatedSpecial.title,
        subtitle: updatedSpecial.subtitle,
        description: updatedSpecial.description,
        businessId: updatedSpecial.business_id,
        discountType: updatedSpecial.discount_type,
        discountValue: updatedSpecial.discount_value?.toString(),
        discountLabel: updatedSpecial.discount_label,
        validFrom: updatedSpecial.valid_from,
        validUntil: updatedSpecial.valid_until,
        priority: updatedSpecial.priority,
        maxClaimsTotal: updatedSpecial.max_claims_total,
        maxClaimsPerUser: updatedSpecial.max_claims_per_user,
        requiresCode: updatedSpecial.requires_code,
        codeHint: updatedSpecial.code_hint,
        terms: updatedSpecial.terms,
        heroImageUrl: updatedSpecial.hero_image_url,
        isEnabled: updatedSpecial.is_active,
        createdAt: updatedSpecial.created_at,
        updatedAt: updatedSpecial.updated_at,
      };

      res.json({
        success: true,
        data: {
          special: transformedSpecial,
        },
      });
    } catch (error) {
      logger.error('Error updating special:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  // DELETE /api/v5/specials/:id - Delete a special
  static async deleteSpecial(req, res) {
    try {
      const { id } = req.params;

      logger.info(`🗑️ Deleting special: ${id}`);

      const deleteQuery = 'DELETE FROM specials WHERE id = $1 RETURNING id';
      const result = await getPool().query(deleteQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Special not found',
        });
      }

      res.json({
        success: true,
        message: 'Special deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting special:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

module.exports = SpecialsController;
