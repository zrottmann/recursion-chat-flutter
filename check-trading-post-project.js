const sdk = require('node-appwrite');

// Try with Trading Post project ID from .env.appwrite
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')  // Try NYC region
  .setProject('689bdee000098bd9d55c') // Trading Post project ID
  .setKey('27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec');

const sites = new sdk.Sites(client);

async function checkTradingPostProject() {
  console.log('🔍 Checking Trading Post project (689bdee000098bd9d55c)...');
  console.log('🎯 Looking for site ID: 689cb415001a367e69f8');
  
  try {
    // First try to list sites
    const sitesList = await sites.list();
    console.log(`✅ Found ${sitesList.total} sites in Trading Post project:`);
    
    if (sitesList.sites && sitesList.sites.length > 0) {
      sitesList.sites.forEach((site, index) => {
        console.log(`\n📄 Site ${index + 1}:`);
        console.log(`   ID: ${site.$id}`);
        console.log(`   Name: ${site.name}`);
        console.log(`   Domain: ${site.domain || 'No custom domain'}`);
        console.log(`   Status: ${site.status}`);
        console.log(`   Repository: ${site.repository || 'No repository'}`);
        console.log(`   Branch: ${site.branch || 'No branch'}`);
        
        // Check if this is the site we're looking for
        if (site.$id === '689cb415001a367e69f8') {
          console.log(`   🎯 THIS IS THE TARGET SITE!`);
        }
      });
    }
    
    // Try to get the specific site directly
    console.log('\n🎯 Trying to get specific site: 689cb415001a367e69f8');
    try {
      const targetSite = await sites.get('689cb415001a367e69f8');
      console.log('✅ Found target site:');
      console.log(`   Name: ${targetSite.name}`);
      console.log(`   Domain: ${targetSite.domain || 'No custom domain'}`);
      console.log(`   Status: ${targetSite.status}`);
      
      // Try to list variables for this site
      try {
        const variables = await sites.listVariables('689cb415001a367e69f8');
        console.log(`\n📋 Current environment variables: ${variables.total}`);
        if (variables.variables && variables.variables.length > 0) {
          variables.variables.forEach(variable => {
            console.log(`   ${variable.key}: ${variable.value}`);
          });
        }
      } catch (varError) {
        console.log('⚠️  Could not list variables:', varError.message);
      }
      
      return true;
    } catch (siteError) {
      console.log('❌ Could not get specific site:', siteError.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Failed to access Trading Post project:', error.message);
    console.log('🔄 This might be a permission or project access issue');
    return false;
  }
}

checkTradingPostProject();