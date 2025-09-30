const { Pool } = require('pg');
const pool = require('../database/connection');

class JobsController {
  // Get all jobs with filtering
  static async getAllJobs(req, res) {
    try {
      const {
        city,
        state,
        jobType,
        locationType,
        isRemote,
        category,
        isUrgent,
        isActive,
        compensationType,
        minCompensation,
        maxCompensation,
        experienceLevel,
        jewishOrganization,
        kosherEnvironment,
        shabbatObservant,
        limit = 50,
        offset = 0,
        sortBy = 'posted_date',
        sortOrder = 'DESC'
      } = req.query;

      let query = `
        SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as poster_name,
          u.email as poster_email
        FROM jobs j
        LEFT JOIN users u ON j.poster_id = u.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      // Add filters
      if (city) {
        paramCount++;
        query += ` AND j.city ILIKE $${paramCount}`;
        params.push(`%${city}%`);
      }
      
      if (state) {
        paramCount++;
        query += ` AND j.state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }
      
      if (jobType) {
        paramCount++;
        query += ` AND j.job_type = $${paramCount}`;
        params.push(jobType);
      }
      
      if (locationType) {
        paramCount++;
        query += ` AND j.location_type = $${paramCount}`;
        params.push(locationType);
      }
      
      if (isRemote !== undefined) {
        paramCount++;
        query += ` AND j.is_remote = $${paramCount}`;
        params.push(isRemote === 'true');
      }
      
      if (category) {
        paramCount++;
        query += ` AND j.category = $${paramCount}`;
        params.push(category);
      }
      
      if (isUrgent !== undefined) {
        paramCount++;
        query += ` AND j.is_urgent = $${paramCount}`;
        params.push(isUrgent === 'true');
      }
      
      if (isActive !== undefined) {
        paramCount++;
        query += ` AND j.is_active = $${paramCount}`;
        params.push(isActive === 'true');
      } else {
        // By default, only show active jobs
        query += ` AND j.is_active = true`;
      }
      
      if (compensationType) {
        paramCount++;
        query += ` AND j.compensation_type = $${paramCount}`;
        params.push(compensationType);
      }
      
      if (minCompensation) {
        paramCount++;
        query += ` AND j.compensation_min >= $${paramCount}`;
        params.push(parseFloat(minCompensation));
      }
      
      if (maxCompensation) {
        paramCount++;
        query += ` AND j.compensation_max <= $${paramCount}`;
        params.push(parseFloat(maxCompensation));
      }
      
      if (experienceLevel) {
        paramCount++;
        query += ` AND j.experience_level = $${paramCount}`;
        params.push(experienceLevel);
      }
      
      if (jewishOrganization !== undefined) {
        paramCount++;
        query += ` AND j.jewish_organization = $${paramCount}`;
        params.push(jewishOrganization === 'true');
      }
      
      if (kosherEnvironment !== undefined) {
        paramCount++;
        query += ` AND j.kosher_environment = $${paramCount}`;
        params.push(kosherEnvironment === 'true');
      }
      
      if (shabbatObservant !== undefined) {
        paramCount++;
        query += ` AND j.shabbat_observant = $${paramCount}`;
        params.push(shabbatObservant === 'true');
      }

      // Add sorting
      const validSortColumns = ['posted_date', 'title', 'compensation_min', 'created_at', 'view_count'];
      const validSortOrders = ['ASC', 'DESC'];
      const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'posted_date';
      const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
      
      query += ` ORDER BY j.${sortColumn} ${sortDirection}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));
      
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch jobs',
        message: error.message
      });
    }
  }

  // Get single job by ID
  static async getJobById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          j.*,
          u.first_name || ' ' || u.last_name as poster_name,
          u.email as poster_email,
          u.phone as poster_phone
        FROM jobs j
        LEFT JOIN users u ON j.poster_id = u.id
        WHERE j.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Increment view count
      await pool.query(
        'UPDATE jobs SET view_count = view_count + 1 WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch job',
        message: error.message
      });
    }
  }

  // Create new job
  static async createJob(req, res) {
    try {
      const {
        title,
        description,
        company_name,
        poster_id,
        location_type = 'on-site',
        is_remote = false,
        city,
        state,
        zip_code,
        address,
        latitude,
        longitude,
        compensation_type = 'hourly',
        compensation_min,
        compensation_max,
        compensation_currency = 'USD',
        compensation_display,
        job_type = 'full-time',
        category,
        tags = [],
        requirements = [],
        qualifications = [],
        experience_level,
        benefits = [],
        schedule,
        start_date,
        contact_email,
        contact_phone,
        application_url,
        kosher_environment = false,
        shabbat_observant = false,
        jewish_organization = false,
        is_urgent = false,
        expires_date
      } = req.body;

      // Validate required fields
      if (!title || !description || !poster_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: title, description, poster_id'
        });
      }

      const query = `
        INSERT INTO jobs (
          title, description, company_name, poster_id,
          location_type, is_remote, city, state, zip_code, address,
          latitude, longitude,
          compensation_type, compensation_min, compensation_max,
          compensation_currency, compensation_display,
          job_type, category, tags,
          requirements, qualifications, experience_level,
          benefits, schedule, start_date,
          contact_email, contact_phone, application_url,
          kosher_environment, shabbat_observant, jewish_organization,
          is_urgent, expires_date
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34
        )
        RETURNING *
      `;

      const values = [
        title, description, company_name, poster_id,
        location_type, is_remote, city, state, zip_code, address,
        latitude, longitude,
        compensation_type, compensation_min, compensation_max,
        compensation_currency, compensation_display,
        job_type, category, tags,
        requirements, qualifications, experience_level,
        benefits, schedule, start_date,
        contact_email, contact_phone, application_url,
        kosher_environment, shabbat_observant, jewish_organization,
        is_urgent, expires_date
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Job created successfully'
      });
    } catch (error) {
      console.error('Error creating job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create job',
        message: error.message
      });
    }
  }

  // Update job
  static async updateJob(req, res) {
    try {
      const { id } = req.params;
      const updateFields = req.body;

      // Build dynamic update query
      const allowedFields = [
        'title', 'description', 'company_name',
        'location_type', 'is_remote', 'city', 'state', 'zip_code', 'address',
        'latitude', 'longitude',
        'compensation_type', 'compensation_min', 'compensation_max',
        'compensation_currency', 'compensation_display',
        'job_type', 'category', 'tags',
        'requirements', 'qualifications', 'experience_level',
        'benefits', 'schedule', 'start_date',
        'contact_email', 'contact_phone', 'application_url',
        'kosher_environment', 'shabbat_observant', 'jewish_organization',
        'is_active', 'is_urgent', 'is_featured', 'expires_date'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateFields).forEach(field => {
        if (allowedFields.includes(field)) {
          paramCount++;
          updates.push(`${field} = $${paramCount}`);
          values.push(updateFields[field]);
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      paramCount++;
      values.push(id);

      const query = `
        UPDATE jobs
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Job updated successfully'
      });
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update job',
        message: error.message
      });
    }
  }

  // Delete job
  static async deleteJob(req, res) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM jobs WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        message: 'Job deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete job',
        message: error.message
      });
    }
  }

  // Get job categories
  static async getJobCategories(req, res) {
    try {
      const query = `
        SELECT DISTINCT category, COUNT(*) as count
        FROM jobs
        WHERE category IS NOT NULL AND is_active = true
        GROUP BY category
        ORDER BY count DESC, category ASC
      `;

      const result = await pool.query(query);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching job categories:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch job categories',
        message: error.message
      });
    }
  }

  // Apply for a job
  static async applyForJob(req, res) {
    try {
      const { id } = req.params;
      const { applicant_id, cover_letter, resume_url } = req.body;

      if (!applicant_id) {
        return res.status(400).json({
          success: false,
          error: 'applicant_id is required'
        });
      }

      // Check if job exists and is active
      const jobCheck = await pool.query(
        'SELECT id, is_active FROM jobs WHERE id = $1',
        [id]
      );

      if (jobCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      if (!jobCheck.rows[0].is_active) {
        return res.status(400).json({
          success: false,
          error: 'This job is no longer accepting applications'
        });
      }

      const query = `
        INSERT INTO job_applications (job_id, applicant_id, cover_letter, resume_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const result = await pool.query(query, [id, applicant_id, cover_letter, resume_url]);

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Application submitted successfully'
      });
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({
          success: false,
          error: 'You have already applied for this job'
        });
      }
      
      console.error('Error applying for job:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit application',
        message: error.message
      });
    }
  }

  // Get applications for a job
  static async getJobApplications(req, res) {
    try {
      const { id } = req.params;
      const { status, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT 
          a.*,
          u.first_name || ' ' || u.last_name as applicant_name,
          u.email as applicant_email,
          u.phone as applicant_phone
        FROM job_applications a
        LEFT JOIN users u ON a.applicant_id = u.id
        WHERE a.job_id = $1
      `;
      const params = [id];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND a.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY a.applied_at DESC`;

      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching job applications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications',
        message: error.message
      });
    }
  }
}

module.exports = JobsController;
