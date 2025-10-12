import { configService } from '../config/ConfigService';
import guestService from './GuestService';

const API_BASE_URL = configService.getApiUrl();

// Types
export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  event_date: string;
  event_end_date?: string;
  timezone: string;
  zip_code: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  venue_name?: string;
  flyer_url: string;
  flyer_width?: number;
  flyer_height?: number;
  flyer_thumbnail_url?: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_key: string;
  event_type_id: string;
  event_type_name: string;
  event_type_key: string;
  tags?: string[];
  host?: string;
  contact_email: string;
  contact_phone?: string;
  cta_link?: string;
  capacity?: number;
  is_rsvp_required: boolean;
  rsvp_count: number;
  waitlist_count: number;
  is_sponsorship_available: boolean;
  is_nonprofit: boolean;
  nonprofit_approval_status?: string;
  is_paid: boolean;
  is_free: boolean; // Computed field
  payment_status?: string;
  status: string;
  view_count: number;
  share_count?: number;
  like_count?: number;
  organizer_first_name: string;
  organizer_last_name: string;
  organizer_full_name: string; // Computed field
  has_rsvped?: boolean;
  rsvp_status?: string;
  capacity_percentage?: number;
  display_date_range: string; // Computed field
  display_date_range_formatted: string; // Computed field
  event_status: 'upcoming' | 'happening_now' | 'past';
  is_past: boolean;
  is_happening_now: boolean;
  location_display: string; // Computed field
  share_urls?: ShareUrls; // For event details
  related_events?: RelatedEvent[];
  created_at: string;
  expires_at: string;
}

export interface EventCategory {
  id: string;
  key: string;
  name: string;
  icon_name: string;
  sort_order: number;
}

export interface EventType {
  id: string;
  key: string;
  name: string;
  sort_order: number;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  guest_count: number;
  attendee_name?: string;
  attendee_email?: string;
  notes?: string;
  registered_at: string;
}

export interface ShareUrls {
  whatsapp: string;
  facebook: string;
  twitter: string;
  email: string;
  copy_link: string;
}

export interface RelatedEvent {
  id: string;
  title: string;
  event_date: string;
  venue_name?: string;
  flyer_url: string;
}

export interface EventFilters {
  category?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  isRsvpRequired?: boolean;
  isSponsorshipAvailable?: boolean;
  isFree?: boolean;
  zipCode?: string;
  tags?: string[];
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

class EventsService {
  private static async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get guest token for authentication
    try {
      const authHeaders = await guestService.getAuthHeadersAsync();
      return { ...headers, ...authHeaders };
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return headers;
    }
  }

  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const headers = await this.getHeaders();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // EVENTS
  // ============================================================================

  static async getEvents(filters?: EventFilters): Promise<{ events: Event[]; pagination: any }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle array values (tags)
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }

    const endpoint = `/events?${params.toString()}`;
    console.log('🔷 EventsService.getEvents - Calling:', `${API_BASE_URL}${endpoint}`);
    
    try {
      const result = await this.makeRequest(endpoint);
      console.log('✅ EventsService.getEvents - Success:', result.events?.length, 'events');
      return result;
    } catch (error) {
      console.error('❌ EventsService.getEvents - Error:', error);
      throw error;
    }
  }

  static async getEventById(id: string): Promise<{ event: Event }> {
    return this.makeRequest(`/events/${id}`);
  }

  static async createEvent(data: {
    title: string;
    description: string;
    eventDate: string;
    eventEndDate?: string;
    timezone?: string;
    zipCode: string;
    address?: string;
    venueName?: string;
    flyerUrl: string;
    flyerWidth?: number;
    flyerHeight?: number;
    categoryId: string;
    eventTypeId: string;
    tags?: string[];
    host?: string;
    contactEmail: string;
    contactPhone?: string;
    ctaLink?: string;
    capacity?: number;
    isRsvpRequired?: boolean;
    isSponsorshipAvailable?: boolean;
    sponsorshipDetails?: string;
    isNonprofit?: boolean;
  }): Promise<{
    success: boolean;
    event: Event;
    isPaid: boolean;
    isFirstFree: boolean;
    paymentIntent?: {
      clientSecret: string;
      amount: number;
    };
  }> {
    return this.makeRequest('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateEvent(
    id: string,
    data: Partial<any>,
  ): Promise<{ success: boolean; event: Event }> {
    return this.makeRequest(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteEvent(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  static async getMyEvents(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: Event[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/events/my-events?${params.toString()}`);
  }

  // ============================================================================
  // RSVP
  // ============================================================================

  static async rsvpToEvent(
    eventId: string,
    data: {
      guestCount?: number;
      attendeeName?: string;
      attendeeEmail?: string;
      attendeePhone?: string;
      notes?: string;
      dietaryRestrictions?: string;
    },
  ): Promise<{
    success: boolean;
    rsvp?: EventRsvp;
    waitlisted: boolean;
    message?: string;
  }> {
    return this.makeRequest(`/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async cancelRsvp(eventId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/events/${eventId}/rsvp`, {
      method: 'DELETE',
    });
  }

  // ============================================================================
  // PAYMENT
  // ============================================================================

  static async confirmEventPayment(
    eventId: string,
    paymentIntentId: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/events/${eventId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  // ============================================================================
  // LOOKUP DATA
  // ============================================================================

  static async getCategories(): Promise<{ categories: EventCategory[] }> {
    console.log('🔷 EventsService.getCategories - Calling:', `${API_BASE_URL}/events/categories`);
    try {
      const result = await this.makeRequest('/events/categories');
      console.log('✅ EventsService.getCategories - Success:', result.categories?.length, 'categories');
      return result;
    } catch (error: any) {
      console.error('❌ EventsService.getCategories - Error:', error?.message || error);
      throw new Error(error?.message || 'Failed to load event categories');
    }
  }

  static async getEventTypes(): Promise<{ eventTypes: EventType[] }> {
    console.log('🔷 EventsService.getEventTypes - Calling:', `${API_BASE_URL}/events/types`);
    try {
      const result = await this.makeRequest('/events/types');
      console.log('✅ EventsService.getEventTypes - Success:', result.eventTypes?.length, 'types');
      return result;
    } catch (error: any) {
      console.error('❌ EventsService.getEventTypes - Error:', error?.message || error);
      throw new Error(error?.message || 'Failed to load event types');
    }
  }

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  static async uploadFlyer(file: {
    uri: string;
    type: string;
    name: string;
  }): Promise<{
    success: boolean;
    flyerUrl: string;
    width: number;
    height: number;
    aspectRatio: number;
  }> {
    const formData = new FormData();
    formData.append('flyer', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const authHeaders = await this.getHeaders();
    const response = await fetch(`${API_BASE_URL}/events/upload-flyer`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Failed to upload flyer');
    }

    return response.json();
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  static formatEventDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  static formatEventTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  static getEventStatus(event: Event): 'upcoming' | 'happening_now' | 'past' {
    const now = new Date();
    const startDate = new Date(event.event_date);
    const endDate = event.event_end_date ? new Date(event.event_end_date) : startDate;

    if (startDate > now) {
      return 'upcoming';
    } else if (endDate < now) {
      return 'past';
    } else {
      return 'happening_now';
    }
  }

  static getEventPriceDisplay(event: Event): string {
    if (event.is_free) {
      return 'Free';
    } else {
      return 'Paid';
    }
  }

  static getEventLocationDisplay(event: Event): string {
    if (event.venue_name) {
      return event.venue_name;
    } else if (event.address) {
      return event.address;
    } else if (event.city && event.state) {
      return `${event.city}, ${event.state}`;
    } else {
      return event.zip_code;
    }
  }

  static async shareEvent(event: Event, platform: 'whatsapp' | 'facebook' | 'twitter' | 'email' | 'copy'): Promise<boolean> {
    try {
      if (!event.share_urls) {
        console.warn('No share URLs available for event');
        return false;
      }

      const url = event.share_urls[platform];
      if (!url) {
        console.warn(`No share URL for platform: ${platform}`);
        return false;
      }

      if (platform === 'copy') {
        // For copy to clipboard functionality
        // This would need to be implemented with a clipboard library
        console.log('Copy to clipboard:', url);
        return true;
      }

      // Open the share URL
      const { Linking } = require('react-native');
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        console.warn(`Cannot open URL: ${url}`);
        return false;
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      return false;
    }
  }
}

export default EventsService;
