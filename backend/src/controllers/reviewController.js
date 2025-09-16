const pool = require('../database/connection');

class ReviewController {
  // Get reviews for a specific entity
  static async getEntityReviews(req, res) {
    try {
      const { entityId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const query = `
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
        LIMIT $2 OFFSET $3;
      `;
      const countQuery = `
        SELECT COUNT(*) FROM reviews 
        WHERE entity_id = $1 AND is_moderated = true;
      `;

      const [reviewsResult, countResult] = await Promise.all([
        pool.query(query, [entityId, limit, offset]),
        pool.query(countQuery, [entityId])
      ]);

      const total = parseInt(countResult.rows[0].count);
      const hasNext = (offset + reviewsResult.rows.length) < total;
      const hasPrev = offset > 0;

      res.json({
        success: true,
        data: {
          reviews: reviewsResult.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            hasNext,
            hasPrev
          }
        }
      });
    } catch (error) {
      console.error('Error getting entity reviews:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve reviews' });
    }
  }

  // Get a single review by ID
  static async getReviewById(req, res) {
    try {
      const { id } = req.params;
      const query = `
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
        WHERE r.id = $1 AND r.is_moderated = true;
      `;
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      res.json({ success: true, data: { review: result.rows[0] } });
    } catch (error) {
      console.error('Error getting review by ID:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve review' });
    }
  }

  // Create a new review
  static async createReview(req, res) {
    try {
      const { entityId } = req.params;
      const { rating, title, content, userId } = req.body;

      // Validate required fields
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          error: 'Rating must be between 1 and 5'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const query = `
        INSERT INTO reviews (entity_id, user_id, rating, title, content, is_moderated)
        VALUES ($1, $2, $3, $4, $5, false)
        RETURNING *;
      `;
      const result = await pool.query(query, [
        entityId,
        userId,
        rating,
        title || '',
        content || ''
      ]);

      res.status(201).json({
        success: true,
        data: { review: result.rows[0] },
        message: 'Review submitted successfully and is pending moderation'
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ success: false, error: 'Failed to create review' });
    }
  }

  // Update a review (for moderation purposes)
  static async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { is_moderated, is_verified } = req.body;

      const query = `
        UPDATE reviews 
        SET is_moderated = $1, is_verified = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *;
      `;
      const result = await pool.query(query, [is_moderated, is_verified, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      res.json({
        success: true,
        data: { review: result.rows[0] }
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ success: false, error: 'Failed to update review' });
    }
  }

  // Delete a review
  static async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const query = 'DELETE FROM reviews WHERE id = $1 RETURNING *;';
      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ success: false, error: 'Failed to delete review' });
    }
  }

  // Get review statistics for an entity
  static async getReviewStats(req, res) {
    try {
      const { entityId } = req.params;
      const query = `
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1
        FROM reviews 
        WHERE entity_id = $1 AND is_moderated = true;
      `;
      const result = await pool.query(query, [entityId]);

      if (result.rows.length === 0) {
        return res.json({
          success: true,
          data: {
            total_reviews: 0,
            average_rating: 0,
            rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        });
      }

      const stats = result.rows[0];
      res.json({
        success: true,
        data: {
          total_reviews: parseInt(stats.total_reviews),
          average_rating: parseFloat(stats.average_rating) || 0,
          rating_distribution: {
            5: parseInt(stats.rating_5),
            4: parseInt(stats.rating_4),
            3: parseInt(stats.rating_3),
            2: parseInt(stats.rating_2),
            1: parseInt(stats.rating_1)
          }
        }
      });
    } catch (error) {
      console.error('Error getting review stats:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve review statistics' });
    }
  }
}

module.exports = ReviewController;
