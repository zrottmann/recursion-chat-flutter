/**
 * Error Logging Service
 * Handles error logging without backend API
 */

class ErrorLoggingService {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors in memory
  }

  /**
   * Log an error
   */
  logError(error, context = {}) {
    const errorLog = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
      ...this.extractErrorInfo(error)
    };

    // Add to memory store
    this.errors.unshift(errorLog);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', errorLog);
    }

    // Store in localStorage for persistence with safe parsing
    try {
      let storedErrors = [];
      const stored = localStorage.getItem('error_logs');
      
      if (stored) {
        try {
          // Validate JSON format before parsing
          if (stored.trim().startsWith('[')) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              storedErrors = parsed;
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse stored error logs, starting fresh:', parseError);
          // Clear corrupted data
          localStorage.removeItem('error_logs');
        }
      }
      
      storedErrors.unshift(errorLog);
      // Keep only last 50 errors in localStorage
      const trimmedErrors = storedErrors.slice(0, 50);
      localStorage.setItem('error_logs', JSON.stringify(trimmedErrors));
    } catch (e) {
      console.error('Failed to store error log:', e);
    }

    return errorLog;
  }

  /**
   * Extract additional error information
   */
  extractErrorInfo(error) {
    const info = {};

    if (error.name) info.name = error.name;
    if (error.code) info.code = error.code;
    if (error.statusCode) info.statusCode = error.statusCode;
    if (error.response) {
      info.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
    }

    return info;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors.slice(0, limit);
  }

  /**
   * Get errors from localStorage with safe parsing
   */
  getStoredErrors() {
    try {
      const stored = localStorage.getItem('error_logs');
      if (!stored) return [];
      
      // Validate that it's actually JSON before parsing
      if (!stored.trim().startsWith('[') && !stored.trim().startsWith('{')) {
        console.warn('Invalid error logs format in localStorage');
        return [];
      }
      
      const parsed = JSON.parse(stored);
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.warn('Error logs is not an array');
        return [];
      }
      
      return parsed;
    } catch (e) {
      console.error('Failed to retrieve error logs:', e);
      // Clear corrupted data
      try {
        localStorage.removeItem('error_logs');
      } catch {}
      return [];
    }
  }

  /**
   * Clear error logs
   */
  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('error_logs');
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  }

  /**
   * Send error to external service (if configured)
   */
  async reportError(error, context = {}) {
    // Log locally first
    const errorLog = this.logError(error, context);

    // In production, you could send to services like Sentry, LogRocket, etc.
    // For now, we just log locally
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service
      // await sendToMonitoringService(errorLog);
    }

    return errorLog;
  }
}

// Export singleton instance
export default new ErrorLoggingService();