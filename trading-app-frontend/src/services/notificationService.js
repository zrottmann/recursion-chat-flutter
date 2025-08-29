/**
 * Enhanced Notification Service
 * Handles comprehensive notification management using Appwrite with real-time capabilities
 */

import { databases, ID, Query } from '../lib/appwrite';
import config from '../config/appwriteConfig';

// Notification types for different scenarios
export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  TRADE_REQUEST: 'trade_request',
  TRADE_ACCEPTED: 'trade_accepted',
  TRADE_COMPLETED: 'trade_completed',
  PAYMENT_RECEIVED: 'payment_received',
  ITEM_SOLD: 'item_sold',
  ITEM_SAVED: 'item_saved',
  PROFILE_VIEW: 'profile_view',
  REVIEW_RECEIVED: 'review_received',
  SYSTEM_ALERT: 'system_alert',
  MEMBERSHIP_UPGRADE: 'membership_upgrade',
  AI_ANALYSIS_COMPLETE: 'ai_analysis_complete',
  FEATURED_LISTING_EXPIRING: 'featured_expiring',
  PRICE_DROP_ALERT: 'price_drop',
  BACK_IN_STOCK: 'back_in_stock'
};

class NotificationService {
  constructor() {
    this.databaseId = config.database.databaseId;
    this.collectionId = config.database.collections.notifications || 'notifications';
    this.soundEnabled = true;
    this.audioContext = null;
    this.initializeAudio();
  }

  /**
   * Initialize Web Audio API for notification sounds
   */
  initializeAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Get all notifications for current user
   */
  async getNotifications(userId) {
    try {
      const response = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('userId', [userId]),
          Query.orderDesc('createdAt'),
          Query.limit(50)
        ]
      );
      return response.documents;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Get notification settings (stored in user preferences)
   */
  async getNotificationSettings(userId) {
    try {
      // Return default settings for now
      // In a real app, this would be stored in user preferences
      return {
        email: true,
        push: true,
        inApp: true,
        newsletter: false,
        trades: true,
        messages: true,
        reviews: true
      };
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
      return {};
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId, settings) {
    try {
      // In a real app, this would update user preferences
      console.log('Updating notification settings:', settings);
      return settings;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(userId, notification) {
    try {
      const doc = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        {
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          read: false,
          created_at: new Date().toISOString(),
          createdAt: new Date().toISOString(), // Keep both for compatibility
          metadata: notification.metadata || {}
        }
      );
      return doc;
    } catch (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const doc = await databases.updateDocument(
        this.databaseId,
        this.collectionId,
        notificationId,
        {
          read: true,
          readAt: new Date().toISOString()
        }
      );
      return doc;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const unreadNotifications = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('userId', [userId]),
          Query.equal('read', [false])
        ]
      );

      const promises = unreadNotifications.documents.map(notification =>
        this.markAsRead(notification.$id)
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      await databases.deleteDocument(
        this.databaseId,
        this.collectionId,
        notificationId
      );
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  async deleteOldNotifications(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldNotifications = await databases.listDocuments(
        this.databaseId,
        this.collectionId,
        [
          Query.equal('userId', [userId]),
          Query.lessThan('createdAt', thirtyDaysAgo.toISOString())
        ]
      );

      const promises = oldNotifications.documents.map(notification =>
        this.deleteNotification(notification.$id)
      );

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Failed to delete old notifications:', error);
      throw error;
    }
  }

  /**
   * Play notification sound
   */
  playNotificationSound(type = 'default') {
    if (!this.soundEnabled || !this.audioContext) return;

    try {
      // Create oscillator for different sound types
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        [NOTIFICATION_TYPES.MESSAGE]: 800,
        [NOTIFICATION_TYPES.TRADE_REQUEST]: 600,
        [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: 1000,
        [NOTIFICATION_TYPES.SYSTEM_ALERT]: 400,
        default: 700
      };

      oscillator.frequency.value = frequencies[type] || frequencies.default;
      oscillator.type = 'sine';

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Create enhanced notification with type-specific handling
   */
  async createEnhancedNotification(userId, title, content, type, metadata = {}) {
    try {
      const notification = {
        userId,
        title,
        message: content,
        content,
        type,
        read: false,
        is_read: false,
        createdAt: new Date().toISOString(),
        created_at: new Date().toISOString(),
        metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
      };

      const doc = await databases.createDocument(
        this.databaseId,
        this.collectionId,
        ID.unique(),
        notification
      );

      console.log('✅ Enhanced notification created:', doc.$id);
      return doc;
    } catch (error) {
      console.error('❌ Failed to create enhanced notification:', error);
      throw error;
    }
  }

  /**
   * Create a new message notification
   */
  async notifyNewMessage(recipientId, senderName, messagePreview) {
    return await this.createEnhancedNotification(
      recipientId,
      'New Message',
      `${senderName}: ${messagePreview}`,
      NOTIFICATION_TYPES.MESSAGE,
      { sender: senderName }
    );
  }

  /**
   * Create a trade request notification
   */
  async notifyTradeRequest(sellerId, buyerName, itemTitle) {
    return await this.createEnhancedNotification(
      sellerId,
      'New Trade Request',
      `${buyerName} wants to trade for "${itemTitle}"`,
      NOTIFICATION_TYPES.TRADE_REQUEST,
      { buyer: buyerName, item: itemTitle }
    );
  }

  /**
   * Create a trade accepted notification
   */
  async notifyTradeAccepted(buyerId, sellerName, itemTitle) {
    return await this.createEnhancedNotification(
      buyerId,
      'Trade Request Accepted!',
      `${sellerName} accepted your trade request for "${itemTitle}"`,
      NOTIFICATION_TYPES.TRADE_ACCEPTED,
      { seller: sellerName, item: itemTitle }
    );
  }

  /**
   * Create a trade completed notification
   */
  async notifyTradeCompleted(userId, otherUserName, itemTitle, amount) {
    return await this.createEnhancedNotification(
      userId,
      'Trade Completed!',
      `Your trade with ${otherUserName} for "${itemTitle}" is complete. Amount: $${amount}`,
      NOTIFICATION_TYPES.TRADE_COMPLETED,
      { otherUser: otherUserName, item: itemTitle, amount }
    );
  }

  /**
   * Create a payment received notification
   */
  async notifyPaymentReceived(userId, amount, paymentType) {
    let title, content;
    
    switch (paymentType) {
      case 'membership':
        title = 'Membership Upgraded!';
        content = `Your Verified Human membership is now active. Welcome to premium features!`;
        break;
      case 'escrow':
        title = 'Escrow Payment Received';
        content = `Escrow payment of $${amount} has been secured for your trade`;
        break;
      case 'featured':
        title = 'Listing Featured!';
        content = `Your listing is now featured for 7 days. Get ready for more views!`;
        break;
      default:
        title = 'Payment Received';
        content = `Payment of $${amount} has been processed successfully`;
    }

    return await this.createEnhancedNotification(
      userId,
      title,
      content,
      NOTIFICATION_TYPES.PAYMENT_RECEIVED,
      { amount, paymentType }
    );
  }

  /**
   * Create an item sold notification
   */
  async notifyItemSold(sellerId, itemTitle, buyerName, amount) {
    return await this.createEnhancedNotification(
      sellerId,
      'Item Sold!',
      `"${itemTitle}" has been sold to ${buyerName} for $${amount}`,
      NOTIFICATION_TYPES.ITEM_SOLD,
      { item: itemTitle, buyer: buyerName, amount }
    );
  }

  /**
   * Create an item saved notification
   */
  async notifyItemSaved(sellerId, saverName, itemTitle) {
    return await this.createEnhancedNotification(
      sellerId,
      'Item Saved',
      `${saverName} saved your listing "${itemTitle}"`,
      NOTIFICATION_TYPES.ITEM_SAVED,
      { saver: saverName, item: itemTitle }
    );
  }

  /**
   * Create a profile view notification
   */
  async notifyProfileView(profileOwnerId, viewerName) {
    return await this.createEnhancedNotification(
      profileOwnerId,
      'Profile View',
      `${viewerName} viewed your profile`,
      NOTIFICATION_TYPES.PROFILE_VIEW,
      { viewer: viewerName }
    );
  }

  /**
   * Create a review received notification
   */
  async notifyReviewReceived(revieweeId, reviewerName, rating, itemTitle) {
    return await this.createEnhancedNotification(
      revieweeId,
      'New Review Received',
      `${reviewerName} gave you ${rating} stars for "${itemTitle}"`,
      NOTIFICATION_TYPES.REVIEW_RECEIVED,
      { reviewer: reviewerName, rating, item: itemTitle }
    );
  }

  /**
   * Create a system alert notification
   */
  async notifySystemAlert(userId, title, message, metadata = {}) {
    return await this.createEnhancedNotification(
      userId,
      title,
      message,
      NOTIFICATION_TYPES.SYSTEM_ALERT,
      metadata
    );
  }

  /**
   * Create a membership upgrade notification
   */
  async notifyMembershipUpgrade(userId, membershipType) {
    return await this.createEnhancedNotification(
      userId,
      'Membership Upgraded!',
      `Congratulations! You are now a ${membershipType} member with exclusive benefits.`,
      NOTIFICATION_TYPES.MEMBERSHIP_UPGRADE,
      { membershipType }
    );
  }

  /**
   * Create notification for AI analysis completion
   */
  async notifyAIAnalysisComplete(userId, itemTitle, confidence, suggestions) {
    const title = 'AI Analysis Complete';
    const content = `Your photo analysis for "${itemTitle}" is ready with ${Math.round(confidence * 100)}% confidence!`;
    
    return await this.createEnhancedNotification(
      userId,
      title,
      content,
      NOTIFICATION_TYPES.AI_ANALYSIS_COMPLETE,
      { item: itemTitle, confidence, suggestions }
    );
  }

  /**
   * Create notification for featured listing expiration
   */
  async notifyFeaturedListingExpiring(userId, itemTitle, hoursLeft) {
    const title = 'Featured Listing Expiring';
    const content = `Your featured listing "${itemTitle}" expires in ${hoursLeft} hours. Renew to keep the boost!`;
    
    return await this.createEnhancedNotification(
      userId,
      title,
      content,
      NOTIFICATION_TYPES.FEATURED_LISTING_EXPIRING,
      { item: itemTitle, hoursLeft }
    );
  }

  /**
   * Create notification for price drop alert
   */
  async notifyPriceDropAlert(userId, itemTitle, oldPrice, newPrice, sellerName) {
    const title = 'Price Drop Alert!';
    const content = `"${itemTitle}" by ${sellerName} dropped from $${oldPrice} to $${newPrice}`;
    
    return await this.createEnhancedNotification(
      userId,
      title,
      content,
      NOTIFICATION_TYPES.PRICE_DROP_ALERT,
      { item: itemTitle, oldPrice, newPrice, seller: sellerName }
    );
  }

  /**
   * Create notification for back in stock
   */
  async notifyBackInStock(userId, itemTitle, sellerName) {
    const title = 'Item Back in Stock!';
    const content = `"${itemTitle}" by ${sellerName} is now available again`;
    
    return await this.createEnhancedNotification(
      userId,
      title,
      content,
      NOTIFICATION_TYPES.BACK_IN_STOCK,
      { item: itemTitle, seller: sellerName }
    );
  }

  /**
   * Batch create notifications for multiple users
   */
  async notifyMultipleUsers(userIds, title, content, type, metadata = {}) {
    try {
      const promises = userIds.map(userId => 
        this.createEnhancedNotification(userId, title, content, type, metadata)
      );
      
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Batch notifications: ${successful} successful, ${failed} failed`);
      
      return { successful, failed, results };
    } catch (error) {
      console.error('Batch notification error:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId) {
    try {
      const allNotifications = await this.getNotifications(userId);
      const unreadCount = allNotifications.filter(n => !n.read && !n.is_read).length;
      
      // Count by type
      const byType = {};
      allNotifications.forEach(notification => {
        const type = notification.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      // Count from last week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const lastWeek = allNotifications.filter(n => 
        new Date(n.createdAt || n.created_at) > oneWeekAgo
      ).length;

      return {
        total: allNotifications.length,
        unread: unreadCount,
        byType,
        lastWeek
      };
    } catch (error) {
      console.error('Failed to get notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {},
        lastWeek: 0
      };
    }
  }

  /**
   * Set sound enabled/disabled
   */
  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  /**
   * Get sound enabled status
   */
  isSoundEnabled() {
    return this.soundEnabled;
  }
}

// Export singleton instance
export default new NotificationService();