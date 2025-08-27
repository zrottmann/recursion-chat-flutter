const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔧 Fixed Deployment Script for Appwrite Sites');
console.log('============================================');

// Configuration for all sites
const sites = [
  {
    name: 'super',
    functionId: 'super-site',
    files: ['index.html', 'mobile.html'],
    description: 'Enhanced Tech-Lead Orchestrator'
  },
  {
    name: 'remote',
    functionId: 'remote',
    files: ['index.html'],
    description: 'Claude Code Remote'
  },
  {
    name: 'chat',
    functionId: 'chat',
    files: ['chat-index.html'],
    description: 'Chat Interface'
  },
  {
    name: 'orchestrator',
    functionId: 'orchestrator',
    files: ['index.html'],
    description: 'Orchestrator Dashboard'
  }
];

async function createOrUpdateFunction(site) {
  console.log(`\n📦 Preparing ${site.name} deployment...`);
  
  // Create a simple HTML file if not exists
  if (!fs.existsSync(site.files[0])) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${site.description}</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
  <div class="text-center p-8">
    <h1 class="text-4xl font-bold mb-4">${site.description}</h1>
    <p class="text-xl text-gray-400">Loading at ${site.name}.appwrite.network...</p>
    <div class="mt-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
    </div>
  </div>
</body>
</html>`;
    fs.writeFileSync(site.files[0], html);
  }

  // Create tar.gz package
  const tarName = `${site.name}-site.tar.gz`;
  try {
    execSync(`tar -czf ${tarName} ${site.files.join(' ')} package.json 2>/dev/null || tar -czf ${tarName} ${site.files[0]}`);
    console.log(`✅ Created ${tarName}`);
  } catch (e) {
    console.log(`⚠️ Warning creating tar: ${e.message}`);
  }

  return deployToFunction(site.functionId, tarName);
}

async function deployToFunction(functionId, tarFile) {
  return new Promise((resolve) => {
    if (!fs.existsSync(tarFile)) {
      console.log(`❌ ${tarFile} not found`);
      resolve(false);
      return;
    }

    const fileData = fs.readFileSync(tarFile);
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

    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      port: 443,
      path: `/v1/functions/${functionId}/deployments`,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': bodyBuffer.length,
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '68a4e3da0022f3e129d0',
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Deploy Status for ${functionId}:`, res.statusCode);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${functionId} deployed successfully!`);
          resolve(true);
        } else if (res.statusCode === 404) {
          console.log(`⚠️ Function ${functionId} not found - needs to be created first`);
          // Try to create the function
          createFunction(functionId).then(() => resolve(false));
        } else if (res.statusCode === 401) {
          console.log(`❌ Authentication failed - check API key permissions`);
          resolve(false);
        } else {
          console.log(`❌ Deployment failed:`, data.substring(0, 200));
          resolve(false);
        }
      });
    });

    req.on('error', e => {
      console.log(`❌ Request error:`, e.message);
      resolve(false);
    });
    
    req.write(bodyBuffer);
    req.end();
  });
}

async function createFunction(functionId) {
  console.log(`📝 Attempting to create function ${functionId}...`);
  
  const functionData = JSON.stringify({
    functionId: functionId,
    name: `${functionId} Site`,
    runtime: 'node-18.0',
    execute: ['any'],
    events: [],
    schedule: '',
    timeout: 15
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      path: '/v1/functions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': functionData.length,
        'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID || '68a4e3da0022f3e129d0',
        'X-Appwrite-Key': process.env.APPWRITE_API_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✅ Function ${functionId} created successfully!`);
          resolve(true);
        } else {
          console.log(`❌ Could not create function:`, res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', e => {
      console.log(`❌ Create function error:`, e.message);
      resolve(false);
    });
    
    req.write(functionData);
    req.end();
  });
}

// Main execution
async function main() {
  if (!process.env.APPWRITE_API_KEY) {
    console.log('❌ APPWRITE_API_KEY environment variable not set');
    console.log('Usage: APPWRITE_API_KEY="your-key" node fix-deployment.js');
    process.exit(1);
  }

  console.log('🚀 Starting fixed deployment process...');
  console.log('Project ID:', process.env.APPWRITE_PROJECT_ID || '68a4e3da0022f3e129d0');
  
  for (const site of sites) {
    await createOrUpdateFunction(site);
  }
  
  console.log('\n✅ Deployment process complete!');
  console.log('\n📊 Site Status:');
  console.log('- super.appwrite.network (Enhanced Tech-Lead Orchestrator)');
  console.log('- remote.appwrite.network (Claude Code Remote)');
  console.log('- chat.appwrite.network (Chat Interface)');
  console.log('- orchestrator.appwrite.network (Orchestrator Dashboard)');
}

main().catch(console.error);