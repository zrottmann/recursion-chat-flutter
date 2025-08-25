import { client, databases, account } from '../lib/appwrite';
import { Query } from 'appwrite';
import createDebugger from '../utils/debugLogger.js';

const debug = createDebugger('trading-post:messaging');

const DATABASE_ID = 'trading_post_db';
const COLLECTIONS = {
  MESSAGES: 'messages',
  CONVERSATIONS: 'conversations', 
  USERS: 'users'
};

/**
 * Trading Post Messaging Service - Appwrite Implementation
 * Based on working Recursion Chat patterns
 */
class AppwriteMessagingService {
  constructor() {
    this.subscriptions = [];
    this.currentUser = null;
  }

  /**
   * Initialize the messaging service
   */
  async initialize() {
    try {
      const user = await account.get();
      this.currentUser = user;
      debug.success('Messaging service initialized', { userId: user.$id, email: user.email });
      return user;
    } catch (error) {
      debug.error('Failed to initialize messaging service', error);
      throw error;
    }
  }

  /**
   * Get all conversations for current user
   */
  async getConversations() {
    try {
      if (!this.currentUser) {
        await this.initialize();
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        [
          Query.or([
            Query.equal('user1_id', this.currentUser.$id),
            Query.equal('user2_id', this.currentUser.$id)
          ]),
          Query.orderDesc('$updatedAt'),
          Query.limit(50)
        ]
      );

      // Transform conversations to match expected format
      const conversations = await Promise.all(
        response.documents.map(async (conv) => {
          const otherUserId = conv.user1_id === this.currentUser.$id ? conv.user2_id : conv.user1_id;
          
          // Get other user details
          let otherUser;
          try {
            const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, otherUserId);
            otherUser = {
              id: userDoc.$id,
              username: userDoc.username || userDoc.email?.split('@')[0] || 'Unknown User'
            };
          } catch (error) {
            console.warn('Could not load user details for:', otherUserId);
            otherUser = {
              id: otherUserId,
              username: 'Unknown User'
            };
          }

          return {
            id: conv.$id,
            other_user: otherUser,
            last_message: conv.last_message || '',
            last_message_time: conv.$updatedAt,
            unread_count: conv.unread_count || 0,
            item: conv.item_id ? { id: conv.item_id, title: conv.item_title || 'Unknown Item' } : null
          };
        })
      );

      return conversations;
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      
      // Handle missing collections during database migration
      if (error.message?.includes('Collection with the requested ID could not be found') ||
          error.code === 404) {
        console.warn('🔧 Conversations collection not found - likely during database migration');
        console.warn('📝 Creating placeholder conversation structure...');
        return []; // Return empty array instead of crashing
      }
      
      return [];
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('conversation_id', conversationId),
          Query.orderAsc('$createdAt'),
          Query.limit(100)
        ]
      );

      return response.documents.map(msg => ({
        id: msg.$id,
        content: msg.content,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        conversation_id: msg.conversation_id,
        created_at: msg.$createdAt,
        read_at: msg.read_at || null,
        delivered_at: msg.delivered_at || null
      }));
    } catch (error) {
      console.error('❌ Failed to load messages:', error);
      
      // Handle missing collections during database migration
      if (error.message?.includes('Collection with the requested ID could not be found') ||
          error.code === 404) {
        console.warn('🔧 Messages collection not found - messaging system being migrated');
        return []; // Return empty array instead of crashing
      }
      
      return [];
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(recipientId, content, itemId = null) {
    try {
      if (!this.currentUser) {
        await this.initialize();
      }

      // Find or create conversation
      let conversation = await this.findOrCreateConversation(recipientId, itemId);

      // Create message
      const messageData = {
        conversation_id: conversation.$id,
        sender_id: this.currentUser.$id,
        recipient_id: recipientId,
        content: content.trim(),
        delivered_at: new Date().toISOString()
      };

      const message = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        'unique()',
        messageData
      );

      // Update conversation with last message
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        conversation.$id,
        {
          last_message: content.trim(),
          last_message_time: message.$createdAt
        }
      );

      return {
        id: message.$id,
        content: message.content,
        sender_id: message.sender_id,
        recipient_id: message.recipient_id,
        conversation_id: message.conversation_id,
        created_at: message.$createdAt,
        delivered_at: message.delivered_at
      };
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Find existing conversation or create new one
   */
  async findOrCreateConversation(otherUserId, itemId = null) {
    try {
      // Try to find existing conversation
      const existingResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        [
          Query.or([
            Query.and([
              Query.equal('user1_id', this.currentUser.$id),
              Query.equal('user2_id', otherUserId)
            ]),
            Query.and([
              Query.equal('user1_id', otherUserId),
              Query.equal('user2_id', this.currentUser.$id)
            ])
          ]),
          Query.limit(1)
        ]
      );

      if (existingResponse.documents.length > 0) {
        return existingResponse.documents[0];
      }

      // Create new conversation
      const conversationData = {
        user1_id: this.currentUser.$id,
        user2_id: otherUserId,
        created_at: new Date().toISOString(),
        last_message: '',
        last_message_time: new Date().toISOString(),
        unread_count: 0
      };

      if (itemId) {
        conversationData.item_id = itemId;
      }

      const conversation = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        'unique()',
        conversationData
      );

      return conversation;
    } catch (error) {
      console.error('❌ Failed to find/create conversation:', error);
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId) {
    try {
      // Get unread messages in this conversation
      const unreadResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.MESSAGES,
        [
          Query.equal('conversation_id', conversationId),
          Query.equal('recipient_id', this.currentUser.$id),
          Query.isNull('read_at')
        ]
      );

      // Mark each message as read
      const readTime = new Date().toISOString();
      const updatePromises = unreadResponse.documents.map(msg =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.MESSAGES,
          msg.$id,
          { read_at: readTime }
        )
      );

      await Promise.all(updatePromises);

      // Update conversation unread count
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CONVERSATIONS,
        conversationId,
        { unread_count: 0 }
      );

    } catch (error) {
      console.error('❌ Failed to mark messages as read:', error);
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  subscribeToMessages(conversationId, callback) {
    try {
      const subscription = client.subscribe([
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents`,
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.CONVERSATIONS}.documents`
      ], (response) => {
        const { events, payload } = response;
        
        // Handle new messages
        if (events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents.*.create`)) {
          if (payload.conversation_id === conversationId) {
            callback({
              type: 'new_message',
              message: {
                id: payload.$id,
                content: payload.content,
                sender_id: payload.sender_id,
                recipient_id: payload.recipient_id,
                conversation_id: payload.conversation_id,
                created_at: payload.$createdAt,
                delivered_at: payload.delivered_at
              }
            });
          }
        }

        // Handle message updates (read receipts)
        if (events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.MESSAGES}.documents.*.update`)) {
          if (payload.conversation_id === conversationId) {
            callback({
              type: 'message_updated',
              message: {
                id: payload.$id,
                read_at: payload.read_at,
                delivered_at: payload.delivered_at
              }
            });
          }
        }
      });

      this.subscriptions.push(subscription);
      return () => {
        const index = this.subscriptions.indexOf(subscription);
        if (index > -1) {
          this.subscriptions.splice(index, 1);
        }
      };
    } catch (error) {
      console.error('❌ Failed to subscribe to messages:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  /**
   * Subscribe to conversation updates
   */
  subscribeToConversations(callback) {
    try {
      const subscription = client.subscribe([
        `databases.${DATABASE_ID}.collections.${COLLECTIONS.CONVERSATIONS}.documents`
      ], (response) => {
        const { events, payload } = response;
        
        // Only handle conversations involving current user
        if (payload.user1_id === this.currentUser?.$id || payload.user2_id === this.currentUser?.$id) {
          if (events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.CONVERSATIONS}.documents.*.create`)) {
            callback({
              type: 'conversation_created',
              conversation: payload
            });
          }

          if (events.includes(`databases.${DATABASE_ID}.collections.${COLLECTIONS.CONVERSATIONS}.documents.*.update`)) {
            callback({
              type: 'conversation_updated',
              conversation: payload
            });
          }
        }
      });

      this.subscriptions.push(subscription);
      return () => {
        const index = this.subscriptions.indexOf(subscription);
        if (index > -1) {
          this.subscriptions.splice(index, 1);
        }
      };
    } catch (error) {
      console.error('❌ Failed to subscribe to conversations:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach(subscription => {
      if (typeof subscription === 'function') {
        subscription();
      }
    });
    this.subscriptions = [];
  }
}

// Export singleton instance
const appwriteMessaging = new AppwriteMessagingService();
export default appwriteMessaging;