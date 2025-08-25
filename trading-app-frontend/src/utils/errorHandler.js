import { toast } from 'react-toastify';
import createDebugger from './debugLogger.js';

const debug = createDebugger('trading-post:errorHandler');

export class NetworkError extends Error {
  constructor(message, status, response = null) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
    this.response = response;
  }
}

export class ValidationError extends Error {
  constructor(message, errors = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Generate unique error ID for debugging
 */
export const generateErrorId = () => {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Enhanced error handler with different strategies for different error types
 */
export const handleError = (error, options = {}) => {
  const {
    showToast = true,
    logToConsole = process.env.NODE_ENV === 'development',
    logToService = process.env.NODE_ENV === 'production',
    fallbackMessage = 'An unexpected error occurred',
    context = 'Unknown'
  } = options;

  // Generate unique error ID for debugging
  const errorId = generateErrorId();

  // Enhanced logging with comprehensive error details
  if (logToConsole) {
    debug.error(`❌ [${context}] Error handled:`, {
      errorId,
      message: error.message,
      name: error.name,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status || error.status,
      originalError: error
    });
    console.error(`❌ [${context}] Error ID: ${errorId} - Full error details logged above`);
  }

  // Log to external service in production
  if (logToService) {
    logErrorToService(error);
  }

  let userMessage = fallbackMessage;
  let toastType = 'error';

  // Handle specific error types
  if (error instanceof NetworkError) {
    switch (error.status) {
      case 404:
        userMessage = 'The requested resource was not found. This feature may not be implemented yet.';
        toastType = 'warning';
        debug.warn('404 Not Found', { status: error.status, url: error.response?.url });
        break;
      case 405:
        userMessage = 'This action is not currently supported. The feature is being implemented.';
        toastType = 'warning';
        debug.warn('405 Method Not Allowed', { status: error.status, method: error.response?.method });
        break;
      case 401:
        userMessage = 'Authentication required. Please log in again.';
        debug.warn('401 Unauthorized', { status: error.status });
        break;
      case 403:
        userMessage = 'You do not have permission to perform this action.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        userMessage = 'Server error. Our team has been notified. Please try again later.';
        debug.error('500 Server Error', { status: error.status, response: error.response });
        break;
      case 503:
        userMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        break;
      default:
        userMessage = `${error.message || fallbackMessage} - Error ID: ${errorId}`;
    }
  } else if (error instanceof ValidationError) {
    userMessage = `${error.message} - Error ID: ${errorId}`;
    toastType = 'warning';
    debug.warn('Validation Error', { errorId, message: error.message, errors: error.errors });
  } else if (error instanceof AuthError) {
    userMessage = `${error.message} - Error ID: ${errorId}`;
    debug.error('Authentication Error', { errorId, message: error.message });
  } else if (error.message) {
    userMessage = `${error.message} - Error ID: ${errorId}`;
  }

  // Handle additional error types
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    userMessage = `Network connection error. Please check your internet connection. - Error ID: ${errorId}`;
    debug.error('Network Connection Error', { errorId, name: error.name, message: error.message });
  } else if (error.name === 'AbortError') {
    userMessage = 'Request was cancelled.';
    toastType = 'info';
    debug.info('Request Aborted', { errorId, name: error.name });
  }

  // Show toast notification
  if (showToast && userMessage) {
    switch (toastType) {
      case 'warning':
        toast.warning(userMessage);
        break;
      case 'info':
        toast.info(userMessage);
        break;
      case 'error':
      default:
        toast.error(userMessage);
    }
  }

  return {
    error,
    message: userMessage,
    type: toastType,
    errorId
  };
};

/**
 * Log errors to external service
 */
const logErrorToService = async (error) => {
  try {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      userId: getUserId(), // Implement this based on your auth system
    };

    // Add extra context for network errors
    if (error instanceof NetworkError) {
      errorData.status = error.status;
      errorData.response = error.response;
    }

    // Log error locally (no backend endpoint needed)
    debug.error('Logging to service', errorData);
    if (window.errorLoggingService) {
      window.errorLoggingService.logError(error, errorData);
    }
  } catch (e) {
    // Prevent error logging from causing more errors
    debug.error('Failed to log error to service', e);
  }
};

/**
 * Get current user ID for error logging
 */
const getUserId = () => {
  try {
    // This should be adapted to your auth system
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to decode the JWT or get user ID another way
      return 'authenticated_user';
    }
    return 'anonymous';
  } catch {
    return 'unknown';
  }
};

/**
 * Async error handler for use in async functions
 */
export const asyncErrorHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error);
      throw error; // Re-throw so calling code can handle it if needed
    }
  };
};

/**
 * React hook for error handling
 */
export const useErrorHandler = () => {
  return (error, options) => handleError(error, options);
};

export default {
  NetworkError,
  ValidationError,
  AuthError,
  handleError,
  asyncErrorHandler,
  useErrorHandler
};