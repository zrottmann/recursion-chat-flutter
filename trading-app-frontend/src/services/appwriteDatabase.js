/**
 * Appwrite Database Service
 * Handles all database operations for listings, trades, messages, etc.
 */

import { databases, DATABASE_ID, COLLECTIONS, Query, ID, handleAppwriteError } from '../lib/appwrite';
// Import smart database wrapper to handle schema issues
import { smartDatabases } from '../utils/fixDatabaseSchema';

class AppwriteDatabaseService {
  constructor() {
    // Use smart wrapper by default to handle schema issues
    this.db = smartDatabases;
  }
  
  // Listing Management
  async createListing(data) {
    try {
      console.log('📝 Creating listing...');
      
      const listing = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        ID.unique(),
        {
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          view_count: 0,
          save_count: 0,
          images: data.images || [],
          tags: data.tags || []
        }
      );
      
      console.log('✅ Listing created:', listing.$id);
      
      return {
        listing,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Create listing failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async getListing(listingId) {
    try {
      const listing = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        listingId
      );
      
      // Increment view count
      await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        listingId,
        {
          view_count: (listing.view_count || 0) + 1
        }
      );
      
      return {
        listing,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get listing failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async updateListing(listingId, data) {
    try {
      console.log('📝 Updating listing:', listingId);
      
      const listing = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        listingId,
        {
          ...data,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('✅ Listing updated');
      
      return {
        listing,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Update listing failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async deleteListing(listingId) {
    try {
      console.log('🗑️ Deleting listing:', listingId);
      
      await this.db.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        listingId
      );
      
      console.log('✅ Listing deleted');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Delete listing failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async searchListings(filters = {}) {
    try {
      const {
        category,
        type,
        location,
        userId,
        query,
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'desc'
      } = filters;
      
      const queries = [
        Query.limit(limit),
        Query.offset(offset),
        Query.equal('is_active', true)
      ];
      
      // Add order
      if (orderDirection === 'desc') {
        queries.push(Query.orderDesc(orderBy));
      } else {
        queries.push(Query.orderAsc(orderBy));
      }
      
      // Add filters
      if (category) queries.push(Query.equal('category', category));
      if (type) queries.push(Query.equal('type', type));
      if (location) queries.push(Query.equal('location', location));
      if (userId) queries.push(Query.equal('user_id', userId));
      if (query) queries.push(Query.search('title', query));
      
      console.log('🔍 Searching listings with filters:', filters);
      
      const result = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );
      
      console.log(`✅ Found ${result.documents.length} listings`);
      
      return {
        listings: result.documents,
        total: result.total,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Search listings failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async getUserListings(userId, includeInactive = false) {
    try {
      const queries = [
        Query.equal('user_id', userId),
        Query.orderDesc('created_at'),
        Query.limit(100)
      ];
      
      if (!includeInactive) {
        queries.push(Query.equal('is_active', true));
      }
      
      const result = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );
      
      return {
        listings: result.documents,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get user listings failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Trade Management
  async createTrade(data) {
    try {
      console.log('🤝 Creating trade...');
      
      const trade = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.trades,
        ID.unique(),
        {
          ...data,
          status: data.status || 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          messages: [],
          meeting_details: data.meeting_details || {},
          completion_details: data.completion_details || {},
          feedback: data.feedback || {}
        }
      );
      
      console.log('✅ Trade created:', trade.$id);
      
      return {
        trade,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Create trade failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async updateTrade(tradeId, data) {
    try {
      console.log('📝 Updating trade:', tradeId);
      
      const trade = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.trades,
        tradeId,
        {
          ...data,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('✅ Trade updated');
      
      return {
        trade,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Update trade failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async getUserTrades(userId, status = null) {
    try {
      // Create queries for trades where user is either user1 or user2
      const baseQueries = [
        Query.orderDesc('created_at'),
        Query.limit(100)
      ];
      
      if (status) {
        baseQueries.push(Query.equal('status', status));
      }
      
      // Get trades where user is user1
      const user1Queries = [...baseQueries, Query.equal('user1_id', userId)];
      const user1Trades = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.trades,
        user1Queries
      );
      
      // Get trades where user is user2
      const user2Queries = [...baseQueries, Query.equal('user2_id', userId)];
      const user2Trades = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.trades,
        user2Queries
      );
      
      // Combine and deduplicate
      const allTrades = [...user1Trades.documents, ...user2Trades.documents];
      const uniqueTrades = allTrades.filter((trade, index, self) => 
        index === self.findIndex(t => t.$id === trade.$id)
      );
      
      // Sort by created_at descending
      uniqueTrades.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return {
        trades: uniqueTrades,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get user trades failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Message Management
  async createMessage(data) {
    try {
      console.log('💬 Creating message...');
      
      const message = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.messages,
        ID.unique(),
        {
          ...data,
          created_at: new Date().toISOString(),
          is_read: false,
          message_type: data.message_type || 'text',
          attachments: data.attachments || [],
          metadata: data.metadata || {}
        }
      );
      
      console.log('✅ Message created:', message.$id);
      
      return {
        message,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Create message failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async getConversation(user1Id, user2Id, tradeId = null, limit = 100) {
    try {
      const queries = [
        Query.orderDesc('created_at'),
        Query.limit(limit)
      ];
      
      if (tradeId) {
        // Get messages for specific trade
        queries.push(Query.equal('trade_id', tradeId));
      } else {
        // Get messages between two users (bidirectional)
        // We need to get messages where:
        // (sender_id = user1Id AND recipient_id = user2Id) OR 
        // (sender_id = user2Id AND recipient_id = user1Id)
        
        // Since Appwrite doesn't support OR queries directly, we'll make two requests
        const queries1 = [
          ...queries,
          Query.equal('sender_id', user1Id),
          Query.equal('recipient_id', user2Id)
        ];
        
        const queries2 = [
          ...queries,
          Query.equal('sender_id', user2Id),
          Query.equal('recipient_id', user1Id)
        ];
        
        const [result1, result2] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.messages, queries1),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.messages, queries2)
        ]);
        
        // Combine and sort messages
        const allMessages = [...result1.documents, ...result2.documents];
        allMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        return {
          messages: allMessages,
          success: true
        };
      }
      
      const result = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.messages,
        queries
      );
      
      // Reverse to get chronological order
      const messages = result.documents.reverse();
      
      return {
        messages,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get conversation failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async markMessagesAsRead(currentUserId, otherUserId) {
    try {
      console.log('👁️ Marking messages as read...');
      
      // Get unread messages from the other user
      const queries = [
        Query.equal('sender_id', otherUserId),
        Query.equal('recipient_id', currentUserId),
        Query.equal('is_read', false)
      ];
      
      const result = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.messages,
        queries
      );
      
      // Update each message to mark as read
      const updatePromises = result.documents.map(message =>
        databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.messages,
          message.$id,
          { is_read: true }
        )
      );
      
      await Promise.all(updatePromises);
      
      console.log(`✅ Marked ${result.documents.length} messages as read`);
      
      return {
        updated_count: result.documents.length,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Mark messages as read failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async getUnreadMessageCount(userId) {
    try {
      const queries = [
        Query.equal('recipient_id', userId),
        Query.equal('is_read', false)
      ];
      
      const result = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.messages,
        queries
      );
      
      return {
        count: result.total,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get unread message count failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // User Management
  async getUserById(userId) {
    try {
      console.log('🔍 Getting user by ID:', userId);
      
      const user = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        userId
      );
      
      console.log('✅ User found:', user);
      
      return {
        user,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get user by ID failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Search and Discovery
  async searchUsers(query, location = null, limit = 20) {
    try {
      const queries = [
        Query.limit(limit),
        Query.equal('is_active', true)
      ];
      
      if (query) {
        queries.push(Query.search('name', query));
      }
      
      if (location) {
        queries.push(Query.equal('location', location));
      }
      
      const result = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.users,
        queries
      );
      
      return {
        users: result.documents,
        total: result.total,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Search users failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Analytics
  async getUserAnalytics(userId) {
    try {
      // Get user's listings
      const listingsResult = await this.getUserListings(userId, true);
      if (!listingsResult.success) throw new Error('Failed to get listings');
      
      // Get user's trades
      const tradesResult = await this.getUserTrades(userId);
      if (!tradesResult.success) throw new Error('Failed to get trades');
      
      const listings = listingsResult.listings;
      const trades = tradesResult.trades;
      
      // Calculate analytics
      const analytics = {
        total_listings: listings.length,
        active_listings: listings.filter(l => l.is_active).length,
        total_trades: trades.length,
        completed_trades: trades.filter(t => t.status === 'completed').length,
        pending_trades: trades.filter(t => t.status === 'pending').length,
        total_views: listings.reduce((sum, l) => sum + (l.view_count || 0), 0),
        average_listing_views: listings.length > 0 ? 
          listings.reduce((sum, l) => sum + (l.view_count || 0), 0) / listings.length : 0,
        success_rate: trades.length > 0 ? 
          (trades.filter(t => t.status === 'completed').length / trades.length) * 100 : 0
      };
      
      return {
        analytics,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get user analytics failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  // Utility functions
  async getDocument(collectionId, documentId) {
    try {
      const document = await this.db.getDocument(
        DATABASE_ID,
        collectionId,
        documentId
      );
      
      return {
        document,
        success: true
      };
      
    } catch (error) {
      console.error('❌ Get document failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }

  async listDocuments(collectionId, queries = []) {
    try {
      const result = await this.db.listDocuments(
        DATABASE_ID,
        collectionId,
        queries
      );
      
      return {
        documents: result.documents,
        total: result.total,
        success: true
      };
      
    } catch (error) {
      console.error('❌ List documents failed:', error);
      return {
        success: false,
        error: handleAppwriteError(error)
      };
    }
  }
}

// Create and export singleton instance
const appwriteDatabase = new AppwriteDatabaseService();

export default appwriteDatabase;