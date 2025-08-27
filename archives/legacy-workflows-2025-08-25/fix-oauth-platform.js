const sdk = require('node-appwrite');

// Use the Trading Post API key
const client = new sdk.Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('689bdee000098bd9d55c')
  .setKey('standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2');

const projects = new sdk.Projects(client);

async function fixOAuthPlatforms() {
  console.log('🔧 Fixing OAuth platform configuration for Trading Post...\n');
  
  try {
    const projectId = '689bdee000098bd9d55c';
    
    // List current platforms
    console.log('📋 Checking current web platforms...');
    try {
      const platforms = await projects.listPlatforms(projectId);
      console.log(`   Found ${platforms.total} platforms:`);
      
      platforms.platforms.forEach((platform, index) => {
        console.log(`   ${index + 1}. ${platform.name} (${platform.type}): ${platform.hostname || platform.key}`);
      });
    } catch (listError) {
      console.log('   Could not list platforms:', listError.message);
    }
    
    console.log('\n🌐 Adding Trading Post web platform...');
    
    // Add the Trading Post domain as a web platform
    try {
      const webPlatform = await projects.createPlatform(
        projectId,
        'web', // type
        'Trading Post Web', // name
        '', // key (not needed for web)
        '', // store (not needed for web)
        'tradingpost.appwrite.network' // hostname
      );
      
      console.log('✅ Web platform added successfully!');
      console.log(`   Platform ID: ${webPlatform.$id}`);
      console.log(`   Name: ${webPlatform.name}`);
      console.log(`   Hostname: ${webPlatform.hostname}`);
      
    } catch (platformError) {
      if (platformError.message.includes('already exists')) {
        console.log('✅ Platform already exists - that\'s good!');
      } else {
        console.log('❌ Failed to add web platform:', platformError.message);
      }
    }
    
    // Also add localhost for development
    console.log('\n🏠 Adding localhost for development...');
    try {
      const localhostPlatform = await projects.createPlatform(
        projectId,
        'web',
        'Trading Post Development',
        '',
        '',
        'localhost'
      );
      
      console.log('✅ Localhost platform added for development!');
      
    } catch (localhostError) {
      if (localhostError.message.includes('already exists')) {
        console.log('✅ Localhost platform already exists');
      } else {
        console.log('⚠️  Could not add localhost:', localhostError.message);
      }
    }
    
    // Add common development domains
    const devDomains = ['127.0.0.1', '*.vercel.app', '*.netlify.app'];
    
    for (const domain of devDomains) {
      try {
        await projects.createPlatform(
          projectId,
          'web',
          `Trading Post ${domain}`,
          '',
          '',
          domain
        );
        console.log(`✅ Added platform: ${domain}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.log(`⚠️  Could not add ${domain}:`, error.message);
        }
      }
    }
    
    console.log('\n📋 Updated platform list:');
    try {
      const updatedPlatforms = await projects.listPlatforms(projectId);
      updatedPlatforms.platforms.forEach((platform, index) => {
        console.log(`   ${index + 1}. ${platform.name}: ${platform.hostname || platform.key}`);
      });
    } catch (error) {
      console.log('   Could not retrieve updated list');
    }
    
    console.log('\n🎉 OAuth platform configuration completed!');
    console.log('🔐 Your Trading Post OAuth should now work properly');
    console.log('🌐 Test login at: https://tradingpost.appwrite.network/');
    
    // Show OAuth providers setup
    console.log('\n📋 Next: Configure OAuth providers if needed');
    console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/auth');
    console.log('2. Enable OAuth providers (Google, GitHub, etc.)');
    console.log('3. Set redirect URLs to: https://tradingpost.appwrite.network/');
    
  } catch (error) {
    console.error('❌ Failed to fix OAuth platforms:', error.message);
    
    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c');
    console.log('2. Navigate to: Settings → Platforms');
    console.log('3. Click "Add Platform" → Web');
    console.log('4. Add hostname: tradingpost.appwrite.network');
    console.log('5. Save configuration');
  }
}

fixOAuthPlatforms();