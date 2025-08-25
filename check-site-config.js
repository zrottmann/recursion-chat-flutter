const sdk = require('node-appwrite');

// Use the Trading Post API key
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')  // Trading Post project ID
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const sites = new sdk.Sites(client);

async function checkSiteConfiguration() {
  console.log('🔍 Checking Trading Post site configuration...\n');
  
  try {
    // Get site details
    const site = await sites.get('689cb415001a367e69f8');
    
    console.log('📄 Site Details:');
    console.log(`   Name: ${site.name}`);
    console.log(`   ID: ${site.$id}`);
    console.log(`   Created: ${site.$createdAt}`);
    console.log(`   Updated: ${site.$updatedAt}`);
    
    // Check repository configuration
    console.log('\n📦 Repository Configuration:');
    console.log(`   Repository ID: ${site.repositoryId || 'Not configured'}`);
    console.log(`   Repository: ${site.repository || 'Not configured'}`);
    console.log(`   Branch: ${site.branch || 'Not configured'}`);
    console.log(`   Installation ID: ${site.installationId || 'Not configured'}`);
    console.log(`   Provider: ${site.provider || 'Not configured'}`);
    
    // Check build configuration
    console.log('\n🏗️ Build Configuration:');
    console.log(`   Root Directory: ${site.rootDirectory || '/'}`);
    console.log(`   Build Command: ${site.buildCommand || 'Not set'}`);
    console.log(`   Install Command: ${site.installCommand || 'Not set'}`);
    console.log(`   Output Directory: ${site.outputDirectory || 'Not set'}`);
    
    // Check domain configuration
    console.log('\n🌐 Domain Configuration:');
    console.log(`   Domain: ${site.domain || 'Not configured'}`);
    console.log(`   Custom Domain: ${site.customDomain || 'Not configured'}`);
    
    // Check deployment status
    console.log('\n📊 Deployment Status:');
    console.log(`   Status: ${site.status || 'Unknown'}`);
    
    // List recent deployments
    try {
      const deployments = await sites.listDeployments('689cb415001a367e69f8');
      console.log(`\n📋 Recent Deployments: ${deployments.total}`);
      
      if (deployments.deployments && deployments.deployments.length > 0) {
        deployments.deployments.slice(0, 3).forEach((deployment, index) => {
          console.log(`\n   Deployment ${index + 1}:`);
          console.log(`      ID: ${deployment.$id}`);
          console.log(`      Status: ${deployment.status}`);
          console.log(`      Created: ${deployment.$createdAt}`);
          console.log(`      Error: ${deployment.error || 'None'}`);
        });
      }
    } catch (deployError) {
      console.log('\n⚠️  Could not list deployments:', deployError.message);
    }
    
    // Check if we need to update the repository configuration
    if (!site.repositoryId || !site.repository) {
      console.log('\n⚠️  Repository is not configured!');
      console.log('📋 The site needs a Git repository to deploy from.');
      console.log('\nOptions:');
      console.log('1. Connect a GitHub repository through Appwrite Console');
      console.log('2. Deploy using manual file upload');
      console.log('3. Use a different deployment method (e.g., direct build upload)');
    }
    
    return site;
    
  } catch (error) {
    console.error('❌ Failed to get site configuration:', error.message);
    return null;
  }
}

checkSiteConfiguration();