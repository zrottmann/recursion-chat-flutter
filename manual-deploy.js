const axios = require('axios');

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = '689bdee000098bd9d55c';
const API_KEY = 'standard_44275d31173f67ac1b19bc83e8c9e5a1fa8f0f8b3b892cd0aca4e6dc97bb2b2ca09c25e7ee079bb0e5c0daf948fb87f3e1802f14b2f37a90c98e46f76c37173879c11ebf3b4c582f088a73e3e592b65c30afc2a89c6f01bb7f9b1f95b959fea1f7f5f1c0fc46834f690c95c88b6f0e10c1db43f9f61f80094e5f090c31e16e56';
const SITE_ID = '689cb415001a367e69f8';

async function manualDeploy() {
    try {
        console.log('🚀 Triggering manual deployment for Trading Post...\n');
        
        // First, let's check the site status
        const siteResponse = await axios.get(
            `${APPWRITE_ENDPOINT}/sites/${SITE_ID}`,
            {
                headers: {
                    'X-Appwrite-Project': PROJECT_ID,
                    'X-Appwrite-Key': API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('Site Name:', siteResponse.data.name);
        console.log('Current Status:', siteResponse.data.status);
        console.log('Domain:', siteResponse.data.domain);
        
        // Trigger a new deployment by creating one
        console.log('\n📦 Creating new deployment...');
        
        const deployResponse = await axios.post(
            `${APPWRITE_ENDPOINT}/sites/${SITE_ID}/deployments`,
            {},
            {
                headers: {
                    'X-Appwrite-Project': PROJECT_ID,
                    'X-Appwrite-Key': API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Deployment created successfully!');
        console.log('Deployment ID:', deployResponse.data.$id);
        console.log('Status:', deployResponse.data.status);
        console.log('\n🔗 View deployment: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/sites/site-689cb415001a367e69f8');
        
    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.data.message || error.response.statusText);
            console.error('Status:', error.response.status);
            
            // If it's a 404, the endpoint might be different
            if (error.response.status === 404) {
                console.log('\n📝 Note: The deployment might have been triggered automatically via GitHub webhook.');
                console.log('Check the Appwrite Console for deployment status.');
            }
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Run the deployment
manualDeploy();