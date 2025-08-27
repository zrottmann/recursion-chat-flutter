#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Configuration
const config = {
  endpoint: 'https://nyc.cloud.appwrite.io/v1',
  projectId: '68a4e3da0022f3e129d0',
  siteId: 'tech-orchestrator',
  apiKey: process.env.APPWRITE_API_KEY
};

console.log('🚀 Deploying Enhanced Tech Lead Orchestrator...');

if (!config.apiKey) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  process.exit(1);
}

// Create a simple archive
const archiver = require('archiver');
const output = fs.createWriteStream('deployment.zip');
const archive = archiver('zip');

output.on('close', function() {
  console.log('📦 Archive created:', archive.pointer() + ' bytes');
  deployToAppwrite();
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);
archive.directory('dist/', false);
archive.finalize();

function deployToAppwrite() {
  const form = new FormData();
  form.append('activate', 'true');
  form.append('code', fs.createReadStream('deployment.zip'));

  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: `/v1/sites/${config.siteId}/deployments`,
    method: 'POST',
    headers: {
      'X-Appwrite-Project': config.projectId,
      'X-Appwrite-Key': config.apiKey,
      ...form.getHeaders()
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Deployment successful!');
        console.log('🔗 URL: https://tech-orchestrator.appwrite.network');
        
        // Clean up
        fs.unlinkSync('deployment.zip');
      } else {
        console.error('❌ Deployment failed:', res.statusCode);
        console.error(data);
      }
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request error:', err.message);
  });

  form.pipe(req);
}