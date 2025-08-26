/**
 * Browser Test Executor for Trading Post AI Matching
 * This script will be executed in the browser console to run the actual tests
 */

// Test execution script that can be pasted into browser console
const browserTestScript = `
console.log('🚀 Starting Trading Post AI Matching Browser Tests');
console.log('=' + '='.repeat(60));

// Test Results Collection
window.testResults = {
  checkListings: null,
  addFakeListings: null, 
  testAIMatching: null,
  testMatchScoring: null,
  testMatchActions: null,
  errors: [],
  timestamp: new Date().toISOString()
};

// Helper function to run tests safely
async function runTestSafely(testName, testFunction, ...args) {
  try {
    console.log(\`\\n🧪 Running \${testName}...\`);
    const result = await testFunction(...args);
    window.testResults[testName] = result;
    console.log(\`✅ \${testName} completed\`, result);
    return result;
  } catch (error) {
    console.error(\`❌ \${testName} failed:\`, error);
    window.testResults[testName] = { error: error.message, success: false };
    window.testResults.errors.push({
      test: testName,
      error: error.message,
      stack: error.stack
    });
    return { error: error.message, success: false };
  }
}

// Main test execution function
async function executeAllTests() {
  console.log('\\n1️⃣ Checking existing listings...');
  
  // Test 1: Check if listings exist
  if (typeof window.checkListings === 'function') {
    await runTestSafely('checkListings', window.checkListings);
  } else {
    console.log('⚠️ window.checkListings not available');
    window.testResults.checkListings = { error: 'Function not available', success: false };
  }
  
  // Test 2: Add fake listings if needed
  console.log('\\n2️⃣ Adding test data if needed...');
  
  if (typeof window.addFakeListings === 'function') {
    // Check if we need to add listings
    if (window.testResults.checkListings?.directCheck?.count === 0 || 
        window.testResults.checkListings?.serviceCheck?.count === 0) {
      console.log('📦 Adding fake listings for testing...');
      await runTestSafely('addFakeListings', window.addFakeListings);
    } else {
      console.log('✅ Sufficient listings already exist, skipping fake data creation');
      window.testResults.addFakeListings = { skipped: true, reason: 'Sufficient data exists' };
    }
  } else {
    console.log('⚠️ window.addFakeListings not available');
    window.testResults.addFakeListings = { error: 'Function not available', success: false };
  }
  
  // Test 3: AI Matching Tests
  console.log('\\n3️⃣ Running AI matching tests...');
  
  if (typeof window.testAIMatching === 'function') {
    await runTestSafely('testAIMatching', window.testAIMatching);
  } else {
    console.log('⚠️ window.testAIMatching not available');
    window.testResults.testAIMatching = { error: 'Function not available', success: false };
  }
  
  // Test 4: Match Scoring Tests
  console.log('\\n4️⃣ Testing match scoring algorithm...');
  
  if (typeof window.testMatchScoring === 'function') {
    await runTestSafely('testMatchScoring', window.testMatchScoring);
  } else {
    console.log('⚠️ window.testMatchScoring not available');
    window.testResults.testMatchScoring = { error: 'Function not available', success: false };
  }
  
  // Test 5: Match Actions Tests
  console.log('\\n5️⃣ Testing match actions...');
  
  if (typeof window.testMatchActions === 'function') {
    await runTestSafely('testMatchActions', window.testMatchActions);
  } else {
    console.log('⚠️ window.testMatchActions not available');
    window.testResults.testMatchActions = { error: 'Function not available', success: false };
  }
  
  // Generate Report
  console.log('\\n📊 GENERATING COMPREHENSIVE REPORT...');
  generateBrowserTestReport();
}

// Report generation function
function generateBrowserTestReport() {
  console.log('\\n' + '='.repeat(70));
  console.log('📊 TRADING POST AI MATCHING TEST REPORT');
  console.log('='.repeat(70));
  
  const results = window.testResults;
  
  // Test Status Summary
  console.log('\\n🧪 TEST STATUS:');
  Object.keys(results).forEach(testName => {
    if (testName === 'errors' || testName === 'timestamp') return;
    
    const result = results[testName];
    let status = '❌ Failed';
    
    if (result?.success === true) status = '✅ Passed';
    else if (result?.success === false) status = '❌ Failed';
    else if (result?.skipped) status = '⏭️ Skipped';
    else if (result?.error) status = '❌ Error';
    else if (result) status = '⚠️ Partial';
    
    console.log(\`   \${testName}: \${status}\`);
  });
  
  // Data Summary
  if (results.checkListings?.directCheck) {
    console.log('\\n📊 DATABASE STATUS:');
    console.log(\`   Items Found: \${results.checkListings.directCheck.count || 0}\`);
    console.log(\`   Direct Access: \${results.checkListings.directCheck.success ? '✅' : '❌'}\`);
    console.log(\`   Service Access: \${results.checkListings.serviceCheck?.success ? '✅' : '❌'}\`);
  }
  
  // AI Matching Results
  if (results.testAIMatching) {
    console.log('\\n🤖 AI MATCHING RESULTS:');
    const matching = results.testAIMatching;
    console.log(\`   Items Fetch: \${matching.itemsFetch?.success ? '✅' : '❌'}\`);
    console.log(\`   Basic Match: \${matching.basicMatch?.success ? '✅' : '❌'}\`);
    console.log(\`   Category Match: \${matching.categoryMatch?.success ? '✅' : '❌'}\`);
    console.log(\`   Match Generation: \${matching.matchGeneration?.success ? '✅' : '❌'}\`);
    
    if (matching.basicMatch?.matchCount) {
      console.log(\`   Matches Generated: \${matching.basicMatch.matchCount}\`);
    }
  }
  
  // Error Analysis
  if (results.errors.length > 0) {
    console.log('\\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach((error, i) => {
      console.log(\`   \${i + 1}. [\${error.test}] \${error.error}\`);
    });
  }
  
  // Specific Issues and Recommendations
  console.log('\\n🔧 SPECIFIC TECHNICAL ISSUES:');
  
  const issues = [];
  const recommendations = [];
  
  // Database connectivity issues
  if (!results.checkListings?.directCheck?.success) {
    issues.push('Database direct access failed');
    recommendations.push('Check Appwrite project configuration and permissions');
  }
  
  if (!results.checkListings?.serviceCheck?.success) {
    issues.push('ItemsService not functioning properly');
    recommendations.push('Check service layer and field mapping utilities');
  }
  
  // AI Matching issues
  if (!results.testAIMatching?.success) {
    issues.push('AI matching algorithm failed to execute');
    recommendations.push('Check matchingService.js implementation');
    recommendations.push('Verify database schema matches service expectations');
  }
  
  if (results.testAIMatching?.basicMatch?.matchCount === 0) {
    issues.push('No matches generated despite having items');
    recommendations.push('Check matching criteria and scoring thresholds');
    recommendations.push('Verify user authentication for match generation');
  }
  
  // Function availability issues
  const missingFunctions = [];
  ['checkListings', 'addFakeListings', 'testAIMatching', 'testMatchScoring', 'testMatchActions'].forEach(fn => {
    if (results[fn]?.error === 'Function not available') {
      missingFunctions.push(fn);
    }
  });
  
  if (missingFunctions.length > 0) {
    issues.push(\`Testing functions not loaded: \${missingFunctions.join(', ')}\`);
    recommendations.push('Ensure utility files are imported and functions exposed to window object');
  }
  
  // Display issues and recommendations
  if (issues.length > 0) {
    issues.forEach((issue, i) => {
      console.log(\`   \${i + 1}. \${issue}\`);
    });
  } else {
    console.log('   No critical issues detected');
  }
  
  console.log('\\n💡 RECOMMENDATIONS:');
  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      console.log(\`   \${i + 1}. \${rec}\`);
    });
  } else {
    console.log('   System appears to be functioning correctly');
  }
  
  // Overall Assessment
  console.log('\\n🎯 OVERALL ASSESSMENT:');
  const testsRun = Object.keys(results).filter(k => k !== 'errors' && k !== 'timestamp').length;
  const testsSuccessful = Object.values(results).filter(r => r?.success === true).length;
  const successRate = testsRun > 0 ? (testsSuccessful / testsRun * 100) : 0;
  
  console.log(\`   Tests Run: \${testsRun}\`);
  console.log(\`   Successful: \${testsSuccessful}\`);
  console.log(\`   Success Rate: \${successRate.toFixed(1)}%\`);
  console.log(\`   Critical Errors: \${results.errors.length}\`);
  
  if (successRate >= 80) {
    console.log('   Status: ✅ AI Matching system is functioning well');
  } else if (successRate >= 50) {
    console.log('   Status: ⚠️ AI Matching system has issues but may work partially');
  } else {
    console.log('   Status: ❌ AI Matching system requires significant fixes');
  }
  
  // Performance Analysis
  if (results.testAIMatching?.basicMatch) {
    const matchResult = results.testAIMatching.basicMatch;
    if (matchResult.matchCount > 0) {
      console.log('\\n⚡ PERFORMANCE ANALYSIS:');
      console.log(\`   Match Generation: Working ✅\`);
      console.log(\`   Matches per Item: \${matchResult.matchCount} (good if > 0)\`);
    }
  }
  
  console.log('\\n' + '='.repeat(70));
  console.log('Browser tests completed at:', new Date().toISOString());
  console.log('Results stored in window.testResults for further analysis');
  console.log('='.repeat(70));
}

// Auto-execute the tests
executeAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  window.testResults.criticalError = error.message;
});
`;

console.log('Created browser test executor script');
console.log('To run the tests:');
console.log('1. Open http://localhost:3000 in your browser');
console.log('2. Open Developer Console (F12)');
console.log('3. Paste and run the following script:');
console.log('');
console.log(browserTestScript);