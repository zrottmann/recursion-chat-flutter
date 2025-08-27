const https = require('https');
const fs = require('fs');
const readline = require('readline');

console.log('🔧 Fixed Deployment Script');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Interactive setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('This script will help you deploy with the correct credentials.\n');

rl.question('Enter your Appwrite API key: ', (apiKey) => {
  rl.question('Enter your Project ID (default: 68a4e3da0022f3e129d0): ', (projectId) => {
    rl.question('Enter your Site ID (default: 68aa1b51000a9c3a9c36): ', (siteId) => {
      rl.close();
      
      const finalProjectId = projectId || '68a4e3da0022f3e129d0';
      const finalSiteId = siteId || '68aa1b51000a9c3a9c36';
      
      console.log(`\n🎯 Deployment Configuration:`);
      console.log(`   API Key: ${apiKey.substring(0, 20)}...`);
      console.log(`   Project: ${finalProjectId}`);
      console.log(`   Site: ${finalSiteId}\n`);
      
      deployToAppwrite(apiKey, finalProjectId, finalSiteId);
    });
  });
});

function deployToAppwrite(apiKey, projectId, siteId) {
  console.log('📤 Starting deployment...\n');
  
  // Read the deployment package
  const fileData = fs.readFileSync('claude-site.tar.gz');
  const boundary = '----WebKitFormBoundary' + Date.now();
  
  // Create multipart form data
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
  
  // Try Sites API first
  console.log('1️⃣ Trying Sites API deployment...');
  
  const siteOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: `/v1/sites/${siteId}/deployments`,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': bodyBuffer.length,
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  };
  
  const siteReq = https.request(siteOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('   ✅ Sites deployment successful!');
        try {
          const result = JSON.parse(data);
          console.log(`   📋 Deployment ID: ${result.$id}`);
          console.log(`   🌐 Site URL: https://${siteId}.appwrite.global`);
        } catch (e) {
          console.log('   🌐 Deployment successful - check Appwrite Console');
        }
      } else {
        console.log('   ❌ Sites API failed, trying Functions API...');
        tryFunctionsDeployment(apiKey, projectId, bodyBuffer, boundary);
      }
    });
  });
  
  siteReq.on('error', (e) => {
    console.log('   ❌ Sites API error:', e.message);
    console.log('   🔄 Trying Functions API...');
    tryFunctionsDeployment(apiKey, projectId, bodyBuffer, boundary);
  });
  
  siteReq.write(bodyBuffer);
  siteReq.end();
}

function tryFunctionsDeployment(apiKey, projectId, bodyBuffer, boundary) {
  console.log('\n2️⃣ Trying Functions API deployment...');
  
  // First create the function
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
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  };
  
  const createReq = https.request(createOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   Function creation status: ${res.statusCode}`);
      
      // Deploy regardless of creation status (function might already exist)
      deployFunction(apiKey, projectId, bodyBuffer, boundary);
    });
  });
  
  createReq.on('error', e => {
    console.log('   ⚠️  Function creation failed, trying deployment anyway...');
    deployFunction(apiKey, projectId, bodyBuffer, boundary);
  });
  
  createReq.write(functionData);
  createReq.end();
}

function deployFunction(apiKey, projectId, bodyBuffer, boundary) {
  const deployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions/claude-code-ui/deployments',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': bodyBuffer.length,
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  };
  
  const deployReq = https.request(deployOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`   Status: ${res.statusCode}`);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('   ✅ Function deployment successful!');
        console.log('   🌐 Function URL: https://claude-code-ui.appwrite.network');
      } else {
        console.log('   ❌ Function deployment also failed');
        console.log('   Response:', data);
        showManualInstructions();
      }
    });
  });
  
  deployReq.on('error', e => {
    console.log('   ❌ Function deployment error:', e.message);
    showManualInstructions();
  });
  
  deployReq.write(bodyBuffer);
  deployReq.end();
}

function showManualInstructions() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📖 MANUAL DEPLOYMENT INSTRUCTIONS');
  console.log('\n1. Go to https://cloud.appwrite.io/console');
  console.log('2. Select your project');
  console.log('3. Go to Sites or Functions');
  console.log('4. Upload claude-site.tar.gz');
  console.log('5. Set entrypoint: index.html');
  console.log('6. Activate deployment\n');
  console.log('Your package is ready at: claude-site.tar.gz');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}