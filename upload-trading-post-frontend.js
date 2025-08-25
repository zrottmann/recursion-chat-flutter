#!/usr/bin/env node
/**
 * Upload Trading Post Frontend to AppWrite Functions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { Client, Functions } = require('node-appwrite');

// Configuration - Use environment variables for security
const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const FUNCTION_ID = process.env.APPWRITE_FUNCTION_ID || 'trading-post-frontend';

// Validate required environment variables
if (!PROJECT_ID || !API_KEY) {
    console.error('❌ Error: Missing required environment variables');
    console.error('   Required: APPWRITE_PROJECT_ID, APPWRITE_API_KEY');
    console.error('   Optional: APPWRITE_ENDPOINT, APPWRITE_FUNCTION_ID');
    process.exit(1);
}

async function buildAndUploadFrontend() {
    console.log('🎨 Building and uploading Trading Post frontend...');
    
    try {
        // Build React app
        console.log('📦 Building React application...');
        process.chdir('trading-app-frontend');
        
        if (!fs.existsSync('node_modules')) {
            console.log('📥 Installing dependencies...');
            execSync('npm install', { stdio: 'inherit' });
        }
        
        console.log('🔨 Building production bundle...');
        execSync('npm run build', { stdio: 'inherit' });
        
        process.chdir('..');
        
        // Create deployment package
        const archiver = require('archiver');
        const output = fs.createWriteStream('frontend-deployment.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        
        // Add built files
        archive.directory('trading-app-frontend/build/', false);
        
        // Add main.js entry point
        const mainJs = `
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    try {
        const filePath = req.path === '/' ? '/index.html' : req.path;
        const fullPath = path.join(__dirname, filePath);
        
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath);
            const ext = path.extname(fullPath);
            
            let contentType = 'text/html';
            if (ext === '.js') contentType = 'application/javascript';
            if (ext === '.css') contentType = 'text/css';
            if (ext === '.json') contentType = 'application/json';
            
            res.send(content, 200, { 'Content-Type': contentType });
        } else {
            // Serve index.html for SPA routing
            const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'));
            res.send(indexContent, 200, { 'Content-Type': 'text/html' });
        }
    } catch (error) {
        res.send('Error: ' + error.message, 500);
    }
};
`;
        
        archive.append(mainJs, { name: 'main.js' });
        
        await archive.finalize();
        
        // Upload to AppWrite
        const client = new Client();
        client.setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
        const functions = new Functions(client);
        
        const deployment = await functions.createDeployment(
            FUNCTION_ID,
            'frontend-deployment.zip',
            true
        );
        
        console.log(`✅ Frontend deployment created: ${deployment.$id}`);
        console.log(`🔗 Frontend URL: ${ENDPOINT.replace('/v1', '')}/v1/functions/${FUNCTION_ID}/executions`);
        
        // Cleanup
        fs.unlinkSync('frontend-deployment.zip');
        
    } catch (error) {
        console.error('❌ Frontend upload failed:', error);
    }
}

if (require.main === module) {
    buildAndUploadFrontend();
}
