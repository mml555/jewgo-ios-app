const db = require('../database/connection');
const logger = require('../utils/logger');

class JobApplicationsController {
  // ============================================================================
  // APPLICATIONS - SUBMIT
  // ============================================================================

  static async submitApplication(req, res) {
    const client = await db.connect();
    try {
      const { jobListingId } = req.params;
      const applicantId = req.user.id;
      const { coverLetter, resumeUrl, portfolioUrl, answers } = req.body;

      await client.query('BEGIN');

      // Check if job listing exists and is active
      const jobCheck = await client.query(
        'SELECT id, employer_id FROM job_listings WHERE id = $1 AND status = $2 AND expires_at > NOW()',
        [jobListingId, 'active'],
      );

      if (jobCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Job listing not found or no longer accepting applications',
          code: 'JOB_NOT_FOUND',
        });
      }

      // Check if already applied
      const existingApp = await client.query(
        'SELECT id FROM job_applications WHERE job_listing_id = $1 AND applicant_id = $2',
        [jobListingId, applicantId],
      );

      if (existingApp.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Already applied to this job',
          code: 'ALREADY_APPLIED',
        });
      }

      // Create application
      const result = await client.query(
        `INSERT INTO job_applications (
          job_listing_id, applicant_id, cover_letter, resume_url,
          portfolio_url, answers
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          jobListingId,
          applicantId,
          coverLetter,
          resumeUrl,
          portfolioUrl,
          JSON.stringify(answers || {}),
        ],
      );

      // Update application count
      await client.query(
        'UPDATE job_listings SET application_count = application_count + 1 WHERE id = $1',
        [jobListingId],
      );

      await client.query('COMMIT');

      logger.info(
        `Application submitted: ${result.rows[0].id} for job ${jobListingId} by user ${applicantId}`,
      );

      res.status(201).json({
        success: true,
        application: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error submitting application:', error);
      res.status(500).json({ error: error.message, code: 'APPLICATION_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // APPLICATIONS - GET FOR JOB (Employer View)
  // ============================================================================

  static async getJobApplications(req, res) {
    try {
      const { jobListingId } = req.params;
      const employerId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      // Verify ownership
      const jobCheck = await db.query(
        'SELECT employer_id FROM job_listings WHERE id = $1',
        [jobListingId],
      );

      if (jobCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });
      }

      if (jobCheck.rows[0].employer_id !== employerId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Get applications
      let query = `
        SELECT 
          ja.*,
          u.first_name,
          u.last_name,
          u.email,
          jsp.name as seeker_name,
          jsp.headshot_url,
          jsp.bio,
          jsp.skills,
          jsp.experience_level_id
        FROM job_applications ja
        JOIN users u ON ja.applicant_id = u.id
        LEFT JOIN job_seeker_profiles jsp ON ja.applicant_id = jsp.user_id
        WHERE ja.job_listing_id = $1
      `;

      const params = [jobListingId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND ja.status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY ja.applied_at DESC';
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ applications: result.rows });
    } catch (error) {
      logger.error('Error getting job applications:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // APPLICATIONS - GET MY APPLICATIONS (Applicant View)
  // ============================================================================

  static async getMyApplications(req, res) {
    try {
      const applicantId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      let query = `
        SELECT 
          ja.*,
          jl.job_title,
          jl.company_name,
          jl.company_logo_url,
          jl.status as job_status,
          ji.name as industry_name,
          jt.name as job_type_name
        FROM job_applications ja
        JOIN job_listings jl ON ja.job_listing_id = jl.id
        JOIN job_industries ji ON jl.industry_id = ji.id
        JOIN job_types jt ON jl.job_type_id = jt.id
        WHERE ja.applicant_id = $1
      `;

      const params = [applicantId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND ja.status = $${paramCount}`;
        params.push(status);
      }

      query += ' ORDER BY ja.applied_at DESC';
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ applications: result.rows });
    } catch (error) {
      logger.error('Error getting my applications:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // APPLICATIONS - UPDATE STATUS (Employer)
  // ============================================================================

  static async updateApplicationStatus(req, res) {
    const client = await db.connect();
    try {
      const { applicationId } = req.params;
      const employerId = req.user.id;
      const { status, employerNotes, interviewScheduledAt } = req.body;

      const validStatuses = [
        'pending',
        'reviewed',
        'shortlisted',
        'interviewed',
        'offered',
        'hired',
        'rejected',
      ];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          code: 'INVALID_STATUS',
        });
      }

      await client.query('BEGIN');

      // Verify ownership
      const appCheck = await client.query(
        `SELECT ja.*, jl.employer_id 
         FROM job_applications ja
         JOIN job_listings jl ON ja.job_listing_id = jl.id
         WHERE ja.id = $1`,
        [applicationId],
      );

      if (appCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Application not found', code: 'APP_NOT_FOUND' });
      }

      if (appCheck.rows[0].employer_id !== employerId) {
        await client.query('ROLLBACK');
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Update application
      const result = await client.query(
        `UPDATE job_applications 
         SET status = $1, 
             employer_notes = COALESCE($2, employer_notes),
             interview_scheduled_at = COALESCE($3, interview_scheduled_at),
             reviewed_at = CASE WHEN $1 IN ('reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected') THEN NOW() ELSE reviewed_at END,
             status_changed_at = NOW(),
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, employerNotes, interviewScheduledAt, applicationId],
      );

      await client.query('COMMIT');

      logger.info(
        `Application status updated: ${applicationId} to ${status} by employer ${employerId}`,
      );

      res.json({
        success: true,
        application: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating application status:', error);
      res.status(500).json({ error: error.message, code: 'UPDATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // APPLICATIONS - WITHDRAW (Applicant)
  // ============================================================================

  static async withdrawApplication(req, res) {
    try {
      const { applicationId } = req.params;
      const applicantId = req.user.id;

      // Verify ownership
      const appCheck = await db.query(
        'SELECT applicant_id FROM job_applications WHERE id = $1',
        [applicationId],
      );

      if (appCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Application not found', code: 'APP_NOT_FOUND' });
      }

      if (appCheck.rows[0].applicant_id !== applicantId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Update to withdrawn
      const result = await db.query(
        `UPDATE job_applications 
         SET status = 'withdrawn', status_changed_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [applicationId],
      );

      logger.info(
        `Application withdrawn: ${applicationId} by applicant ${applicantId}`,
      );

      res.json({
        success: true,
        application: result.rows[0],
      });
    } catch (error) {
      logger.error('Error withdrawing application:', error);
      res.status(500).json({ error: error.message, code: 'WITHDRAW_ERROR' });
    }
  }

  // ============================================================================
  // APPLICATIONS - GET STATISTICS (Employer)
  // ============================================================================

  static async getApplicationStatistics(req, res) {
    try {
      const { jobListingId } = req.params;
      const employerId = req.user.id;

      // Verify ownership
      const jobCheck = await db.query(
        'SELECT employer_id FROM job_listings WHERE id = $1',
        [jobListingId],
      );

      if (jobCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });
      }

      if (jobCheck.rows[0].employer_id !== employerId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Get statistics
      const stats = await db.query(
        `SELECT 
          COUNT(*) as total_applications,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed_count,
          COUNT(CASE WHEN status = 'shortlisted' THEN 1 END) as shortlisted_count,
          COUNT(CASE WHEN status = 'interviewed' THEN 1 END) as interviewed_count,
          COUNT(CASE WHEN status = 'offered' THEN 1 END) as offered_count,
          COUNT(CASE WHEN status = 'hired' THEN 1 END) as hired_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN status = 'withdrawn' THEN 1 END) as withdrawn_count
        FROM job_applications
        WHERE job_listing_id = $1`,
        [jobListingId],
      );

      res.json({ statistics: stats.rows[0] });
    } catch (error) {
      logger.error('Error getting application statistics:', error);
      res.status(500).json({ error: error.message, code: 'STATS_ERROR' });
    }
  }
}

module.exports = JobApplicationsController;
