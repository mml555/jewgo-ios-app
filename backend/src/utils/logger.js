/**
 * Simple logging utility for backend services
 * Provides structured logging with different levels
 */

const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
  constructor() {
    this.enableConsole = true;
    this.maxMessages = 1000;
    this.messageCount = 0;
  }

  shouldLog() {
    return this.enableConsole;
  }

  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;

    if (args.length > 0) {
      return `${formattedMessage} ${args
        .map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg),
        )
        .join(' ')}`;
    }

    return formattedMessage;
  }

  log(level, levelName, message, ...args) {
    if (!this.shouldLog()) return;

    // Prevent message overflow
    if (this.messageCount >= this.maxMessages) {
      console.warn(
        `[Logger] Maximum message limit (${this.maxMessages}) reached. Further logs will be discarded.`,
      );
      return;
    }

    const formattedMessage = this.formatMessage(levelName, message, ...args);
    this.messageCount++;

    // Console logging
    switch (level) {
      case 0: // DEBUG
        if (isDevelopment) console.log(formattedMessage);
        break;
      case 1: // INFO
        console.info(formattedMessage);
        break;
      case 2: // WARN
        console.warn(formattedMessage);
        break;
      case 3: // ERROR
        console.error(formattedMessage);
        break;
    }
  }

  debug(message, ...args) {
    this.log(0, 'DEBUG', message, ...args);
  }

  info(message, ...args) {
    this.log(1, 'INFO', message, ...args);
  }

  warn(message, ...args) {
    this.log(2, 'WARN', message, ...args);
  }

  error(message, ...args) {
    this.log(3, 'ERROR', message, ...args);
  }

  // Specialized logging methods
  apiCall(method, url, status, duration) {
    this.info(`API ${method} ${url}`, {
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  auth(action, success, userId) {
    this.info(`Auth: ${action}`, { success, userId });
  }

  database(operation, table, duration) {
    this.debug(`DB ${operation} on ${table}`, {
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  server(message, ...args) {
    this.info(`Server: ${message}`, ...args);
  }

  startup(message, ...args) {
    this.info(`🚀 ${message}`, ...args);
  }

  shutdown(message, ...args) {
    this.info(`🛑 ${message}`, ...args);
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;
