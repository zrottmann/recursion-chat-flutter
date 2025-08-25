/**
 * Direct Platform Activation
 * Add this script to your trading post site to activate the platform
 */

console.log('🔌 DIRECT PLATFORM ACTIVATION');
console.log('═══════════════════════════════════════════════════');

// This script should be run from https://tradingpost.appwrite.network
// to establish the connection from the correct domain

const activationScript = `
<!-- Add this to your trading post site's HTML -->
<script src="https://cdn.jsdelivr.net/npm/appwrite@15.0.0"></script>
<script>
const { Client, Account } = Appwrite;

// Initialize client
const client = new Client();
client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('689bdee000098bd9d55c');

const account = new Account(client);

// Activate platform by making connection
async function activatePlatform() {
    console.log('🔌 Activating platform from tradingpost.appwrite.network...');
    
    try {
        // Try to get session (this establishes connection)
        await account.getSession('current');
        console.log('✅ Platform activated successfully!');
    } catch (error) {
        if (error.code === 401) {
            console.log('✅ Platform connection established!');
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

// Auto-activate when page loads
activatePlatform();
</script>
`;

console.log('📋 SOLUTION 1: Add to your site');
console.log('Copy this code and add to your Trading Post site:');
console.log(activationScript);
console.log('');

console.log('📋 SOLUTION 2: Manual browser activation');
console.log('1. Go to: https://tradingpost.appwrite.network');
console.log('2. Open browser developer console (F12)');
console.log('3. Paste and run this code:');
console.log('');

const browserCode = `
// Paste this in browser console at tradingpost.appwrite.network
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/appwrite@15.0.0';
script.onload = function() {
    const { Client, Account } = Appwrite;
    const client = new Client();
    client.setEndpoint('https://nyc.cloud.appwrite.io/v1').setProject('689bdee000098bd9d55c');
    const account = new Account(client);
    
    account.getSession('current').then(() => {
        console.log('✅ Platform activated!');
    }).catch((error) => {
        if (error.code === 401) {
            console.log('✅ Platform connection established!');
        } else {
            console.log('Error:', error.message);
        }
    });
};
document.head.appendChild(script);
`;

console.log(browserCode);
console.log('');

console.log('📋 SOLUTION 3: Quick test connection');
console.log('Alternative approach - use curl to make a direct API call:');
console.log('');

const curlCommand = `curl -X GET "https://nyc.cloud.appwrite.io/v1/account/sessions/current" \\
  -H "X-Appwrite-Project: 689bdee000098bd9d55c" \\
  -H "Origin: https://tradingpost.appwrite.network" \\
  -H "Referer: https://tradingpost.appwrite.network/"`;

console.log(curlCommand);
console.log('');

console.log('═══════════════════════════════════════════════════');
console.log('            🎯 RECOMMENDED ACTION');
console.log('═══════════════════════════════════════════════════');
console.log('');
console.log('Try SOLUTION 2 first:');
console.log('1. Go to https://tradingpost.appwrite.network');
console.log('2. Press F12 to open developer console');
console.log('3. Copy/paste the browser code above');
console.log('4. Press Enter to run it');
console.log('5. Should see "✅ Platform connection established!"');
console.log('6. Refresh Appwrite Console to see platform become Active');
console.log('');
console.log('═══════════════════════════════════════════════════');