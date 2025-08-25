const { execSync } = require('child_process');

async function deployViaCurl() {
  console.log('🚀 Deploying Trading Post using direct API calls...\n');
  
  try {
    // Build the frontend first
    console.log('📦 Building frontend...');
    execSync('npm install --legacy-peer-deps', { 
      cwd: 'trading-app-frontend', 
      stdio: 'inherit' 
    });
    
    execSync('npm run build', { 
      cwd: 'trading-app-frontend', 
      stdio: 'inherit' 
    });
    
    console.log('✅ Build completed\n');
    
    // Get latest commit
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(`📝 Using commit: ${commitHash}\n`);
    
    // Use curl to trigger deployment
    const curlCommand = `curl -X POST "https://nyc.cloud.appwrite.io/v1/sites/689cb415001a367e69f8/deployments" ` +
      `-H "Content-Type: application/json" ` +
      `-H "X-Appwrite-Project: 689bdee000098bd9d55c" ` +
      `-H "X-Appwrite-Key: 27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec" ` +
      `-d "{\\"code\\": \\"${commitHash}\\", \\"activate\\": true}"`;
    
    console.log('🚀 Triggering deployment via API...');
    
    try {
      const result = execSync(curlCommand, { encoding: 'utf8' });
      console.log('✅ API Response:', result);
      
      console.log('\n🎉 Deployment triggered successfully!');
      console.log('🌐 Your site will be available at: https://tradingpost.appwrite.network/');
      console.log('📊 Monitor deployment: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
      
    } catch (curlError) {
      console.log('⚠️  Direct API failed, using alternative method...');
      
      // Alternative: Use the working Node.js SDK approach
      console.log('📝 Using Node.js SDK deployment...');
      execSync('node trigger-redeploy.js', { stdio: 'inherit' });
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    console.log('\n🔧 Manual deployment steps:');
    console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites');
    console.log('2. Click "tradingpost" site');
    console.log('3. Click "Redeploy" or "Deploy" button');
    console.log('4. Select latest commit or connect GitHub repository');
  }
}

deployViaCurl();