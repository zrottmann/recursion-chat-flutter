/**
 * Items Service
 * Handles all item/listing operations using Appwrite
 */

import createDebugger from '../utils/debugLogger.js';

const debug = createDebugger('trading-post:itemsService');

import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS, ID, Query, handleAppwriteError } from '../lib/appwrite';
import { account } from '../lib/appwrite';
// Import smart database wrapper to handle schema issues
import { smartDatabases } from '../utils/fixDatabaseSchema';
// Import field mapping fixer to handle schema inconsistencies
import FieldMappingFixer from '../utils/fieldMappingFixer';

class ItemsService {
  constructor() {
    this.currentUser = null;
    // Use smart wrapper to handle field mapping issues
    this.db = smartDatabases;
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId() {
    try {
      if (!this.currentUser) {
        this.currentUser = await account.get();
      }
      return this.currentUser.$id;
    } catch (error) {
      debug.error('Failed to get current user', error);
      return null;
    }
  }

  /**
   * Create a new item listing
   */
  async createItem(itemData) {
    try {
      console.log('🔍 [ItemsService] Getting current user...');
      const userId = await this.getCurrentUserId();
      console.log('🔍 [ItemsService] Current user ID:', userId);
      
      if (!userId) {
        console.error('❌ [ItemsService] User not authenticated');
        throw new Error('User not authenticated');
      }

      console.log('✅ [ItemsService] Creating new item:', { 
        title: itemData.title, 
        category: itemData.category,
        userId: userId 
      });

      // Upload images first if provided
      let imageUrls = [];
      let primaryImageUrl = null;
      
      if (itemData.images && itemData.images.length > 0) {
        debug.debug('Uploading images', { count: itemData.images.length });
        imageUrls = await this.uploadImages(itemData.images);
        primaryImageUrl = imageUrls[0];
        debug.success('Images uploaded', { count: imageUrls.length });
      }

      // Prepare base item data first
      const baseItemData = {
        title: itemData.title,
        description: itemData.description || '',
        category: itemData.category,
        condition: itemData.condition,
        price: itemData.price || itemData.estimated_value || 0,
        estimated_value: itemData.estimated_value || itemData.price || 0,
        ai_estimated_value: itemData.ai_estimated_value || null,
        trade_preferences: itemData.trade_preferences || '',
        location_lat: itemData.latitude || null,
        location_lng: itemData.longitude || null,
        city: itemData.city || '',
        state: itemData.state || '',
        zipcode: itemData.zipcode || '',
        images: imageUrls,
        primary_image_url: primaryImageUrl,
        status: 'active',
        is_featured: false,
        views: 0,
        likes: 0,
        ai_tags: JSON.stringify(itemData.ai_tags || []),
        ai_analysis: JSON.stringify(itemData.ai_analysis || {}),
        // Explicitly add userId and all fallback fields
        userId: userId,
        user_id: userId,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('🔍 [ItemsService] Base item data prepared:', {
        title: baseItemData.title,
        userId: baseItemData.userId,
        user_id: baseItemData.user_id
      });

      // Apply field mapping (this should be redundant now but keeping for safety)
      const itemDocument = FieldMappingFixer.prepareDocumentData('items', baseItemData, userId);
      
      console.log('🔍 [ItemsService] Final item document:', {
        title: itemDocument.title,
        userId: itemDocument.userId,
        user_id: itemDocument.user_id,
        hasAllFields: !!(itemDocument.userId || itemDocument.user_id)
      });

      console.log('📡 [ItemsService] Attempting to create document in database...');
      const item = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        ID.unique(),
        itemDocument
      );

      console.log('✅ [ItemsService] Item created successfully:', { 
        itemId: item.$id, 
        title: item.title,
        userId: item.userId || item.user_id
      });
      
      debug.success('Item created', { itemId: item.$id, title: item.title });
      return { success: true, item };

    } catch (error) {
      console.error('❌ [ItemsService] Failed to create item:', {
        error: error.message,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      
      debug.error('Failed to create item', { error: error.message, code: error.code });
      return { 
        success: false, 
        error: handleAppwriteError(error) 
      };
    }
  }

  /**
   * Get all items with pagination and filters
   */
  async getItems(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        category = null,
        condition = null,
        userId = null,
        search = null,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = options;

      debug.info('Fetching items', options);

      // Build queries
      const queries = [
        Query.equal('status', 'active'),
        Query.limit(limit),
        Query.offset((page - 1) * limit)
      ];

      // Add filters
      if (category) {
        queries.push(Query.equal('category', category));
      }
      if (condition) {
        queries.push(Query.equal('condition', condition));
      }
      if (userId) {
        queries.push(FieldMappingFixer.createUserQuery('items', userId));
      }
      if (search) {
        queries.push(Query.search('title', search));
      }

      // Add sorting - use standard Appwrite fields
      const sortField = sortBy === 'created_at' ? '$createdAt' : sortBy;
      if (sortOrder === 'desc') {
        queries.push(Query.orderDesc(sortField));
      } else {
        queries.push(Query.orderAsc(sortField));
      }

      const response = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );

      // Parse JSON fields and normalize field names
      const items = response.documents.map(item => {
        const normalizedItem = FieldMappingFixer.normalizeResponseData(item);
        
        // Parse JSON fields safely
        let images = [];
        let aiTags = [];
        let aiAnalysis = {};
        
        try {
          if (normalizedItem.images) {
            images = typeof normalizedItem.images === 'string' ? 
              JSON.parse(normalizedItem.images) : normalizedItem.images;
          }
        } catch (e) {
          console.warn('Failed to parse images:', e);
        }
        
        try {
          if (normalizedItem.aiTags) {
            aiTags = typeof normalizedItem.aiTags === 'string' ? 
              JSON.parse(normalizedItem.aiTags) : normalizedItem.aiTags;
          }
        } catch (e) {
          console.warn('Failed to parse aiTags:', e);
        }
        
        try {
          if (normalizedItem.aiAnalysis) {
            aiAnalysis = typeof normalizedItem.aiAnalysis === 'string' ? 
              JSON.parse(normalizedItem.aiAnalysis) : normalizedItem.aiAnalysis;
          }
        } catch (e) {
          console.warn('Failed to parse aiAnalysis:', e);
        }
        
        return {
          ...normalizedItem,
          // Ensure price field exists (fallback to estimated_value)
          price: normalizedItem.price || normalizedItem.estimated_value || normalizedItem.estimatedValue || 0,
          images: Array.isArray(images) ? images : [],
          aiTags: Array.isArray(aiTags) ? aiTags : [],
          aiAnalysis: aiAnalysis || {}
        };
      });

      console.log(`✅ Fetched ${items.length} items`);

      return {
        success: true,
        items,
        total: response.total,
        page,
        totalPages: Math.ceil(response.total / limit)
      };

    } catch (error) {
      console.error('❌ Failed to fetch items:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error),
        items: [],
        total: 0
      };
    }
  }

  /**
   * Get a single item by ID
   */
  async getItem(itemId) {
    try {
      console.log('🔍 Fetching item:', itemId);

      const item = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId
      );

      // Parse JSON fields and normalize
      item.images = this.parseJSONField(item.images);
      item.ai_tags = this.parseJSONField(item.ai_tags);
      item.ai_analysis = this.parseJSONField(item.ai_analysis);
      // Ensure price field exists (fallback to estimated_value)
      item.price = item.price || item.estimated_value || 0;

      // Increment view count
      await this.incrementViews(itemId, item.views);

      console.log('✅ Item fetched:', item);
      return { success: true, item };

    } catch (error) {
      console.error('❌ Failed to fetch item:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error) 
      };
    }
  }

  /**
   * Update an item
   */
  async updateItem(itemId, updates) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('📝 Updating item:', itemId, updates);

      // Check ownership
      const item = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId
      );

      // Normalize item data and check ownership with multiple field possibilities
      const normalizedItem = FieldMappingFixer.normalizeResponseData(item);
      const itemUserId = normalizedItem.userId || normalizedItem.user_id || item.$permissions?.find(p => p.includes('user:'))?.split(':')[1];
      
      if (itemUserId !== userId) {
        throw new Error('You can only update your own items');
      }

      // Handle image uploads if new images provided
      if (updates.images && Array.isArray(updates.images)) {
        const newImages = updates.images.filter(img => img instanceof File);
        if (newImages.length > 0) {
          const uploadedUrls = await this.uploadImages(newImages);
          const existingUrls = updates.images.filter(img => typeof img === 'string');
          updates.images = [...existingUrls, ...uploadedUrls];
          updates.primary_image_url = updates.images[0] || null;
        }
        updates.images = JSON.stringify(updates.images);
      }

      // Stringify JSON fields if present
      if (updates.ai_tags) {
        updates.ai_tags = JSON.stringify(updates.ai_tags);
      }
      if (updates.ai_analysis) {
        updates.ai_analysis = JSON.stringify(updates.ai_analysis);
      }

      // Add updated timestamp
      updates.updated_at = new Date().toISOString();

      const updatedItem = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId,
        updates
      );

      console.log('✅ Item updated:', updatedItem);
      return { success: true, item: updatedItem };

    } catch (error) {
      console.error('❌ Failed to update item:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error) 
      };
    }
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('🗑️ Deleting item:', itemId);

      // Check ownership
      const item = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId
      );

      if (item.user_id !== userId) {
        throw new Error('You can only delete your own items');
      }

      // Delete associated images from storage
      if (item.images) {
        const imageUrls = JSON.parse(item.images);
        for (const url of imageUrls) {
          await this.deleteImage(url);
        }
      }

      await this.db.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId
      );

      console.log('✅ Item deleted');
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to delete item:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error) 
      };
    }
  }

  /**
   * Search items
   */
  async searchItems(searchParams) {
    try {
      console.log('🔍 Searching items:', searchParams);

      const queries = [
        Query.equal('status', 'active')
      ];

      // Add search query
      if (searchParams.query) {
        queries.push(Query.search('title', searchParams.query));
      }

      // Add filters
      if (searchParams.category) {
        queries.push(Query.equal('category', searchParams.category));
      }
      if (searchParams.condition) {
        queries.push(Query.equal('condition', searchParams.condition));
      }
      if (searchParams.minValue) {
        queries.push(Query.greaterThanEqual('estimated_value', searchParams.minValue));
      }
      if (searchParams.maxValue) {
        queries.push(Query.lessThanEqual('estimated_value', searchParams.maxValue));
      }

      // Add location filter if provided
      if (searchParams.latitude && searchParams.longitude && searchParams.radius) {
        // Note: Appwrite doesn't have native geospatial queries yet
        // We'll filter in memory for now
        // In production, you might want to use a separate service for geo queries
      }

      // Add pagination
      const limit = searchParams.limit || 20;
      const page = searchParams.page || 1;
      queries.push(Query.limit(limit));
      queries.push(Query.offset((page - 1) * limit));

      // Add sorting
      const sortBy = searchParams.sortBy || 'created_at';
      const sortOrder = searchParams.sortOrder || 'desc';
      if (sortOrder === 'desc') {
        queries.push(Query.orderDesc(sortBy));
      } else {
        queries.push(Query.orderAsc(sortBy));
      }

      const response = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );

      // Parse JSON fields
      const items = response.documents.map(item => ({
        ...item,
        price: item.price || item.estimated_value || 0,
        images: this.parseJSONField(item.images),
        ai_tags: this.parseJSONField(item.ai_tags),
        ai_analysis: this.parseJSONField(item.ai_analysis)
      }));

      // Apply location filter if needed (in-memory filtering)
      let filteredItems = items;
      if (searchParams.latitude && searchParams.longitude && searchParams.radius) {
        filteredItems = items.filter(item => {
          if (!item.location_lat || !item.location_lng) return false;
          const distance = this.calculateDistance(
            searchParams.latitude,
            searchParams.longitude,
            item.location_lat,
            item.location_lng
          );
          return distance <= searchParams.radius;
        });
      }

      console.log(`✅ Found ${filteredItems.length} items`);

      return {
        success: true,
        listings: filteredItems,
        page,
        total_pages: Math.ceil(response.total / limit),
        total: filteredItems.length
      };

    } catch (error) {
      console.error('❌ Search failed:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error),
        listings: [],
        total: 0
      };
    }
  }

  /**
   * Get user's items
   */
  async getUserItems(userId = null) {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) throw new Error('User not authenticated');

      return await this.getItems({ userId: targetUserId });

    } catch (error) {
      console.error('❌ Failed to fetch user items:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error),
        items: []
      };
    }
  }

  /**
   * Upload images to storage
   */
  async uploadImages(images) {
    const uploadedUrls = [];

    for (const image of images) {
      try {
        const file = await storage.createFile(
          BUCKETS.itemImages,
          ID.unique(),
          image
        );

        // Get the file URL
        const url = storage.getFileView(BUCKETS.itemImages, file.$id);
        uploadedUrls.push(url.href);

      } catch (error) {
        console.error('Failed to upload image:', error);
      }
    }

    return uploadedUrls;
  }

  /**
   * Delete an image from storage
   */
  async deleteImage(imageUrl) {
    try {
      // Extract file ID from URL
      const urlParts = imageUrl.split('/');
      const fileId = urlParts[urlParts.length - 2]; // Assuming standard Appwrite URL structure
      
      await storage.deleteFile(BUCKETS.itemImages, fileId);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(itemId, currentViews) {
    try {
      await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId,
        { views: (currentViews || 0) + 1 }
      );
    } catch (error) {
      console.error('Failed to increment views:', error);
    }
  }

  /**
   * Like/unlike an item
   */
  async toggleLike(itemId) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Check if already liked (would need a separate likes collection)
      // For now, just increment the counter
      const item = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId
      );

      await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId,
        { likes: (item.likes || 0) + 1 }
      );

      return { success: true, liked: true };

    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error) 
      };
    }
  }

  /**
   * Calculate distance between two coordinates (in miles)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  /**
   * Safely parse JSON field - handles both strings and already-parsed objects
   */
  parseJSONField(field) {
    if (!field) return Array.isArray(field) ? [] : {};
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (error) {
        console.warn('Failed to parse JSON field:', field);
        return Array.isArray(field) ? [] : {};
      }
    }
    return field; // Already parsed
  }
}

// Create singleton instance
const itemsService = new ItemsService();

export default itemsService;