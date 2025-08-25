#!/usr/bin/env node

/**
 * Ultra Platform Diagnosis Tool for Trading Post CORS Issues
 * Comprehensive analysis of Appwrite project platform configuration
 */

const https = require('https');
const querystring = require('querystring');

// Configuration
const CONFIG = {
  APPWRITE_ENDPOINT: 'https://nyc.cloud.appwrite.io/v1',
  APPWRITE_PROJECT_ID: '689bdee000098bd9d55c',
  APPWRITE_API_KEY: '27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec',
  EXPECTED_DOMAINS: [
    'tradingpost.appwrite.network',
    '689cb415001a367e69f8.appwrite.global',
    'localhost:3000',
    'localhost:5173',
    'localhost:5174'
  ]
};

// Logging utility
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    SUCCESS: '\x1b[32m', // Green
    WARNING: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m',   // Red
    RESET: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
  
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// HTTP request utility with detailed error handling
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          };
          
          // Try to parse JSON if possible
          if (body.trim().startsWith('{') || body.trim().startsWith('[')) {
            try {
              response.data = JSON.parse(body);
            } catch (parseError) {
              response.rawBody = body;
            }
          }
          
          resolve(response);
        } catch (error) {
          reject(new Error(`Response parsing error: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.setTimeout(30000); // 30 second timeout
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test basic Appwrite connectivity
async function testBasicConnectivity() {
  log('INFO', '🔍 Testing basic Appwrite connectivity...');
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/health');
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID,
        'X-Appwrite-Key': CONFIG.APPWRITE_API_KEY,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      log('SUCCESS', '✅ Basic connectivity successful');
      log('INFO', 'Appwrite health check response:', response.data);
      return true;
    } else {
      log('WARNING', `⚠️ Unexpected health check status: ${response.statusCode}`);
      log('INFO', 'Response details:', response);
      return false;
    }
  } catch (error) {
    log('ERROR', `❌ Basic connectivity failed: ${error.message}`);
    return false;
  }
}

// Fetch project details
async function getProjectDetails() {
  log('INFO', '📋 Fetching project details...');
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/projects/' + CONFIG.APPWRITE_PROJECT_ID);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
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
      log('SUCCESS', '✅ Project details retrieved');
      log('INFO', 'Project configuration:', {
        name: response.data.name,
        description: response.data.description,
        team: response.data.teamId,
        platforms: response.data.platforms?.length || 0,
        services: response.data.services || 'Not available'
      });
      return response.data;
    } else {
      log('ERROR', `❌ Failed to get project details: ${response.statusCode}`);
      log('INFO', 'Response:', response);
      return null;
    }
  } catch (error) {
    log('ERROR', `❌ Error fetching project details: ${error.message}`);
    return null;
  }
}

// List all platforms for the project
async function listProjectPlatforms() {
  log('INFO', '🌐 Listing registered platforms...');
  
  try {
    const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/projects/' + CONFIG.APPWRITE_PROJECT_ID + '/platforms');
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
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
        log('INFO', 'Registered platforms:');
        platforms.forEach((platform, index) => {
          log('INFO', `  ${index + 1}. ${platform.name || 'Unnamed'}`, {
            type: platform.type,
            hostname: platform.hostname || platform.domain,
            key: platform.key || platform.$id,
            status: platform.status || 'unknown'
          });
        });
        
        // Check if expected domains are registered
        const registeredDomains = platforms.map(p => p.hostname || p.domain).filter(Boolean);
        const missingDomains = CONFIG.EXPECTED_DOMAINS.filter(domain => 
          !registeredDomains.some(registered => 
            registered === domain || registered.includes(domain.split(':')[0])
          )
        );
        
        if (missingDomains.length > 0) {
          log('WARNING', '⚠️ Missing platform registrations:', missingDomains);
        } else {
          log('SUCCESS', '✅ All expected domains are registered');
        }
        
        return platforms;
      } else {
        log('WARNING', '⚠️ No platforms registered - this explains CORS issues');
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

// Test CORS headers from Appwrite directly
async function testCORSHeaders() {
  log('INFO', '🔍 Testing CORS headers from Appwrite...');
  
  const testOrigins = [
    'https://tradingpost.appwrite.network',
    'https://689cb415001a367e69f8.appwrite.global',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  for (const origin of testOrigins) {
    try {
      log('INFO', `Testing CORS for origin: ${origin}`);
      
      // Test OPTIONS preflight
      const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/account');
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,x-appwrite-project',
          'X-Appwrite-Project': CONFIG.APPWRITE_PROJECT_ID
        }
      };
      
      const response = await makeRequest(options);
      
      const corsHeaders = {
        allowOrigin: response.headers['access-control-allow-origin'],
        allowMethods: response.headers['access-control-allow-methods'],
        allowHeaders: response.headers['access-control-allow-headers'],
        maxAge: response.headers['access-control-max-age']
      };
      
      const corsWorking = corsHeaders.allowOrigin === origin || corsHeaders.allowOrigin === '*';
      
      log(corsWorking ? 'SUCCESS' : 'ERROR', 
          `${corsWorking ? '✅' : '❌'} CORS for ${origin}: ${corsWorking ? 'WORKING' : 'BLOCKED'}`);
      
      if (!corsWorking) {
        log('INFO', `Expected: ${origin}, Got: ${corsHeaders.allowOrigin || 'null'}`);
        log('INFO', 'Full CORS headers:', corsHeaders);
      }
      
    } catch (error) {
      log('ERROR', `❌ CORS test failed for ${origin}: ${error.message}`);
    }
  }
}

// Register missing platforms
async function registerMissingPlatforms(platforms) {
  log('INFO', '🛠️ Checking for missing platform registrations...');
  
  const registeredDomains = platforms ? platforms.map(p => p.hostname || p.domain).filter(Boolean) : [];
  const missingDomains = CONFIG.EXPECTED_DOMAINS.filter(domain => 
    !registeredDomains.some(registered => 
      registered === domain || registered.includes(domain.split(':')[0])
    )
  );
  
  if (missingDomains.length === 0) {
    log('SUCCESS', '✅ All required platforms are already registered');
    return true;
  }
  
  log('WARNING', `⚠️ Found ${missingDomains.length} missing platform registrations`);
  log('INFO', 'Missing domains:', missingDomains);
  
  // Attempt to register missing platforms
  for (const domain of missingDomains) {
    try {
      log('INFO', `Registering platform: ${domain}`);
      
      const platformData = {
        type: 'web',
        name: `Trading Post - ${domain}`,
        hostname: domain
      };
      
      const url = new URL(CONFIG.APPWRITE_ENDPOINT + '/projects/' + CONFIG.APPWRITE_PROJECT_ID + '/platforms');
      const postData = JSON.stringify(platformData);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
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
        log('SUCCESS', `✅ Successfully registered platform: ${domain}`);
      } else {
        log('ERROR', `❌ Failed to register platform ${domain}: ${response.statusCode}`);
        log('INFO', 'Registration response:', response);
      }
      
    } catch (error) {
      log('ERROR', `❌ Error registering platform ${domain}: ${error.message}`);
    }
  }
  
  return true;
}

// Generate comprehensive diagnostic report
async function generateDiagnosticReport(projectDetails, platforms) {
  log('INFO', '📊 Generating comprehensive diagnostic report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    project: {
      id: CONFIG.APPWRITE_PROJECT_ID,
      endpoint: CONFIG.APPWRITE_ENDPOINT,
      name: projectDetails?.name || 'Unknown',
      region: CONFIG.APPWRITE_ENDPOINT.includes('nyc') ? 'NYC' : 'Global'
    },
    platforms: {
      total: platforms?.length || 0,
      registered: platforms?.map(p => ({
        name: p.name,
        hostname: p.hostname || p.domain,
        type: p.type
      })) || [],
      missing: CONFIG.EXPECTED_DOMAINS.filter(domain => 
        !platforms?.some(p => 
          (p.hostname || p.domain) === domain || 
          (p.hostname || p.domain)?.includes(domain.split(':')[0])
        )
      )
    },
    corsStatus: {
      expectedOrigins: CONFIG.EXPECTED_DOMAINS.map(d => d.startsWith('localhost') ? `http://${d}` : `https://${d}`),
      registrationComplete: platforms && platforms.length > 0,
      likelyIssues: []
    }
  };
  
  // Analyze likely issues
  if (!report.platforms.registered.length) {
    report.corsStatus.likelyIssues.push('No platforms registered - complete CORS failure expected');
  }
  
  if (report.platforms.missing.length > 0) {
    report.corsStatus.likelyIssues.push(`Missing ${report.platforms.missing.length} platform registrations`);
  }
  
  if (report.project.region === 'NYC' && report.platforms.registered.length > 0) {
    report.corsStatus.likelyIssues.push('Regional endpoint with platforms registered - should work');
  }
  
  // Generate recommendations
  const recommendations = [];
  
  if (report.platforms.missing.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      action: 'Register missing platforms in Appwrite Console',
      details: `Missing domains: ${report.platforms.missing.join(', ')}`,
      steps: [
        '1. Go to Appwrite Console',
        '2. Select project "Trading Post"',
        '3. Go to Settings → Platforms',
        '4. Click "Add Platform" → "Web App"',
        '5. Add each missing domain as hostname'
      ]
    });
  }
  
  if (report.platforms.registered.length > 0 && report.corsStatus.likelyIssues.includes('Regional endpoint with platforms registered - should work')) {
    recommendations.push({
      priority: 'MEDIUM',
      action: 'Verify CORS test implementation',
      details: 'Platforms are registered, CORS should work - check test code for issues'
    });
  }
  
  report.recommendations = recommendations;
  
  log('SUCCESS', '✅ Diagnostic report generated');
  log('INFO', 'Complete diagnostic report:', report);
  
  return report;
}

// Main diagnosis function
async function runUltraDiagnosis() {
  log('INFO', '🚀 Starting Ultra Platform Diagnosis for Trading Post CORS Issues...');
  log('INFO', `Target Project: ${CONFIG.APPWRITE_PROJECT_ID}`);
  log('INFO', `Endpoint: ${CONFIG.APPWRITE_ENDPOINT}`);
  log('INFO', `Expected Domains: ${CONFIG.EXPECTED_DOMAINS.join(', ')}`);
  
  try {
    // Step 1: Test basic connectivity
    const connectivityOk = await testBasicConnectivity();
    if (!connectivityOk) {
      log('ERROR', '❌ Basic connectivity failed - cannot proceed with diagnosis');
      return false;
    }
    
    // Step 2: Get project details
    const projectDetails = await getProjectDetails();
    
    // Step 3: List registered platforms
    const platforms = await listProjectPlatforms();
    
    // Step 4: Test CORS headers
    await testCORSHeaders();
    
    // Step 5: Register missing platforms if needed
    if (platforms !== null) {
      await registerMissingPlatforms(platforms);
    }
    
    // Step 6: Generate comprehensive report
    const report = await generateDiagnosticReport(projectDetails, platforms);
    
    log('SUCCESS', '✅ Ultra Platform Diagnosis Complete!');
    
    // Summary
    log('INFO', '📋 DIAGNOSIS SUMMARY:');
    log('INFO', `• Project: ${report.project.name} (${report.project.region} region)`);
    log('INFO', `• Registered Platforms: ${report.platforms.total}`);
    log('INFO', `• Missing Platforms: ${report.platforms.missing.length}`);
    log('INFO', `• Recommendations: ${report.recommendations.length}`);
    
    if (report.recommendations.length > 0) {
      log('WARNING', '⚠️ ACTION REQUIRED:');
      report.recommendations.forEach((rec, index) => {
        log('WARNING', `${index + 1}. [${rec.priority}] ${rec.action}`);
        log('INFO', `   ${rec.details}`);
      });
    } else {
      log('SUCCESS', '✅ No issues found - CORS should be working properly');
    }
    
    return true;
    
  } catch (error) {
    log('ERROR', `❌ Ultra diagnosis failed: ${error.message}`);
    return false;
  }
}

// Run the diagnosis
if (require.main === module) {
  runUltraDiagnosis()
    .then(success => {
      if (success) {
        log('SUCCESS', '🎉 Ultra Platform Diagnosis completed successfully');
        process.exit(0);
      } else {
        log('ERROR', '💥 Ultra Platform Diagnosis failed');
        process.exit(1);
      }
    })
    .catch(error => {
      log('ERROR', `💥 Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  runUltraDiagnosis,
  testBasicConnectivity,
  getProjectDetails,
  listProjectPlatforms,
  testCORSHeaders,
  registerMissingPlatforms
};