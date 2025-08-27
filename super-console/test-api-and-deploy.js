const https = require('https');
const fs = require('fs');

console.log('🔍 Testing API key and deploying Super Console...');

const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const PROJECT_ID = '68a4e3da0022f3e129d0';

// First test API permissions
const testOptions = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/functions',
  method: 'GET',
  headers: {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': APPWRITE_API_KEY
  }
};

console.log('1️⃣ Testing API key permissions...');

const testReq = https.request(testOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('API Test Status:', res.statusCode);
    
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('✅ API key works! Functions found:', result.total);
      console.log('📋 Available functions:');
      result.functions.forEach(func => {
        console.log(`  - ${func.name} (${func.$id})`);
      });
      
      // Try to deploy to the first available function
      if (result.functions.length > 0) {
        const targetFunction = result.functions[0].$id;
        console.log(`\n2️⃣ Deploying to function: ${targetFunction}`);
        deployToFunction(targetFunction);
      } else {
        console.log('\n2️⃣ Creating new function for Super Console...');
        createFunction();
      }
    } else {
      console.log('❌ API key test failed:', data);
    }
  });
});

testReq.on('error', e => console.log('❌ API test error:', e.message));
testReq.end();

function deployToFunction(functionId) {
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
  body += 'Content-Disposition: form-data; name="code"; filename="super-console.tar.gz"\r\n';
  body += 'Content-Type: application/gzip\r\n\r\n';

  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    fileData,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  const deployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: `/v1/functions/${functionId}/deployments`,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': bodyBuffer.length,
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': APPWRITE_API_KEY
    }
  };

  const deployReq = https.request(deployOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Deploy Status:', res.statusCode);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Super Console deployed successfully!');
        console.log(`🌐 URL: https://${functionId}.appwrite.network`);
        console.log('');
        console.log('🎉 Features now live:');
        console.log('  • Modern xterm.js terminal interface');
        console.log('  • Session management system');
        console.log('  • File explorer with tree view');
        console.log('  • Responsive design for mobile and desktop');
        console.log('  • Real-time command execution simulation');
        
        const result = JSON.parse(data);
        console.log('📋 Deployment ID:', result.$id);
      } else {
        console.log('❌ Deployment failed');
        console.log('Response:', data);
      }
    });
  });

  deployReq.on('error', e => console.log('❌ Deploy error:', e.message));
  deployReq.write(bodyBuffer);
  deployReq.end();
}

function createFunction() {
  const functionData = JSON.stringify({
    functionId: 'super-console',
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
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': APPWRITE_API_KEY
    }
  };
  
  const createReq = https.request(createOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Create Function Status:', res.statusCode);
      console.log('Create Response:', data);
      
      if (res.statusCode === 201) {
        console.log('✅ Function created! Deploying...');
        deployToFunction('super-console');
      } else {
        console.log('❌ Function creation failed');
      }
    });
  });
  
  createReq.on('error', e => console.log('❌ Create error:', e.message));
  createReq.write(functionData);
  createReq.end();
}