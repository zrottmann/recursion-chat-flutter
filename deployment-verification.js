/**
 * Post-Deployment Verification Script
 * Comprehensive testing of all fixes after deployment
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.DEPLOYMENT_URL || 'https://tradingpost.appwrite.network';
const API_TIMEOUT = 10000; // 10 seconds

// Test results collector
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Utility function to log test results
const logTest = (testName, passed, details = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details });
  }
};

// HTTP client setup
const client = axios.create({
  timeout: API_TIMEOUT,
  validateStatus: () => true // Don't throw on HTTP errors
});

async function verifyDeployment() {
  console.log('🚀 Starting Trading Post Deployment Verification...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Test 1: Application Loads
  await testApplicationLoads();
  
  // Test 2: OAuth Callback Routes
  await testOAuthCallbackRoutes();
  
  // Test 3: API Endpoints (No more 404/405 errors)
  await testAPIEndpoints();
  
  // Test 4: Error Handling
  await testErrorHandling();
  
  // Test 5: Static Assets
  await testStaticAssets();
  
  // Test 6: Performance
  await testPerformance();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('DEPLOYMENT VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${testResults.passed}`);
  console.log(`❌ Tests Failed: ${testResults.failed}`);
  console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach(error => {
      console.log(`  • ${error.test}: ${error.details}`);
    });
  }
  
  const allPassed = testResults.failed === 0;
  console.log(`\n🎯 DEPLOYMENT STATUS: ${allPassed ? 'SUCCESS' : 'NEEDS ATTENTION'}`);
  
  return allPassed;
}

async function testApplicationLoads() {
  console.log('📝 Testing Application Loading...');
  
  try {
    const response = await client.get(BASE_URL);
    
    if (response.status === 200) {
      const hasReactApp = response.data.includes('React') || 
                         response.data.includes('root') || 
                         response.data.includes('div id="root"');
      
      logTest('Application loads successfully', true, `Status: ${response.status}`);
      logTest('React app structure present', hasReactApp, hasReactApp ? 'Found React structure' : 'No React structure detected');
    } else {
      logTest('Application loads successfully', false, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('Application loads successfully', false, `Error: ${error.message}`);
  }
}

async function testOAuthCallbackRoutes() {
  console.log('\n📝 Testing OAuth Callback Routes...');
  
  const oauthRoutes = [
    '/auth/callback',
    '/auth/callback?userId=test&secret=test&provider=google',
    '/auth/callback#userId=test&secret=test&provider=google',
    '/oauth/callback',
    '/auth/error'
  ];

  for (const route of oauthRoutes) {
    try {
      const response = await client.get(`${BASE_URL}${route}`);
      
      // OAuth callback routes should not return 404
      const success = response.status !== 404;
      logTest(`OAuth route: ${route}`, success, `Status: ${response.status}`);
    } catch (error) {
      logTest(`OAuth route: ${route}`, false, `Error: ${error.message}`);
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n📝 Testing API Endpoints (Previously 404/405)...');
  
  const criticalEndpoints = [
    { path: '/notifications', method: 'GET', description: 'notifications' },
    { path: '/notifications/settings', method: 'GET', description: 'notification settings' },
    { path: '/memberships/my-membership', method: 'GET', description: 'membership status' },
    { path: '/saved-items', method: 'GET', description: 'saved items' },
    { path: '/matching/user-matches/me', method: 'GET', description: 'user matches' },
    { path: '/users/test-user/profile', method: 'GET', description: 'user profile' },
    { path: '/analytics/user-behavior/test-user', method: 'GET', description: 'user analytics' },
    { path: '/api/listings/search', method: 'POST', description: 'listing search' }
  ];

  for (const endpoint of criticalEndpoints) {
    try {
      let response;
      
      if (endpoint.method === 'GET') {
        response = await client.get(`${BASE_URL}${endpoint.path}`);
      } else if (endpoint.method === 'POST') {
        response = await client.post(`${BASE_URL}${endpoint.path}`, {});
      }
      
      // Should not return 404 or 405 anymore
      const success = response.status !== 404 && response.status !== 405;
      const statusInfo = `Status: ${response.status} (${success ? 'FIXED' : 'STILL BROKEN'})`;
      
      logTest(`API ${endpoint.method} ${endpoint.path}`, success, statusInfo);
    } catch (error) {
      logTest(`API ${endpoint.method} ${endpoint.path}`, false, `Error: ${error.message}`);
    }
  }
}

async function testErrorHandling() {
  console.log('\n📝 Testing Error Handling...');
  
  try {
    // Test 404 error handling
    const response404 = await client.get(`${BASE_URL}/nonexistent-endpoint-${Date.now()}`);
    const handles404 = response404.status === 404; // Should gracefully return 404
    logTest('404 error handling', handles404, `Returns proper 404 status`);
    
    // Test that the app doesn't crash on invalid routes
    const responseInvalid = await client.get(`${BASE_URL}/invalid/route/test`);
    const handlesInvalid = responseInvalid.status !== 500; // Should not crash
    logTest('Invalid route handling', handlesInvalid, `Status: ${responseInvalid.status}`);
    
  } catch (error) {
    logTest('Error handling test', false, `Error: ${error.message}`);
  }
}

async function testStaticAssets() {
  console.log('\n📝 Testing Static Assets...');
  
  const assets = [
    '/favicon.ico',
    '/static/js/main.js', // Vite build files
    '/static/css/main.css'
  ];

  for (const asset of assets) {
    try {
      const response = await client.get(`${BASE_URL}${asset}`);
      const success = response.status === 200;
      logTest(`Static asset: ${asset}`, success, `Status: ${response.status}`);
    } catch (error) {
      logTest(`Static asset: ${asset}`, false, `Error: ${error.message}`);
    }
  }
}

async function testPerformance() {
  console.log('\n📝 Testing Performance...');
  
  const startTime = Date.now();
  
  try {
    const response = await client.get(BASE_URL);
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    const success = loadTime < 5000; // Should load within 5 seconds
    logTest('Page load performance', success, `Load time: ${loadTime}ms`);
    
    // Test if the page is minified (production build)
    const isMinified = response.data.length < 100000 && !response.data.includes('  '); // Basic minification check
    logTest('Production build optimization', isMinified, isMinified ? 'Content appears minified' : 'Content may not be optimized');
    
  } catch (error) {
    logTest('Performance test', false, `Error: ${error.message}`);
  }
}

// Additional test: Verify specific fixes
async function testSpecificFixes() {
  console.log('\n📝 Testing Specific Fixes...');
  
  // Test 1: OAuth callback with hash parameters
  try {
    const hashCallbackResponse = await client.get(`${BASE_URL}/auth/callback#test=1`);
    const handlesHashCallback = hashCallbackResponse.status !== 404;
    logTest('OAuth hash parameter handling', handlesHashCallback, `Status: ${hashCallbackResponse.status}`);
  } catch (error) {
    logTest('OAuth hash parameter handling', false, `Error: ${error.message}`);
  }
  
  // Test 2: User profile creation endpoint
  try {
    const profileResponse = await client.post(`${BASE_URL}/users`, {
      name: 'Test User',
      email: 'test@example.com'
    });
    const handlesProfileCreation = profileResponse.status !== 405 && profileResponse.status !== 404;
    logTest('User profile creation endpoint', handlesProfileCreation, `Status: ${profileResponse.status}`);
  } catch (error) {
    logTest('User profile creation endpoint', false, `Error: ${error.message}`);
  }
}

// Run the verification
if (require.main === module) {
  verifyDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification script failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  verifyDeployment,
  testResults
};