const { query } = require('../database/connection');

class Entity {
  static async findAll(params = {}) {
    const {
      entityType,
      city,
      state,
      kosherLevel, // NOW dietary type: 'meat', 'dairy', 'parve'
      kosherCertification, // NOW standardized hechsher: 'KM', 'ORB', etc.
      denomination,
      storeType,
      isVerified,
      minRating,
      hasKosherCertification,
      priceMin, // NEW: Minimum price filter
      priceMax, // NEW: Maximum price filter
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = params;

    let whereConditions = ['e.is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    if (entityType) {
      paramCount++;
      whereConditions.push(`e.entity_type = $${paramCount}`);
      queryParams.push(entityType);
    }

    if (city) {
      paramCount++;
      whereConditions.push(`LOWER(e.city) = LOWER($${paramCount})`);
      queryParams.push(city);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`LOWER(e.state) = LOWER($${paramCount})`);
      queryParams.push(state);
    }

    if (kosherLevel) {
      paramCount++;
      whereConditions.push(`e.kosher_level = $${paramCount}`);
      queryParams.push(kosherLevel);
    }

    if (kosherCertification) {
      paramCount++;
      whereConditions.push(`e.kosher_certification = $${paramCount}`);
      queryParams.push(kosherCertification);
    }

    if (denomination) {
      paramCount++;
      whereConditions.push(`e.denomination = $${paramCount}`);
      queryParams.push(denomination);
    }

    if (storeType) {
      paramCount++;
      whereConditions.push(`e.store_type = $${paramCount}`);
      queryParams.push(storeType);
    }

    if (isVerified !== undefined) {
      paramCount++;
      whereConditions.push(`e.is_verified = $${paramCount}`);
      queryParams.push(isVerified);
    }

    if (minRating !== undefined) {
      paramCount++;
      whereConditions.push(`e.rating >= $${paramCount}`);
      queryParams.push(minRating);
    }

    if (hasKosherCertification) {
      whereConditions.push('e.kosher_certification IS NOT NULL');
    }

    // NEW: Price range filtering
    if (priceMin !== undefined) {
      paramCount++;
      whereConditions.push(`r.price_min >= $${paramCount}`);
      queryParams.push(priceMin);
    }

    if (priceMax !== undefined) {
      paramCount++;
      whereConditions.push(`r.price_max <= $${paramCount}`);
      queryParams.push(priceMax);
    }

    // Add pagination parameters
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const sql = `
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
        e.facebook_url,
        e.instagram_url,
        e.twitter_url,
        e.whatsapp_url,
        e.tiktok_url,
        e.youtube_url,
        e.snapchat_url,
        e.linkedin_url,
        e.latitude,
        e.longitude,
        e.rating,
        e.review_count,
        e.is_verified,
        e.kosher_level,
        e.kosher_certification,
        e.kosher_certificate_number,
        COALESCE(r.price_min, 0) as price_min,
        COALESCE(r.price_max, 0) as price_max,
        e.kosher_expires_at,
        e.denomination,
        e.store_type,
        e.services,
        e.created_at,
        e.updated_at,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM entities e
      LEFT JOIN restaurants_normalized r ON e.id = r.entity_id
      LEFT JOIN users u ON e.owner_id = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY e.${sortBy} ${sortOrder}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    return await query(sql, queryParams);
  }

  static async findById(id) {
    const sql = `
      SELECT 
        e.*,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name
      FROM entities e
      LEFT JOIN users u ON e.owner_id = u.id
      WHERE e.id = $1 AND e.is_active = true
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async findByType(entityType, params = {}) {
    return await this.findAll({ ...params, entityType });
  }

  static async search(searchQuery, params = {}) {
    const { entityType, city, state, limit = 50, offset = 0 } = params;

    let whereConditions = ['e.is_active = true'];
    let queryParams = [query];
    let paramCount = 1;

    whereConditions.push(`(
      LOWER(e.name) LIKE LOWER($1) OR 
      LOWER(e.description) LIKE LOWER($1) OR 
      LOWER(e.city) LIKE LOWER($1) OR 
      LOWER(e.state) LIKE LOWER($1)
    )`);

    if (entityType) {
      paramCount++;
      whereConditions.push(`e.entity_type = $${paramCount}`);
      queryParams.push(entityType);
    }

    if (city) {
      paramCount++;
      whereConditions.push(`LOWER(e.city) = LOWER($${paramCount})`);
      queryParams.push(city);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`LOWER(e.state) = LOWER($${paramCount})`);
      queryParams.push(state);
    }

    // Add pagination parameters
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const sql = `
      SELECT 
        e.id,
        e.entity_type,
        e.name,
        e.description,
        e.address,
        e.city,
        e.state,
        e.zip_code,
        e.phone,
        e.website,
        e.latitude,
        e.longitude,
        e.rating,
        e.review_count,
        e.is_verified,
        e.kosher_level,
        e.kosher_certification,
        e.denomination,
        e.store_type,
        e.created_at
      FROM entities e
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE WHEN LOWER(e.name) LIKE LOWER($1) THEN 1 ELSE 2 END,
        e.rating DESC,
        e.review_count DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    return await query(sql, queryParams);
  }

  static async create(data) {
    const {
      entityType,
      name,
      description,
      longDescription,
      ownerId,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      whatsappUrl,
      tiktokUrl,
      youtubeUrl,
      snapchatUrl,
      linkedinUrl,
      latitude,
      longitude,
      kosherLevel,
      kosherCertification,
      kosherCertificateNumber,
      kosherExpiresAt,
      denomination,
      storeType,
      services,
    } = data;

    const sql = `
      INSERT INTO entities (
        entity_type, name, description, long_description, owner_id,
        address, city, state, zip_code, phone, email, website,
        facebook_url, instagram_url, twitter_url, whatsapp_url,
        tiktok_url, youtube_url, snapchat_url, linkedin_url,
        latitude, longitude, kosher_level, kosher_certification,
        kosher_certificate_number, kosher_expires_at, denomination,
        store_type, services
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27, $28, $29
      ) RETURNING *
    `;

    const values = [
      entityType,
      name,
      description,
      longDescription,
      ownerId,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      whatsappUrl,
      tiktokUrl,
      youtubeUrl,
      snapchatUrl,
      linkedinUrl,
      latitude,
      longitude,
      kosherLevel,
      kosherCertification,
      kosherCertificateNumber,
      kosherExpiresAt,
      denomination,
      storeType,
      services,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    paramCount++;
    values.push(id);

    const sql = `
      UPDATE entities 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    return result.rows[0];
  }

  static async delete(id) {
    const sql = `
      UPDATE entities 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await query(sql, [id]);
    return result.rows[0];
  }

  static async getBusinessHours(entityId) {
    const sql = `
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

    return await query(sql, [entityId]);
  }

  static async getImages(entityId) {
    const sql = `
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

    return await query(sql, [entityId]);
  }

  static async getReviews(entityId, params = {}) {
    const { limit = 20, offset = 0 } = params;

    const sql = `
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

    return await query(sql, [entityId, limit, offset]);
  }

  static async getNearby(
    latitude,
    longitude,
    radiusKm = 10,
    entityType = null,
  ) {
    const sql = `
      SELECT 
        e.id,
        e.entity_type,
        e.name,
        e.description,
        e.address,
        e.city,
        e.state,
        e.latitude,
        e.longitude,
        e.rating,
        e.review_count,
        e.is_verified,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(e.latitude)) * 
            cos(radians(e.longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(e.latitude))
          )
        ) as distance_km
      FROM entities e
      WHERE e.is_active = true
        AND e.latitude IS NOT NULL 
        AND e.longitude IS NOT NULL
        AND (
          6371 * acos(
            cos(radians($1)) * cos(radians(e.latitude)) * 
            cos(radians(e.longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(e.latitude))
          )
        ) <= $3
        ${entityType ? 'AND e.entity_type = $4' : ''}
      ORDER BY distance_km ASC
      LIMIT 50
    `;

    const params = entityType
      ? [latitude, longitude, radiusKm, entityType]
      : [latitude, longitude, radiusKm];
    return await query(sql, params);
  }
}

module.exports = Entity;
