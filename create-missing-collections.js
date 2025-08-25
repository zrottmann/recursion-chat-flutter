/**
 * Create Missing Collections in Trading Post Database
 * This script creates the matches and saved_items collections that are missing
 * and causing database errors throughout the application.
 */

const { Client, Databases, Permission, Role, ID } = require('node-appwrite');

// Appwrite Configuration
const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const databases = new Databases(client);
const DATABASE_ID = 'trading_post_db';

// Collection Schemas
const COLLECTIONS_TO_CREATE = {
  matches: {
    id: 'matches',
    name: 'AI Matches',
    documentSecurity: true,
    permissions: [
      Permission.read(Role.any()),
      Permission.write(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'itemId', type: 'string', size: 255, required: true },
      { key: 'matchedUserId', type: 'string', size: 255, required: true },
      { key: 'matchedItemId', type: 'string', size: 255, required: true },
      { key: 'matchScore', type: 'double', required: true },
      { key: 'matchType', type: 'string', size: 50, required: true }, // 'direct', 'ai_generated', 'semantic'
      { key: 'status', type: 'string', size: 20, required: true }, // 'pending', 'accepted', 'declined'
      { key: 'reason', type: 'string', size: 500, required: false },
      { key: 'metadata', type: 'string', size: 2000, required: false }, // JSON metadata
      { key: 'expiresAt', type: 'datetime', required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'updatedAt', type: 'datetime', required: true }
    ],
    indexes: [
      { key: 'user_matches_idx', type: 'key', attributes: ['userId'] },
      { key: 'status_matches_idx', type: 'key', attributes: ['status'] },
      { key: 'score_matches_idx', type: 'key', attributes: ['matchScore'] },
      { key: 'type_matches_idx', type: 'key', attributes: ['matchType'] },
      { key: 'expires_matches_idx', type: 'key', attributes: ['expiresAt'] }
    ]
  },
  
  saved_items: {
    id: 'saved_items',
    name: 'Saved Items',
    documentSecurity: true,
    permissions: [
      Permission.read(Role.any()),
      Permission.write(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ],
    attributes: [
      { key: 'userId', type: 'string', size: 255, required: true },
      { key: 'itemId', type: 'string', size: 255, required: true },
      { key: 'itemOwnerId', type: 'string', size: 255, required: true },
      { key: 'savedAt', type: 'datetime', required: true },
      { key: 'notes', type: 'string', size: 1000, required: false },
      { key: 'priority', type: 'integer', required: false }, // 1-5 priority level
      { key: 'tags', type: 'string', size: 500, required: false }, // comma-separated tags
      { key: 'isActive', type: 'boolean', required: true } // for soft delete
    ],
    indexes: [
      { key: 'user_saved_idx', type: 'key', attributes: ['userId'] },
      { key: 'item_saved_idx', type: 'key', attributes: ['itemId'] },
      { key: 'owner_saved_idx', type: 'key', attributes: ['itemOwnerId'] },
      { key: 'date_saved_idx', type: 'key', attributes: ['savedAt'] },
      { key: 'active_saved_idx', type: 'key', attributes: ['isActive'] },
      { key: 'priority_saved_idx', type: 'key', attributes: ['priority'] }
    ]
  }
};

async function createCollection(collectionConfig) {
  try {
    console.log(`\n🔧 Creating collection: ${collectionConfig.name} (${collectionConfig.id})`);
    
    // Check if collection already exists
    try {
      const existing = await databases.getCollection(DATABASE_ID, collectionConfig.id);
      console.log(`✅ Collection ${collectionConfig.id} already exists`);
      return existing;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
      // Collection doesn't exist, create it
    }
    
    // Create the collection
    const collection = await databases.createCollection(
      DATABASE_ID,
      collectionConfig.id,
      collectionConfig.name,
      collectionConfig.permissions,
      collectionConfig.documentSecurity
    );
    
    console.log(`✅ Collection created: ${collection.name}`);
    
    // Create attributes
    console.log(`📝 Creating attributes for ${collectionConfig.id}...`);
    for (const attr of collectionConfig.attributes) {
      try {
        let attribute;
        
        switch (attr.type) {
          case 'string':
            attribute = await databases.createStringAttribute(
              DATABASE_ID,
              collectionConfig.id,
              attr.key,
              attr.size,
              attr.required,
              attr.default,
              attr.array || false
            );
            break;
            
          case 'integer':
            attribute = await databases.createIntegerAttribute(
              DATABASE_ID,
              collectionConfig.id,
              attr.key,
              attr.required,
              attr.min,
              attr.max,
              attr.default,
              attr.array || false
            );
            break;
            
          case 'double':
            attribute = await databases.createFloatAttribute(
              DATABASE_ID,
              collectionConfig.id,
              attr.key,
              attr.required,
              attr.min,
              attr.max,
              attr.default,
              attr.array || false
            );
            break;
            
          case 'boolean':
            attribute = await databases.createBooleanAttribute(
              DATABASE_ID,
              collectionConfig.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array || false
            );
            break;
            
          case 'datetime':
            attribute = await databases.createDatetimeAttribute(
              DATABASE_ID,
              collectionConfig.id,
              attr.key,
              attr.required,
              attr.default,
              attr.array || false
            );
            break;
        }
        
        console.log(`  ✅ Created attribute: ${attr.key} (${attr.type})`);
        
        // Wait a bit between attribute creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ⚠️  Attribute ${attr.key} might already exist: ${error.message}`);
      }
    }
    
    // Wait for attributes to be ready
    console.log(`⏳ Waiting for attributes to be ready...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Create indexes
    console.log(`📊 Creating indexes for ${collectionConfig.id}...`);
    for (const index of collectionConfig.indexes) {
      try {
        const createdIndex = await databases.createIndex(
          DATABASE_ID,
          collectionConfig.id,
          index.key,
          index.type,
          index.attributes,
          index.orders || []
        );
        console.log(`  ✅ Created index: ${index.key}`);
        
        // Wait a bit between index creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ⚠️  Index ${index.key} might already exist: ${error.message}`);
      }
    }
    
    return collection;
    
  } catch (error) {
    console.error(`❌ Failed to create collection ${collectionConfig.id}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Creating missing collections in Trading Post database...');
    console.log(`📁 Database: ${DATABASE_ID}`);
    console.log(`🔗 Endpoint: https://nyc.cloud.appwrite.io/v1`);
    console.log(`📊 Project: 689bdee000098bd9d55c`);
    
    // Verify database exists
    try {
      const database = await databases.get(DATABASE_ID);
      console.log(`✅ Database found: ${database.name}`);
    } catch (error) {
      console.error(`❌ Database ${DATABASE_ID} not found:`, error.message);
      return;
    }
    
    const results = {};
    
    // Create each collection
    for (const [collectionKey, config] of Object.entries(COLLECTIONS_TO_CREATE)) {
      try {
        console.log(`\n${'='.repeat(50)}`);
        results[collectionKey] = await createCollection(config);
        console.log(`✅ Collection ${collectionKey} ready!`);
      } catch (error) {
        console.error(`❌ Failed to create ${collectionKey}:`, error);
        results[collectionKey] = { error: error.message };
      }
    }
    
    // Summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📋 CREATION SUMMARY:');
    console.log(`${'='.repeat(50)}`);
    
    for (const [key, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`❌ ${key}: ${result.error}`);
      } else {
        console.log(`✅ ${key}: Created successfully`);
      }
    }
    
    console.log(`\n🎉 Collection creation process completed!`);
    console.log(`💡 The application should now work without "Collection not found" errors.`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createCollection, COLLECTIONS_TO_CREATE };