const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying Claude Super Console to Appwrite Sites...');

// Configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT = '68a4e3da0022f3e129d0';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const SITE_ID = 'super-console';

if (!APPWRITE_API_KEY) {
  console.error('❌ Error: APPWRITE_API_KEY environment variable not set');
  process.exit(1);
}

// Build the Next.js app
console.log('📦 Building Next.js application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Create deployment package
console.log('📦 Creating deployment package...');
const deployDir = path.join(__dirname, 'out');

if (!fs.existsSync(deployDir)) {
  console.error('❌ Build output directory not found. Make sure to run "npm run build" first');
  process.exit(1);
}

// Create tar.gz of the out directory
try {
  execSync(`tar -czf deploy.tar.gz -C ${deployDir} .`, { stdio: 'inherit' });
  console.log('✅ Deployment package created');
} catch (error) {
  console.error('❌ Failed to create deployment package:', error.message);
  process.exit(1);
}

// Deploy to Appwrite Sites
console.log('📤 Uploading to Appwrite Sites...');

const deployData = fs.readFileSync('deploy.tar.gz');
const boundary = '----WebKitFormBoundary' + Date.now();

let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
body += 'index.html\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
body += 'true\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="code"; filename="deploy.tar.gz"\r\n';
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
      console.log('✅ Deployment successful!');
      console.log('🌐 Your app is live at: https://super-console.appwrite.network');
      const result = JSON.parse(data);
      console.log('📋 Deployment ID:', result.$id);
      
      // Clean up
      fs.unlinkSync('deploy.tar.gz');
    } else {
      console.error('❌ Deployment failed:', res.statusCode);
      console.error('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.write(bodyBuffer);
req.end();