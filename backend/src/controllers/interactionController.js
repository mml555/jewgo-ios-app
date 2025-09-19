const { query } = require('../database/connection');

class InteractionController {
  // Track user interaction (view, like, share)
  static async trackInteraction(req, res) {
    try {
      const { entityId, interactionType } = req.body;
      const { user, guestSession } = req;

      // Validate interaction type
      const validTypes = ['view', 'like', 'share', 'favorite'];
      if (!validTypes.includes(interactionType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid interaction type'
        });
      }

      // Get user/guest info
      let userId = null;
      let guestSessionId = null;
      
      if (user) {
        console.log('🔍 DEBUG: User object:', user);
        if (user.type === 'guest') {
          // Guest user - extract session ID and remove "guest_" prefix if present
          guestSessionId = user.sessionId;
          console.log('🔍 DEBUG: Original guestSessionId:', guestSessionId);
          if (guestSessionId && guestSessionId.startsWith('guest_')) {
            guestSessionId = guestSessionId.replace('guest_', '');
          }
          console.log('🔍 DEBUG: Cleaned guestSessionId:', guestSessionId);
        } else {
          // Regular user
          userId = user.id;
        }
      }
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Check if interaction already exists (for like/favorite - prevent duplicates)
      if (interactionType === 'like' || interactionType === 'favorite') {
        const existingQuery = `
          SELECT id FROM entity_interactions 
          WHERE entity_id = $1 AND interaction_type = $2 
          AND (
            (user_id = $3 AND $3 IS NOT NULL) OR 
            (guest_session_id = $4 AND $4 IS NOT NULL)
          )
        `;
        
        const existing = await query(existingQuery, [entityId, interactionType, userId, guestSessionId]);
        
        if (existing.rows.length > 0) {
          // Remove existing interaction (toggle off)
          await query(
            'DELETE FROM entity_interactions WHERE id = $1',
            [existing.rows[0].id]
          );
          
          return res.json({
            success: true,
            data: { action: 'removed', interactionType }
          });
        }
      }

      // Insert new interaction
      const insertQuery = `
        INSERT INTO entity_interactions (
          entity_id, user_id, guest_session_id, interaction_type, 
          ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at
      `;

      const result = await query(insertQuery, [
        entityId, userId, guestSessionId, interactionType, 
        ipAddress, userAgent
      ]);

      res.status(201).json({
        success: true,
        data: { 
          action: 'added', 
          interactionType,
          interaction: result.rows[0]
        }
      });

    } catch (error) {
      console.error('Track interaction error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track interaction'
      });
    }
  }

  // Get user's interactions for an entity
  static async getUserInteractions(req, res) {
    try {
      const { entityId } = req.params;
      const { user, guestSession } = req;

      let userId = null;
      let guestSessionId = null;
      
      if (user) {
        if (user.type === 'guest') {
          // Guest user - extract session ID and remove "guest_" prefix if present
          guestSessionId = user.sessionId;
          if (guestSessionId && guestSessionId.startsWith('guest_')) {
            guestSessionId = guestSessionId.replace('guest_', '');
          }
        } else {
          // Regular user
          userId = user.id;
        }
      }

      const getUserInteractionsQuery = `
        SELECT interaction_type, created_at
        FROM entity_interactions 
        WHERE entity_id = $1 
        AND (
          (user_id = $2 AND $2 IS NOT NULL) OR 
          (guest_session_id = $3 AND $3 IS NOT NULL)
        )
        ORDER BY created_at DESC
      `;

      const result = await query(getUserInteractionsQuery, [entityId, userId, guestSessionId]);

      const interactions = {};
      result.rows.forEach(row => {
        interactions[row.interaction_type] = row.created_at;
      });

      res.json({
        success: true,
        data: { interactions }
      });

    } catch (error) {
      console.error('Get user interactions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user interactions'
      });
    }
  }

  // Get interaction counts for an entity
  static async getInteractionCounts(req, res) {
    try {
      const { entityId } = req.params;

      const getCountsQuery = `
        SELECT 
          view_count,
          like_count, 
          share_count,
          review_count
        FROM entities 
        WHERE id = $1 AND is_active = true
      `;

      const result = await query(getCountsQuery, [entityId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Entity not found'
        });
      }

      res.json({
        success: true,
        data: { counts: result.rows[0] }
      });

    } catch (error) {
      console.error('Get interaction counts error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get interaction counts'
      });
    }
  }
}

module.exports = InteractionController;
