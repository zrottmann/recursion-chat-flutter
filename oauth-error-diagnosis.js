const { execSync } = require('child_process');

async function diagnoseOAuthError() {
  console.log('🔍 Diagnosing OAuth Error 400 for Trading Post...\n');
  
  // Get the exact OAuth error message
  console.log('📋 Testing OAuth redirect to capture exact error...');
  
  try {
    const testCommand = `curl -s "https://nyc.cloud.appwrite.io/v1/account/sessions/oauth2/google/redirect?project=689bdee000098bd9d55c&success=https://tradingpost.appwrite.network/"`;
    const response = execSync(testCommand, { encoding: 'utf8' });
    
    console.log('🔍 OAuth Response Analysis:');
    
    // Parse the response
    if (response.includes('Invalid') && response.includes('URI')) {
      console.log('❌ CONFIRMED: Platform registration incomplete');
      console.log('📋 Error indicates: tradingpost.appwrite.network not registered as web platform');
      
      // Show the exact error
      const errorMatch = response.match(/"message":"([^"]+)"/);
      if (errorMatch) {
        console.log(`   Error: ${errorMatch[1]}`);
      }
      
      console.log('\n🔧 REQUIRED ACTION:');
      console.log('The web platform registration was not completed successfully.');
      console.log('Please follow these exact steps:');
      console.log('');
      console.log('1. 🌐 Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c');
      console.log('2. 🔧 Click "Settings" → "Platforms"');
      console.log('3. ➕ Click "Add Platform" → Select "Web"');
      console.log('4. 📝 Platform Configuration:');
      console.log('   • Name: Trading Post');
      console.log('   • Hostname: tradingpost.appwrite.network');
      console.log('   • ❌ Do NOT add https:// or www.');
      console.log('   • ❌ Do NOT add trailing slashes /');
      console.log('5. 💾 Click "Create" to save');
      console.log('');
      console.log('⏰ Wait 2-3 minutes after adding, then test login again.');
      
    } else if (response.includes('redirect') || response.includes('Location:')) {
      console.log('✅ OAuth redirect working - platform registration successful!');
      console.log('🎉 Error 400 should be resolved');
      
    } else if (response.includes('404')) {
      console.log('⚠️  OAuth provider not configured');
      console.log('📋 Need to enable Google/GitHub providers in Auth settings');
      
    } else {
      console.log('ℹ️  Unexpected response - showing details:');
      console.log(response.substring(0, 300));
    }
    
  } catch (error) {
    console.log('❌ Could not test OAuth endpoint:', error.message);
  }
  
  // Additional diagnostics
  console.log('\n🔍 Additional Checks:');
  
  // Check if platform might be registered under different name/format
  console.log('📋 Common platform registration issues:');
  console.log('• ❌ Added with https:// prefix (should be just domain)');
  console.log('• ❌ Added with www. prefix (use exact domain)'); 
  console.log('• ❌ Typo in domain name');
  console.log('• ❌ Wrong project (should be 689bdee000098bd9d55c)');
  
  console.log('\n✅ Correct platform configuration:');
  console.log('Project ID: 689bdee000098bd9d55c');
  console.log('Platform Type: Web');
  console.log('Platform Name: Trading Post (or any name)');
  console.log('Hostname: tradingpost.appwrite.network (exactly as shown)');
  
  console.log('\n🎯 Once platform is correctly added:');
  console.log('• OAuth Error 400 will disappear');
  console.log('• Google/GitHub login will work');  
  console.log('• Users can authenticate successfully');
  console.log('• Trading Post will be fully functional');
  
  console.log('\n💡 Pro Tip:');
  console.log('After adding the platform, you can verify it worked by:');
  console.log('1. Wait 2-3 minutes');
  console.log('2. Clear browser cache');
  console.log('3. Test login at https://tradingpost.appwrite.network/');
  console.log('4. No Error 400 should appear');
}

diagnoseOAuthError();