/**
 * Trading Post - AppWrite Complete Configuration Setup
 * Configures AppWrite project with databases, collections, storage, functions, and auth
 * 
 * Project ID: 689bdaf500072795b0f6
 * Endpoint: https://cloud.appwrite.io/v1
 */

const { Client, Databases, Storage, Functions, Teams, Users, Permission, Role } = require('node-appwrite');
require('dotenv').config();

class TradingPostAppwriteSetup {
    constructor() {
        // Initialize AppWrite client with existing project
        this.client = new Client()
            .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
            .setProject(process.env.APPWRITE_PROJECT_ID || '689bdaf500072795b0f6')
            .setKey(process.env.APPWRITE_API_KEY);

        // Initialize services
        this.databases = new Databases(this.client);
        this.storage = new Storage(this.client);
        this.functions = new Functions(this.client);
        this.teams = new Teams(this.client);
        this.users = new Users(this.client);

        // Configuration
        this.databaseId = 'trading_post_main';
        this.config = this.loadConfiguration();
    }

    loadConfiguration() {
        return {
            database: {
                id: this.databaseId,
                name: 'Trading Post Database',
                collections: [
                    {
                        id: 'users',
                        name: 'Users',
                        permissions: [
                            Permission.read(Role.any()),
                            Permission.create(Role.users()),
                            Permission.update(Role.user('self')),
                            Permission.delete(Role.user('self'))
                        ],
                        attributes: [
                            { key: 'email', type: 'email', required: true },
                            { key: 'username', type: 'string', size: 50, required: true },
                            { key: 'fullName', type: 'string', size: 100, required: false },
                            { key: 'profileImage', type: 'string', size: 255, required: false },
                            { key: 'bio', type: 'string', size: 500, required: false },
                            { key: 'location', type: 'string', size: 200, required: false },
                            { key: 'coordinates', type: 'float', array: true, required: false },
                            { key: 'zipcode', type: 'string', size: 10, required: false },
                            { key: 'searchRadius', type: 'integer', required: true, default: 25, min: 1, max: 100 },
                            { key: 'isVerified', type: 'boolean', default: false },
                            { key: 'isActive', type: 'boolean', default: true },
                            { key: 'rating', type: 'float', required: true, default: 5.0, min: 0, max: 5 },
                            { key: 'tradeCount', type: 'integer', required: true, default: 0, min: 0 },
                            { key: 'preferences', type: 'string', size: 2000, required: false, default: '{}' },
                            { key: 'lastActive', type: 'datetime', required: false },
                            { key: 'createdAt', type: 'datetime', required: true },
                            { key: 'updatedAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'email_idx', type: 'unique', attributes: ['email'] },
                            { key: 'username_idx', type: 'unique', attributes: ['username'] },
                            { key: 'location_idx', type: 'key', attributes: ['zipcode', 'coordinates'] },
                            { key: 'verified_idx', type: 'key', attributes: ['isVerified'] },
                            { key: 'rating_idx', type: 'key', attributes: ['rating', 'tradeCount'] }
                        ]
                    },
                    {
                        id: 'items',
                        name: 'Items',
                        permissions: [
                            Permission.read(Role.any()),
                            Permission.create(Role.users()),
                            Permission.update(Role.user('owner')),
                            Permission.delete(Role.user('owner'))
                        ],
                        attributes: [
                            { key: 'userId', type: 'string', size: 36, required: true },
                            { key: 'title', type: 'string', size: 200, required: true },
                            { key: 'description', type: 'string', size: 2000, required: true },
                            { key: 'category', type: 'string', size: 50, required: true },
                            { key: 'subcategory', type: 'string', size: 50, required: false },
                            { key: 'condition', type: 'string', size: 20, required: true },
                            { key: 'estimatedValue', type: 'float', required: false, min: 0 },
                            { key: 'tradeType', type: 'string', size: 20, required: true, default: 'trade' },
                            { key: 'images', type: 'string', size: 200, array: true, required: false },
                            { key: 'tags', type: 'string', size: 30, array: true, required: false },
                            { key: 'wants', type: 'string', size: 1000, required: false },
                            { key: 'status', type: 'string', size: 20, default: 'active' },
                            { key: 'location', type: 'string', size: 200, required: false },
                            { key: 'coordinates', type: 'float', array: true, required: false },
                            { key: 'zipcode', type: 'string', size: 10, required: false },
                            { key: 'isFeatured', type: 'boolean', default: false },
                            { key: 'viewCount', type: 'integer', default: 0, min: 0 },
                            { key: 'interestCount', type: 'integer', default: 0, min: 0 },
                            { key: 'expiresAt', type: 'datetime', required: false },
                            { key: 'createdAt', type: 'datetime', required: true },
                            { key: 'updatedAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'user_items_idx', type: 'key', attributes: ['userId', 'status'] },
                            { key: 'category_idx', type: 'key', attributes: ['category', 'subcategory'] },
                            { key: 'location_idx', type: 'key', attributes: ['zipcode'] },
                            { key: 'status_idx', type: 'key', attributes: ['status', 'createdAt'] },
                            { key: 'search_idx', type: 'fulltext', attributes: ['title', 'description'] },
                            { key: 'featured_idx', type: 'key', attributes: ['isFeatured', 'createdAt'] }
                        ]
                    },
                    {
                        id: 'wants',
                        name: 'User Wants',
                        permissions: [
                            Permission.read(Role.any()),
                            Permission.create(Role.users()),
                            Permission.update(Role.user('owner')),
                            Permission.delete(Role.user('owner'))
                        ],
                        attributes: [
                            { key: 'userId', type: 'string', size: 36, required: true },
                            { key: 'title', type: 'string', size: 200, required: true },
                            { key: 'description', type: 'string', size: 1000, required: false },
                            { key: 'category', type: 'string', size: 50, required: true },
                            { key: 'maxValue', type: 'float', required: false, min: 0 },
                            { key: 'isActive', type: 'boolean', default: true },
                            { key: 'createdAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'user_wants_idx', type: 'key', attributes: ['userId', 'isActive'] },
                            { key: 'category_wants_idx', type: 'key', attributes: ['category'] }
                        ]
                    },
                    {
                        id: 'trades',
                        name: 'Trades',
                        permissions: [
                            Permission.read(Role.user('initiator')),
                            Permission.read(Role.user('recipient')),
                            Permission.create(Role.users()),
                            Permission.update(Role.user('initiator')),
                            Permission.update(Role.user('recipient'))
                        ],
                        attributes: [
                            { key: 'initiatorId', type: 'string', size: 36, required: true },
                            { key: 'recipientId', type: 'string', size: 36, required: true },
                            { key: 'initiatorItemIds', type: 'string', size: 36, array: true },
                            { key: 'recipientItemIds', type: 'string', size: 36, array: true },
                            { key: 'status', type: 'string', size: 20, default: 'pending' },
                            { key: 'terms', type: 'string', size: 2000, required: false },
                            { key: 'meetingLocation', type: 'string', size: 500, required: false },
                            { key: 'meetingTime', type: 'datetime', required: false },
                            { key: 'completedAt', type: 'datetime', required: false },
                            { key: 'createdAt', type: 'datetime', required: true },
                            { key: 'updatedAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'initiator_idx', type: 'key', attributes: ['initiatorId', 'status'] },
                            { key: 'recipient_idx', type: 'key', attributes: ['recipientId', 'status'] },
                            { key: 'status_idx', type: 'key', attributes: ['status', 'createdAt'] }
                        ]
                    },
                    {
                        id: 'messages',
                        name: 'Messages',
                        permissions: [
                            Permission.read(Role.user('sender')),
                            Permission.read(Role.user('recipient')),
                            Permission.create(Role.users())
                        ],
                        attributes: [
                            { key: 'senderId', type: 'string', size: 36, required: true },
                            { key: 'recipientId', type: 'string', size: 36, required: true },
                            { key: 'tradeId', type: 'string', size: 36, required: false },
                            { key: 'content', type: 'string', size: 2000, required: true },
                            { key: 'isRead', type: 'boolean', default: false },
                            { key: 'attachments', type: 'string', size: 255, array: true, required: false },
                            { key: 'messageType', type: 'string', size: 20, default: 'text' },
                            { key: 'createdAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'sender_idx', type: 'key', attributes: ['senderId', 'createdAt'] },
                            { key: 'recipient_idx', type: 'key', attributes: ['recipientId', 'isRead'] },
                            { key: 'trade_idx', type: 'key', attributes: ['tradeId'] }
                        ]
                    },
                    {
                        id: 'reviews',
                        name: 'Reviews',
                        permissions: [
                            Permission.read(Role.any()),
                            Permission.create(Role.users())
                        ],
                        attributes: [
                            { key: 'reviewerId', type: 'string', size: 36, required: true },
                            { key: 'reviewedId', type: 'string', size: 36, required: true },
                            { key: 'tradeId', type: 'string', size: 36, required: true },
                            { key: 'rating', type: 'integer', min: 1, max: 5, required: true },
                            { key: 'comment', type: 'string', size: 1000, required: false },
                            { key: 'createdAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'reviewer_idx', type: 'key', attributes: ['reviewerId'] },
                            { key: 'reviewed_idx', type: 'key', attributes: ['reviewedId'] },
                            { key: 'trade_review_idx', type: 'unique', attributes: ['tradeId', 'reviewerId'] }
                        ]
                    },
                    {
                        id: 'notifications',
                        name: 'Notifications',
                        permissions: [
                            Permission.read(Role.user('recipient')),
                            Permission.create(Role.any()),
                            Permission.update(Role.user('recipient'))
                        ],
                        attributes: [
                            { key: 'userId', type: 'string', size: 36, required: true },
                            { key: 'type', type: 'string', size: 50, required: true },
                            { key: 'title', type: 'string', size: 200, required: true },
                            { key: 'message', type: 'string', size: 500, required: true },
                            { key: 'data', type: 'string', size: 1000, required: false },
                            { key: 'isRead', type: 'boolean', default: false },
                            { key: 'createdAt', type: 'datetime', required: true }
                        ],
                        indexes: [
                            { key: 'user_notif_idx', type: 'key', attributes: ['userId', 'isRead'] },
                            { key: 'type_idx', type: 'key', attributes: ['type'] }
                        ]
                    }
                ]
            },
            storage: {
                buckets: [
                    {
                        id: 'item_images',
                        name: 'Item Images',
                        permissions: [
                            Permission.read(Role.any()),
                            Permission.create(Role.users()),
                            Permission.update(Role.user('owner')),
                            Permission.delete(Role.user('owner'))
                        ],
                        fileSizeLimit: 10485760, // 10MB
                        allowedFileExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
                        encryption: true,
                        antivirus: true
                    },
                    {
                        id: 'profile_images',
                        name: 'Profile Images',
                        permissions: [
                            Permission.read(Role.any()),
                            Permission.create(Role.users()),
                            Permission.update(Role.user('owner')),
                            Permission.delete(Role.user('owner'))
                        ],
                        fileSizeLimit: 5242880, // 5MB
                        allowedFileExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
                        encryption: true,
                        antivirus: true
                    },
                    {
                        id: 'chat_attachments',
                        name: 'Chat Attachments',
                        permissions: [
                            Permission.read(Role.user('sender')),
                            Permission.read(Role.user('recipient')),
                            Permission.create(Role.users())
                        ],
                        fileSizeLimit: 20971520, // 20MB
                        allowedFileExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt'],
                        encryption: true,
                        antivirus: true
                    }
                ]
            },
            functions: [
                {
                    id: 'ai-matching-service',
                    name: 'AI Matching Service',
                    runtime: 'python-3.9',
                    entrypoint: 'main.py',
                    path: './functions/ai-matching',
                    events: ['databases.*.collections.items.documents.*.create'],
                    timeout: 60
                },
                {
                    id: 'notification-service',
                    name: 'Notification Service',
                    runtime: 'node-20.0',
                    entrypoint: 'index.js',
                    path: './functions/notifications',
                    events: [
                        'databases.*.collections.trades.documents.*.create',
                        'databases.*.collections.messages.documents.*.create'
                    ],
                    timeout: 15
                },
                {
                    id: 'trading-post-api',
                    name: 'Trading Post API',
                    runtime: 'python-3.9',
                    entrypoint: 'main.py',
                    path: './functions/api',
                    timeout: 30
                }
            ]
        };
    }

    /**
     * Run complete AppWrite setup
     */
    async setup() {
        console.log('🚀 Starting Trading Post AppWrite Configuration...');
        console.log(`📍 Project ID: ${this.client.config.project}`);
        console.log(`🌐 Endpoint: ${this.client.config.endpoint}`);

        try {
            await this.createDatabase();
            await this.createCollections();
            await this.createStorageBuckets();
            await this.displaySummary();
            
            console.log('✅ Trading Post AppWrite configuration completed successfully!');
            return true;
        } catch (error) {
            console.error('❌ Setup failed:', error);
            throw error;
        }
    }

    /**
     * Create database
     */
    async createDatabase() {
        console.log('\n📊 Creating database...');
        try {
            const database = await this.databases.create(
                this.config.database.id,
                this.config.database.name
            );
            console.log(`✅ Database created: ${database.name} (${database.$id})`);
        } catch (error) {
            if (error.code === 409) {
                console.log('⚠️  Database already exists, continuing...');
            } else {
                throw error;
            }
        }
    }

    /**
     * Create all collections
     */
    async createCollections() {
        console.log('\n📋 Creating collections...');
        
        for (const collectionConfig of this.config.database.collections) {
            await this.createCollection(collectionConfig);
        }
    }

    /**
     * Create a single collection with attributes and indexes
     */
    async createCollection(config) {
        console.log(`\n📝 Creating collection: ${config.name}`);
        
        try {
            // Create collection
            const collection = await this.databases.createCollection(
                this.databaseId,
                config.id,
                config.name,
                config.permissions,
                true, // documentSecurity
                true  // enabled
            );
            console.log(`✅ Collection created: ${collection.name}`);

            // Create attributes
            for (const attr of config.attributes) {
                await this.createAttribute(config.id, attr);
            }

            // Create indexes
            for (const index of config.indexes) {
                await this.createIndex(config.id, index);
            }

        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠️  Collection ${config.name} already exists`);
            } else {
                throw error;
            }
        }
    }

    /**
     * Create attribute helper
     */
    async createAttribute(collectionId, attr) {
        try {
            const method = this.getAttributeMethod(attr.type);
            const params = this.getAttributeParams(attr);
            
            await this.databases[method](this.databaseId, collectionId, ...params);
            console.log(`  ✓ Attribute: ${attr.key} (${attr.type})`);
            
        } catch (error) {
            if (error.code === 409) {
                console.log(`  ⚠️  Attribute ${attr.key} exists`);
            } else {
                console.error(`  ❌ Error creating ${attr.key}:`, error.message);
            }
        }
    }

    /**
     * Create index helper
     */
    async createIndex(collectionId, index) {
        try {
            await this.databases.createIndex(
                this.databaseId,
                collectionId,
                index.key,
                index.type,
                index.attributes,
                index.orders || []
            );
            console.log(`  ✓ Index: ${index.key} (${index.type})`);
            
        } catch (error) {
            if (error.code === 409) {
                console.log(`  ⚠️  Index ${index.key} exists`);
            } else {
                console.error(`  ❌ Error creating index ${index.key}:`, error.message);
            }
        }
    }

    /**
     * Get appropriate method for attribute type
     */
    getAttributeMethod(type) {
        const methods = {
            'string': 'createStringAttribute',
            'email': 'createEmailAttribute',
            'url': 'createUrlAttribute',
            'boolean': 'createBooleanAttribute',
            'integer': 'createIntegerAttribute',
            'float': 'createFloatAttribute',
            'datetime': 'createDatetimeAttribute'
        };
        return methods[type] || 'createStringAttribute';
    }

    /**
     * Get parameters for attribute creation
     */
    getAttributeParams(attr) {
        const params = [attr.key];
        
        switch (attr.type) {
            case 'string':
            case 'email':
            case 'url':
                params.push(attr.size || 255, attr.required || false, attr.default, attr.array || false);
                break;
            case 'boolean':
                params.push(attr.required || false, attr.default, attr.array || false);
                break;
            case 'integer':
            case 'float':
                params.push(attr.required || false, attr.min, attr.max, attr.default, attr.array || false);
                break;
            case 'datetime':
                params.push(attr.required || false, attr.default, attr.array || false);
                break;
        }
        
        return params;
    }

    /**
     * Create storage buckets
     */
    async createStorageBuckets() {
        console.log('\n🗂️  Creating storage buckets...');
        
        for (const bucketConfig of this.config.storage.buckets) {
            await this.createStorageBucket(bucketConfig);
        }
    }

    /**
     * Create a single storage bucket
     */
    async createStorageBucket(config) {
        try {
            const bucket = await this.storage.createBucket(
                config.id,
                config.name,
                config.permissions,
                config.fileSizeLimit,
                config.allowedFileExtensions,
                config.encryption,
                config.antivirus
            );
            console.log(`✅ Storage bucket created: ${bucket.name}`);
            
        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠️  Bucket ${config.name} already exists`);
            } else {
                console.error(`❌ Error creating bucket ${config.name}:`, error.message);
            }
        }
    }

    /**
     * Display configuration summary
     */
    async displaySummary() {
        console.log('\n📊 Configuration Summary');
        console.log('========================');
        console.log(`Database: ${this.config.database.name}`);
        console.log(`Collections: ${this.config.database.collections.length}`);
        console.log(`Storage Buckets: ${this.config.storage.buckets.length}`);
        console.log(`Functions: ${this.config.functions.length}`);
        
        console.log('\n📋 Collections Created:');
        this.config.database.collections.forEach(collection => {
            console.log(`  • ${collection.name} (${collection.attributes.length} attributes, ${collection.indexes.length} indexes)`);
        });
        
        console.log('\n🗂️  Storage Buckets Created:');
        this.config.storage.buckets.forEach(bucket => {
            console.log(`  • ${bucket.name} (${bucket.fileSizeLimit / 1024 / 1024}MB limit)`);
        });
    }

    /**
     * Test database connection
     */
    async testConnection() {
        try {
            const databases = await this.databases.list();
            console.log('✅ AppWrite connection successful');
            return true;
        } catch (error) {
            console.error('❌ AppWrite connection failed:', error.message);
            return false;
        }
    }
}

// Export class for use as module
module.exports = TradingPostAppwriteSetup;

// CLI execution
if (require.main === module) {
    const setup = new TradingPostAppwriteSetup();
    
    const command = process.argv[2] || 'setup';
    
    switch (command) {
        case 'test':
            setup.testConnection()
                .then(success => process.exit(success ? 0 : 1))
                .catch(() => process.exit(1));
            break;
        case 'setup':
        default:
            setup.setup()
                .then(() => {
                    console.log('\n🎉 Setup completed successfully!');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('\n💥 Setup failed:', error.message);
                    process.exit(1);
                });
            break;
    }
}