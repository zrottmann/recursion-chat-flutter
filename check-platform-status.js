const { execSync } = require('child_process');

async function checkPlatformStatus() {
  console.log('🔍 Checking Trading Post platform registration status...\n');
  
  const projectId = '689bdee000098bd9d55c';
  
  // Check if the site is deployed and accessible
  console.log('🌐 Testing site accessibility...');
  
  try {
    const testSite = `curl -I -s -o /dev/null -w "%{http_code}" https://tradingpost.appwrite.network/`;
    const responseCode = execSync(testSite, { encoding: 'utf8', timeout: 10000 }).trim();
    
    console.log(`   HTTP Response: ${responseCode}`);
    
    if (responseCode === '200') {
      console.log('✅ Site is live and accessible!');
      console.log('   Platform registration should work now.');
    } else if (responseCode === '404') {
      console.log('⚠️  Site not deployed yet (404 Not Found)');
      console.log('   Deploy the site first, then add platform.');
    } else {
      console.log(`ℹ️  Site response: ${responseCode}`);
      console.log('   May need to check deployment status.');
    }
    
  } catch (testError) {
    console.log('⚠️  Could not test site accessibility');
    console.log('   Site may not be deployed yet');
  }
  
  console.log('\n📋 Platform Registration Steps:');
  console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings/platforms');
  console.log('2. Add Platform → Web');
  console.log('3. Name: Trading Post');
  console.log('4. Hostname: tradingpost.appwrite.network');
  console.log('5. Save');
  
  console.log('\n🔧 Deployment Status Check:');
  console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
  console.log('2. Check "tradingpost" site status');
  console.log('3. If not deployed, connect GitHub or upload files');
  
  console.log('\n🎯 Quick Fix Order:');
  console.log('Step 1: Deploy site (if not already deployed)');
  console.log('Step 2: Add web platform (tradingpost.appwrite.network)'); 
  console.log('Step 3: Test OAuth login');
  
  // Check deployment methods available
  console.log('\n🚀 Available Deployment Methods:');
  console.log('• GitHub: Connect https://github.com/zrottmann/tradingpost.git');
  console.log('• CLI: Run ./deploy-cli-complete.bat');
  console.log('• Manual: Upload trading-app-frontend/build folder');
  
  console.log('\n✅ Once both site and platform are configured:');
  console.log('   OAuth Error 400 will be resolved!');
}

checkPlatformStatus();