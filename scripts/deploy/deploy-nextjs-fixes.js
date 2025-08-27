/**
 * Deploy Next.js Fixes to super.appwrite.network
 * This script deploys the actual fixed Next.js application, not just a mobile HTML page
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const PROJECT_ID = '68a4e3da0022f3e129d0';
const SITE_ID = '68a6a8da00229a84ee7e'; // super.appwrite.network
const ENDPOINT = 'nyc.cloud.appwrite.io';

console.log('🚀 Deploying Fixed Next.js App to super.appwrite.network');
console.log('═══════════════════════════════════════════════════════');

async function deployNextJSFixes() {
  try {
    // Step 1: Build the Next.js application
    console.log('📦 Building Next.js application with fixes...');
    
    const buildProcess = new Promise((resolve, reject) => {
      exec('cd .. && npm run build', (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Build failed: ${error.message}`));
          return;
        }
        console.log('✅ Build successful!');
        resolve(stdout);
      });
    });
    
    await buildProcess;
    
    // Step 2: Create deployment archive
    console.log('📦 Creating deployment archive...');
    
    const archiveProcess = new Promise((resolve, reject) => {
      exec('cd ../build && tar -czf ../super-site-deployment/nextjs-fixes.tar.gz .', (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Archive creation failed: ${error.message}`));
          return;
        }
        console.log('✅ Archive created: nextjs-fixes.tar.gz');
        resolve();
      });
    });
    
    await archiveProcess;
    
    // Step 3: Deploy
    console.log('🚀 Deploying to super.appwrite.network...');
    
    const API_KEY = process.env.APPWRITE_API_KEY;
    
    if (!API_KEY) {
      console.log('');
      console.log('⚠️  APPWRITE_API_KEY not found in environment variables');
      console.log('');
      console.log('📋 MANUAL DEPLOYMENT REQUIRED:');
      console.log('1. Go to: https://cloud.appwrite.io/console');
      console.log(`2. Navigate to Project: ${PROJECT_ID}`);
      console.log('3. Go to Sites → super.appwrite.network');
      console.log('4. Click "Deploy"');
      console.log('5. Upload: super-site-deployment/nextjs-fixes.tar.gz');
      console.log('6. Wait for deployment to complete');
      console.log('');
      console.log('🌐 After deployment, the site will have:');
      console.log('  ✅ Fixed runtime timeout error');
      console.log('  ✅ Working Next.js router navigation');
      console.log('  ✅ Manual fallback button for navigation');
      console.log('  ✅ Proper static export configuration');
      console.log('  ✅ Grok AI chat functionality');
      return;
    }
    
    // Automated deployment if API key available
    const deployProcess = new Promise((resolve, reject) => {
      const curlCommand = `curl -X POST "https://${ENDPOINT}/v1/sites/${SITE_ID}/deployments" -H "X-Appwrite-Project: ${PROJECT_ID}" -H "X-Appwrite-Key: ${API_KEY}" -F "file=@nextjs-fixes.tar.gz"`;
      
      exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Deployment failed: ${error.message}`));
          return;
        }
        console.log('✅ Automated deployment successful!');
        console.log('🌐 Visit: https://super.appwrite.network');
        console.log('Response:', stdout);
        resolve();
      });
    });
    
    await deployProcess;
    
  } catch (error) {
    console.error('❌ Deployment process failed:', error.message);
    console.log('');
    console.log('📋 Please try manual deployment method listed above');
    process.exit(1);
  }
}

deployNextJSFixes();