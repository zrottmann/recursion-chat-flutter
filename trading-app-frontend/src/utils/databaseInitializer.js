/**
 * Database Collection Initializer
 * Creates missing Appwrite collections and ensures proper schema
 * Handles matches, saved_items, and other missing collections
 */

import { databases, DATABASE_ID, COLLECTIONS, ID } from '../lib/appwrite';

class DatabaseInitializer {
  constructor() {
    this.requiredCollections = {
      users: {
        name: 'Users',
        permissions: ['read("any")', 'write("users")'],
        attributes: [
          { key: 'email', type: 'string', required: true, size: 255 },
          { key: 'fullName', type: 'string', required: true, size: 255 },
          { key: 'username', type: 'string', required: true, size: 100 },
          { key: 'profileImage', type: 'string', required: false, size: 500 },
          { key: 'location', type: 'string', required: false, size: 255 },
          { key: 'isVerified', type: 'boolean', required: false, default: false },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'updatedAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'username_idx', type: 'unique', attributes: ['username'] }
        ]
      },
      items: {
        name: 'Items',
        permissions: ['read("any")', 'write("users")'],
        attributes: [
          { key: 'title', type: 'string', required: true, size: 255 },
          { key: 'description', type: 'string', required: false, size: 2000 },
          { key: 'category', type: 'string', required: true, size: 100 },
          { key: 'condition', type: 'string', required: true, size: 50 },
          { key: 'userId', type: 'string', required: true, size: 50 },
          { key: 'images', type: 'string', required: false, size: 2000 },
          { key: 'isActive', type: 'boolean', required: false, default: true },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'updatedAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'user_items_idx', type: 'key', attributes: ['userId'] },
          { key: 'category_idx', type: 'key', attributes: ['category'] },
          { key: 'active_items_idx', type: 'key', attributes: ['isActive'] }
        ]
      },
      wants: {
        name: 'User Wants',
        permissions: ['read("any")', 'write("users")'],
        attributes: [
          { key: 'userId', type: 'string', required: true, size: 50 },
          { key: 'itemName', type: 'string', required: true, size: 255 },
          { key: 'description', type: 'string', required: false, size: 1000 },
          { key: 'category', type: 'string', required: false, size: 100 },
          { key: 'priority', type: 'integer', required: false, min: 1, max: 5, default: 3 },
          { key: 'isActive', type: 'boolean', required: false, default: true },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'updatedAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'user_wants_idx', type: 'key', attributes: ['userId'] },
          { key: 'active_wants_idx', type: 'key', attributes: ['isActive'] }
        ]
      },
      matches: {
        name: 'AI Matches',
        permissions: ['read("users")', 'write("users")'],
        attributes: [
          { key: 'userId', type: 'string', required: true, size: 50 },
          { key: 'itemId', type: 'string', required: true, size: 50 },
          { key: 'matchedUserId', type: 'string', required: true, size: 50 },
          { key: 'matchedItemId', type: 'string', required: true, size: 50 },
          { key: 'matchScore', type: 'float', required: true, min: 0, max: 1 },
          { key: 'matchReason', type: 'string', required: false, size: 500 },
          { key: 'status', type: 'string', required: true, size: 20, default: 'pending' },
          { key: 'viewedAt', type: 'datetime', required: false },
          { key: 'respondedAt', type: 'datetime', required: false },
          { key: 'createdAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'user_matches_idx', type: 'key', attributes: ['userId'] },
          { key: 'status_matches_idx', type: 'key', attributes: ['status'] },
          { key: 'score_matches_idx', type: 'key', attributes: ['matchScore'] }
        ]
      },
      saved_items: {
        name: 'Saved Items',
        permissions: ['read("users")', 'write("users")'],
        attributes: [
          { key: 'userId', type: 'string', required: true, size: 50 },
          { key: 'itemId', type: 'string', required: true, size: 50 },
          { key: 'notes', type: 'string', required: false, size: 500 },
          { key: 'savedAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'user_saved_idx', type: 'key', attributes: ['userId'] },
          { key: 'item_saved_idx', type: 'key', attributes: ['itemId'] },
          { key: 'user_item_saved_idx', type: 'unique', attributes: ['userId', 'itemId'] }
        ]
      },
      trades: {
        name: 'Trades',
        permissions: ['read("users")', 'write("users")'],
        attributes: [
          { key: 'initiatorUserId', type: 'string', required: true, size: 50 },
          { key: 'responderUserId', type: 'string', required: true, size: 50 },
          { key: 'initiatorItemId', type: 'string', required: true, size: 50 },
          { key: 'responderItemId', type: 'string', required: false, size: 50 },
          { key: 'status', type: 'string', required: true, size: 20, default: 'pending' },
          { key: 'message', type: 'string', required: false, size: 1000 },
          { key: 'completedAt', type: 'datetime', required: false },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'updatedAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'initiator_trades_idx', type: 'key', attributes: ['initiatorUserId'] },
          { key: 'responder_trades_idx', type: 'key', attributes: ['responderUserId'] },
          { key: 'status_trades_idx', type: 'key', attributes: ['status'] }
        ]
      },
      messages: {
        name: 'Messages',
        permissions: ['read("users")', 'write("users")'],
        attributes: [
          { key: 'senderId', type: 'string', required: true, size: 50 },
          { key: 'receiverId', type: 'string', required: true, size: 50 },
          { key: 'tradeId', type: 'string', required: false, size: 50 },
          { key: 'content', type: 'string', required: true, size: 2000 },
          { key: 'readAt', type: 'datetime', required: false },
          { key: 'createdAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'sender_messages_idx', type: 'key', attributes: ['senderId'] },
          { key: 'receiver_messages_idx', type: 'key', attributes: ['receiverId'] },
          { key: 'trade_messages_idx', type: 'key', attributes: ['tradeId'] }
        ]
      },
      notifications: {
        name: 'Notifications',
        permissions: ['read("users")', 'write("users")'],
        attributes: [
          { key: 'userId', type: 'string', required: true, size: 50 },
          { key: 'title', type: 'string', required: true, size: 255 },
          { key: 'message', type: 'string', required: true, size: 1000 },
          { key: 'type', type: 'string', required: true, size: 50 },
          { key: 'relatedId', type: 'string', required: false, size: 50 },
          { key: 'isRead', type: 'boolean', required: false, default: false },
          { key: 'createdAt', type: 'datetime', required: true }
        ],
        indexes: [
          { key: 'user_notifications_idx', type: 'key', attributes: ['userId'] },
          { key: 'unread_notifications_idx', type: 'key', attributes: ['isRead'] },
          { key: 'type_notifications_idx', type: 'key', attributes: ['type'] }
        ]
      }
    };
  }

  async initializeAllCollections() {
    console.log('🗄️ [DB-INIT] Starting database initialization...');
    
    const results = {
      success: [],
      errors: [],
      skipped: []
    };

    for (const [collectionId, config] of Object.entries(this.requiredCollections)) {
      try {
        console.log(`📋 [DB-INIT] Checking collection: ${collectionId}`);
        
        // Check if collection exists
        const exists = await this.collectionExists(collectionId);
        
        if (exists) {
          console.log(`✅ [DB-INIT] Collection ${collectionId} already exists`);
          results.skipped.push(collectionId);
          continue;
        }

        // Create collection
        console.log(`🔨 [DB-INIT] Creating collection: ${collectionId}`);
        await this.createCollection(collectionId, config);
        
        results.success.push(collectionId);
        console.log(`✅ [DB-INIT] Successfully created ${collectionId}`);

      } catch (error) {
        console.error(`❌ [DB-INIT] Failed to create ${collectionId}:`, error);
        results.errors.push({ collectionId, error: error.message });
      }
    }

    console.log('🎉 [DB-INIT] Database initialization complete:', {
      created: results.success.length,
      skipped: results.skipped.length,
      errors: results.errors.length
    });

    return results;
  }

  async collectionExists(collectionId) {
    try {
      // Use listDocuments with limit 1 to check if collection exists
      await databases.listDocuments(DATABASE_ID, collectionId, []);
      return true;
    } catch (error) {
      if (error.code === 404) {
        return false;
      }
      throw error;
    }
  }

  async createCollection(collectionId, config) {
    // Create collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      collectionId,
      config.name,
      config.permissions
    );

    console.log(`📋 [DB-INIT] Created collection ${collectionId}, adding attributes...`);

    // Add attributes
    for (const attr of config.attributes) {
      try {
        await this.createAttribute(collectionId, attr);
        console.log(`  ✅ Added attribute: ${attr.key}`);
      } catch (error) {
        console.error(`  ❌ Failed to add attribute ${attr.key}:`, error);
        throw error;
      }
    }

    // Wait for collection to be ready
    await this.waitForCollectionReady(collectionId);

    // Add indexes
    if (config.indexes) {
      for (const index of config.indexes) {
        try {
          await this.createIndex(collectionId, index);
          console.log(`  ✅ Added index: ${index.key}`);
        } catch (error) {
          console.error(`  ❌ Failed to add index ${index.key}:`, error);
          // Don't throw for index errors - they're not critical
        }
      }
    }

    return collection;
  }

  async createAttribute(collectionId, attr) {
    switch (attr.type) {
      case 'string':
        return databases.createStringAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.size,
          attr.required,
          attr.default,
          attr.array
        );
      case 'integer':
        return databases.createIntegerAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.default,
          attr.array
        );
      case 'float':
        return databases.createFloatAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.default,
          attr.array
        );
      case 'boolean':
        return databases.createBooleanAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array
        );
      case 'datetime':
        return databases.createDatetimeAttribute(
          DATABASE_ID,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array
        );
      default:
        throw new Error(`Unsupported attribute type: ${attr.type}`);
    }
  }

  async createIndex(collectionId, index) {
    return databases.createIndex(
      DATABASE_ID,
      collectionId,
      index.key,
      index.type,
      index.attributes,
      index.orders
    );
  }

  async waitForCollectionReady(collectionId, maxRetries = 10) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Check if collection is ready by trying to list documents
        await databases.listDocuments(DATABASE_ID, collectionId, []);
        console.log(`✅ [DB-INIT] Collection ${collectionId} is ready`);
        return true;
      } catch (error) {
        // Collection might still be creating
      }
      
      console.log(`⏳ [DB-INIT] Waiting for collection ${collectionId} to be ready... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Collection ${collectionId} did not become ready within timeout`);
  }

  // Quick fix for missing collections - creates minimal versions
  async createMissingCollectionsQuickFix() {
    console.log('🚀 [DB-INIT] Quick fix - creating missing collections...');
    
    const criticalCollections = ['matches', 'saved_items'];
    const results = [];

    for (const collectionId of criticalCollections) {
      try {
        const exists = await this.collectionExists(collectionId);
        if (!exists) {
          await this.createMinimalCollection(collectionId);
          results.push({ collection: collectionId, status: 'created' });
          console.log(`✅ [DB-INIT] Quick-created ${collectionId}`);
        } else {
          results.push({ collection: collectionId, status: 'exists' });
        }
      } catch (error) {
        console.error(`❌ [DB-INIT] Failed to quick-create ${collectionId}:`, error);
        results.push({ collection: collectionId, status: 'error', error: error.message });
      }
    }

    return results;
  }

  async createMinimalCollection(collectionId) {
    const config = this.requiredCollections[collectionId];
    if (!config) {
      throw new Error(`No configuration found for collection: ${collectionId}`);
    }

    // Create collection with minimal permissions
    await databases.createCollection(
      DATABASE_ID,
      collectionId,
      config.name,
      ['read("users")', 'write("users")']
    );

    // Add only essential attributes
    const essentialAttributes = config.attributes.filter(attr => attr.required);
    for (const attr of essentialAttributes) {
      await this.createAttribute(collectionId, attr);
    }

    // Wait for it to be ready
    await this.waitForCollectionReady(collectionId, 5);
  }
}

// Export singleton instance
export default new DatabaseInitializer();

// Also export the class for direct instantiation if needed
export { DatabaseInitializer };