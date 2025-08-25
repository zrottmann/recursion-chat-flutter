/**
 * Appwrite Realtime Service
 * Handles real-time subscriptions, live updates, and notifications
 */

import { client, DATABASE_ID, COLLECTIONS, handleAppwriteError } from '../lib/appwrite';

class AppwriteRealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.eventHandlers = new Map();
    this.isConnected = false;
  }

  // Subscribe to real-time events
  subscribe(channels, callback, subscriptionId = null) {
    try {
      const id = subscriptionId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔔 Setting up real-time subscription:', { id, channels });
      
      // Create subscription
      const unsubscribe = client.subscribe(channels, (response) => {
        try {
          console.log('📡 Real-time event received:', response);
          
          const eventData = {
            event: response.event || response.events?.[0],
            payload: response.payload,
            timestamp: new Date().toISOString(),
            channels: response.channels,
            subscriptionId: id
          };
          
          // Call the callback with processed event data
          callback(eventData);
          
        } catch (error) {
          console.error('❌ Real-time callback error:', error);
        }
      });
      
      // Store subscription
      this.subscriptions.set(id, {
        channels,
        callback,
        unsubscribe,
        createdAt: new Date().toISOString()
      });
      
      console.log('✅ Real-time subscription created:', id);
      return id;
      
    } catch (error) {
      console.error('❌ Real-time subscription failed:', error);
      return null;
    }
  }

  // Unsubscribe from real-time events
  unsubscribe(subscriptionId) {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      
      if (subscription) {
        // Call the unsubscribe function
        subscription.unsubscribe();
        
        // Remove from subscriptions
        this.subscriptions.delete(subscriptionId);
        
        console.log('✅ Unsubscribed from real-time events:', subscriptionId);
        return true;
      }
      
      console.warn('⚠️ Subscription not found:', subscriptionId);
      return false;
      
    } catch (error) {
      console.error('❌ Unsubscribe failed:', error);
      return false;
    }
  }

  // Unsubscribe from all active subscriptions
  unsubscribeAll() {
    try {
      let count = 0;
      
      for (const [id, subscription] of this.subscriptions) {
        try {
          subscription.unsubscribe();
          count++;
        } catch (error) {
          console.error(`❌ Failed to unsubscribe ${id}:`, error);
        }
      }
      
      this.subscriptions.clear();
      this.eventHandlers.clear();
      
      console.log(`✅ Unsubscribed from ${count} real-time subscriptions`);
      return count;
      
    } catch (error) {
      console.error('❌ Unsubscribe all failed:', error);
      return 0;
    }
  }

  // Subscribe to user-specific messages
  subscribeToMessages(userId, callback) {
    const channels = [
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.messages}.documents`,
    ];
    
    const messageCallback = (eventData) => {
      const { event, payload } = eventData;
      
      // Only process message events for this user
      if (event && event.includes('.messages.') && payload) {
        // Check if user is the recipient
        if (payload.recipient_id === userId) {
          callback({
            type: 'new_message',
            message: payload,
            ...eventData
          });
        }
      }
    };
    
    return this.subscribe(channels, messageCallback, `messages_${userId}`);
  }

  // Subscribe to user trades/matches
  subscribeToTrades(userId, callback) {
    const channels = [
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.trades}.documents`,
    ];
    
    const tradeCallback = (eventData) => {
      const { event, payload } = eventData;
      
      // Only process trade events for this user
      if (event && event.includes('.trades.') && payload) {
        // Check if user is involved in this trade
        if (payload.user1_id === userId || payload.user2_id === userId) {
          let eventType = 'trade_updated';
          
          if (event.includes('.create')) {
            eventType = 'new_trade';
          } else if (event.includes('.update')) {
            eventType = 'trade_updated';
          } else if (event.includes('.delete')) {
            eventType = 'trade_deleted';
          }
          
          callback({
            type: eventType,
            trade: payload,
            ...eventData
          });
        }
      }
    };
    
    return this.subscribe(channels, tradeCallback, `trades_${userId}`);
  }

  // Subscribe to marketplace updates
  subscribeToMarketplace(callback, filters = {}) {
    const channels = [
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.items}.documents`,
    ];
    
    const marketplaceCallback = (eventData) => {
      const { event, payload } = eventData;
      
      if (event && event.includes('.items.') && payload) {
        // Apply filters
        if (filters.location && payload.location !== filters.location) {
          return;
        }
        
        if (filters.category && payload.category !== filters.category) {
          return;
        }
        
        let eventType = 'listing_updated';
        
        if (event.includes('.create')) {
          eventType = 'new_listing';
        } else if (event.includes('.update')) {
          eventType = 'listing_updated';
        } else if (event.includes('.delete')) {
          eventType = 'listing_deleted';
        }
        
        callback({
          type: eventType,
          listing: payload,
          ...eventData
        });
      }
    };
    
    const filterId = `marketplace_${filters.location || 'all'}_${filters.category || 'all'}`;
    return this.subscribe(channels, marketplaceCallback, filterId);
  }

  // Subscribe to user profile updates
  subscribeToUserUpdates(userId, callback) {
    const channels = [
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.users}.documents.${userId}`,
    ];
    
    const userCallback = (eventData) => {
      const { event, payload } = eventData;
      
      if (event && event.includes('.users.') && payload) {
        callback({
          type: 'profile_updated',
          profile: payload,
          ...eventData
        });
      }
    };
    
    return this.subscribe(channels, userCallback, `user_${userId}`);
  }

  // Subscribe to AI matching updates for a user
  subscribeToMatches(userId, callback) {
    const channels = [
      `databases.${DATABASE_ID}.collections.matching_suggestions.documents`,
      `user:${userId}:matches`,
      `user:${userId}:notifications`
    ];
    
    const matchCallback = (eventData) => {
      const { event, payload } = eventData;
      
      // Handle different types of match events
      if (event && payload) {
        let eventType = 'match_updated';
        
        // New match suggestions
        if (event.includes('matching_suggestions') && event.includes('.create')) {
          // Check if this user is involved in the match
          if (payload.user1_id === userId || payload.user2_id === userId) {
            eventType = 'new_match';
          }
        }
        // Match status updates
        else if (event.includes('matching_suggestions') && event.includes('.update')) {
          if (payload.user1_id === userId || payload.user2_id === userId) {
            if (payload.status === 'accepted') {
              eventType = 'match_accepted';
            } else if (payload.status === 'declined') {
              eventType = 'match_declined';
            }
          }
        }
        // Custom notification events
        else if (event.includes('new_match')) {
          eventType = 'new_match';
        }
        else if (event.includes('match_accepted')) {
          eventType = 'match_accepted';
        }
        
        // Only call callback for relevant events
        if (eventType) {
          callback({
            type: eventType,
            match: payload,
            ...eventData
          });
        }
      }
    };
    
    return this.subscribe(channels, matchCallback, `matches_${userId}`);
  }

  // Enhanced user notification subscription for AI matching
  subscribeToUserNotifications(userId, handlers = {}) {
    try {
      console.log('🔔 Setting up AI matching notifications for user:', userId);
      
      // Subscribe to match events
      const matchSubscriptionId = this.subscribeToMatches(userId, (eventData) => {
        const { type } = eventData;
        
        if (handlers[type]) {
          try {
            handlers[type](eventData);
          } catch (error) {
            console.error(`Error in ${type} handler:`, error);
          }
        }
        
        // Generic handler for all match events
        if (handlers.onMatch) {
          try {
            handlers.onMatch(eventData);
          } catch (error) {
            console.error('Error in onMatch handler:', error);
          }
        }
      });
      
      console.log('✅ AI matching notifications setup complete');
      return matchSubscriptionId;
      
    } catch (error) {
      console.error('❌ Failed to setup AI matching notifications:', error);
      return null;
    }
  }

  // Setup comprehensive real-time for a user
  setupUserRealtime(userId, callbacks = {}) {
    try {
      console.log('🔔 Setting up comprehensive real-time for user:', userId);
      
      const subscriptions = {};
      
      // Subscribe to messages
      if (callbacks.onMessage) {
        subscriptions.messages = this.subscribeToMessages(userId, callbacks.onMessage);
      }
      
      // Subscribe to trades
      if (callbacks.onTrade) {
        subscriptions.trades = this.subscribeToTrades(userId, callbacks.onTrade);
      }
      
      // Subscribe to AI matches
      if (callbacks.onMatch || callbacks.new_match || callbacks.match_accepted) {
        subscriptions.matches = this.subscribeToMatches(userId, callbacks.onMatch);
      }
      
      // Subscribe to marketplace updates
      if (callbacks.onMarketplace) {
        subscriptions.marketplace = this.subscribeToMarketplace(callbacks.onMarketplace);
      }
      
      // Subscribe to profile updates
      if (callbacks.onProfile) {
        subscriptions.profile = this.subscribeToUserUpdates(userId, callbacks.onProfile);
      }
      
      // Store user subscription group
      this.eventHandlers.set(`user_${userId}`, subscriptions);
      
      console.log('✅ User real-time setup complete:', Object.keys(subscriptions));
      
      return subscriptions;
      
    } catch (error) {
      console.error('❌ Setup user real-time failed:', error);
      return {};
    }
  }

  // Cleanup user real-time subscriptions
  cleanupUserRealtime(userId) {
    try {
      const subscriptions = this.eventHandlers.get(`user_${userId}`);
      
      if (subscriptions) {
        let count = 0;
        
        Object.values(subscriptions).forEach(subId => {
          if (this.unsubscribe(subId)) {
            count++;
          }
        });
        
        this.eventHandlers.delete(`user_${userId}`);
        
        console.log(`✅ Cleaned up ${count} user real-time subscriptions for user:`, userId);
        return count;
      }
      
      return 0;
      
    } catch (error) {
      console.error('❌ Cleanup user real-time failed:', error);
      return 0;
    }
  }

  // Send typing indicator (simulated real-time)
  sendTypingIndicator(senderId, recipientId, isTyping) {
    try {
      // In a real implementation, this would trigger a real-time event
      // For now, we'll simulate it with a custom event
      const event = new CustomEvent('typing-indicator', {
        detail: {
          senderId,
          recipientId,
          isTyping,
          timestamp: new Date().toISOString()
        }
      });
      
      document.dispatchEvent(event);
      
      console.log('💬 Typing indicator sent:', { senderId, recipientId, isTyping });
      return true;
      
    } catch (error) {
      console.error('❌ Send typing indicator failed:', error);
      return false;
    }
  }

  // Listen for typing indicators
  onTypingIndicator(callback) {
    const handler = (event) => callback(event.detail);
    document.addEventListener('typing-indicator', handler);
    
    // Return cleanup function
    return () => document.removeEventListener('typing-indicator', handler);
  }

  // Send read receipt (simulated real-time)
  sendReadReceipt(senderId, recipientId, messageId) {
    try {
      const event = new CustomEvent('read-receipt', {
        detail: {
          senderId,
          recipientId,
          messageId,
          timestamp: new Date().toISOString()
        }
      });
      
      document.dispatchEvent(event);
      
      console.log('👁️ Read receipt sent:', { senderId, recipientId, messageId });
      return true;
      
    } catch (error) {
      console.error('❌ Send read receipt failed:', error);
      return false;
    }
  }

  // Listen for read receipts
  onReadReceipt(callback) {
    const handler = (event) => callback(event.detail);
    document.addEventListener('read-receipt', handler);
    
    // Return cleanup function
    return () => document.removeEventListener('read-receipt', handler);
  }

  // Connection status
  checkConnectionStatus() {
    // In a real implementation, this would check the WebSocket connection
    return this.isConnected;
  }

  // Get active subscriptions info
  getActiveSubscriptions() {
    const subscriptions = [];
    
    for (const [id, subscription] of this.subscriptions) {
      subscriptions.push({
        id,
        channels: subscription.channels,
        createdAt: subscription.createdAt
      });
    }
    
    return subscriptions;
  }

  // Health check
  healthCheck() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: this.subscriptions.size,
      eventHandlers: this.eventHandlers.size,
      status: this.subscriptions.size > 0 ? 'active' : 'idle'
    };
  }

  // Event debugging
  enableDebugging() {
    this.debugMode = true;
    console.log('🐛 Real-time debugging enabled');
  }

  disableDebugging() {
    this.debugMode = false;
    console.log('🐛 Real-time debugging disabled');
  }
}

// Create and export singleton instance
const appwriteRealtime = new AppwriteRealtimeService();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  appwriteRealtime.unsubscribeAll();
});

// Named exports for convenience
export const subscribeToUserNotifications = (userId, handlers) => 
  appwriteRealtime.subscribeToUserNotifications(userId, handlers);

export const subscribeToMessages = (userId, callback) => 
  appwriteRealtime.subscribeToMessages(userId, callback);

export const subscribeToTrades = (userId, callback) => 
  appwriteRealtime.subscribeToTrades(userId, callback);

export const subscribeToMatches = (userId, callback) => 
  appwriteRealtime.subscribeToMatches(userId, callback);

export const subscribeToMarketplace = (callback, filters) => 
  appwriteRealtime.subscribeToMarketplace(callback, filters);

export default appwriteRealtime;