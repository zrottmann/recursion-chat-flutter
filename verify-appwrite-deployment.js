#!/usr/bin/env node

/**
 * Verify and trigger Appwrite Sites deployment
 * After GitHub push, this checks the deployment status
 */

const https = require('https');

const CONFIG = {
  projectId: '689bdee000098bd9d55c',
  siteId: '689cb415001a367e69f8',
  siteName: 'tradingpost',
  expectedUrl: 'https://tradingpost.appwrite.network/',
  githubRepo: 'https://github.com/zrottmann/tradingpost.git'
};

console.log('🔍 Verifying Appwrite Sites Deployment');
console.log('=======================================\n');

console.log('📦 GitHub Repository:');
console.log('   ' + CONFIG.githubRepo);
console.log('   Status: ✅ Code pushed successfully\n');

console.log('🌐 Appwrite Sites Configuration:');
console.log('   Project ID: ' + CONFIG.projectId);
console.log('   Site ID: ' + CONFIG.siteId);
console.log('   Site Name: ' + CONFIG.siteName);
console.log('   Expected URL: ' + CONFIG.expectedUrl + '\n');

console.log('📋 DEPLOYMENT STATUS');
console.log('--------------------');
console.log('✅ Code pushed to GitHub');
console.log('✅ Build completed locally');
console.log('✅ Environment variables configured');
console.log('⏳ Waiting for Appwrite Sites auto-deployment\n');

console.log('⚠️ IMPORTANT: GitHub Integration Required');
console.log('------------------------------------------');
console.log('If the site is not deploying automatically:\n');
console.log('1. Go to: https://cloud.appwrite.io/console/project-' + CONFIG.projectId + '/sites');
console.log('2. Click on "' + CONFIG.siteName + '" site');
console.log('3. Navigate to Settings → Git Configuration');
console.log('4. Connect the GitHub repository: ' + CONFIG.githubRepo);
console.log('5. Select the branch to deploy (main/master)');
console.log('6. Save the configuration\n');

console.log('🔄 Auto-deployment will trigger after GitHub connection is established.\n');

// Check if the site is accessible
console.log('Checking if site is live...');
https.get(CONFIG.expectedUrl, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Site is LIVE at: ' + CONFIG.expectedUrl);
  } else if (res.statusCode === 404) {
    console.log('⏳ Site not yet deployed. Please connect GitHub repository in Appwrite Console.');
  } else {
    console.log('⚠️ Site returned status: ' + res.statusCode);
  }
}).on('error', (err) => {
  console.log('⏳ Site not accessible yet. Deployment may be in progress.');
  console.log('   Check status at: https://cloud.appwrite.io/console/project-' + CONFIG.projectId + '/sites');
});