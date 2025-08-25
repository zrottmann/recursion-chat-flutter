const { Client, Sites } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('689bdee000098bd9d55c')
    .setKey('standard_44275d31173f67ac1b19bc83e8c9e5a1fa8f0f8b3b892cd0aca4e6dc97bb2b2ca09c25e7ee079bb0e5c0daf948fb87f3e1802f14b2f37a90c98e46f76c37173879c11ebf3b4c582f088a73e3e592b65c30afc2a89c6f01bb7f9b1f95b959fea1f7f5f1c0fc46834f690c95c88b6f0e10c1db43f9f61f80094e5f090c31e16e56');

const sites = new Sites(client);

async function triggerDeployment() {
    try {
        console.log('🚀 Triggering Trading Post deployment...');
        
        // Create a new deployment for the Trading Post site
        const deployment = await sites.createDeployment(
            '689cb415001a367e69f8' // Trading Post Site ID
        );
        
        console.log('✅ Deployment triggered successfully!');
        console.log('Deployment ID:', deployment.$id);
        console.log('Status:', deployment.status);
        console.log('Check deployment at: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites/site-689cb415001a367e69f8');
        
    } catch (error) {
        console.error('❌ Error triggering deployment:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
    }
}

// Run the deployment
triggerDeployment();