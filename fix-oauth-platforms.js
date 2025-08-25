/**
 * OAuth Platform Registration Fix for Trading Post
 * This script registers all necessary domains as Web platforms in Appwrite
 * to resolve the "Invalid URI" OAuth error permanently
 */

const { Client, Projects } = require('appwrite');

// Configuration
const config = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '689bdee000098bd9d55c',
  apiKey: process.env.APPWRITE_API_KEY || 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc'
};

// All domains that need to be registered for OAuth
const DOMAINS_TO_REGISTER = [
  'tradingpost.appwrite.network',
  '689cb415001a367e69f8.appwrite.global',
  'localhost:3000',
  'localhost:3001',
  'localhost:5173',
  'localhost:5174',
  'localhost:5175'
];

async function registerOAuthPlatforms() {
  console.log('🚀 Starting OAuth Platform Registration Fix...\n');
  
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);
    
    // Set API key if available
    if (config.apiKey) {
      client.setKey(config.apiKey);
    }
    
    const projects = new Projects(client);
    
    // Get current project details
    console.log('📋 Fetching project details...');
    const project = await projects.get(config.projectId);
    console.log(`✅ Project: ${project.name}\n`);
    
    // Get existing platforms
    console.log('🔍 Checking existing platforms...');
    const existingPlatforms = project.platforms || [];
    console.log(`Found ${existingPlatforms.length} existing platforms:`);
    existingPlatforms.forEach(platform => {
      console.log(`  - ${platform.type}: ${platform.name} (${platform.hostname || platform.key})`);
    });
    console.log('');
    
    // Register each domain
    console.log('📝 Registering OAuth callback domains...\n');
    
    for (const domain of DOMAINS_TO_REGISTER) {
      // Check if already registered
      const isRegistered = existingPlatforms.some(p => 
        p.type === 'web' && (p.hostname === domain || p.hostname === `https://${domain}`)
      );
      
      if (isRegistered) {
        console.log(`✅ ${domain} - Already registered`);
        continue;
      }
      
      // Register the platform
      try {
        const platformData = {
          type: 'web',
          name: `Trading Post - ${domain}`,
          hostname: domain.startsWith('http') ? domain : `https://${domain}`
        };
        
        await projects.createPlatform(
          config.projectId,
          platformData.type,
          platformData.name,
          undefined, // key (not needed for web)
          undefined, // store (not needed for web)
          platformData.hostname
        );
        
        console.log(`✅ ${domain} - Successfully registered`);
      } catch (error) {
        if (error.message?.includes('already exists')) {
          console.log(`⚠️  ${domain} - Already exists (skipping)`);
        } else {
          console.error(`❌ ${domain} - Failed: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 OAuth Platform Registration Complete!');
    console.log('\n📌 Next Steps:');
    console.log('1. OAuth should now work with all registered domains');
    console.log('2. Clear browser cache and cookies if issues persist');
    console.log('3. Test OAuth login at https://tradingpost.appwrite.network');
    
  } catch (error) {
    console.error('\n❌ Error registering platforms:', error);
    
    if (error.code === 401) {
      console.error('\n🔑 Authentication Error: Invalid API key');
      console.error('Please ensure you have a valid API key with project management permissions');
      console.error('\nTo get an API key:');
      console.error('1. Go to https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings/api');
      console.error('2. Create a new API key with "projects.read" and "projects.write" scopes');
      console.error('3. Set it as APPWRITE_API_KEY environment variable or update this script');
    } else if (error.code === 404) {
      console.error('\n🔍 Project not found');
      console.error('Please verify the project ID is correct: 689bdee000098bd9d55c');
    }
  }
}

// Alternative: Manual registration via Appwrite SDK
async function manualPlatformRegistration() {
  console.log('\n📝 Manual Platform Registration Instructions:\n');
  console.log('Since API registration requires admin permissions, you can manually register platforms:');
  console.log('\n1. Go to Appwrite Console:');
  console.log('   https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/auth/security');
  console.log('\n2. Click "Add Platform" and select "Web App"');
  console.log('\n3. Add each of these domains:');
  
  DOMAINS_TO_REGISTER.forEach(domain => {
    console.log(`   - ${domain}`);
  });
  
  console.log('\n4. For each domain, set the name to "Trading Post - [domain]"');
  console.log('\n5. Save the changes');
  console.log('\n✅ After adding all platforms, OAuth will work correctly!');
}

// Run the registration
console.log('═══════════════════════════════════════════════════');
console.log('       Trading Post OAuth Platform Fix');
console.log('═══════════════════════════════════════════════════\n');

// Try automatic registration first
registerOAuthPlatforms().catch(error => {
  console.error('Automatic registration failed, showing manual instructions...');
  manualPlatformRegistration();
});