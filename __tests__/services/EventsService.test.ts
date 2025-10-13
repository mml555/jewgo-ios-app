import EventsService, {
  Event,
  EventFilters,
} from '../../src/services/EventsService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe('EventsService', () => {
  const mockEvent: Event = {
    id: '1',
    organizer_id: 'organizer-1',
    title: 'Test Event',
    description: 'Test description',
    event_date: '2024-01-15T18:00:00Z',
    timezone: 'America/New_York',
    zip_code: '10001',
    venue_name: 'Test Venue',
    flyer_url: 'https://example.com/flyer.jpg',
    category_id: 'cat-1',
    category_name: 'Religious & Spiritual',
    category_icon: 'church',
    category_key: 'religious',
    event_type_id: 'type-1',
    event_type_name: 'Service',
    event_type_key: 'service',
    tags: ['test', 'event'],
    host: 'Test Host',
    contact_email: 'test@example.com',
    capacity: 100,
    is_rsvp_required: true,
    rsvp_count: 50,
    waitlist_count: 0,
    is_sponsorship_available: false,
    is_nonprofit: false,
    is_paid: false,
    is_free: true,
    status: 'approved',
    view_count: 100,
    organizer_first_name: 'John',
    organizer_last_name: 'Doe',
    organizer_full_name: 'John Doe',
    has_rsvped: false,
    capacity_percentage: 50,
    display_date_range: 'January 15 Monday 6:00 PM',
    display_date_range_formatted: 'January 15 Monday 6:00 PM',
    event_status: 'upcoming',
    is_past: false,
    is_happening_now: false,
    location_display: 'Test Venue',
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-01-16T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  describe('getEvents', () => {
    it('fetches events with default parameters', async () => {
      const mockResponse = {
        events: [mockEvent],
        pagination: { page: 1, limit: 20 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await EventsService.getEvents();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v5/events'),
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse);
    });

    it('fetches events with filters', async () => {
      const filters: EventFilters = {
        category: 'religious',
        isFree: true,
        search: 'test',
        tags: ['workshop', 'education'],
      };

      const mockResponse = {
        events: [mockEvent],
        pagination: { page: 1, limit: 20 },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await EventsService.getEvents(filters);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('category=religious'),
        expect.any(Object),
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('isFree=true'),
        expect.any(Object),
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=test'),
        expect.any(Object),
      );
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('tags=workshop%2Ceducation'),
        expect.any(Object),
      );
    });

    it('handles API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      await expect(EventsService.getEvents()).rejects.toThrow();
    });
  });

  describe('getEventById', () => {
    it('fetches event by ID', async () => {
      const mockResponse = { event: mockEvent };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await EventsService.getEventById('1');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v5/events/1'),
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse);
    });

    it('handles event not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Event not found' }),
      });

      await expect(EventsService.getEventById('nonexistent')).rejects.toThrow();
    });
  });

  describe('helper methods', () => {
    describe('formatEventDate', () => {
      it('formats today correctly', () => {
        const today = new Date();
        const todayString = today.toISOString();
        const result = EventsService.formatEventDate(todayString);
        expect(result).toBe('Today');
      });

      it('formats tomorrow correctly', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString();
        const result = EventsService.formatEventDate(tomorrowString);
        expect(result).toBe('Tomorrow');
      });

      it('formats other dates correctly', () => {
        const date = new Date('2024-01-15T18:00:00Z');
        const result = EventsService.formatEventDate(date.toISOString());
        expect(result).toMatch(/Jan 15/);
      });
    });

    describe('formatEventTime', () => {
      it('formats time correctly', () => {
        const date = new Date('2024-01-15T18:30:00Z');
        const result = EventsService.formatEventTime(date.toISOString());
        expect(result).toMatch(/6:30/);
      });
    });

    describe('getEventStatus', () => {
      it('returns upcoming for future events', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const futureEvent = {
          ...mockEvent,
          event_date: futureDate.toISOString(),
        };

        const result = EventsService.getEventStatus(futureEvent);
        expect(result).toBe('upcoming');
      });

      it('returns past for past events', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const pastEvent = { ...mockEvent, event_date: pastDate.toISOString() };

        const result = EventsService.getEventStatus(pastEvent);
        expect(result).toBe('past');
      });

      it('returns happening_now for current events', () => {
        const now = new Date();
        const endDate = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
        const currentEvent = {
          ...mockEvent,
          event_date: now.toISOString(),
          event_end_date: endDate.toISOString(),
        };

        const result = EventsService.getEventStatus(currentEvent);
        expect(result).toBe('happening_now');
      });
    });

    describe('getEventPriceDisplay', () => {
      it('returns Free for free events', () => {
        const freeEvent = { ...mockEvent, is_free: true };
        const result = EventsService.getEventPriceDisplay(freeEvent);
        expect(result).toBe('Free');
      });

      it('returns Paid for paid events', () => {
        const paidEvent = { ...mockEvent, is_free: false };
        const result = EventsService.getEventPriceDisplay(paidEvent);
        expect(result).toBe('Paid');
      });
    });

    describe('getEventLocationDisplay', () => {
      it('returns venue name when available', () => {
        const result = EventsService.getEventLocationDisplay(mockEvent);
        expect(result).toBe('Test Venue');
      });

      it('returns address when venue name not available', () => {
        const eventWithoutVenue = {
          ...mockEvent,
          venue_name: undefined,
          address: '123 Main St',
        };
        const result = EventsService.getEventLocationDisplay(eventWithoutVenue);
        expect(result).toBe('123 Main St');
      });

      it('returns city and state when venue and address not available', () => {
        const eventWithoutVenueOrAddress = {
          ...mockEvent,
          venue_name: undefined,
          address: undefined,
          city: 'New York',
          state: 'NY',
        };
        const result = EventsService.getEventLocationDisplay(
          eventWithoutVenueOrAddress,
        );
        expect(result).toBe('New York, NY');
      });

      it('returns zip code as fallback', () => {
        const eventWithOnlyZip = {
          ...mockEvent,
          venue_name: undefined,
          address: undefined,
          city: undefined,
          state: undefined,
        };
        const result = EventsService.getEventLocationDisplay(eventWithOnlyZip);
        expect(result).toBe('10001');
      });
    });
  });

  describe('shareEvent', () => {
    beforeEach(() => {
      // Mock Linking
      jest.doMock('react-native', () => ({
        Linking: {
          canOpenURL: jest.fn().mockResolvedValue(true),
          openURL: jest.fn().mockResolvedValue(true),
        },
      }));
    });

    it('shares event successfully', async () => {
      const eventWithShareUrls = {
        ...mockEvent,
        share_urls: {
          whatsapp: 'whatsapp://send?text=Test Event',
          facebook: 'fb://share?link=https://jewgo.app/events/1',
          twitter: 'twitter://post?message=Test Event',
          email: 'mailto:?subject=Test Event',
          copy: 'https://jewgo.app/events/1',
        },
      };

      const result = await EventsService.shareEvent(
        eventWithShareUrls,
        'whatsapp',
      );
      expect(result).toBe(true);
    });

    it('handles missing share URLs', async () => {
      const result = await EventsService.shareEvent(mockEvent, 'whatsapp');
      expect(result).toBe(false);
    });

    it('handles copy platform', async () => {
      const eventWithShareUrls = {
        ...mockEvent,
        share_urls: {
          whatsapp: 'whatsapp://send?text=Test Event',
          facebook: 'fb://share?link=https://jewgo.app/events/1',
          twitter: 'twitter://post?message=Test Event',
          email: 'mailto:?subject=Test Event',
          copy: 'https://jewgo.app/events/1',
        },
      };

      const result = await EventsService.shareEvent(eventWithShareUrls, 'copy');
      expect(result).toBe(true);
    });
  });
});
