const https = require('https');
const fs = require('fs');

console.log('🎯 Deploying Super Console to remote.appwrite.network...');

// Use the existing built site
const fileData = fs.readFileSync('super-console-demo.tar.gz');
const boundary = '----WebKitFormBoundary' + Date.now();

let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
body += 'index.html\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
body += 'true\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="code"; filename="site.tar.gz"\r\n';
body += 'Content-Type: application/gzip\r\n\r\n';

const bodyBuffer = Buffer.concat([
  Buffer.from(body),
  fileData,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const deployOptions = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/functions/remote/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

const deployReq = https.request(deployOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Deploy Status:', res.statusCode);
    console.log('Deploy Response:', data);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Deployment successful!');
      console.log('🌐 Super Console now available at: https://remote.appwrite.network');
      console.log('🎉 Claude Code Super Console is now live!');
    } else if (res.statusCode === 404) {
      console.log('❌ Function not found, trying to create...');
      createFunction();
    } else {
      console.log('❌ Deployment failed');
    }
  });
});

deployReq.on('error', e => console.log('❌ Deploy error:', e.message));
deployReq.write(bodyBuffer);
deployReq.end();

function createFunction() {
  const functionData = JSON.stringify({
    functionId: 'remote',
    name: 'Claude Super Console',
    runtime: 'static-1.0',
    execute: ['any'],
    events: [],
    schedule: '',
    timeout: 15
  });
  
  const createOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': functionData.length,
      'X-Appwrite-Project': '68a4e3da0022f3e129d0',
      'X-Appwrite-Key': process.env.APPWRITE_API_KEY
    }
  };
  
  const createReq = https.request(createOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Create Function Status:', res.statusCode);
      
      if (res.statusCode === 201) {
        console.log('✅ Function created! Retrying deployment...');
        // Retry deployment
        const retryReq = https.request(deployOptions, (retryRes) => {
          let retryData = '';
          retryRes.on('data', chunk => retryData += chunk);
          retryRes.on('end', () => {
            console.log('Retry Deploy Status:', retryRes.statusCode);
            if (retryRes.statusCode >= 200 && retryRes.statusCode < 300) {
              console.log('✅ Retry deployment successful!');
              console.log('🎉 remote.appwrite.network is now live with Super Console!');
            }
          });
        });
        
        retryReq.on('error', e => console.log('❌ Retry error:', e.message));
        retryReq.write(bodyBuffer);
        retryReq.end();
      }
    });
  });
  
  createReq.on('error', e => console.log('❌ Create error:', e.message));
  createReq.write(functionData);
  createReq.end();
}