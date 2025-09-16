import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface CrashReport {
  id: string;
  timestamp: number;
  errorType: 'javascript_error' | 'form_validation_error' | 'network_error' | 'storage_error' | 'performance_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  formContext?: {
    sessionId?: string;
    formType: string;
    currentStep: number;
    formData?: any;
    lastAction?: string;
  };
  deviceInfo: {
    platform: string;
    version: string;
    model?: string;
    screenSize: { width: number; height: number };
  };
  appInfo: {
    version: string;
    buildNumber: string;
    environment: 'development' | 'staging' | 'production';
  };
  userInfo?: {
    userId?: string;
    sessionDuration: number;
  };
  breadcrumbs: Array<{
    timestamp: number;
    category: string;
    message: string;
    level: 'info' | 'warning' | 'error';
    data?: any;
  }>;
}

export interface PerformanceIssue {
  type: 'slow_render' | 'memory_leak' | 'large_bundle' | 'slow_navigation';
  threshold: number;
  actualValue: number;
  context: string;
  timestamp: number;
}

class CrashReportingService {
  private static instance: CrashReportingService;
  private breadcrumbs: CrashReport['breadcrumbs'] = [];
  private readonly MAX_BREADCRUMBS = 50;
  private readonly STORAGE_KEY = '@crash_reports';
  private readonly MAX_STORED_REPORTS = 100;
  private formContext: CrashReport['formContext'] | null = null;

  static getInstance(): CrashReportingService {
    if (!CrashReportingService.instance) {
      CrashReportingService.instance = new CrashReportingService();
    }
    return CrashReportingService.instance;
  }

  constructor() {
    this.setupGlobalErrorHandler();
    this.setupUnhandledPromiseRejectionHandler();
  }

  // Set current form context for better error reporting
  setFormContext(context: CrashReport['formContext']): void {
    this.formContext = context;
    this.addBreadcrumb('form', `Form context updated: ${context.formType} step ${context.currentStep}`, 'info');
  }

  // Clear form context when form is completed or abandoned
  clearFormContext(): void {
    this.formContext = null;
    this.addBreadcrumb('form', 'Form context cleared', 'info');
  }

  // Add breadcrumb for tracking user actions
  addBreadcrumb(
    category: string, 
    message: string, 
    level: 'info' | 'warning' | 'error' = 'info',
    data?: any
  ): void {
    const breadcrumb = {
      timestamp: Date.now(),
      category,
      message,
      level,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  // Report JavaScript errors
  async reportError(
    error: Error,
    errorType: CrashReport['errorType'] = 'javascript_error',
    severity: CrashReport['severity'] = 'medium',
    additionalContext?: any
  ): Promise<void> {
    const report: CrashReport = {
      id: this.generateReportId(),
      timestamp: Date.now(),
      errorType,
      severity,
      message: error.message,
      stack: error.stack,
      formContext: this.formContext,
      deviceInfo: await this.getDeviceInfo(),
      appInfo: this.getAppInfo(),
      userInfo: await this.getUserInfo(),
      breadcrumbs: [...this.breadcrumbs],
    };

    // Add additional context if provided
    if (additionalContext) {
      report.breadcrumbs.push({
        timestamp: Date.now(),
        category: 'error_context',
        message: 'Additional error context',
        level: 'error',
        data: additionalContext,
      });
    }

    await this.storeReport(report);
    await this.sendReportToServer(report);

    // Add breadcrumb for the error itself
    this.addBreadcrumb('error', `${errorType}: ${error.message}`, 'error', {
      stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
    });
  }

  // Report form validation errors
  async reportFormValidationError(
    fieldName: string,
    errorMessage: string,
    formData: any,
    stepNumber: number
  ): Promise<void> {
    const error = new Error(`Form validation error in field '${fieldName}': ${errorMessage}`);
    
    await this.reportError(error, 'form_validation_error', 'low', {
      fieldName,
      stepNumber,
      formDataKeys: Object.keys(formData || {}),
      formType: this.formContext?.formType,
    });
  }

  // Report network errors
  async reportNetworkError(
    url: string,
    method: string,
    statusCode?: number,
    responseText?: string
  ): Promise<void> {
    const error = new Error(`Network error: ${method} ${url} - Status: ${statusCode || 'Unknown'}`);
    
    await this.reportError(error, 'network_error', 'medium', {
      url,
      method,
      statusCode,
      responseText: responseText?.substring(0, 500), // Limit response text
    });
  }

  // Report storage errors
  async reportStorageError(operation: string, key: string, error: Error): Promise<void> {
    const storageError = new Error(`Storage error during ${operation} for key '${key}': ${error.message}`);
    
    await this.reportError(storageError, 'storage_error', 'high', {
      operation,
      key,
      originalError: error.message,
    });
  }

  // Report performance issues
  async reportPerformanceIssue(issue: PerformanceIssue): Promise<void> {
    const error = new Error(`Performance issue: ${issue.type} - Expected: ${issue.threshold}, Actual: ${issue.actualValue}`);
    
    await this.reportError(error, 'performance_issue', 'medium', {
      performanceIssue: issue,
    });
  }

  // Get stored crash reports
  async getStoredReports(): Promise<CrashReport[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error retrieving crash reports:', error);
      return [];
    }
  }

  // Get crash report statistics
  async getCrashStatistics(): Promise<{
    totalReports: number;
    reportsByType: Record<string, number>;
    reportsBySeverity: Record<string, number>;
    recentReports: CrashReport[];
    topErrors: Array<{ message: string; count: number; lastOccurrence: number }>;
  }> {
    const reports = await this.getStoredReports();
    
    const reportsByType: Record<string, number> = {};
    const reportsBySeverity: Record<string, number> = {};
    const errorCounts: Record<string, { count: number; lastOccurrence: number }> = {};

    reports.forEach(report => {
      // Count by type
      reportsByType[report.errorType] = (reportsByType[report.errorType] || 0) + 1;
      
      // Count by severity
      reportsBySeverity[report.severity] = (reportsBySeverity[report.severity] || 0) + 1;
      
      // Count error messages
      const errorKey = report.message.substring(0, 100); // First 100 chars
      if (!errorCounts[errorKey]) {
        errorCounts[errorKey] = { count: 0, lastOccurrence: 0 };
      }
      errorCounts[errorKey].count++;
      errorCounts[errorKey].lastOccurrence = Math.max(
        errorCounts[errorKey].lastOccurrence,
        report.timestamp
      );
    });

    const topErrors = Object.entries(errorCounts)
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurrence: data.lastOccurrence,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentReports = reports
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      totalReports: reports.length,
      reportsByType,
      reportsBySeverity,
      recentReports,
      topErrors,
    };
  }

  // Clear old crash reports
  async clearOldReports(olderThanDays: number = 30): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
      
      const recentReports = reports.filter(report => report.timestamp > cutoffTime);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentReports));
    } catch (error) {
      console.error('Error clearing old reports:', error);
    }
  }

  // Private helper methods
  private setupGlobalErrorHandler(): void {
    const originalHandler = ErrorUtils.getGlobalHandler();
    
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      this.reportError(
        error,
        'javascript_error',
        isFatal ? 'critical' : 'high'
      ).catch(console.error);
      
      // Call original handler
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }

  private setupUnhandledPromiseRejectionHandler(): void {
    // Note: React Native doesn't have a built-in unhandled promise rejection handler
    // This would need to be implemented with a promise tracking system
    // For now, we'll add a breadcrumb when promises are created in form context
  }

  private generateReportId(): string {
    return `crash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getDeviceInfo(): Promise<CrashReport['deviceInfo']> {
    const { width, height } = require('react-native').Dimensions.get('window');
    
    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      model: Platform.OS === 'ios' ? 'iPhone' : 'Android', // Could be enhanced with device detection
      screenSize: { width, height },
    };
  }

  private getAppInfo(): CrashReport['appInfo'] {
    // In a real app, these would come from build configuration
    return {
      version: '1.0.0',
      buildNumber: '1',
      environment: __DEV__ ? 'development' : 'production',
    };
  }

  private async getUserInfo(): Promise<CrashReport['userInfo']> {
    // In a real app, this would come from authentication context
    return {
      sessionDuration: Date.now() - (this.formContext?.sessionId ? 
        parseInt(this.formContext.sessionId.split('_')[1]) : Date.now()),
    };
  }

  private async storeReport(report: CrashReport): Promise<void> {
    try {
      const reports = await this.getStoredReports();
      reports.push(report);
      
      // Keep only the most recent reports
      if (reports.length > this.MAX_STORED_REPORTS) {
        reports.splice(0, reports.length - this.MAX_STORED_REPORTS);
      }
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(reports));
    } catch (error) {
      console.error('Error storing crash report:', error);
    }
  }

  private async sendReportToServer(report: CrashReport): Promise<void> {
    try {
      // In a real app, this would send to your crash reporting service
      // For now, we'll just log it
      if (__DEV__) {
        console.warn('Crash Report:', {
          id: report.id,
          type: report.errorType,
          severity: report.severity,
          message: report.message,
          formContext: report.formContext,
        });
      }
      
      // Example implementation:
      // await fetch('https://your-crash-reporting-endpoint.com/reports', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(report),
      // });
    } catch (error) {
      console.error('Error sending crash report to server:', error);
    }
  }
}

export default CrashReportingService;