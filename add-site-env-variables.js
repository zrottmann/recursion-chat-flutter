const sdk = require('node-appwrite');

// Appwrite configuration
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdaf500072795b0f6')
  .setKey('27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec');

const projects = new sdk.Projects(client);

// Trading Post environment variables
const envVariables = [
  { key: 'NODE_ENV', value: 'production' },
  { key: 'REACT_APP_APPWRITE_ENDPOINT', value: 'https://nyc.cloud.appwrite.io/v1' },
  { key: 'REACT_APP_APPWRITE_PROJECT_ID', value: '689bdaf500072795b0f6' },
  { key: 'REACT_APP_APPWRITE_DATABASE_ID', value: 'trading_post_db' },
  { key: 'REACT_APP_APPWRITE_USERS_COLLECTION_ID', value: 'Trading Post Users' },
  { key: 'REACT_APP_APPWRITE_ITEMS_COLLECTION_ID', value: 'Trading Post Items' },
  { key: 'REACT_APP_APPWRITE_TRADES_COLLECTION_ID', value: 'Trading Post Trades' },
  { key: 'REACT_APP_APPWRITE_MESSAGES_COLLECTION_ID', value: 'Trading Post Messages' },
  { key: 'REACT_APP_APPWRITE_REVIEWS_COLLECTION_ID', value: 'Trading Post Reviews' },
  { key: 'REACT_APP_APPWRITE_WANTS_COLLECTION_ID', value: 'Trading Post Wants' },
  { key: 'REACT_APP_APPWRITE_NOTIFICATIONS_COLLECTION_ID', value: 'Trading Post Notifications' },
  { key: 'REACT_APP_APPWRITE_PROFILE_IMAGES_BUCKET_ID', value: 'profile_images' },
  { key: 'REACT_APP_APPWRITE_ITEM_IMAGES_BUCKET_ID', value: 'profile_images' },
  { key: 'REACT_APP_USE_APPWRITE_AUTH', value: 'true' },
  { key: 'REACT_APP_USE_APPWRITE_DATABASE', value: 'true' },
  { key: 'REACT_APP_USE_APPWRITE_STORAGE', value: 'true' },
  { key: 'REACT_APP_USE_APPWRITE_REALTIME', value: 'true' },
  { key: 'REACT_APP_USE_APPWRITE_FUNCTIONS', value: 'true' },
  { key: 'REACT_APP_API_URL', value: 'https://tradingpost.appwrite.network' },
  { key: 'REACT_APP_GOOGLE_SSO_ENABLED', value: 'true' },
  { key: 'REACT_APP_EMAIL_ENABLED', value: 'true' },
  { key: 'REACT_APP_PUSH_NOTIFICATIONS_ENABLED', value: 'true' },
  { key: 'GENERATE_SOURCEMAP', value: 'false' },
  { key: 'CI', value: 'false' }
];

async function addEnvironmentVariables(siteId) {
  console.log('🔧 Adding environment variables to Trading Post site...');
  console.log(`📋 Site ID: ${siteId}`);
  console.log(`📊 Variables to add: ${envVariables.length}`);
  
  try {
    // Add each environment variable
    for (const envVar of envVariables) {
      try {
        console.log(`   ➕ Adding: ${envVar.key} = ${envVar.value}`);
        
        await projects.createVariable(
          '689bdaf500072795b0f6', // projectId
          envVar.key,              // key
          envVar.value             // value
        );
        
        console.log(`   ✅ Added: ${envVar.key}`);
        
      } catch (error) {
        if (error.code === 409) {
          // Variable already exists, try to update it
          try {
            await projects.updateVariable(
              '689bdaf500072795b0f6',
              envVar.key,
              envVar.value
            );
            console.log(`   ✅ Updated: ${envVar.key}`);
          } catch (updateError) {
            console.log(`   ⚠️  Warning: ${envVar.key} - ${updateError.message}`);
          }
        } else {
          console.log(`   ❌ Error adding ${envVar.key}: ${error.message}`);
        }
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n✅ Environment variables configuration completed!');
    console.log('\n🚀 Your Trading Post site should now have all required environment variables.');
    console.log('🔄 Trigger a new deployment to apply the changes.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to add environment variables:', error);
    return false;
  }
}

// Get site ID from command line argument or use default
const siteId = process.argv[2] || 'YOUR_SITE_ID';

if (siteId === 'YOUR_SITE_ID') {
  console.log('🎯 Usage: node add-site-env-variables.js [SITE_ID]');
  console.log('📝 Example: node add-site-env-variables.js 689cb6a9003b47a75929');
  console.log('\n💡 If you created the site manually, you can find the Site ID in the Appwrite Console URL');
  console.log('   Example URL: https://cloud.appwrite.io/console/project-689bdaf500072795b0f6/hosting/site-[SITE_ID]');
  console.log('\n🔧 Or run without Site ID to configure project-level variables:');
  addEnvironmentVariables();
} else {
  addEnvironmentVariables(siteId);
}