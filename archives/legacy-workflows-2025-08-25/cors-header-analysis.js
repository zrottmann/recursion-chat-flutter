#!/usr/bin/env node

/**
 * CORS Header Analysis Tool - Trading Post
 * Analyzes actual CORS headers returned by Appwrite
 */

const https = require('https');

// Configuration
const CONFIG = {
  APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
  TEST_ORIGINS: [
    'https://tradingpost.appwrite.network',
    'https://689cb415001a367e69f8.appwrite.global', 
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost'
  ]
};

function log(level, message) {
  const colors = {
    INFO: '\x1b[36m',
    SUCCESS: '\x1b[32m',
    WARNING: '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m'
  };
  console.log(`${colors[level]}${message}${colors.RESET}`);
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

async function testCORSForOrigin(origin) {
  log('INFO', `\n🧪 Testing CORS for origin: ${origin}`);
  
  try {
    // Test 1: Regular GET request
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/account');
    const getOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'Origin': origin
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    const corsOrigin = getResponse.headers['access-control-allow-origin'];
    
    log('INFO', `   GET Request Status: ${getResponse.statusCode}`);
    log('INFO', `   CORS Allow-Origin: ${corsOrigin || 'MISSING'}`);
    log(corsOrigin === origin ? 'SUCCESS' : 'ERROR', 
        `   Origin Match: ${corsOrigin === origin ? '✅ PASS' : '❌ FAIL'}`);
    
    // Test 2: OPTIONS preflight
    const optionsRequest = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-appwrite-project'
      }
    };
    
    try {
      const optionsResponse = await makeRequest(optionsRequest);
      log('INFO', `   OPTIONS Status: ${optionsResponse.statusCode}`);
      log('INFO', `   OPTIONS Allow-Origin: ${optionsResponse.headers['access-control-allow-origin'] || 'MISSING'}`);
      log('INFO', `   OPTIONS Allow-Methods: ${optionsResponse.headers['access-control-allow-methods'] || 'MISSING'}`);
    } catch (optionsError) {
      log('ERROR', `   OPTIONS Request Failed: ${optionsError.message}`);
    }
    
    return {
      origin: origin,
      corsOrigin: corsOrigin,
      matches: corsOrigin === origin,
      status: getResponse.statusCode
    };
    
  } catch (error) {
    log('ERROR', `   Request Failed: ${error.message}`);
    return {
      origin: origin,
      error: error.message,
      matches: false
    };
  }
}

async function analyzeAllOrigins() {
  log('INFO', '🔍 CORS HEADER ANALYSIS FOR TRADING POST');
  log('INFO', `🎯 Target Endpoint: ${CONFIG.APPWRITE_ENDPOINT}`);
  log('INFO', `📋 Project ID: ${CONFIG.APPWRITE_PROJECT_ID}`);
  
  const results = [];
  
  for (const origin of CONFIG.TEST_ORIGINS) {
    const result = await testCORSForOrigin(origin);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }
  
  // Analysis
  log('INFO', '\n📊 ANALYSIS RESULTS:');
  
  const workingOrigins = results.filter(r => r.matches);
  const failingOrigins = results.filter(r => !r.matches && !r.error);
  const errorOrigins = results.filter(r => r.error);
  
  log('SUCCESS', `✅ Working Origins: ${workingOrigins.length}`);
  workingOrigins.forEach(r => log('SUCCESS', `   • ${r.origin}`));
  
  log('ERROR', `❌ Failing Origins: ${failingOrigins.length}`);
  failingOrigins.forEach(r => log('ERROR', `   • ${r.origin} (got: ${r.corsOrigin || 'null'})`));
  
  if (errorOrigins.length > 0) {
    log('WARNING', `⚠️ Error Origins: ${errorOrigins.length}`);
    errorOrigins.forEach(r => log('WARNING', `   • ${r.origin} (${r.error})`));
  }
  
  // Root cause analysis
  log('INFO', '\n🔧 ROOT CAUSE ANALYSIS:');
  
  if (workingOrigins.length === 1 && workingOrigins[0].origin === 'https://localhost') {
    log('WARNING', '⚠️ ISSUE IDENTIFIED: Appwrite platform configured for localhost only');
    log('INFO', '💡 SOLUTION: Update platform registration in Appwrite Console');
    log('INFO', '   1. Go to Appwrite Console → Project → Settings → Platforms');
    log('INFO', '   2. Find the Web platform entry');
    log('INFO', '   3. Update hostname from "localhost" to "tradingpost.appwrite.network"');
    log('INFO', '   4. Add additional platforms for other domains as needed');
  } else if (workingOrigins.length === 0) {
    log('ERROR', '❌ ISSUE: No platforms registered or all misconfigured');
    log('INFO', '💡 SOLUTION: Register platforms in Appwrite Console');
  } else {
    log('SUCCESS', '✅ Some platforms working correctly');
  }
  
  return results;
}

// Run analysis
if (require.main === module) {
  analyzeAllOrigins()
    .then(results => {
      log('SUCCESS', '\n🎉 CORS Header Analysis Complete!');
      
      const needsAction = results.some(r => !r.matches && !r.error);
      if (needsAction) {
        log('WARNING', '⚠️ Action required to fix CORS configuration');
        process.exit(1);
      } else {
        log('SUCCESS', '✅ CORS configuration appears correct');
        process.exit(0);
      }
    })
    .catch(error => {
      log('ERROR', `💥 Analysis failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { analyzeAllOrigins, testCORSForOrigin };