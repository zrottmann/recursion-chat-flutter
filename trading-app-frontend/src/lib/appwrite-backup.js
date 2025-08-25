/**
 * Appwrite Client Configuration for Trading Post Frontend
 * Provides centralized client setup and service initialization
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

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

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

// Authentication helpers
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    if (error.code === 401) {
      return null; // User not authenticated
    }
    throw error;
  }
};

export const getCurrentSession = async () => {
  try {
    const session = await account.getSession('current');
    return session;
  } catch (error) {
    if (error.code === 401) {
      return null; // No active session
    }
    throw error;
  }
};

// Real-time subscription helper
export const subscribeToRealtime = (channels, callback) => {
  return client.subscribe(channels, callback);
};

// Error handler
export const handleAppwriteError = (error) => {
  console.error('Appwrite Error:', error);
  
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

// Configuration validation
export const validateAppwriteConfig = () => {
  const errors = [];
  
  if (!APPWRITE_ENDPOINT) {
    errors.push('REACT_APP_APPWRITE_ENDPOINT is not configured');
  }
  
  if (!APPWRITE_PROJECT_ID) {
    errors.push('REACT_APP_APPWRITE_PROJECT_ID is not configured');
  }
  
  if (errors.length > 0) {
    console.warn('Appwrite Configuration Issues:', errors);
    return false;
  }
  
  console.log('✅ Appwrite client initialized:', {
    endpoint: APPWRITE_ENDPOINT,
    project: APPWRITE_PROJECT_ID,
    database: DATABASE_ID
  });
  
  return true;
};

// Initialize validation
validateAppwriteConfig();

export default client;