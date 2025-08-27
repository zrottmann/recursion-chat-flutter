const https = require('https');
const fs = require('fs');

console.log('🚀 Deploying Claude Code Remote & UI to Appwrite...');

// Read the deployment package
const fileData = fs.readFileSync('claude-site.tar.gz');
const boundary = '----WebKitFormBoundary' + Date.now();

// Create multipart form data manually
let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
body += 'true\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="code"; filename="claude-site.tar.gz"\r\n';
body += 'Content-Type: application/gzip\r\n\r\n';

const bodyBuffer = Buffer.concat([
  Buffer.from(body),
  fileData,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

// Configure the request
const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/sites/68aa1b51000a9c3a9c36/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

// Make the request
const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ Deployment successful!');
      const result = JSON.parse(data);
      console.log('📋 Deployment ID:', result.$id);
      console.log('🌐 Site will be available at: https://68aa1b51000a9c3a9c36.appwrite.global');
    } else {
      console.log('❌ Deployment failed');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

// Send the multipart data
req.write(bodyBuffer);
req.end();