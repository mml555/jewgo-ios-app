/**
 * Events Deep Link Service
 * Handles deep linking for Events feature
 */

import { Linking } from 'react-native';
import navigationService from './NavigationService';
import { debugLog, errorLog } from '../utils/logger';

class EventsDeepLinkService {
  /**
   * Set up deep link listener for events
   */
  setupDeepLinkListener() {
    const handleUrl = (url: string) => {
      debugLog('🔗 Received events deep link:', url);

      try {
        // Parse events deep links
        if (url.includes('events')) {
          this.handleEventsDeepLink(url);
        }
      } catch (error) {
        errorLog('Events deep link handling error:', error);
      }
    };

    // Handle initial URL (app opened via deep link)
    Linking.getInitialURL().then(url => {
      if (url) {
        handleUrl(url);
      }
    });

    // Handle subsequent deep links
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return subscription;
  }

  /**
   * Handle events deep links
   */
  private handleEventsDeepLink(url: string) {
    try {
      // Parse URL to extract route and parameters
      const parsedUrl = new URL(url);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

      if (pathSegments[0] === 'events') {
        if (pathSegments.length === 1) {
          // /events - Navigate to events list
          navigationService.app.navigateToEvents();
        } else if (pathSegments.length === 2) {
          // /events/:eventId - Navigate to specific event
          const eventId = pathSegments[1];
          navigationService.app.navigateToEventDetail({ eventId });
        }
      }

      // Handle query parameters for filtering
      const queryParams = new URLSearchParams(parsedUrl.search);
      if (queryParams.has('category')) {
        // TODO: Apply category filter when navigating to events
        debugLog('Category filter from deep link:', queryParams.get('category'));
      }

      if (queryParams.has('search')) {
        // TODO: Apply search filter when navigating to events
        debugLog('Search filter from deep link:', queryParams.get('search'));
      }

    } catch (error) {
      errorLog('Error parsing events deep link:', error);
    }
  }

  /**
   * Generate deep link URL for an event
   */
  generateEventDeepLink(eventId: string): string {
    return `jewgo://events/${eventId}`;
  }

  /**
   * Generate deep link URL for events list with filters
   */
  generateEventsListDeepLink(filters?: {
    category?: string;
    search?: string;
    isFree?: boolean;
  }): string {
    const baseUrl = 'jewgo://events';
    const params = new URLSearchParams();

    if (filters?.category) {
      params.append('category', filters.category);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.isFree) {
      params.append('isFree', 'true');
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Generate universal link for sharing events
   */
  generateEventUniversalLink(eventId: string): string {
    return `https://jewgo.app/events/${eventId}`;
  }

  /**
   * Generate universal link for events list
   */
  generateEventsListUniversalLink(filters?: {
    category?: string;
    search?: string;
    isFree?: boolean;
  }): string {
    const baseUrl = 'https://jewgo.app/events';
    const params = new URLSearchParams();

    if (filters?.category) {
      params.append('category', filters.category);
    }

    if (filters?.search) {
      params.append('search', filters.search);
    }

    if (filters?.isFree) {
      params.append('isFree', 'true');
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Check if a URL is an events deep link
   */
  isEventsDeepLink(url: string): boolean {
    return url.includes('events');
  }

  /**
   * Extract event ID from deep link URL
   */
  extractEventId(url: string): string | null {
    try {
      const match = url.match(/events\/([^/?]+)/);
      return match ? match[1] : null;
    } catch (error) {
      errorLog('Error extracting event ID from URL:', error);
      return null;
    }
  }

  /**
   * Extract filters from deep link URL
   */
  extractFilters(url: string): {
    category?: string;
    search?: string;
    isFree?: boolean;
  } {
    try {
      const parsedUrl = new URL(url);
      const params = new URLSearchParams(parsedUrl.search);

      return {
        category: params.get('category') || undefined,
        search: params.get('search') || undefined,
        isFree: params.get('isFree') === 'true',
      };
    } catch (error) {
      errorLog('Error extracting filters from URL:', error);
      return {};
    }
  }
}

// Create and export singleton instance
const eventsDeepLinkService = new EventsDeepLinkService();
export default eventsDeepLinkService;

// Export the class for testing purposes
export { EventsDeepLinkService };
