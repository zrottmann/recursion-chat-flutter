/**
 * Fixed Appwrite Client Configuration for Trading Post Frontend
 * Handles CORS and platform configuration properly
 */

import { Client, Account, Databases, Storage, Functions, Query, ID } from 'appwrite';

// Configuration - Load from environment or use NYC region as fallback
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || import.meta.env.REACT_APP_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || import.meta.env.REACT_APP_APPWRITE_PROJECT_ID || '689bdee000098bd9d55c';

// Database and Collection IDs
export const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'trading_post_db';
export const COLLECTIONS = {
  users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
  items: import.meta.env.VITE_APPWRITE_ITEMS_COLLECTION_ID || 'items',
  wants: import.meta.env.VITE_APPWRITE_WANTS_COLLECTION_ID || 'wants',
  trades: import.meta.env.VITE_APPWRITE_TRADES_COLLECTION_ID || 'trades',
  messages: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
};

// Storage Bucket IDs
export const BUCKETS = {
  itemImages: import.meta.env.VITE_APPWRITE_ITEM_IMAGES_BUCKET_ID || 'item_images',
  profileImages: import.meta.env.VITE_APPWRITE_PROFILE_IMAGES_BUCKET_ID || 'profile_images',
};

// Initialize Appwrite Client with proper configuration
const client = new Client();

// Set endpoint and project
client.setEndpoint(APPWRITE_ENDPOINT);
client.setProject(APPWRITE_PROJECT_ID);

// Log initialization for debugging
console.log('🚀 Appwrite Client Initialized:', {
  endpoint: APPWRITE_ENDPOINT,
  project: APPWRITE_PROJECT_ID,
  origin: window.location.origin,
  hostname: window.location.hostname
});

// Initialize Services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// Export client for direct access
export { client, Query, ID };

// Helper functions
export const getFilePreview = (bucketId, fileId, width = 400, height = 400, quality = 85) => {
  return storage.getFilePreview(bucketId, fileId, width, height, undefined, quality);
};

export const getFileView = (bucketId, fileId) => {
  return storage.getFileView(bucketId, fileId);
};

export const getFileDownload = (bucketId, fileId) => {
  return storage.getFileDownload(bucketId, fileId);
};

// Authentication helpers with better error handling
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.log('getCurrentUser error:', error);
    if (error.code === 401) {
      return null; // User not authenticated
    }
    // Log CORS errors specifically
    if (error.message && error.message.includes('CORS')) {
      console.error('CORS Error detected:', {
        endpoint: APPWRITE_ENDPOINT,
        origin: window.location.origin,
        error: error.message
      });
    }
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    const session = await account.getSession('current');
    return session;
  } catch (error) {
    console.log('getCurrentSession error:', error);
    if (error.code === 401) {
      return null; // No active session
    }
    // Log CORS errors specifically
    if (error.message && error.message.includes('CORS')) {
      console.error('CORS Error detected:', {
        endpoint: APPWRITE_ENDPOINT,
        origin: window.location.origin,
        error: error.message
      });
    }
    throw error;
  }
};

// Real-time subscription helper
export const subscribeToRealtime = (channels, callback) => {
  return client.subscribe(channels, callback);
};

// Enhanced error handler with CORS detection
export const handleAppwriteError = (error) => {
  console.error('Appwrite Error:', error);
  
  // Check for CORS errors
  if (error.message && (error.message.includes('CORS') || error.message.includes('Failed to fetch'))) {
    console.error('🔴 CORS Configuration Issue Detected!');
    console.error('Current origin:', window.location.origin);
    console.error('Appwrite endpoint:', APPWRITE_ENDPOINT);
    console.error('Make sure', window.location.hostname, 'is added as a Web platform in Appwrite Console');
    
    return {
      code: 'cors_error',
      message: 'Connection blocked by security policy. Please contact support.',
      type: 'cors_error'
    };
  }
  
  const errorMessages = {
    400: 'Bad request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied. You don\'t have permission for this action.',
    404: 'Resource not found.',
    409: 'Conflict. Resource already exists.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    503: 'Service unavailable. Please try again later.',
  };
  
  const message = errorMessages[error.code] || error.message || 'An unexpected error occurred';
  
  return {
    code: error.code,
    message: message,
    type: error.type || 'general_error'
  };
};

// Configuration validation with enhanced debugging
export const validateAppwriteConfig = () => {
  const errors = [];
  
  if (!APPWRITE_ENDPOINT) {
    errors.push('APPWRITE_ENDPOINT is not configured');
  }
  
  if (!APPWRITE_PROJECT_ID) {
    errors.push('APPWRITE_PROJECT_ID is not configured');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️ Appwrite Configuration Issues:', errors);
    return false;
  }
  
  console.log('✅ Appwrite client validated:', {
    endpoint: APPWRITE_ENDPOINT,
    project: APPWRITE_PROJECT_ID,
    database: DATABASE_ID,
    origin: window.location.origin,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80')
  });
  
  // Warn if there might be a protocol mismatch
  if (window.location.protocol === 'http:' && APPWRITE_ENDPOINT.startsWith('https:')) {
    console.warn('⚠️ Protocol mismatch: Page is HTTP but Appwrite endpoint is HTTPS');
  }
  
  return true;
};

// Initialize validation
validateAppwriteConfig();

// Test CORS on initialization (only in development)
if (import.meta.env.DEV) {
  account.get().then(
    () => console.log('✅ CORS test passed - Appwrite connection successful'),
    (error) => {
      if (error.code !== 401) {
        console.warn('⚠️ CORS test failed:', error.message);
      }
    }
  );
}

export default client;