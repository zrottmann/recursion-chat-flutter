/**
 * Setup Trading Post Configuration using Recursion App Settings
 * This creates the necessary config files and deployment spec
 */

const fs = require('fs');
const path = require('path');

// Recursion App AppWrite Configuration
const RECURSION_APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '689bdaf500072795b0f6',
    apiKey: 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc',
    databaseId: 'recursion_chat_db'
};

function updateTradingPostConfig() {
    console.log('📝 Creating Trading Post configuration files with Recursion settings...');
    
    // Update appwrite_config.py
    const appwriteConfigPy = `"""
AppWrite Configuration for Trading Post
Using the same AppWrite instance as Recursion Chat for unified backend
"""

import os
from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.functions import Functions

class AppwriteConfig:
    def __init__(self):
        # Use Recursion App AppWrite settings
        self.endpoint = "${RECURSION_APPWRITE_CONFIG.endpoint}"
        self.project_id = "${RECURSION_APPWRITE_CONFIG.projectId}"
        self.api_key = "${RECURSION_APPWRITE_CONFIG.apiKey}"
        self.database_id = "${RECURSION_APPWRITE_CONFIG.databaseId}"
        
        # Trading Post specific collections in shared database
        self.collections = {
            "users": "trading_post_users",
            "items": "trading_post_items",
            "trades": "trading_post_trades", 
            "messages": "trading_post_messages",
            "reviews": "trading_post_reviews",
            "categories": "trading_post_categories",
            "matches": "trading_post_matches"
        }
        
        self.buckets = {
            "item_images": "trading_post_item_images",
            "profile_images": "trading_post_profile_images"
        }
        
        # Initialize client
        self.client = Client()
        self.client.set_endpoint(self.endpoint)
        self.client.set_project(self.project_id)
        self.client.set_key(self.api_key)
        
        # Initialize services
        self.account = Account(self.client)
        self.databases = Databases(self.client)
        self.storage = Storage(self.client)
        self.functions = Functions(self.client)
        
        print(f"🚀 Trading Post AppWrite client initialized")
        print(f"   Endpoint: {self.endpoint}")
        print(f"   Project: {self.project_id}")
        print(f"   Database: {self.database_id}")

# Global instance
appwrite_config = AppwriteConfig()
`;
    
    fs.writeFileSync('appwrite_config_recursion.py', appwriteConfigPy);
    
    // Update React frontend config
    const frontendConfigJs = `/**
 * AppWrite Configuration for Trading Post Frontend
 * Using Recursion App AppWrite settings
 */

export const APPWRITE_CONFIG = {
    endpoint: '${RECURSION_APPWRITE_CONFIG.endpoint}',
    projectId: '${RECURSION_APPWRITE_CONFIG.projectId}',
    databaseId: '${RECURSION_APPWRITE_CONFIG.databaseId}',
    collections: {
        users: 'trading_post_users',
        items: 'trading_post_items', 
        trades: 'trading_post_trades',
        messages: 'trading_post_messages',
        reviews: 'trading_post_reviews',
        categories: 'trading_post_categories',
        matches: 'trading_post_matches'
    },
    buckets: {
        itemImages: 'trading_post_item_images',
        profileImages: 'trading_post_profile_images'
    }
};

export default APPWRITE_CONFIG;
`;

    // Ensure frontend config directory exists
    const frontendConfigDir = path.join('trading-app-frontend', 'src', 'config');
    if (!fs.existsSync(frontendConfigDir)) {
        fs.mkdirSync(frontendConfigDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(frontendConfigDir, 'appwriteRecursionConfig.js'), frontendConfigJs);
    
    // Update environment file
    const envRecursion = `# Trading Post Configuration using Recursion App AppWrite Settings

# AppWrite Settings (shared with Recursion)
APPWRITE_ENDPOINT=${RECURSION_APPWRITE_CONFIG.endpoint}
APPWRITE_PROJECT_ID=${RECURSION_APPWRITE_CONFIG.projectId}
APPWRITE_API_KEY=${RECURSION_APPWRITE_CONFIG.apiKey}
APPWRITE_DATABASE_ID=${RECURSION_APPWRITE_CONFIG.databaseId}

# Collection IDs (Trading Post specific)
APPWRITE_USERS_COLLECTION_ID=trading_post_users
APPWRITE_ITEMS_COLLECTION_ID=trading_post_items
APPWRITE_TRADES_COLLECTION_ID=trading_post_trades
APPWRITE_MESSAGES_COLLECTION_ID=trading_post_messages
APPWRITE_REVIEWS_COLLECTION_ID=trading_post_reviews
APPWRITE_CATEGORIES_COLLECTION_ID=trading_post_categories
APPWRITE_MATCHES_COLLECTION_ID=trading_post_matches

# Bucket IDs
APPWRITE_ITEM_IMAGES_BUCKET_ID=trading_post_item_images
APPWRITE_PROFILE_IMAGES_BUCKET_ID=trading_post_profile_images

# React App Environment Variables
REACT_APP_APPWRITE_ENDPOINT=${RECURSION_APPWRITE_CONFIG.endpoint}
REACT_APP_APPWRITE_PROJECT_ID=${RECURSION_APPWRITE_CONFIG.projectId}
REACT_APP_APPWRITE_DATABASE_ID=${RECURSION_APPWRITE_CONFIG.databaseId}

# Feature Flags
USE_APPWRITE_AUTH=true
USE_APPWRITE_DATABASE=true
USE_APPWRITE_STORAGE=true
USE_APPWRITE_REALTIME=true

# Application Settings
PORT=3000
NODE_ENV=production
`;

    fs.writeFileSync('.env.recursion', envRecursion);
    
    console.log('✅ Configuration files created successfully!');
}

function createDigitalOceanAppSpec() {
    console.log('🚀 Creating Digital Ocean app specification...');
    
    const TRADING_POST_APP_SPEC = {
        "name": "trading-post-recursion",
        "region": "nyc",
        "services": [
            {
                "name": "trading-post-web",
                "source_dir": "/",
                "build_command": "cd trading-app-frontend && npm ci && npm run build && cd .. && pip install -r requirements.txt",
                "run_command": "python -m uvicorn app_sqlite:app --host 0.0.0.0 --port 3000",
                "environment_slug": "python",
                "instance_size_slug": "basic-xs",
                "instance_count": 1,
                "http_port": 3000,
                "routes": [
                    {
                        "path": "/"
                    }
                ],
                "envs": [
                    {
                        "key": "PORT",
                        "value": "3000"
                    },
                    {
                        "key": "APPWRITE_ENDPOINT",
                        "value": RECURSION_APPWRITE_CONFIG.endpoint,
                        "type": "GENERAL"
                    },
                    {
                        "key": "APPWRITE_PROJECT_ID", 
                        "value": RECURSION_APPWRITE_CONFIG.projectId,
                        "type": "GENERAL"
                    },
                    {
                        "key": "APPWRITE_API_KEY",
                        "value": RECURSION_APPWRITE_CONFIG.apiKey,
                        "type": "SECRET"
                    },
                    {
                        "key": "APPWRITE_DATABASE_ID",
                        "value": RECURSION_APPWRITE_CONFIG.databaseId,
                        "type": "GENERAL"
                    },
                    {
                        "key": "REACT_APP_APPWRITE_ENDPOINT",
                        "value": RECURSION_APPWRITE_CONFIG.endpoint,
                        "type": "GENERAL"
                    },
                    {
                        "key": "REACT_APP_APPWRITE_PROJECT_ID",
                        "value": RECURSION_APPWRITE_CONFIG.projectId,
                        "type": "GENERAL"
                    },
                    {
                        "key": "REACT_APP_APPWRITE_DATABASE_ID",
                        "value": RECURSION_APPWRITE_CONFIG.databaseId,
                        "type": "GENERAL"
                    },
                    {
                        "key": "USE_APPWRITE_AUTH",
                        "value": "true",
                        "type": "GENERAL"
                    },
                    {
                        "key": "USE_APPWRITE_DATABASE", 
                        "value": "true",
                        "type": "GENERAL"
                    },
                    {
                        "key": "USE_APPWRITE_STORAGE",
                        "value": "true",
                        "type": "GENERAL"
                    }
                ],
                "health_check": {
                    "http_path": "/health",
                    "initial_delay_seconds": 30,
                    "period_seconds": 10
                }
            }
        ]
    };
    
    const appSpecPath = 'trading-post-recursion-app-spec.json';
    fs.writeFileSync(appSpecPath, JSON.stringify(TRADING_POST_APP_SPEC, null, 2));
    
    console.log(`✅ App spec created: ${appSpecPath}`);
    return appSpecPath;
}

function createAppwriteSetupScript() {
    console.log('📋 Creating AppWrite setup script...');
    
    const setupScript = `#!/usr/bin/env node

const { Client, Databases, Storage } = require('node-appwrite');

// Recursion App AppWrite Configuration
const config = {
    endpoint: '${RECURSION_APPWRITE_CONFIG.endpoint}',
    projectId: '${RECURSION_APPWRITE_CONFIG.projectId}',
    apiKey: '${RECURSION_APPWRITE_CONFIG.apiKey}',
    databaseId: '${RECURSION_APPWRITE_CONFIG.databaseId}'
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
                console.log(\`Creating collection: \${collection.name}\`);
                await databases.createCollection(
                    config.databaseId,
                    collection.id,
                    collection.name
                );
                console.log(\`✅ Created: \${collection.name}\`);
            } catch (error) {
                if (error.code === 409) {
                    console.log(\`⚠️  Collection \${collection.name} already exists\`);
                } else {
                    console.error(\`❌ Error creating \${collection.name}:\`, error.message);
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
                console.log(\`Creating bucket: \${bucket.name}\`);
                await storage.createBucket(
                    bucket.id,
                    bucket.name
                );
                console.log(\`✅ Created: \${bucket.name}\`);
            } catch (error) {
                if (error.code === 409) {
                    console.log(\`⚠️  Bucket \${bucket.name} already exists\`);
                } else {
                    console.error(\`❌ Error creating \${bucket.name}:\`, error.message);
                }
            }
        }
        
        console.log('🎉 Trading Post AppWrite setup completed!');
        console.log(\`Using shared database: \${config.databaseId}\`);
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
`;

    fs.writeFileSync('setup-trading-post-appwrite.js', setupScript);
    console.log('✅ AppWrite setup script created: setup-trading-post-appwrite.js');
}

function main() {
    console.log('🎯 Setting up Trading Post with Recursion App AppWrite Settings');
    console.log('=' .repeat(65));
    
    // Create configuration files
    updateTradingPostConfig();
    
    // Create Digital Ocean deployment spec
    const appSpecPath = createDigitalOceanAppSpec();
    
    // Create AppWrite setup script
    createAppwriteSetupScript();
    
    console.log('');
    console.log('✅ SETUP COMPLETE!');
    console.log('=' .repeat(65));
    console.log('📋 Files Created:');
    console.log('   • appwrite_config_recursion.py - Backend configuration');
    console.log('   • trading-app-frontend/src/config/appwriteRecursionConfig.js - Frontend config');
    console.log('   • .env.recursion - Environment variables');
    console.log('   • trading-post-recursion-app-spec.json - Digital Ocean app spec');
    console.log('   • setup-trading-post-appwrite.js - AppWrite setup script');
    console.log('');
    console.log('🔧 AppWrite Configuration:');
    console.log(`   • Endpoint: ${RECURSION_APPWRITE_CONFIG.endpoint}`);
    console.log(`   • Project ID: ${RECURSION_APPWRITE_CONFIG.projectId}`);
    console.log(`   • Database: ${RECURSION_APPWRITE_CONFIG.databaseId} (shared with Recursion)`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Run: node setup-trading-post-appwrite.js');
    console.log('   2. Deploy to Digital Ocean:');
    console.log(`      doctl apps create --spec ${appSpecPath}`);
    console.log('   3. Access your Trading Post at the deployed URL');
    console.log('');
    console.log('🌟 Benefits of using Recursion settings:');
    console.log('   • Shared AppWrite infrastructure');
    console.log('   • Unified backend management');
    console.log('   • Cost-effective deployment');
    console.log('   • Easy cross-app integration');
}

main();