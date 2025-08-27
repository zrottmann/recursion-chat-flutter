/**
 * Test OAuth with DEFAULT Appwrite URLs
 * Instead of custom success/failure URLs, use Appwrite's defaults
 */

console.log('🧪 TESTING OAUTH WITH DEFAULT URLS');
console.log('═══════════════════════════════════════════════════');

// This script tests OAuth without custom redirect URLs
const testScript = `
// Load Appwrite SDK first if not loaded
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/appwrite@15.0.0';
script.onload = function() {
  console.log('✅ SDK loaded, testing OAuth with DEFAULT URLs...');
  
  const { Client, Account } = Appwrite;
  const client = new Client();
  client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('689bdee000098bd9d55c');
  
  const account = new Account(client);
  
  // Test 1: OAuth WITHOUT custom URLs (use Appwrite defaults)
  console.log('🔬 Test 1: OAuth with NO custom URLs (Appwrite defaults)');
  try {
    account.createOAuth2Session('google');
    console.log('✅ OAuth initiated with default URLs - redirecting to Google...');
  } catch (error) {
    console.error('❌ OAuth with defaults failed:', error);
  }
};
document.head.appendChild(script);
`;

console.log('📋 INSTRUCTIONS:');
console.log('1. Go to: https://tradingpost.appwrite.network');
console.log('2. Open browser console (F12)');
console.log('3. Paste this code:');
console.log('');
console.log(testScript);
console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('🎯 EXPECTED RESULT:');
console.log('If this works (redirects to Google), the issue is with custom URLs');
console.log('If this fails with same error, platform registration is still broken');
console.log('');

console.log('═══════════════════════════════════════════════════');
console.log('🔧 ALTERNATIVE FIX:');
console.log('');
console.log('If platform registration keeps failing, try:');
console.log('1. Create a NEW Appwrite project');
console.log('2. Deploy your app to the new project');
console.log('3. Platform registration might work in a fresh project');
console.log('');
console.log('OR');
console.log('');
console.log('Use localhost for development:');
console.log('1. Run your app locally');
console.log('2. Access via http://localhost:5173');
console.log('3. OAuth should work since localhost platform is registered');
console.log('═══════════════════════════════════════════════════');