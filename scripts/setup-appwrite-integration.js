/**
 * Complete Appwrite Database Setup & Migration Script
 * Based on Agent Swarm Database Integration findings
 */

const { Client, Databases, Storage, Users } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  endpoint: process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1',
  projectId: process.env.APPWRITE_PROJECT_ID,
  apiKey: process.env.APPWRITE_API_KEY,
  
  databases: {
    recursionChat: {
      databaseId: 'recursion_chat_db',
      projectId: '689bdaf500072795b0f6',
    },
    tradingPost: {
      databaseId: 'trading_post_db', 
      projectId: '689bdee000098bd9d55c',
    },
    slumlord: {
      databaseId: 'slumlord_db',
      projectId: '68a0db634634a6d0392f',
    },
    archon: {
      databaseId: 'archon_db',
      projectId: '68a4e3da0022f3e129d0',
    },
  }
};

class AppwriteMigrator {
  constructor(projectId, databaseId) {
    this.client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(projectId)
      .setKey(config.apiKey);
      
    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.users = new Users(this.client);
    
    this.projectId = projectId;
    this.databaseId = databaseId;
  }

  async ensureDatabase() {
    try {
      await this.databases.get(this.databaseId);
      console.log(`✅ Database ${this.databaseId} exists`);
      return true;
    } catch (error) {
      if (error.code === 404) {
        console.log(`📦 Creating database: ${this.databaseId}`);
        await this.databases.create(this.databaseId, this.databaseId);
        return true;
      }
      throw error;
    }
  }

  async createCollection(collectionId, name, permissions, attributes, indexes = []) {
    try {
      await this.databases.getCollection(this.databaseId, collectionId);
      console.log(`✅ Collection ${collectionId} exists`);
      return false; // Collection already exists
    } catch (error) {
      if (error.code === 404) {
        console.log(`📋 Creating collection: ${collectionId}`);
        await this.databases.createCollection(
          this.databaseId,
          collectionId,
          name,
          permissions
        );

        // Add attributes
        for (const attr of attributes) {
          await this.createAttribute(collectionId, attr);
        }

        // Add indexes
        for (const index of indexes) {
          await this.createIndex(collectionId, index);
        }

        return true; // Collection was created
      }
      throw error;
    }
  }

  async createAttribute(collectionId, attribute) {
    const { type, key, size, required, array, defaultValue } = attribute;
    
    try {
      switch (type) {
        case 'string':
          await this.databases.createStringAttribute(
            this.databaseId,
            collectionId,
            key,
            size || 255,
            required || false,
            defaultValue || null,
            array || false
          );
          break;
        case 'integer':
          await this.databases.createIntegerAttribute(
            this.databaseId,
            collectionId,
            key,
            required || false,
            attribute.min,
            attribute.max,
            defaultValue || null,
            array || false
          );
          break;
        case 'float':
          await this.databases.createFloatAttribute(
            this.databaseId,
            collectionId,
            key,
            required || false,
            attribute.min,
            attribute.max,
            defaultValue || null,
            array || false
          );
          break;
        case 'boolean':
          await this.databases.createBooleanAttribute(
            this.databaseId,
            collectionId,
            key,
            required || false,
            defaultValue || null,
            array || false
          );
          break;
        case 'datetime':
          await this.databases.createDatetimeAttribute(
            this.databaseId,
            collectionId,
            key,
            required || false,
            defaultValue || null,
            array || false
          );
          break;
        case 'email':
          await this.databases.createEmailAttribute(
            this.databaseId,
            collectionId,
            key,
            required || false,
            defaultValue || null,
            array || false
          );
          break;
        case 'url':
          await this.databases.createUrlAttribute(
            this.databaseId,
            collectionId,
            key,
            required || false,
            defaultValue || null,
            array || false
          );
          break;
      }
      
      console.log(`  ✓ Attribute ${key} (${type}) created`);
      await this.wait(1000); // Rate limiting
    } catch (error) {
      console.log(`  ⚠️ Attribute ${key} may already exist: ${error.message}`);
    }
  }

  async createIndex(collectionId, index) {
    const { key, type, attributes, orders } = index;
    
    try {
      await this.databases.createIndex(
        this.databaseId,
        collectionId,
        key,
        type || 'key',
        attributes,
        orders
      );
      console.log(`  ✓ Index ${key} created`);
    } catch (error) {
      console.log(`  ⚠️ Index ${key} may already exist: ${error.message}`);
    }
  }

  async createStorageBucket(bucketId, name, permissions, maxFileSize = 50000000) {
    try {
      await this.storage.getBucket(bucketId);
      console.log(`✅ Bucket ${bucketId} exists`);
      return false;
    } catch (error) {
      if (error.code === 404) {
        console.log(`🪣 Creating storage bucket: ${bucketId}`);
        await this.storage.createBucket(
          bucketId,
          name,
          permissions,
          false, // File security (disabled for public access)
          true,  // Enabled
          maxFileSize,
          ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'txt'],
          'gzip', // Compression
          false, // Encryption
          false  // Antivirus
        );
        return true;
      }
      throw error;
    }
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Database Schemas
const schemas = {
  recursionChat: {
    collections: [
      {
        id: 'users',
        name: 'Users',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'username', size: 50, required: true },
          { type: 'email', key: 'email', required: true },
          { type: 'string', key: 'displayName', size: 100 },
          { type: 'url', key: 'avatar' },
          { type: 'boolean', key: 'isOnline', defaultValue: false },
          { type: 'datetime', key: 'lastSeen' },
          { type: 'string', key: 'status', size: 20, defaultValue: 'offline' },
          { type: 'datetime', key: 'joinedAt', required: true },
        ],
        indexes: [
          { key: 'username_idx', type: 'unique', attributes: ['username'] },
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'online_idx', type: 'key', attributes: ['isOnline'] },
        ],
      },
      {
        id: 'rooms',
        name: 'Chat Rooms',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'name', size: 100, required: true },
          { type: 'string', key: 'description', size: 500 },
          { type: 'string', key: 'type', size: 20, required: true }, // public, private, direct
          { type: 'string', key: 'createdBy', size: 50, required: true },
          { type: 'string', key: 'participants', array: true },
          { type: 'integer', key: 'maxParticipants', defaultValue: 100 },
          { type: 'boolean', key: 'isActive', defaultValue: true },
          { type: 'datetime', key: 'createdAt', required: true },
          { type: 'datetime', key: 'lastActivity' },
        ],
        indexes: [
          { key: 'type_idx', type: 'key', attributes: ['type'] },
          { key: 'creator_idx', type: 'key', attributes: ['createdBy'] },
          { key: 'active_idx', type: 'key', attributes: ['isActive'] },
        ],
      },
      {
        id: 'messages',
        name: 'Messages',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'roomId', size: 50, required: true },
          { type: 'string', key: 'userId', size: 50, required: true },
          { type: 'string', key: 'username', size: 50, required: true },
          { type: 'string', key: 'content', size: 2000, required: true },
          { type: 'string', key: 'type', size: 20, defaultValue: 'text' }, // text, image, file
          { type: 'string', key: 'attachments', array: true },
          { type: 'boolean', key: 'isEdited', defaultValue: false },
          { type: 'boolean', key: 'isDeleted', defaultValue: false },
          { type: 'datetime', key: 'timestamp', required: true },
          { type: 'datetime', key: 'editedAt' },
        ],
        indexes: [
          { key: 'room_time_idx', type: 'key', attributes: ['roomId', 'timestamp'] },
          { key: 'user_idx', type: 'key', attributes: ['userId'] },
          { key: 'type_idx', type: 'key', attributes: ['type'] },
        ],
      },
    ],
    buckets: [
      {
        id: 'chat-attachments',
        name: 'Chat Attachments',
        permissions: ['read("any")', 'write("any")'],
      },
    ],
  },

  tradingPost: {
    collections: [
      {
        id: 'users',
        name: 'Users',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'username', size: 50, required: true },
          { type: 'email', key: 'email', required: true },
          { type: 'string', key: 'fullName', size: 100 },
          { type: 'string', key: 'phone', size: 20 },
          { type: 'string', key: 'location', size: 200 },
          { type: 'float', key: 'latitude' },
          { type: 'float', key: 'longitude' },
          { type: 'float', key: 'rating', defaultValue: 5.0 },
          { type: 'integer', key: 'totalTrades', defaultValue: 0 },
          { type: 'boolean', key: 'isVerified', defaultValue: false },
          { type: 'datetime', key: 'joinedAt', required: true },
        ],
        indexes: [
          { key: 'username_idx', type: 'unique', attributes: ['username'] },
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'location_idx', type: 'key', attributes: ['latitude', 'longitude'] },
          { key: 'rating_idx', type: 'key', attributes: ['rating'] },
        ],
      },
      {
        id: 'items',
        name: 'Trade Items',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'title', size: 200, required: true },
          { type: 'string', key: 'description', size: 2000 },
          { type: 'string', key: 'category', size: 50, required: true },
          { type: 'string', key: 'condition', size: 20 }, // new, like-new, good, fair, poor
          { type: 'float', key: 'price' },
          { type: 'string', key: 'currency', size: 3, defaultValue: 'USD' },
          { type: 'string', key: 'sellerId', size: 50, required: true },
          { type: 'string', key: 'images', array: true },
          { type: 'string', key: 'tags', array: true },
          { type: 'string', key: 'status', size: 20, defaultValue: 'available' }, // available, sold, reserved
          { type: 'string', key: 'location', size: 200 },
          { type: 'float', key: 'latitude' },
          { type: 'float', key: 'longitude' },
          { type: 'integer', key: 'views', defaultValue: 0 },
          { type: 'datetime', key: 'createdAt', required: true },
          { type: 'datetime', key: 'updatedAt' },
        ],
        indexes: [
          { key: 'category_idx', type: 'key', attributes: ['category'] },
          { key: 'seller_idx', type: 'key', attributes: ['sellerId'] },
          { key: 'status_idx', type: 'key', attributes: ['status'] },
          { key: 'location_idx', type: 'key', attributes: ['latitude', 'longitude'] },
          { key: 'price_idx', type: 'key', attributes: ['price'] },
        ],
      },
      {
        id: 'trades',
        name: 'Trade Transactions',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'itemId', size: 50, required: true },
          { type: 'string', key: 'buyerId', size: 50, required: true },
          { type: 'string', key: 'sellerId', size: 50, required: true },
          { type: 'float', key: 'amount', required: true },
          { type: 'string', key: 'currency', size: 3, defaultValue: 'USD' },
          { type: 'string', key: 'status', size: 20, required: true }, // pending, confirmed, completed, cancelled
          { type: 'string', key: 'paymentMethod', size: 50 },
          { type: 'string', key: 'paymentId', size: 100 },
          { type: 'string', key: 'messages', array: true },
          { type: 'datetime', key: 'createdAt', required: true },
          { type: 'datetime', key: 'completedAt' },
        ],
        indexes: [
          { key: 'item_idx', type: 'key', attributes: ['itemId'] },
          { key: 'buyer_idx', type: 'key', attributes: ['buyerId'] },
          { key: 'seller_idx', type: 'key', attributes: ['sellerId'] },
          { key: 'status_idx', type: 'key', attributes: ['status'] },
        ],
      },
    ],
    buckets: [
      {
        id: 'item-images',
        name: 'Item Images',
        permissions: ['read("any")', 'write("any")'],
      },
    ],
  },

  slumlord: {
    collections: [
      {
        id: 'players',
        name: 'Players',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'username', size: 50, required: true },
          { type: 'email', key: 'email', required: true },
          { type: 'integer', key: 'level', defaultValue: 1 },
          { type: 'integer', key: 'experience', defaultValue: 0 },
          { type: 'integer', key: 'health', defaultValue: 100 },
          { type: 'integer', key: 'mana', defaultValue: 50 },
          { type: 'integer', key: 'gold', defaultValue: 100 },
          { type: 'integer', key: 'positionX', defaultValue: 0 },
          { type: 'integer', key: 'positionY', defaultValue: 0 },
          { type: 'string', key: 'currentMap', size: 50, defaultValue: 'city_center' },
          { type: 'string', key: 'inventory', array: true },
          { type: 'string', key: 'equipment', array: true },
          { type: 'datetime', key: 'lastPlayed' },
          { type: 'datetime', key: 'createdAt', required: true },
        ],
        indexes: [
          { key: 'username_idx', type: 'unique', attributes: ['username'] },
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'level_idx', type: 'key', attributes: ['level'] },
        ],
      },
      {
        id: 'game_sessions',
        name: 'Game Sessions',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'playerId', size: 50, required: true },
          { type: 'string', key: 'sessionId', size: 100, required: true },
          { type: 'datetime', key: 'startTime', required: true },
          { type: 'datetime', key: 'endTime' },
          { type: 'integer', key: 'duration' },
          { type: 'string', key: 'actions', array: true },
          { type: 'boolean', key: 'isActive', defaultValue: true },
        ],
        indexes: [
          { key: 'player_idx', type: 'key', attributes: ['playerId'] },
          { key: 'session_idx', type: 'unique', attributes: ['sessionId'] },
          { key: 'active_idx', type: 'key', attributes: ['isActive'] },
        ],
      },
    ],
    buckets: [
      {
        id: 'game-assets',
        name: 'Game Assets',
        permissions: ['read("any")', 'write("any")'],
      },
    ],
  },

  archon: {
    collections: [
      {
        id: 'users',
        name: 'Users',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'username', size: 50, required: true },
          { type: 'email', key: 'email', required: true },
          { type: 'string', key: 'role', size: 20, defaultValue: 'user' },
          { type: 'string', key: 'permissions', array: true },
          { type: 'boolean', key: 'isActive', defaultValue: true },
          { type: 'datetime', key: 'lastLogin' },
          { type: 'datetime', key: 'createdAt', required: true },
        ],
        indexes: [
          { key: 'username_idx', type: 'unique', attributes: ['username'] },
          { key: 'email_idx', type: 'unique', attributes: ['email'] },
          { key: 'role_idx', type: 'key', attributes: ['role'] },
        ],
      },
      {
        id: 'documents',
        name: 'Documents',
        permissions: ['read("any")', 'write("any")'],
        attributes: [
          { type: 'string', key: 'title', size: 200, required: true },
          { type: 'string', key: 'content', size: 50000 },
          { type: 'string', key: 'type', size: 50, required: true },
          { type: 'string', key: 'ownerId', size: 50, required: true },
          { type: 'string', key: 'tags', array: true },
          { type: 'boolean', key: 'isPublic', defaultValue: false },
          { type: 'integer', key: 'version', defaultValue: 1 },
          { type: 'datetime', key: 'createdAt', required: true },
          { type: 'datetime', key: 'updatedAt' },
        ],
        indexes: [
          { key: 'owner_idx', type: 'key', attributes: ['ownerId'] },
          { key: 'type_idx', type: 'key', attributes: ['type'] },
          { key: 'public_idx', type: 'key', attributes: ['isPublic'] },
        ],
      },
    ],
    buckets: [
      {
        id: 'documents',
        name: 'Document Files',
        permissions: ['read("any")', 'write("any")'],
      },
    ],
  },
};

async function migrateDatabase(dbName, dbConfig) {
  console.log(`\n🚀 Starting migration for ${dbName}...`);
  
  const migrator = new AppwriteMigrator(
    config.databases[dbName].projectId,
    config.databases[dbName].databaseId
  );

  try {
    // Ensure database exists
    await migrator.ensureDatabase();
    
    // Create collections
    for (const collection of dbConfig.collections) {
      await migrator.createCollection(
        collection.id,
        collection.name,
        collection.permissions,
        collection.attributes,
        collection.indexes
      );
      await migrator.wait(2000); // Rate limiting
    }

    // Create storage buckets
    for (const bucket of dbConfig.buckets || []) {
      await migrator.createStorageBucket(
        bucket.id,
        bucket.name,
        bucket.permissions
      );
      await migrator.wait(1000);
    }

    console.log(`✅ ${dbName} migration completed successfully!`);
    return true;
    
  } catch (error) {
    console.error(`❌ Migration failed for ${dbName}:`, error);
    return false;
  }
}

async function main() {
  if (!config.apiKey) {
    console.error('❌ APPWRITE_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🔧 Starting Appwrite Database Integration...');
  console.log('📋 Migration will create/update:');
  
  Object.keys(schemas).forEach(dbName => {
    const schema = schemas[dbName];
    console.log(`  ${dbName}:`);
    console.log(`    Collections: ${schema.collections.length}`);
    console.log(`    Storage Buckets: ${(schema.buckets || []).length}`);
  });

  const results = {};
  
  // Run migrations for each database
  for (const [dbName, schema] of Object.entries(schemas)) {
    results[dbName] = await migrateDatabase(dbName, schema);
    
    // Wait between databases to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Summary
  console.log('\n📊 Migration Summary:');
  Object.entries(results).forEach(([dbName, success]) => {
    console.log(`  ${dbName}: ${success ? '✅ Success' : '❌ Failed'}`);
  });

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎉 Completed: ${successCount}/${totalCount} databases migrated successfully`);
  
  if (successCount === totalCount) {
    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } else {
    console.log('⚠️ Some migrations failed. Check logs above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AppwriteMigrator, schemas, config };