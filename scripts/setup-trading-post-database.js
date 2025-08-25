#!/usr/bin/env node

/**
 * Trading Post Database Setup Script for Appwrite
 * Creates all necessary collections with proper schemas and attributes
 */

const { Client, Databases, Storage, Permission, Role, ID } = require('node-appwrite');

// Trading Post AppWrite Configuration 
const config = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '689bdee000098bd9d55c', // Trading Post Project ID
    apiKey: process.env.APPWRITE_API_KEY || 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc',
    databaseId: 'trading_post_db'
};

async function setupDatabase() {
    console.log('🔧 Setting up Trading Post database in Appwrite...');
    
    const client = new Client();
    client
        .setEndpoint(config.endpoint)
        .setProject(config.projectId)
        .setKey(config.apiKey);
        
    const databases = new Databases(client);
    const storage = new Storage(client);
    
    try {
        // Check if database exists by trying to list collections
        try {
            const existingCollections = await databases.listCollections(config.databaseId);
            console.log(`📊 Database exists with ${existingCollections.total} collections`);
        } catch (error) {
            if (error.code === 404) {
                console.log('❌ Database does not exist. Please create it in Appwrite Console first.');
                console.log('   Database ID:', config.databaseId);
                return;
            } else {
                throw error;
            }
        }

        // Define collections with their attributes
        const collections = [
            {
                id: 'users',
                name: 'Users',
                attributes: [
                    { key: 'name', type: 'string', size: 255, required: true },
                    { key: 'email', type: 'email', required: true },
                    { key: 'username', type: 'string', size: 50, required: true },
                    { key: 'zipcode', type: 'string', size: 10, required: false },
                    { key: 'latitude', type: 'float', required: false },
                    { key: 'longitude', type: 'float', required: false },
                    { key: 'city', type: 'string', size: 100, required: false },
                    { key: 'state', type: 'string', size: 50, required: false },
                    { key: 'opt_in_location', type: 'boolean', required: false, default: true },
                    { key: 'opt_in_ai', type: 'boolean', required: false, default: true },
                    { key: 'email_verified', type: 'boolean', required: false, default: false },
                    { key: 'is_active', type: 'boolean', required: false, default: true },
                    { key: 'membership_tier', type: 'string', size: 20, required: false, default: 'free' },
                    { key: 'profile_image_url', type: 'string', size: 500, required: false },
                    { key: 'bio', type: 'string', size: 1000, required: false },
                    { key: 'rating_average', type: 'float', required: false, default: 0 },
                    { key: 'rating_count', type: 'integer', required: false, default: 0 },
                    { key: 'trades_completed', type: 'integer', required: false, default: 0 },
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'items',
                name: 'Items',
                attributes: [
                    { key: 'user_id', type: 'string', size: 36, required: true },
                    { key: 'title', type: 'string', size: 255, required: true },
                    { key: 'description', type: 'string', size: 5000, required: false },
                    { key: 'category', type: 'string', size: 100, required: true },
                    { key: 'condition', type: 'string', size: 50, required: true },
                    { key: 'estimated_value', type: 'float', required: false },
                    { key: 'ai_estimated_value', type: 'float', required: false },
                    { key: 'trade_preferences', type: 'string', size: 1000, required: false },
                    { key: 'location_lat', type: 'float', required: false },
                    { key: 'location_lng', type: 'float', required: false },
                    { key: 'city', type: 'string', size: 100, required: false },
                    { key: 'state', type: 'string', size: 50, required: false },
                    { key: 'zipcode', type: 'string', size: 10, required: false },
                    { key: 'images', type: 'string', size: 5000, required: false }, // JSON array of image URLs
                    { key: 'primary_image_url', type: 'string', size: 500, required: false },
                    { key: 'is_available', type: 'boolean', required: false, default: true },
                    { key: 'is_featured', type: 'boolean', required: false, default: false },
                    { key: 'views', type: 'integer', required: false, default: 0 },
                    { key: 'likes', type: 'integer', required: false, default: 0 },
                    { key: 'ai_tags', type: 'string', size: 1000, required: false }, // JSON array
                    { key: 'ai_analysis', type: 'string', size: 5000, required: false }, // JSON object
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'wants',
                name: 'Wants',
                attributes: [
                    { key: 'user_id', type: 'string', size: 36, required: true },
                    { key: 'title', type: 'string', size: 255, required: true },
                    { key: 'description', type: 'string', size: 2000, required: false },
                    { key: 'category', type: 'string', size: 100, required: true },
                    { key: 'priority', type: 'string', size: 20, required: false, default: 'medium' },
                    { key: 'min_condition', type: 'string', size: 50, required: false },
                    { key: 'max_value', type: 'float', required: false },
                    { key: 'is_active', type: 'boolean', required: false, default: true },
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'trades',
                name: 'Trades',
                attributes: [
                    { key: 'initiator_id', type: 'string', size: 36, required: true },
                    { key: 'recipient_id', type: 'string', size: 36, required: true },
                    { key: 'initiator_items', type: 'string', size: 1000, required: true }, // JSON array of item IDs
                    { key: 'recipient_items', type: 'string', size: 1000, required: true }, // JSON array of item IDs
                    { key: 'status', type: 'string', size: 50, required: true }, // pending, accepted, declined, completed, cancelled
                    { key: 'message', type: 'string', size: 2000, required: false },
                    { key: 'counter_offer', type: 'string', size: 2000, required: false }, // JSON object
                    { key: 'meeting_location', type: 'string', size: 500, required: false },
                    { key: 'meeting_datetime', type: 'datetime', required: false },
                    { key: 'completed_at', type: 'datetime', required: false },
                    { key: 'cancelled_at', type: 'datetime', required: false },
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'messages',
                name: 'Messages',
                attributes: [
                    { key: 'sender_id', type: 'string', size: 36, required: true },
                    { key: 'recipient_id', type: 'string', size: 36, required: true },
                    { key: 'trade_id', type: 'string', size: 36, required: false },
                    { key: 'item_id', type: 'string', size: 36, required: false },
                    { key: 'content', type: 'string', size: 5000, required: true },
                    { key: 'is_read', type: 'boolean', required: false, default: false },
                    { key: 'read_at', type: 'datetime', required: false },
                    { key: 'created_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'matches',
                name: 'AI Matches',
                attributes: [
                    { key: 'user_id', type: 'string', size: 36, required: true },
                    { key: 'item_id', type: 'string', size: 36, required: true },
                    { key: 'matched_item_id', type: 'string', size: 36, required: true },
                    { key: 'matched_user_id', type: 'string', size: 36, required: true },
                    { key: 'match_score', type: 'float', required: true },
                    { key: 'match_reason', type: 'string', size: 2000, required: false },
                    { key: 'status', type: 'string', size: 50, required: true }, // pending, viewed, accepted, declined
                    { key: 'user_feedback', type: 'string', size: 50, required: false }, // helpful, not_helpful
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'reviews',
                name: 'Reviews',
                attributes: [
                    { key: 'reviewer_id', type: 'string', size: 36, required: true },
                    { key: 'reviewed_user_id', type: 'string', size: 36, required: true },
                    { key: 'trade_id', type: 'string', size: 36, required: false },
                    { key: 'rating', type: 'integer', required: true }, // 1-5
                    { key: 'comment', type: 'string', size: 2000, required: false },
                    { key: 'is_verified_trade', type: 'boolean', required: false, default: false },
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'saved_items',
                name: 'Saved Items',
                attributes: [
                    { key: 'user_id', type: 'string', size: 36, required: true },
                    { key: 'item_id', type: 'string', size: 36, required: true },
                    { key: 'created_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'notifications',
                name: 'Notifications',
                attributes: [
                    { key: 'user_id', type: 'string', size: 36, required: true },
                    { key: 'type', type: 'string', size: 50, required: true },
                    { key: 'title', type: 'string', size: 255, required: true },
                    { key: 'message', type: 'string', size: 1000, required: true },
                    { key: 'data', type: 'string', size: 2000, required: false }, // JSON object with additional data
                    { key: 'is_read', type: 'boolean', required: false, default: false },
                    { key: 'read_at', type: 'datetime', required: false },
                    { key: 'created_at', type: 'datetime', required: true }
                ]
            },
            {
                id: 'memberships',
                name: 'Memberships',
                attributes: [
                    { key: 'user_id', type: 'string', size: 36, required: true },
                    { key: 'tier', type: 'string', size: 20, required: true }, // free, basic, premium
                    { key: 'stripe_customer_id', type: 'string', size: 100, required: false },
                    { key: 'stripe_subscription_id', type: 'string', size: 100, required: false },
                    { key: 'features', type: 'string', size: 2000, required: false }, // JSON object
                    { key: 'limits', type: 'string', size: 2000, required: false }, // JSON object
                    { key: 'valid_until', type: 'datetime', required: false },
                    { key: 'is_active', type: 'boolean', required: false, default: true },
                    { key: 'created_at', type: 'datetime', required: true },
                    { key: 'updated_at', type: 'datetime', required: true }
                ]
            }
        ];

        // Create collections and attributes
        for (const collection of collections) {
            try {
                console.log(`\n📦 Creating collection: ${collection.name}`);
                
                // Create collection
                await databases.createCollection(
                    config.databaseId,
                    collection.id,
                    collection.name,
                    [
                        Permission.read(Role.any()),
                        Permission.create(Role.users()),
                        Permission.update(Role.users()),
                        Permission.delete(Role.users())
                    ]
                );
                console.log(`✅ Created collection: ${collection.name}`);
                
                // Create attributes
                for (const attr of collection.attributes) {
                    try {
                        console.log(`  - Creating attribute: ${attr.key}`);
                        
                        switch(attr.type) {
                            case 'string':
                                await databases.createStringAttribute(
                                    config.databaseId,
                                    collection.id,
                                    attr.key,
                                    attr.size,
                                    attr.required,
                                    attr.default || null,
                                    false
                                );
                                break;
                            case 'integer':
                                await databases.createIntegerAttribute(
                                    config.databaseId,
                                    collection.id,
                                    attr.key,
                                    attr.required,
                                    null,
                                    null,
                                    attr.default || null,
                                    false
                                );
                                break;
                            case 'float':
                                await databases.createFloatAttribute(
                                    config.databaseId,
                                    collection.id,
                                    attr.key,
                                    attr.required,
                                    null,
                                    null,
                                    attr.default || null,
                                    false
                                );
                                break;
                            case 'boolean':
                                await databases.createBooleanAttribute(
                                    config.databaseId,
                                    collection.id,
                                    attr.key,
                                    attr.required,
                                    attr.default || null,
                                    false
                                );
                                break;
                            case 'datetime':
                                await databases.createDatetimeAttribute(
                                    config.databaseId,
                                    collection.id,
                                    attr.key,
                                    attr.required,
                                    null,
                                    false
                                );
                                break;
                            case 'email':
                                await databases.createEmailAttribute(
                                    config.databaseId,
                                    collection.id,
                                    attr.key,
                                    attr.required,
                                    null,
                                    false
                                );
                                break;
                        }
                        
                        console.log(`    ✅ ${attr.key}`);
                    } catch (error) {
                        if (error.code === 409) {
                            console.log(`    ⚠️  ${attr.key} already exists`);
                        } else {
                            console.error(`    ❌ Error creating ${attr.key}:`, error.message);
                        }
                    }
                }
                
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
                id: 'item_images',
                name: 'Item Images',
                permissions: [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            },
            {
                id: 'profile_images',
                name: 'Profile Images',
                permissions: [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users())
                ]
            }
        ];

        console.log('\n📁 Creating storage buckets...');
        for (const bucket of buckets) {
            try {
                await storage.createBucket(
                    bucket.id,
                    bucket.name,
                    bucket.permissions,
                    false, // fileSecurity
                    true, // enabled
                    10485760, // 10MB max file size
                    ['jpg', 'jpeg', 'png', 'gif', 'webp'], // allowed extensions
                    'none', // compression
                    false, // encryption
                    false // antivirus
                );
                console.log(`✅ Created bucket: ${bucket.name}`);
            } catch (error) {
                if (error.code === 409) {
                    console.log(`⚠️  Bucket ${bucket.name} already exists`);
                } else {
                    console.error(`❌ Error creating ${bucket.name}:`, error.message);
                }
            }
        }

        console.log('\n🎉 Trading Post database setup completed!');
        console.log('Database ID:', config.databaseId);
        console.log('Project ID:', config.projectId);
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;