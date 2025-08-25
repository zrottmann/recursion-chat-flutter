#!/usr/bin/env node

/**
 * Deploy Trading Post to Appwrite Sites NOW
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Trading Post to Appwrite Sites');
console.log('===========================================\n');

const CONFIG = {
  projectId: '689bdee000098bd9d55c',
  siteId: '689cb415001a367e69f8',
  buildDir: './trading-app-frontend/build'
};

// Check if build exists
if (!fs.existsSync(CONFIG.buildDir)) {
  console.log('❌ Build not found at:', CONFIG.buildDir);
  console.log('Building now...\n');
  try {
    execSync('npm run build', {
      cwd: './trading-app-frontend',
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Build failed!');
    process.exit(1);
  }
}

console.log('✅ Build ready\n');
console.log('📌 Project ID:', CONFIG.projectId);
console.log('📌 Site ID:', CONFIG.siteId);
console.log('📌 Build Path:', path.resolve(CONFIG.buildDir), '\n');

// Try deployment
console.log('Attempting deployment via CLI...\n');

try {
  // Set project
  execSync(`appwrite client --project-id "${CONFIG.projectId}"`, { 
    stdio: 'pipe' 
  });
  console.log('✓ Project set\n');
  
  // Deploy - using current directory path style
  const deployCmd = `appwrite sites create-deployment --site-id "${CONFIG.siteId}" --code "trading-app-frontend" --activate --output-directory "build"`;
  
  console.log('Executing:', deployCmd, '\n');
  execSync(deployCmd, { stdio: 'inherit' });
  
  console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
  console.log('\n🌐 Your Trading Post is deploying to:');
  console.log(`   https://${CONFIG.siteId}.appwrite.global`);
  console.log('\n⏱️ Will be live in 3-5 minutes!');
  
} catch (error) {
  console.log('\n⚠️ Automated deployment needs authentication\n');
  console.log('Quick fix - Run these 2 commands:\n');
  console.log('1️⃣  appwrite login');
  console.log('     (Enter your Appwrite credentials)\n');
  console.log('2️⃣  node deploy-now.js');
  console.log('     (Re-run this script)\n');
  console.log('─────────────────────────────────');
  console.log('Or manually deploy at:');
  console.log(`https://cloud.appwrite.io/console/project-${CONFIG.projectId}/sites`);
}