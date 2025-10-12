/**
 * Analytics instrumentation for Jobs UI
 * Ship with UI implementation
 */

export interface JobsSearchSubmittedEvent {
  q: string;                    // Search query
  filters_count: number;        // Active filter count
  tab: 'job_feed' | 'resume_feed';
}

export interface JobsTabChangedEvent {
  to: 'job_feed' | 'resume_feed' | 'post_job';
  from: string;                 // Previous tab
  timestamp: number;
}

export interface JobCardImpressionEvent {
  job_id: string;
  rank: number;                 // Position in feed
  grid_position: number;        // 1-2 (left/right)
  visible_percent: number;      // 0-100
}

export interface JobCardFavoritedEvent {
  job_id: string;
  favored: boolean;             // true|false
  source: 'card' | 'detail';
}

export interface FilterAppliedEvent {
  filter_keys: string[];        // ['job_type', 'industry', 'zip']
  result_count: number;
  tab: string;
}

class JobsAnalytics {
  private static instance: JobsAnalytics;

  private constructor() {
    // Initialize analytics SDK
    this.initializeAnalytics();
  }

  public static getInstance(): JobsAnalytics {
    if (!JobsAnalytics.instance) {
      JobsAnalytics.instance = new JobsAnalytics();
    }
    return JobsAnalytics.instance;
  }

  private initializeAnalytics(): void {
    // Initialize your analytics SDK here
    // Examples: Firebase Analytics, Mixpanel, Amplitude, etc.
    console.log('Analytics initialized for Jobs UI');
  }

  /**
   * Track search submission
   */
  public trackJobsSearchSubmitted(event: JobsSearchSubmittedEvent): void {
    const analyticsEvent = {
      event_name: 'jobs_search_submitted',
      properties: {
        search_query: event.q,
        filters_count: event.filters_count,
        active_tab: event.tab,
        timestamp: Date.now(),
      },
    };

    this.logEvent(analyticsEvent);
  }

  /**
   * Track tab changes
   */
  public trackJobsTabChanged(event: JobsTabChangedEvent): void {
    const analyticsEvent = {
      event_name: 'jobs_tab_changed',
      properties: {
        to: event.to,
        from: event.from,
        timestamp: event.timestamp,
      },
    };

    this.logEvent(analyticsEvent);
  }

  /**
   * Track job card impressions
   */
  public trackJobCardImpression(event: JobCardImpressionEvent): void {
    const analyticsEvent = {
      event_name: 'job_card_impression',
      properties: {
        job_id: event.job_id,
        rank: event.rank,
        grid_position: event.grid_position,
        visible_percent: event.visible_percent,
        timestamp: Date.now(),
      },
    };

    this.logEvent(analyticsEvent);
  }

  /**
   * Track job card favorites
   */
  public trackJobCardFavorited(event: JobCardFavoritedEvent): void {
    const analyticsEvent = {
      event_name: 'job_card_favorited',
      properties: {
        job_id: event.job_id,
        favored: event.favored,
        source: event.source,
        timestamp: Date.now(),
      },
    };

    this.logEvent(analyticsEvent);
  }

  /**
   * Track filter applications
   */
  public trackFilterApplied(event: FilterAppliedEvent): void {
    const analyticsEvent = {
      event_name: 'filter_applied',
      properties: {
        filter_keys: event.filter_keys,
        result_count: event.result_count,
        tab: event.tab,
        timestamp: Date.now(),
      },
    };

    this.logEvent(analyticsEvent);
  }

  /**
   * Generic event logging
   */
  private logEvent(event: any): void {
    // Replace with your actual analytics SDK call
    console.log('Analytics Event:', event);
    
    // Example implementations:
    
    // Firebase Analytics
    // firebase.analytics().logEvent(event.event_name, event.properties);
    
    // Mixpanel
    // mixpanel.track(event.event_name, event.properties);
    
    // Amplitude
    // amplitude.getInstance().logEvent(event.event_name, event.properties);
  }
}

// Export singleton instance
export const jobsAnalytics = JobsAnalytics.getInstance();

// Convenience functions for direct use
export const trackJobsSearchSubmitted = (event: JobsSearchSubmittedEvent) => 
  jobsAnalytics.trackJobsSearchSubmitted(event);

export const trackJobsTabChanged = (event: JobsTabChangedEvent) => 
  jobsAnalytics.trackJobsTabChanged(event);

export const trackJobCardImpression = (event: JobCardImpressionEvent) => 
  jobsAnalytics.trackJobCardImpression(event);

export const trackJobCardFavorited = (event: JobCardFavoritedEvent) => 
  jobsAnalytics.trackJobCardFavorited(event);

export const trackFilterApplied = (event: FilterAppliedEvent) => 
  jobsAnalytics.trackFilterApplied(event);
