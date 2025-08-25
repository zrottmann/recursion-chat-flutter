#!/usr/bin/env node

/**
 * Check All Registered Platforms - Trading Post
 * Lists all platforms to verify OAuth platform registration
 */

const https = require('https');

const CONFIG = {
  APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
  APPWRITE_API_KEY: '27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec',
  TARGET_DOMAIN: 'tradingpost.appwrite.network'
};

function log(level, message, data = null) {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    ERROR: '\x1b[31m',
    WARNING: '\x1b[33m',
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

async function listAllPlatforms() {
  log('INFO', '📋 Listing all registered platforms...');
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/projects/' + CONFIG.APPWRITE_PROJECT_ID + '/platforms');
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': CONFIG.APPWRITE_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.data) {
      const platforms = response.data.platforms || response.data.documents || [];
      
      log('SUCCESS', `✅ Found ${platforms.length} registered platforms`);
      
      if (platforms.length > 0) {
        log('INFO', '\n📋 REGISTERED PLATFORMS:');
        platforms.forEach((platform, index) => {
          const hostname = platform.hostname || platform.domain;
          const isTarget = hostname === CONFIG.TARGET_DOMAIN;
          
          log(isTarget ? 'SUCCESS' : 'INFO', `${index + 1}. ${platform.name || 'Unnamed Platform'}`);
          log('INFO', `   • Type: ${platform.type}`);
          log('INFO', `   • Hostname: ${hostname}`);
          log('INFO', `   • ID: ${platform.$id || platform.key}`);
          log('INFO', `   • Created: ${platform.$createdAt || 'unknown'}`);
          
          if (isTarget) {
            log('SUCCESS', '   ✅ MATCHES TARGET DOMAIN');
          }
          console.log('');
        });
        
        // Check if target domain is registered
        const targetRegistered = platforms.some(p => 
          (p.hostname || p.domain) === CONFIG.TARGET_DOMAIN
        );
        
        if (targetRegistered) {
          log('SUCCESS', `✅ Target domain '${CONFIG.TARGET_DOMAIN}' is registered`);
          log('INFO', '🔍 OAuth should work if Google Cloud Console is configured correctly');
        } else {
          log('ERROR', `❌ Target domain '${CONFIG.TARGET_DOMAIN}' NOT registered`);
          log('ERROR', '🔧 ACTION REQUIRED: Add platform for OAuth functionality');
        }
        
        return platforms;
      } else {
        log('WARNING', '⚠️ No platforms registered');
        return [];
      }
    } else {
      log('ERROR', `❌ Failed to list platforms: ${response.statusCode}`);
      log('INFO', 'Response:', response);
      return null;
    }
  } catch (error) {
    log('ERROR', `❌ Error listing platforms: ${error.message}`);
    return null;
  }
}

async function registerOAuthPlatform() {
  log('INFO', `🔧 Attempting to register OAuth platform: ${CONFIG.TARGET_DOMAIN}`);
  
  try {
    const platformData = {
      type: 'web',
      name: `Trading Post OAuth - ${CONFIG.TARGET_DOMAIN}`,
      hostname: CONFIG.TARGET_DOMAIN
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
      log('SUCCESS', '✅ OAuth platform registered successfully!');
      log('INFO', 'Platform details:', response.data);
      return true;
    } else if (response.statusCode === 409) {
      log('WARNING', '⚠️ Platform already exists (this is fine)');
      return true;
    } else if (response.statusCode === 401) {
      log('ERROR', '❌ Registration failed: Unauthorized (API key issue)');
      log('ERROR', '🔧 Manual registration required via Appwrite Console');
      return false;
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

async function main() {
  log('INFO', '🚀 PLATFORM REGISTRATION CHECK - Trading Post OAuth');
  log('INFO', `Target Domain: ${CONFIG.TARGET_DOMAIN}`);
  log('INFO', `Project ID: ${CONFIG.APPWRITE_PROJECT_ID}`);
  console.log('');
  
  // Step 1: List current platforms
  const platforms = await listAllPlatforms();
  
  if (platforms === null) {
    log('ERROR', '❌ Could not retrieve platform list');
    process.exit(1);
  }
  
  // Step 2: Check if target domain is registered
  const targetRegistered = platforms && platforms.some(p => 
    (p.hostname || p.domain) === CONFIG.TARGET_DOMAIN
  );
  
  if (targetRegistered) {
    log('SUCCESS', '\n🎉 OAuth platform already registered!');
    log('SUCCESS', '✅ Trading Post OAuth should work');
    log('INFO', '🔗 Test OAuth: https://tradingpost.appwrite.network');
  } else {
    log('WARNING', '\n⚠️ OAuth platform missing - attempting to register...');
    
    // Step 3: Try to register OAuth platform
    const registered = await registerOAuthPlatform();
    
    if (registered) {
      log('SUCCESS', '\n🎉 OAuth platform registration complete!');
      log('SUCCESS', '✅ Trading Post OAuth should now work');
      log('INFO', '🔗 Test OAuth: https://tradingpost.appwrite.network');
    } else {
      log('ERROR', '\n💥 Automatic registration failed');
      log('ERROR', '🔧 MANUAL ACTION REQUIRED:');
      log('ERROR', '   1. Go to: https://cloud.appwrite.io/console');
      log('ERROR', `   2. Project: ${CONFIG.APPWRITE_PROJECT_ID}`);
      log('ERROR', '   3. Settings → Platforms → Add Platform → Web App');
      log('ERROR', `   4. Hostname: ${CONFIG.TARGET_DOMAIN}`);
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    log('ERROR', `💥 Check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { listAllPlatforms, registerOAuthPlatform };