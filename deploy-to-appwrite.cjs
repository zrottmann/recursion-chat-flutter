#!/usr/bin/env node

/**
 * Deploy Flutter Web App to Appwrite Hosting
 * Target: chat.recursionsystems.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  projectId: '689bdaf500072795b0f6',
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  siteId: '689cb6a9003b47a75929',
  buildDir: 'build/web',
  targetDomain: 'chat.recursionsystems.com'
};

console.log('🚀 FLUTTER WEB DEPLOYMENT TO APPWRITE');
console.log('=====================================');
console.log(`📁 Build Directory: ${config.buildDir}`);
console.log(`🌐 Target Domain: ${config.targetDomain}`);
console.log(`🔗 Appwrite Project: ${config.projectId}`);
console.log('=====================================\n');

// Step 1: Verify build exists
console.log('📋 Step 1: Verifying build...');
if (!fs.existsSync(config.buildDir)) {
  console.error('❌ Build directory not found! Run: flutter build web --release');
  process.exit(1);
}

const files = fs.readdirSync(config.buildDir);
console.log(`✅ Found ${files.length} files in build directory`);

// Step 2: Create Appwrite configuration
console.log('\n📋 Step 2: Creating Appwrite configuration...');
const appwriteConfig = {
  projectId: config.projectId,
  projectName: 'recursion-chat-flutter',
  sites: [{
    $id: config.siteId,
    name: 'recursion-chat-flutter',
    path: 'build/web',
    entrypoint: 'index.html'
  }]
};

fs.writeFileSync('appwrite.json', JSON.stringify(appwriteConfig, null, 2));
console.log('✅ Created appwrite.json');

// Step 3: Copy React app deployment configuration
console.log('\n📋 Step 3: Synchronizing deployment configuration...');
try {
  // Copy the existing React app's deployment setup
  const reactAppPath = '../recursion-chat-app';
  if (fs.existsSync(reactAppPath)) {
    // Copy deployment scripts
    const deploymentFiles = [
      '.env',
      'deployment-package.json',
      '.appwrite_site_id'
    ];
    
    deploymentFiles.forEach(file => {
      const sourcePath = path.join(reactAppPath, file);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, file);
        console.log(`✅ Copied ${file}`);
      }
    });
  }
} catch (error) {
  console.log('⚠️  Could not copy React app configuration, continuing...');
}

// Step 4: Prepare deployment package
console.log('\n📋 Step 4: Preparing deployment package...');

// Create a simple package.json for Appwrite deployment
const packageJson = {
  name: "recursion-chat-flutter-web",
  version: "1.0.0",
  description: "Flutter Web App with SSO for Recursion Chat",
  scripts: {
    build: "echo 'Flutter web app already built'",
    start: "echo 'Static files ready to serve'"
  },
  dependencies: {}
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Created package.json');

// Step 5: Git commit and push
console.log('\n📋 Step 5: Pushing to GitHub...');
try {
  execSync('git add -A', { stdio: 'inherit' });
  execSync(`git commit -m "Deploy Flutter web app with SSO to ${config.targetDomain}"`, { stdio: 'inherit' });
  execSync('git push origin master', { stdio: 'inherit' });
  console.log('✅ Pushed to GitHub successfully');
} catch (error) {
  console.log('⚠️  Git push failed or no changes to commit');
}

// Step 6: Trigger Appwrite deployment
console.log('\n📋 Step 6: Triggering Appwrite deployment...');
console.log('🔗 Manual deployment required:');
console.log('1. Visit: https://cloud.appwrite.io/console/project-689bdaf500072795b0f6/hosting/sites');
console.log(`2. Find site ID: ${config.siteId}`);
console.log('3. Click "Redeploy" to deploy the Flutter web app');
console.log(`4. Wait 2-5 minutes for deployment to ${config.targetDomain}`);

console.log('\n✅ DEPLOYMENT PREPARATION COMPLETE!');
console.log('=====================================');
console.log('🎯 The Flutter web app with SSO is ready for deployment');
console.log(`🌐 Target URL: https://${config.targetDomain}`);
console.log('🔐 Features: Google OAuth, Apple Sign-In, GitHub OAuth');
console.log('=====================================');