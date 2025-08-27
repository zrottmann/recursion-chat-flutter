const https = require('https');
const fs = require('fs');

console.log('🚀 Deploying Claude Code as Appwrite Function...');

// First, check if function exists or create it
const functionData = JSON.stringify({
  functionId: 'claude-code-ui',
  name: 'Claude Code Remote & UI',
  runtime: 'node-18.0',
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
      console.log('✅ Function created successfully!');
      deployToFunction();
    } else if (res.statusCode === 409) {
      console.log('ℹ️ Function already exists, deploying...');
      deployToFunction();
    } else {
      console.log('Response:', data);
      // Try deploying anyway
      deployToFunction();
    }
  });
});

createReq.on('error', e => console.log('Create error:', e.message));
createReq.write(functionData);
createReq.end();

function deployToFunction() {
  const fileData = fs.readFileSync('claude-site.tar.gz');
  const boundary = '----WebKitFormBoundary' + Date.now();
  
  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
  body += 'index.html\r\n';
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
  
  const deployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions/claude-code-ui/deployments',
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
        console.log('🌐 Function will be available at: https://claude-code-ui.appwrite.network');
        console.log('📝 Note: Site ID 68aa1b51000a9c3a9c36 may need different permissions');
      } else {
        console.log('❌ Deployment failed');
      }
    });
  });
  
  deployReq.on('error', e => console.log('Deploy error:', e.message));
  deployReq.write(bodyBuffer);
  deployReq.end();
}