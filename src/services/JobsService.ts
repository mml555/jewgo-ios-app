import { configService } from '../config/ConfigService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  requirements?: string;
  benefits?: string;
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
  }): Promise<{ jobListings: JobListing[]; pagination: any }> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return this.makeRequest(`/api/v5/jobs/listings?${params.toString()}`);
  }

  static async getJobById(id: string): Promise<{ jobListing: JobListing }> {
    return this.makeRequest(`/api/v5/jobs/listings/${id}`);
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
    return this.makeRequest('/api/v5/jobs/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateJobListing(
    id: string,
    data: Partial<any>,
  ): Promise<{ success: boolean; jobListing: JobListing }> {
    return this.makeRequest(`/api/v5/jobs/listings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteJobListing(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/jobs/listings/${id}`, {
      method: 'DELETE',
    });
  }

  static async repostJobListing(
    id: string,
  ): Promise<{ success: boolean; jobListing: JobListing }> {
    return this.makeRequest(`/api/v5/jobs/listings/${id}/repost`, {
      method: 'POST',
    });
  }

  static async markJobAsFilled(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/jobs/listings/${id}/mark-filled`, {
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

    return this.makeRequest(`/api/v5/jobs/my-listings?${params.toString()}`);
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

    return this.makeRequest(`/api/v5/jobs/seekers?${params.toString()}`);
  }

  static async getSeekerProfileById(
    id: string,
  ): Promise<{ profile: JobSeekerProfile }> {
    return this.makeRequest(`/api/v5/jobs/seekers/${id}`);
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
    return this.makeRequest('/api/v5/jobs/seekers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateSeekerProfile(
    id: string,
    data: Partial<any>,
  ): Promise<{ success: boolean; profile: JobSeekerProfile }> {
    return this.makeRequest(`/api/v5/jobs/seekers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteSeekerProfile(id: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/jobs/seekers/${id}`, {
      method: 'DELETE',
    });
  }

  static async getMyProfile(): Promise<{ profile: JobSeekerProfile | null }> {
    return this.makeRequest('/api/v5/jobs/my-profile');
  }

  static async contactSeeker(
    profileId: string,
    message: string,
    jobListingId?: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/jobs/seekers/${profileId}/contact`, {
      method: 'POST',
      body: JSON.stringify({ message, jobListingId }),
    });
  }

  static async saveProfile(
    profileId: string,
    notes?: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/jobs/seekers/${profileId}/save`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  static async unsaveProfile(profileId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/api/v5/jobs/seekers/${profileId}/save`, {
      method: 'DELETE',
    });
  }

  static async getMySavedProfiles(): Promise<{ savedProfiles: any[] }> {
    return this.makeRequest('/api/v5/jobs/my-saved-profiles');
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
    return this.makeRequest(`/api/v5/jobs/listings/${jobListingId}/apply`, {
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
      `/api/v5/jobs/listings/${jobListingId}/applications?${params.toString()}`,
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

    return this.makeRequest(
      `/api/v5/jobs/my-applications?${params.toString()}`,
    );
  }

  static async updateApplicationStatus(
    applicationId: string,
    status: string,
    employerNotes?: string,
    interviewScheduledAt?: string,
  ): Promise<{ success: boolean; application: JobApplication }> {
    return this.makeRequest(
      `/api/v5/jobs/applications/${applicationId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status, employerNotes, interviewScheduledAt }),
      },
    );
  }

  static async withdrawApplication(
    applicationId: string,
  ): Promise<{ success: boolean }> {
    return this.makeRequest(
      `/api/v5/jobs/applications/${applicationId}/withdraw`,
      {
        method: 'POST',
      },
    );
  }

  static async getApplicationStatistics(
    jobListingId: string,
  ): Promise<{ statistics: any }> {
    return this.makeRequest(
      `/api/v5/jobs/listings/${jobListingId}/application-stats`,
    );
  }

  // ============================================================================
  // LOOKUP DATA
  // ============================================================================

  static async getIndustries(): Promise<{ industries: Industry[] }> {
    return this.makeRequest('/api/v5/jobs/industries');
  }

  static async getJobTypes(): Promise<{ jobTypes: JobType[] }> {
    return this.makeRequest('/api/v5/jobs/job-types');
  }

  static async getCompensationStructures(): Promise<{
    compensationStructures: CompensationStructure[];
  }> {
    return this.makeRequest('/api/v5/jobs/compensation-structures');
  }

  static async getExperienceLevels(): Promise<{
    experienceLevels: ExperienceLevel[];
  }> {
    return this.makeRequest('/api/v5/jobs/experience-levels');
  }
}

export default JobsService;
