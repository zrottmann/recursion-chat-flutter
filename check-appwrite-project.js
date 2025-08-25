const { Client, Account, Databases } = require('appwrite');

// Test both project IDs to see which one actually works
const PROJECT_IDS_TO_TEST = [
    '689cb415001a367e69f8', // Current site ID we're using
    '689bdee000098bd9d55c', // Previous project ID
    '689bdaf500072795b0f6'  // Recursion project ID
];

async function testProjectID(projectId) {
    console.log(`\n🔍 Testing Project ID: ${projectId}`);
    
    try {
        const client = new Client()
            .setEndpoint('https://cloud.appwrite.io/v1')
            .setProject(projectId);
        
        const account = new Account(client);
        
        // Try to get account info (this will work even without being logged in)
        try {
            await account.get();
            console.log(`✅ ${projectId} - Account service accessible (user logged in)`);
        } catch (accountError) {
            if (accountError.code === 401) {
                console.log(`✅ ${projectId} - Project EXISTS (got 401 Unauthorized - expected for no login)`);
            } else {
                console.log(`❌ ${projectId} - Account error:`, accountError.code, accountError.message);
            }
        }
        
        // Try to get database info
        const databases = new Databases(client);
        try {
            await databases.list();
            console.log(`✅ ${projectId} - Database service accessible`);
        } catch (dbError) {
            if (dbError.code === 401) {
                console.log(`✅ ${projectId} - Database EXISTS (got 401 - expected without auth)`);
            } else {
                console.log(`❌ ${projectId} - Database error:`, dbError.code, dbError.message);
            }
        }
        
        return true;
    } catch (error) {
        console.log(`❌ ${projectId} - PROJECT NOT FOUND:`, error.code, error.message);
        return false;
    }
}

async function checkAllProjects() {
    console.log('🚀 Checking AppWrite Project IDs...\n');
    console.log('Google OAuth Client ID in AppWrite: 401325057900-jtcc85uv04ik83ffrl7vq8qh4q0ur4do.apps.googleusercontent.com');
    
    const results = {};
    
    for (const projectId of PROJECT_IDS_TO_TEST) {
        const exists = await testProjectID(projectId);
        results[projectId] = exists;
    }
    
    console.log('\n📊 RESULTS SUMMARY:');
    console.log('==================');
    
    for (const [projectId, exists] of Object.entries(results)) {
        const status = exists ? '✅ EXISTS' : '❌ NOT FOUND';
        console.log(`${projectId}: ${status}`);
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Use the project ID that EXISTS and has the Google OAuth configured');
    console.log('2. Update all configuration files with the working project ID');
    console.log('3. Ensure Google OAuth redirect URIs are set for the correct project');
}

checkAllProjects().catch(console.error);