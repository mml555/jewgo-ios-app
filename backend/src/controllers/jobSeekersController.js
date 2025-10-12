const db = require('../database/connection');
const logger = require('../utils/logger');

class JobSeekersController {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static async getLocationData(zipCode) {
    // Placeholder for geocoding service
    return {
      city: null,
      state: null,
      latitude: null,
      longitude: null,
    };
  }

  // ============================================================================
  // JOB SEEKER PROFILES - CREATE
  // ============================================================================

  static async createJobSeekerProfile(req, res) {
    const client = await db.connect();
    try {
      const userId = req.user.id;
      const {
        name,
        age,
        gender,
        preferredIndustryId,
        preferredJobTypeId,
        experienceLevelId,
        zipCode,
        willingToRelocate,
        willingToRemote,
        headshotUrl,
        bio,
        resumeUrl,
        skills,
        languages,
        certifications,
        meetingLink,
        contactEmail,
        contactPhone,
        linkedinUrl,
        portfolioUrl,
        desiredSalaryMin,
        desiredSalaryMax,
        desiredHourlyRateMin,
        desiredHourlyRateMax,
        availability,
      } = req.body;

      // Validate required fields
      if (!name || !zipCode || !contactEmail) {
        return res.status(400).json({
          error: 'Missing required fields: name, zipCode, contactEmail',
          code: 'MISSING_FIELDS',
        });
      }

      await client.query('BEGIN');

      // Check if user already has a profile
      const existingProfile = await client.query(
        'SELECT id FROM job_seeker_profiles WHERE user_id = $1',
        [userId],
      );

      if (existingProfile.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'User already has a job seeker profile',
          code: 'PROFILE_EXISTS',
        });
      }

      // Get location data
      const locationData = await this.getLocationData(zipCode);

      // Create profile
      const result = await client.query(
        `INSERT INTO job_seeker_profiles (
          user_id, name, age, gender, preferred_industry_id, preferred_job_type_id,
          experience_level_id, zip_code, city, state, latitude, longitude,
          willing_to_relocate, willing_to_remote, headshot_url, bio, resume_url,
          skills, languages, certifications, meeting_link, contact_email,
          contact_phone, linkedin_url, portfolio_url, desired_salary_min,
          desired_salary_max, desired_hourly_rate_min, desired_hourly_rate_max,
          availability
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
        RETURNING *`,
        [
          userId,
          name,
          age,
          gender,
          preferredIndustryId,
          preferredJobTypeId,
          experienceLevelId,
          zipCode,
          locationData.city,
          locationData.state,
          locationData.latitude,
          locationData.longitude,
          willingToRelocate || false,
          willingToRemote !== false,
          headshotUrl,
          bio,
          resumeUrl,
          JSON.stringify(skills || []),
          JSON.stringify(languages || []),
          JSON.stringify(certifications || []),
          meetingLink,
          contactEmail,
          contactPhone,
          linkedinUrl,
          portfolioUrl,
          desiredSalaryMin,
          desiredSalaryMax,
          desiredHourlyRateMin,
          desiredHourlyRateMax,
          availability || 'negotiable',
        ],
      );

      await client.query('COMMIT');

      logger.info(
        `Job seeker profile created: ${result.rows[0].id} by user ${userId}`,
      );

      res.status(201).json({
        success: true,
        profile: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating job seeker profile:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'PROFILE_CREATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // JOB SEEKER PROFILES - GET ALL
  // ============================================================================

  static async getJobSeekerProfiles(req, res) {
    try {
      const {
        industry,
        jobType,
        experienceLevel,
        gender,
        ageMin,
        ageMax,
        willingToRelocate,
        willingToRemote,
        search,
        lat,
        lng,
        radius = 25,
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = req.query;

      let query = `
        SELECT 
          jsp.*,
          ji.name as industry_name,
          ji.icon_name as industry_icon,
          jt.name as job_type_name,
          el.name as experience_level_name
        FROM job_seeker_profiles jsp
        LEFT JOIN job_industries ji ON jsp.preferred_industry_id = ji.id
        LEFT JOIN job_types jt ON jsp.preferred_job_type_id = jt.id
        LEFT JOIN experience_levels el ON jsp.experience_level_id = el.id
        WHERE jsp.status = 'active' AND jsp.expires_at > NOW()
      `;

      const params = [];
      let paramCount = 0;

      // Add filters
      if (industry) {
        paramCount++;
        query += ` AND ji.key = $${paramCount}`;
        params.push(industry);
      }

      if (jobType) {
        paramCount++;
        query += ` AND jt.key = $${paramCount}`;
        params.push(jobType);
      }

      if (experienceLevel) {
        paramCount++;
        query += ` AND el.key = $${paramCount}`;
        params.push(experienceLevel);
      }

      if (gender) {
        paramCount++;
        query += ` AND jsp.gender = $${paramCount}`;
        params.push(gender);
      }

      if (ageMin) {
        paramCount++;
        query += ` AND jsp.age >= $${paramCount}`;
        params.push(parseInt(ageMin, 10));
      }

      if (ageMax) {
        paramCount++;
        query += ` AND jsp.age <= $${paramCount}`;
        params.push(parseInt(ageMax, 10));
      }

      if (willingToRelocate === 'true') {
        query += ` AND jsp.willing_to_relocate = true`;
      }

      if (willingToRemote === 'true') {
        query += ` AND jsp.willing_to_remote = true`;
      }

      if (search) {
        paramCount++;
        query += ` AND (
          jsp.name ILIKE $${paramCount}
          OR jsp.bio ILIKE $${paramCount}
        )`;
        params.push(`%${search}%`);
      }

      // Location-based filtering
      if (lat && lng && radius) {
        paramCount++;
        query += ` AND (
          jsp.willing_to_remote = true OR
          (
            jsp.latitude IS NOT NULL AND jsp.longitude IS NOT NULL AND
            (3959 * acos(cos(radians($${paramCount})) * cos(radians(jsp.latitude)) * 
            cos(radians(jsp.longitude) - radians($${paramCount + 1})) + 
            sin(radians($${paramCount})) * sin(radians(jsp.latitude)))) <= $${
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
        'name',
        'view_count',
        'profile_completion_percentage',
      ];
      const sortColumn = validSortColumns.includes(sortBy)
        ? sortBy
        : 'created_at';
      const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      query += ` ORDER BY jsp.${sortColumn} ${validSortOrder}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const result = await db.query(query, params);

      res.json({
        success: true,
        data: {
          job_seekers: result.rows,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total: result.rows.length,
            pages: Math.ceil(result.rows.length / parseInt(limit, 10)),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting job seeker profiles:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'PROFILE_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // JOB SEEKER PROFILES - GET BY ID
  // ============================================================================

  static async getJobSeekerProfileById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      // Check if userId is a valid UUID (not a guest token)
      const isValidUUID = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

      const result = await db.query(
        `SELECT 
          jsp.*,
          ji.name as industry_name,
          jt.name as job_type_name,
          el.name as experience_level_name,
          ${
            isValidUUID
              ? `(SELECT COUNT(*) > 0 FROM saved_seeker_profiles WHERE employer_id = $2 AND job_seeker_profile_id = jsp.id) as is_saved`
              : 'false as is_saved'
          }
        FROM job_seeker_profiles jsp
        LEFT JOIN job_industries ji ON jsp.preferred_industry_id = ji.id
        LEFT JOIN job_types jt ON jsp.preferred_job_type_id = jt.id
        LEFT JOIN experience_levels el ON jsp.experience_level_id = el.id
        WHERE jsp.id = $1`,
        isValidUUID ? [id, userId] : [id],
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
      }

      // Increment view count
      await db.query(
        'UPDATE job_seeker_profiles SET view_count = view_count + 1 WHERE id = $1',
        [id],
      );

      res.json({ 
        success: true,
        data: result.rows[0] 
      });
    } catch (error) {
      logger.error('Error getting job seeker profile:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'PROFILE_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // JOB SEEKER PROFILES - UPDATE
  // ============================================================================

  static async updateJobSeekerProfile(req, res) {
    const client = await db.connect();
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      await client.query('BEGIN');

      // Verify ownership
      const ownerCheck = await client.query(
        'SELECT user_id FROM job_seeker_profiles WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].user_id !== userId) {
        await client.query('ROLLBACK');
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Build update query
      const allowedFields = [
        'name',
        'age',
        'gender',
        'preferred_industry_id',
        'preferred_job_type_id',
        'experience_level_id',
        'willing_to_relocate',
        'willing_to_remote',
        'headshot_url',
        'bio',
        'resume_url',
        'skills',
        'languages',
        'certifications',
        'meeting_link',
        'contact_email',
        'contact_phone',
        'linkedin_url',
        'portfolio_url',
        'desired_salary_min',
        'desired_salary_max',
        'desired_hourly_rate_min',
        'desired_hourly_rate_max',
        'availability',
        'status',
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
        UPDATE job_seeker_profiles 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);

      await client.query('COMMIT');

      logger.info(`Job seeker profile updated: ${id} by user ${userId}`);

      res.json({
        success: true,
        profile: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating job seeker profile:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'PROFILE_UPDATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // JOB SEEKER PROFILES - DELETE
  // ============================================================================

  static async deleteJobSeekerProfile(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const ownerCheck = await db.query(
        'SELECT user_id FROM job_seeker_profiles WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].user_id !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Soft delete
      await db.query(
        'UPDATE job_seeker_profiles SET status = $1, updated_at = NOW() WHERE id = $2',
        ['archived', id],
      );

      logger.info(`Job seeker profile deleted: ${id} by user ${userId}`);

      res.json({ success: true, message: 'Profile deleted successfully' });
    } catch (error) {
      logger.error('Error deleting job seeker profile:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'PROFILE_DELETE_ERROR' });
    }
  }

  // ============================================================================
  // JOB SEEKER PROFILES - GET MY PROFILE
  // ============================================================================

  static async getMyProfile(req, res) {
    try {
      const userId = req.user.id;

      const result = await db.query(
        `SELECT 
          jsp.*,
          ji.name as industry_name,
          jt.name as job_type_name,
          el.name as experience_level_name,
          (SELECT COUNT(*) FROM job_seeker_contacts WHERE job_seeker_profile_id = jsp.id) as total_contacts
        FROM job_seeker_profiles jsp
        LEFT JOIN job_industries ji ON jsp.preferred_industry_id = ji.id
        LEFT JOIN job_types jt ON jsp.preferred_job_type_id = jt.id
        LEFT JOIN experience_levels el ON jsp.experience_level_id = el.id
        WHERE jsp.user_id = $1`,
        [userId],
      );

      if (result.rows.length === 0) {
        return res.json({ profile: null });
      }

      res.json({ profile: result.rows[0] });
    } catch (error) {
      logger.error('Error getting my profile:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'PROFILE_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // JOB SEEKER CONTACTS - CREATE
  // ============================================================================

  static async contactJobSeeker(req, res) {
    const client = await db.connect();
    try {
      const { profileId } = req.params;
      const employerId = req.user.id;
      const { message, jobListingId } = req.body;

      await client.query('BEGIN');

      // Check if profile exists and is active
      const profileCheck = await client.query(
        'SELECT id FROM job_seeker_profiles WHERE id = $1 AND status = $2',
        [profileId, 'active'],
      );

      if (profileCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Profile not found', code: 'PROFILE_NOT_FOUND' });
      }

      // Create contact
      const result = await client.query(
        `INSERT INTO job_seeker_contacts (
          job_seeker_profile_id, employer_id, job_listing_id, message
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (job_seeker_profile_id, employer_id, job_listing_id)
        DO UPDATE SET message = $4, contacted_at = NOW()
        RETURNING *`,
        [profileId, employerId, jobListingId, message],
      );

      // Update contact count
      await client.query(
        'UPDATE job_seeker_profiles SET contact_count = contact_count + 1 WHERE id = $1',
        [profileId],
      );

      await client.query('COMMIT');

      logger.info(
        `Job seeker contacted: ${profileId} by employer ${employerId}`,
      );

      res.status(201).json({
        success: true,
        contact: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error contacting job seeker:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'CONTACT_CREATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // SAVED PROFILES - SAVE/UNSAVE
  // ============================================================================

  static async saveProfile(req, res) {
    try {
      const { profileId } = req.params;
      const employerId = req.user.id;
      const { notes } = req.body;

      const result = await db.query(
        `INSERT INTO saved_seeker_profiles (employer_id, job_seeker_profile_id, notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (employer_id, job_seeker_profile_id) DO NOTHING
         RETURNING *`,
        [employerId, profileId, notes],
      );

      res.json({
        success: true,
        saved: result.rows.length > 0,
      });
    } catch (error) {
      logger.error('Error saving profile:', error);
      res.status(500).json({ error: error.message, code: 'SAVE_ERROR' });
    }
  }

  static async unsaveProfile(req, res) {
    try {
      const { profileId } = req.params;
      const employerId = req.user.id;

      await db.query(
        'DELETE FROM saved_seeker_profiles WHERE employer_id = $1 AND job_seeker_profile_id = $2',
        [employerId, profileId],
      );

      res.json({ success: true });
    } catch (error) {
      logger.error('Error unsaving profile:', error);
      res.status(500).json({ error: error.message, code: 'UNSAVE_ERROR' });
    }
  }

  static async getMySavedProfiles(req, res) {
    try {
      const employerId = req.user.id;

      const result = await db.query(
        `SELECT 
          ssp.*,
          jsp.*,
          ji.name as industry_name,
          jt.name as job_type_name
        FROM saved_seeker_profiles ssp
        JOIN job_seeker_profiles jsp ON ssp.job_seeker_profile_id = jsp.id
        LEFT JOIN job_industries ji ON jsp.preferred_industry_id = ji.id
        LEFT JOIN job_types jt ON jsp.preferred_job_type_id = jt.id
        WHERE ssp.employer_id = $1
        ORDER BY ssp.created_at DESC`,
        [employerId],
      );

      res.json({ savedProfiles: result.rows });
    } catch (error) {
      logger.error('Error getting saved profiles:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }
}

module.exports = JobSeekersController;
