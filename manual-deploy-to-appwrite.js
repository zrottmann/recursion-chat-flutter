const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Use the Trading Post API key
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')  // Trading Post project ID
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const sites = new sdk.Sites(client);

async function manualDeploy() {
  console.log('🚀 Starting manual deployment to Appwrite Sites...\n');
  
  try {
    // Step 1: Build the Trading Post app
    console.log('📦 Building Trading Post frontend...');
    const frontendPath = path.join(__dirname, 'trading-app-frontend');
    
    if (!fs.existsSync(frontendPath)) {
      throw new Error('Frontend directory not found');
    }
    
    // Install dependencies and build
    console.log('   Installing dependencies...');
    execSync('npm install --legacy-peer-deps', { 
      cwd: frontendPath, 
      stdio: 'inherit' 
    });
    
    console.log('   Building production bundle...');
    execSync('npm run build', { 
      cwd: frontendPath, 
      stdio: 'inherit' 
    });
    
    const buildPath = path.join(frontendPath, 'build');
    if (!fs.existsSync(buildPath)) {
      throw new Error('Build directory not created');
    }
    
    console.log('✅ Build completed successfully!\n');
    
    // Step 2: Create a deployment
    console.log('🔄 Creating new deployment...');
    
    try {
      // Try to create a deployment without VCS
      const deployment = await sites.createDeployment('689cb415001a367e69f8');
      console.log(`✅ Deployment created: ${deployment.$id}`);
      console.log(`   Status: ${deployment.status}`);
      
      // Check deployment status
      let attempts = 0;
      const maxAttempts = 30;
      
      console.log('\n⏳ Waiting for deployment to complete...');
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const status = await sites.getDeployment('689cb415001a367e69f8', deployment.$id);
        console.log(`   Status: ${status.status}`);
        
        if (status.status === 'ready' || status.status === 'failed') {
          if (status.status === 'ready') {
            console.log('\n✅ Deployment successful!');
            console.log('🌐 Your site is live at: https://tradingpost.appwrite.network/');
          } else {
            console.log(`\n❌ Deployment failed: ${status.error || 'Unknown error'}`);
          }
          break;
        }
        
        attempts++;
      }
      
    } catch (deployError) {
      console.log('⚠️  Could not create deployment:', deployError.message);
      
      // Alternative: Direct file upload approach
      console.log('\n📤 Attempting alternative deployment method...');
      console.log('⚠️  Manual file upload may be required.');
      console.log('\n📋 Next steps:');
      console.log('1. Go to Appwrite Console: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c');
      console.log('2. Navigate to Sites → tradingpost');
      console.log('3. Either:');
      console.log('   a. Connect a GitHub repository with your Trading Post code');
      console.log('   b. Use the "Upload" feature to upload the build folder');
      console.log('\n📁 Build folder location:');
      console.log(`   ${buildPath}`);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.error(error);
  }
}

// Check if we should proceed
console.log('📋 This will:');
console.log('   1. Build the Trading Post frontend');
console.log('   2. Attempt to deploy to Appwrite Sites');
console.log('   3. Apply the environment variables we just configured\n');

manualDeploy();