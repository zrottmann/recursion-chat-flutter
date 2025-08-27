const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Claude Code UI to super.appwrite.network...');

// Validate environment variables
if (!process.env.APPWRITE_API_KEY) {
  console.log('❌ APPWRITE_API_KEY not found in environment');
  process.exit(1);
}

console.log('✅ Using API key:', process.env.APPWRITE_API_KEY.substring(0, 20) + '...');

// Change to deployment directory
const deploymentDir = 'C:/Users/Zrott/OneDrive/Desktop/Claude/active-projects/Claude-Code-Remote/appwrite-deployment';
process.chdir(deploymentDir);
console.log('📂 Working in:', process.cwd());

// Create deployment package if needed
const { execSync } = require('child_process');
try {
  execSync('tar -czf claude-ui.tar.gz index.html websocket-integration.js package.json', { stdio: 'inherit' });
  console.log('📦 Created deployment package');
} catch (error) {
  console.log('⚠️ Package creation failed, using existing package');
}

const fileData = fs.readFileSync('claude-ui.tar.gz');
const boundary = '----WebKitFormBoundary' + Date.now();

let body = '';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
body += 'index.html\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
body += 'true\r\n';
body += '--' + boundary + '\r\n';
body += 'Content-Disposition: form-data; name="code"; filename="claude-ui.tar.gz"\r\n';
body += 'Content-Type: application/gzip\r\n\r\n';

const bodyBuffer = Buffer.concat([
  Buffer.from(body),
  fileData,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

console.log('📦 Package size:', bodyBuffer.length, 'bytes');

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  port: 443,
  path: '/v1/functions/super-site/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

console.log('📤 Deploying to super.appwrite.network...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Deploy Status:', res.statusCode);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Claude Code UI deployed successfully!');
      console.log('🌐 Enhanced Multi-Console Chat Interface: https://super.appwrite.network');
      console.log('');
      console.log('🎉 WebSocket Features now live:');
      console.log('  • Real-time WebSocket connections to Claude Code instances');
      console.log('  • Multi-console management with actual remote control');
      console.log('  • Live connection status indicators');
      console.log('  • WebSocket-based command execution and messaging');
      console.log('  • Automatic reconnection with fallback to demo mode');
      console.log('');
      console.log('🎯 Ready for Claude Code WebSocket integration!');
      
      try {
        const result = JSON.parse(data);
        console.log('📋 Deployment ID:', result.$id || 'Success');
      } catch (e) {
        console.log('📋 Deployment successful but could not parse response');
      }
    } else {
      console.log('❌ Deployment failed');
      console.log('Response preview:', data.substring(0, 200));
    }
  });
});

req.on('error', e => console.log('❌ Request error:', e.message));
req.write(bodyBuffer);
req.end();