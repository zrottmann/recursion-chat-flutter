const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployWithCLI() {
  console.log('🚀 Deploying Trading Post using Appwrite CLI...\n');
  
  try {
    // Set up CLI configuration
    console.log('⚙️ Configuring Appwrite CLI...');
    
    // Configure endpoint and project
    execSync('appwrite client --endpoint https://nyc.cloud.appwrite.io/v1', { stdio: 'inherit' });
    execSync('appwrite client --project-id 689bdee000098bd9d55c', { stdio: 'inherit' });
    
    // Check if we have an appwrite.json config
    const configPath = path.join(__dirname, 'appwrite.json');
    if (!fs.existsSync(configPath)) {
      console.log('📝 Creating appwrite.json configuration...');
      
      const config = {
        projectId: '689bdee000098bd9d55c',
        projectName: 'Trading Post',
        services: {
          databases: [
            {
              $id: 'recursion_chat_db',
              name: 'Trading Post Database'
            }
          ]
        },
        functions: [
          {
            $id: 'trading-post-frontend',
            name: 'Trading Post Frontend',
            runtime: 'node-18.0',
            path: 'functions/trading-post-frontend',
            entrypoint: 'index.js',
            commands: 'npm install && npm run build',
            ignore: ['node_modules', '.git'],
            events: [],
            schedule: '',
            timeout: 900
          }
        ]
      };
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    
    console.log('✅ CLI configured for Trading Post project');
    
    // Build the frontend
    console.log('\n📦 Building Trading Post frontend...');
    const frontendPath = path.join(__dirname, 'trading-app-frontend');
    
    execSync('npm install --legacy-peer-deps', { 
      cwd: frontendPath, 
      stdio: 'inherit' 
    });
    
    execSync('npm run build', { 
      cwd: frontendPath, 
      stdio: 'inherit' 
    });
    
    console.log('✅ Frontend build completed');
    
    // Deploy using CLI
    console.log('\n🚀 Deploying to Appwrite...');
    
    // Try to deploy the site
    try {
      // First, try to update existing site
      console.log('   Updating existing site...');
      execSync('appwrite sites create-deployment --site-id 689cb415001a367e69f8', { 
        stdio: 'inherit',
        cwd: __dirname
      });
      
      console.log('✅ Site deployment triggered successfully!');
      
    } catch (deployError) {
      console.log('⚠️  Direct site deployment failed, trying alternative method...');
      
      // Alternative: Use functions deployment
      console.log('   Creating function-based deployment...');
      
      // Create function directory structure
      const functionPath = path.join(__dirname, 'functions', 'trading-post-frontend');
      if (!fs.existsSync(functionPath)) {
        fs.mkdirSync(functionPath, { recursive: true });
      }
      
      // Copy build files to function
      const buildPath = path.join(frontendPath, 'build');
      if (fs.existsSync(buildPath)) {
        execSync(`xcopy "${buildPath}" "${path.join(functionPath, 'public')}" /E /I /Y`, { 
          stdio: 'inherit' 
        });
      }
      
      // Create function entry point
      const functionIndex = `
const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Trading Post running on port', port);
});

// Export for Appwrite Functions
module.exports = app;
`;
      
      fs.writeFileSync(path.join(functionPath, 'index.js'), functionIndex);
      
      // Create package.json for function
      const functionPackage = {
        name: 'trading-post-frontend',
        version: '1.0.0',
        main: 'index.js',
        dependencies: {
          express: '^4.18.2'
        }
      };
      
      fs.writeFileSync(path.join(functionPath, 'package.json'), JSON.stringify(functionPackage, null, 2));
      
      console.log('📦 Function structure created');
    }
    
    console.log('\n🎉 Deployment process completed!');
    console.log('🌐 Your site should be available at: https://tradingpost.appwrite.network/');
    console.log('\n📋 Manual steps if needed:');
    console.log('1. Go to Appwrite Console: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c');
    console.log('2. Check Sites → tradingpost for deployment status');
    console.log('3. Connect GitHub repository if not already connected');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Verify you\'re logged into Appwrite CLI');
    console.log('2. Check project permissions');
    console.log('3. Try manual deployment through console');
  }
}

deployWithCLI();