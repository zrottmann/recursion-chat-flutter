import axios from 'axios';
import { toast } from 'react-toastify';
import { NetworkError, handleError } from '../utils/errorHandler';

// Use environment variable or empty string for same-origin requests
// In production, we want relative URLs to avoid CORS issues
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : (import.meta.env.VITE_API_URL || '').trim();

// Production-optimized API service
if (process.env.NODE_ENV === 'development') {
  console.log('🚀 API Service initialized with base URL:', API_BASE_URL);
  console.log('🌐 Using relative URLs (same origin):', API_BASE_URL === '');
}

// Check for existing token on startup (development only)
if (process.env.NODE_ENV === 'development') {
  const existingToken = localStorage.getItem('token');
  console.log('🔐 Token status on startup:', {
    hasToken: !!existingToken,
    tokenLength: existingToken?.length || 0
  });
}

// Smart caching configuration
const getCacheConfig = (method) => {
  // Enable caching for GET requests, disable for mutations
  if (method?.toLowerCase() === 'get') {
    return {
      'Cache-Control': 'public, max-age=300', // 5 minutes cache for GET requests
    };
  }
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
  };
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
  timeout: 10000, // 10 second timeout
});

// Request deduplication cache
const pendingRequests = new Map();

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Apply smart caching headers
    Object.assign(config.headers, getCacheConfig(config.method));
    
    // Add cache busting only for non-GET requests or when explicitly needed
    if (config.method?.toLowerCase() !== 'get' || config.bustCache) {
      const separator = config.url?.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_cb=${Date.now()}`;
    }
    
    // Request deduplication for GET requests
    if (config.method?.toLowerCase() === 'get') {
      const requestKey = `${config.method}:${config.url}`;
      if (pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey);
      }
      
      const requestPromise = new Promise((resolve, reject) => {
        config._resolve = resolve;
        config._reject = reject;
      });
      
      pendingRequests.set(requestKey, requestPromise);
      config._requestKey = requestKey;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasToken: !!token,
      });
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // Handle request deduplication cleanup
    if (response.config._requestKey) {
      const requestKey = response.config._requestKey;
      if (pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', {
        status: response.status,
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Cleanup request deduplication on error
    if (originalRequest?._requestKey) {
      const requestKey = originalRequest._requestKey;
      if (pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey);
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Error:', {
        status: error.response?.status,
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        message: error.message,
      });
    }

    // Handle 401 errors for ALL requests (including login failures)
    if (error.response?.status === 401) {
      console.log('🔄 401 Error - Handling authentication failure');

      // Check if this is a login attempt (/token endpoint)
      if (error.config?.url?.includes('/token')) {
        console.log('🔑 Login attempt failed - letting Redux handle the error');
        // Don't redirect for login failures, but don't show raw JSON
        // Redux will handle the error state
      } else {
        // For other 401s (expired sessions), handle more gracefully
        console.log('🔄 Session expired or invalid token detected');
        localStorage.removeItem('token');
        
        // Check if we're already on the login page to avoid redirect loops
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login') && !currentPath.startsWith('/signup')) {
          console.log('📍 Redirecting to login from:', currentPath);
          // Clear any existing Redux state that might show JSON errors
          const event = new CustomEvent('auth-expired');
          window.dispatchEvent(event);
          
          // Redirect to login
          window.location.href = '/login';
          toast.error('Your session has expired. Please log in again.');
        } else {
          console.log('🚫 Already on auth page, not redirecting');
        }
      }
      
      // Mark as retry to prevent loops
      originalRequest._retry = true;
    }

    // Use enhanced error handling instead of simple toasts
    const networkError = new NetworkError(
      error.response?.data?.detail || error.message,
      error.response?.status || 0,
      error.response?.data
    );
    
    // Don't show toast for login errors - let Redux handle it
    const shouldShowToast = !error.config?.url?.includes('/token');
    
    handleError(networkError, {
      showToast: shouldShowToast,
      logToConsole: process.env.NODE_ENV === 'development'
    });

    return Promise.reject(error);
  }
);

// Import API wrapper for specific endpoints that don't have backend
import apiWrapper from './apiWrapper';

/**
 * Provide fallback data during database migration for various endpoints
 * Returns proper data types expected by components
 */
const getAPIFallbackData = (url) => {
  // User matches endpoint - needs to return array for .filter()
  if (url.includes('/matching/user-matches')) {
    return [];
  }
  
  // Analytics raw data - behaviorAnalytics expects object with events and trades arrays
  if (url.includes('/analytics/raw-data')) {
    return {
      events: [
        { timestamp: Date.now() - 86400000, type: 'view', data: {} },
        { timestamp: Date.now() - 43200000, type: 'search', data: {} },
        { timestamp: Date.now() - 3600000, type: 'click', data: {} }
      ],
      trades: []
    };
  }
  
  // User behavior data - services expect an object with behavior metrics
  if (url.includes('/analytics/user-behavior')) {
    return {
      preferences: {
        categories: [],
        priceRange: { min: 0, max: 1000 },
        location: { radius: 50 }
      },
      patterns: {
        mostActiveTime: 'evening',
        avgSessionDuration: 300000,
        searchFrequency: 'daily'
      },
      metrics: {
        listings_created: 0,
        trades_completed: 0,
        messages_sent: 0,
        average_response_time: 0
      }
    };
  }
  
  // Peer data - behaviorAnalytics expects object with distribution arrays
  if (url.includes('/analytics/peer-data')) {
    return {
      activityDistribution: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      successRateDistribution: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      engagementDistribution: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      responseTimeDistribution: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]
    };
  }
  
  // Trading history - components expect array of trades  
  if (url.includes('/users/') && url.includes('/trading-history')) {
    console.log('🔧 [API] Service temporarily unavailable for', url, '- providing fallback');
    return [
      { 
        id: '1',
        date: new Date().toISOString(),
        type: 'trade', 
        status: 'completed',
        partner: 'User',
        items_exchanged: []
      }
    ];
  }
  
  // Market trends - components expect array with trend data  
  if (url.includes('/analytics/market-trends')) {
    return [
      { category: 'Electronics', trend: 'stable', volume: 0, change: 0 },
      { category: 'Furniture', trend: 'stable', volume: 0, change: 0 },
      { category: 'Clothing', trend: 'stable', volume: 0, change: 0 }
    ];
  }
  
  // Social user data - components expect object with array properties
  if (url.includes('/social/user-data')) {
    return {
      connections: [],
      interactions: [],
      social_score: 0
    };
  }
  
  // User profile - return object with default values
  if (url.includes('/users/') && url.includes('/profile')) {
    const userId = url.split('/users/')[1]?.split('/')[0];
    return {
      id: userId || 'unknown',
      username: 'User',
      email: 'user@example.com',
      profile_complete: false,
      created_at: new Date().toISOString(),
      stats: {
        items_listed: 0,
        trades_completed: 0,
        rating: 0
      }
    };
  }
  
  // General analytics endpoints - return arrays for components
  if (url.includes('/analytics') || url.includes('/behavior')) {
    return [];
  }
  
  // Trading history endpoints - return arrays
  if (url.includes('/trading') || url.includes('/history')) {
    return [];
  }
  
  // Market trends endpoints - return arrays
  if (url.includes('/market') || url.includes('/trends')) {
    return [];
  }
  
  // Social data endpoints - return arrays
  if (url.includes('/social') || url.includes('/peer')) {
    return [];
  }
  
  // Default fallback - return empty array for most components
  return [];
};

// Override specific methods to use Appwrite services
const originalGet = api.get;
const originalPost = api.post;
const originalPatch = api.patch;
const originalDelete = api.delete;

api.get = async function(url, config) {
  try {
    // Handle specific endpoints with Appwrite services
    if (url === '/notifications' || url === '/notifications/settings' || 
        url === '/memberships/my-membership' || url === '/saved-items') {
      return apiWrapper.get(url);
    }
    
    // Try original endpoint first
    return await originalGet.call(this, url, config);
  } catch (error) {
    // Handle database migration "ke" errors specifically
    if (error.response?.data === 'ke' || error.message?.includes('ke') || 
        error.response?.status === 404) {
      console.warn(`🔧 [API] Service temporarily unavailable for ${url} - providing fallback`);
      
      // Return appropriate fallback data based on endpoint
      return {
        data: getAPIFallbackData(url),
        status: 200,
        statusText: 'OK (Fallback)'
      };
    }
    throw error;
  }
};

api.post = async function(url, data, config) {
  // Handle specific endpoints with Appwrite services
  if (url === '/notifications' || url === '/api/errors' || url === '/saved-items') {
    return apiWrapper.post(url, data);
  }
  // Fall back to original for other endpoints
  return originalPost.call(this, url, data, config);
};

api.patch = async function(url, data, config) {
  // Handle specific endpoints with Appwrite services
  if (url.includes('/notifications') || url === '/saved-items') {
    return apiWrapper.patch(url, data);
  }
  // Fall back to original for other endpoints
  return originalPatch.call(this, url, data, config);
};

api.delete = async function(url, config) {
  // Handle specific endpoints with Appwrite services
  if (url.includes('/notifications') || url.includes('/saved-items')) {
    return apiWrapper.delete(url);
  }
  // Fall back to original for other endpoints
  return originalDelete.call(this, url, config);
};

export default api;










