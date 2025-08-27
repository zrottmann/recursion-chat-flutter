const https = require('https');
const fs = require('fs');

console.log('🚀 Direct deployment to super.appwrite.network');

// Use SUPER project and key (from the working config)
const CONFIG = {
  projectId: '68a4e3da0022f3e129d0',  // Correct project ID
  siteId: 'super-site',              // Super site ID
  apiKey: 'standard_b7ef639243a1823b1ae6c6aa469027831555a3ffca4fb7dcf0152b5a335c1051a1169b5c54edfe0411c635a5d2332f1da617ed10f2f080cb38c8fd636041db60333b7f53308141f889ed0c66db3cf2be92d9ad59ed73b9ca2a5a147fcfe60f692a43a47f48e30903839c5ca919535e087fe37a14391febf153e23b383a02155f'
};

async function deployChat() {
  try {
    // Create deployment package
    console.log('📦 Creating chat deployment package...');
    
    // Copy chat file as index.html
    fs.copyFileSync('claude-chat.html', 'index.html');
    
    // Create package.json
    const packageJson = {
      "name": "claude-code-ui-chat",
      "version": "1.0.1",
      "description": "Claude Code UI Real-time Chat System",
      "main": "index.html",
      "scripts": {
        "build": "echo 'Static files already built'",
        "start": "echo 'Serving static files'"
      }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    // Create tar.gz package  
    const { execSync } = require('child_process');
    execSync('tar -czf super-chat-deployment.tar.gz index.html package.json CHAT_SETUP_GUIDE.md', { stdio: 'inherit' });
    
    console.log('✅ Package created');
    
    // Deploy to Appwrite Sites
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('code', fs.createReadStream('super-chat-deployment.tar.gz'));
    form.append('activate', 'true');
    
    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      port: 443,
      path: `/v1/sites/${CONFIG.siteId}/deployments`,
      method: 'POST',
      headers: {
        'X-Appwrite-Project': CONFIG.projectId,
        'X-Appwrite-Key': CONFIG.apiKey,
        ...form.getHeaders()
      }
    };
    
    console.log('🌐 Deploying to super.appwrite.network...');
    console.log(`📍 Project: ${CONFIG.projectId}`);
    console.log(`🎯 Site: ${CONFIG.siteId}`);
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('✅ Claude Code UI Chat deployed successfully!');
          console.log('🌐 Live URL: https://super.appwrite.network');
          console.log('📱 Mobile-ready chat interface is now available');
          console.log('');
          console.log('🎉 Features deployed:');
          console.log('• Real-time messaging with WebSocket');
          console.log('• AI-powered chat assistant via Grok API');
          console.log('• Command execution bridge');
          console.log('• Mobile-optimized responsive design');
          console.log('• Security with command sanitization');
          console.log('');
          console.log('📖 Next steps: Configure Appwrite Functions per CHAT_SETUP_GUIDE.md');
          
          try {
            const result = JSON.parse(data);
            console.log('📋 Deployment ID:', result.$id);
          } catch (e) {
            // Response may not be JSON
          }
        } else {
          console.log('❌ Deployment failed');
          console.log('Response:', data);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      process.exit(1);
    });
    
    form.pipe(req);
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    process.exit(1);
  }
}

deployChat();