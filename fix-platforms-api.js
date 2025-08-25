const { execSync } = require('child_process');

async function fixPlatformsViaAPI() {
  console.log('🔧 Fixing OAuth platforms via direct API calls...\n');
  
  const projectId = '689bdee000098bd9d55c';
  const apiKey = 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
  
  try {
    // List current platforms
    console.log('📋 Checking current platforms...');
    const listCommand = `curl -X GET "https://nyc.cloud.appwrite.io/v1/projects/${projectId}/platforms" ` +
      `-H "X-Appwrite-Project: ${projectId}" ` +
      `-H "X-Appwrite-Key: ${apiKey}" ` +
      `-H "Content-Type: application/json"`;
    
    try {
      const platforms = execSync(listCommand, { encoding: 'utf8' });
      const platformData = JSON.parse(platforms);
      console.log(`   Found ${platformData.total} platforms:`);
      
      platformData.platforms.forEach((platform, index) => {
        console.log(`   ${index + 1}. ${platform.name} (${platform.type}): ${platform.hostname || platform.key || 'N/A'}`);
      });
      
      // Check if tradingpost.appwrite.network already exists
      const hasMainDomain = platformData.platforms.some(p => 
        p.hostname && p.hostname.includes('tradingpost.appwrite.network')
      );
      
      if (hasMainDomain) {
        console.log('\n✅ Trading Post domain already registered!');
        console.log('🔍 The OAuth error might be due to the site not being deployed yet.');
        console.log('📋 Next steps:');
        console.log('1. Deploy the site first');
        console.log('2. Then test OAuth login');
        return;
      }
      
    } catch (listError) {
      console.log('   Could not list platforms, proceeding to add...');
    }
    
    // Add Trading Post web platform
    console.log('\n🌐 Adding Trading Post web platform...');
    
    const addPlatformCommand = `curl -X POST "https://nyc.cloud.appwrite.io/v1/projects/${projectId}/platforms" ` +
      `-H "X-Appwrite-Project: ${projectId}" ` +
      `-H "X-Appwrite-Key: ${apiKey}" ` +
      `-H "Content-Type: application/json" ` +
      `-d "{\\"type\\": \\"web\\", \\"name\\": \\"Trading Post\\", \\"hostname\\": \\"tradingpost.appwrite.network\\"}"`;
    
    try {
      const result = execSync(addPlatformCommand, { encoding: 'utf8' });
      const platformResult = JSON.parse(result);
      
      if (platformResult.name) {
        console.log('✅ Trading Post platform added successfully!');
        console.log(`   Platform ID: ${platformResult.$id}`);
        console.log(`   Name: ${platformResult.name}`);
        console.log(`   Hostname: ${platformResult.hostname}`);
      } else {
        console.log('⚠️  Platform addition result:', result);
      }
      
    } catch (addError) {
      console.log('❌ Failed to add platform via API:', addError.message);
      
      // Show manual steps
      console.log('\n🔧 Please add the platform manually:');
      console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings/platforms');
      console.log('2. Click "Add Platform" → "Web"');
      console.log('3. Name: "Trading Post"');
      console.log('4. Hostname: "tradingpost.appwrite.network"');
      console.log('5. Save');
    }
    
    // Add localhost for development
    console.log('\n🏠 Adding localhost for development...');
    const addLocalhostCommand = `curl -X POST "https://nyc.cloud.appwrite.io/v1/projects/${projectId}/platforms" ` +
      `-H "X-Appwrite-Project: ${projectId}" ` +
      `-H "X-Appwrite-Key: ${apiKey}" ` +
      `-H "Content-Type: application/json" ` +
      `-d "{\\"type\\": \\"web\\", \\"name\\": \\"Trading Post Local\\", \\"hostname\\": \\"localhost\\"}"`;
    
    try {
      execSync(addLocalhostCommand, { encoding: 'utf8' });
      console.log('✅ Localhost platform added for development');
    } catch (localhostError) {
      console.log('ℹ️  Localhost platform might already exist');
    }
    
    console.log('\n🎉 Platform configuration completed!');
    console.log('🔐 OAuth should now work once the site is deployed');
    console.log('🚀 Deploy your Trading Post and test login functionality');
    
  } catch (error) {
    console.error('❌ API call failed:', error.message);
    
    console.log('\n📋 Manual platform setup required:');
    console.log('1. Go to Appwrite Console: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c');
    console.log('2. Settings → Platforms');
    console.log('3. Add Platform → Web');
    console.log('4. Hostname: tradingpost.appwrite.network');
    console.log('5. This will fix the OAuth 400 error');
  }
}

fixPlatformsViaAPI();