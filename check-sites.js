const sdk = require('node-appwrite');

// Use the API key that worked for recursion chat deployment
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdaf500072795b0f6')
  .setKey('standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc');

const sites = new sdk.Sites(client);

async function listAllSites() {
  console.log('🔍 Listing all sites in the project...');
  
  try {
    const sitesList = await sites.list();
    console.log(`✅ Found ${sitesList.total} sites:`);
    
    if (sitesList.sites && sitesList.sites.length > 0) {
      sitesList.sites.forEach((site, index) => {
        console.log(`\n📄 Site ${index + 1}:`);
        console.log(`   ID: ${site.$id}`);
        console.log(`   Name: ${site.name}`);
        console.log(`   Domain: ${site.domain || 'No custom domain'}`);
        console.log(`   Status: ${site.status}`);
        console.log(`   Repository: ${site.repository || 'No repository'}`);
        console.log(`   Branch: ${site.branch || 'No branch'}`);
        console.log(`   Created: ${site.$createdAt}`);
        console.log(`   Updated: ${site.$updatedAt}`);
      });
    } else {
      console.log('❌ No sites found in this project');
    }
    
  } catch (error) {
    console.error('❌ Failed to list sites:', error.message);
    console.error('Full error:', error);
  }
}

listAllSites();