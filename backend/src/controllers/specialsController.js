const { Pool } = require('pg');

// Database connection - use the same pool as other controllers
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://jewgo_user:jewgo_password@localhost:5433/jewgo_dev'
});

class SpecialsController {
  // GET /api/v5/specials - Get all specials
  static async getAllSpecials(req, res) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      console.log(`📋 Getting specials with limit: ${limitNum}, offset: ${offsetNum}`);

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
        pool.query(specialsQuery, [limitNum, offsetNum]),
        pool.query(countQuery)
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
        is_expiring: new Date(special.valid_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires within 7 days
        terms_conditions: special.terms,
        image_url: special.hero_image_url,
        gallery: [], // Will be populated separately if needed
        rating: special.rating,
        price_range: special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
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
        original_price: special.rating >= 4.5 ? '$25.99' : special.rating >= 3.5 ? '$18.99' : '$12.99'
      }));

      res.json({
        success: true,
        data: {
          specials: specials,
          total: parseInt(countResult.rows[0].total),
          limit: limitNum,
          offset: offsetNum,
        }
      });
    } catch (error) {
      console.error('Error getting specials:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // GET /api/v5/specials/:id - Get a specific special
  static async getSpecialById(req, res) {
    try {
      const { id } = req.params;
      console.log(`🔍 Getting special by ID: ${id}`);

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

      const result = await pool.query(specialQuery, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Special not found',
          message: `Special with ID ${id} not found`
        });
      }

      const special = result.rows[0];

      // Record view event
      try {
        const userId = req.user?.id;
        const guestSessionId = req.guestSession?.id;
        const ipAddress = req.ip;
        const userAgent = req.get('User-Agent');

        await pool.query(`
          INSERT INTO special_events (special_id, user_id, guest_session_id, event_type, ip_address, user_agent)
          VALUES ($1, $2, $3, 'view', $4, $5)
        `, [id, userId, guestSessionId, ipAddress, userAgent]);
      } catch (viewError) {
        console.warn('Failed to record view event:', viewError);
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
        is_expiring: new Date(special.valid_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms_conditions: special.terms,
        image_url: special.hero_image_url,
        gallery: special.gallery || [],
        rating: special.rating,
        price_range: special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
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
        original_price: special.rating >= 4.5 ? '$25.99' : special.rating >= 3.5 ? '$18.99' : '$12.99'
      };

      res.json({
        success: true,
        data: {
          special: specialData
        }
      });
    } catch (error) {
      console.error('Error getting special:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // POST /api/v5/specials/:id/claim - Claim a special offer
  static async claimSpecial(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const guestSessionId = req.guestSession?.id;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      console.log(`🎯 Claiming special: ${id}`);

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
          message: `Special with ID ${id} not found`
        });
      }

      const special = specialResult.rows[0];

      if (!special.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Special not active',
          message: 'This special offer is no longer active'
        });
      }

      // 2. Check if there are claims left
      const claimsLeft = special.max_claims_total ? 
        Math.max(0, special.max_claims_total - special.current_claims) : 999999;

      if (claimsLeft <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'No claims left',
          message: 'This special offer has been fully claimed'
        });
      }

      // 3. Check if user has already claimed it (unless per_visit is true)
      if (!special.per_visit && userId) {
        const existingClaimQuery = `
          SELECT id FROM special_claims 
          WHERE special_id = $1 AND user_id = $2 AND status IN ('claimed', 'redeemed')
        `;
        const existingClaim = await client.query(existingClaimQuery, [id, userId]);

        if (existingClaim.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            error: 'Already claimed',
            message: 'You have already claimed this special offer'
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
        id, userId, guestSessionId, ipAddress, userAgent
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
            status: 'claimed'
          },
          special: {
            id: special.id,
            title: special.title,
            business_name: special.business_name,
            claims_left: claimsLeft - 1
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error claiming special:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    } finally {
      client.release();
    }
  }

  // GET /api/v5/specials/search - Search specials
  static async searchSpecials(req, res) {
    try {
      const { q, category, business_id, active_only = 'true' } = req.query;
      console.log(`🔍 Searching specials with query: ${q}, category: ${category}, business_id: ${business_id}`);

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

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

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

      const result = await pool.query(searchQuery, params);

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
        is_expiring: new Date(special.valid_until) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        terms_conditions: special.terms,
        image_url: special.hero_image_url,
        gallery: [],
        rating: special.rating,
        price_range: special.rating >= 4.5 ? '$$$' : special.rating >= 3.5 ? '$$' : '$',
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
        original_price: special.rating >= 4.5 ? '$25.99' : special.rating >= 3.5 ? '$18.99' : '$12.99'
      }));

      res.json({
        success: true,
        data: {
          specials: specials,
          total: specials.length,
          query: { q, category, business_id, active_only }
        }
      });
    } catch (error) {
      console.error('Error searching specials:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = SpecialsController;
