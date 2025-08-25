#!/usr/bin/env node

/**
 * Test OAuth Flow - Trading Post
 * Simulates OAuth initialization to check for platform errors
 */

const https = require('https');

const CONFIG = {
  APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
  PRODUCTION_ORIGIN: 'https://tradingpost.appwrite.network',
  OAUTH_PROVIDER: 'google',
  SUCCESS_URL: 'https://tradingpost.appwrite.network/auth/callback',
  FAILURE_URL: 'https://tradingpost.appwrite.network/auth/error'
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
    req.setTimeout(10000);
    
    if (postData) req.write(postData);
    req.end();
  });
}

async function testOAuthInitialization() {
  log('INFO', '🔐 Testing OAuth initialization flow...');
  log('INFO', `Provider: ${CONFIG.OAUTH_PROVIDER}`);
  log('INFO', `Success URL: ${CONFIG.SUCCESS_URL}`);
  log('INFO', `Failure URL: ${CONFIG.FAILURE_URL}`);
  
  try {
    // Test OAuth session creation endpoint
    const oauthData = {
      provider: CONFIG.OAUTH_PROVIDER,
      success: CONFIG.SUCCESS_URL,
      failure: CONFIG.FAILURE_URL
    };
    
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/account/sessions/oauth2/' + CONFIG.OAUTH_PROVIDER);
    url.searchParams.append('success', CONFIG.SUCCESS_URL);
    url.searchParams.append('failure', CONFIG.FAILURE_URL);
    url.searchParams.append('project', CONFIG.APPWRITE_PROJECT_ID);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'Origin': CONFIG.PRODUCTION_ORIGIN,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    log('INFO', `Testing URL: ${url.toString()}`);
    
    const response = await makeRequest(options);
    
    log('INFO', `Response Status: ${response.statusCode}`);
    log('INFO', `CORS Allow-Origin: ${response.headers['access-control-allow-origin'] || 'MISSING'}`);
    
    if (response.statusCode === 301 || response.statusCode === 302) {
      const redirectLocation = response.headers.location;
      log('SUCCESS', '✅ OAuth redirect working!');
      log('SUCCESS', `✅ Redirect to: ${redirectLocation}`);
      
      if (redirectLocation && redirectLocation.includes('accounts.google.com')) {
        log('SUCCESS', '✅ Successfully redirecting to Google OAuth');
        return { success: true, redirectUrl: redirectLocation };
      } else {
        log('WARNING', '⚠️ Unexpected redirect destination');
        return { success: false, error: 'Unexpected redirect', redirectUrl: redirectLocation };
      }
      
    } else if (response.statusCode === 400) {
      log('ERROR', '❌ OAuth initialization failed');
      log('ERROR', 'Response body:', response.data);
      
      if (response.body && response.body.includes('Invalid URI')) {
        log('ERROR', '❌ Platform registration issue still exists');
        log('ERROR', '🔧 Check that platform hostname is exactly: tradingpost.appwrite.network');
        return { success: false, error: 'Platform registration issue' };
      } else {
        log('ERROR', '❌ Unknown OAuth error');
        return { success: false, error: 'Unknown OAuth error', details: response.data };
      }
      
    } else {
      log('WARNING', `⚠️ Unexpected status: ${response.statusCode}`);
      log('INFO', 'Response:', response.data);
      return { success: false, error: 'Unexpected status', status: response.statusCode };
    }
    
  } catch (error) {
    log('ERROR', `❌ OAuth test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testBasicPlatformHealth() {
  log('INFO', '🏥 Testing basic platform health...');
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/account');
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'Origin': CONFIG.PRODUCTION_ORIGIN
      }
    };
    
    const response = await makeRequest(options);
    const corsOrigin = response.headers['access-control-allow-origin'];
    
    if (corsOrigin === CONFIG.PRODUCTION_ORIGIN) {
      log('SUCCESS', '✅ Platform registration working correctly');
      return true;
    } else if (corsOrigin === 'https://localhost') {
      log('ERROR', '❌ Platform still configured for localhost');
      return false;
    } else {
      log('WARNING', `⚠️ Unexpected CORS origin: ${corsOrigin}`);
      return false;
    }
    
  } catch (error) {
    log('ERROR', `❌ Platform health check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  log('INFO', '🚀 OAUTH FLOW TEST - Trading Post');
  log('INFO', `Target: ${CONFIG.PRODUCTION_ORIGIN}`);
  log('INFO', `Project: ${CONFIG.APPWRITE_PROJECT_ID}`);
  console.log('');
  
  // Step 1: Basic platform health
  const platformHealthy = await testBasicPlatformHealth();
  
  if (!platformHealthy) {
    log('ERROR', '❌ Platform health check failed - cannot test OAuth');
    process.exit(1);
  }
  
  // Step 2: Test OAuth flow
  const oauthResult = await testOAuthInitialization();
  
  // Summary
  log('INFO', '\n📋 OAUTH TEST SUMMARY:');
  log(platformHealthy ? 'SUCCESS' : 'ERROR', `Platform Health: ${platformHealthy ? 'PASS' : 'FAIL'}`);
  log(oauthResult.success ? 'SUCCESS' : 'ERROR', `OAuth Flow: ${oauthResult.success ? 'PASS' : 'FAIL'}`);
  
  if (oauthResult.success) {
    log('SUCCESS', '\n🎉 OAUTH WORKING!');
    log('SUCCESS', '✅ Platform registration successful');
    log('SUCCESS', '✅ OAuth redirects properly configured');
    log('SUCCESS', '✅ Trading Post OAuth should work normally');
    log('INFO', '🔗 Test login: https://tradingpost.appwrite.network');
  } else {
    log('ERROR', '\n💥 OAUTH STILL BLOCKED');
    log('ERROR', `❌ Error: ${oauthResult.error}`);
    if (oauthResult.error === 'Platform registration issue') {
      log('ERROR', '🔧 Double-check platform hostname in Appwrite Console');
      log('ERROR', '   Must be exactly: tradingpost.appwrite.network');
      log('ERROR', '   No https://, no paths, just the domain');
    }
  }
  
  process.exit(oauthResult.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    log('ERROR', `💥 OAuth test failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testOAuthInitialization, testBasicPlatformHealth };