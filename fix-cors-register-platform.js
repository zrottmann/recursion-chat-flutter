#!/usr/bin/env node

/**
 * Fix CORS by Registering Missing Platform Domain
 * Registers 689cb415001a367e69f8.appwrite.global as Web Platform
 */

const https = require('https');

const CONFIG = {
  APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
  APPWRITE_API_KEY: '27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec',
  MISSING_DOMAIN: '689cb415001a367e69f8.appwrite.global'
};

function log(level, message, data = null) {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m', 
    WARNING: '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m'
  };
  
  console.log(`${colors[level]}[${new Date().toISOString()}] ${message}${colors.RESET}`);
  if (data) console.log(JSON.stringify(data, null, 2));
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: body.trim().startsWith('{') ? JSON.parse(body) : body
          });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000);
    
    if (postData) req.write(postData);
    req.end();
  });
}

async function registerMissingPlatform() {
  log('INFO', '🔧 Registering missing platform domain...');
  log('INFO', `Domain: ${CONFIG.MISSING_DOMAIN}`);
  
  try {
    const platformData = {
      type: 'web',
      name: `Trading Post - ${CONFIG.MISSING_DOMAIN}`,
      hostname: CONFIG.MISSING_DOMAIN
    };
    
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/projects/' + CONFIG.APPWRITE_PROJECT_ID + '/platforms');
    const postData = JSON.stringify(platformData);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': CONFIG.APPWRITE_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    
    if (response.statusCode === 201) {
      log('SUCCESS', '✅ Platform registered successfully!');
      log('INFO', 'Platform details:', response.data);
      return true;
    } else if (response.statusCode === 409) {
      log('WARNING', '⚠️ Platform already exists (this is fine)');
      log('INFO', 'Response:', response.data);
      return true;
    } else {
      log('ERROR', `❌ Registration failed: ${response.statusCode}`);
      log('INFO', 'Response:', response);
      return false;
    }
    
  } catch (error) {
    log('ERROR', `❌ Error registering platform: ${error.message}`);
    return false;
  }
}

async function testCORSAfterRegistration() {
  log('INFO', '🧪 Testing CORS after registration...');
  
  // Wait a moment for changes to propagate
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/account');
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'Origin': `https://${CONFIG.MISSING_DOMAIN}`
      }
    };
    
    const response = await makeRequest(options);
    const corsOrigin = response.headers['access-control-allow-origin'];
    
    if (corsOrigin === `https://${CONFIG.MISSING_DOMAIN}`) {
      log('SUCCESS', '✅ CORS now working for registered domain!');
      log('INFO', `CORS Allow-Origin: ${corsOrigin}`);
      return true;
    } else {
      log('WARNING', '⚠️ CORS might need time to propagate');
      log('INFO', `Expected: https://${CONFIG.MISSING_DOMAIN}`);
      log('INFO', `Got: ${corsOrigin || 'null'}`);
      return false;
    }
    
  } catch (error) {
    log('ERROR', `❌ CORS test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('INFO', '🚀 Starting CORS Fix - Platform Registration');
  log('INFO', `Target: ${CONFIG.MISSING_DOMAIN}`);
  log('INFO', `Project: ${CONFIG.APPWRITE_PROJECT_ID}`);
  
  // Step 1: Register the missing platform
  const registered = await registerMissingPlatform();
  
  if (!registered) {
    log('ERROR', '❌ Platform registration failed');
    process.exit(1);
  }
  
  // Step 2: Test CORS after registration
  const corsWorking = await testCORSAfterRegistration();
  
  // Step 3: Provide next steps
  log('INFO', '\n📋 NEXT STEPS:');
  
  if (corsWorking) {
    log('SUCCESS', '✅ CORS fix complete! Trading Post should now work from both domains');
    log('INFO', '🔗 Test URLs:');
    log('INFO', `   • https://tradingpost.appwrite.network (primary - already working)`);
    log('INFO', `   • https://${CONFIG.MISSING_DOMAIN} (secondary - now fixed)`);
  } else {
    log('WARNING', '⚠️ Platform registered but CORS may need time to propagate (up to 5 minutes)');
    log('INFO', '💡 Meanwhile, use the working domain:');
    log('INFO', '   🔗 https://tradingpost.appwrite.network');
  }
  
  log('INFO', '\n🧪 To test:');
  log('INFO', '   1. Open: https://tradingpost.appwrite.network/test-cors.html');
  log('INFO', '   2. Check that all CORS tests pass');
  log('INFO', '   3. Try user registration/login functionality');
  
  log('SUCCESS', '🎉 CORS fix deployment complete!');
}

if (require.main === module) {
  main().catch(error => {
    log('ERROR', `💥 Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { registerMissingPlatform, testCORSAfterRegistration };