const express = require('express');
const EventsController = require('../controllers/eventsController');

const router = express.Router();

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

// My events
router.get('/my-events', /* authenticate(), */ EventsController.getMyEvents);

// Payment
router.post(
  '/:eventId/confirm-payment',
  /* authenticate(), */ EventsController.confirmEventPayment,
);

// Lookup data
router.get('/categories', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      'SELECT * FROM event_categories WHERE is_active = true ORDER BY sort_order',
    );
    res.json({ categories: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/types', async (req, res) => {
  try {
    const db = require('../database/connection');
    const result = await db.query(
      'SELECT * FROM event_types WHERE is_active = true ORDER BY sort_order',
    );
    res.json({ eventTypes: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
