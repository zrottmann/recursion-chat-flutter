const sdk = require('node-appwrite');

// Try with cloud.appwrite.io endpoint (global) instead of nyc region
const client = new sdk.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')  // Changed from nyc.cloud.appwrite.io
  .setProject('689bdaf500072795b0f6')
  .setKey('27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec');

const sites = new sdk.Sites(client);

// Trading Post environment variables
const envVariables = [
  { key: 'NODE_ENV', value: 'production' },
  { key: 'REACT_APP_APPWRITE_ENDPOINT', value: 'https://nyc.cloud.appwrite.io/v1' },
  { key: 'REACT_APP_APPWRITE_PROJECT_ID', value: '689bdaf500072795b0f6' },
  { key: 'REACT_APP_APPWRITE_DATABASE_ID', value: 'recursion_chat_db' },
  { key: 'REACT_APP_APPWRITE_USERS_COLLECTION_ID', value: 'Trading Post Users' },
  { key: 'REACT_APP_APPWRITE_ITEMS_COLLECTION_ID', value: 'Trading Post Items' },
  { key: 'REACT_APP_USE_APPWRITE_AUTH', value: 'true' },
  { key: 'REACT_APP_USE_APPWRITE_DATABASE', value: 'true' },
  { key: 'GENERATE_SOURCEMAP', value: 'false' }
];

async function testEndpointsAndAddVariables(siteId) {
  console.log('🔧 Testing different endpoints and adding environment variables...');
  console.log(`📋 Site ID: ${siteId}`);
  
  try {
    // First test: Try to list sites to verify permissions
    console.log('\n🔍 Testing permissions with cloud.appwrite.io endpoint...');
    
    try {
      const sitesList = await sites.list();
      console.log('✅ Sites list successful with cloud.appwrite.io!');
      console.log(`   Found ${sitesList.total} sites`);
      
      if (sitesList.sites && sitesList.sites.length > 0) {
        sitesList.sites.forEach(site => {
          console.log(`   📄 Site: ${site.name} (ID: ${site.$id})`);
        });
      }
    } catch (error) {
      console.log('❌ Still unauthorized with cloud.appwrite.io:', error.message);
      return false;
    }
    
    // Try to get specific site
    try {
      const site = await sites.get(siteId);
      console.log(`✅ Site details retrieved: ${site.name}`);
    } catch (error) {
      console.log('❌ Cannot get site details:', error.message);
      return false;
    }
    
    // Try to list existing variables first
    try {
      const existingVars = await sites.listVariables(siteId);
      console.log(`📋 Current variables: ${existingVars.total}`);
    } catch (error) {
      console.log('⚠️  Cannot list existing variables:', error.message);
    }
    
    // Now try to add a few test variables
    let successCount = 0;
    
    for (const envVar of envVariables) {
      try {
        console.log(`   ➕ Adding: ${envVar.key}`);
        
        await sites.createVariable(siteId, envVar.key, envVar.value);
        console.log(`   ✅ Added: ${envVar.key}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 409) {
          // Variable already exists, try to update
          try {
            await sites.updateVariable(siteId, envVar.key, envVar.value);
            console.log(`   ✅ Updated: ${envVar.key}`);
            successCount++;
          } catch (updateError) {
            console.log(`   ❌ Update failed for ${envVar.key}: ${updateError.message}`);
          }
        } else {
          console.log(`   ❌ Error with ${envVar.key}: ${error.message}`);
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Successfully added/updated: ${successCount}/${envVariables.length} variables`);
    return successCount > 0;
    
  } catch (error) {
    console.error('❌ Overall operation failed:', error);
    return false;
  }
}

const siteId = '689cb415001a367e69f8';
testEndpointsAndAddVariables(siteId);