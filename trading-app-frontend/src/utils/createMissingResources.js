/**
 * Create Missing Appwrite Resources
 * This script checks for and creates missing databases and collections
 */

import { Client, Databases, ID, Permission, Role } from 'appwrite';

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '689bdee000098bd9d55c';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'trading_post_db';

// Initialize client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection schemas
const COLLECTIONS_SCHEMA = {
  items: {
    name: 'Items',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 5000, required: false },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'condition', type: 'string', size: 50, required: true },
      { key: 'price', type: 'double', required: false, min: 0, max: 1000000 },
      { key: 'estimated_value', type: 'double', required: false, min: 0, max: 1000000 },
      { key: 'ai_estimated_value', type: 'double', required: false, min: 0, max: 1000000 },
      { key: 'trade_preferences', type: 'string', size: 1000, required: false },
      { key: 'location_lat', type: 'double', required: false, min: -90, max: 90 },
      { key: 'location_lng', type: 'double', required: false, min: -180, max: 180 },
      { key: 'city', type: 'string', size: 100, required: false },
      { key: 'state', type: 'string', size: 50, required: false },
      { key: 'zipcode', type: 'string', size: 20, required: false },
      { key: 'images', type: 'string', size: 5000, required: false },
      { key: 'primary_image_url', type: 'string', size: 500, required: false },
      { key: 'status', type: 'string', size: 50, required: false },
      { key: 'is_featured', type: 'boolean', required: false },
      { key: 'views', type: 'integer', required: false, min: 0 },
      { key: 'likes', type: 'integer', required: false, min: 0 },
      { key: 'ai_tags', type: 'string', size: 2000, required: false },
      { key: 'ai_analysis', type: 'string', size: 5000, required: false },
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'user_id', type: 'string', size: 36, required: false },
      { key: 'owner_id', type: 'string', size: 36, required: false },
      { key: 'created_at', type: 'datetime', required: false },
      { key: 'updated_at', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_category', type: 'key', attributes: ['category'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] },
      { key: 'idx_created', type: 'key', attributes: ['$createdAt'], orders: ['DESC'] }
    ]
  },
  users: {
    name: 'Users',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'email', type: 'email', required: true },
      { key: 'username', type: 'string', size: 100, required: false },
      { key: 'name', type: 'string', size: 255, required: false },
      { key: 'avatar', type: 'string', size: 500, required: false },
      { key: 'bio', type: 'string', size: 1000, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'phone', type: 'string', size: 20, required: false },
      { key: 'rating', type: 'double', required: false, min: 0, max: 5 },
      { key: 'totalTrades', type: 'integer', required: false, min: 0 },
      { key: 'verifiedSeller', type: 'boolean', required: false },
      { key: 'preferences', type: 'string', size: 2000, required: false },
      { key: 'joinedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'idx_email', type: 'unique', attributes: ['email'] },
      { key: 'idx_username', type: 'unique', attributes: ['username'] }
    ]
  },
  wants: {
    name: 'Wants',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: false },
      { key: 'category', type: 'string', size: 100, required: false },
      { key: 'maxBudget', type: 'double', required: false, min: 0 },
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'status', type: 'string', size: 50, required: false },
      { key: 'created_at', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'idx_userId', type: 'key', attributes: ['userId'] },
      { key: 'idx_category', type: 'key', attributes: ['category'] }
    ]
  },
  trades: {
    name: 'Trades',
    attributes: [
      { key: 'initiatorId', type: 'string', size: 36, required: true },
      { key: 'recipientId', type: 'string', size: 36, required: true },
      { key: 'initiatorItems', type: 'string', size: 1000, required: false },
      { key: 'recipientItems', type: 'string', size: 1000, required: false },
      { key: 'status', type: 'string', size: 50, required: true },
      { key: 'message', type: 'string', size: 2000, required: false },
      { key: 'completedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'idx_initiator', type: 'key', attributes: ['initiatorId'] },
      { key: 'idx_recipient', type: 'key', attributes: ['recipientId'] },
      { key: 'idx_status', type: 'key', attributes: ['status'] }
    ]
  },
  messages: {
    name: 'Messages',
    attributes: [
      { key: 'senderId', type: 'string', size: 36, required: true },
      { key: 'recipientId', type: 'string', size: 36, required: true },
      { key: 'conversationId', type: 'string', size: 100, required: false },
      { key: 'content', type: 'string', size: 5000, required: true },
      { key: 'read', type: 'boolean', required: false },
      { key: 'attachments', type: 'string', size: 2000, required: false }
    ],
    indexes: [
      { key: 'idx_sender', type: 'key', attributes: ['senderId'] },
      { key: 'idx_recipient', type: 'key', attributes: ['recipientId'] },
      { key: 'idx_conversation', type: 'key', attributes: ['conversationId'] }
    ]
  },
  matches: {
    name: 'Matches',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'matchedUserId', type: 'string', size: 36, required: true },
      { key: 'userItemId', type: 'string', size: 36, required: true },
      { key: 'matchedItemId', type: 'string', size: 36, required: true },
      { key: 'score', type: 'double', required: false, min: 0, max: 100 },
      { key: 'status', type: 'string', size: 50, required: false }
    ],
    indexes: [
      { key: 'idx_user', type: 'key', attributes: ['userId'] },
      { key: 'idx_matched', type: 'key', attributes: ['matchedUserId'] }
    ]
  },
  notifications: {
    name: 'Notifications',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'read', type: 'boolean', required: false },
      { key: 'relatedId', type: 'string', size: 36, required: false },
      { key: 'data', type: 'string', size: 2000, required: false }
    ],
    indexes: [
      { key: 'idx_user', type: 'key', attributes: ['userId'] },
      { key: 'idx_read', type: 'key', attributes: ['read'] }
    ]
  },
  saved_items: {
    name: 'Saved Items',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'itemId', type: 'string', size: 36, required: true },
      { key: 'savedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'idx_user', type: 'key', attributes: ['userId'] },
      { key: 'idx_item', type: 'key', attributes: ['itemId'] }
    ]
  }
};

class ResourceCreator {
  constructor() {
    this.errors = [];
    this.successes = [];
  }

  async checkAndCreateDatabase() {
    console.log('🔍 Checking if database exists:', DATABASE_ID);
    
    try {
      // Try to get the database
      const db = await databases.get(DATABASE_ID);
      console.log('✅ Database exists:', db.name);
      return true;
    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Database not found. Creating it...');
        try {
          const db = await databases.create(
            DATABASE_ID,
            'Trading Post Database'
          );
          console.log('✅ Database created:', db.name);
          this.successes.push(`Created database: ${DATABASE_ID}`);
          return true;
        } catch (createError) {
          console.error('❌ Failed to create database:', createError);
          this.errors.push(`Failed to create database: ${createError.message}`);
          return false;
        }
      } else {
        console.error('❌ Error checking database:', error);
        this.errors.push(`Error checking database: ${error.message}`);
        return false;
      }
    }
  }

  async checkAndCreateCollection(collectionId, schema) {
    console.log('🔍 Checking collection:', collectionId);
    
    try {
      // Try to get the collection
      const collection = await databases.getCollection(DATABASE_ID, collectionId);
      console.log('✅ Collection exists:', collection.name);
      return true;
    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Collection not found. Creating it...');
        try {
          // Create the collection
          const collection = await databases.createCollection(
            DATABASE_ID,
            collectionId,
            schema.name,
            [
              Permission.read(Role.any()),
              Permission.create(Role.users()),
              Permission.update(Role.users()),
              Permission.delete(Role.users())
            ]
          );
          console.log('✅ Collection created:', collection.name);
          
          // Add attributes
          for (const attr of schema.attributes) {
            await this.createAttribute(collectionId, attr);
          }
          
          // Wait for attributes to be ready
          console.log('⏳ Waiting for attributes to be ready...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Add indexes
          for (const index of schema.indexes || []) {
            await this.createIndex(collectionId, index);
          }
          
          this.successes.push(`Created collection: ${collectionId}`);
          return true;
        } catch (createError) {
          console.error('❌ Failed to create collection:', createError);
          this.errors.push(`Failed to create collection ${collectionId}: ${createError.message}`);
          return false;
        }
      } else {
        console.error('❌ Error checking collection:', error);
        this.errors.push(`Error checking collection ${collectionId}: ${error.message}`);
        return false;
      }
    }
  }

  async createAttribute(collectionId, attr) {
    try {
      console.log(`  Creating attribute: ${attr.key} (${attr.type})`);
      
      switch (attr.type) {
        case 'string':
          await databases.createStringAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'integer':
          await databases.createIntegerAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
            attr.array
          );
          break;
        case 'double':
        case 'float':
          await databases.createFloatAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
            attr.array
          );
          break;
        case 'boolean':
          await databases.createBooleanAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'datetime':
          await databases.createDatetimeAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'email':
          await databases.createEmailAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        case 'url':
          await databases.createUrlAttribute(
            DATABASE_ID,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            attr.array
          );
          break;
        default:
          console.warn(`  Unknown attribute type: ${attr.type}`);
      }
      
      console.log(`  ✅ Created attribute: ${attr.key}`);
    } catch (error) {
      console.error(`  ❌ Failed to create attribute ${attr.key}:`, error.message);
      this.errors.push(`Failed to create attribute ${attr.key}: ${error.message}`);
    }
  }

  async createIndex(collectionId, index) {
    try {
      console.log(`  Creating index: ${index.key}`);
      
      await databases.createIndex(
        DATABASE_ID,
        collectionId,
        index.key,
        index.type,
        index.attributes,
        index.orders
      );
      
      console.log(`  ✅ Created index: ${index.key}`);
    } catch (error) {
      console.error(`  ❌ Failed to create index ${index.key}:`, error.message);
      this.errors.push(`Failed to create index ${index.key}: ${error.message}`);
    }
  }

  async createAllResources() {
    console.log('🚀 Starting resource creation...');
    console.log('📍 Endpoint:', APPWRITE_ENDPOINT);
    console.log('📍 Project:', APPWRITE_PROJECT_ID);
    console.log('📍 Database:', DATABASE_ID);
    
    // Check and create database
    const dbCreated = await this.checkAndCreateDatabase();
    if (!dbCreated) {
      console.error('❌ Cannot proceed without database');
      return false;
    }
    
    // Check and create collections
    for (const [collectionId, schema] of Object.entries(COLLECTIONS_SCHEMA)) {
      await this.checkAndCreateCollection(collectionId, schema);
    }
    
    // Summary
    console.log('\n📊 Resource Creation Summary:');
    if (this.successes.length > 0) {
      console.log('✅ Successes:');
      this.successes.forEach(s => console.log('  -', s));
    }
    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(e => console.log('  -', e));
    }
    
    return this.errors.length === 0;
  }
}

// Export for use in other files
export default ResourceCreator;

// Auto-run if this file is executed directly
export async function createMissingResources() {
  const creator = new ResourceCreator();
  const success = await creator.createAllResources();
  
  if (success) {
    console.log('\n✅ All resources are ready!');
    return true;
  } else {
    console.log('\n⚠️ Some resources could not be created. Check the errors above.');
    return false;
  }
}