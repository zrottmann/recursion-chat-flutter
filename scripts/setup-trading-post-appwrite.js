#!/usr/bin/env node

const { Client, Databases, Storage } = require('node-appwrite');

// Recursion App AppWrite Configuration
const config = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '689bdaf500072795b0f6',
    apiKey: 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc',
    databaseId: 'recursion_chat_db'
};

async function setupAppwrite() {
    console.log('🔧 Setting up Trading Post collections in Recursion AppWrite...');
    
    const client = new Client();
    client
        .setEndpoint(config.endpoint)
        .setProject(config.projectId)
        .setKey(config.apiKey);
        
    const databases = new Databases(client);
    const storage = new Storage(client);
    
    try {
        // Create Trading Post collections
        const collections = [
            {
                id: 'trading_post_users',
                name: 'Trading Post Users'
            },
            {
                id: 'trading_post_items', 
                name: 'Trading Post Items'
            },
            {
                id: 'trading_post_trades',
                name: 'Trading Post Trades'
            },
            {
                id: 'trading_post_messages',
                name: 'Trading Post Messages'
            },
            {
                id: 'trading_post_reviews',
                name: 'Trading Post Reviews'
            }
        ];
        
        for (const collection of collections) {
            try {
                console.log(`Creating collection: ${collection.name}`);
                await databases.createCollection(
                    config.databaseId,
                    collection.id,
                    collection.name
                );
                console.log(`✅ Created: ${collection.name}`);
            } catch (error) {
                if (error.code === 409) {
                    console.log(`⚠️  Collection ${collection.name} already exists`);
                } else {
                    console.error(`❌ Error creating ${collection.name}:`, error.message);
                }
            }
        }
        
        // Create storage buckets
        const buckets = [
            {
                id: 'trading_post_item_images',
                name: 'Trading Post Item Images'
            },
            {
                id: 'trading_post_profile_images', 
                name: 'Trading Post Profile Images'
            }
        ];
        
        for (const bucket of buckets) {
            try {
                console.log(`Creating bucket: ${bucket.name}`);
                await storage.createBucket(
                    bucket.id,
                    bucket.name
                );
                console.log(`✅ Created: ${bucket.name}`);
            } catch (error) {
                if (error.code === 409) {
                    console.log(`⚠️  Bucket ${bucket.name} already exists`);
                } else {
                    console.error(`❌ Error creating ${bucket.name}:`, error.message);
                }
            }
        }
        
        console.log('🎉 Trading Post AppWrite setup completed!');
        console.log(`Using shared database: ${config.databaseId}`);
        console.log('Ready for deployment to Digital Ocean!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    setupAppwrite();
}

module.exports = setupAppwrite;
