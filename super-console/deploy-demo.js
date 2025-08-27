const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying Claude Super Console Demo...');

// Configuration for demo deployment
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT = '68a4e3da0022f3e129d0';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const SITE_ID = 'super';

if (!APPWRITE_API_KEY) {
  console.error('❌ Error: APPWRITE_API_KEY environment variable not set');
  console.log('💡 You can get your API key from Appwrite Console > Settings > API Keys');
  process.exit(1);
}

// Ensure build is available
const buildDir = path.join(__dirname, 'out');
if (!fs.existsSync(buildDir)) {
  console.log('📦 No build found, running build first...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Create deployment package
console.log('📦 Creating deployment package...');
try {
  // Remove any existing deploy package
  if (fs.existsSync('super-console-demo.tar.gz')) {
    fs.unlinkSync('super-console-demo.tar.gz');
  }
  
  execSync(`tar -czf super-console-demo.tar.gz -C ${buildDir} .`, { stdio: 'inherit' });
  console.log('✅ Demo package created');
} catch (error) {
  console.error('❌ Failed to create deployment package:', error.message);
  process.exit(1);
}

// Deploy to Appwrite Sites
console.log('🔄 Uploading to Appwrite Sites...');

const deployData = fs.readFileSync('super-console-demo.tar.gz');
const boundary = '----WebKitFormBoundary' + Date.now();

let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
body += 'index.html\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
body += 'true\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="code"; filename="super-console-demo.tar.gz"\r\n';
body += 'Content-Type: application/gzip\r\n\r\n';

const bodyBuffer = Buffer.concat([
  Buffer.from(body),
  deployData,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: `/v1/sites/${SITE_ID}/deployments`,
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': APPWRITE_PROJECT,
    'X-Appwrite-Key': APPWRITE_API_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ Claude Super Console Demo deployed successfully!');
      console.log('🌐 Demo URL: https://super.appwrite.network');
      console.log('');
      console.log('🎉 Features available in this demo:');
      console.log('  • Modern terminal interface with xterm.js');
      console.log('  • Session management system');
      console.log('  • File explorer with tree view');
      console.log('  • Responsive design for mobile and desktop');
      console.log('  • Real-time command execution simulation');
      console.log('');
      console.log('ℹ️  Note: This is a demo version. To connect to actual Claude API,');
      console.log('   deploy the Appwrite Functions and configure your API keys.');
      
      const result = JSON.parse(data);
      console.log('📋 Deployment ID:', result.$id);
      
      // Clean up
      fs.unlinkSync('super-console-demo.tar.gz');
    } else {
      console.error('❌ Deployment failed:', res.statusCode);
      console.error('Response:', data);
      
      if (res.statusCode === 404) {
        console.log('💡 Tip: Make sure the site "super" exists in your Appwrite project');
        console.log('   You can create it in Appwrite Console > Hosting > Sites');
      }
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(bodyBuffer);
req.end();