const https = require('https');
const fs = require('fs');

console.log('🚀 Deploying Claude Code UI Chat as Appwrite Function');

const CONFIG = {
  projectId: '68a4e3da0022f3e129d0',  // Main project
  functionId: 'super-site',          // Deploy as function
  apiKey: 'standard_b7ef639243a1823b1ae6c6aa469027831555a3ffca4fb7dcf0152b5a335c1051a1169b5c54edfe0411c635a5d2332f1da617ed10f2f080cb38c8fd636041db60333b7f53308141f889ed0c66db3cf2be92d9ad59ed73b9ca2a5a147fcfe60f692a43a47f48e30903839c5ca919535e087fe37a14391febf153e23b383a02155f'
};

async function deployAsFunction() {
  try {
    console.log('📦 Preparing function deployment...');
    
    // Copy chat as index.html (main entry point)
    fs.copyFileSync('claude-chat.html', 'index.html');
    
    // Create package.json for function
    const packageJson = {
      "name": "claude-code-ui-chat-function",
      "version": "1.0.1", 
      "description": "Claude Code UI Chat deployed as Appwrite Function",
      "main": "index.html",
      "scripts": {
        "build": "echo 'Static files ready'",
        "start": "echo 'Function serving static chat'"
      }
    };
    
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    
    // Create function deployment archive
    const { execSync } = require('child_process');
    execSync('tar -czf chat-function.tar.gz index.html package.json CHAT_SETUP_GUIDE.md', { stdio: 'inherit' });
    
    console.log('✅ Function package created');
    
    // Deploy as function deployment
    const fileData = fs.readFileSync('chat-function.tar.gz');
    const boundary = '----WebKitFormBoundary' + Date.now();
    
    let body = '';
    body += '--' + boundary + '\\r\\n';
    body += 'Content-Disposition: form-data; name=\"entrypoint\"\\r\\n\\r\\n';
    body += 'index.html\\r\\n';
    body += '--' + boundary + '\\r\\n';
    body += 'Content-Disposition: form-data; name=\"activate\"\\r\\n\\r\\n';
    body += 'true\\r\\n';
    body += '--' + boundary + '\\r\\n';
    body += 'Content-Disposition: form-data; name=\"code\"; filename=\"chat-function.tar.gz\"\\r\\n';
    body += 'Content-Type: application/gzip\\r\\n\\r\\n';
    
    const bodyBuffer = Buffer.concat([
      Buffer.from(body),
      fileData,
      Buffer.from('\\r\\n--' + boundary + '--\\r\\n')
    ]);
    
    const deployOptions = {
      hostname: 'nyc.cloud.appwrite.io',
      port: 443,
      path: `/v1/functions/${CONFIG.functionId}/deployments`,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': bodyBuffer.length,
        'X-Appwrite-Project': CONFIG.projectId,
        'X-Appwrite-Key': CONFIG.apiKey
      }
    };
    
    console.log('🌐 Deploying to super.appwrite.network...');
    console.log(`📍 Project: ${CONFIG.projectId}`);
    console.log(`🎯 Function: ${CONFIG.functionId}`);
    
    const deployReq = https.request(deployOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Deploy Status:', res.statusCode);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Claude Code UI Chat deployed successfully!');
          console.log('🌐 Live URL: https://super.appwrite.network');
          console.log('📱 Real-time chat system is now available');
          console.log('');
          console.log('🎉 Features deployed:');
          console.log('• WebSocket real-time messaging');
          console.log('• AI-powered responses via Grok API');
          console.log('• Command execution bridge for development');
          console.log('• Mobile-optimized responsive interface');
          console.log('• Advanced security with sanitization');
          console.log('');
          console.log('📖 Setup: Configure functions per CHAT_SETUP_GUIDE.md');
          
          try {
            const result = JSON.parse(data);
            console.log('📋 Deployment ID:', result.$id);
          } catch (e) {
            // Response may not be JSON
          }
        } else {
          console.log('❌ Function deployment failed');
          console.log('Response:', data);
          process.exit(1);
        }
      });
    });
    
    deployReq.on('error', (error) => {
      console.error('❌ Deploy request failed:', error.message);
      process.exit(1);
    });
    
    deployReq.write(bodyBuffer);
    deployReq.end();
    
  } catch (error) {
    console.error('❌ Deployment error:', error.message);
    process.exit(1);
  }
}

deployAsFunction();