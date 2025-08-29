/**
 * Setup Trading Post Collections
 * Run this with: node setup-collections.js
 */

const sdk = require('node-appwrite');

// Configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const DATABASE_ID = 'trading_post_db';

// You need to set this as an environment variable or replace it here
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE';

if (APPWRITE_API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('❌ Please set your Appwrite API key in the script or as APPWRITE_API_KEY environment variable');
  console.log('Get your API key from: https://cloud.appwrite.io/project/' + APPWRITE_PROJECT_ID + '/settings/api');
  process.exit(1);
}

// Initialize SDK
const client = new sdk.Client();
const databases = new sdk.Databases(client);

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

// Collection schemas
const COLLECTIONS = {
  items: {
    name: 'Items',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 5000, required: false },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'condition', type: 'string', size: 50, required: true },
      { key: 'price', type: 'double', required: false, min: 0, max: 1000000 },
      { key: 'estimated_value', type: 'double', required: false, min: 0, max: 1000000 },
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'status', type: 'string', size: 50, required: false, default: 'active' },
      { key: 'images', type: 'string', size: 5000, required: false, array: false },
      { key: 'primary_image_url', type: 'string', size: 500, required: false },
      { key: 'city', type: 'string', size: 100, required: false },
      { key: 'state', type: 'string', size: 50, required: false },
      { key: 'zipcode', type: 'string', size: 20, required: false },
      { key: 'views', type: 'integer', required: false, min: 0, default: 0 },
      { key: 'likes', type: 'integer', required: false, min: 0, default: 0 },
      { key: 'ai_tags', type: 'string', size: 2000, required: false },
      { key: 'ai_analysis', type: 'string', size: 5000, required: false },
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
      { key: 'rating', type: 'double', required: false, min: 0, max: 5, default: 0 },
      { key: 'totalTrades', type: 'integer', required: false, min: 0, default: 0 },
      { key: 'verifiedSeller', type: 'boolean', required: false, default: false },
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
      { key: 'status', type: 'string', size: 50, required: false, default: 'active' },
    ]
  }
};

async function createAttribute(collectionId, attr) {
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
    }
    
    console.log(`  ✅ Created attribute: ${attr.key}`);
  } catch (error) {
    if (error.code === 409) {
      console.log(`  ⚠️ Attribute ${attr.key} already exists`);
    } else {
      console.error(`  ❌ Failed to create attribute ${attr.key}:`, error.message);
    }
  }
}

async function createCollection(collectionId, schema) {
  console.log(`\n📦 Processing collection: ${collectionId}`);
  
  try {
    // Check if collection exists
    try {
      const collection = await databases.getCollection(DATABASE_ID, collectionId);
      console.log(`✅ Collection exists: ${collection.name}`);
      
      // Still try to add missing attributes
      console.log('  Checking for missing attributes...');
      for (const attr of schema.attributes) {
        await createAttribute(collectionId, attr);
      }
      
    } catch (error) {
      if (error.code === 404) {
        // Create collection
        console.log(`Creating collection: ${collectionId}`);
        const collection = await databases.createCollection(
          DATABASE_ID,
          collectionId,
          schema.name,
          [
            sdk.Permission.read(sdk.Role.any()),
            sdk.Permission.create(sdk.Role.users()),
            sdk.Permission.update(sdk.Role.users()),
            sdk.Permission.delete(sdk.Role.users())
          ]
        );
        console.log(`✅ Collection created: ${collection.name}`);
        
        // Add attributes
        for (const attr of schema.attributes) {
          await createAttribute(collectionId, attr);
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error(`❌ Error with collection ${collectionId}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Trading Post Collections Setup');
  console.log('📍 Endpoint:', APPWRITE_ENDPOINT);
  console.log('📍 Project:', APPWRITE_PROJECT_ID);
  console.log('📍 Database:', DATABASE_ID);
  console.log('');
  
  try {
    // Check database exists
    try {
      const db = await databases.get(DATABASE_ID);
      console.log(`✅ Database exists: ${db.name}\n`);
    } catch (error) {
      if (error.code === 404) {
        console.log('Creating database...');
        const db = await databases.create(DATABASE_ID, 'Trading Post Database');
        console.log(`✅ Database created: ${db.name}\n`);
      } else {
        throw error;
      }
    }
    
    // Create collections
    for (const [collectionId, schema] of Object.entries(COLLECTIONS)) {
      await createCollection(collectionId, schema);
    }
    
    console.log('\n✅ Setup completed successfully!');
    console.log('Your Trading Post database is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main();