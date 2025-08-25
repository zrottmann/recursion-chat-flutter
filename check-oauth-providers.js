const { execSync } = require('child_process');

async function checkOAuthProviders() {
  console.log('🔍 Checking current OAuth provider configuration...\n');
  
  const projectId = '689bdee000098bd9d55c';
  const apiKey = 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
  
  try {
    // Check what auth methods are available
    console.log('📋 Checking available authentication methods...');
    
    const authMethodsCommand = `curl -s -X GET "https://nyc.cloud.appwrite.io/v1/projects/${projectId}" ` +
      `-H "X-Appwrite-Project: ${projectId}" ` +
      `-H "X-Appwrite-Key: ${apiKey}" ` +
      `-H "Content-Type: application/json"`;
    
    try {
      const projectInfo = execSync(authMethodsCommand, { encoding: 'utf8' });
      const project = JSON.parse(projectInfo);
      
      if (project.oAuthProviders && project.oAuthProviders.length > 0) {
        console.log('✅ OAuth Providers configured:');
        project.oAuthProviders.forEach(provider => {
          console.log(`   • ${provider.name}: ${provider.enabled ? 'Enabled' : 'Disabled'}`);
        });
      } else {
        console.log('⚠️  No OAuth providers configured yet');
      }
      
    } catch (error) {
      console.log('ℹ️  Could not retrieve project OAuth configuration');
    }
    
    // Test specific Google OAuth endpoint
    console.log('\n🔍 Testing Google OAuth endpoint directly...');
    
    const googleTestCommand = `curl -s -I "https://nyc.cloud.appwrite.io/v1/account/sessions/oauth2/google/redirect?project=${projectId}&success=https://tradingpost.appwrite.network/"`;
    
    try {
      const googleResponse = execSync(googleTestCommand, { encoding: 'utf8' });
      
      if (googleResponse.includes('404 Not Found')) {
        console.log('❌ Google OAuth provider not configured');
        console.log('   The Google OAuth endpoint returns 404');
      } else if (googleResponse.includes('302') || googleResponse.includes('Location:')) {
        console.log('✅ Google OAuth provider configured - would redirect');
      } else if (googleResponse.includes('400')) {
        console.log('⚠️  Google OAuth provider exists but has configuration issues');
      } else {
        console.log('ℹ️  Google OAuth response unclear, showing first part:');
        console.log(googleResponse.substring(0, 200));
      }
      
    } catch (error) {
      console.log('❌ Could not test Google OAuth endpoint');
    }
    
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }
  
  console.log('\n🔧 IMMEDIATE SOLUTION:');
  console.log('');
  console.log('Since Google OAuth is not properly configured, you have 3 options:');
  console.log('');
  console.log('📋 **Option 1: Quick Test with Email Auth**');
  console.log('• Look for "Sign up with Email" or "Create Account" button');
  console.log('• Use email/password instead of Google OAuth');
  console.log('• This should work immediately without configuration');
  console.log('');
  console.log('📋 **Option 2: Configure Google OAuth (10 minutes)**');
  console.log('1. Go to: https://console.cloud.google.com/');
  console.log('2. Create OAuth 2.0 credentials');
  console.log('3. Add redirect URI: https://nyc.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/689bdee000098bd9d55c');
  console.log('4. Go to Appwrite Console: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c');
  console.log('5. Auth → Settings → OAuth Providers → Google → Enable + Add credentials');
  console.log('');
  console.log('📋 **Option 3: Use GitHub OAuth Instead**');
  console.log('• GitHub OAuth is simpler to configure');
  console.log('• Create GitHub OAuth app at: https://github.com/settings/developers');
  console.log('• Add to Appwrite in same OAuth Providers section');
  
  console.log('\n💡 **RECOMMENDATION: Try Email Authentication First**');
  console.log('This will let you test the Trading Post immediately while');
  console.log('configuring OAuth providers in the background.');
  
  console.log('\n🎯 **Expected on Trading Post Site:**');
  console.log('Look for these authentication options:');
  console.log('• ✅ Email/Password signup form');
  console.log('• ⚠️  Sign in with Google (currently broken - needs config)');
  console.log('• ⚠️  Sign in with GitHub (if available - needs config)');
  
  console.log('\n📞 **Next Steps:**');
  console.log('1. 🧪 Try email authentication first');
  console.log('2. 🔧 Configure Google OAuth if needed');
  console.log('3. ✅ Confirm full Trading Post functionality');
}

checkOAuthProviders();