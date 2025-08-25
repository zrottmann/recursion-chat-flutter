#!/usr/bin/env node

/**
 * Automated Trading Post deployment to Appwrite Sites
 * Using direct API calls with authentication
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');
const FormData = require('form-data');
const https = require('https');

// Configuration
const CONFIG = {
  endpoint: 'https://cloud.appwrite.io/v1',
  projectId: '689bdee000098bd9d55c',
  siteId: '689cb415001a367e69f8',
  apiKey: process.env.APPWRITE_API_KEY || '',
  buildDir: './trading-app-frontend/build'
};

console.log('🚀 Automated Trading Post Deployment');
console.log('====================================\n');

async function deployToAppwrite() {
  // Step 1: Check build
  if (!fs.existsSync(CONFIG.buildDir)) {
    console.log('⚠️ Build not found. Creating production build...');
    try {
      execSync('npm run build', {
        cwd: './trading-app-frontend',
        stdio: 'inherit'
      });
      console.log('✅ Build completed!\n');
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      return;
    }
  } else {
    console.log('✅ Build directory found\n');
  }

  // Step 2: Create deployment archive
  console.log('📦 Creating deployment archive...');
  const archivePath = path.join(__dirname, 'deployment.tar.gz');
  
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(archivePath);
    const archive = archiver('tar', { gzip: true });
    
    output.on('close', () => {
      console.log('✅ Archive created:', (archive.pointer() / 1024 / 1024).toFixed(2), 'MB\n');
      resolve();
    });
    
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(CONFIG.buildDir, false);
    archive.finalize();
  });

  // Step 3: Try deployment via CLI first
  console.log('🌐 Attempting deployment...\n');
  
  try {
    // Try to set the project
    execSync(`appwrite client --project-id "${CONFIG.projectId}"`, { stdio: 'pipe' });
    
    // Try to create deployment
    const deployCmd = `appwrite sites create-deployment ` +
      `--site-id "${CONFIG.siteId}" ` +
      `--code "${CONFIG.buildDir}" ` +
      `--activate ` +
      `--build-command "npm run build" ` +
      `--install-command "npm ci" ` +
      `--output-directory "."`;
    
    console.log('Executing deployment command...\n');
    execSync(deployCmd, { stdio: 'inherit' });
    
    console.log('\n✅ Deployment initiated successfully!');
    console.log('\n🌐 Your Trading Post will be available at:');
    console.log(`   https://${CONFIG.siteId}.appwrite.global`);
    console.log('\n⏱️ Deployment takes 3-5 minutes to complete');
    
  } catch (error) {
    console.log('⚠️ CLI deployment requires authentication\n');
    console.log('Please use one of these methods:\n');
    console.log('METHOD 1: Authenticate CLI');
    console.log('------------------------');
    console.log('1. Run: appwrite login');
    console.log('2. Enter your Appwrite credentials');
    console.log('3. Re-run this script\n');
    
    console.log('METHOD 2: Manual Console Deployment');
    console.log('-----------------------------------');
    console.log(`1. Open: https://cloud.appwrite.io/console/project-${CONFIG.projectId}/sites`);
    console.log(`2. Click on site: ${CONFIG.siteId}`);
    console.log('3. Click "Deploy" or "Create Deployment"');
    console.log('4. Upload the build folder or connect GitHub');
    console.log('5. Configure and deploy\n');
    
    console.log('📁 Build location:');
    console.log(`   ${path.resolve(CONFIG.buildDir)}\n`);
  }
  
  // Cleanup archive
  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }
}

// Run deployment
deployToAppwrite().catch(console.error);