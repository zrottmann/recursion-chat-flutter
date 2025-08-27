#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying Enhanced Tech Lead Orchestrator...');

const apiKey = process.env.APPWRITE_API_KEY || 'std_3ea069ac0e4f5e088e84c1ed5df30ea0ccc3de93821e45f8adf08a6c7501cd9065bb90a16df63c2ca087fcd6a9c061b646ecdb73fb87e7b7b6f43fc8ff8b02e81a67de37e66ec5b7f1da83fa8c0bb17e1d14a988e1c7c4bbed53e92e39dc28f9c29c96fb4bb9c96e1f07c60c64e7ff949f965e0f093e17c6025e8ec2f3e7449';

if (!apiKey) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  process.exit(1);
}

try {
  // Create a zip archive of the dist directory
  console.log('📦 Creating deployment archive...');
  const archiveName = 'tech-orchestrator-deployment.zip';
  
  // Use PowerShell compress for Windows compatibility
  const command = `powershell -Command "Compress-Archive -Path 'dist\\*' -DestinationPath '${archiveName}' -Force"`;
  execSync(command, { stdio: 'inherit' });
  
  console.log('📤 Uploading to Appwrite Sites...');
  
  // Use Node.js HTTPS to upload
  const https = require('https');
  const FormData = require('form-data');
  
  const form = new FormData();
  form.append('activate', 'true');
  form.append('code', fs.createReadStream(archiveName));

  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/sites/tech-orchestrator/deployments',
    method: 'POST',
    headers: {
      'X-Appwrite-Project': '68a4e3da0022f3e129d0',
      'X-Appwrite-Key': apiKey,
      ...form.getHeaders()
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    
    res.on('end', () => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Deployment successful!');
        console.log('🔗 URL: https://tech-orchestrator.appwrite.network');
      } else {
        console.error('❌ Deployment failed:', res.statusCode);
        console.error(data);
      }
      
      // Clean up
      try { fs.unlinkSync(archiveName); } catch(e) {}
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
  });

  form.pipe(req);
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
}