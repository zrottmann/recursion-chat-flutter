const { Client, Projects } = require('appwrite');

// Initialize Appwrite Admin Client
const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')
  .setKey('27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec');

const projects = new Projects(client);

async function fixPlatforms() {
  try {
    console.log('🔍 Fetching current project platforms...');
    
    // Get project details
    const project = await projects.get('689bdee000098bd9d55c');
    console.log('Current platforms:', project.platforms);
    
    // Check if we need to update or add platforms
    const platformsToEnsure = [
      'https://tradingpost.appwrite.network',
      'https://689cb415001a367e69f8.appwrite.global',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174'
    ];
    
    // Get existing platforms
    const existingPlatforms = project.platforms || [];
    console.log('\n📋 Existing platforms:', existingPlatforms);
    
    // Check which platforms need to be added
    const platformsToAdd = platformsToEnsure.filter(platform => {
      const hostname = platform.replace(/^https?:\/\//, '');
      return !existingPlatforms.some(p => 
        p.hostname === hostname || 
        p.hostname === platform ||
        `https://${p.hostname}` === platform ||
        `http://${p.hostname}` === platform
      );
    });
    
    if (platformsToAdd.length === 0) {
      console.log('\n✅ All required platforms are already configured!');
      console.log('Configured platforms:', existingPlatforms.map(p => p.hostname));
    } else {
      console.log('\n⚠️ Missing platforms:', platformsToAdd);
      console.log('\nTo add these platforms:');
      console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings');
      console.log('2. Click on "Platforms" tab');
      console.log('3. Add each missing platform as a "Web" platform');
    }
    
    // Try to list all web platforms specifically
    console.log('\n🌐 Web Platform Details:');
    existingPlatforms.forEach(platform => {
      if (platform.type === 'web') {
        console.log(`  - ${platform.hostname || platform.name}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    if (error.code === 401) {
      console.error('\n⚠️ Authentication failed. The API key might be invalid or lack proper permissions.');
      console.error('You need an API key with project.read scope.');
    } else if (error.code === 404) {
      console.error('\n⚠️ Project not found. Check the project ID.');
    } else {
      console.error('\n⚠️ Full error details:', error);
    }
  }
}

// Run the fix
fixPlatforms();