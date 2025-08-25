const { Client, Storage } = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Appwrite configuration
const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdaf500072795b0f6')
  .setKey('27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec');

const storage = new Storage(client);

async function deployTradingPostToSites() {
  console.log('🚀 Deploying Trading Post to Appwrite Sites...');
  
  try {
    // Build directory path (Vite outputs to dist/)
    const buildDir = path.join(__dirname, 'trading-app-frontend', 'dist');
    
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build directory not found. Run "npm run build" first.');
    }
    
    console.log('📁 Build directory found:', buildDir);
    console.log('📋 Files to deploy:');
    
    const files = getAllFiles(buildDir);
    files.forEach(file => {
      const relativePath = path.relative(buildDir, file);
      const stats = fs.statSync(file);
      console.log(`   📄 ${relativePath} (${(stats.size / 1024).toFixed(2)} KB)`);
    });
    
    console.log('\n✅ Trading Post frontend is ready for deployment!');
    console.log('\n🎯 Manual Deployment Required:');
    console.log('   1. Open: https://cloud.appwrite.io/console/project-689bdaf500072795b0f6');
    console.log('   2. Go to: Hosting → Sites');
    console.log('   3. Create new site: "Trading Post"');
    console.log('   4. Upload files from:', buildDir);
    console.log('   5. Set custom domain: tradingpost.appwrite.network');
    console.log('   6. Your site will be live at: https://tradingpost.appwrite.network/');
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error);
    return false;
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Run deployment
deployTradingPostToSites();