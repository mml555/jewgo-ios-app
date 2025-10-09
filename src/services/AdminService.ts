import { configService } from '../config/ConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = configService.getApiUrl();

export interface DashboardStats {
  pending_reviews: number;
  pending_claims: number;
  pending_flags: number;
  overdue_reviews: number;
  reviews_today: number;
  approvals_today: number;
  rejections_today: number;
}

export interface ReviewQueueItem {
  id: string;
  entity_id: string;
  entity_type: string;
  entity_title: string;
  priority: number;
  status: string;
  assigned_to?: string;
  created_at: string;
}

export interface ContentFlag {
  id: string;
  entity_id: string;
  entity_type: string;
  flag_type: string;
  reason: string;
  severity: string;
  status: string;
  created_at: string;
}

class AdminService {
  private static async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken');
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

  static async getDashboard(): Promise<{
    dashboard: {
      statistics: DashboardStats;
      recentActions: any[];
      performance: any;
    };
  }> {
    return this.makeRequest('/api/v5/admin/dashboard');
  }

  static async getReviewQueue(filters?: {
    entityType?: string;
    status?: string;
    priority?: number;
    assignedTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ reviews: ReviewQueueItem[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/api/v5/admin/review-queue?${params.toString()}`);
  }

  static async assignReview(
    reviewId: string,
    assignedTo: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/admin/reviews/${reviewId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assignedTo }),
    });
  }

  static async reviewContent(
    reviewId: string,
    action: 'approve' | 'reject',
    adminNotes: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/api/v5/admin/reviews/${reviewId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, adminNotes }),
    });
  }

  static async getContentFlags(filters?: {
    status?: string;
    severity?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ flags: ContentFlag[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/api/v5/admin/flags?${params.toString()}`);
  }

  static async flagContent(
    entityId: string,
    entityType: string,
    data: {
      flagType: string;
      reason: string;
      severity?: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/api/v5/admin/flag/${entityType}/${entityId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async resolveFlag(
    flagId: string,
    data: {
      resolution: string;
      actionTaken: string;
      adminNotes: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/api/v5/admin/flags/${flagId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getAdminActions(filters?: {
    actionType?: string;
    entityType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ actions: any[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/api/v5/admin/actions?${params.toString()}`);
  }
}

export default AdminService;
