const db = require('../database/connection');
const logger = require('../utils/logger');

class ClaimsController {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static getTableName(entityType) {
    const tableMap = {
      restaurant: 'restaurants',
      synagogue: 'synagogues',
      mikvah: 'mikvahs',
      store: 'stores',
    };
    return tableMap[entityType];
  }

  static async getEntity(entityId, entityType, client = db) {
    const tableName = this.getTableName(entityType);
    if (!tableName) return null;

    const result = await client.query(
      `SELECT id, name, address, is_claimed, owner_id FROM ${tableName} WHERE id = $1`,
      [entityId],
    );
    return result.rows[0] || null;
  }

  // ============================================================================
  // CLAIMS - SUBMIT
  // ============================================================================

  static async submitClaim(req, res) {
    const client = await db.connect();
    try {
      const { entityId, entityType } = req.params;
      const userId = req.user.id;
      const {
        claimantName,
        claimantPhone,
        claimantEmail,
        claimantNotes,
        claimantRole,
        businessName,
        businessTaxId,
        businessLicenseNumber,
        yearsAtBusiness,
        evidence,
      } = req.body;

      // Validate required fields
      if (!claimantName || !claimantPhone || !claimantEmail) {
        return res.status(400).json({
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
        });
      }

      await client.query('BEGIN');

      // Verify entity exists and is claimable
      const entity = await this.getEntity(entityId, entityType, client);
      if (!entity) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Entity not found', code: 'ENTITY_NOT_FOUND' });
      }

      if (entity.is_claimed) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'This listing is already claimed',
          code: 'ALREADY_CLAIMED',
          claimedBy: entity.owner_id,
        });
      }

      // Check for existing pending claim
      const existingClaim = await client.query(
        'SELECT id FROM listing_claims WHERE entity_id = $1 AND entity_type = $2 AND claimant_id = $3 AND status = $4',
        [entityId, entityType, userId, 'pending'],
      );

      if (existingClaim.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'You already have a pending claim for this listing',
          code: 'PENDING_CLAIM_EXISTS',
        });
      }

      // Create claim
      const claimResult = await client.query(
        `INSERT INTO listing_claims (
          entity_id, entity_type, claimant_id, claimant_name, claimant_phone,
          claimant_email, claimant_notes, claimant_role, business_name,
          business_tax_id, business_license_number, years_at_business
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          entityId,
          entityType,
          userId,
          claimantName,
          claimantPhone,
          claimantEmail,
          claimantNotes,
          claimantRole,
          businessName,
          businessTaxId,
          businessLicenseNumber,
          yearsAtBusiness,
        ],
      );

      const claim = claimResult.rows[0];

      // Add evidence if provided
      if (evidence && Array.isArray(evidence) && evidence.length > 0) {
        for (const evidenceItem of evidence) {
          await client.query(
            `INSERT INTO claim_evidence (
              claim_id, evidence_type, file_url, file_name, file_size,
              mime_type, title, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              claim.id,
              evidenceItem.type,
              evidenceItem.url,
              evidenceItem.name,
              evidenceItem.size,
              evidenceItem.mimeType,
              evidenceItem.title,
              evidenceItem.description,
            ],
          );
        }
      }

      // Create notification for claimant
      await client.query(
        `INSERT INTO claim_notifications (
          claim_id, user_id, notification_type, title, message
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          claim.id,
          userId,
          'claim_submitted',
          'Claim Submitted',
          `Your claim for ${entity.name} has been submitted and is pending review.`,
        ],
      );

      await client.query('COMMIT');

      logger.info(
        `Claim submitted: ${claim.id} for ${entityType} ${entityId} by user ${userId}`,
      );

      res.status(201).json({
        success: true,
        claim,
        message:
          'Claim submitted successfully. You will be notified once it is reviewed.',
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error submitting claim:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'CLAIM_SUBMIT_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // CLAIMS - GET MY CLAIMS
  // ============================================================================

  static async getMyClaims(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      let query = `
        SELECT 
          lc.*,
          (SELECT COUNT(*) FROM claim_evidence WHERE claim_id = lc.id) as evidence_count,
          CASE 
            WHEN lc.entity_type = 'restaurant' THEN r.name
            WHEN lc.entity_type = 'synagogue' THEN s.name
            WHEN lc.entity_type = 'mikvah' THEN m.name
            WHEN lc.entity_type = 'store' THEN st.name
          END as entity_name,
          CASE 
            WHEN lc.entity_type = 'restaurant' THEN r.address
            WHEN lc.entity_type = 'synagogue' THEN s.address
            WHEN lc.entity_type = 'mikvah' THEN m.address
            WHEN lc.entity_type = 'store' THEN st.address
          END as entity_address
        FROM listing_claims lc
        LEFT JOIN restaurants r ON lc.entity_type = 'restaurant' AND lc.entity_id = r.id
        LEFT JOIN synagogues s ON lc.entity_type = 'synagogue' AND lc.entity_id = s.id
        LEFT JOIN mikvahs m ON lc.entity_type = 'mikvah' AND lc.entity_id = m.id
        LEFT JOIN stores st ON lc.entity_type = 'store' AND lc.entity_id = st.id
        WHERE lc.claimant_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND lc.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY lc.created_at DESC`;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ claims: result.rows });
    } catch (error) {
      logger.error('Error getting my claims:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // CLAIMS - GET CLAIM DETAILS
  // ============================================================================

  static async getClaimDetails(req, res) {
    try {
      const { claimId } = req.params;
      const userId = req.user.id;

      // Get claim
      const claimResult = await db.query(
        `SELECT lc.* FROM listing_claims lc WHERE lc.id = $1 AND lc.claimant_id = $2`,
        [claimId, userId],
      );

      if (claimResult.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Claim not found', code: 'CLAIM_NOT_FOUND' });
      }

      const claim = claimResult.rows[0];

      // Get evidence
      const evidenceResult = await db.query(
        'SELECT * FROM claim_evidence WHERE claim_id = $1 ORDER BY created_at ASC',
        [claimId],
      );

      // Get history
      const historyResult = await db.query(
        `SELECT ch.*, u.first_name, u.last_name 
         FROM claim_history ch
         LEFT JOIN users u ON ch.performed_by = u.id
         WHERE ch.claim_id = $1 
         ORDER BY ch.created_at ASC`,
        [claimId],
      );

      res.json({
        claim,
        evidence: evidenceResult.rows,
        history: historyResult.rows,
      });
    } catch (error) {
      logger.error('Error getting claim details:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // CLAIMS - CANCEL
  // ============================================================================

  static async cancelClaim(req, res) {
    const client = await db.connect();
    try {
      const { claimId } = req.params;
      const userId = req.user.id;

      await client.query('BEGIN');

      const claim = await client.query(
        'SELECT * FROM listing_claims WHERE id = $1 AND claimant_id = $2 AND status = $3',
        [claimId, userId, 'pending'],
      );

      if (claim.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({
            error: 'Claim not found or cannot be cancelled',
            code: 'CLAIM_NOT_FOUND',
          });
      }

      await client.query(
        'UPDATE listing_claims SET status = $1, updated_at = NOW() WHERE id = $2',
        ['cancelled', claimId],
      );

      await client.query('COMMIT');

      res.json({ success: true, message: 'Claim cancelled successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cancelling claim:', error);
      res.status(500).json({ error: error.message, code: 'CANCEL_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // ADMIN - GET PENDING CLAIMS
  // ============================================================================

  static async getPendingClaims(req, res) {
    try {
      const {
        entityType,
        status = 'pending',
        page = 1,
        limit = 20,
      } = req.query;

      let query = 'SELECT * FROM pending_claims_summary WHERE status = $1';
      const params = [status];
      let paramCount = 1;

      if (entityType) {
        paramCount++;
        query += ` AND entity_type = $${paramCount}`;
        params.push(entityType);
      }

      query += ` ORDER BY priority DESC, created_at ASC`;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ claims: result.rows });
    } catch (error) {
      logger.error('Error getting pending claims:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // ADMIN - REVIEW CLAIM
  // ============================================================================

  static async reviewClaim(req, res) {
    const client = await db.connect();
    try {
      const { claimId } = req.params;
      const { action, adminNotes, rejectionReason } = req.body;
      const adminId = req.user.id;

      if (!['approve', 'reject', 'request_info'].includes(action)) {
        return res
          .status(400)
          .json({ error: 'Invalid action', code: 'INVALID_ACTION' });
      }

      await client.query('BEGIN');

      const claim = await client.query(
        'SELECT * FROM listing_claims WHERE id = $1 AND status IN ($2, $3)',
        [claimId, 'pending', 'under_review'],
      );

      if (claim.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({
            error: 'Claim not found or already processed',
            code: 'CLAIM_NOT_FOUND',
          });
      }

      const claimData = claim.rows[0];
      const newStatus =
        action === 'approve'
          ? 'approved'
          : action === 'reject'
          ? 'rejected'
          : 'additional_info_required';

      // Update claim
      await client.query(
        `UPDATE listing_claims 
         SET status = $1, admin_notes = $2, rejection_reason = $3,
             reviewed_by = $4, reviewed_at = NOW(),
             approved_at = CASE WHEN $1 = 'approved' THEN NOW() ELSE NULL END,
             updated_at = NOW()
         WHERE id = $5`,
        [newStatus, adminNotes, rejectionReason, adminId, claimId],
      );

      // Create notification
      const notificationMessages = {
        approve: `Your claim for ${
          claimData.business_name || 'the listing'
        } has been approved!`,
        reject: `Your claim for ${
          claimData.business_name || 'the listing'
        } has been rejected. ${rejectionReason || ''}`,
        request_info: `Additional information is required for your claim. ${
          adminNotes || ''
        }`,
      };

      await client.query(
        `INSERT INTO claim_notifications (
          claim_id, user_id, notification_type, title, message
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          claimId,
          claimData.claimant_id,
          `claim_${action}d`,
          action === 'approve'
            ? 'Claim Approved'
            : action === 'reject'
            ? 'Claim Rejected'
            : 'Information Required',
          notificationMessages[action],
        ],
      );

      // Log admin action
      await client.query(
        `INSERT INTO admin_actions (
          admin_id, action_type, entity_id, entity_type, target_user_id, notes
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          adminId,
          action,
          claimData.entity_id,
          claimData.entity_type,
          claimData.claimant_id,
          adminNotes,
        ],
      );

      await client.query('COMMIT');

      logger.info(`Claim ${action}d: ${claimId} by admin ${adminId}`);

      res.json({
        success: true,
        message: `Claim ${action}d successfully`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error reviewing claim:', error);
      res.status(500).json({ error: error.message, code: 'REVIEW_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // EVIDENCE - UPLOAD
  // ============================================================================

  static async uploadEvidence(req, res) {
    const client = await db.connect();
    try {
      const { claimId } = req.params;
      const userId = req.user.id;
      const {
        evidenceType,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        title,
        description,
      } = req.body;

      await client.query('BEGIN');

      // Verify claim ownership
      const claimCheck = await client.query(
        'SELECT id FROM listing_claims WHERE id = $1 AND claimant_id = $2',
        [claimId, userId],
      );

      if (claimCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Claim not found', code: 'CLAIM_NOT_FOUND' });
      }

      // Add evidence
      const result = await client.query(
        `INSERT INTO claim_evidence (
          claim_id, evidence_type, file_url, file_name, file_size,
          mime_type, title, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          claimId,
          evidenceType,
          fileUrl,
          fileName,
          fileSize,
          mimeType,
          title,
          description,
        ],
      );

      await client.query('COMMIT');

      res.json({ success: true, evidence: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error uploading evidence:', error);
      res.status(500).json({ error: error.message, code: 'UPLOAD_ERROR' });
    } finally {
      client.release();
    }
  }
}

module.exports = ClaimsController;
