/**
 * Appwrite Realtime Hook
 * Provides real-time functionality for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import appwriteRealtime from '../services/appwriteRealtime';

export const useAppwriteRealtime = (userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const subscriptionsRef = useRef(new Map());

  // Setup real-time connection
  useEffect(() => {
    if (!userId) return;

    console.log('🔔 Setting up real-time for user:', userId);
    setIsConnected(true);

    // Cleanup function
    return () => {
      console.log('🔔 Cleaning up real-time subscriptions');
      appwriteRealtime.cleanupUserRealtime(userId);
      setIsConnected(false);
    };
  }, [userId]);

  // Subscribe to messages
  const subscribeToMessages = useCallback((callback) => {
    if (!userId) return null;

    const subscriptionId = appwriteRealtime.subscribeToMessages(userId, (eventData) => {
      const { type, message } = eventData;
      
      if (type === 'new_message') {
        // Add to notifications
        setNotifications(prev => [...prev, {
          id: message.$id,
          type: 'message',
          title: 'New Message',
          content: message.content,
          from: message.sender_id,
          timestamp: message.created_at,
          data: message
        }]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Call custom callback
        if (callback) callback(eventData);
      }
    });

    if (subscriptionId) {
      subscriptionsRef.current.set('messages', subscriptionId);
    }

    return subscriptionId;
  }, [userId]);

  // Subscribe to trades
  const subscribeToTrades = useCallback((callback) => {
    if (!userId) return null;

    const subscriptionId = appwriteRealtime.subscribeToTrades(userId, (eventData) => {
      const { type, trade } = eventData;
      
      // Add to notifications
      let title = 'Trade Update';
      if (type === 'new_trade') {
        title = 'New Trade Match!';
      } else if (type === 'trade_updated') {
        title = 'Trade Status Updated';
      }
      
      setNotifications(prev => [...prev, {
        id: trade.$id,
        type: 'trade',
        title,
        content: `Trade status: ${trade.status}`,
        timestamp: trade.updated_at,
        data: trade
      }]);
      
      // Call custom callback
      if (callback) callback(eventData);
    });

    if (subscriptionId) {
      subscriptionsRef.current.set('trades', subscriptionId);
    }

    return subscriptionId;
  }, [userId]);

  // Subscribe to marketplace updates
  const subscribeToMarketplace = useCallback((callback, filters = {}) => {
    const subscriptionId = appwriteRealtime.subscribeToMarketplace((eventData) => {
      const { type, listing } = eventData;
      
      if (type === 'new_listing') {
        // Add to notifications for relevant listings
        setNotifications(prev => [...prev, {
          id: listing.$id,
          type: 'marketplace',
          title: 'New Listing',
          content: listing.title,
          timestamp: listing.created_at,
          data: listing
        }]);
      }
      
      // Call custom callback
      if (callback) callback(eventData);
    }, filters);

    if (subscriptionId) {
      subscriptionsRef.current.set('marketplace', subscriptionId);
    }

    return subscriptionId;
  }, []);

  // Subscribe to profile updates
  const subscribeToProfile = useCallback((callback) => {
    if (!userId) return null;

    const subscriptionId = appwriteRealtime.subscribeToUserUpdates(userId, (eventData) => {
      const { type, profile } = eventData;
      
      if (type === 'profile_updated') {
        // Call custom callback
        if (callback) callback(eventData);
      }
    });

    if (subscriptionId) {
      subscriptionsRef.current.set('profile', subscriptionId);
    }

    return subscriptionId;
  }, [userId]);

  // Setup comprehensive real-time
  const setupRealtime = useCallback((callbacks = {}) => {
    if (!userId) return {};

    const subscriptions = appwriteRealtime.setupUserRealtime(userId, {
      onMessage: (eventData) => {
        subscribeToMessages();
        if (callbacks.onMessage) callbacks.onMessage(eventData);
      },
      onTrade: (eventData) => {
        subscribeToTrades();
        if (callbacks.onTrade) callbacks.onTrade(eventData);
      },
      onMarketplace: callbacks.onMarketplace,
      onProfile: callbacks.onProfile
    });

    return subscriptions;
  }, [userId, subscribeToMessages, subscribeToTrades]);

  // Unsubscribe from specific subscription
  const unsubscribe = useCallback((subscriptionType) => {
    const subscriptionId = subscriptionsRef.current.get(subscriptionType);
    if (subscriptionId) {
      appwriteRealtime.unsubscribe(subscriptionId);
      subscriptionsRef.current.delete(subscriptionType);
      return true;
    }
    return false;
  }, []);

  // Typing indicator functions
  const sendTypingIndicator = useCallback((recipientId, isTyping) => {
    if (!userId) return false;
    return appwriteRealtime.sendTypingIndicator(userId, recipientId, isTyping);
  }, [userId]);

  const onTypingIndicator = useCallback((callback) => {
    return appwriteRealtime.onTypingIndicator((data) => {
      const { senderId, isTyping } = data;
      
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(senderId);
        } else {
          newSet.delete(senderId);
        }
        return newSet;
      });
      
      if (callback) callback(data);
    });
  }, []);

  // Read receipt functions
  const sendReadReceipt = useCallback((recipientId, messageId) => {
    if (!userId) return false;
    return appwriteRealtime.sendReadReceipt(userId, recipientId, messageId);
  }, [userId]);

  const onReadReceipt = useCallback((callback) => {
    return appwriteRealtime.onReadReceipt(callback);
  }, []);

  // Notification management
  const markNotificationAsRead = useCallback((notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Get connection status
  const getConnectionStatus = useCallback(() => {
    return appwriteRealtime.healthCheck();
  }, []);

  // Get active subscriptions
  const getActiveSubscriptions = useCallback(() => {
    return appwriteRealtime.getActiveSubscriptions();
  }, []);

  return {
    // Connection state
    isConnected,
    connectionStatus: getConnectionStatus(),
    
    // Subscription methods
    subscribeToMessages,
    subscribeToTrades,
    subscribeToMarketplace,
    subscribeToProfile,
    setupRealtime,
    unsubscribe,
    
    // Typing indicators
    sendTypingIndicator,
    onTypingIndicator,
    typingUsers: Array.from(typingUsers),
    
    // Read receipts
    sendReadReceipt,
    onReadReceipt,
    
    // Notifications
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    
    // Utilities
    getActiveSubscriptions,
    healthCheck: getConnectionStatus
  };
};

// Hook for specific real-time features
export const useRealtimeMessages = (userId, recipientId) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [readReceipts, setReadReceipts] = useState(new Map());

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages
    const messageSubscription = appwriteRealtime.subscribeToMessages(userId, (eventData) => {
      const { message } = eventData;
      
      // Only add messages from the current conversation
      if (message.sender_id === recipientId || message.recipient_id === recipientId) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Subscribe to typing indicators
    const typingCleanup = appwriteRealtime.onTypingIndicator((data) => {
      if (data.senderId === recipientId) {
        setIsTyping(data.isTyping);
        
        // Auto-clear typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    // Subscribe to read receipts
    const readReceiptCleanup = appwriteRealtime.onReadReceipt((data) => {
      if (data.recipientId === recipientId) {
        setReadReceipts(prev => new Map(prev.set(data.messageId, data.timestamp)));
      }
    });

    return () => {
      if (messageSubscription) {
        appwriteRealtime.unsubscribe(messageSubscription);
      }
      typingCleanup();
      readReceiptCleanup();
    };
  }, [userId, recipientId]);

  return {
    messages,
    isTyping,
    readReceipts,
    sendTypingIndicator: (typing) => appwriteRealtime.sendTypingIndicator(userId, recipientId, typing),
    sendReadReceipt: (messageId) => appwriteRealtime.sendReadReceipt(userId, recipientId, messageId)
  };
};

// Hook for marketplace real-time updates
export const useRealtimeMarketplace = (filters = {}) => {
  const [listings, setListings] = useState([]);
  const [newListingCount, setNewListingCount] = useState(0);

  useEffect(() => {
    const subscriptionId = appwriteRealtime.subscribeToMarketplace((eventData) => {
      const { type, listing } = eventData;
      
      switch (type) {
        case 'new_listing':
          setListings(prev => [listing, ...prev]);
          setNewListingCount(prev => prev + 1);
          break;
        case 'listing_updated':
          setListings(prev => prev.map(l => l.$id === listing.$id ? listing : l));
          break;
        case 'listing_deleted':
          setListings(prev => prev.filter(l => l.$id !== listing.$id));
          break;
        default:
          break;
      }
    }, filters);

    return () => {
      if (subscriptionId) {
        appwriteRealtime.unsubscribe(subscriptionId);
      }
    };
  }, [filters]);

  const resetNewListingCount = useCallback(() => {
    setNewListingCount(0);
  }, []);

  return {
    listings,
    newListingCount,
    resetNewListingCount
  };
};