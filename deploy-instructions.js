#!/usr/bin/env node

/**
 * Trading Post Deployment Instructions
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectId: '689bdee000098bd9d55c',
  siteId: '689cb415001a367e69f8',
  buildDir: './trading-app-frontend/build'
};

console.log('🚀 Trading Post Appwrite Sites Deployment');
console.log('==========================================\n');

// Check if build exists
if (!fs.existsSync(CONFIG.buildDir)) {
  console.error('❌ Build directory not found!');
  console.log('\nPlease run first:');
  console.log('  cd trading-app-frontend');
  console.log('  npm run build\n');
  process.exit(1);
}

console.log('✅ Build directory found at:', path.resolve(CONFIG.buildDir), '\n');

console.log('📋 DEPLOYMENT OPTIONS');
console.log('=====================\n');

console.log('OPTION 1: Appwrite Console (Easiest)');
console.log('-------------------------------------');
console.log('1. Open this link:');
console.log(`   https://cloud.appwrite.io/console/project-${CONFIG.projectId}/sites\n`);
console.log('2. Find your site with ID:', CONFIG.siteId, '\n');
console.log('3. Click "Deploy" or "Create Deployment"\n');
console.log('4. Upload your build folder or sync with GitHub\n');
console.log('5. Configure:');
console.log('   • Build command: npm run build');
console.log('   • Install command: npm ci');
console.log('   • Output directory: build\n');
console.log('6. Click "Deploy" and wait 3-5 minutes\n');

console.log('OPTION 2: Appwrite CLI');
console.log('-----------------------');
console.log('Run these commands:\n');
console.log('# Step 1: Login to Appwrite');
console.log('appwrite login\n');
console.log('# Step 2: Set project');
console.log(`appwrite client --project-id "${CONFIG.projectId}"\n`);
console.log('# Step 3: Deploy');
console.log(`appwrite sites create-deployment \\
  --site-id "${CONFIG.siteId}" \\
  --code "./trading-app-frontend" \\
  --activate \\
  --build-command "npm run build" \\
  --install-command "npm ci" \\
  --output-directory "build"\n`);

console.log('🌐 DEPLOYMENT URL');
console.log('=================');
console.log('Your Trading Post will be available at:');
console.log(`https://${CONFIG.siteId}.appwrite.global\n`);

console.log('✨ DEPLOYED FEATURES');
console.log('====================');
console.log('• Complete Trading Post marketplace');
console.log('• SSO authentication (Google, GitHub, etc.)');
console.log('• Real-time item listings');
console.log('• AI-powered photo capture');
console.log('• Secure payment processing');
console.log('• Responsive mobile design\n');

console.log('⏱️ Deployment takes 3-5 minutes');
console.log('=====================================\n');