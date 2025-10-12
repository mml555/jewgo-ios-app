# Events Database Seeding Guide

## Overview

This guide explains how to populate the Events system with sample data for development and testing purposes.

## Quick Start

### Option 1: Using the Automated Script (Recommended)

```bash
# From project root
cd database/scripts
./seed_events.sh
```

The script will:
1. Check database connection
2. Run required migrations if needed
3. Seed sample events data
4. Display a summary of created events

### Option 2: Manual SQL Execution

```bash
# From project root
psql -h localhost -U postgres -d jewgo -f database/init/04_events_sample_data.sql
```

## What Gets Created

### Event Categories (8 categories)
- **Religious & Spiritual** - Services, prayers, spiritual gatherings
- **Education & Workshops** - Learning programs, workshops
- **Community Events** - Social gatherings and activities
- **Holiday Celebrations** - Jewish holiday events
- **Youth & Family** - Children, teens, and family events
- **Cultural & Arts** - Cultural programs, concerts, arts
- **Fundraising & Charity** - Charity events and fundraising
- **Social & Networking** - Social mixers and networking

### Event Types (10 types)
- Service, Shiur/Class, Farbrengen, Workshop, Concert, Dinner, Gala, Lecture, Social, Holiday

### Sample Events (15 diverse events)

1. **Rabbi Paltiel Farbrengen** *(matches screenshot)*
   - Religious & Spiritual
   - Free event
   - Brooklyn, NY 33110
   - 3-day event (Jan 12-14)

2. **Shabbat Morning Services**
   - Weekly services with Kiddush
   - Free, no RSVP required

3. **Women's Torah Study Circle**
   - Weekly study group
   - Limited capacity (30)

4. **Purim Carnival & Megillah Reading**
   - Family-friendly holiday event
   - 200 capacity

5. **Jewish History Lecture**
   - Paid event ($25)
   - Educational lecture

6. **Kabbalat Shabbat with Live Music**
   - Friday night services with music
   - Free event

7. **Israeli Cooking Workshop**
   - Hands-on cooking class
   - Paid ($45), limited capacity

8. **Young Professionals Networking**
   - Social mixer
   - Free, RSVP required

9. **Junior Congregation & Shabbat Party**
   - Kids program (ages 4-10)
   - Free

10. **Klezmer Concert**
    - Live performance
    - Paid event ($35)

11. **Annual Charity Gala**
    - Fundraising event
    - Paid ($150), nonprofit

12. **Beginners Hebrew Course**
    - 6-week language course
    - Paid ($180)

13. **Family Board Game Night**
    - Family-friendly social
    - Free

14. **Weekly Talmud Study**
    - Daf Yomi group
    - Free, no RSVP

15. **Passover Preparation Workshop**
    - Holiday prep workshop
    - Free

### Additional Data
- **RSVPs**: Sample RSVPs added to RSVP-required events
- **Analytics**: Sample view counts and event analytics
- **Organizers**: Events distributed across different organizers

## Sample Data Characteristics

### Date Distribution
- All events are set for **upcoming dates** (next 1-30 days)
- Various times (morning, afternoon, evening)
- Single-day and multi-day events
- Proper timezone handling (America/New_York)

### Location Distribution
- **Brooklyn**: Multiple zip codes (11201, 11204, 11218, 11230, 33110)
- **Manhattan**: (10001, 10023)
- All have proper addresses and coordinates

### Price Distribution
- **Free Events**: ~70% (10+ events)
- **Paid Events**: ~30% (5+ events)
- Price range: $25 - $180

### Capacity Distribution
- Events with no capacity limit
- Small events (20-30 people)
- Medium events (40-100 people)
- Large events (150-300 people)

## Verification

After seeding, verify the data:

```sql
-- Check total events
SELECT COUNT(*) FROM events;

-- Check upcoming events
SELECT COUNT(*) FROM events WHERE event_date > NOW();

-- Check by category
SELECT ec.name, COUNT(*) as event_count
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
GROUP BY ec.name
ORDER BY event_count DESC;

-- Check free vs paid
SELECT 
  COUNT(*) FILTER (WHERE is_paid = false) as free_events,
  COUNT(*) FILTER (WHERE is_paid = true) as paid_events
FROM events;

-- Check events with RSVPs
SELECT COUNT(*) FROM events WHERE rsvp_count > 0;
```

## Resetting Event Data

To clear all event data and re-seed:

```sql
-- WARNING: This deletes all event data!
BEGIN;
DELETE FROM event_analytics;
DELETE FROM event_waitlist;
DELETE FROM event_rsvps;
DELETE FROM event_payments;
DELETE FROM events;
COMMIT;

-- Then re-run the seed script
```

## Customizing Sample Data

To customize the sample data:

1. Edit `database/init/04_events_sample_data.sql`
2. Modify event details (dates, locations, prices)
3. Add or remove events
4. Re-run the seed script

### Adding More Events

To add additional events, append to the DO block:

```sql
INSERT INTO events (
    organizer_id, title, description, event_date, timezone,
    zip_code, address, city, state, venue_name,
    flyer_url, category_id, event_type_id, tags, host,
    contact_email, is_rsvp_required, is_paid, status
) VALUES (
    rabbi_user_id,
    'Your Event Title',
    'Your event description',
    (CURRENT_DATE + INTERVAL '7 days')::timestamptz + TIME '19:00',
    'America/New_York',
    '10001',
    'Your Address',
    'Your City',
    'NY',
    'Venue Name',
    'https://res.cloudinary.com/jewgo/image/upload/v1/events/your_image.jpg',
    education_cat_id,
    workshop_type_id,
    '["your", "tags"]'::jsonb,
    'Host Name',
    'contact@example.com',
    true,
    false,
    'approved'
);
```

## Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Check credentials in backend/.env
cat backend/.env | grep DB_
```

### Migration Not Found
```bash
# Ensure migrations exist
ls database/migrations/021_complete_events_system.sql
ls database/migrations/022_events_schema_enhancements.sql
```

### Events Not Appearing in App
1. Verify data in database:
   ```sql
   SELECT id, title, event_date, status FROM events LIMIT 5;
   ```

2. Check API is working:
   ```bash
   curl http://localhost:3001/api/v5/events
   ```

3. Restart backend server:
   ```bash
   cd backend
   npm run dev
   ```

## Production Considerations

### DO NOT use this seed data in production!

This sample data is for development and testing only:
- Uses placeholder Cloudinary URLs
- Contains test user accounts
- Has unrealistic RSVP patterns
- Includes demo contact information

### For Production
1. Create real events through the app UI
2. Use actual venue addresses and coordinates
3. Upload real event flyers
4. Obtain proper user consent for RSVPs
5. Implement proper data backup procedures

## Related Documentation

- **Events API**: `docs/events.md`
- **Database Schema**: `database/migrations/021_complete_events_system.sql`
- **Enhanced Schema**: `database/migrations/022_events_schema_enhancements.sql`
- **Implementation Checklist**: `EVENTS_IMPLEMENTATION_CHECKLIST.md`

## Support

For issues with seeding:
1. Check database logs
2. Verify migration history
3. Review error messages in terminal
4. Check PostgreSQL permissions

---

**Last Updated**: October 10, 2025  
**Version**: 1.0  
**Status**: Production Ready
