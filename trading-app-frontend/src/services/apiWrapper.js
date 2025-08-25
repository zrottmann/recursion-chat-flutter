/**
 * API Wrapper Service
 * Provides a unified interface that maps old API calls to new Appwrite services
 */

import createDebugger from '../utils/debugLogger.js';

const debug = createDebugger('trading-post:apiWrapper');

import notificationService from './notificationService';
import membershipService from './membershipService';
import savedItemsService from './savedItemsService';
import errorLoggingService from './errorLoggingService';
import itemsService from './itemsService';
import matchingService from './matchingService';
import { account, databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';

class ApiWrapper {
  constructor() {
    this.currentUser = null;
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      if (!this.currentUser) {
        this.currentUser = await account.get();
      }
      return this.currentUser;
    } catch (error) {
      debug.error('Failed to get current user', error);
      return null;
    }
  }

  /**
   * Wrapper for GET requests
   */
  async get(endpoint) {
    debug.info('GET request', { endpoint });
    const user = await this.getCurrentUser();
    if (!user) {
      debug.error('GET request failed - user not authenticated', { endpoint });
      throw new Error('User not authenticated');
    }

    switch (endpoint) {
      case '/notifications':
        debug.debug('Fetching notifications', { userId: user.$id });
        return { data: await notificationService.getNotifications(user.$id) };
      
      case '/notifications/settings':
        return { data: await notificationService.getNotificationSettings(user.$id) };
      
      case '/memberships/my-membership':
        console.log('📋 [ApiWrapper] Membership request received:', { 
          userExists: !!user,
          userId: user?.$id,
          userEmail: user?.email 
        });
        debug.debug('Fetching membership', { userId: user.$id });
        
        if (!user || !user.$id) {
          console.error('❌ [ApiWrapper] No user available for membership fetch');
          return { data: { type: 'free', status: 'active', features: [] } };
        }
        
        return { data: await membershipService.getMyMembership(user.$id) };
      
      case '/saved-items':
        debug.debug('Fetching saved items', { userId: user.$id });
        return { data: await savedItemsService.getSavedItems(user.$id) };
        
      case '/matching/matching-preferences':
        const prefs = await matchingService.getMatchingPreferences();
        return { data: prefs.preferences };
      
      default:
        debug.warn('Unhandled GET endpoint', { endpoint });
        return { data: null };
    }
  }

  /**
   * Wrapper for POST requests
   */
  async post(endpoint, data) {
    debug.info('POST request', { endpoint, hasData: !!data });
    const user = await this.getCurrentUser();
    
    // Some endpoints don't require authentication
    const publicEndpoints = ['/api/errors'];
    if (!publicEndpoints.includes(endpoint) && !user) {
      debug.error('POST request failed - user not authenticated', { endpoint });
      throw new Error('User not authenticated');
    }

    switch (endpoint) {
      case '/items':
        debug.debug('Creating item', { userId: user?.$id });
        return { data: await itemsService.createItem(data) };
        
      case '/api/listings/search':
        return { data: await itemsService.searchItems(data) };
        
      case '/matching/accept-match':
        const acceptResult = await matchingService.acceptMatch(data.matchId);
        return { data: acceptResult };
        
      case '/matching/decline-match':
        const declineResult = await matchingService.declineMatch(data.matchId);
        return { data: declineResult };
        
      case '/notifications':
        return { data: await notificationService.createNotification(user.$id, data) };
      
      case '/api/errors':
        debug.debug('Logging error via API wrapper', { errorType: data?.type });
        return { data: errorLoggingService.logError(data) };
      
      case '/saved-items':
        return { data: await savedItemsService.saveItem(user.$id, data.itemId) };
      
      default:
        debug.warn('Unhandled POST endpoint', { endpoint });
        return { data: null };
    }
  }

  /**
   * Wrapper for PATCH requests
   */
  async patch(endpoint, data) {
    debug.info('PATCH request', { endpoint, hasData: !!data });
    const user = await this.getCurrentUser();
    if (!user) {
      debug.error('PATCH request failed - user not authenticated', { endpoint });
      throw new Error('User not authenticated');
    }

    // Handle dynamic endpoints
    if (endpoint.includes('/notifications/') && endpoint.endsWith('/read')) {
      const notificationId = endpoint.split('/')[2];
      return { data: await notificationService.markAsRead(notificationId) };
    }

    switch (endpoint) {
      case '/notifications/read-all':
        return { data: await notificationService.markAllAsRead(user.$id) };
      
      case '/notifications/settings':
        return { data: await notificationService.updateNotificationSettings(user.$id, data) };
      
      default:
        debug.warn('Unhandled PATCH endpoint', { endpoint });
        return { data: null };
    }
  }

  /**
   * Wrapper for DELETE requests
   */
  async delete(endpoint) {
    debug.info('DELETE request', { endpoint });
    const user = await this.getCurrentUser();
    if (!user) {
      debug.error('DELETE request failed - user not authenticated', { endpoint });
      throw new Error('User not authenticated');
    }

    // Handle dynamic endpoints
    if (endpoint.startsWith('/notifications/') && endpoint !== '/notifications/old') {
      const notificationId = endpoint.split('/')[2];
      return { data: await notificationService.deleteNotification(notificationId) };
    }

    if (endpoint.startsWith('/saved-items/')) {
      const itemId = endpoint.split('/')[2];
      return { data: await savedItemsService.unsaveItem(user.$id, itemId) };
    }

    switch (endpoint) {
      case '/notifications/old':
        return { data: await notificationService.deleteOldNotifications(user.$id) };
      
      default:
        debug.warn('Unhandled DELETE endpoint', { endpoint });
        return { data: null };
    }
  }
}

// Create a wrapper that mimics axios interface
const apiWrapper = new ApiWrapper();

// Export an object that looks like axios
export default {
  get: (endpoint) => apiWrapper.get(endpoint),
  post: (endpoint, data) => apiWrapper.post(endpoint, data),
  patch: (endpoint, data) => apiWrapper.patch(endpoint, data),
  delete: (endpoint) => apiWrapper.delete(endpoint),
  put: async (endpoint, data) => {
    // Handle PUT requests
    const user = await apiWrapper.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    switch (endpoint) {
      case '/users/me':
        // Update user profile
        const profileResult = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          user.$id,
          data
        );
        return { data: profileResult };
        
      case '/matching/matching-preferences':
        const prefsResult = await matchingService.updateMatchingPreferences(data);
        return { data: prefsResult };
        
      default:
        // Fallback to POST for unhandled endpoints
        return apiWrapper.post(endpoint, data);
    }
  }
};