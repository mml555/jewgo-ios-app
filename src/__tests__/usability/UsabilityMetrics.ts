/**
 * Usability Metrics Collection and Analysis
 * Tracks user interactions and performance metrics during testing
 */

export interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  startTime: Date;
  endTime?: Date;
  scenarios: ScenarioResult[];
  overallRating: number;
  feedback: string[];
}

export interface DeviceInfo {
  model: string; // iPhone 16, iPhone 15, etc.
  screenSize: string; // 6.1", 6.7", etc.
  iosVersion: string;
  accessibilitySettings: AccessibilitySettings;
}

export interface AccessibilitySettings {
  voiceOverEnabled: boolean;
  dynamicTypeSize: string;
  highContrastEnabled: boolean;
  reduceMotionEnabled: boolean;
  buttonShapesEnabled: boolean;
}

export interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  errors: ErrorEvent[];
  interactions: UserInteraction[];
  taskRating: number; // 1-5 scale
  difficultyRating: number; // 1-5 scale
  comments: string;
}

export interface ErrorEvent {
  timestamp: Date;
  errorType: 'validation' | 'navigation' | 'input' | 'system';
  component: string;
  description: string;
  resolved: boolean;
  resolutionTime?: number; // seconds
}

export interface UserInteraction {
  timestamp: Date;
  component: string;
  action: string; // 'tap', 'swipe', 'type', 'voice', etc.
  duration?: number; // milliseconds
  successful: boolean;
}

export class UsabilityMetricsCollector {
  private currentSession: UserSession | null = null;
  private currentScenario: ScenarioResult | null = null;

  /**
   * Start a new user session
   */
  startSession(userId: string, deviceInfo: DeviceInfo): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.currentSession = {
      sessionId,
      userId,
      deviceInfo,
      startTime: new Date(),
      scenarios: [],
      overallRating: 0,
      feedback: [],
    };

    return sessionId;
  }

  /**
   * End the current session
   */
  endSession(overallRating: number, feedback: string[]): UserSession | null {
    if (!this.currentSession) return null;

    this.currentSession.endTime = new Date();
    this.currentSession.overallRating = overallRating;
    this.currentSession.feedback = feedback;

    const session = this.currentSession;
    this.currentSession = null;
    return session;
  }

  /**
   * Start a new scenario within the session
   */
  startScenario(scenarioId: string, scenarioName: string): void {
    if (!this.currentSession) return;

    this.currentScenario = {
      scenarioId,
      scenarioName,
      startTime: new Date(),
      completed: false,
      errors: [],
      interactions: [],
      taskRating: 0,
      difficultyRating: 0,
      comments: '',
    };
  }

  /**
   * End the current scenario
   */
  endScenario(
    completed: boolean,
    taskRating: number,
    difficultyRating: number,
    comments: string
  ): void {
    if (!this.currentSession || !this.currentScenario) return;

    this.currentScenario.endTime = new Date();
    this.currentScenario.completed = completed;
    this.currentScenario.taskRating = taskRating;
    this.currentScenario.difficultyRating = difficultyRating;
    this.currentScenario.comments = comments;

    this.currentSession.scenarios.push(this.currentScenario);
    this.currentScenario = null;
  }

  /**
   * Log a user interaction
   */
  logInteraction(
    component: string,
    action: string,
    duration?: number,
    successful: boolean = true
  ): void {
    if (!this.currentScenario) return;

    this.currentScenario.interactions.push({
      timestamp: new Date(),
      component,
      action,
      duration,
      successful,
    });
  }

  /**
   * Log an error event
   */
  logError(
    errorType: ErrorEvent['errorType'],
    component: string,
    description: string
  ): string {
    if (!this.currentScenario) return '';

    const errorId = `error_${Date.now()}`;
    this.currentScenario.errors.push({
      timestamp: new Date(),
      errorType,
      component,
      description,
      resolved: false,
    });

    return errorId;
  }

  /**
   * Mark an error as resolved
   */
  resolveError(errorIndex: number): void {
    if (!this.currentScenario || !this.currentScenario.errors[errorIndex]) return;

    const error = this.currentScenario.errors[errorIndex];
    error.resolved = true;
    error.resolutionTime = (new Date().getTime() - error.timestamp.getTime()) / 1000;
  }

  /**
   * Get current session data
   */
  getCurrentSession(): UserSession | null {
    return this.currentSession;
  }
}

export class UsabilityAnalyzer {
  /**
   * Analyze completion rates across sessions
   */
  static analyzeCompletionRates(sessions: UserSession[]): {
    overall: number;
    byScenario: { [scenarioId: string]: number };
    byDevice: { [deviceModel: string]: number };
  } {
    const totalSessions = sessions.length;
    let completedSessions = 0;
    const scenarioStats: { [scenarioId: string]: { total: number; completed: number } } = {};
    const deviceStats: { [deviceModel: string]: { total: number; completed: number } } = {};

    sessions.forEach(session => {
      const allScenariosCompleted = session.scenarios.every(s => s.completed);
      if (allScenariosCompleted) completedSessions++;

      // Track by device
      const deviceModel = session.deviceInfo.model;
      if (!deviceStats[deviceModel]) {
        deviceStats[deviceModel] = { total: 0, completed: 0 };
      }
      deviceStats[deviceModel].total++;
      if (allScenariosCompleted) deviceStats[deviceModel].completed++;

      // Track by scenario
      session.scenarios.forEach(scenario => {
        if (!scenarioStats[scenario.scenarioId]) {
          scenarioStats[scenario.scenarioId] = { total: 0, completed: 0 };
        }
        scenarioStats[scenario.scenarioId].total++;
        if (scenario.completed) scenarioStats[scenario.scenarioId].completed++;
      });
    });

    return {
      overall: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      byScenario: Object.fromEntries(
        Object.entries(scenarioStats).map(([id, stats]) => [
          id,
          stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        ])
      ),
      byDevice: Object.fromEntries(
        Object.entries(deviceStats).map(([model, stats]) => [
          model,
          stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        ])
      ),
    };
  }

  /**
   * Analyze task completion times
   */
  static analyzeCompletionTimes(sessions: UserSession[]): {
    averageSessionTime: number;
    averageScenarioTimes: { [scenarioId: string]: number };
    timeByDevice: { [deviceModel: string]: number };
  } {
    let totalSessionTime = 0;
    let sessionCount = 0;
    const scenarioTimes: { [scenarioId: string]: number[] } = {};
    const deviceTimes: { [deviceModel: string]: number[] } = {};

    sessions.forEach(session => {
      if (session.endTime) {
        const sessionDuration = session.endTime.getTime() - session.startTime.getTime();
        totalSessionTime += sessionDuration;
        sessionCount++;

        // Track by device
        const deviceModel = session.deviceInfo.model;
        if (!deviceTimes[deviceModel]) deviceTimes[deviceModel] = [];
        deviceTimes[deviceModel].push(sessionDuration);
      }

      session.scenarios.forEach(scenario => {
        if (scenario.endTime) {
          const scenarioDuration = scenario.endTime.getTime() - scenario.startTime.getTime();
          if (!scenarioTimes[scenario.scenarioId]) scenarioTimes[scenario.scenarioId] = [];
          scenarioTimes[scenario.scenarioId].push(scenarioDuration);
        }
      });
    });

    return {
      averageSessionTime: sessionCount > 0 ? totalSessionTime / sessionCount / 1000 : 0,
      averageScenarioTimes: Object.fromEntries(
        Object.entries(scenarioTimes).map(([id, times]) => [
          id,
          times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0
        ])
      ),
      timeByDevice: Object.fromEntries(
        Object.entries(deviceTimes).map(([model, times]) => [
          model,
          times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0
        ])
      ),
    };
  }

  /**
   * Analyze error patterns
   */
  static analyzeErrors(sessions: UserSession[]): {
    totalErrors: number;
    errorsByType: { [errorType: string]: number };
    errorsByComponent: { [component: string]: number };
    averageResolutionTime: number;
    unresolved: number;
  } {
    let totalErrors = 0;
    let totalResolutionTime = 0;
    let resolvedErrors = 0;
    let unresolved = 0;
    const errorsByType: { [errorType: string]: number } = {};
    const errorsByComponent: { [component: string]: number } = {};

    sessions.forEach(session => {
      session.scenarios.forEach(scenario => {
        scenario.errors.forEach(error => {
          totalErrors++;
          
          // Count by type
          errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
          
          // Count by component
          errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1;
          
          // Track resolution
          if (error.resolved && error.resolutionTime) {
            totalResolutionTime += error.resolutionTime;
            resolvedErrors++;
          } else if (!error.resolved) {
            unresolved++;
          }
        });
      });
    });

    return {
      totalErrors,
      errorsByType,
      errorsByComponent,
      averageResolutionTime: resolvedErrors > 0 ? totalResolutionTime / resolvedErrors : 0,
      unresolved,
    };
  }

  /**
   * Analyze user satisfaction
   */
  static analyzeSatisfaction(sessions: UserSession[]): {
    averageOverallRating: number;
    averageTaskRatings: { [scenarioId: string]: number };
    averageDifficultyRatings: { [scenarioId: string]: number };
    satisfactionByDevice: { [deviceModel: string]: number };
    commonFeedback: string[];
  } {
    let totalRating = 0;
    let ratingCount = 0;
    const taskRatings: { [scenarioId: string]: number[] } = {};
    const difficultyRatings: { [scenarioId: string]: number[] } = {};
    const deviceRatings: { [deviceModel: string]: number[] } = {};
    const allFeedback: string[] = [];

    sessions.forEach(session => {
      if (session.overallRating > 0) {
        totalRating += session.overallRating;
        ratingCount++;

        // Track by device
        const deviceModel = session.deviceInfo.model;
        if (!deviceRatings[deviceModel]) deviceRatings[deviceModel] = [];
        deviceRatings[deviceModel].push(session.overallRating);
      }

      // Collect feedback
      allFeedback.push(...session.feedback);

      session.scenarios.forEach(scenario => {
        if (scenario.taskRating > 0) {
          if (!taskRatings[scenario.scenarioId]) taskRatings[scenario.scenarioId] = [];
          taskRatings[scenario.scenarioId].push(scenario.taskRating);
        }

        if (scenario.difficultyRating > 0) {
          if (!difficultyRatings[scenario.scenarioId]) difficultyRatings[scenario.scenarioId] = [];
          difficultyRatings[scenario.scenarioId].push(scenario.difficultyRating);
        }
      });
    });

    return {
      averageOverallRating: ratingCount > 0 ? totalRating / ratingCount : 0,
      averageTaskRatings: Object.fromEntries(
        Object.entries(taskRatings).map(([id, ratings]) => [
          id,
          ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        ])
      ),
      averageDifficultyRatings: Object.fromEntries(
        Object.entries(difficultyRatings).map(([id, ratings]) => [
          id,
          ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        ])
      ),
      satisfactionByDevice: Object.fromEntries(
        Object.entries(deviceRatings).map(([model, ratings]) => [
          model,
          ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        ])
      ),
      commonFeedback: this.extractCommonFeedback(allFeedback),
    };
  }

  /**
   * Extract common themes from feedback
   */
  private static extractCommonFeedback(feedback: string[]): string[] {
    // Simple keyword extraction - in real implementation would use NLP
    const keywords = ['time picker', 'confusing', 'easy', 'difficult', 'intuitive', 'slow', 'fast'];
    const commonThemes: string[] = [];

    keywords.forEach(keyword => {
      const mentions = feedback.filter(f => 
        f.toLowerCase().includes(keyword.toLowerCase())
      ).length;
      
      if (mentions >= 2) {
        commonThemes.push(`${keyword}: ${mentions} mentions`);
      }
    });

    return commonThemes;
  }

  /**
   * Generate comprehensive usability report
   */
  static generateReport(sessions: UserSession[]): string {
    const completionRates = this.analyzeCompletionRates(sessions);
    const completionTimes = this.analyzeCompletionTimes(sessions);
    const errorAnalysis = this.analyzeErrors(sessions);
    const satisfaction = this.analyzeSatisfaction(sessions);

    let report = `# Usability Testing Report\n\n`;
    
    report += `## Executive Summary\n`;
    report += `- **Total Sessions**: ${sessions.length}\n`;
    report += `- **Overall Completion Rate**: ${completionRates.overall.toFixed(1)}%\n`;
    report += `- **Average Session Time**: ${(completionTimes.averageSessionTime / 60).toFixed(1)} minutes\n`;
    report += `- **Average Satisfaction**: ${satisfaction.averageOverallRating.toFixed(1)}/5.0\n`;
    report += `- **Total Errors**: ${errorAnalysis.totalErrors}\n\n`;

    report += `## Completion Rates by Scenario\n`;
    Object.entries(completionRates.byScenario).forEach(([scenario, rate]) => {
      report += `- **${scenario}**: ${rate.toFixed(1)}%\n`;
    });
    report += `\n`;

    report += `## Performance by Device\n`;
    Object.entries(completionRates.byDevice).forEach(([device, rate]) => {
      const avgTime = completionTimes.timeByDevice[device] || 0;
      const avgSatisfaction = satisfaction.satisfactionByDevice[device] || 0;
      report += `- **${device}**: ${rate.toFixed(1)}% completion, ${(avgTime / 60).toFixed(1)}min avg, ${avgSatisfaction.toFixed(1)}/5 satisfaction\n`;
    });
    report += `\n`;

    report += `## Error Analysis\n`;
    report += `- **Total Errors**: ${errorAnalysis.totalErrors}\n`;
    report += `- **Unresolved**: ${errorAnalysis.unresolved}\n`;
    report += `- **Average Resolution Time**: ${errorAnalysis.averageResolutionTime.toFixed(1)} seconds\n\n`;
    
    report += `**Errors by Type**:\n`;
    Object.entries(errorAnalysis.errorsByType).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`;
    });
    report += `\n`;

    report += `**Errors by Component**:\n`;
    Object.entries(errorAnalysis.errorsByComponent).forEach(([component, count]) => {
      report += `- ${component}: ${count}\n`;
    });
    report += `\n`;

    report += `## User Feedback Themes\n`;
    satisfaction.commonFeedback.forEach(theme => {
      report += `- ${theme}\n`;
    });
    report += `\n`;

    report += `## Recommendations\n`;
    if (completionRates.overall < 85) {
      report += `- **Priority**: Improve completion rate (currently ${completionRates.overall.toFixed(1)}%)\n`;
    }
    if (errorAnalysis.totalErrors > sessions.length * 2) {
      report += `- **Priority**: Reduce error rate (currently ${(errorAnalysis.totalErrors / sessions.length).toFixed(1)} errors per session)\n`;
    }
    if (satisfaction.averageOverallRating < 4.0) {
      report += `- **Priority**: Improve user satisfaction (currently ${satisfaction.averageOverallRating.toFixed(1)}/5.0)\n`;
    }

    return report;
  }
}