/**
 * Automated Browser Tests for Trading Post AI Matching
 * Uses Puppeteer to run tests in a headless browser environment
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAutomatedBrowserTests() {
  console.log('🚀 Starting Automated Browser Tests for Trading Post AI Matching');
  console.log('=' .repeat(70));

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Enable console logging from the page
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error') {
        console.log('🔴 Browser Error:', msg.text());
      } else if (type === 'warn') {
        console.log('🟡 Browser Warning:', msg.text());
      } else {
        console.log('🔵 Browser Log:', msg.text());
      }
    });

    // Handle page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // Navigate to the Trading Post app
    console.log('🔗 Navigating to Trading Post application...');
    
    try {
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle0',
        timeout: 30000
      });
      console.log('✅ Successfully loaded Trading Post application');
    } catch (error) {
      console.error('❌ Failed to load application:', error.message);
      console.log('⚠️ Make sure the development server is running on http://localhost:3000');
      return;
    }

    // Wait for the app to initialize
    console.log('⏳ Waiting for application to initialize...');
    await page.waitForTimeout(5000);

    // Check if testing functions are available
    console.log('🔍 Checking for testing functions availability...');
    
    const functionsCheck = await page.evaluate(() => {
      return {
        checkListings: typeof window.checkListings === 'function',
        addFakeListings: typeof window.addFakeListings === 'function',
        testAIMatching: typeof window.testAIMatching === 'function',
        testMatchScoring: typeof window.testMatchScoring === 'function',
        testMatchActions: typeof window.testMatchActions === 'function'
      };
    });

    console.log('🧪 Function availability:', functionsCheck);

    // If functions are not available, try to load them by navigating to different routes
    const availableFunctions = Object.values(functionsCheck).filter(Boolean).length;
    if (availableFunctions === 0) {
      console.log('⚠️ No testing functions found. Attempting to load test utilities...');
      
      // Try to trigger module loading by interacting with the app
      try {
        // Look for login or navigation elements
        const hasLoginButton = await page.$('.btn-login, [data-testid="login"], button:contains("Login")');
        if (hasLoginButton) {
          console.log('🔘 Found login interface, attempting to access marketplace...');
        }
        
        // Wait for any dynamic imports to load
        await page.waitForTimeout(3000);
        
        // Check functions again
        const functionsCheckRetry = await page.evaluate(() => {
          return {
            checkListings: typeof window.checkListings === 'function',
            addFakeListings: typeof window.addFakeListings === 'function', 
            testAIMatching: typeof window.testAIMatching === 'function',
            testMatchScoring: typeof window.testMatchScoring === 'function',
            testMatchActions: typeof window.testMatchActions === 'function'
          };
        });
        
        console.log('🔄 Function availability after retry:', functionsCheckRetry);
        
      } catch (error) {
        console.log('⚠️ Could not trigger function loading:', error.message);
      }
    }

    // Run the comprehensive test suite in the browser
    console.log('🧪 Executing comprehensive test suite...');
    
    const testResults = await page.evaluate(async () => {
      // Initialize test results container
      window.testResults = {
        environment: {},
        database: {},
        aiMatching: {},
        errors: [],
        timestamp: new Date().toISOString()
      };

      // Helper function to run tests safely
      async function runTestSafely(testName, testFunction, ...args) {
        try {
          console.log('Running ' + testName + '...');
          const result = await testFunction(...args);
          window.testResults[testName] = result;
          console.log(testName + ' completed:', result);
          return result;
        } catch (error) {
          console.error(testName + ' failed:', error);
          window.testResults[testName] = { error: error.message, success: false };
          window.testResults.errors.push({
            test: testName,
            error: error.message,
            stack: error.stack
          });
          return { error: error.message, success: false };
        }
      }

      // Test 1: Check Listings
      console.log('1️⃣ Testing checkListings...');
      if (typeof window.checkListings === 'function') {
        await runTestSafely('checkListings', window.checkListings);
      } else {
        console.log('❌ checkListings function not available');
        window.testResults.checkListings = { 
          error: 'Function not available', 
          success: false,
          recommendation: 'Ensure test utilities are properly loaded'
        };
      }

      // Test 2: Add Fake Listings (if needed)
      console.log('2️⃣ Testing addFakeListings...');
      if (typeof window.addFakeListings === 'function') {
        // Only add if we have few items
        const needsData = !window.testResults.checkListings?.success || 
                         (window.testResults.checkListings?.directCheck?.count || 0) < 5;
        
        if (needsData) {
          console.log('📦 Adding fake listings for testing...');
          await runTestSafely('addFakeListings', window.addFakeListings);
        } else {
          console.log('✅ Sufficient data exists, skipping fake listings');
          window.testResults.addFakeListings = { 
            skipped: true, 
            success: true, 
            reason: 'Sufficient test data already exists' 
          };
        }
      } else {
        console.log('❌ addFakeListings function not available');
        window.testResults.addFakeListings = { 
          error: 'Function not available', 
          success: false 
        };
      }

      // Test 3: AI Matching
      console.log('3️⃣ Testing AI Matching...');
      if (typeof window.testAIMatching === 'function') {
        await runTestSafely('testAIMatching', window.testAIMatching);
      } else {
        console.log('❌ testAIMatching function not available');
        window.testResults.testAIMatching = { 
          error: 'Function not available', 
          success: false 
        };
      }

      // Test 4: Match Scoring
      console.log('4️⃣ Testing Match Scoring...');
      if (typeof window.testMatchScoring === 'function') {
        await runTestSafely('testMatchScoring', window.testMatchScoring);
      } else {
        console.log('❌ testMatchScoring function not available');
        window.testResults.testMatchScoring = { 
          error: 'Function not available', 
          success: false 
        };
      }

      // Test 5: Match Actions
      console.log('5️⃣ Testing Match Actions...');
      if (typeof window.testMatchActions === 'function') {
        await runTestSafely('testMatchActions', window.testMatchActions);
      } else {
        console.log('❌ testMatchActions function not available');
        window.testResults.testMatchActions = { 
          error: 'Function not available', 
          success: false 
        };
      }

      // Return all test results
      return window.testResults;
    });

    // Analyze and report results
    console.log('\n📊 AUTOMATED BROWSER TEST RESULTS');
    console.log('=' .repeat(70));
    
    generateDetailedReport(testResults);

  } catch (error) {
    console.error('❌ Critical error in automated browser tests:', error);
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
      console.log('🔚 Browser closed');
    }
  }
}

/**
 * Generate detailed analysis report
 */
function generateDetailedReport(testResults) {
  console.log('\n🧪 TEST EXECUTION SUMMARY:');
  
  // Count test results
  const tests = ['checkListings', 'addFakeListings', 'testAIMatching', 'testMatchScoring', 'testMatchActions'];
  const testStatus = {};
  
  tests.forEach(testName => {
    const result = testResults[testName];
    if (result?.success === true || result?.skipped === true) {
      testStatus[testName] = '✅ PASS';
    } else if (result?.error) {
      testStatus[testName] = '❌ FAIL';
    } else {
      testStatus[testName] = '⚠️ UNKNOWN';
    }
    
    console.log('   ' + testName + ': ' + testStatus[testName]);
  });

  // Database Analysis
  console.log('\n📊 DATABASE ANALYSIS:');
  if (testResults.checkListings?.directCheck) {
    const directCheck = testResults.checkListings.directCheck;
    console.log('   Database Connection: ' + (directCheck.success ? '✅' : '❌'));
    console.log('   Items Available: ' + (directCheck.count || 0));
    
    if (directCheck.success && directCheck.count > 0) {
      console.log('   ✅ Database has sufficient test data');
    } else if (directCheck.success && directCheck.count === 0) {
      console.log('   ⚠️ Database accessible but empty - needs test data');
    } else {
      console.log('   ❌ Database connection issues detected');
    }
  } else {
    console.log('   ❌ Could not assess database status');
  }

  // AI Matching Analysis
  console.log('\n🤖 AI MATCHING ANALYSIS:');
  if (testResults.testAIMatching?.error) {
    console.log('   ❌ AI Matching system failed to execute');
    console.log('   Error: ' + testResults.testAIMatching.error);
  } else if (testResults.testAIMatching) {
    const aiResult = testResults.testAIMatching;
    console.log('   Items Fetch: ' + (aiResult.itemsFetch?.success ? '✅' : '❌'));
    console.log('   Match Generation: ' + (aiResult.basicMatch?.success ? '✅' : '❌'));
    console.log('   Category Matching: ' + (aiResult.categoryMatch?.success ? '✅' : '❌'));
    
    if (aiResult.basicMatch?.matchCount) {
      console.log('   Matches Generated: ' + aiResult.basicMatch.matchCount);
    }
  } else {
    console.log('   ❌ AI Matching tests could not run - function not available');
  }

  // Critical Issues Analysis
  console.log('\n🔧 CRITICAL ISSUES IDENTIFIED:');
  
  const issues = [];
  const solutions = [];

  // Function availability issues
  const missingFunctions = tests.filter(test => 
    testResults[test]?.error === 'Function not available'
  );
  
  if (missingFunctions.length > 0) {
    issues.push('Testing functions not loaded: ' + missingFunctions.join(', '));
    solutions.push('1. Check if utility files (testAIMatching.js, addFakeListings.js, checkListings.js) are properly imported');
    solutions.push('2. Verify functions are exposed to window object for console access');
    solutions.push('3. Ensure React components or services are loading the test utilities');
  }

  // Database issues
  if (!testResults.checkListings?.directCheck?.success) {
    issues.push('Database connectivity failure');
    solutions.push('4. Verify Appwrite project configuration and credentials');
    solutions.push('5. Check CORS settings in Appwrite console for localhost:3000');
    solutions.push('6. Validate database and collection IDs match configuration');
  }

  // Authentication issues
  if (testResults.testAIMatching?.error?.includes('User not authenticated')) {
    issues.push('Authentication required for AI matching tests');
    solutions.push('7. Implement guest/demo mode for testing or provide test authentication');
  }

  // Schema issues
  if (testResults.checkListings?.error?.includes('field')) {
    issues.push('Database schema mismatch');
    solutions.push('8. Update database schema to match service expectations');
    solutions.push('9. Check field mapping utilities for correct field names');
  }

  // Display issues
  if (issues.length > 0) {
    issues.forEach(issue => console.log('   • ' + issue));
  } else {
    console.log('   ✅ No critical issues identified');
  }

  // Solutions
  console.log('\n💡 RECOMMENDED SOLUTIONS:');
  if (solutions.length > 0) {
    solutions.forEach(solution => console.log('   ' + solution));
  } else {
    console.log('   ✅ System appears to be functioning correctly');
  }

  // Performance Assessment
  console.log('\n⚡ PERFORMANCE ASSESSMENT:');
  
  const passedTests = Object.values(testStatus).filter(status => status.includes('PASS')).length;
  const totalTests = tests.length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log('   Success Rate: ' + successRate.toFixed(1) + '% (' + passedTests + '/' + totalTests + ')');
  console.log('   Errors Encountered: ' + (testResults.errors?.length || 0));
  
  if (successRate >= 80) {
    console.log('   Overall Status: ✅ AI Matching system is functional');
  } else if (successRate >= 50) {
    console.log('   Overall Status: ⚠️ AI Matching system has issues but may work partially');
  } else {
    console.log('   Overall Status: ❌ AI Matching system requires significant fixes');
  }

  // Next Steps
  console.log('\n🎯 NEXT STEPS FOR DEVELOPERS:');
  console.log('   1. Address missing function imports and window exposure');
  console.log('   2. Fix database connectivity and schema issues');
  console.log('   3. Test authentication flow for AI matching');
  console.log('   4. Verify all service dependencies are properly configured');
  console.log('   5. Run manual tests in browser console once fixes are applied');

  console.log('\n' + '='.repeat(70));
  console.log('Automated browser tests completed:', new Date().toISOString());
  console.log('='.repeat(70));
}

// Execute the tests
runAutomatedBrowserTests().catch(console.error);