const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Deploying Claude Code Remote Chat to super.appwrite.network...');

// Create deployment archive
execSync('tar -czf super-chat.tar.gz index.html package.json');

const FormData = require('form-data');
const form = new FormData();

form.append('code', fs.createReadStream('super-chat.tar.gz'));
form.append('activate', 'true');

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/sites/super-site/deployments',
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
      console.log('📱 Mobile Chat Interface: https://super.appwrite.network');
      console.log('');
      console.log('🎉 Features now live:');
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