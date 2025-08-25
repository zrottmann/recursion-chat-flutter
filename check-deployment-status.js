const { Client, Sites } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('689bdee000098bd9d55c')
    .setKey('standard_44275d31173f67ac1b19bc83e8c9e5a1fa8f0f8b3b892cd0aca4e6dc97bb2b2ca09c25e7ee079bb0e5c0daf948fb87f3e1802f14b2f37a90c98e46f76c37173879c11ebf3b4c582f088a73e3e592b65c30afc2a89c6f01bb7f9b1f95b959fea1f7f5f1c0fc46834f690c95c88b6f0e10c1db43f9f61f80094e5f090c31e16e56');

const sites = new Sites(client);

async function checkDeploymentStatus() {
    try {
        console.log('📊 Checking Trading Post deployment status...\n');
        
        // Get site details
        const site = await sites.get('689cb415001a367e69f8');
        
        console.log('Site Name:', site.name);
        console.log('Site URL:', `https://${site.customDomains?.[0] || site.domain}`);
        console.log('Status:', site.status);
        console.log('Last Updated:', new Date(site.$updatedAt).toLocaleString());
        
        // List recent deployments
        console.log('\n📦 Recent Deployments:');
        const deployments = await sites.listDeployments('689cb415001a367e69f8');
        
        if (deployments.deployments && deployments.deployments.length > 0) {
            deployments.deployments.slice(0, 5).forEach((deployment, index) => {
                console.log(`\n${index + 1}. Deployment ${deployment.$id}`);
                console.log('   Status:', deployment.status);
                console.log('   Created:', new Date(deployment.$createdAt).toLocaleString());
                console.log('   Size:', deployment.size ? `${(deployment.size / 1024 / 1024).toFixed(2)} MB` : 'N/A');
            });
        } else {
            console.log('No deployments found');
        }
        
        console.log('\n✅ Check complete!');
        console.log('🔗 View in console: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites/site-689cb415001a367e69f8');
        
    } catch (error) {
        console.error('❌ Error checking deployment:', error.message);
        if (error.response) {
            console.error('Response:', error.response);
        }
    }
}

// Run the check
checkDeploymentStatus();