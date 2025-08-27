const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🚀 Claude Code UI Chat - Production Deployment');
console.log('================================================');

// Configuration
const CONFIG = {
  appwrite: {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || '68a4e3da0022f3e129d0',
    apiKey: process.env.APPWRITE_API_KEY,
    siteId: 'super' // Deploy to super.appwrite.network
  },
  deployment: {
    name: 'claude-code-ui-chat',
    version: '1.0.0',
    files: [
      'claude-chat.html',
      'package.json',
      'CHAT_SETUP_GUIDE.md'
    ]
  }
};

async function main() {
  try {
    console.log('📋 Pre-deployment checks...');
    await validateEnvironment();
    await checkFiles();
    
    console.log('📦 Creating deployment package...');
    await createDeploymentPackage();
    
    console.log('🌐 Deploying to super.appwrite.network...');
    await deployToAppwrite();
    
    console.log('🔧 Deploying Appwrite Functions...');
    await deployFunctions();
    
    console.log('✅ Deployment completed successfully!');
    printDeploymentSummary();
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

async function validateEnvironment() {
  if (!CONFIG.appwrite.apiKey) {
    throw new Error('APPWRITE_API_KEY environment variable is required');
  }
  
  if (!CONFIG.appwrite.projectId) {
    throw new Error('APPWRITE_PROJECT_ID environment variable is required');
  }
  
  console.log('✓ Environment variables validated');
  console.log(`  Project ID: ${CONFIG.appwrite.projectId}`);
  console.log(`  Site ID: ${CONFIG.appwrite.siteId}`);
}

async function checkFiles() {
  for (const file of CONFIG.deployment.files) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file not found: ${file}`);
    }
  }
  
  console.log('✓ All required files present');
  console.log(`  Files: ${CONFIG.deployment.files.join(', ')}`);
}

async function createDeploymentPackage() {
  // Prepare index.html from claude-chat.html
  if (fs.existsSync('claude-chat.html')) {
    fs.copyFileSync('claude-chat.html', 'index.html');
    console.log('✓ Prepared index.html from claude-chat.html');
  }
  
  // Create or update package.json
  const packageJson = {
    name: CONFIG.deployment.name,
    version: CONFIG.deployment.version,
    description: 'Claude Code UI Real-time Chat Interface',
    main: 'index.html',
    keywords: ['claude-code', 'chat', 'appwrite', 'real-time', 'ai']
  };
  
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log('✓ Updated package.json');
  
  // Create deployment archive
  const { execSync } = require('child_process');
  try {
    execSync('tar --version', { stdio: 'ignore' });
    execSync('tar -czf chat-deployment.tar.gz index.html package.json CHAT_SETUP_GUIDE.md');
    console.log('✓ Created deployment archive with tar');
  } catch (error) {
    // Fallback for Windows without tar
    console.log('⚠ tar not available, creating manual archive...');
    await createManualArchive();
  }
}

async function createManualArchive() {
  // Simple archive creation for environments without tar
  const files = ['index.html', 'package.json', 'CHAT_SETUP_GUIDE.md'];
  const archiveData = {};
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      archiveData[file] = fs.readFileSync(file, 'utf8');
    }
  }
  
  fs.writeFileSync('chat-deployment.json', JSON.stringify(archiveData, null, 2));
  console.log('✓ Created manual deployment package');
}

async function deployToAppwrite() {
  return new Promise((resolve, reject) => {
    let deploymentData;
    
    if (fs.existsSync('chat-deployment.tar.gz')) {
      deploymentData = fs.readFileSync('chat-deployment.tar.gz');
    } else if (fs.existsSync('chat-deployment.json')) {
      deploymentData = fs.readFileSync('chat-deployment.json');
    } else {
      return reject(new Error('No deployment package found'));
    }
    
    const options = {
      hostname: 'nyc.cloud.appwrite.io',
      port: 443,
      path: `/v1/sites/${CONFIG.appwrite.siteId}/deployments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': deploymentData.length,
        'X-Appwrite-Project': CONFIG.appwrite.projectId,
        'X-Appwrite-Key': CONFIG.appwrite.apiKey
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✓ Site deployment successful');
          try {
            const result = JSON.parse(data);
            console.log(`  Deployment ID: ${result.$id || 'unknown'}`);
          } catch (e) {
            console.log('  Deployment completed');
          }
          resolve(data);
        } else {
          console.log(`❌ Site deployment failed (${res.statusCode})`);
          console.log('Response:', data);
          reject(new Error(`Deployment failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    req.write(deploymentData);
    req.end();
  });
}

async function deployFunctions() {
  console.log('📝 Function deployment requires manual setup:');
  console.log('');
  console.log('1. chatroom-function:');
  console.log('   - Deploy from appwrite-functions/chatroom-function/');
  console.log('   - Configure Grok API key and database settings');
  console.log('');
  console.log('2. claude-code-bridge:');
  console.log('   - Deploy from appwrite-functions/claude-code-bridge/');
  console.log('   - Configure Claude Code Remote endpoint if available');
  console.log('');
  console.log('📖 See CHAT_SETUP_GUIDE.md for detailed instructions');
}

function printDeploymentSummary() {
  console.log('');
  console.log('🎉 Claude Code UI Chat Deployment Summary');
  console.log('==========================================');
  console.log('');
  console.log('🌐 Live URL: https://super.appwrite.network');
  console.log('📱 Mobile Ready: Yes');
  console.log('⚡ Real-time: Appwrite Realtime');
  console.log('🤖 AI Assistant: Grok API Integration');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log('1. Configure Appwrite Functions (see CHAT_SETUP_GUIDE.md)');
  console.log('2. Set up database collections');
  console.log('3. Configure environment variables');
  console.log('4. Test real-time functionality');
  console.log('5. Enable Claude Code Remote integration');
  console.log('');
  console.log('📖 Full setup guide: CHAT_SETUP_GUIDE.md');
  console.log('🔍 Monitor: https://cloud.appwrite.io/console');
  console.log('');
  console.log('✨ Features Available:');
  console.log('• Real-time messaging with WebSocket');
  console.log('• AI-powered chat assistant');
  console.log('• Command execution bridge');
  console.log('• File operations and Git integration');
  console.log('• Mobile-optimized responsive design');
  console.log('• Security with command sanitization');
  console.log('• Audit logging and activity tracking');
}

// Cleanup function
function cleanup() {
  const tempFiles = ['chat-deployment.tar.gz', 'chat-deployment.json', 'index.html'];
  tempFiles.forEach(file => {
    if (fs.existsSync(file) && file !== 'index.html') {
      fs.unlinkSync(file);
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Deployment cancelled');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Run deployment
main().finally(() => {
  // Keep index.html but clean up other temp files
  const tempFiles = ['chat-deployment.tar.gz', 'chat-deployment.json'];
  tempFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});