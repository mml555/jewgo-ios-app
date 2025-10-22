const db = require('../database/connection');
const logger = require('../utils/logger');

class AdminController {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static async hasAdminPermission(adminId, permission) {
    const result = await db.query(
      `SELECT is_admin, admin_level, admin_permissions 
       FROM users 
       WHERE id = $1 AND is_admin = TRUE`,
      [adminId],
    );

    if (result.rows.length === 0) {
      return false;
    }

    const admin = result.rows[0];
    const permissions = admin.admin_permissions || {};

    // Super admins have all permissions
    if (admin.admin_level >= 3 || permissions.all === true) {
      return true;
    }

    return permissions[permission] === true;
  }

  static async logAdminAction(
    adminId,
    actionType,
    entityId,
    entityType,
    details = {},
  ) {
    await db.query(
      `INSERT INTO admin_actions (admin_id, action_type, entity_id, entity_type, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, actionType, entityId, entityType, JSON.stringify(details)],
    );
  }

  static getEntityTableName(entityType) {
    const tableMap = {
      special: 'specials',
      event: 'events',
      claim: 'listing_claims',
      job_listing: 'job_listings',
      job_seeker_profile: 'job_seeker_profiles',
    };
    return tableMap[entityType];
  }

  // ============================================================================
  // DASHBOARD - GET STATISTICS
  // ============================================================================

  static async getDashboard(req, res) {
    try {
      const adminId = req.user.id;

      if (!(await this.hasAdminPermission(adminId, 'view_dashboard'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      // Get dashboard stats
      const statsResult = await db.query(
        'SELECT * FROM get_admin_dashboard_stats()',
      );
      const stats = statsResult.rows[0];

      // Get recent actions
      const actionsResult = await db.query(
        `SELECT aa.*, u.first_name, u.last_name 
         FROM admin_actions aa
         LEFT JOIN users u ON aa.admin_id = u.id
         ORDER BY aa.created_at DESC 
         LIMIT 10`,
      );

      // Get performance metrics
      const performanceResult = await db.query(
        'SELECT * FROM get_admin_performance($1, 30)',
        [adminId],
      );

      res.json({
        dashboard: {
          statistics: stats,
          recentActions: actionsResult.rows,
          performance: performanceResult.rows[0] || {},
        },
      });
    } catch (error) {
      logger.error('Error getting admin dashboard:', error);
      res.status(500).json({ error: error.message, code: 'DASHBOARD_ERROR' });
    }
  }

  // ============================================================================
  // REVIEW QUEUE - GET ALL
  // ============================================================================

  static async getReviewQueue(req, res) {
    try {
      const adminId = req.user.id;
      const {
        entityType,
        status,
        priority,
        assignedTo,
        page = 1,
        limit = 20,
      } = req.query;

      if (!(await this.hasAdminPermission(adminId, 'review_content'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      let query = `
        SELECT 
          arq.*,
          u.first_name as assigned_admin_first_name,
          u.last_name as assigned_admin_last_name,
          CASE 
            WHEN arq.entity_type = 'special' THEN s.title
            WHEN arq.entity_type = 'event' THEN e.title
            WHEN arq.entity_type = 'claim' THEN lc.claimant_name
            WHEN arq.entity_type = 'job_listing' THEN jl.job_title
          END as entity_title
        FROM admin_review_queues arq
        LEFT JOIN users u ON arq.assigned_to = u.id
        LEFT JOIN specials s ON arq.entity_type = 'special' AND arq.entity_id = s.id
        LEFT JOIN events e ON arq.entity_type = 'event' AND arq.entity_id = e.id
        LEFT JOIN listing_claims lc ON arq.entity_type = 'claim' AND arq.entity_id = lc.id
        LEFT JOIN job_listings jl ON arq.entity_type = 'job_listing' AND arq.entity_id = jl.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (entityType) {
        paramCount++;
        query += ` AND arq.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      if (status) {
        paramCount++;
        query += ` AND arq.status = $${paramCount}`;
        params.push(status);
      }

      if (priority !== undefined) {
        paramCount++;
        query += ` AND arq.priority = $${paramCount}`;
        params.push(parseInt(priority, 10));
      }

      if (assignedTo) {
        paramCount++;
        query += ` AND arq.assigned_to = $${paramCount}`;
        params.push(assignedTo);
      }

      query += ' ORDER BY arq.priority DESC, arq.created_at ASC';
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ reviews: result.rows });
    } catch (error) {
      logger.error('Error getting review queue:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // REVIEW QUEUE - ASSIGN REVIEW
  // ============================================================================

  static async assignReview(req, res) {
    try {
      const { reviewId } = req.params;
      const { assignedTo } = req.body;
      const adminId = req.user.id;

      if (!(await this.hasAdminPermission(adminId, 'assign_reviews'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      const result = await db.query(
        `UPDATE admin_review_queues 
         SET assigned_to = $1, assigned_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [assignedTo, reviewId],
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Review not found', code: 'REVIEW_NOT_FOUND' });
      }

      await this.logAdminAction(
        adminId,
        'assign_review',
        reviewId,
        'admin_review_queue',
        {
          assigned_to: assignedTo,
        },
      );

      res.json({ success: true, review: result.rows[0] });
    } catch (error) {
      logger.error('Error assigning review:', error);
      res.status(500).json({ error: error.message, code: 'ASSIGN_ERROR' });
    }
  }

  // ============================================================================
  // REVIEW QUEUE - REVIEW CONTENT
  // ============================================================================

  static async reviewContent(req, res) {
    const client = await db.connect();
    try {
      const { reviewId } = req.params;
      const { action, adminNotes } = req.body;
      const adminId = req.user.id;

      if (!['approve', 'reject'].includes(action)) {
        return res
          .status(400)
          .json({ error: 'Invalid action', code: 'INVALID_ACTION' });
      }

      if (!(await this.hasAdminPermission(adminId, 'review_content'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      await client.query('BEGIN');

      const review = await client.query(
        'SELECT * FROM admin_review_queues WHERE id = $1 AND status = $2',
        [reviewId, 'pending'],
      );

      if (review.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Review not found', code: 'REVIEW_NOT_FOUND' });
      }

      const reviewData = review.rows[0];
      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // Update review queue
      await client.query(
        `UPDATE admin_review_queues 
         SET status = $1, reviewed_by = $2, reviewed_at = NOW(), admin_notes = $3
         WHERE id = $4`,
        [newStatus, adminId, adminNotes, reviewId],
      );

      // Update the actual entity
      const tableName = this.getEntityTableName(reviewData.entity_type);
      if (tableName) {
        await client.query(
          `UPDATE ${tableName} SET status = $1 WHERE id = $2`,
          [newStatus, reviewData.entity_id],
        );
      }

      // Log action
      await this.logAdminAction(
        adminId,
        action,
        reviewData.entity_id,
        reviewData.entity_type,
        {
          review_id: reviewId,
          notes: adminNotes,
        },
      );

      await client.query('COMMIT');

      res.json({ success: true, message: `Content ${action}d successfully` });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error reviewing content:', error);
      res.status(500).json({ error: error.message, code: 'REVIEW_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // CONTENT FLAGS - GET ALL
  // ============================================================================

  static async getContentFlags(req, res) {
    try {
      const adminId = req.user.id;
      const {
        status = 'pending',
        severity,
        entityType,
        page = 1,
        limit = 20,
      } = req.query;

      if (!(await this.hasAdminPermission(adminId, 'view_reports'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      let query = `
        SELECT 
          cf.*,
          u.first_name as reporter_first_name,
          u.last_name as reporter_last_name
        FROM content_flags cf
        LEFT JOIN users u ON cf.flagged_by = u.id
        WHERE cf.status = $1
      `;

      const params = [status];
      let paramCount = 1;

      if (severity) {
        paramCount++;
        query += ` AND cf.severity = $${paramCount}`;
        params.push(severity);
      }

      if (entityType) {
        paramCount++;
        query += ` AND cf.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      query += ' ORDER BY cf.severity DESC, cf.created_at ASC';
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ flags: result.rows });
    } catch (error) {
      logger.error('Error getting content flags:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // CONTENT FLAGS - FLAG CONTENT
  // ============================================================================

  static async flagContent(req, res) {
    const client = await db.connect();
    try {
      const { entityId, entityType } = req.params;
      const userId = req.user?.id;
      const { flagType, reason, severity, reporterEmail } = req.body;

      if (!flagType || !reason) {
        return res
          .status(400)
          .json({ error: 'Missing required fields', code: 'MISSING_FIELDS' });
      }

      await client.query('BEGIN');

      // Create flag
      const flagResult = await client.query(
        `INSERT INTO content_flags (
          entity_id, entity_type, flagged_by, reporter_email,
          flag_type, reason, severity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          entityId,
          entityType,
          userId,
          reporterEmail,
          flagType,
          reason,
          severity || 'medium',
        ],
      );

      // Add to review queue with high priority
      await client.query(
        `INSERT INTO admin_review_queues (entity_id, entity_type, priority)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [entityId, entityType, 1],
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        flag: flagResult.rows[0],
        message: 'Content flagged successfully',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error flagging content:', error);
      res.status(500).json({ error: error.message, code: 'FLAG_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // CONTENT FLAGS - RESOLVE
  // ============================================================================

  static async resolveFlag(req, res) {
    const client = await db.connect();
    try {
      const { flagId } = req.params;
      const { resolution, actionTaken, adminNotes } = req.body;
      const adminId = req.user.id;

      if (!(await this.hasAdminPermission(adminId, 'review_content'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      await client.query('BEGIN');

      const result = await client.query(
        `UPDATE content_flags 
         SET status = 'resolved', resolution = $1, action_taken = $2,
             admin_notes = $3, reviewed_by = $4, reviewed_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [resolution, actionTaken, adminNotes, adminId, flagId],
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Flag not found', code: 'FLAG_NOT_FOUND' });
      }

      const flag = result.rows[0];

      // Log action
      await this.logAdminAction(
        adminId,
        'resolve_flag',
        flag.entity_id,
        flag.entity_type,
        {
          flag_id: flagId,
          action_taken: actionTaken,
          resolution,
        },
      );

      await client.query('COMMIT');

      res.json({ success: true, message: 'Flag resolved successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error resolving flag:', error);
      res.status(500).json({ error: error.message, code: 'RESOLVE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // ADMIN ACTIONS - GET LOG
  // ============================================================================

  static async getAdminActions(req, res) {
    try {
      const adminId = req.user.id;
      const {
        actionType,
        entityType,
        targetUserId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = req.query;

      if (!(await this.hasAdminPermission(adminId, 'view_dashboard'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      let query = `
        SELECT 
          aa.*,
          u.first_name as admin_first_name,
          u.last_name as admin_last_name,
          tu.first_name as target_first_name,
          tu.last_name as target_last_name
        FROM admin_actions aa
        LEFT JOIN users u ON aa.admin_id = u.id
        LEFT JOIN users tu ON aa.target_user_id = tu.id
        WHERE 1=1
      `;

      const params = [];
      let paramCount = 0;

      if (actionType) {
        paramCount++;
        query += ` AND aa.action_type = $${paramCount}`;
        params.push(actionType);
      }

      if (entityType) {
        paramCount++;
        query += ` AND aa.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      if (targetUserId) {
        paramCount++;
        query += ` AND aa.target_user_id = $${paramCount}`;
        params.push(targetUserId);
      }

      if (dateFrom) {
        paramCount++;
        query += ` AND aa.created_at >= $${paramCount}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        paramCount++;
        query += ` AND aa.created_at <= $${paramCount}`;
        params.push(dateTo);
      }

      query += ' ORDER BY aa.created_at DESC';
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ actions: result.rows });
    } catch (error) {
      logger.error('Error getting admin actions:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // ADMIN USERS - MANAGE
  // ============================================================================

  static async grantAdminAccess(req, res) {
    const client = await db.connect();
    try {
      const { userId } = req.params;
      const { roleId, expiresAt } = req.body;
      const adminId = req.user.id;

      if (!(await this.hasAdminPermission(adminId, 'manage_admins'))) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      }

      await client.query('BEGIN');

      // Get role details
      const roleResult = await client.query(
        'SELECT * FROM admin_roles WHERE id = $1 AND is_active = true',
        [roleId],
      );

      if (roleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Role not found', code: 'ROLE_NOT_FOUND' });
      }

      const role = roleResult.rows[0];

      // Update user
      await client.query(
        'UPDATE users SET is_admin = true, admin_level = $1, admin_permissions = $2 WHERE id = $3',
        [role.level, role.permissions, userId],
      );

      // Create role assignment
      await client.query(
        `INSERT INTO admin_role_assignments (user_id, role_id, assigned_by, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [userId, roleId, adminId, expiresAt],
      );

      // Log action
      await this.logAdminAction(adminId, 'grant_admin_access', null, null, {
        target_user_id: userId,
        role_id: roleId,
        role_name: role.name,
      });

      await client.query('COMMIT');

      res.json({ success: true, message: 'Admin access granted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error granting admin access:', error);
      res.status(500).json({ error: error.message, code: 'GRANT_ERROR' });
    } finally {
      client.release();
    }
  }
}

module.exports = AdminController;
