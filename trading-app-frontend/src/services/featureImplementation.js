/**
 * Trading Post Feature Implementation Service
 * Implements all missing marketplace features to replace "action not supported" messages
 */

import { databases, storage, account, DATABASE_ID, COLLECTIONS, BUCKETS, Query, ID } from '../lib/appwrite';
import fieldMapper, { createUserQuery } from '../utils/databaseFieldMapper';
import { toast } from 'react-toastify';

class FeatureImplementationService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    await fieldMapper.initialize();
    this.initialized = true;
    console.log('✅ [FeatureService] Trading Post features initialized');
  }

  /**
   * Complete Listing Management
   */
  async createListing(listingData) {
    await this.initialize();
    
    try {
      const user = await account.get();
      // Use userId as the standard Appwrite field name
      const userField = fieldMapper.getFieldName('items', 'user') || 'userId';
      
      const listing = {
        [userField]: user.$id,
        userId: user.$id, // Also include userId explicitly to ensure compatibility
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        condition: listingData.condition,
        estimated_value: listingData.estimated_value || 0,
        images: listingData.images || [],
        tags: listingData.tags || [],
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        ID.unique(),
        listing
      );

      toast.success('🎉 Listing created successfully!');
      return { success: true, listing: response };
    } catch (error) {
      console.error('❌ Failed to create listing:', error);
      toast.error('Failed to create listing. Please try again.');
      return { success: false, error: error.message };
    }
  }

  async updateListing(listingId, updateData) {
    await this.initialize();
    
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        listingId,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );

      toast.success('✅ Listing updated successfully!');
      return { success: true, listing: response };
    } catch (error) {
      console.error('❌ Failed to update listing:', error);
      toast.error('Failed to update listing. Please try again.');
      return { success: false, error: error.message };
    }
  }

  async deleteListing(listingId) {
    await this.initialize();
    
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.items, listingId);
      toast.success('🗑️ Listing deleted successfully!');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to delete listing:', error);
      toast.error('Failed to delete listing. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Image Upload and Management
   */
  async uploadImages(files) {
    await this.initialize();
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.warn('⚠️ [FeatureService] No valid files provided for upload');
      return { success: true, images: [] };
    }
    
    try {
      // Filter and validate files first
      const validFiles = files.filter(file => {
        if (!(file instanceof File)) {
          console.warn('⚠️ [FeatureService] Skipping non-File object:', typeof file);
          return false;
        }
        
        if (file.size === 0) {
          console.warn('⚠️ [FeatureService] Skipping empty file:', file.name);
          return false;
        }
        
        if (!file.type.startsWith('image/')) {
          console.warn('⚠️ [FeatureService] Skipping non-image file:', file.name, file.type);
          return false;
        }
        
        return true;
      });

      if (validFiles.length === 0) {
        console.warn('⚠️ [FeatureService] No valid image files to upload');
        return { success: true, images: [] };
      }

      const uploadPromises = validFiles.map(async (file) => {
        try {
          const response = await storage.createFile(
            BUCKETS.itemImages,
            ID.unique(),
            file
          );
          
          return {
            id: response.$id,
            url: storage.getFileView(BUCKETS.itemImages, response.$id),
            preview: storage.getFilePreview(BUCKETS.itemImages, response.$id, 400, 300)
          };
        } catch (error) {
          console.error('❌ [FeatureService] Failed to upload individual file:', file.name, error);
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const uploadedImages = results.filter(result => result !== null);
      
      if (uploadedImages.length > 0) {
        toast.success(`📸 ${uploadedImages.length} images uploaded successfully!`);
      } else {
        toast.warning('⚠️ No images could be uploaded. Please check file types and sizes.');
      }
      
      return { success: true, images: uploadedImages };
    } catch (error) {
      console.error('❌ Failed to upload images:', error);
      toast.error('Failed to upload images. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Want/Wishlist Management
   */
  async createWant(wantData) {
    await this.initialize();
    
    try {
      const user = await account.get();
      const userField = fieldMapper.getFieldName('wants', 'user');
      
      const want = {
        [userField]: user.$id,
        title: wantData.title,
        description: wantData.description,
        category: wantData.category,
        priority: wantData.priority || 'medium',
        max_value: wantData.max_value || 0,
        tags: wantData.tags || [],
        status: 'active',
        created_at: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.wants,
        ID.unique(),
        want
      );

      toast.success('💫 Want added to your wishlist!');
      return { success: true, want: response };
    } catch (error) {
      console.error('❌ Failed to create want:', error);
      toast.error('Failed to add to wishlist. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Trade Management
   */
  async createTrade(tradeData) {
    await this.initialize();
    
    try {
      const user = await account.get();
      
      const trade = {
        offerer_id: user.$id,
        recipient_id: tradeData.recipient_id,
        offered_items: tradeData.offered_items || [],
        requested_items: tradeData.requested_items || [],
        message: tradeData.message || '',
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.trades,
        ID.unique(),
        trade
      );

      // Create notification for recipient
      await this.createNotification(tradeData.recipient_id, {
        type: 'trade_offer',
        title: 'New Trade Offer',
        message: `${user.name || 'Someone'} sent you a trade offer`,
        data: { trade_id: response.$id }
      });

      toast.success('📦 Trade offer sent successfully!');
      return { success: true, trade: response };
    } catch (error) {
      console.error('❌ Failed to create trade:', error);
      toast.error('Failed to send trade offer. Please try again.');
      return { success: false, error: error.message };
    }
  }

  async respondToTrade(tradeId, action, message = '') {
    await this.initialize();
    
    try {
      const user = await account.get();
      
      const updateData = {
        status: action, // 'accepted', 'declined', 'countered'
        response_message: message,
        responded_at: new Date().toISOString()
      };

      const response = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.trades,
        tradeId,
        updateData
      );

      // Create notification for offerer
      const trade = await databases.getDocument(DATABASE_ID, COLLECTIONS.trades, tradeId);
      await this.createNotification(trade.offerer_id, {
        type: 'trade_response',
        title: `Trade ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `Your trade offer was ${action}`,
        data: { trade_id: tradeId }
      });

      const actionText = action === 'accepted' ? 'accepted' : action === 'declined' ? 'declined' : 'updated';
      toast.success(`✅ Trade ${actionText} successfully!`);
      return { success: true, trade: response };
    } catch (error) {
      console.error(`❌ Failed to ${action} trade:`, error);
      toast.error(`Failed to ${action} trade. Please try again.`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notification System
   */
  async createNotification(userId, notificationData) {
    await this.initialize();
    
    try {
      const userField = fieldMapper.getFieldName('notifications', 'user');
      
      const notification = {
        [userField]: userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || {},
        read: false,
        created_at: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.notifications,
        ID.unique(),
        notification
      );

      return { success: true, notification: response };
    } catch (error) {
      console.error('❌ Failed to create notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Search and Discovery
   */
  async searchListings(searchParams) {
    await this.initialize();
    
    try {
      const queries = [Query.limit(searchParams.limit || 50)];
      
      if (searchParams.query) {
        queries.push(Query.search('title', searchParams.query));
      }
      
      if (searchParams.category) {
        queries.push(Query.equal('category', [searchParams.category]));
      }
      
      if (searchParams.status) {
        queries.push(Query.equal('status', [searchParams.status]));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );

      return { success: true, listings: response.documents, total: response.total };
    } catch (error) {
      console.error('❌ Failed to search listings:', error);
      return { success: false, error: error.message, listings: [], total: 0 };
    }
  }

  /**
   * User Profile Management
   */
  async updateUserProfile(profileData) {
    await this.initialize();
    
    try {
      const user = await account.get();
      
      // Update Appwrite account if name/email changed
      if (profileData.name && profileData.name !== user.name) {
        await account.updateName(profileData.name);
      }
      
      if (profileData.email && profileData.email !== user.email) {
        await account.updateEmail(profileData.email, profileData.password);
      }

      // Update user document in database
      try {
        const response = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          user.$id,
          {
            ...profileData,
            updated_at: new Date().toISOString()
          }
        );
        
        toast.success('✅ Profile updated successfully!');
        return { success: true, profile: response };
      } catch (dbError) {
        // If user document doesn't exist, create it
        if (dbError.code === 404) {
          const newProfile = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.users,
            user.$id,
            {
              email: user.email,
              name: user.name,
              ...profileData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          );
          
          toast.success('✅ Profile created successfully!');
          return { success: true, profile: newProfile };
        }
        throw dbError;
      }
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Saved Items Management
   */
  async saveItem(itemId) {
    await this.initialize();
    
    try {
      const user = await account.get();
      const userField = fieldMapper.getFieldName('savedItems', 'user');
      
      const savedItem = {
        [userField]: user.$id,
        item_id: itemId,
        saved_at: new Date().toISOString()
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.savedItems,
        ID.unique(),
        savedItem
      );

      toast.success('💾 Item saved to your collection!');
      return { success: true, savedItem: response };
    } catch (error) {
      console.error('❌ Failed to save item:', error);
      toast.error('Failed to save item. Please try again.');
      return { success: false, error: error.message };
    }
  }

  async unsaveItem(itemId) {
    await this.initialize();
    
    try {
      const user = await account.get();
      const userField = fieldMapper.getFieldName('savedItems', 'user');
      
      // Find the saved item
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.savedItems,
        [
          Query.equal(userField, [user.$id]),
          Query.equal('item_id', [itemId]),
          Query.limit(1)
        ]
      );

      if (response.documents.length > 0) {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.savedItems,
          response.documents[0].$id
        );
        
        toast.success('🗑️ Item removed from saved collection!');
        return { success: true };
      } else {
        toast.info('Item was not in your saved collection.');
        return { success: true };
      }
    } catch (error) {
      console.error('❌ Failed to unsave item:', error);
      toast.error('Failed to remove item. Please try again.');
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's data
   */
  async getUserData(userId) {
    await this.initialize();
    
    try {
      const [listings, wants, trades, savedItems] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.items, 
          createUserQuery('items', userId, [Query.orderDesc('created_at')])),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.wants,
          createUserQuery('wants', userId, [Query.orderDesc('created_at')])),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.trades, [
          Query.or([
            Query.equal('offerer_id', [userId]),
            Query.equal('recipient_id', [userId])
          ]),
          Query.orderDesc('created_at')
        ]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.savedItems,
          createUserQuery('savedItems', userId, [Query.orderDesc('saved_at')]))
      ]);

      return {
        success: true,
        data: {
          listings: listings.documents,
          wants: wants.documents,
          trades: trades.documents,
          savedItems: savedItems.documents
        }
      };
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const featureService = new FeatureImplementationService();

export default featureService;

// Export individual methods for convenience
export const {
  createListing,
  updateListing,
  deleteListing,
  uploadImages,
  createWant,
  createTrade,
  respondToTrade,
  searchListings,
  updateUserProfile,
  saveItem,
  unsaveItem,
  getUserData
} = featureService;