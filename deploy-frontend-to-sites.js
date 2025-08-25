#!/usr/bin/env node
/**
 * Deploy Trading Post Frontend to AppWrite Sites
 * Automated deployment script for the React frontend
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
    projectId: '689bdee000098bd9d55c',
    endpoint: 'https://cloud.appwrite.io/v1',
    apiKey: process.env.APPWRITE_API_KEY,
    buildDir: './trading-app-frontend/dist',
    siteName: 'Trading Post Enhanced'
};

console.log('🚀 Starting Trading Post Frontend Deployment to AppWrite Sites...');

/**
 * Verify prerequisites
 */
function verifyPrerequisites() {
    console.log('🔍 Verifying prerequisites...');
    
    // Check for API key
    if (!config.apiKey) {
        console.error('❌ APPWRITE_API_KEY environment variable not set');
        console.log('Please set your AppWrite API key:');
        console.log('export APPWRITE_API_KEY="your-api-key-here"');
        process.exit(1);
    }
    
    // Check if build directory exists
    if (!fs.existsSync(config.buildDir)) {
        console.error(`❌ Build directory not found: ${config.buildDir}`);
        console.log('Running frontend build...');
        
        try {
            process.chdir('./trading-app-frontend');
            execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
            execSync('npm run build:prod', { stdio: 'inherit' });
            process.chdir('..');
            console.log('✅ Frontend build completed');
        } catch (error) {
            console.error('❌ Frontend build failed:', error.message);
            process.exit(1);
        }
    }
    
    console.log('✅ Prerequisites verified');
}

/**
 * Deploy using AppWrite CLI
 */
function deployToSites() {
    console.log('📤 Deploying to AppWrite Sites...');
    
    try {
        // Configure AppWrite CLI
        const appwriteConfig = {
            projectId: config.projectId,
            projectName: 'Trading Post Enhanced',
            buildSettings: {
                buildCommand: 'npm run build:prod',
                outputDirectory: 'dist',
                nodeVersion: '18',
                installCommand: 'npm install --legacy-peer-deps'
            }
        };
        
        // Write temporary appwrite.json
        fs.writeFileSync('./appwrite-deployment.json', JSON.stringify(appwriteConfig, null, 2));
        
        // Set AppWrite configuration
        process.env.APPWRITE_CLI_PROJECT_ID = config.projectId;
        process.env.APPWRITE_CLI_ENDPOINT = config.endpoint;
        
        // Deploy command
        const deployCommand = `appwrite deploy function --function-id=frontend-site`;
        
        console.log('Executing deployment command...');
        execSync(deployCommand, { 
            stdio: 'inherit',
            env: {
                ...process.env,
                APPWRITE_CLI_PROJECT_ID: config.projectId,
                APPWRITE_CLI_ENDPOINT: config.endpoint,
                APPWRITE_CLI_API_KEY: config.apiKey
            }
        });
        
        console.log('✅ Frontend deployed to AppWrite Sites successfully!');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        // Try alternative deployment using curl
        console.log('🔄 Trying alternative deployment method...');
        deployWithCurl();
    }
}

/**
 * Alternative deployment using curl/API calls
 */
function deployWithCurl() {
    console.log('📡 Deploying using AppWrite API...');
    
    try {
        // Create a tar.gz of the build directory
        const tarCommand = `cd ${config.buildDir} && tar -czf ../frontend-build.tar.gz *`;
        execSync(tarCommand);
        
        console.log('✅ Build archive created');
        
        // Use curl to deploy (this is a simplified example)
        // In reality, you'd need to use the proper AppWrite API endpoints
        const curlCommand = `
            curl -X POST \\
            ${config.endpoint}/projects/${config.projectId}/sites \\
            -H "X-Appwrite-Project: ${config.projectId}" \\
            -H "X-Appwrite-Key: ${config.apiKey}" \\
            -H "Content-Type: application/json" \\
            -d '{"name": "${config.siteName}"}'
        `;
        
        console.log('API deployment method would require additional implementation...');
        console.log('Manual deployment recommended via AppWrite Console.');
        
    } catch (error) {
        console.error('❌ Alternative deployment failed:', error.message);
        showManualInstructions();
    }
}

/**
 * Show manual deployment instructions
 */
function showManualInstructions() {
    console.log('\n📋 Manual Deployment Instructions:');
    console.log('=======================================');
    console.log('1. Go to https://cloud.appwrite.io/console');
    console.log(`2. Open project: ${config.projectId}`);
    console.log('3. Navigate to "Hosting" → "Sites"');
    console.log('4. Click "Create Site"');
    console.log(`5. Upload the build directory: ${path.resolve(config.buildDir)}`);
    console.log('6. Configure the domain and settings');
    console.log('\n🔧 Build Configuration:');
    console.log('- Build Command: npm run build:prod');
    console.log('- Output Directory: dist');
    console.log('- Node Version: 18');
    console.log('- Install Command: npm install --legacy-peer-deps');
    console.log('\n✨ Your enhanced Trading Post app is ready for deployment!');
}

/**
 * Main deployment function
 */
function main() {
    try {
        verifyPrerequisites();
        
        // Show deployment info
        console.log('\n📊 Deployment Configuration:');
        console.log(`Project ID: ${config.projectId}`);
        console.log(`Endpoint: ${config.endpoint}`);
        console.log(`Build Directory: ${config.buildDir}`);
        console.log(`Site Name: ${config.siteName}`);
        
        // For now, show manual instructions since API deployment requires more setup
        console.log('\n🎯 Frontend build is ready for deployment!');
        showManualInstructions();
        
        // Check if files are ready
        const distFiles = fs.readdirSync(config.buildDir);
        console.log(`\n📁 Build contains ${distFiles.length} files:`);
        console.log(distFiles.slice(0, 10).join(', ') + (distFiles.length > 10 ? '...' : ''));
        
        console.log('\n✅ Frontend deployment preparation completed!');
        
    } catch (error) {
        console.error('❌ Deployment preparation failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, config };