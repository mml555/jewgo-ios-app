import { safeAsyncStorage } from './SafeAsyncStorage';
import { errorLog } from '../utils/logger';

export interface FormAnalyticsEvent {
  eventType:
    | 'form_started'
    | 'step_completed'
    | 'step_abandoned'
    | 'validation_error'
    | 'form_submitted'
    | 'form_abandoned'
    | 'recovery_action'
    | 'auto_save_triggered';
  timestamp: number;
  sessionId: string;
  userId?: string;
  formType: string;
  stepNumber?: number;
  stepName?: string;
  timeSpentMs?: number;
  errorDetails?: {
    fieldName: string;
    errorType: string;
    errorMessage: string;
  };
  recoveryAction?: string;
  formData?: any;
  metadata?: Record<string, any>;
}

export interface FormSession {
  sessionId: string;
  formType: string;
  startTime: number;
  endTime?: number;
  currentStep: number;
  maxStepReached: number;
  completionStatus: 'in_progress' | 'completed' | 'abandoned';
  totalTimeSpent: number;
  stepTimes: Record<number, number>;
  validationErrors: number;
  recoveryActions: number;
  autoSaves: number;
}

export interface FormMetrics {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  completionRate: number;
  averageCompletionTime: number;
  averageTimePerStep: Record<number, number>;
  commonAbandonmentPoints: Array<{
    step: number;
    count: number;
    percentage: number;
  }>;
  commonValidationErrors: Array<{
    field: string;
    error: string;
    count: number;
  }>;
  recoverySuccessRate: number;
  autoSaveFrequency: number;
}

class FormAnalyticsService {
  private static instance: FormAnalyticsService;
  private currentSession: FormSession | null = null;
  private stepStartTime: number = 0;
  private readonly STORAGE_KEY = '@form_analytics';
  private readonly SESSION_KEY = '@current_form_session';
  private readonly MAX_EVENTS = 1000; // Limit stored events to prevent memory issues

  static getInstance(): FormAnalyticsService {
    if (!FormAnalyticsService.instance) {
      FormAnalyticsService.instance = new FormAnalyticsService();
    }
    return FormAnalyticsService.instance;
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start tracking a new form session
  async startFormSession(formType: string, userId?: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();

    this.currentSession = {
      sessionId,
      formType,
      startTime,
      currentStep: 1,
      maxStepReached: 1,
      completionStatus: 'in_progress',
      totalTimeSpent: 0,
      stepTimes: {},
      validationErrors: 0,
      recoveryActions: 0,
      autoSaves: 0,
    };

    this.stepStartTime = startTime;

    // Save session to storage
    await this.saveCurrentSession();

    // Track form started event
    await this.trackEvent({
      eventType: 'form_started',
      timestamp: startTime,
      sessionId,
      userId,
      formType,
      stepNumber: 1,
      stepName: 'Basic Info',
    });

    return sessionId;
  }

  // Track step navigation
  async trackStepNavigation(
    stepNumber: number,
    stepName: string,
    userId?: string,
  ): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    const timeSpentOnPreviousStep = now - this.stepStartTime;

    // Update previous step time
    if (this.currentSession.currentStep > 0) {
      this.currentSession.stepTimes[this.currentSession.currentStep] =
        (this.currentSession.stepTimes[this.currentSession.currentStep] || 0) +
        timeSpentOnPreviousStep;
    }

    // Track step completion for previous step
    if (stepNumber > this.currentSession.currentStep) {
      await this.trackEvent({
        eventType: 'step_completed',
        timestamp: now,
        sessionId: this.currentSession.sessionId,
        userId,
        formType: this.currentSession.formType,
        stepNumber: this.currentSession.currentStep,
        timeSpentMs: timeSpentOnPreviousStep,
      });
    }

    // Update session
    this.currentSession.currentStep = stepNumber;
    this.currentSession.maxStepReached = Math.max(
      this.currentSession.maxStepReached,
      stepNumber,
    );
    this.stepStartTime = now;

    await this.saveCurrentSession();
  }

  // Track validation errors
  async trackValidationError(
    fieldName: string,
    errorType: string,
    errorMessage: string,
    stepNumber: number,
    userId?: string,
  ): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.validationErrors++;

    await this.trackEvent({
      eventType: 'validation_error',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      userId,
      formType: this.currentSession.formType,
      stepNumber,
      errorDetails: {
        fieldName,
        errorType,
        errorMessage,
      },
    });

    await this.saveCurrentSession();
  }

  // Track recovery actions (user fixing errors)
  async trackRecoveryAction(
    action: string,
    stepNumber: number,
    fieldName?: string,
    userId?: string,
  ): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.recoveryActions++;

    await this.trackEvent({
      eventType: 'recovery_action',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      userId,
      formType: this.currentSession.formType,
      stepNumber,
      recoveryAction: action,
      metadata: { fieldName },
    });

    await this.saveCurrentSession();
  }

  // Track auto-save events
  async trackAutoSave(stepNumber: number, userId?: string): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.autoSaves++;

    await this.trackEvent({
      eventType: 'auto_save_triggered',
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      userId,
      formType: this.currentSession.formType,
      stepNumber,
    });

    await this.saveCurrentSession();
  }

  // Track form submission
  async trackFormSubmission(userId?: string, formData?: any): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    const timeSpentOnLastStep = now - this.stepStartTime;

    // Update last step time
    this.currentSession.stepTimes[this.currentSession.currentStep] =
      (this.currentSession.stepTimes[this.currentSession.currentStep] || 0) +
      timeSpentOnLastStep;

    this.currentSession.endTime = now;
    this.currentSession.completionStatus = 'completed';
    this.currentSession.totalTimeSpent = now - this.currentSession.startTime;

    await this.trackEvent({
      eventType: 'form_submitted',
      timestamp: now,
      sessionId: this.currentSession.sessionId,
      userId,
      formType: this.currentSession.formType,
      timeSpentMs: this.currentSession.totalTimeSpent,
      formData: this.sanitizeFormData(formData),
    });

    await this.saveCurrentSession();
    await this.endSession();
  }

  // Track form abandonment
  async trackFormAbandonment(
    stepNumber: number,
    userId?: string,
  ): Promise<void> {
    if (!this.currentSession) return;

    const now = Date.now();
    const timeSpentOnCurrentStep = now - this.stepStartTime;

    this.currentSession.stepTimes[stepNumber] =
      (this.currentSession.stepTimes[stepNumber] || 0) + timeSpentOnCurrentStep;

    this.currentSession.endTime = now;
    this.currentSession.completionStatus = 'abandoned';
    this.currentSession.totalTimeSpent = now - this.currentSession.startTime;

    await this.trackEvent({
      eventType: 'form_abandoned',
      timestamp: now,
      sessionId: this.currentSession.sessionId,
      userId,
      formType: this.currentSession.formType,
      stepNumber,
      timeSpentMs: timeSpentOnCurrentStep,
    });

    await this.saveCurrentSession();
    await this.endSession();
  }

  // Get current session metrics
  getCurrentSessionMetrics(): FormSession | null {
    return this.currentSession;
  }

  // Calculate form metrics from stored events
  async calculateFormMetrics(formType?: string): Promise<FormMetrics> {
    const events = await this.getStoredEvents();
    const sessions = await this.getStoredSessions();

    const filteredSessions = formType
      ? sessions.filter(s => s.formType === formType)
      : sessions;

    const totalSessions = filteredSessions.length;
    const completedSessions = filteredSessions.filter(
      s => s.completionStatus === 'completed',
    ).length;
    const abandonedSessions = filteredSessions.filter(
      s => s.completionStatus === 'abandoned',
    ).length;

    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    const completedSessionsData = filteredSessions.filter(
      s => s.completionStatus === 'completed',
    );
    const averageCompletionTime =
      completedSessionsData.length > 0
        ? completedSessionsData.reduce((sum, s) => sum + s.totalTimeSpent, 0) /
          completedSessionsData.length
        : 0;

    // Calculate average time per step
    const averageTimePerStep: Record<number, number> = {};
    for (let step = 1; step <= 5; step++) {
      const stepTimes = filteredSessions
        .map(s => s.stepTimes[step] || 0)
        .filter(time => time > 0);

      averageTimePerStep[step] =
        stepTimes.length > 0
          ? stepTimes.reduce((sum, time) => sum + time, 0) / stepTimes.length
          : 0;
    }

    // Find common abandonment points
    const abandonmentCounts: Record<number, number> = {};
    filteredSessions
      .filter(s => s.completionStatus === 'abandoned')
      .forEach(s => {
        abandonmentCounts[s.currentStep] =
          (abandonmentCounts[s.currentStep] || 0) + 1;
      });

    const commonAbandonmentPoints = Object.entries(abandonmentCounts)
      .map(([step, count]) => ({
        step: parseInt(step, 10),
        count,
        percentage: (count / abandonedSessions) * 100,
      }))
      .sort((a, b) => b.count - a.count);

    // Find common validation errors
    const errorCounts: Record<string, Record<string, number>> = {};
    events
      .filter(e => e.eventType === 'validation_error' && e.errorDetails)
      .forEach(e => {
        const { fieldName, errorMessage } = e.errorDetails!;
        const key = `${fieldName}:${errorMessage}`;
        if (!errorCounts[fieldName]) errorCounts[fieldName] = {};
        errorCounts[fieldName][errorMessage] =
          (errorCounts[fieldName][errorMessage] || 0) + 1;
      });

    const commonValidationErrors = Object.entries(errorCounts)
      .flatMap(([field, errors]) =>
        Object.entries(errors).map(([error, count]) => ({
          field,
          error,
          count,
        })),
      )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 errors

    // Calculate recovery success rate
    const totalErrors = filteredSessions.reduce(
      (sum, s) => sum + s.validationErrors,
      0,
    );
    const totalRecoveries = filteredSessions.reduce(
      (sum, s) => sum + s.recoveryActions,
      0,
    );
    const recoverySuccessRate =
      totalErrors > 0 ? (totalRecoveries / totalErrors) * 100 : 0;

    // Calculate auto-save frequency
    const totalAutoSaves = filteredSessions.reduce(
      (sum, s) => sum + s.autoSaves,
      0,
    );
    const autoSaveFrequency =
      totalSessions > 0 ? totalAutoSaves / totalSessions : 0;

    return {
      totalSessions,
      completedSessions,
      abandonedSessions,
      completionRate,
      averageCompletionTime,
      averageTimePerStep,
      commonAbandonmentPoints,
      commonValidationErrors,
      recoverySuccessRate,
      autoSaveFrequency,
    };
  }

  // Get dashboard data for monitoring
  async getDashboardData(): Promise<{
    overview: FormMetrics;
    recentSessions: FormSession[];
    realTimeMetrics: {
      activeSessions: number;
      todayCompletions: number;
      todayAbandonments: number;
      averageSessionTime: number;
    };
  }> {
    const overview = await this.calculateFormMetrics();
    const sessions = await this.getStoredSessions();

    const recentSessions = sessions
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, 10);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const todaySessions = sessions.filter(s => s.startTime >= todayTimestamp);
    const todayCompletions = todaySessions.filter(
      s => s.completionStatus === 'completed',
    ).length;
    const todayAbandonments = todaySessions.filter(
      s => s.completionStatus === 'abandoned',
    ).length;

    const activeSessions = sessions.filter(
      s => s.completionStatus === 'in_progress',
    ).length;

    const completedTodaySessions = todaySessions.filter(
      s => s.completionStatus === 'completed',
    );
    const averageSessionTime =
      completedTodaySessions.length > 0
        ? completedTodaySessions.reduce((sum, s) => sum + s.totalTimeSpent, 0) /
          completedTodaySessions.length
        : 0;

    return {
      overview,
      recentSessions,
      realTimeMetrics: {
        activeSessions,
        todayCompletions,
        todayAbandonments,
        averageSessionTime,
      },
    };
  }

  // Private helper methods
  private async trackEvent(event: FormAnalyticsEvent): Promise<void> {
    try {
      const events = await this.getStoredEvents();
      events.push(event);

      // Keep only the most recent events to prevent storage bloat
      if (events.length > this.MAX_EVENTS) {
        events.splice(0, events.length - this.MAX_EVENTS);
      }

      await safeAsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch (error) {
      errorLog('Error tracking analytics event:', error);
    }
  }

  private async getStoredEvents(): Promise<FormAnalyticsEvent[]> {
    try {
      const stored = await safeAsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      errorLog('Error retrieving analytics events:', error);
      return [];
    }
  }

  private async saveCurrentSession(): Promise<void> {
    if (!this.currentSession) return;

    try {
      await safeAsyncStorage.setItem(
        this.SESSION_KEY,
        JSON.stringify(this.currentSession),
      );

      // Also save to sessions history
      const sessions = await this.getStoredSessions();
      const existingIndex = sessions.findIndex(
        s => s.sessionId === this.currentSession!.sessionId,
      );

      if (existingIndex >= 0) {
        sessions[existingIndex] = this.currentSession;
      } else {
        sessions.push(this.currentSession);
      }

      await safeAsyncStorage.setItem('@form_sessions', JSON.stringify(sessions));
    } catch (error) {
      errorLog('Error saving current session:', error);
    }
  }

  private async getStoredSessions(): Promise<FormSession[]> {
    try {
      const stored = await safeAsyncStorage.getItem('@form_sessions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      errorLog('Error retrieving sessions:', error);
      return [];
    }
  }

  private async endSession(): Promise<void> {
    try {
      await safeAsyncStorage.removeItem(this.SESSION_KEY);
      this.currentSession = null;
      this.stepStartTime = 0;
    } catch (error) {
      errorLog('Error ending session:', error);
    }
  }

  private sanitizeFormData(formData: any): any {
    if (!formData) return null;

    // Remove sensitive information before storing
    const sanitized = { ...formData };
    delete sanitized.owner_email;
    delete sanitized.owner_phone;
    delete sanitized.business_email;
    delete sanitized.phone;
    delete sanitized.tax_id;
    delete sanitized.business_license;

    return sanitized;
  }

  // Restore session from storage (for app restart recovery)
  async restoreSession(): Promise<FormSession | null> {
    try {
      const stored = await safeAsyncStorage.getItem(this.SESSION_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
        this.stepStartTime = Date.now(); // Reset step timer
        return this.currentSession;
      }
    } catch (error) {
      errorLog('Error restoring session:', error);
    }
    return null;
  }

  // Clear all analytics data (for testing or privacy)
  async clearAllData(): Promise<void> {
    try {
      await safeAsyncStorage.multiRemove([
        this.STORAGE_KEY,
        this.SESSION_KEY,
        '@form_sessions',
      ]);
      this.currentSession = null;
      this.stepStartTime = 0;
    } catch (error) {
      errorLog('Error clearing analytics data:', error);
    }
  }
}

export default FormAnalyticsService;
