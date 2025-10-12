const express = require('express');
const EventsController = require('../controllers/eventsController');

const router = express.Router();

// ============================================================================
// IMPORTANT: Specific routes must come BEFORE parameterized routes like /:id
// Otherwise Express will match "categories" as an ID!
// ============================================================================

// Lookup data routes (must be before /:id)
router.get('/categories', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      `SELECT 
        id, key, name, description, icon_name, is_active, sort_order, 
        created_at, updated_at
       FROM event_categories 
       WHERE is_active = true 
       ORDER BY sort_order`,
    );
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching event categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch event categories' });
  }
});

router.get('/types', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      `SELECT 
        id, key, name, description, is_active, sort_order,
        created_at, updated_at
       FROM event_types 
       WHERE is_active = true 
       ORDER BY sort_order`,
    );
    res.json({ eventTypes: result.rows });
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch event types' });
  }
});

// My events (must be before /:id)
router.get('/my-events', /* authenticate(), */ EventsController.getMyEvents);

// Public routes
router.get('/', EventsController.getEvents);
router.get('/:id', EventsController.getEventById);

// Protected routes (require authentication)
router.post('/', /* authenticate(), */ EventsController.createEvent);
router.put('/:id', /* authenticate(), */ EventsController.updateEvent);
router.delete('/:id', /* authenticate(), */ EventsController.deleteEvent);

// RSVP routes
router.post(
  '/:eventId/rsvp',
  /* authenticate(), */ EventsController.rsvpToEvent,
);
router.delete(
  '/:eventId/rsvp',
  /* authenticate(), */ EventsController.cancelRsvp,
);

// Payment
router.post(
  '/:eventId/confirm-payment',
  /* authenticate(), */ EventsController.confirmEventPayment,
);

module.exports = router;
