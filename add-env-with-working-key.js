const sdk = require('node-appwrite');

// Use the Trading Post API key
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')  // Trading Post project ID
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const sites = new sdk.Sites(client);

// Trading Post environment variables
const envVariables = [
  { key: 'NODE_ENV', value: 'production' },
  { key: 'REACT_APP_APPWRITE_ENDPOINT', value: 'https://nyc.cloud.appwrite.io/v1' },
  { key: 'REACT_APP_APPWRITE_PROJECT_ID', value: '689bdaf500072795b0f6' },
  { key: 'REACT_APP_APPWRITE_DATABASE_ID', value: 'recursion_chat_db' },
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
  console.log('🔧 Adding environment variables using the working API key...');
  console.log(`📋 Site ID: ${siteId}`);
  console.log(`📊 Variables to add: ${envVariables.length}`);
  
  try {
    // Test permissions first
    console.log('\n🔍 Testing permissions...');
    
    try {
      const sitesList = await sites.list();
      console.log('✅ Sites list successful!');
      console.log(`   Found ${sitesList.total} sites`);
    } catch (error) {
      console.log('❌ Sites list failed:', error.message);
      return false;
    }
    
    // Try to get the specific site
    try {
      const site = await sites.get(siteId);
      console.log(`✅ Site found: ${site.name || 'Trading Post'}`);
    } catch (error) {
      console.log('⚠️  Could not get site details:', error.message);
    }
    
    // Add environment variables
    let successCount = 0;
    let updateCount = 0;
    
    console.log('\n📝 Adding environment variables...');
    
    for (const envVar of envVariables) {
      try {
        console.log(`   ➕ ${envVar.key}...`);
        
        await sites.createVariable(siteId, envVar.key, envVar.value);
        console.log(`   ✅ Added: ${envVar.key}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 409) {
          // Variable already exists, update it
          try {
            await sites.updateVariable(siteId, envVar.key, envVar.value);
            console.log(`   🔄 Updated: ${envVar.key}`);
            updateCount++;
          } catch (updateError) {
            console.log(`   ❌ Update failed for ${envVar.key}: ${updateError.message}`);
          }
        } else {
          console.log(`   ❌ Error with ${envVar.key}: ${error.message}`);
        }
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Results:`);
    console.log(`   ✅ New variables added: ${successCount}`);
    console.log(`   🔄 Variables updated: ${updateCount}`);
    console.log(`   📋 Total configured: ${successCount + updateCount}/${envVariables.length}`);
    
    if (successCount + updateCount > 0) {
      console.log('\n🚀 Environment variables successfully configured!');
      console.log('🔄 Trigger a redeploy to apply the changes.');
      console.log('📍 Your site: https://tradingpost.appwrite.network/');
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Failed to add environment variables:', error);
    return false;
  }
}

const siteId = '689cb415001a367e69f8';
addEnvironmentVariables(siteId);