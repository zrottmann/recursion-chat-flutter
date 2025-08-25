/**
 * Check platform registration via API
 * This bypasses the console UI to see what's actually registered
 */

console.log('🔍 CHECKING PLATFORM REGISTRATION VIA API');
console.log('═══════════════════════════════════════');

// This needs to be run in browser console at tradingpost.appwrite.network
const checkPlatforms = `
// Run this in browser console at https://tradingpost.appwrite.network
console.log('Checking current Appwrite client configuration...');

// Check if client is accessible
if (typeof Appwrite !== 'undefined') {
  const client = new Appwrite.Client();
  client.setEndpoint('https://nyc.cloud.appwrite.io/v1').setProject('689bdee000098bd9d55c');
  
  console.log('Client config:', {
    endpoint: client.endpoint,
    project: client.config.project,
    origin: window.location.origin
  });
  
  // Try to make a simple request to see what happens
  const account = new Appwrite.Account(client);
  account.getSession('current')
    .then(session => {
      console.log('✅ Session found:', session);
    })
    .catch(error => {
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        type: error.type,
        cors: error.message.includes('CORS') ? 'CORS ERROR DETECTED' : 'No CORS issue'
      });
    });
} else {
  console.log('❌ Appwrite not loaded globally');
}
`;

console.log('📋 BROWSER CONSOLE TEST:');
console.log('Copy and paste this in browser console at https://tradingpost.appwrite.network:');
console.log('');
console.log(checkPlatforms);
console.log('');

console.log('═══════════════════════════════════════');
console.log('          🔧 ALTERNATIVE SOLUTIONS');
console.log('═══════════════════════════════════════');
console.log('');

console.log('If CORS error persists, try these:');
console.log('');
console.log('1. 🌐 USE DIFFERENT DEPLOYMENT URL:');
console.log('   - Deploy to a different Appwrite Site');
console.log('   - Use a domain that auto-registers platforms');
console.log('');

console.log('2. 🔄 CONTACT APPWRITE SUPPORT:');
console.log('   - This might be a bug in platform registration');
console.log('   - Persistent CORS issues despite correct registration');
console.log('');

console.log('3. 🛠️ TRY DIFFERENT PROJECT:');
console.log('   - Create new Appwrite project');
console.log('   - Deploy to new project with fresh platform registration');
console.log('');

console.log('4. 📡 CHECK APPWRITE STATUS:');
console.log('   - Visit: https://status.appwrite.io');
console.log('   - Check for platform registration service issues');
console.log('');

console.log('═══════════════════════════════════════');
console.log('The fact that manual registration fails repeatedly');
console.log('suggests either a bug in Appwrite Console or');
console.log('a configuration issue with this specific project.');
console.log('═══════════════════════════════════════');