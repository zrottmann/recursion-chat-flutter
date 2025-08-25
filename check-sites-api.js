const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdaf500072795b0f6')
  .setKey('27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec');

const sites = new sdk.Sites(client);

async function checkSitesAPI() {
  console.log('🔍 Checking Sites API methods...');
  console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(sites)));
  
  try {
    // Try to list sites first
    console.log('\n📋 Attempting to list sites...');
    const sitesList = await sites.list();
    console.log('✅ Sites list successful:', sitesList.total, 'sites found');
    
    if (sitesList.sites && sitesList.sites.length > 0) {
      sitesList.sites.forEach(site => {
        console.log(`   📄 Site: ${site.name} (ID: ${site.$id})`);
      });
    }
    
  } catch (error) {
    console.log('❌ Sites list failed:', error.message);
  }
  
  // Try to get specific site
  try {
    console.log('\n📄 Attempting to get site 689cb415001a367e69f8...');
    const site = await sites.get('689cb415001a367e69f8');
    console.log('✅ Site details:', site.name);
    
  } catch (error) {
    console.log('❌ Get site failed:', error.message);
  }
}

checkSitesAPI();