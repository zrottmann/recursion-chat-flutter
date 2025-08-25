/**
 * Platform Activation Script
 * Make a connection to activate the "Waiting for connection..." platform
 */

import { Client, Account } from 'appwrite';

console.log('🔌 ACTIVATING APPWRITE PLATFORM CONNECTION');
console.log('═══════════════════════════════════════════════════');

// Initialize Appwrite client
const client = new Client();

client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('689bdee000098bd9d55c');

const account = new Account(client);

async function activatePlatform() {
    try {
        console.log('📡 Attempting to connect to Appwrite...');
        
        // Try to get current session (this will establish connection)
        const session = await account.getSession('current');
        console.log('✅ Connection established! Platform should now be active.');
        console.log('Session found:', session.userId);
        
    } catch (error) {
        if (error.code === 401) {
            console.log('✅ Connection established! (No active session, but connection works)');
            console.log('🎯 Platform should now show as "Active" instead of "Waiting for connection..."');
        } else {
            console.log('❌ Connection error:', error.message);
        }
    }
}

// Activate the platform
activatePlatform().then(() => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('            📋 NEXT STEPS');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('1. 🔄 Refresh the Appwrite Console platforms page');
    console.log('2. ✅ Platform should now show "Active" status');
    console.log('3. 🌐 Go to: https://tradingpost.appwrite.network');
    console.log('4. 🔐 Try OAuth login - it should work now!');
    console.log('');
    console.log('Platform: https://cloud.appwrite.io/console/project-nyc-689bdee000098bd9d55c/overview/platforms');
    console.log('Test Site: https://tradingpost.appwrite.network');
});