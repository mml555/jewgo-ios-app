import { configService } from '../config/ConfigService';
import { authService } from './AuthService';
import guestService from './GuestService';

const API_BASE_URL = configService.getApiUrl();

// Types
export interface JobListing {
  id: string;
  employer_id: string;
  job_title: string;
  company_name?: string;
  company_logo_url?: string;
  industry_id: string;
  industry_name: string;
  industry_icon: string;
  job_type_id: string;
  job_type_name: string;
  experience_level_id?: string;
  experience_level_name?: string;
  compensation_structure_id: string;
  compensation_structure_name: string;
  salary_min?: number;
  salary_max?: number;
  hourly_rate_min?: number;
  hourly_rate_max?: number;
  show_salary: boolean;
  zip_code: string;
  city?: string;
  state?: string;
  is_remote: boolean;
  is_hybrid: boolean;
  description: string;
  requirements?: string | string[]; // Can be string or array from database
  benefits?: string | string[];
  responsibilities?: string;
  skills?: string[];
  cta_link?: string;
  contact_email?: string;
  contact_phone?: string;
  status: string;
  view_count: number;
  application_count: number;
  total_applications: number;
  is_saved?: boolean;
  has_applied?: boolean;
  created_at: string;
  expires_at: string;
}

export interface JobSeekerProfile {
  id: string;
  user_id: string;
  name: string;
  age?: number;
  gender?: string;
  preferred_industry_id?: string;
  industry_name?: string;
  preferred_job_type_id?: string;
  job_type_name?: string;
  experience_level_id?: string;
  experience_level_name?: string;
  zip_code: string;
  city?: string;
  state?: string;
  willing_to_relocate: boolean;
  willing_to_remote: boolean;
  headshot_url?: string;
  bio?: string;
  resume_url?: string;
  skills?: string[];
  languages?: string[];
  certifications?: string[];
  meeting_link?: string;
  contact_email: string;
  contact_phone?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  availability?: string;
  status: string;
  view_count: number;
  contact_count: number;
  profile_completion_percentage: number;
  is_saved?: boolean;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_listing_id: string;
  applicant_id: string;
  job_title?: string;
  company_name?: string;
  company_logo_url?: string;
  industry_name?: string;
  job_type_name?: string;
  cover_letter?: string;
  resume_url?: string;
  portfolio_url?: string;
  status: string;
  applied_at: string;
  reviewed_at?: string;
  employer_notes?: string;
}

export interface Industry {
  id: string;
  key: string;
  name: string;
  icon_name: string;
  sort_order: number;
}

export interface JobType {
  id: string;
  key: string;
  name: string;
  sort_order: number;
}

export interface CompensationStructure {
  id: string;
  key: string;
  name: string;
  sort_order: number;
}

export interface ExperienceLevel {
  id: string;
  key: string;
  name: string;
  years_min?: number;
  years_max?: number;
  sort_order: number;
}

class JobsService {
  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    // Get authentication headers using the same pattern as main ApiService
    let authHeaders: Record<string, string> = {};

    if (authService.isAuthenticated()) {
      // User is authenticated - use user token
      authHeaders = await authService.getAuthHeaders();
    } else if (guestService.isGuestAuthenticated()) {
      // Guest is authenticated - use guest token
      authHeaders = await guestService.getAuthHeadersAsync();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Request failed' }));

      // Handle rate limiting gracefully - return error instead of throwing
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const errorMessage = retryAfter
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please try again later.';
        return {
          success: false,
          error: errorMessage,
          code: 'RATE_LIMIT_EXCEEDED',
        };
      }

      // Handle authentication errors - return error instead of throwing
      if (response.status === 403 || response.status === 401) {
        return {
          success: false,
          error: 'Authentication required. Please log in again.',
          code: 'AUTH_REQUIRED',
        };
      }

      // Return error response instead of throwing
      return {
        success: false,
        error: error.error || `HTTP ${response.status}`,
      };
    }

    return response.json();
  }

  // ============================================================================
  // JOB LISTINGS
  // ============================================================================

  static async getJobListings(filters?: {
    industry?: string;
    jobType?: string;
    experienceLevel?: string;
    isRemote?: boolean;
    isHybrid?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
    business_id?: string;
    employer_id?: string;
  }): Promise<{ jobListings: JobListing[]; pagination: any }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/jobs/listings?${params.toString()}`);
  }

  static async getJobById(id: string): Promise<{ jobListing: JobListing }> {
    return this.makeRequest(`/jobs/listings/${id}`);
  }

  static async createJobListing(data: {
    jobTitle: string;
    industryId: string;
    jobTypeId: string;
    experienceLevelId?: string;
    compensationStructureId: string;
    salaryMin?: number;
    salaryMax?: number;
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    showSalary?: boolean;
    zipCode: string;
    isRemote?: boolean;
    isHybrid?: boolean;
    description: string;
    requirements?: string;
    benefits?: string;
    responsibilities?: string;
    skills?: string[];
    ctaLink?: string;
    contactEmail?: string;
    contactPhone?: string;
    companyName?: string;
    companyWebsite?: string;
    companyLogoUrl?: string;
  }): Promise<{ success: boolean; jobListing: JobListing }> {
    return this.makeRequest('/jobs/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateJobListing(
    id: string,
    data: Partial<any>,
  ): Promise<{ success: boolean; jobListing: JobListing }> {
    return this.makeRequest(`/jobs/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteJobListing(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/listings/${id}`, {
      method: 'DELETE',
    });
  }

  static async repostJobListing(
    id: string,
  ): Promise<{ success: boolean; jobListing: JobListing }> {
    return this.makeRequest(`/jobs/listings/${id}/repost`, {
      method: 'POST',
    });
  }

  static async markJobAsFilled(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/listings/${id}/mark-filled`, {
      method: 'POST',
    });
  }

  static async getMyJobListings(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ jobListings: JobListing[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/jobs/my-listings?${params.toString()}`);
  }

  // ============================================================================
  // JOB SEEKER PROFILES
  // ============================================================================

  static async getSeekerProfiles(filters?: {
    industry?: string;
    jobType?: string;
    experienceLevel?: string;
    gender?: string;
    ageMin?: number;
    ageMax?: number;
    willingToRelocate?: boolean;
    willingToRemote?: boolean;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    page?: number;
    limit?: number;
  }): Promise<{ profiles: JobSeekerProfile[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/jobs/seekers?${params.toString()}`);
  }

  static async getSeekerProfileById(
    id: string,
  ): Promise<{ profile: JobSeekerProfile }> {
    const response = await this.makeRequest(`/jobs/seekers/${id}`);
    console.log(
      '🔍 JobsService.getSeekerProfileById - Raw response:',
      response,
    );
    console.log(
      '🔍 JobsService.getSeekerProfileById - response.data:',
      response.data,
    );
    console.log(
      '🔍 JobsService.getSeekerProfileById - response.profile:',
      response.profile,
    );

    // Transform the backend response format to match frontend expectations
    const profileData = response.data || response.profile || response;
    console.log(
      '🔍 JobsService.getSeekerProfileById - Final profile data:',
      profileData,
    );

    return {
      profile: profileData,
    };
  }

  static async createSeekerProfile(data: {
    name: string;
    age?: number;
    gender?: string;
    preferredIndustryId?: string;
    preferredJobTypeId?: string;
    experienceLevelId?: string;
    zipCode: string;
    willingToRelocate?: boolean;
    willingToRemote?: boolean;
    headshotUrl?: string;
    bio?: string;
    resumeUrl?: string;
    skills?: string[];
    languages?: string[];
    certifications?: string[];
    meetingLink?: string;
    contactEmail: string;
    contactPhone?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    desiredSalaryMin?: number;
    desiredSalaryMax?: number;
    availability?: string;
  }): Promise<{ success: boolean; profile: JobSeekerProfile }> {
    return this.makeRequest('/jobs/seekers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateSeekerProfile(
    id: string,
    data: Partial<any>,
  ): Promise<{ success: boolean; profile: JobSeekerProfile }> {
    return this.makeRequest(`/jobs/seekers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteSeekerProfile(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/seekers/${id}`, {
      method: 'DELETE',
    });
  }

  static async getMyProfile(): Promise<{ profile: JobSeekerProfile | null }> {
    return this.makeRequest('/jobs/my-profile');
  }

  static async contactSeeker(
    profileId: string,
    message: string,
    jobListingId?: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/seekers/${profileId}/contact`, {
      method: 'POST',
      body: JSON.stringify({ message, jobListingId }),
    });
  }

  static async saveProfile(
    profileId: string,
    notes?: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/seekers/${profileId}/save`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  static async unsaveProfile(profileId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/seekers/${profileId}/save`, {
      method: 'DELETE',
    });
  }

  static async getMySavedProfiles(): Promise<{ savedProfiles: any[] }> {
    return this.makeRequest('/jobs/my-saved-profiles');
  }

  // ============================================================================
  // JOB APPLICATIONS
  // ============================================================================

  static async applyToJob(
    jobListingId: string,
    data: {
      coverLetter?: string;
      resumeUrl?: string;
      portfolioUrl?: string;
      answers?: any;
    },
  ): Promise<{ success: boolean; application: JobApplication }> {
    return this.makeRequest(`/jobs/listings/${jobListingId}/apply`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getJobApplications(
    jobListingId: string,
    filters?: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{ applications: JobApplication[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(
      `/jobs/listings/${jobListingId}/applications?${params.toString()}`,
    );
  }

  static async getMyApplications(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ applications: JobApplication[] }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/jobs/my-applications?${params.toString()}`);
  }

  static async updateApplicationStatus(
    applicationId: string,
    status: string,
    employerNotes?: string,
    interviewScheduledAt?: string,
  ): Promise<{ success: boolean; application: JobApplication }> {
    return this.makeRequest(`/jobs/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, employerNotes, interviewScheduledAt }),
    });
  }

  static async withdrawApplication(
    applicationId: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/jobs/applications/${applicationId}/withdraw`, {
      method: 'POST',
    });
  }

  static async getApplicationStatistics(
    jobListingId: string,
  ): Promise<{ statistics: any }> {
    return this.makeRequest(`/jobs/listings/${jobListingId}/application-stats`);
  }

  // ============================================================================
  // LOOKUP DATA
  // ============================================================================

  static async getIndustries(): Promise<{ industries: Industry[] }> {
    return this.makeRequest('/jobs/industries');
  }

  static async getJobTypes(): Promise<{ jobTypes: JobType[] }> {
    return this.makeRequest('/jobs/job-types');
  }

  static async getCompensationStructures(): Promise<{
    compensationStructures: CompensationStructure[];
  }> {
    return this.makeRequest('/jobs/compensation-structures');
  }

  static async getExperienceLevels(): Promise<{
    experienceLevels: ExperienceLevel[];
  }> {
    return this.makeRequest('/jobs/experience-levels');
  }
}

export default JobsService;
