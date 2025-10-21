/**
 * Eatery Submission Route
 * Handles new eatery submissions from the mobile app
 */

const express = require('express');
const router = express.Router();
const { geocodeAddress, parseHoursString } = require('../services/geocoding');
const { query } = require('../database/connection');
const logger = require('../utils/logger');

/**
 * POST /api/v5/eatery-submit
 * Submit a new eatery for review
 */
router.post('/eatery-submit', async (req, res) => {
  try {
    const {
      type,
      name,
      address,
      phone,
      email,
      website,
      hours_of_operation,
      business_images,
      kosher_type,
      hechsher,
      kosher_tags,
      short_description,
      price_range,
      amenities,
      services,
      google_reviews_link,
      is_owner_submission,
      user_id
    } = req.body;

    logger.info('Received eatery submission:', { name, address, kosher_type });

    // 1. Validate required fields
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!address) missingFields.push('address');
    if (!phone) missingFields.push('phone');
    if (!kosher_type) missingFields.push('kosher_type');
    if (!hechsher) missingFields.push('hechsher');
    if (!short_description) missingFields.push('short_description');

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missing_fields: missingFields
      });
    }

    // 2. Validate images (minimum 2 required)
    if (!business_images || !Array.isArray(business_images) || business_images.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Minimum 2 images required',
        current_count: business_images ? business_images.length : 0
      });
    }

    // 3. Geocode address to get lat/lng/geom
    logger.info('Geocoding address:', address);
    const { lat, lng, geom, formatted_address } = await geocodeAddress(address);
    logger.info('Geocoding successful:', { lat, lng });

    // 4. Parse hours into JSON format
    const hours_json = parseHoursString(hours_of_operation);

    // 5. Start database transaction
    const client = await query('BEGIN');

    try {
      // 6. Insert into entities table
      const entitySql = `
        INSERT INTO entities (
          entity_type, name, description, address,
          phone, email, website,
          latitude, longitude, geom,
          services, approval_status,
          owner_id, is_active, is_verified
        ) VALUES (
          'eatery', $1, $2, $3, $4, $5, $6, $7, $8,
          ST_SetSRID(ST_MakePoint($9, $7), 4326),
          $10, 'pending_review', $11, true, false
        ) RETURNING id, created_at
      `;

      const entityResult = await query(entitySql, [
        name,
        short_description,
        formatted_address || address,
        phone,
        email || null,
        website || null,
        lat,
        lng,
        lng, // lng for ST_MakePoint (lng, lat)
        services || [],
        user_id || null
      ]);

      const entityId = entityResult.rows[0].id;
      const createdAt = entityResult.rows[0].created_at;

      logger.info('Entity created:', { entityId });

      // 7. Insert into eatery_fields table
      const eateryFieldsSql = `
        INSERT INTO eatery_fields (
          entity_id, kosher_type, hechsher, kosher_tags,
          price_range, amenities, google_reviews_link,
          is_owner_submission, hours_json, business_images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const eateryFieldsResult = await query(eateryFieldsSql, [
        entityId,
        kosher_type.toLowerCase(), // normalize to lowercase
        hechsher.toLowerCase(), // normalize to lowercase
        kosher_tags || [],
        price_range,
        JSON.stringify(amenities || []),
        google_reviews_link || null,
        is_owner_submission || false,
        JSON.stringify(hours_json),
        business_images
      ]);

      logger.info('Eatery fields created:', { eateryFieldsId: eateryFieldsResult.rows[0].id });

      // 8. Commit transaction
      await query('COMMIT');

      // 9. Return success response
      res.status(201).json({
        success: true,
        data: {
          entity_id: entityId,
          status: 'pending_review',
          submitted_at: createdAt,
          message: 'Your eatery has been submitted for review. It will appear on the app within 24-48 hours after approval.'
        }
      });

      logger.info('Eatery submission successful:', { entityId, name });

    } catch (dbError) {
      // Rollback transaction on error
      await query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    logger.error('Eatery submission error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit eatery',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/v5/eatery-submissions
 * Get all pending eatery submissions (admin only)
 */
router.get('/eatery-submissions', async (req, res) => {
  try {
    const { status = 'pending_review', limit = 50, offset = 0 } = req.query;

    const sql = `
      SELECT 
        e.id,
        e.name,
        e.address,
        e.phone,
        e.email,
        e.approval_status,
        e.created_at,
        ef.kosher_type,
        ef.hechsher,
        ef.price_range,
        ef.is_owner_submission,
        u.first_name as submitter_first_name,
        u.last_name as submitter_last_name,
        u.email as submitter_email
      FROM entities e
      LEFT JOIN eatery_fields ef ON e.id = ef.entity_id
      LEFT JOIN users u ON e.owner_id = u.id
      WHERE e.entity_type = 'eatery' 
        AND e.approval_status = $1
      ORDER BY e.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await query(sql, [status, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: {
        submissions: result.rows,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: result.rowCount
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching eatery submissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch submissions',
      message: error.message
    });
  }
});

/**
 * PUT /api/v5/eatery-submissions/:id/approve
 * Approve an eatery submission (admin only)
 */
router.put('/eatery-submissions/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      UPDATE entities 
      SET approval_status = 'approved',
          is_verified = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND entity_type = 'eatery'
      RETURNING id, name, approval_status
    `;

    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Eatery submission not found'
      });
    }

    logger.info('Eatery approved:', { id, name: result.rows[0].name });

    res.json({
      success: true,
      data: {
        entity: result.rows[0],
        message: 'Eatery approved successfully'
      }
    });

  } catch (error) {
    logger.error('Error approving eatery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve eatery',
      message: error.message
    });
  }
});

/**
 * PUT /api/v5/eatery-submissions/:id/reject
 * Reject an eatery submission (admin only)
 */
router.put('/eatery-submissions/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const sql = `
      UPDATE entities 
      SET approval_status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND entity_type = 'eatery'
      RETURNING id, name, approval_status
    `;

    const result = await query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Eatery submission not found'
      });
    }

    logger.info('Eatery rejected:', { id, name: result.rows[0].name, reason });

    res.json({
      success: true,
      data: {
        entity: result.rows[0],
        message: 'Eatery rejected'
      }
    });

  } catch (error) {
    logger.error('Error rejecting eatery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject eatery',
      message: error.message
    });
  }
});

module.exports = router;
