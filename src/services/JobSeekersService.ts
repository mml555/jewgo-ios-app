// Job Seekers Service for managing job seeker profiles and applications
import { configService } from '../config/ConfigService';
import authService from './AuthService';
import guestService from './GuestService';
import { debugLog, errorLog, warnLog } from '../utils/logger';

export interface JobSeeker {
  id: string;
  full_name: string;
  title: string;
  summary: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  resume_url?: string;
  city: string;
  state: string;
  zip_code?: string;
  country: string;
  is_remote_ok: boolean;
  willing_to_relocate: boolean;
  experience_years: number;
  experience_level: string;
  skills: string[];
  qualifications: string[];
  languages: string[];
  desired_job_types: string[];
  desired_industries: string[];
  desired_salary_min?: number;
  desired_salary_max?: number;
  availability: string;
  kosher_environment_preferred: boolean;
  shabbat_observant: boolean;
  jewish_organization_preferred: boolean;
  is_featured: boolean;
  is_verified: boolean;
  profile_completion_percentage: number;
  view_count: number;
  contact_count: number;
  created_at: string;
  updated_at: string;
  last_active_at?: string;
  // Enhanced fields
  age?: number;
  gender?: string;
  headshot_url?: string;
  bio?: string;
  meeting_link?: string;
  // Computed fields for frontend
  location?: string;
  experience?: string;
  is_favorited?: boolean;
}

export interface JobSeekersResponse {
  success: boolean;
  data?: {
    job_seekers: JobSeeker[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}

export interface JobSeekerResponse {
  success: boolean;
  data?: JobSeeker;
  error?: string;
}

export interface JobSeekersSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  state?: string;
  experience_level?: string;
  availability?: string;
  skills?: string;
  job_types?: string;
  industries?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

class JobSeekersService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = configService.apiBaseUrl;
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    debugLog('🔍 JobSeekersService: Getting auth headers...');

    // Add authentication headers
    const authHeaders = await authService.getAuthHeaders();
    if (authHeaders && Object.keys(authHeaders).length > 0) {
      debugLog('🔍 JobSeekersService: Using auth headers:', authHeaders);
      Object.assign(headers, authHeaders);
    } else {
      // Fallback to guest headers
      debugLog(
        '🔍 JobSeekersService: No auth headers, trying guest headers...',
      );

      // Ensure guest service is initialized
      try {
        await guestService.initialize();
        debugLog('🔍 JobSeekersService: Guest service initialized');
      } catch (error) {
        debugLog(
          '🔍 JobSeekersService: Guest service initialization error:',
          error,
        );
      }

      const guestHeaders = await guestService.getAuthHeadersAsync();
      if (guestHeaders && Object.keys(guestHeaders).length > 0) {
        debugLog('🔍 JobSeekersService: Using guest headers:', guestHeaders);
        Object.assign(headers, guestHeaders);
      } else {
        debugLog('🔍 JobSeekersService: No auth or guest headers available');

        // Try to create a guest session if none exists
        try {
          debugLog(
            '🔍 JobSeekersService: Attempting to create guest session...',
          );
          await guestService.createGuestSession();
          const newGuestHeaders = await guestService.getAuthHeadersAsync();
          if (newGuestHeaders && Object.keys(newGuestHeaders).length > 0) {
            debugLog(
              '🔍 JobSeekersService: Created guest session, using headers:',
              newGuestHeaders,
            );
            Object.assign(headers, newGuestHeaders);
          }
        } catch (error) {
          debugLog(
            '🔍 JobSeekersService: Failed to create guest session:',
            error,
          );
        }
      }
    }

    debugLog('🔍 JobSeekersService: Final headers:', headers);
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const headers = await this.getHeaders();

      debugLog('🌐 JobSeekersService API Request:', url);
      debugLog('🌐 JobSeekersService Headers:', headers);

      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      debugLog('🌐 JobSeekersService Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP error! status: ${response.status}`;
        debugLog('🌐 JobSeekersService Error response:', errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      debugLog('🌐 JobSeekersService Success response:', data);
      return data;
    } catch (error) {
      debugLog('🌐 JobSeekersService Request failed:', error);
      throw error;
    }
  }

  // =============================================================================
  // JOB SEEKERS MANAGEMENT API
  // =============================================================================

  // Get all job seekers with filtering and pagination
  async getJobSeekers(
    params?: JobSeekersSearchParams,
  ): Promise<JobSeekersResponse> {
    try {
      const queryParams = new URLSearchParams();

      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.city) queryParams.append('city', params.city);
      if (params?.state) queryParams.append('state', params.state);
      if (params?.experience_level)
        queryParams.append('experience_level', params.experience_level);
      if (params?.availability)
        queryParams.append('availability', params.availability);
      if (params?.skills) queryParams.append('skills', params.skills);
      if (params?.job_types) queryParams.append('job_types', params.job_types);
      if (params?.industries)
        queryParams.append('industries', params.industries);
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params?.sort_order)
        queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const endpoint = `/job-seekers${queryString ? `?${queryString}` : ''}`;

      debugLog(
        '🔍 JobSeekersService: Fetching job seekers with params:',
        params,
      );
      debugLog('🔍 JobSeekersService: Endpoint:', endpoint);

      const response = await this.request<JobSeekersResponse>(endpoint);

      debugLog('🔍 JobSeekersService: Raw response:', response);

      // Transform the data for frontend compatibility
      if (response.success && response.data?.job_seekers) {
        const transformedSeekers = response.data.job_seekers.map(seeker => ({
          ...seeker,
          location: `${seeker.city}, ${seeker.state}`,
          experience: `${seeker.experience_years} years`,
          skills: Array.isArray(seeker.skills)
            ? seeker.skills
            : seeker.skills
            ? [seeker.skills]
            : [],
        }));

        debugLog(
          '🔍 JobSeekersService: Transformed seekers:',
          transformedSeekers.length,
          'items',
        );

        response.data.job_seekers = transformedSeekers;
      }

      return response;
    } catch (error) {
      warnLog('⚠️ JobSeekersService: Failed to fetch job seekers:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch job seekers',
      };
    }
  }

  // Get a specific job seeker by ID
  async getJobSeeker(id: string): Promise<JobSeekerResponse> {
    try {
      debugLog('🔍 JobSeekersService: Fetching job seeker with ID:', id);

      if (!id) {
        throw new Error('Job seeker ID is required');
      }

      const response = await this.request<JobSeekerResponse>(
        `/job-seekers/${id}`,
      );

      debugLog(
        '🔍 JobSeekersService: Individual job seeker response:',
        response,
      );

      // Transform the data for frontend compatibility
      if (response.success && response.data) {
        response.data = {
          ...response.data,
          location: `${response.data.city}, ${response.data.state}`,
          experience: `${response.data.experience_years} years`,
          skills: Array.isArray(response.data.skills)
            ? response.data.skills
            : response.data.skills
            ? [response.data.skills]
            : [],
        };

        debugLog(
          '🔍 JobSeekersService: Transformed job seeker data:',
          response.data,
        );
      }

      return response;
    } catch (error) {
      errorLog('❌ JobSeekersService: Failed to load job seeker:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to load job seeker',
      };
    }
  }

  // Create a new job seeker profile
  async createJobSeeker(
    jobSeekerData: Partial<JobSeeker>,
  ): Promise<JobSeekerResponse> {
    try {
      const response = await this.request<JobSeekerResponse>('/job-seekers', {
        method: 'POST',
        body: JSON.stringify(jobSeekerData),
      });

      return response;
    } catch (error) {
      errorLog('❌ Failed to create job seeker:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create job seeker',
      };
    }
  }

  // Update a job seeker profile
  async updateJobSeeker(
    id: string,
    jobSeekerData: Partial<JobSeeker>,
  ): Promise<JobSeekerResponse> {
    try {
      const response = await this.request<JobSeekerResponse>(
        `/job-seekers/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(jobSeekerData),
        },
      );

      return response;
    } catch (error) {
      errorLog('❌ Failed to update job seeker:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update job seeker',
      };
    }
  }

  // Delete (deactivate) a job seeker profile
  async deleteJobSeeker(
    id: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request<{
        success: boolean;
        message?: string;
        error?: string;
      }>(`/job-seekers/${id}`, {
        method: 'DELETE',
      });

      return {
        success: response.success,
        error: response.error,
      };
    } catch (error) {
      errorLog('❌ Failed to delete job seeker:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete job seeker',
      };
    }
  }

  // Mark job seeker as found work
  async markFoundWork(id: string, notes?: string): Promise<JobSeekerResponse> {
    try {
      const response = await this.request<JobSeekerResponse>(
        `/job-seekers/${id}/mark-found-work`,
        {
          method: 'POST',
          body: JSON.stringify({ notes }),
        },
      );

      return response;
    } catch (error) {
      errorLog('❌ Failed to mark job seeker as found work:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to mark job seeker as found work',
      };
    }
  }

  // Repost a job seeker listing
  async repostJobSeeker(id: string): Promise<JobSeekerResponse> {
    try {
      const response = await this.request<JobSeekerResponse>(
        `/job-seekers/${id}/repost`,
        {
          method: 'POST',
        },
      );

      return response;
    } catch (error) {
      errorLog('❌ Failed to repost job seeker:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to repost job seeker',
      };
    }
  }

  // Get job seeker limits for a user
  async getJobSeekerLimits(
    userId: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.request<{
        success: boolean;
        data?: any;
        error?: string;
      }>(`/job-seekers/user/${userId}/limits`);

      return response;
    } catch (error) {
      errorLog('❌ Failed to fetch job seeker limits:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch job seeker limits',
      };
    }
  }
}

export default new JobSeekersService();
