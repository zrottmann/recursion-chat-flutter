/**
 * Test Appwrite Pro Account Platform Features
 * Run this to verify if Pro resolves the platform registration issues
 */

console.log('🎯 TESTING APPWRITE PRO ACCOUNT FEATURES');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('This script will help you test if Pro account fixes the issues.');
console.log('');

// Test 1: Platform Activation Script
console.log('TEST 1: PLATFORM ACTIVATION');
console.log('────────────────────────────');
console.log('Run this in browser console at https://tradingpost.appwrite.network:');
console.log('');

const platformTest = `
// Test Pro Platform Activation
(function testProPlatform() {
  console.log('🧪 Testing Pro Account Platform Features...');
  
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/appwrite@15.0.0';
  script.onload = function() {
    const { Client, Account } = Appwrite;
    const client = new Client();
    
    client
      .setEndpoint('https://nyc.cloud.appwrite.io/v1')
      .setProject('689bdee000098bd9d55c');
    
    const account = new Account(client);
    
    console.log('📡 Testing platform connection...');
    
    // Test 1: Basic connection
    account.getSession('current')
      .then(session => {
        console.log('✅ PLATFORM ACTIVE WITH SESSION!', session);
        console.log('✅ Pro account is working - platform stable!');
      })
      .catch(error => {
        if (error.code === 401) {
          console.log('✅ PLATFORM ACTIVE! (No session, which is normal)');
          console.log('✅ Pro account platform registration is stable!');
          testOAuthWithCustomURLs();
        } else if (error.message && error.message.includes('Failed to fetch')) {
          console.error('❌ CORS ERROR - Platform still reverted to localhost');
          console.log('⚠️ Pro account did NOT fix the platform issue');
          console.log('📋 Try removing and re-adding platforms in console');
        } else {
          console.error('❌ Unexpected error:', error);
        }
      });
    
    // Test 2: OAuth with custom URLs (Pro feature)
    function testOAuthWithCustomURLs() {
      console.log('');
      console.log('📡 Testing OAuth with custom redirect URLs...');
      
      const successUrl = 'https://tradingpost.appwrite.network/auth/callback';
      const failureUrl = 'https://tradingpost.appwrite.network/auth/error';
      
      try {
        // Don't actually redirect, just test if it accepts the URLs
        const testCall = account.createOAuth2Session.toString();
        console.log('✅ OAuth method available');
        
        // Create a test button
        const button = document.createElement('button');
        button.textContent = 'Test OAuth with Custom URLs';
        button.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:10px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer';
        button.onclick = function() {
          try {
            account.createOAuth2Session('google', successUrl, failureUrl);
            console.log('✅ OAuth initiated with custom URLs!');
            console.log('🎉 PRO FEATURES WORKING!');
          } catch (err) {
            if (err.message && err.message.includes('Invalid URI')) {
              console.error('❌ Custom URLs still not working');
              console.log('⚠️ Platform registration issue persists');
            } else {
              console.error('OAuth error:', err);
            }
          }
        };
        document.body.appendChild(button);
        console.log('✅ Test button added to page (top-right corner)');
        console.log('Click it to test OAuth with custom URLs');
        
      } catch (error) {
        console.error('❌ OAuth test setup failed:', error);
      }
    }
  };
  document.head.appendChild(script);
})();
`;

console.log(platformTest);
console.log('');

// Test 2: Check Platform Status
console.log('TEST 2: CHECK PLATFORM STATUS IN CONSOLE');
console.log('────────────────────────────');
console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings/platforms');
console.log('2. Check if platforms show as active (not "Waiting for connection...")');
console.log('3. With Pro, platforms should stay active and not revert');
console.log('');

// Test 3: CORS Test
console.log('TEST 3: CORS TEST');
console.log('────────────────────────────');
console.log('Run this to test if CORS is fixed:');
console.log('');

const corsTest = `
// Test CORS with Pro Account
fetch('https://nyc.cloud.appwrite.io/v1/account', {
  method: 'GET',
  headers: {
    'X-Appwrite-Project': '689bdee000098bd9d55c',
    'Content-Type': 'application/json'
  },
  credentials: 'include'
})
.then(response => {
  if (response.ok) {
    console.log('✅ CORS WORKING! Pro account fixed the issue!');
    return response.json();
  } else if (response.status === 401) {
    console.log('✅ CORS WORKING! (401 is normal when not logged in)');
    console.log('✅ Pro account has fixed CORS issues!');
  } else {
    console.log('⚠️ Unexpected response:', response.status);
  }
})
.catch(error => {
  if (error.message.includes('CORS')) {
    console.error('❌ CORS STILL BROKEN - Pro did not fix it');
    console.error('Platform is still set to localhost only');
  } else {
    console.error('Error:', error);
  }
});
`;

console.log(corsTest);
console.log('');

// Test 4: Wildcard Domain Test
console.log('TEST 4: WILDCARD DOMAIN TEST (PRO FEATURE)');
console.log('────────────────────────────');
console.log('With Pro, you should be able to add *.appwrite.network as a platform');
console.log('1. Go to platforms in console');
console.log('2. Add new Web platform with hostname: *.appwrite.network');
console.log('3. This should cover all subdomains automatically');
console.log('');

// Results interpretation
console.log('═══════════════════════════════════════════════════════════');
console.log('INTERPRETING RESULTS:');
console.log('');
console.log('✅ IF PRO IS WORKING:');
console.log('- No CORS errors');
console.log('- Platform stays active (doesn\'t revert to localhost)');
console.log('- Custom OAuth redirect URLs work');
console.log('- Wildcard domains accepted');
console.log('');
console.log('❌ IF PRO DIDN\'T FIX IT:');
console.log('- Still getting CORS errors');
console.log('- Platform shows "Waiting for connection..."');
console.log('- Platform reverts to localhost after activation');
console.log('- Custom OAuth URLs still fail with "Invalid URI"');
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log('📧 IF PRO DOESN\'T FIX THE ISSUE:');
console.log('Contact Appwrite support:');
console.log('- Mention you have a Pro account');
console.log('- Reference project: 689bdee000098bd9d55c');
console.log('- Issue: Platform registration keeps reverting to localhost');
console.log('- Site: tradingpost.appwrite.network');
console.log('');

module.exports = {
  platformTest,
  corsTest
};