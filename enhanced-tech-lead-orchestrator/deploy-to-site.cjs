const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Deploying Claude Code Remote Chat to chat.appwrite.network...');
console.log('📍 Using site ID: 68aa1b51000a9c3a9c36');

// Create package.json
const packageJson = {
  name: 'claude-code-remote-chat',
  version: '1.0.0',
  description: 'Mobile chat interface for Claude Code Remote'
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

// Copy chat interface as index.html and create archive
execSync('cp chat-index.html index.html');
execSync('tar -czf chat-site.tar.gz index.html package.json');

console.log('📱 Deploying mobile chat interface...');

const FormData = require('form-data');
const form = new FormData();

form.append('code', fs.createReadStream('chat-site.tar.gz'));
form.append('activate', 'true');

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/sites/68aa1b51000a9c3a9c36/deployments',
  method: 'POST',
  headers: {
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY,
    ...form.getHeaders()
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    
    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('✅ Claude Code Remote Chat deployed successfully!');
      console.log('📱 Mobile Chat URL: https://chat.appwrite.network');
      console.log('');
      console.log('🎉 Features deployed:');
      console.log('  • Mobile-optimized responsive chat interface');
      console.log('  • Real-time messaging with typing indicators');  
      console.log('  • Quick action buttons for common commands');
      console.log('  • Auto-resizing text input and smooth animations');
      console.log('  • Demo mode with realistic Claude Code responses');
      console.log('  • Contextual help and setup instructions');
      console.log('');
      console.log('💡 Ready for integration with actual Claude Code Remote!');
      
      try {
        const result = JSON.parse(data);
        console.log('📋 Deployment ID:', result.$id);
      } catch (e) {
        console.log('📋 Deployment completed successfully');
      }
    } else {
      console.log('❌ Deployment failed');
      console.log('Response:', data);
    }
  });
});

req.on('error', e => console.error('❌ Request error:', e.message));
form.pipe(req);