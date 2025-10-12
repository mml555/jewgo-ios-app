import EventsDeepLinkService from '../../src/services/EventsDeepLinkService';

// Mock navigation service
const mockNavigate = jest.fn();
const mockNavigateToEventDetail = jest.fn();
const mockNavigateToEvents = jest.fn();

jest.mock('../../src/services/NavigationService', () => ({
  app: {
    navigateToEvents: mockNavigateToEvents,
    navigateToEventDetail: mockNavigateToEventDetail,
  },
}));

// Mock Linking
const mockLinking = {
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
};

jest.mock('react-native', () => ({
  Linking: mockLinking,
}));

describe('EventsDeepLinkService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupDeepLinkListener', () => {
    it('sets up deep link listener', () => {
      const mockSubscription = { remove: jest.fn() };
      mockLinking.addEventListener.mockReturnValue(mockSubscription);

      const subscription = EventsDeepLinkService.setupDeepLinkListener();

      expect(mockLinking.getInitialURL).toHaveBeenCalled();
      expect(mockLinking.addEventListener).toHaveBeenCalledWith('url', expect.any(Function));
      expect(subscription).toBe(mockSubscription);
    });

    it('handles initial events deep link', async () => {
      const mockUrl = 'jewgo://events';
      mockLinking.getInitialURL.mockResolvedValue(mockUrl);
      mockLinking.addEventListener.mockImplementation((event, callback) => {
        // Simulate initial URL callback
        callback({ url: mockUrl });
        return { remove: jest.fn() };
      });

      EventsDeepLinkService.setupDeepLinkListener();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockNavigateToEvents).toHaveBeenCalled();
    });

    it('handles event detail deep link', async () => {
      const mockUrl = 'jewgo://events/event-123';
      mockLinking.getInitialURL.mockResolvedValue(null);
      mockLinking.addEventListener.mockImplementation((event, callback) => {
        callback({ url: mockUrl });
        return { remove: jest.fn() };
      });

      EventsDeepLinkService.setupDeepLinkListener();

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockNavigateToEventDetail).toHaveBeenCalledWith({ eventId: 'event-123' });
    });
  });

  describe('generateEventDeepLink', () => {
    it('generates correct deep link for event', () => {
      const eventId = 'event-123';
      const result = EventsDeepLinkService.generateEventDeepLink(eventId);
      expect(result).toBe('jewgo://events/event-123');
    });
  });

  describe('generateEventsListDeepLink', () => {
    it('generates basic events list deep link', () => {
      const result = EventsDeepLinkService.generateEventsListDeepLink();
      expect(result).toBe('jewgo://events');
    });

    it('generates events list deep link with filters', () => {
      const filters = {
        category: 'religious',
        search: 'test event',
        isFree: true,
      };

      const result = EventsDeepLinkService.generateEventsListDeepLink(filters);
      expect(result).toBe('jewgo://events?category=religious&search=test+event&isFree=true');
    });

    it('generates events list deep link with partial filters', () => {
      const filters = {
        category: 'religious',
      };

      const result = EventsDeepLinkService.generateEventsListDeepLink(filters);
      expect(result).toBe('jewgo://events?category=religious');
    });
  });

  describe('generateEventUniversalLink', () => {
    it('generates correct universal link for event', () => {
      const eventId = 'event-123';
      const result = EventsDeepLinkService.generateEventUniversalLink(eventId);
      expect(result).toBe('https://jewgo.app/events/event-123');
    });
  });

  describe('generateEventsListUniversalLink', () => {
    it('generates basic events list universal link', () => {
      const result = EventsDeepLinkService.generateEventsListUniversalLink();
      expect(result).toBe('https://jewgo.app/events');
    });

    it('generates events list universal link with filters', () => {
      const filters = {
        category: 'religious',
        search: 'test event',
        isFree: true,
      };

      const result = EventsDeepLinkService.generateEventsListUniversalLink(filters);
      expect(result).toBe('https://jewgo.app/events?category=religious&search=test+event&isFree=true');
    });
  });

  describe('isEventsDeepLink', () => {
    it('returns true for events deep links', () => {
      expect(EventsDeepLinkService.isEventsDeepLink('jewgo://events')).toBe(true);
      expect(EventsDeepLinkService.isEventsDeepLink('jewgo://events/event-123')).toBe(true);
      expect(EventsDeepLinkService.isEventsDeepLink('https://jewgo.app/events')).toBe(true);
    });

    it('returns false for non-events deep links', () => {
      expect(EventsDeepLinkService.isEventsDeepLink('jewgo://jobs')).toBe(false);
      expect(EventsDeepLinkService.isEventsDeepLink('jewgo://profile')).toBe(false);
    });
  });

  describe('extractEventId', () => {
    it('extracts event ID from deep link', () => {
      expect(EventsDeepLinkService.extractEventId('jewgo://events/event-123')).toBe('event-123');
      expect(EventsDeepLinkService.extractEventId('https://jewgo.app/events/event-456')).toBe('event-456');
    });

    it('returns null when no event ID found', () => {
      expect(EventsDeepLinkService.extractEventId('jewgo://events')).toBeNull();
      expect(EventsDeepLinkService.extractEventId('jewgo://jobs/job-123')).toBeNull();
    });

    it('handles malformed URLs gracefully', () => {
      expect(EventsDeepLinkService.extractEventId('invalid-url')).toBeNull();
    });
  });

  describe('extractFilters', () => {
    it('extracts filters from deep link URL', () => {
      const url = 'jewgo://events?category=religious&search=test&isFree=true';
      const result = EventsDeepLinkService.extractFilters(url);

      expect(result).toEqual({
        category: 'religious',
        search: 'test',
        isFree: true,
      });
    });

    it('extracts partial filters', () => {
      const url = 'jewgo://events?category=religious';
      const result = EventsDeepLinkService.extractFilters(url);

      expect(result).toEqual({
        category: 'religious',
        search: undefined,
        isFree: undefined,
      });
    });

    it('returns empty object for URL without filters', () => {
      const url = 'jewgo://events';
      const result = EventsDeepLinkService.extractFilters(url);

      expect(result).toEqual({
        category: undefined,
        search: undefined,
        isFree: undefined,
      });
    });

    it('handles malformed URLs gracefully', () => {
      const url = 'invalid-url';
      const result = EventsDeepLinkService.extractFilters(url);

      expect(result).toEqual({});
    });
  });
});
