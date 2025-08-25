/**
 * Complete Trading Post Setup Script
 * Sets up all collections, indexes, and sample data
 */

const { Client, Databases, Storage, Teams, Users, ID, Permission, Role } = require('appwrite');

// Configuration
const config = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '689bdee000098bd9d55c',
  apiKey: process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE',
  databaseId: 'trading_post_db'
};

// Initialize Appwrite
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

// Collection schemas
const collections = {
  users: {
    name: 'Users',
    id: 'users',
    attributes: [
      { key: 'email', type: 'email', required: true },
      { key: 'name', type: 'string', size: 100, required: true },
      { key: 'bio', type: 'string', size: 500, required: false },
      { key: 'location', type: 'string', size: 100, required: false },
      { key: 'avatar', type: 'string', size: 255, required: false },
      { key: 'rating', type: 'double', required: false, default: 0 },
      { key: 'totalReviews', type: 'integer', required: false, default: 0 },
      { key: 'totalTrades', type: 'integer', required: false, default: 0 },
      { key: 'joinedDate', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'email_idx', type: 'unique', attributes: ['email'] },
      { key: 'location_idx', type: 'key', attributes: ['location'] },
      { key: 'rating_idx', type: 'key', attributes: ['rating'] }
    ]
  },
  
  items: {
    name: 'Items',
    id: 'items',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'title', type: 'string', size: 200, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'category', type: 'string', size: 50, required: true },
      { key: 'condition', type: 'string', size: 20, required: true },
      { key: 'images', type: 'string', size: 2000, required: false, array: true },
      { key: 'location', type: 'string', size: 100, required: true },
      { key: 'latitude', type: 'double', required: false },
      { key: 'longitude', type: 'double', required: false },
      { key: 'status', type: 'string', size: 20, required: true, default: 'available' },
      { key: 'views', type: 'integer', required: false, default: 0 },
      { key: 'saves', type: 'integer', required: false, default: 0 },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['userId'] },
      { key: 'category_idx', type: 'key', attributes: ['category'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'location_idx', type: 'key', attributes: ['location'] },
      { key: 'created_idx', type: 'key', attributes: ['createdAt'] }
    ]
  },
  
  trades: {
    name: 'Trades',
    id: 'trades',
    attributes: [
      { key: 'initiatorId', type: 'string', size: 36, required: true },
      { key: 'recipientId', type: 'string', size: 36, required: true },
      { key: 'offeredItems', type: 'string', size: 1000, required: true, array: true },
      { key: 'requestedItems', type: 'string', size: 1000, required: true, array: true },
      { key: 'status', type: 'string', size: 20, required: true, default: 'pending' },
      { key: 'message', type: 'string', size: 500, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: false },
      { key: 'completedAt', type: 'datetime', required: false }
    ],
    indexes: [
      { key: 'initiator_idx', type: 'key', attributes: ['initiatorId'] },
      { key: 'recipient_idx', type: 'key', attributes: ['recipientId'] },
      { key: 'status_idx', type: 'key', attributes: ['status'] },
      { key: 'created_idx', type: 'key', attributes: ['createdAt'] }
    ]
  },
  
  messages: {
    name: 'Messages',
    id: 'messages',
    attributes: [
      { key: 'senderId', type: 'string', size: 36, required: true },
      { key: 'recipientId', type: 'string', size: 36, required: true },
      { key: 'conversationId', type: 'string', size: 100, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'attachments', type: 'string', size: 2000, required: false, array: true },
      { key: 'read', type: 'boolean', required: true, default: false },
      { key: 'timestamp', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'conversation_idx', type: 'key', attributes: ['conversationId'] },
      { key: 'sender_idx', type: 'key', attributes: ['senderId'] },
      { key: 'recipient_idx', type: 'key', attributes: ['recipientId'] },
      { key: 'read_idx', type: 'key', attributes: ['read'] },
      { key: 'timestamp_idx', type: 'key', attributes: ['timestamp'] }
    ]
  },
  
  reviews: {
    name: 'Reviews',
    id: 'reviews',
    attributes: [
      { key: 'reviewerId', type: 'string', size: 36, required: true },
      { key: 'reviewedId', type: 'string', size: 36, required: true },
      { key: 'tradeId', type: 'string', size: 36, required: false },
      { key: 'rating', type: 'integer', min: 1, max: 5, required: true },
      { key: 'comment', type: 'string', size: 500, required: false },
      { key: 'createdAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'reviewer_idx', type: 'key', attributes: ['reviewerId'] },
      { key: 'reviewed_idx', type: 'key', attributes: ['reviewedId'] },
      { key: 'trade_idx', type: 'key', attributes: ['tradeId'] },
      { key: 'rating_idx', type: 'key', attributes: ['rating'] }
    ]
  },
  
  notifications: {
    name: 'Notifications',
    id: 'notifications',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 200, required: true },
      { key: 'message', type: 'string', size: 500, required: true },
      { key: 'data', type: 'string', size: 1000, required: false },
      { key: 'read', type: 'boolean', required: true, default: false },
      { key: 'createdAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['userId'] },
      { key: 'type_idx', type: 'key', attributes: ['type'] },
      { key: 'read_idx', type: 'key', attributes: ['read'] },
      { key: 'created_idx', type: 'key', attributes: ['createdAt'] }
    ]
  },
  
  savedItems: {
    name: 'Saved Items',
    id: 'savedItems',
    attributes: [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'itemId', type: 'string', size: 36, required: true },
      { key: 'savedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'user_idx', type: 'key', attributes: ['userId'] },
      { key: 'item_idx', type: 'key', attributes: ['itemId'] },
      { key: 'user_item_idx', type: 'unique', attributes: ['userId', 'itemId'] }
    ]
  }
};

// Storage buckets
const buckets = [
  {
    id: 'item_images',
    name: 'Item Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('owner'))),
      Permission.delete(Role.user(ID.custom('owner')))
    ],
    fileSizeLimit: 10485760, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  {
    id: 'profile_images',
    name: 'Profile Images',
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('owner'))),
      Permission.delete(Role.user(ID.custom('owner')))
    ],
    fileSizeLimit: 5242880, // 5MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  },
  {
    id: 'chat_attachments',
    name: 'Chat Attachments',
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('owner'))),
      Permission.delete(Role.user(ID.custom('owner')))
    ],
    fileSizeLimit: 10485760, // 10MB
    allowedFileExtensions: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
  }
];

// Setup functions
async function createDatabase() {
  try {
    console.log('📊 Creating database...');
    await databases.create(config.databaseId, 'Trading Post Database');
    console.log('✅ Database created');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Database already exists');
    } else {
      console.error('❌ Error creating database:', error);
    }
  }
}

async function createCollection(collectionConfig) {
  try {
    console.log(`📁 Creating collection: ${collectionConfig.name}...`);
    
    // Create collection
    await databases.createCollection(
      config.databaseId,
      collectionConfig.id,
      collectionConfig.name,
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.user(ID.custom('$id'))),
        Permission.delete(Role.user(ID.custom('$id')))
      ]
    );
    
    // Add attributes
    for (const attr of collectionConfig.attributes) {
      await createAttribute(collectionConfig.id, attr);
    }
    
    // Add indexes
    for (const index of collectionConfig.indexes) {
      await createIndex(collectionConfig.id, index);
    }
    
    console.log(`✅ Collection ${collectionConfig.name} created`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️ Collection ${collectionConfig.name} already exists`);
    } else {
      console.error(`❌ Error creating collection ${collectionConfig.name}:`, error);
    }
  }
}

async function createAttribute(collectionId, attr) {
  try {
    switch (attr.type) {
      case 'string':
        await databases.createStringAttribute(
          config.databaseId,
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
          config.databaseId,
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
        await databases.createFloatAttribute(
          config.databaseId,
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
          config.databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array
        );
        break;
      case 'datetime':
        await databases.createDatetimeAttribute(
          config.databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array
        );
        break;
      case 'email':
        await databases.createEmailAttribute(
          config.databaseId,
          collectionId,
          attr.key,
          attr.required,
          attr.default,
          attr.array
        );
        break;
    }
    console.log(`  ✓ Attribute ${attr.key} created`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ℹ️ Attribute ${attr.key} already exists`);
    } else {
      console.error(`  ❌ Error creating attribute ${attr.key}:`, error.message);
    }
  }
}

async function createIndex(collectionId, index) {
  try {
    await databases.createIndex(
      config.databaseId,
      collectionId,
      index.key,
      index.type,
      index.attributes
    );
    console.log(`  ✓ Index ${index.key} created`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ℹ️ Index ${index.key} already exists`);
    } else {
      console.error(`  ❌ Error creating index ${index.key}:`, error.message);
    }
  }
}

async function createBucket(bucketConfig) {
  try {
    console.log(`🗂️ Creating storage bucket: ${bucketConfig.name}...`);
    await storage.createBucket(
      bucketConfig.id,
      bucketConfig.name,
      bucketConfig.permissions,
      false, // No antivirus
      true, // Encryption
      bucketConfig.fileSizeLimit,
      bucketConfig.allowedFileExtensions
    );
    console.log(`✅ Bucket ${bucketConfig.name} created`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`ℹ️ Bucket ${bucketConfig.name} already exists`);
    } else {
      console.error(`❌ Error creating bucket ${bucketConfig.name}:`, error);
    }
  }
}

// Main setup function
async function setupTradingPost() {
  console.log('🚀 Setting up Trading Post...');
  console.log('================================');
  
  // Create database
  await createDatabase();
  
  // Create collections
  for (const collection of Object.values(collections)) {
    await createCollection(collection);
  }
  
  // Create storage buckets
  for (const bucket of buckets) {
    await createBucket(bucket);
  }
  
  console.log('================================');
  console.log('✅ Trading Post setup complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Test OAuth login at https://tradingpost.appwrite.network');
  console.log('2. Create some sample listings');
  console.log('3. Test messaging between users');
  console.log('4. Enable real-time subscriptions');
}

// Run setup
setupTradingPost().catch(console.error);