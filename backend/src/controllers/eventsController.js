const db = require('../database/connection');
const logger = require('../utils/logger');

// Initialize Stripe only if API key is provided (optional for development/testing)
const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

class EventsController {
  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static async getLocationData(zipCode) {
    // Location data lookup disabled - returning null values
    return { city: null, state: null, latitude: null, longitude: null };
  }

  static async validateFlyerAspectRatio(width, height) {
    if (!width || !height) return false;
    const aspectRatio = width / height;
    const expectedRatio = 8.5 / 11; // 0.773
    return Math.abs(aspectRatio - expectedRatio) <= 0.05; // 5% tolerance
  }

  static async isFirstEventFree(organizerId) {
    const result = await db.query(`SELECT is_first_event_free($1) as is_free`, [
      organizerId,
    ]);
    return result.rows[0].is_free;
  }

  // ============================================================================
  // NEW HELPER METHODS FOR ENHANCED FEATURES
  // ============================================================================

  static formatEventDateRange(
    startDate,
    endDate,
    timezone = 'America/New_York',
  ) {
    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : start;

      const startDateStr = start.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        timeZone: timezone,
      });

      const startTimeStr = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      });

      const startDayStr = start.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: timezone,
      });

      if (start.toDateString() === end.toDateString()) {
        // Single day event
        return `${startDateStr} ${startDayStr} ${startTimeStr}`;
      } else {
        // Multi-day event
        const endDateStr = end.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          timeZone: timezone,
        });
        return `${startDateStr}-${endDateStr} ${startDayStr} ${startTimeStr}`;
      }
    } catch (error) {
      logger.error('Error formatting date range:', error);
      return 'Date TBA';
    }
  }

  static generateShareLinks(eventId, title, baseUrl = 'https://jewgo.app') {
    const eventUrl = `${baseUrl}/events/${eventId}`;
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(eventUrl);

    return {
      whatsapp: `whatsapp://send?text=${encodedTitle}%20-%20${encodedUrl}`,
      facebook: `fb://share?link=${encodedUrl}`,
      twitter: `twitter://post?message=${encodedTitle}%20-%20${encodedUrl}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      copy_link: eventUrl,
    };
  }

  static async getEventCategories() {
    try {
      const result = await db.query(
        'SELECT * FROM event_categories WHERE is_active = true ORDER BY sort_order',
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting event categories:', error);
      return [];
    }
  }

  static async getEventTypes() {
    try {
      const result = await db.query(
        'SELECT * FROM event_types WHERE is_active = true ORDER BY sort_order',
      );
      return result.rows;
    } catch (error) {
      logger.error('Error getting event types:', error);
      return [];
    }
  }

  // ============================================================================
  // EVENTS - CREATE
  // ============================================================================

  static async createEvent(req, res) {
    const client = await db.connect();
    try {
      const userId = req.user.id;
      const {
        title,
        description,
        eventDate,
        eventEndDate,
        timezone,
        zipCode,
        address,
        venueName,
        flyerUrl,
        flyerWidth,
        flyerHeight,
        categoryId,
        eventTypeId,
        tags,
        host,
        contactEmail,
        contactPhone,
        ctaLink,
        capacity,
        isRsvpRequired,
        isSponsorshipAvailable,
        sponsorshipDetails,
        isNonprofit,
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !description ||
        !eventDate ||
        !zipCode ||
        !flyerUrl ||
        !contactEmail
      ) {
        return res.status(400).json({
          error: 'Missing required fields',
          code: 'MISSING_FIELDS',
        });
      }

      // Validate flyer aspect ratio (8.5x11")
      if (flyerWidth && flyerHeight) {
        const isValidRatio = await this.validateFlyerAspectRatio(
          flyerWidth,
          flyerHeight,
        );
        if (!isValidRatio) {
          return res.status(400).json({
            error: 'Flyer must be in 8.5x11" format (portrait orientation)',
            code: 'INVALID_FLYER_DIMENSIONS',
            details: {
              provided: `${flyerWidth}x${flyerHeight}`,
              expected: '8.5x11 ratio (0.773)',
              actual: (flyerWidth / flyerHeight).toFixed(3),
            },
          });
        }
      }

      await client.query('BEGIN');

      // Check if this is user's first event (free)
      const isFirstFree = await this.isFirstEventFree(userId);
      const isPaid = !isFirstFree && !isNonprofit;

      // Get location data
      const locationData = await this.getLocationData(zipCode);

      // Determine initial status
      let initialStatus = 'pending_review';
      if (isNonprofit) {
        initialStatus = 'pending_approval'; // Needs nonprofit approval
      }

      // Create event
      const eventResult = await client.query(
        `INSERT INTO events (
          organizer_id, title, description, event_date, event_end_date, timezone,
          zip_code, address, city, state, latitude, longitude, venue_name,
          flyer_url, flyer_width, flyer_height, flyer_thumbnail_url,
          category_id, event_type_id, tags,
          host, contact_email, contact_phone, cta_link,
          capacity, is_rsvp_required, is_sponsorship_available, sponsorship_details,
          is_nonprofit, is_paid, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
        RETURNING *`,
        [
          userId,
          title,
          description,
          eventDate,
          eventEndDate,
          timezone || 'America/New_York',
          zipCode,
          address,
          locationData.city,
          locationData.state,
          locationData.latitude,
          locationData.longitude,
          venueName,
          flyerUrl,
          flyerWidth,
          flyerHeight,
          null, // thumbnail generated later
          categoryId,
          eventTypeId,
          JSON.stringify(tags || []),
          host,
          contactEmail,
          contactPhone,
          ctaLink,
          capacity,
          isRsvpRequired || false,
          isSponsorshipAvailable || false,
          sponsorshipDetails,
          isNonprofit || false,
          isPaid,
          initialStatus,
        ],
      );

      const event = eventResult.rows[0];

      // If paid event, create payment intent
      let paymentIntent = null;
      if (isPaid) {
        if (!stripe) {
          logger.error('❌ Stripe not configured but paid event requested');
          return res.status(500).json({
            success: false,
            error: 'Payment processing not available',
          });
        }
        paymentIntent = await stripe.paymentIntents.create({
          amount: 999, // $9.99
          currency: 'usd',
          metadata: {
            event_id: event.id,
            organizer_id: userId,
            event_title: title,
          },
          description: `Event: ${title}`,
        });

        // Save payment record
        await client.query(
          `INSERT INTO event_payments (event_id, organizer_id, amount, stripe_payment_intent_id)
           VALUES ($1, $2, $3, $4)`,
          [event.id, userId, 999, paymentIntent.id],
        );

        // Update event with payment intent
        await client.query(
          'UPDATE events SET stripe_payment_intent_id = $1 WHERE id = $2',
          [paymentIntent.id, event.id],
        );
      }

      // Add to review queue
      await client.query(
        `INSERT INTO admin_review_queues (entity_id, entity_type, priority)
         VALUES ($1, $2, $3)`,
        [event.id, 'event', isNonprofit ? 1 : 0],
      );

      await client.query('COMMIT');

      logger.info(
        `Event created: ${event.id} by user ${userId}, paid: ${isPaid}`,
      );

      res.status(201).json({
        success: true,
        event,
        isPaid,
        isFirstFree,
        paymentIntent: isPaid
          ? {
              clientSecret: paymentIntent.client_secret,
              amount: paymentIntent.amount,
            }
          : null,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating event:', error);
      res
        .status(500)
        .json({ error: error.message, code: 'EVENT_CREATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // EVENTS - GET ALL
  // ============================================================================

  static async getEvents(req, res) {
    try {
      const {
        category,
        eventType,
        dateFrom,
        dateTo,
        isRsvpRequired,
        isSponsorshipAvailable,
        isFree,
        zipCode,
        tags,
        search,
        lat,
        lng,
        radius = 25,
        page = 1,
        limit = 20,
        sortBy = 'event_date',
        sortOrder = 'ASC',
      } = req.query;

      // Query directly from events table to avoid view GROUP BY issues
      let query = `
        SELECT 
          e.id, e.organizer_id, e.title, e.description,
          e.event_date, e.event_end_date, e.timezone,
          e.zip_code, e.address, e.city, e.state, e.latitude, e.longitude,
          e.venue_name, e.flyer_url, e.flyer_width, e.flyer_height, e.flyer_thumbnail_url,
          e.category_id, e.event_type_id, e.tags, e.host,
          e.contact_email, e.contact_phone, e.cta_link,
          e.capacity, e.is_rsvp_required, e.rsvp_count, e.waitlist_count,
          e.is_sponsorship_available, e.is_nonprofit, e.nonprofit_approval_status,
          e.is_paid, e.payment_status, e.status, e.view_count,
          e.created_at, e.expires_at,
          ec.name as category_name, ec.icon_name as category_icon, ec.key as category_key,
          et.name as event_type_name, et.key as event_type_key,
          u.first_name || ' ' || u.last_name as organizer_full_name,
          u.first_name as organizer_first_name,
          u.last_name as organizer_last_name,
          NOT e.is_paid as is_free,
          CASE 
            WHEN e.venue_name IS NOT NULL THEN e.venue_name
            WHEN e.address IS NOT NULL THEN e.address
            ELSE e.city || ', ' || e.state
          END as location_display
        FROM events e
        JOIN event_categories ec ON e.category_id = ec.id
        JOIN event_types et ON e.event_type_id = et.id
        JOIN users u ON e.organizer_id = u.id
        WHERE e.status = 'approved' AND e.event_date > NOW()
      `;

      const params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND category_key = $${paramCount}`;
        params.push(category);
      }

      if (eventType) {
        paramCount++;
        query += ` AND event_type_key = $${paramCount}`;
        params.push(eventType);
      }

      if (dateFrom) {
        paramCount++;
        query += ` AND event_date >= $${paramCount}`;
        params.push(dateFrom);
      }

      if (dateTo) {
        paramCount++;
        query += ` AND event_date <= $${paramCount}`;
        params.push(dateTo);
      }

      if (isRsvpRequired === 'true') {
        query += ` AND is_rsvp_required = true`;
      }

      if (isSponsorshipAvailable === 'true') {
        query += ` AND is_sponsorship_available = true`;
      }

      // New filters
      if (isFree === 'true') {
        query += ` AND is_free = true`;
      }

      if (zipCode) {
        paramCount++;
        query += ` AND zip_code = $${paramCount}`;
        params.push(zipCode);
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : tags.split(',');
        paramCount++;
        query += ` AND tags ? $${paramCount}`;
        params.push(tagArray[0]); // Check for first tag, can be extended for multiple
      }

      if (search) {
        paramCount++;
        query += ` AND (
          search_vector @@ plainto_tsquery('english', $${paramCount})
          OR title ILIKE $${paramCount + 1}
          OR description ILIKE $${paramCount + 2}
        )`;
        params.push(search, `%${search}%`, `%${search}%`);
        paramCount += 2;
      }

      // Location filtering
      if (lat && lng && radius) {
        paramCount++;
        query += ` AND (
          latitude IS NOT NULL AND longitude IS NOT NULL AND
          (3959 * acos(cos(radians($${paramCount})) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians($${paramCount + 1})) + 
          sin(radians($${paramCount})) * sin(radians(latitude)))) <= $${
          paramCount + 2
        }
        )`;
        params.push(parseFloat(lat), parseFloat(lng), parseInt(radius, 10));
        paramCount += 2;
      }

      // Sorting
      const validSortColumns = [
        'event_date',
        'created_at',
        'title',
        'rsvp_count',
        'view_count',
        'capacity_percentage',
      ];
      const sortColumn = validSortColumns.includes(sortBy)
        ? sortBy
        : 'event_date';
      const validSortOrder =
        sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      query += ` ORDER BY ${sortColumn} ${validSortOrder}`;

      // Pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push((parseInt(page, 10) - 1) * parseInt(limit, 10));

      const result = await db.query(query, params);

      res.json({
        events: result.rows,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
        },
      });
    } catch (error) {
      logger.error('Error getting events:', error);
      res.status(500).json({ error: error.message, code: 'EVENT_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // EVENTS - GET BY ID
  // ============================================================================

  static async getEventById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      // Strip "guest_" prefix if present - guest IDs aren't valid UUIDs for database queries
      const cleanUserId =
        userId && !userId.startsWith('guest_') ? userId : null;

      // Query directly from events table instead of view to avoid GROUP BY issues
      let query = `
        SELECT 
          e.id, e.organizer_id, e.title, e.description,
          e.event_date, e.event_end_date, e.timezone,
          e.zip_code, e.address, e.city, e.state, e.latitude, e.longitude,
          e.venue_name, e.flyer_url, e.flyer_width, e.flyer_height, e.flyer_thumbnail_url,
          e.category_id, e.event_type_id, e.tags, e.host,
          e.contact_email, e.contact_phone, e.cta_link,
          e.capacity, e.is_rsvp_required, e.rsvp_count, e.waitlist_count,
          e.is_sponsorship_available, e.is_nonprofit, e.nonprofit_approval_status,
          e.is_paid, e.payment_status, e.status, e.view_count,
          e.created_at, e.expires_at,
          -- Category info
          ec.name as category_name, ec.icon_name as category_icon, ec.key as category_key,
          -- Event type info
          et.name as event_type_name, et.key as event_type_key,
          -- Organizer info
          u.first_name || ' ' || u.last_name as organizer_full_name,
          u.first_name as organizer_first_name,
          u.last_name as organizer_last_name,
          u.email as organizer_email,
          -- Computed fields
          NOT e.is_paid as is_free,
          CASE 
            WHEN e.event_date > NOW() THEN 'upcoming'
            WHEN e.event_end_date IS NOT NULL AND e.event_end_date < NOW() THEN 'past'
            WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN 'happening_now'
            ELSE 'past'
          END as event_status,
          CASE 
            WHEN e.event_date > NOW() THEN false
            WHEN e.event_end_date IS NOT NULL AND e.event_end_date < NOW() THEN true
            WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN false
            ELSE true
          END as is_past,
          CASE 
            WHEN e.event_date <= NOW() AND (e.event_end_date IS NULL OR e.event_end_date >= NOW()) THEN true
            ELSE false
          END as is_happening_now,
          CASE 
            WHEN e.capacity IS NOT NULL AND e.capacity > 0 THEN 
              ROUND((e.rsvp_count::DECIMAL / e.capacity::DECIMAL) * 100, 0)
            ELSE NULL
          END as capacity_percentage,
          CASE 
            WHEN e.venue_name IS NOT NULL THEN e.venue_name
            WHEN e.address IS NOT NULL THEN e.address
            ELSE e.city || ', ' || e.state
          END as location_display,
          ${
            cleanUserId
              ? `(SELECT COUNT(*) > 0 FROM event_rsvps WHERE event_id = e.id AND user_id = $2) as has_rsvped,`
              : 'false as has_rsvped,'
          }
          ${
            cleanUserId
              ? `(SELECT status FROM event_rsvps WHERE event_id = e.id AND user_id = $2) as rsvp_status`
              : 'NULL as rsvp_status'
          }
        FROM events e
        JOIN event_categories ec ON e.category_id = ec.id
        JOIN event_types et ON e.event_type_id = et.id
        JOIN users u ON e.organizer_id = u.id
        WHERE e.id = $1
      `;

      const result = await db.query(
        query,
        cleanUserId ? [id, cleanUserId] : [id],
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
      }

      const event = result.rows[0];

      // Increment view count
      await db.query(
        'UPDATE events SET view_count = view_count + 1 WHERE id = $1',
        [id],
      );

      // Log analytics (use cleanUserId for proper UUID format)
      await db.query(
        'INSERT INTO event_analytics (event_id, metric_type, user_id, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
        [id, 'view', cleanUserId, req.ip, req.get('User-Agent')],
      );

      res.json({ event });
    } catch (error) {
      logger.error('Error getting event:', error);
      res.status(500).json({ error: error.message, code: 'EVENT_FETCH_ERROR' });
    }
  }

  // ============================================================================
  // RSVP - CREATE/UPDATE
  // ============================================================================

  static async rsvpToEvent(req, res) {
    const client = await db.connect();
    try {
      const { eventId } = req.params;
      const userId = req.user.id;
      const {
        guestCount,
        attendeeName,
        attendeeEmail,
        attendeePhone,
        notes,
        dietaryRestrictions,
      } = req.body;

      await client.query('BEGIN');

      // Check if event exists and accepts RSVPs
      const eventCheck = await client.query(
        'SELECT id, is_rsvp_required, capacity, rsvp_count, status FROM events WHERE id = $1',
        [eventId],
      );

      if (eventCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
      }

      const event = eventCheck.rows[0];

      if (event.status !== 'approved') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Event is not accepting RSVPs',
          code: 'EVENT_NOT_ACTIVE',
        });
      }

      // Check capacity
      const totalGuests = guestCount || 1;
      if (event.capacity && event.rsvp_count + totalGuests > event.capacity) {
        // Add to waitlist instead
        await client.query(
          `INSERT INTO event_waitlist (event_id, user_id, guest_count, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (event_id, user_id) DO NOTHING`,
          [eventId, userId, totalGuests, notes],
        );

        await client.query('COMMIT');
        return res.json({
          success: true,
          waitlisted: true,
          message: 'Event is at capacity. You have been added to the waitlist.',
        });
      }

      // Create or update RSVP
      const rsvpResult = await client.query(
        `INSERT INTO event_rsvps (
          event_id, user_id, guest_count, attendee_name, attendee_email,
          attendee_phone, notes, dietary_restrictions
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (event_id, user_id) 
        DO UPDATE SET 
          guest_count = $3,
          attendee_name = $4,
          attendee_email = $5,
          attendee_phone = $6,
          notes = $7,
          dietary_restrictions = $8,
          updated_at = NOW()
        RETURNING *`,
        [
          eventId,
          userId,
          totalGuests,
          attendeeName,
          attendeeEmail,
          attendeePhone,
          notes,
          dietaryRestrictions,
        ],
      );

      // Log analytics
      await client.query(
        'INSERT INTO event_analytics (event_id, user_id, metric_type) VALUES ($1, $2, $3)',
        [eventId, userId, 'rsvp'],
      );

      await client.query('COMMIT');

      logger.info(`RSVP created for event ${eventId} by user ${userId}`);

      res.json({
        success: true,
        rsvp: rsvpResult.rows[0],
        waitlisted: false,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error creating RSVP:', error);
      res.status(500).json({ error: error.message, code: 'RSVP_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // RSVP - CANCEL
  // ============================================================================

  static async cancelRsvp(req, res) {
    const client = await db.connect();
    try {
      const { eventId } = req.params;
      const userId = req.user.id;

      await client.query('BEGIN');

      // Update RSVP status
      const result = await client.query(
        `UPDATE event_rsvps 
         SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
         WHERE event_id = $1 AND user_id = $2 AND status = 'registered'
         RETURNING *`,
        [eventId, userId],
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'RSVP not found', code: 'RSVP_NOT_FOUND' });
      }

      await client.query('COMMIT');

      res.json({ success: true, message: 'RSVP cancelled successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error cancelling RSVP:', error);
      res.status(500).json({ error: error.message, code: 'CANCEL_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // EVENTS - GET MY EVENTS
  // ============================================================================

  static async getMyEvents(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 20 } = req.query;

      let query = `
        SELECT 
          e.*,
          ec.name as category_name,
          et.name as event_type_name,
          (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id AND status = 'registered') as confirmed_rsvps
        FROM events e
        JOIN event_categories ec ON e.category_id = ec.id
        JOIN event_types et ON e.event_type_id = et.id
        WHERE e.organizer_id = $1
      `;

      const params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND e.status = $${paramCount}`;
        params.push(status);
      }

      query += ` ORDER BY e.event_date DESC`;
      query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(
        parseInt(limit, 10),
        (parseInt(page, 10) - 1) * parseInt(limit, 10),
      );

      const result = await db.query(query, params);

      res.json({ events: result.rows });
    } catch (error) {
      logger.error('Error getting my events:', error);
      res.status(500).json({ error: error.message, code: 'FETCH_ERROR' });
    }
  }

  // ============================================================================
  // EVENTS - UPDATE
  // ============================================================================

  static async updateEvent(req, res) {
    const client = await db.connect();
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      await client.query('BEGIN');

      // Verify ownership
      const ownerCheck = await client.query(
        'SELECT organizer_id, status FROM events WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(404)
          .json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].organizer_id !== userId) {
        await client.query('ROLLBACK');
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Build update query
      const allowedFields = [
        'title',
        'description',
        'event_date',
        'event_end_date',
        'address',
        'venue_name',
        'host',
        'contact_email',
        'contact_phone',
        'cta_link',
        'capacity',
        'is_rsvp_required',
        'is_sponsorship_available',
        'sponsorship_details',
        'tags',
      ];

      const updateFields = [];
      const updateValues = [];
      let paramCount = 0;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key)) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        await client.query('ROLLBACK');
        return res
          .status(400)
          .json({ error: 'No valid fields to update', code: 'NO_UPDATES' });
      }

      paramCount++;
      updateValues.push(id);

      const query = `
        UPDATE events 
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, updateValues);

      await client.query('COMMIT');

      logger.info(`Event updated: ${id} by user ${userId}`);

      res.json({ success: true, event: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating event:', error);
      res.status(500).json({ error: error.message, code: 'UPDATE_ERROR' });
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // EVENTS - DELETE
  // ============================================================================

  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const ownerCheck = await db.query(
        'SELECT organizer_id FROM events WHERE id = $1',
        [id],
      );

      if (ownerCheck.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'Event not found', code: 'EVENT_NOT_FOUND' });
      }

      if (ownerCheck.rows[0].organizer_id !== userId) {
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Soft delete
      await db.query(
        'UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2',
        ['cancelled', id],
      );

      logger.info(`Event deleted: ${id} by user ${userId}`);

      res.json({ success: true, message: 'Event cancelled successfully' });
    } catch (error) {
      logger.error('Error deleting event:', error);
      res.status(500).json({ error: error.message, code: 'DELETE_ERROR' });
    }
  }

  // ============================================================================
  // PAYMENT - CONFIRM
  // ============================================================================

  static async confirmEventPayment(req, res) {
    const client = await db.connect();
    try {
      const { eventId } = req.params;
      const { paymentIntentId } = req.body;
      const userId = req.user.id;

      await client.query('BEGIN');

      // Verify ownership
      const eventCheck = await client.query(
        'SELECT organizer_id, stripe_payment_intent_id FROM events WHERE id = $1',
        [eventId],
      );

      if (
        eventCheck.rows.length === 0 ||
        eventCheck.rows[0].organizer_id !== userId
      ) {
        await client.query('ROLLBACK');
        return res
          .status(403)
          .json({ error: 'Not authorized', code: 'NOT_AUTHORIZED' });
      }

      // Verify payment with Stripe
      if (!stripe) {
        logger.error(
          '❌ Stripe not configured but payment verification requested',
        );
        await client.query('ROLLBACK');
        return res.status(500).json({
          success: false,
          error: 'Payment processing not available',
        });
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
      );

      if (paymentIntent.status === 'succeeded') {
        // Update event payment status
        await client.query(
          'UPDATE events SET payment_status = $1, payment_completed_at = NOW() WHERE id = $2',
          ['paid', eventId],
        );

        // Update payment record
        await client.query(
          'UPDATE event_payments SET status = $1, paid_at = NOW() WHERE stripe_payment_intent_id = $2',
          ['succeeded', paymentIntentId],
        );

        await client.query('COMMIT');

        res.json({ success: true, message: 'Payment confirmed' });
      } else {
        await client.query('ROLLBACK');
        res
          .status(400)
          .json({ error: 'Payment not completed', code: 'PAYMENT_INCOMPLETE' });
      }
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error confirming payment:', error);
      res.status(500).json({ error: error.message, code: 'PAYMENT_ERROR' });
    } finally {
      client.release();
    }
  }
}

module.exports = EventsController;
