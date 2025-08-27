#!/usr/bin/env node

/**
 * Verify Platform Fix - Trading Post CORS
 * Quick verification that platform registration is corrected
 */

const https = require('https');

const CONFIG = {
  APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
  PRODUCTION_ORIGIN: 'https://tradingpost.appwrite.network',
  TEST_ENDPOINT: '/account'
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

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000);
    req.end();
  });
}

async function verifyPlatformFix() {
  log('INFO', '🔍 Verifying Appwrite platform registration fix...');
  log('INFO', `Testing Origin: ${CONFIG.PRODUCTION_ORIGIN}`);
  log('INFO', `Target Endpoint: ${CONFIG.APPWRITE_ENDPOINT}${CONFIG.TEST_ENDPOINT}`);
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + CONFIG.TEST_ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'Origin': CONFIG.PRODUCTION_ORIGIN,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    const corsOrigin = response.headers['access-control-allow-origin'];
    
    log('INFO', `Response Status: ${response.statusCode}`);
    log('INFO', `CORS Allow-Origin: ${corsOrigin || 'MISSING'}`);
    
    // Check if fix is successful
    if (corsOrigin === CONFIG.PRODUCTION_ORIGIN) {
      log('SUCCESS', '✅ PLATFORM FIX SUCCESSFUL!');
      log('SUCCESS', `✅ CORS now allows: ${corsOrigin}`);
      log('SUCCESS', '✅ Trading Post should work normally now');
      
      // Additional verification
      const otherCorsHeaders = {
        allowMethods: response.headers['access-control-allow-methods'],
        allowHeaders: response.headers['access-control-allow-headers'],
        allowCredentials: response.headers['access-control-allow-credentials']
      };
      
      log('INFO', 'Additional CORS headers:', otherCorsHeaders);
      return true;
      
    } else if (corsOrigin === 'https://localhost') {
      log('ERROR', '❌ PLATFORM STILL NOT FIXED');
      log('ERROR', '❌ Appwrite still configured for localhost');
      log('ERROR', '🔧 ACTION REQUIRED: Update platform hostname in Appwrite Console');
      log('ERROR', '   • Go to: https://cloud.appwrite.io/console');
      log('ERROR', '   • Project: Trading Post (689bdee000098bd9d55c)');
      log('ERROR', '   • Settings → Platforms');
      log('ERROR', '   • Edit Web platform');
      log('ERROR', '   • Change hostname: localhost → tradingpost.appwrite.network');
      return false;
      
    } else if (!corsOrigin) {
      log('ERROR', '❌ NO CORS HEADERS FOUND');
      log('ERROR', '❌ Platform may not be registered at all');
      log('ERROR', '🔧 ACTION REQUIRED: Add platform in Appwrite Console');
      return false;
      
    } else {
      log('WARNING', '⚠️ UNEXPECTED CORS ORIGIN');
      log('WARNING', `Expected: ${CONFIG.PRODUCTION_ORIGIN}`);
      log('WARNING', `Got: ${corsOrigin}`);
      log('WARNING', '🔧 ACTION REQUIRED: Verify platform hostname configuration');
      return false;
    }
    
  } catch (error) {
    log('ERROR', `❌ Verification failed: ${error.message}`);
    return false;
  }
}

async function testWithOptionsRequest() {
  log('INFO', '🧪 Testing OPTIONS preflight request...');
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + CONFIG.TEST_ENDPOINT);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': CONFIG.PRODUCTION_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-appwrite-project'
      }
    };
    
    const response = await makeRequest(options);
    const corsOrigin = response.headers['access-control-allow-origin'];
    
    log('INFO', `OPTIONS Status: ${response.statusCode}`);
    log('INFO', `OPTIONS CORS Origin: ${corsOrigin || 'MISSING'}`);
    
    if (corsOrigin === CONFIG.PRODUCTION_ORIGIN) {
      log('SUCCESS', '✅ OPTIONS preflight working correctly');
      return true;
    } else {
      log('ERROR', '❌ OPTIONS preflight blocked');
      return false;
    }
    
  } catch (error) {
    log('ERROR', `❌ OPTIONS test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('INFO', '🚀 PLATFORM FIX VERIFICATION - Trading Post CORS');
  log('INFO', '==================================================');
  
  // Test 1: Basic GET request
  const getSuccess = await verifyPlatformFix();
  
  // Test 2: OPTIONS preflight
  const optionsSuccess = await testWithOptionsRequest();
  
  // Summary
  log('INFO', '\n📋 VERIFICATION SUMMARY:');
  log(getSuccess ? 'SUCCESS' : 'ERROR', `GET Request: ${getSuccess ? 'PASS' : 'FAIL'}`);
  log(optionsSuccess ? 'SUCCESS' : 'ERROR', `OPTIONS Preflight: ${optionsSuccess ? 'PASS' : 'FAIL'}`);
  
  if (getSuccess && optionsSuccess) {
    log('SUCCESS', '\n🎉 PLATFORM FIX VERIFIED!');
    log('SUCCESS', '✅ CORS is now working correctly');
    log('SUCCESS', '✅ Trading Post should function normally');
    log('INFO', '🔗 Test the site: https://tradingpost.appwrite.network');
    process.exit(0);
  } else {
    log('ERROR', '\n💥 PLATFORM STILL NEEDS FIXING');
    log('ERROR', '📋 Required Action: Update Appwrite platform hostname');
    log('ERROR', '🔗 Console: https://cloud.appwrite.io/console');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    log('ERROR', `💥 Verification failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { verifyPlatformFix, testWithOptionsRequest };