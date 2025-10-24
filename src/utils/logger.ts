/**
 * Centralized logging utility with different log levels and conditional logging
 * Prevents console message overflow and provides better debugging experience
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile?: boolean;
  maxMessages?: number;
}

class Logger {
  private config: LoggerConfig;
  private messageCount: number = 0;
  private messageBuffer: string[] = [];

  constructor(
    config: LoggerConfig = {
      level: __DEV__ ? LogLevel.WARN : LogLevel.ERROR, // Reduced logging in dev
      enableConsole: __DEV__,
      maxMessages: 100, // Reduced from 1000 to 100
    },
  ) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level && this.config.enableConsole;
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    // Add arguments if present
    if (args.length > 0) {
      return `${formattedMessage} ${args
        .map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(' ')}`;
    }

    return formattedMessage;
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    ...args: any[]
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    // Prevent message overflow
    if (
      this.config.maxMessages &&
      this.messageCount >= this.config.maxMessages
    ) {
      console.warn(
        `[Logger] Maximum message limit (${this.config.maxMessages}) reached. Further logs will be discarded.`,
      );
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, ...args);

    // Add to buffer for potential file logging
    if (this.config.maxMessages) {
      this.messageBuffer.push(formattedMessage);
      if (this.messageBuffer.length > this.config.maxMessages) {
        this.messageBuffer.shift(); // Remove oldest message
      }
    }

    this.messageCount++;

    // Console logging
    switch (level) {
      case LogLevel.DEBUG:
        console.log(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  // Specialized logging methods for common use cases
  apiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number,
  ): void {
    this.info(`API ${method} ${url}`, {
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  navigation(from: string, to: string, params?: any): void {
    this.debug(`Navigation: ${from} -> ${to}`, params);
  }

  userAction(action: string, details?: any): void {
    this.info(`User Action: ${action}`, details);
  }

  performance(operation: string, duration: number): void {
    this.info(`Performance: ${operation} completed in ${duration}ms`);
  }

  // Get current message count and buffer for debugging
  getStats(): { messageCount: number; bufferSize: number } {
    return {
      messageCount: this.messageCount,
      bufferSize: this.messageBuffer.length,
    };
  }

  // Clear the message buffer
  clearBuffer(): void {
    this.messageBuffer = [];
    this.messageCount = 0;
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports for common logging patterns
export const logApiCall = logger.apiCall.bind(logger);
export const logNavigation = logger.navigation.bind(logger);
export const logUserAction = logger.userAction.bind(logger);
export const logPerformance = logger.performance.bind(logger);

// Direct logging helpers - optimized for production
export const debugLog = (message: string, ...args: any[]) => {
  // Only log debug in development and with throttling
  if (__DEV__ && Math.random() < 0.1) { // Only 10% of debug logs
    logger.debug(message, ...args);
  }
};

export const infoLog = (message: string, ...args: any[]) => {
  // Throttle info logs to prevent spam
  if (Math.random() < 0.5) { // Only 50% of info logs
    logger.info(message, ...args);
  }
};

export const warnLog = (message: string, ...args: any[]) => {
  logger.warn(message, ...args);
};

export const errorLog = (message: string, ...args: any[]) => {
  logger.error(message, ...args);
};
