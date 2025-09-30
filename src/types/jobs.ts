/**
 * Job Listing Types
 * 
 * This file defines types for job listings in the application.
 * These types can be extended when the backend API is implemented.
 */

export type JobType = 'part-time' | 'full-time' | 'contract' | 'seasonal' | 'internship';
export type JobLocation = 'on-site' | 'remote' | 'hybrid';
export type CompensationType = 'hourly' | 'salary' | 'commission' | 'stipend';

export interface JobListing {
  id: string;
  title: string;
  description: string;
  
  // Company/Organization details
  company_name?: string;
  company_id?: string;
  
  // Location
  location_type: JobLocation;
  city?: string;
  state?: string;
  zip_code?: string;
  address?: string;
  is_remote: boolean;
  
  // Compensation
  compensation_type: CompensationType;
  compensation_min?: number;
  compensation_max?: number;
  compensation_currency?: string;
  compensation_display?: string; // e.g., "$18/hr" or "$60K-$80K"
  
  // Job Type & Tags
  job_type: JobType;
  tags: string[]; // ['urgent', 'seasonal', etc.]
  
  // Requirements
  requirements?: string[];
  qualifications?: string[];
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
  
  // Additional Info
  benefits?: string[];
  schedule?: string; // e.g., "Monday-Friday, 9am-5pm"
  start_date?: string;
  
  // Contact
  contact_email?: string;
  contact_phone?: string;
  application_url?: string;
  
  // Metadata
  posted_date: string;
  expires_date?: string;
  is_active: boolean;
  is_urgent?: boolean;
  
  // Jewish community specific
  kosher_environment?: boolean;
  shabbat_observant?: boolean;
  jewish_organization?: boolean;
  
  // Standard fields
  created_at?: string;
  updated_at?: string;
}

export interface JobCardData {
  id: string;
  title: string;
  location: string; // Formatted location string (e.g., "Brooklyn, NY" or "Remote")
  compensation: string; // Formatted compensation (e.g., "$18/hr" or "$60K-$80K")
  tags: string[]; // Job tags (e.g., ['part-time', 'remote', 'urgent'])
  description?: string;
  company_name?: string;
}

/**
 * Converts a full JobListing to simplified JobCardData for display in cards
 */
export function convertJobToCardData(job: JobListing): JobCardData {
  // Format location
  let location = 'Location TBD';
  if (job.is_remote || job.location_type === 'remote') {
    location = 'Remote';
  } else if (job.location_type === 'hybrid') {
    location = job.city && job.state 
      ? `Hybrid - ${job.city}, ${job.state}` 
      : 'Hybrid';
  } else if (job.city && job.state) {
    location = `${job.city}, ${job.state}`;
  }
  
  // Format compensation
  let compensation = 'Compensation TBD';
  if (job.compensation_display) {
    compensation = job.compensation_display;
  } else if (job.compensation_min && job.compensation_max) {
    if (job.compensation_type === 'hourly') {
      compensation = `$${job.compensation_min}-$${job.compensation_max}/hr`;
    } else if (job.compensation_type === 'salary') {
      compensation = `$${Math.floor(job.compensation_min / 1000)}K-$${Math.floor(job.compensation_max / 1000)}K`;
    }
  } else if (job.compensation_min) {
    if (job.compensation_type === 'hourly') {
      compensation = `$${job.compensation_min}/hr`;
    } else if (job.compensation_type === 'salary') {
      compensation = `$${Math.floor(job.compensation_min / 1000)}K+`;
    }
  }
  
  // Build tags array
  const tags: string[] = [];
  if (job.job_type) {
    tags.push(job.job_type);
  }
  if (job.is_remote || job.location_type === 'remote') {
    tags.push('remote');
  }
  if (job.is_urgent) {
    tags.push('urgent');
  }
  // Add other custom tags
  if (job.tags) {
    tags.push(...job.tags);
  }
  
  return {
    id: job.id,
    title: job.title,
    location,
    compensation,
    tags: [...new Set(tags)], // Remove duplicates
    description: job.description,
    company_name: job.company_name,
  };
}
