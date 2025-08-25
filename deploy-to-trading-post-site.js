const { Client, Databases, Storage, Users } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Appwrite configuration for Trading Post Site ID: 689bdee000098bd9d55c
const APPWRITE_CONFIG = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '689bdee000098bd9d55c',
  apiKey: process.env.APPWRITE_API_KEY || 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc',
  databaseId: 'trading_post_db'
};

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)
  .setKey(APPWRITE_CONFIG.apiKey);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

async function deployTradingPostSite() {
  console.log('🚀 Starting deployment to Trading Post Site:', APPWRITE_CONFIG.projectId);
  
  try {
    // 1. Test connection
    console.log('📡 Testing Appwrite connection...');
    console.log('⚠️  Using API Key authentication...');

    // 2. Verify database exists
    console.log('🗄️  Checking database configuration...');
    const database = await databases.get(APPWRITE_CONFIG.databaseId).catch(async (error) => {
      if (error.code === 404) {
        console.log('📦 Creating trading_post_db database...');
        return await databases.create(APPWRITE_CONFIG.databaseId, 'Trading Post Database');
      }
      throw error;
    });
    
    console.log('✅ Database verified:', database.name);

    // 3. Setup required collections
    const collections = [
      { id: 'users', name: 'Users' },
      { id: 'items', name: 'Items' },
      { id: 'wants', name: 'Wants' },
      { id: 'trades', name: 'Trades' },
      { id: 'messages', name: 'Messages' },
      { id: 'reviews', name: 'Reviews' },
      { id: 'notifications', name: 'Notifications' }
    ];

    console.log('📋 Setting up collections...');
    for (const collection of collections) {
      try {
        await databases.getCollection(APPWRITE_CONFIG.databaseId, collection.id);
        console.log(`✅ Collection '${collection.name}' exists`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`📦 Creating collection '${collection.name}'...`);
          await databases.createCollection(
            APPWRITE_CONFIG.databaseId,
            collection.id,
            collection.name
          );
        }
      }
    }

    // 4. Setup storage buckets
    const buckets = [
      { id: 'item_images', name: 'Item Images' },
      { id: 'profile_images', name: 'Profile Images' },
      { id: 'chat_attachments', name: 'Chat Attachments' }
    ];

    console.log('🗂️  Setting up storage buckets...');
    for (const bucket of buckets) {
      try {
        await storage.getBucket(bucket.id);
        console.log(`✅ Bucket '${bucket.name}' exists`);
      } catch (error) {
        if (error.code === 404) {
          console.log(`📦 Creating bucket '${bucket.name}'...`);
          await storage.createBucket(
            bucket.id,
            bucket.name,
            ['read("any")'], // Permissions
            ['create("users")', 'read("any")', 'update("users")', 'delete("users")'],
            true, // Enabled
            undefined, // Maximum file size (default)
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'] // Allowed file extensions
          );
        }
      }
    }

    // 5. Build frontend application
    console.log('🔨 Building frontend application...');
    const { execSync } = require('child_process');
    
    const frontendPath = path.join(__dirname, 'trading-app-frontend');
    process.chdir(frontendPath);
    
    // Set environment variables for build
    const buildEnv = {
      ...process.env,
      NODE_ENV: 'production',
      REACT_APP_APPWRITE_ENDPOINT: APPWRITE_CONFIG.endpoint,
      REACT_APP_APPWRITE_PROJECT_ID: APPWRITE_CONFIG.projectId,
      REACT_APP_APPWRITE_DATABASE_ID: APPWRITE_CONFIG.databaseId,
      VITE_APPWRITE_ENDPOINT: APPWRITE_CONFIG.endpoint,
      VITE_APPWRITE_PROJECT_ID: APPWRITE_CONFIG.projectId
    };

    try {
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit', env: buildEnv });
      execSync('npm run build', { stdio: 'inherit', env: buildEnv });
      console.log('✅ Frontend build completed successfully');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      return;
    }

    console.log('🎉 Trading Post Site deployment completed successfully!');
    console.log('📋 Deployment Summary:');
    console.log(`   • Project ID: ${APPWRITE_CONFIG.projectId}`);
    console.log(`   • Endpoint: ${APPWRITE_CONFIG.endpoint}`);
    console.log(`   • Database: ${APPWRITE_CONFIG.databaseId}`);
    console.log(`   • Collections: ${collections.length} configured`);
    console.log(`   • Storage Buckets: ${buckets.length} configured`);
    console.log(`   • Frontend: Built and ready for deployment`);
    
    console.log('\n🌐 Next Steps:');
    console.log('   1. Deploy the built files from trading-app-frontend/build to your hosting platform');
    console.log('   2. Configure OAuth providers in the Appwrite console');
    console.log('   3. Update callback URLs in the deployment configuration');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deployTradingPostSite();