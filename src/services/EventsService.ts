import { configService } from '../config/ConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  event_type_id: string;
  event_type_name: string;
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
  payment_status?: string;
  status: string;
  view_count: number;
  organizer_first_name: string;
  organizer_last_name: string;
  has_rsvped?: boolean;
  rsvp_status?: string;
  capacity_percentage?: number;
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

class EventsService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

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

  static async getEvents(filters?: {
    category?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
    location?: string;
    isRsvpRequired?: boolean;
    isSponsorshipAvailable?: boolean;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ events: Event[]; pagination: any }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/api/v5/events?${params.toString()}`);
  }

  static async getEventById(id: string): Promise<{ event: Event }> {
    return this.makeRequest(`/api/v5/events/${id}`);
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
    return this.makeRequest('/api/v5/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateEvent(
    id: string,
    data: Partial<any>,
  ): Promise<{ success: boolean; event: Event }> {
    return this.makeRequest(`/api/v5/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteEvent(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/events/${id}`, {
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

    return this.makeRequest(`/api/v5/events/my-events?${params.toString()}`);
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
    return this.makeRequest(`/api/v5/events/${eventId}/rsvp`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async cancelRsvp(eventId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/events/${eventId}/rsvp`, {
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
    return this.makeRequest(`/api/v5/events/${eventId}/confirm-payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId }),
    });
  }

  // ============================================================================
  // LOOKUP DATA
  // ============================================================================

  static async getCategories(): Promise<{ categories: EventCategory[] }> {
    return this.makeRequest('/api/v5/events/categories');
  }

  static async getEventTypes(): Promise<{ eventTypes: EventType[] }> {
    return this.makeRequest('/api/v5/events/types');
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

    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/v5/events/upload-flyer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
}

export default EventsService;
