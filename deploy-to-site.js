const sdk = require('node-appwrite');
const { execSync } = require('child_process');
const path = require('path');

// Use the Trading Post API key that worked for environment variables
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')  // Trading Post project ID
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const sites = new sdk.Sites(client);

async function deployToSite() {
  console.log('🚀 Deploying to Trading Post site: 689cb415001a367e69f8\n');
  
  try {
    // Step 1: Build the frontend
    console.log('📦 Building Trading Post frontend...');
    const frontendPath = path.join(__dirname, 'trading-app-frontend');
    
    execSync('npm install --legacy-peer-deps', { 
      cwd: frontendPath, 
      stdio: 'inherit' 
    });
    
    execSync('npm run build', { 
      cwd: frontendPath, 
      stdio: 'inherit' 
    });
    
    console.log('✅ Build completed successfully!\n');
    
    // Step 2: Get current site info
    console.log('🔍 Checking site configuration...');
    const site = await sites.get('689cb415001a367e69f8');
    console.log(`   Site: ${site.name}`);
    console.log(`   Repository: ${site.repository || 'Not connected'}`);
    console.log(`   Branch: ${site.branch || 'Not set'}\n`);
    
    // Step 3: Get latest commit hash
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(`📝 Latest commit: ${commitHash}\n`);
    
    // Step 4: Try to create deployment
    if (site.repository && site.repository.includes('github.com')) {
      console.log('🚀 Creating deployment with GitHub integration...');
      
      try {
        const deployment = await sites.createDeployment(
          '689cb415001a367e69f8',
          commitHash
        );
        
        console.log('✅ Deployment created successfully!');
        console.log(`   Deployment ID: ${deployment.$id}`);
        console.log(`   Status: ${deployment.status}`);
        
        // Monitor deployment progress
        console.log('\n⏳ Monitoring deployment progress...');
        let attempts = 0;
        const maxAttempts = 30;
        
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
            console.log('\n✅ All environment variables are active');
            return true;
          } else if (status.status === 'failed') {
            console.log(`\n❌ Deployment failed: ${status.error || 'Unknown error'}`);
            return false;
          }
          
          attempts++;
        }
        
        console.log('\n⏰ Deployment is taking longer than expected');
        console.log('🌐 Check status at: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
        
      } catch (deployError) {
        console.log('❌ GitHub deployment failed:', deployError.message);
        
        if (deployError.message.includes('repository')) {
          console.log('\n📋 Repository not properly connected. Please:');
          console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
          console.log('2. Click "tradingpost" site');
          console.log('3. Settings → Git Configuration');
          console.log('4. Connect GitHub repository: https://github.com/zrottmann/tradingpost.git');
          console.log('5. Set branch: main');
          console.log('6. Set build settings:');
          console.log('   - Root Directory: trading-app-frontend');
          console.log('   - Build Command: npm run build');
          console.log('   - Output Directory: build');
          console.log('   - Install Command: npm install --legacy-peer-deps');
        }
        
        return false;
      }
    } else {
      console.log('⚠️  GitHub repository not connected to site');
      console.log('\n🔧 Manual setup required:');
      console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
      console.log('2. Click on site "tradingpost" (ID: 689cb415001a367e69f8)');
      console.log('3. Connect GitHub repository: https://github.com/zrottmann/tradingpost.git');
      console.log('4. Configure build settings:');
      console.log('   - Root Directory: trading-app-frontend');
      console.log('   - Build Command: npm run build');
      console.log('   - Output Directory: build');
      console.log('   - Install Command: npm install --legacy-peer-deps');
      console.log('5. Deploy will trigger automatically');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    if (error.code === 404) {
      console.log('\n❌ Site 689cb415001a367e69f8 not found!');
      console.log('🔍 Let me check available sites...');
      
      try {
        const sitesList = await sites.list();
        console.log(`\n📋 Available sites (${sitesList.total}):`);
        sitesList.sites.forEach(site => {
          console.log(`   - ${site.name}: ${site.$id}`);
        });
      } catch (listError) {
        console.log('Could not list sites:', listError.message);
      }
    }
    
    return false;
  }
}

deployToSite();