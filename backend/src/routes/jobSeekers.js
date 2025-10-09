const express = require('express');
const router = express.Router();
const db = require('../database/connection');
const logger = require('../utils/logger');

/**
 * GET /api/job-seekers
 * Get all active job seekers with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      city = '',
      state = '',
      experience_level = '',
      availability = '',
      skills = '',
      job_types = '',
      industries = '',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = req.query;

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereConditions = ['js.is_active = true'];
    let queryParams = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      whereConditions.push(`(
        js.full_name ILIKE $${paramCount} OR 
        js.title ILIKE $${paramCount} OR 
        js.summary ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    // Location filters
    if (city) {
      paramCount++;
      whereConditions.push(`js.city ILIKE $${paramCount}`);
      queryParams.push(`%${city}%`);
    }

    if (state) {
      paramCount++;
      whereConditions.push(`js.state ILIKE $${paramCount}`);
      queryParams.push(`%${state}%`);
    }

    // Experience level filter
    if (experience_level) {
      paramCount++;
      whereConditions.push(`js.experience_level = $${paramCount}`);
      queryParams.push(experience_level);
    }

    // Availability filter
    if (availability) {
      paramCount++;
      whereConditions.push(`js.availability = $${paramCount}`);
      queryParams.push(availability);
    }

    // Skills filter (array contains)
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      paramCount++;
      whereConditions.push(`js.skills && $${paramCount}`);
      queryParams.push(skillsArray);
    }

    // Job types filter
    if (job_types) {
      const jobTypesArray = job_types.split(',').map(t => t.trim());
      paramCount++;
      whereConditions.push(`js.desired_job_types && $${paramCount}`);
      queryParams.push(jobTypesArray);
    }

    // Industries filter
    if (industries) {
      const industriesArray = industries.split(',').map(i => i.trim());
      paramCount++;
      whereConditions.push(`js.desired_industries && $${paramCount}`);
      queryParams.push(industriesArray);
    }

    // Build ORDER BY clause
    const validSortColumns = [
      'created_at',
      'updated_at',
      'full_name',
      'title',
      'experience_years',
      'view_count',
    ];
    const validSortOrders = ['asc', 'desc'];

    const sortColumn = validSortColumns.includes(sort_by)
      ? sort_by
      : 'created_at';
    const sortOrder = validSortOrders.includes(sort_order.toLowerCase())
      ? sort_order.toUpperCase()
      : 'DESC';

    // Build the main query
    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(' AND ')}`
        : '';

    const query = `
      SELECT 
        js.id,
        js.full_name,
        js.title,
        js.summary,
        js.email,
        js.phone,
        js.linkedin_url,
        js.portfolio_url,
        js.resume_url,
        js.city,
        js.state,
        js.zip_code,
        js.country,
        js.is_remote_ok,
        js.willing_to_relocate,
        js.experience_years,
        js.experience_level,
        js.skills,
        js.qualifications,
        js.languages,
        js.desired_job_types,
        js.desired_industries,
        js.desired_salary_min,
        js.desired_salary_max,
        js.availability,
        js.kosher_environment_preferred,
        js.shabbat_observant,
        js.jewish_organization_preferred,
        js.is_featured,
        js.is_verified,
        js.profile_completion_percentage,
        js.view_count,
        js.contact_count,
        js.created_at,
        js.updated_at,
        js.last_active_at
      FROM job_seekers js
      ${whereClause}
      ORDER BY js.${sortColumn} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(parseInt(limit, 10), parseInt(offset, 10));

    logger.debug('Job seekers query:', query);
    logger.debug('Query params:', queryParams);

    const result = await db.query(query, queryParams);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM job_seekers js
      ${whereClause}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit and offset
    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);

    res.json({
      success: true,
      data: {
        job_seekers: result.rows,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching job seekers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job seekers',
    });
  }
});

/**
 * GET /api/job-seekers/:id
 * Get a specific job seeker by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        js.*,
        COUNT(jsa.id) as application_count
      FROM job_seekers js
      LEFT JOIN job_seeker_applications jsa ON js.id = jsa.job_seeker_id
      WHERE js.id = $1 AND js.is_active = true
      GROUP BY js.id
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job seeker not found',
      });
    }

    // Increment view count
    await db.query(
      'UPDATE job_seekers SET view_count = view_count + 1 WHERE id = $1',
      [id],
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching job seeker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job seeker',
    });
  }
});

/**
 * POST /api/job-seekers
 * Create a new job seeker profile
 */
router.post('/', async (req, res) => {
  try {
    const {
      full_name,
      title,
      summary,
      email,
      phone,
      linkedin_url,
      portfolio_url,
      city,
      state,
      zip_code,
      country = 'USA',
      is_remote_ok = false,
      willing_to_relocate = false,
      experience_years = 0,
      experience_level = 'entry',
      skills = [],
      qualifications = [],
      languages = [],
      desired_job_types = [],
      desired_industries = [],
      desired_salary_min,
      desired_salary_max,
      availability = 'immediate',
      kosher_environment_preferred = false,
      shabbat_observant = false,
      jewish_organization_preferred = false,
      // New enhanced fields
      age,
      gender,
      headshot_url,
      bio,
      meeting_link,
    } = req.body;

    // Calculate profile completion percentage
    const profileFields = [
      full_name,
      title,
      summary,
      email,
      phone,
      linkedin_url,
      city,
      state,
      skills,
      qualifications,
      desired_job_types,
    ];
    const completedFields = profileFields.filter(
      field =>
        field &&
        (Array.isArray(field)
          ? field.length > 0
          : field.toString().trim() !== ''),
    ).length;
    const profile_completion_percentage = Math.round(
      (completedFields / profileFields.length) * 100,
    );

    const query = `
      INSERT INTO job_seekers (
        full_name, title, summary, email, phone, linkedin_url, portfolio_url,
        city, state, zip_code, country, is_remote_ok, willing_to_relocate,
        experience_years, experience_level, skills, qualifications, languages,
        desired_job_types, desired_industries, desired_salary_min, desired_salary_max,
        availability, kosher_environment_preferred, shabbat_observant,
        jewish_organization_preferred, profile_completion_percentage,
        age, gender, headshot_url, bio, meeting_link
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
      )
      RETURNING *
    `;

    const values = [
      full_name,
      title,
      summary,
      email,
      phone,
      linkedin_url,
      portfolio_url,
      city,
      state,
      zip_code,
      country,
      is_remote_ok,
      willing_to_relocate,
      experience_years,
      experience_level,
      skills,
      qualifications,
      languages,
      desired_job_types,
      desired_industries,
      desired_salary_min,
      desired_salary_max,
      availability,
      kosher_environment_preferred,
      shabbat_observant,
      jewish_organization_preferred,
      profile_completion_percentage,
      age,
      gender,
      headshot_url,
      bio,
      meeting_link,
    ];

    const result = await db.query(query, values);

    logger.debug('Created job seeker profile:', result.rows[0]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error creating job seeker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job seeker profile',
    });
  }
});

/**
 * PUT /api/job-seekers/:id
 * Update a job seeker profile
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 0;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE job_seekers 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job seeker not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error updating job seeker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job seeker profile',
    });
  }
});

/**
 * DELETE /api/job-seekers/:id
 * Soft delete a job seeker profile
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE job_seekers 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job seeker not found',
      });
    }

    res.json({
      success: true,
      message: 'Job seeker profile deactivated',
    });
  } catch (error) {
    logger.error('Error deleting job seeker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job seeker profile',
    });
  }
});

/**
 * POST /api/job-seekers/:id/mark-found-work
 * Mark job seeker as found work
 */
router.post('/:id/mark-found-work', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await db.query(
      'UPDATE job_seekers SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['found_work', id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job seeker not found',
      });
    }

    // Archive the listing
    await db.query(
      'INSERT INTO job_seeker_archives (job_seeker_id, archived_reason, archived_at, notes) VALUES ($1, $2, CURRENT_TIMESTAMP, $3)',
      [id, 'found_work', notes],
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Job seeker marked as found work',
    });
  } catch (error) {
    logger.error('Error marking job seeker as found work:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark job seeker as found work',
    });
  }
});

/**
 * POST /api/job-seekers/:id/repost
 * Repost a job seeker listing
 */
router.post('/:id/repost', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT repost_job_seeker($1) as new_seeker_id',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Failed to repost job seeker listing',
      });
    }

    const newSeekerId = result.rows[0].new_seeker_id;

    // Get the new job seeker details
    const newSeeker = await db.query(
      'SELECT * FROM job_seekers WHERE id = $1',
      [newSeekerId],
    );

    res.json({
      success: true,
      data: newSeeker.rows[0],
      message: 'Job seeker listing reposted successfully',
    });
  } catch (error) {
    logger.error('Error reposting job seeker listing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to repost job seeker listing',
    });
  }
});

/**
 * GET /api/job-seekers/user/:user_id/limits
 * Get job seeker limits for a user
 */
router.get('/user/:user_id/limits', async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await db.query(
      'SELECT * FROM job_seeker_limits WHERE user_id = $1',
      [user_id],
    );

    if (result.rows.length === 0) {
      // Create default limits if none exist
      await db.query(
        'INSERT INTO job_seeker_limits (user_id, has_active_listing) VALUES ($1, FALSE)',
        [user_id],
      );

      const newResult = await db.query(
        'SELECT * FROM job_seeker_limits WHERE user_id = $1',
        [user_id],
      );

      return res.json({
        success: true,
        data: newResult.rows[0],
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    logger.error('Error fetching job seeker limits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job seeker limits',
    });
  }
});

module.exports = router;
