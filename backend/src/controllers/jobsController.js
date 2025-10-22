const db = require('../database/connection');
const logger = require('../utils/logger');

class JobsController {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static async getLocationData(zipCode) {
    // Use a geocoding service (Google Maps, HERE, etc.)
    // For now, returning placeholder. Replace with actual geocoding API
    return {
      city: null,
      state: null,
      latitude: null,
      longitude: null,
    };
  }

  static async calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ============================================================================
  // JOB LISTINGS - CREATE
  // ============================================================================

  static async createJobListing(req, res) {
    const client = await db.connect();
    try {
      const userId = req.user.id;
      const {
        jobTitle,
        industryId,
        jobTypeId,
        experienceLevelId,
        compensationStructureId,
        salaryMin,
        salaryMax,
        hourlyRateMin,
        hourlyRateMax,
        currency,
        showSalary,
        zipCode,
        isRemote,
        isHybrid,
        description,
        requirements,
        benefits,
        responsibilities,
        skills,
        ctaLink,
        contactEmail,
        contactPhone,
        companyName,
        companyWebsite,
        companyLogoUrl,
        businessEntityId,
      } = req.body;

      // Validate required fields
      if (
        !jobTitle ||
        !industryId ||
        !jobTypeId ||
        !compensationStructureId ||
        !zipCode ||
        !description
      ) {
        return res.status(400).json({
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
        });
      }

      await client.query('BEGIN');

      // Check user's active job listing count (max 2)
      const countResult = await client.query(
        'SELECT COUNT(*) FROM jobs WHERE poster_id = $1 AND is_active = $2',
        [userId, true],
      );

      if (parseInt(countResult.rows[0].count, 10) >= 2) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Maximum of 2 active job listings per account',
          code: 'LISTING_LIMIT_EXCEEDED',
        });
      }

      // Get location data
      const locationData = await this.getLocationData(zipCode);

      // Determine location_type
      let locationType = 'on-site';
      if (isRemote) {
        locationType = 'remote';
      } else if (isHybrid) {
        locationType = 'hybrid';
      }

      // Determine compensation_type and values
      let compensationType = 'salary';
      let compMin = null;
      let compMax = null;

      if (hourlyRateMin || hourlyRateMax) {
        compensationType = 'hourly';
        compMin = hourlyRateMin;
        compMax = hourlyRateMax;
      } else if (salaryMin || salaryMax) {
        compensationType = 'salary';
        compMin = salaryMin;
        compMax = salaryMax;
      }

      // Create job listing with all fields
      const result = await client.query(
        `INSERT INTO jobs (
          poster_id, title, company_name, company_website, company_logo_url,
          industry_id, job_type_id, experience_level_id, compensation_structure_id,
          compensation_type, compensation_min, compensation_max, compensation_currency,
          show_compensation, zip_code, city, state, latitude, longitude,
          is_remote, is_hybrid, location_type, description, requirements, benefits,
          responsibilities, skills, application_url, contact_email, contact_phone,
          business_entity_id, is_active, posted_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
        RETURNING *`,
        [
          userId,
          jobTitle,
          companyName,
          companyWebsite,
          companyLogoUrl,
          industryId,
          jobTypeId,
          experienceLevelId,
          compensationStructureId,
          compensationType,
          compMin,
          compMax,
          currency || 'USD',
          showSalary !== false, // Default to true if not specified
          zipCode,
          locationData.city,
          locationData.state,
          locationData.latitude,
          locationData.longitude,
          isRemote || false,
          isHybrid || false,
          locationType,
          description,
          requirements,
          benefits,
          responsibilities,
          JSON.stringify(skills || []),
          ctaLink,
          contactEmail,
          contactPhone,
          businessEntityId || null, // Optional link to business entity
          true, // is_active
          new Date(), // posted_date
        ],
      );

      await client.query('COMMIT');

      logger.info(
        `Job listing created: ${result.rows[0].id} by user ${userId}`,
      );

      res.status(201).json({
        success: true,
        jobListing: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating job listing:', error);
      res.status(500).json({ error: error.message, code: 'JOB_CREATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // JOB LISTINGS - GET ALL
  // ============================================================================

  static async getJobListings(req, res) {
    try {
      const {
        industry,
        jobType,
        experienceLevel,
        compensationStructure,
        isRemote,
        isHybrid,
        salaryMin,
        salaryMax,
        search,
        lat,
        lng,
        radius = 25,
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC',
        business_id,
        employer_id,
      } = req.query;

      let query = `
        SELECT 
          j.*,
          u.first_name as employer_first_name,
          u.last_name as employer_last_name,
          u.email as employer_email,
          ji.name as industry_name,
          ji.key as industry_key,
          jt.name as job_type_name,
          jt.key as job_type_key,
          el.name as experience_level_name,
          cs.name as compensation_structure_name,
          (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as total_applications
        FROM jobs j
        LEFT JOIN users u ON j.poster_id = u.id
        LEFT JOIN job_industries ji ON j.industry_id = ji.id
        LEFT JOIN job_types jt ON j.job_type_id = jt.id
        LEFT JOIN experience_levels el ON j.experience_level_id = el.id
        LEFT JOIN compensation_structures cs ON j.compensation_structure_id = cs.id
        WHERE j.is_active = true AND (j.expires_date IS NULL OR j.expires_date > NOW())
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (industry) {
        paramCount++;
        query += ` AND (j.industry_id = $${paramCount} OR ji.key = $${paramCount} OR j.category = $${paramCount})`;
        params.push(industry);
      }

      if (jobType) {
        paramCount++;
        query += ` AND (j.job_type_id = $${paramCount} OR jt.key = $${paramCount} OR j.job_type = $${paramCount})`;
        params.push(jobType);
      }

      if (experienceLevel) {
        paramCount++;
        query += ` AND (j.experience_level_id = $${paramCount} OR el.key = $${paramCount} OR j.experience_level = $${paramCount})`;
        params.push(experienceLevel);
      }

      if (compensationStructure) {
        paramCount++;
        query += ` AND (j.compensation_structure_id = $${paramCount} OR cs.key = $${paramCount} OR j.compensation_type = $${paramCount})`;
        params.push(compensationStructure);
      }

      if (isRemote === 'true') {
        query += ' AND j.is_remote = true';
      }

      if (isHybrid === 'true') {
        query += " AND j.location_type = 'hybrid'";
      }

      if (salaryMin) {
        paramCount++;
        query += ` AND (j.compensation_max IS NULL OR j.compensation_max >= $${paramCount})`;
        params.push(parseInt(salaryMin, 10));
      }

      if (salaryMax) {
        paramCount++;
        query += ` AND (j.compensation_min IS NULL OR j.compensation_min <= $${paramCount})`;
        params.push(parseInt(salaryMax, 10));
      }

      if (search) {
        paramCount++;
        query += ` AND (
          to_tsvector('english', j.title || ' ' || j.description) @@ plainto_tsquery('english', $${paramCount})
          OR j.title ILIKE $${paramCount + 1}
          OR j.company_name ILIKE $${paramCount + 1}
        )`;
        params.push(search, `%${search}%`);
        paramCount++;
      }

      // Filter by business entity (for displaying jobs on business listing pages)
      if (business_id) {
        paramCount++;
        query += ` AND j.business_entity_id = $${paramCount}`;
        params.push(business_id);
      }

      // Filter by employer/poster
      if (employer_id) {
        paramCount++;
        query += ` AND j.poster_id = $${paramCount}`;
        params.push(employer_id);
      }

      // Location-based filtering
      if (lat && lng && radius) {
        paramCount++;
        query += ` AND (
          j.is_remote = true OR
          (
            j.latitude IS NOT NULL AND j.longitude IS NOT NULL AND
            (3959 * acos(cos(radians($${paramCount})) * cos(radians(j.latitude)) * 
            cos(radians(j.longitude) - radians($${paramCount + 1})) + 
            sin(radians($${paramCount})) * sin(radians(j.latitude)))) <= $${
          paramCount + 2
        }
          )
        )`;
        params.push(parseFloat(lat), parseFloat(lng), parseInt(radius, 10));
        paramCount += 2;
      }

      // Add sorting
      const validSortColumns = [
        'created_at',
        'title',
        'compensation_max',
        'view_count',
        'application_count',
      ];
      const sortColumn = validSortColumns.includes(sortBy)
        ? sortBy
        : 'created_at';
      const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      query += ` ORDER BY j.${sortColumn} ${validSortOrder}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const result = await db.query(query, params);

      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) FROM jobs j
        WHERE j.is_active = true AND (j.expires_date IS NULL OR j.expires_date > NOW())
      `;

      const countResult = await db.query(countQuery);

      res.json({
        success: true,
        data: {
          listings: result.rows,
        },
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: parseInt(countResult.rows[0].count, 10),
          totalPages: Math.ceil(
            parseInt(countResult.rows[0].count, 10) / parseInt(limit, 10),
          ),
        },
      });
    } catch (error) {
      logger.error('Error getting job listings:', error);
      res.status(500).json({ error: error.message, code: 'JOB_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // JOB LISTINGS - GET BY ID
  // ============================================================================

  static async getJobListingById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      // Guest users have IDs like "guest_..." which aren't valid UUIDs
      const isGuestUser = userId && userId.startsWith('guest_');
      const validUserId = !isGuestUser ? userId : null;

      const result = await db.query(
        `SELECT 
          j.*,
          u.first_name as employer_first_name,
          u.last_name as employer_last_name,
          u.email as employer_email,
          (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as total_applications,
          false as is_saved,
          ${
            validUserId
              ? '(SELECT COUNT(*) > 0 FROM job_applications WHERE applicant_id = $2 AND job_id = j.id) as has_applied'
              : 'false as has_applied'
          }
        FROM jobs j
        LEFT JOIN users u ON j.poster_id = u.id
        WHERE j.id = $1`,
        validUserId ? [id, validUserId] : [id],
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Job listing not found', code: 'JOB_NOT_FOUND' });
      }

      // Increment view count
      await db.query(
        'UPDATE jobs SET view_count = view_count + 1 WHERE id = $1',
        [id],
      );

      res.json({ jobListing: result.rows[0] });
    } catch (error) {
      logger.error('Error getting job listing:', error);
      res.status(500).json({ error: error.message, code: 'JOB_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // JOB LISTINGS - UPDATE
  // ============================================================================

  static async updateJobListing(req, res) {
    const client = await db.connect();
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      await client.query('BEGIN');

      // Verify ownership
      const ownerCheck = await client.query(
        'SELECT poster_id FROM jobs WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Job listing not found', code: 'JOB_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].poster_id !== userId) {
        await client.query('ROLLBACK');
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Build update query
      const allowedFields = [
        'title',
        'company_name',
        'job_type',
        'compensation_type',
        'compensation_min',
        'compensation_max',
        'is_remote',
        'location_type',
        'description',
        'requirements',
        'benefits',
        'tags',
        'application_url',
        'contact_email',
        'contact_phone',
        'is_active',
      ];

      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(400)
          .json({ error: 'No valid fields to update', code: 'NO_UPDATES' });
      }

      paramCount++;
      updateValues.push(id);

      const query = `
        UPDATE jobs 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);

      await client.query('COMMIT');

      logger.info(`Job listing updated: ${id} by user ${userId}`);

      res.json({
        success: true,
        jobListing: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating job listing:', error);
      res.status(500).json({ error: error.message, code: 'JOB_UPDATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // JOB LISTINGS - DELETE
  // ============================================================================

  static async deleteJobListing(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const ownerCheck = await db.query(
        'SELECT poster_id FROM jobs WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Job listing not found', code: 'JOB_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].poster_id !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Soft delete by setting is_active to false
      await db.query(
        'UPDATE jobs SET is_active = $1, updated_at = NOW() WHERE id = $2',
        [false, id],
      );

      logger.info(`Job listing deleted: ${id} by user ${userId}`);

      res.json({ success: true, message: 'Job listing deleted successfully' });
    } catch (error) {
      logger.error('Error deleting job listing:', error);
      res.status(500).json({ error: error.message, code: 'JOB_DELETE_ERROR' });
    }
  }

  // ============================================================================
  // JOB LISTINGS - REPOST
  // ============================================================================

  static async repostJobListing(req, res) {
    const client = await db.connect();
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await client.query('BEGIN');

      // Verify ownership and status
      const jobCheck = await client.query(
        'SELECT * FROM jobs WHERE id = $1 AND poster_id = $2',
        [id, userId],
      );

      if (jobCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Job listing not found', code: 'JOB_NOT_FOUND' });
      }

      const job = jobCheck.rows[0];

      if (job.is_active === true) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Job listing is already active',
          code: 'JOB_ALREADY_ACTIVE',
        });
      }

      // Check listing limit
      const countResult = await client.query(
        'SELECT COUNT(*) FROM jobs WHERE poster_id = $1 AND is_active = $2',
        [userId, true],
      );

      if (parseInt(countResult.rows[0].count, 10) >= 2) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Maximum of 2 active job listings per account',
          code: 'LISTING_LIMIT_EXCEEDED',
        });
      }

      // Reactivate the job with new expiration date
      const result = await client.query(
        `UPDATE jobs 
         SET is_active = true, 
             expires_date = NOW() + INTERVAL '14 days',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id],
      );

      await client.query('COMMIT');

      logger.info(`Job listing reposted: ${id} by user ${userId}`);

      res.json({
        success: true,
        jobListing: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error reposting job listing:', error);
      res.status(500).json({ error: error.message, code: 'JOB_REPOST_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // JOB LISTINGS - MARK AS FILLED
  // ============================================================================

  static async markJobAsFilled(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const ownerCheck = await db.query(
        'SELECT poster_id FROM jobs WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Job listing not found', code: 'JOB_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].poster_id !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      const result = await db.query(
        `UPDATE jobs 
         SET is_active = false, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id],
      );

      logger.info(`Job listing marked as filled: ${id} by user ${userId}`);

      res.json({
        success: true,
        jobListing: result.rows[0],
      });
    } catch (error) {
      logger.error('Error marking job as filled:', error);
      res.status(500).json({ error: error.message, code: 'JOB_UPDATE_ERROR' });
    }
  }

  // ============================================================================
  // JOB LISTINGS - GET MY LISTINGS
  // ============================================================================

  static async getMyJobListings(req, res) {
    try {
      const userId = req.user.id;
      const { is_active, page = 1, limit = 20 } = req.query;

      let query = `
        SELECT 
          j.*,
          (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id) as total_applications,
          (SELECT COUNT(*) FROM job_applications WHERE job_id = j.id AND status = 'hired') as hired_count
        FROM jobs j
        WHERE j.poster_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (is_active !== undefined) {
        paramCount++;
        query += ` AND j.is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }

      query += ' ORDER BY j.created_at DESC';

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const result = await db.query(query, params);

      res.json({ jobListings: result.rows });
    } catch (error) {
      logger.error('Error getting my job listings:', error);
      res.status(500).json({ error: error.message, code: 'JOB_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // CONTINUE IN NEXT FILE DUE TO SIZE...
  // ============================================================================
}

module.exports = JobsController;
