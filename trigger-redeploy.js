const sdk = require('node-appwrite');

// Use the Trading Post API key
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')  // Trading Post project ID
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const sites = new sdk.Sites(client);

async function triggerRedeploy() {
  console.log('🔄 Triggering redeploy for Trading Post site...\n');
  
  try {
    // Get current site configuration
    const site = await sites.get('689cb415001a367e69f8');
    console.log('📄 Site: ' + site.name);
    
    // Check if repository is now configured
    if (site.repositoryId) {
      console.log('✅ Repository configured: ' + site.repository);
      console.log('🌿 Branch: ' + site.branch);
      
      // Get latest commit or use HEAD
      const deployment = await sites.createDeployment(
        '689cb415001a367e69f8',
        'HEAD'  // Use HEAD for latest commit
      );
      
      console.log('\n✅ Deployment triggered!');
      console.log(`   ID: ${deployment.$id}`);
      console.log(`   Status: ${deployment.status}`);
      
      // Monitor deployment
      console.log('\n⏳ Monitoring deployment...');
      let attempts = 0;
      const maxAttempts = 60;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const status = await sites.getDeployment('689cb415001a367e69f8', deployment.$id);
        
        if (status.status === 'building') {
          process.stdout.write('.');
        } else {
          console.log(`\n   Status: ${status.status}`);
        }
        
        if (status.status === 'ready') {
          console.log('\n🎉 Deployment successful!');
          console.log('🌐 Your site is live at: https://tradingpost.appwrite.network/');
          console.log('\n✅ Environment variables have been applied');
          break;
        } else if (status.status === 'failed') {
          console.log(`\n❌ Deployment failed: ${status.error || 'Unknown error'}`);
          break;
        }
        
        attempts++;
      }
      
    } else {
      console.log('⚠️  Repository not configured yet!');
      console.log('\n📋 To connect a repository:');
      console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
      console.log('2. Click on "tradingpost" site');
      console.log('3. Go to Settings → Git Configuration');
      console.log('4. Click "Connect Repository"');
      console.log('5. Select your GitHub repository');
      console.log('6. Choose the branch to deploy from');
      console.log('7. Run this script again to trigger deployment');
    }
    
  } catch (error) {
    console.error('❌ Failed to trigger redeploy:', error.message);
    
    if (error.message.includes('code')) {
      console.log('\n📋 Alternative: Trigger deployment from console');
      console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
      console.log('2. Click on "tradingpost" site');
      console.log('3. Click "Redeploy" or "Deploy" button');
    }
  }
}

triggerRedeploy();