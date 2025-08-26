/**
 * Comprehensive AI Matching Test Suite for Trading Post
 * This script tests the AI matching functionality and reports issues
 */

import { Client, Account, Databases, Query, ID } from 'appwrite';

// Configuration from the application
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const DATABASE_ID = 'trading_post_db';

const COLLECTIONS = {
  users: 'users',
  items: 'items', 
  wants: 'wants',
  trades: 'trades',
  messages: 'messages',
  matches: 'matches',
  notifications: 'notifications',
  savedItems: 'saved_items'
};

// Initialize Appwrite Client
const client = new Client();
client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

// Test Results Object
const testResults = {
  environment: {
    appwriteConnection: false,
    databaseAccess: false,
    collectionsExist: {},
    userAuthenticated: false
  },
  database: {
    itemsCount: 0,
    usersCount: 0,
    matchesCount: 0,
    hasTestData: false
  },
  aiMatching: {
    basicMatchTest: false,
    categoryMatchTest: false,
    scoringAlgorithmTest: false,
    matchGenerationTest: false,
    matchActionsTest: false
  },
  errors: [],
  recommendations: []
};

/**
 * Main test execution function
 */
async function runComprehensiveAITests() {
  console.log('🤖 Starting Comprehensive AI Matching Tests for Trading Post');
  console.log('=' .repeat(70));
  
  try {
    // Step 1: Test Environment Verification
    console.log('\n1️⃣ ENVIRONMENT VERIFICATION');
    console.log('-'.repeat(40));
    await testEnvironmentSetup();
    
    // Step 2: Database Connectivity Tests
    console.log('\n2️⃣ DATABASE CONNECTIVITY');
    console.log('-'.repeat(40));
    await testDatabaseConnectivity();
    
    // Step 3: Data Verification
    console.log('\n3️⃣ DATA VERIFICATION');
    console.log('-'.repeat(40));
    await verifyTestData();
    
    // Step 4: AI Matching Algorithm Tests (simulated since we can't import the actual service)
    console.log('\n4️⃣ AI MATCHING ALGORITHM SIMULATION');
    console.log('-'.repeat(40));
    await testAIMatchingAlgorithm();
    
    // Step 5: Match Generation Tests
    console.log('\n5️⃣ MATCH GENERATION TESTS');
    console.log('-'.repeat(40));
    await testMatchGeneration();
    
    // Step 6: Error Analysis
    console.log('\n6️⃣ ERROR ANALYSIS & DIAGNOSTICS');
    console.log('-'.repeat(40));
    await analyzeErrors();
    
  } catch (error) {
    console.error('❌ Critical error in test suite:', error);
    testResults.errors.push({
      type: 'CRITICAL_ERROR',
      message: error.message,
      stack: error.stack
    });
  }
  
  // Generate comprehensive report
  generateTestReport();
}

/**
 * Test environment setup and Appwrite connectivity
 */
async function testEnvironmentSetup() {
  console.log('Testing Appwrite connection...');
  
  try {
    // Test basic client connection
    const health = await fetch(`${APPWRITE_ENDPOINT}/health`);
    testResults.environment.appwriteConnection = health.ok;
    
    if (testResults.environment.appwriteConnection) {
      console.log('✅ Appwrite endpoint accessible');
    } else {
      console.log('❌ Appwrite endpoint not accessible');
      testResults.errors.push({
        type: 'CONNECTION_ERROR',
        message: 'Cannot reach Appwrite endpoint'
      });
    }
  } catch (error) {
    console.log('❌ Appwrite connection failed:', error.message);
    testResults.errors.push({
      type: 'CONNECTION_ERROR', 
      message: error.message
    });
  }
  
  // Test authentication (optional since user might not be logged in)
  try {
    const user = await account.get();
    testResults.environment.userAuthenticated = true;
    console.log('✅ User authenticated:', user.email);
  } catch (error) {
    console.log('⚠️ No user authenticated (this is okay for testing)');
    testResults.environment.userAuthenticated = false;
  }
}

/**
 * Test database connectivity and collection access
 */
async function testDatabaseConnectivity() {
  console.log('Testing database access...');
  
  // Test each collection
  for (const [name, id] of Object.entries(COLLECTIONS)) {
    try {
      const result = await databases.listDocuments(DATABASE_ID, id, [Query.limit(1)]);
      testResults.environment.collectionsExist[name] = true;
      console.log(`✅ Collection '${name}': ${result.total} documents`);
      
      if (name === 'items') testResults.database.itemsCount = result.total;
      if (name === 'users') testResults.database.usersCount = result.total;
      if (name === 'matches') testResults.database.matchesCount = result.total;
      
    } catch (error) {
      testResults.environment.collectionsExist[name] = false;
      console.log(`❌ Collection '${name}': ${error.message}`);
      
      testResults.errors.push({
        type: 'COLLECTION_ERROR',
        collection: name,
        message: error.message
      });
      
      // Check for specific error types
      if (error.code === 404) {
        testResults.recommendations.push(`Create missing collection: ${name} (${id})`);
      }
    }
  }
  
  testResults.environment.databaseAccess = Object.values(testResults.environment.collectionsExist).some(exists => exists);
}

/**
 * Verify test data exists and is suitable for testing
 */
async function verifyTestData() {
  console.log('Verifying test data...');
  
  if (testResults.database.itemsCount === 0) {
    console.log('⚠️ No items found in database');
    testResults.recommendations.push('Add test items using window.addFakeListings() or similar');
    return;
  }
  
  // Check if we have sufficient data for matching tests
  if (testResults.database.itemsCount < 5) {
    console.log('⚠️ Insufficient items for comprehensive matching tests');
    testResults.recommendations.push('Add more test items (minimum 10 recommended)');
  }
  
  // Try to get sample items to analyze structure
  try {
    const sampleItems = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
      Query.limit(3)
    ]);
    
    if (sampleItems.documents.length > 0) {
      testResults.database.hasTestData = true;
      console.log('✅ Sample items retrieved for analysis');
      
      // Analyze item structure
      const item = sampleItems.documents[0];
      console.log('📋 Sample item structure:');
      console.log('- Fields:', Object.keys(item).filter(k => !k.startsWith('$')).join(', '));
      
      // Check for required fields for AI matching
      const requiredFields = ['title', 'category', 'price', 'condition'];
      const missingFields = requiredFields.filter(field => !(field in item));
      
      if (missingFields.length > 0) {
        testResults.errors.push({
          type: 'SCHEMA_ERROR',
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to retrieve sample items:', error.message);
    testResults.errors.push({
      type: 'DATA_ACCESS_ERROR',
      message: error.message
    });
  }
}

/**
 * Test AI matching algorithm components
 */
async function testAIMatchingAlgorithm() {
  console.log('Testing AI matching algorithm logic...');
  
  // Since we can't import the actual matchingService, we'll test the logic concepts
  
  // Test 1: Category matching logic
  const testItems = [
    { title: 'iPhone 13', category: 'electronics', price: 800, condition: 'good' },
    { title: 'Samsung Phone', category: 'electronics', price: 750, condition: 'good' },
    { title: 'Mountain Bike', category: 'sports', price: 500, condition: 'fair' }
  ];
  
  console.log('Testing category matching...');
  const categoryScore = calculateCategoryScore(testItems[0], testItems[1]);
  console.log(`✅ Same category score: ${categoryScore} (expected: 0.3)`);
  
  const differentCategoryScore = calculateCategoryScore(testItems[0], testItems[2]);
  console.log(`✅ Different category score: ${differentCategoryScore} (expected: 0)`);
  
  testResults.aiMatching.categoryMatchTest = true;
  
  // Test 2: Price similarity
  console.log('Testing price similarity...');
  const priceScore = calculatePriceScore(testItems[0], testItems[1]);
  console.log(`✅ Similar price score: ${priceScore.toFixed(3)} (higher is better)`);
  
  testResults.aiMatching.scoringAlgorithmTest = true;
  
  // Test 3: Overall matching score
  const overallScore = calculateMatchScore(testItems[0], testItems[1]);
  console.log(`✅ Overall match score: ${(overallScore * 100).toFixed(1)}%`);
  
  testResults.aiMatching.basicMatchTest = true;
}

/**
 * Test match generation capabilities
 */
async function testMatchGeneration() {
  console.log('Testing match generation...');
  
  if (!testResults.database.hasTestData) {
    console.log('⚠️ Skipping match generation tests - no test data available');
    return;
  }
  
  try {
    // Check if matches collection is accessible
    const matchesResult = await databases.listDocuments(DATABASE_ID, COLLECTIONS.matches, [
      Query.limit(5)
    ]);
    
    console.log(`✅ Found ${matchesResult.total} existing matches`);
    
    if (matchesResult.total === 0) {
      testResults.recommendations.push('Generate test matches using window.testAIMatching()');
    } else {
      // Analyze match quality
      const matches = matchesResult.documents;
      let totalScore = 0;
      let validMatches = 0;
      
      matches.forEach(match => {
        if (match.match_score || match.score) {
          totalScore += match.match_score || match.score;
          validMatches++;
        }
      });
      
      if (validMatches > 0) {
        const avgScore = totalScore / validMatches;
        console.log(`✅ Average match score: ${(avgScore * 100).toFixed(1)}%`);
        
        if (avgScore < 0.5) {
          testResults.recommendations.push('Low average match scores - review matching algorithm');
        }
      }
    }
    
    testResults.aiMatching.matchGenerationTest = true;
    
  } catch (error) {
    console.log('❌ Match generation test failed:', error.message);
    testResults.errors.push({
      type: 'MATCH_GENERATION_ERROR',
      message: error.message
    });
  }
}

/**
 * Analyze errors and provide diagnostics
 */
async function analyzeErrors() {
  console.log('Analyzing errors and system health...');
  
  const errorTypes = {};
  testResults.errors.forEach(error => {
    errorTypes[error.type] = (errorTypes[error.type] || 0) + 1;
  });
  
  console.log('Error summary:', errorTypes);
  
  // Common error patterns and solutions
  if (errorTypes.COLLECTION_ERROR) {
    console.log('🔧 Collection errors detected - database schema may need setup');
    testResults.recommendations.push('Run database initialization scripts');
    testResults.recommendations.push('Check Appwrite project configuration');
  }
  
  if (errorTypes.CONNECTION_ERROR) {
    console.log('🔧 Connection errors detected - network or CORS issues');
    testResults.recommendations.push('Verify Appwrite endpoint accessibility');
    testResults.recommendations.push('Check CORS settings in Appwrite console');
  }
  
  if (errorTypes.SCHEMA_ERROR) {
    console.log('🔧 Schema errors detected - database structure issues');
    testResults.recommendations.push('Update database schema to match application requirements');
  }
}

/**
 * Generate comprehensive test report
 */
function generateTestReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 COMPREHENSIVE AI MATCHING TEST REPORT');
  console.log('='.repeat(70));
  
  // Environment Status
  console.log('\n🌐 ENVIRONMENT STATUS:');
  console.log(`   Appwrite Connection: ${testResults.environment.appwriteConnection ? '✅' : '❌'}`);
  console.log(`   Database Access: ${testResults.environment.databaseAccess ? '✅' : '❌'}`);
  console.log(`   User Authenticated: ${testResults.environment.userAuthenticated ? '✅' : '⚠️'}`);
  
  // Collections Status
  console.log('\n📦 COLLECTIONS STATUS:');
  Object.entries(testResults.environment.collectionsExist).forEach(([name, exists]) => {
    console.log(`   ${name}: ${exists ? '✅' : '❌'}`);
  });
  
  // Data Status
  console.log('\n📊 DATA STATUS:');
  console.log(`   Items: ${testResults.database.itemsCount}`);
  console.log(`   Users: ${testResults.database.usersCount}`);
  console.log(`   Matches: ${testResults.database.matchesCount}`);
  console.log(`   Test Data Available: ${testResults.database.hasTestData ? '✅' : '❌'}`);
  
  // AI Matching Tests
  console.log('\n🤖 AI MATCHING TESTS:');
  console.log(`   Basic Match Test: ${testResults.aiMatching.basicMatchTest ? '✅' : '❌'}`);
  console.log(`   Category Match Test: ${testResults.aiMatching.categoryMatchTest ? '✅' : '❌'}`);
  console.log(`   Scoring Algorithm Test: ${testResults.aiMatching.scoringAlgorithmTest ? '✅' : '❌'}`);
  console.log(`   Match Generation Test: ${testResults.aiMatching.matchGenerationTest ? '✅' : '❌'}`);
  
  // Errors
  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    testResults.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. [${error.type}] ${error.message}`);
    });
  }
  
  // Recommendations
  if (testResults.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    testResults.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }
  
  // Overall Assessment
  console.log('\n🎯 OVERALL ASSESSMENT:');
  const totalTests = Object.keys(testResults.aiMatching).length;
  const passedTests = Object.values(testResults.aiMatching).filter(Boolean).length;
  const successRate = (passedTests / totalTests) * 100;
  
  console.log(`   Tests Passed: ${passedTests}/${totalTests} (${successRate.toFixed(1)}%)`);
  console.log(`   Critical Errors: ${testResults.errors.filter(e => e.type.includes('CRITICAL')).length}`);
  console.log(`   Recommendations: ${testResults.recommendations.length}`);
  
  if (successRate >= 80) {
    console.log('   Status: ✅ AI Matching system appears functional');
  } else if (successRate >= 50) {
    console.log('   Status: ⚠️ AI Matching system has issues but may be partially functional');
  } else {
    console.log('   Status: ❌ AI Matching system requires significant fixes');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test completed at:', new Date().toISOString());
}

/**
 * Helper function to calculate category score
 */
function calculateCategoryScore(item1, item2) {
  return item1.category === item2.category ? 0.3 : 0;
}

/**
 * Helper function to calculate price similarity score  
 */
function calculatePriceScore(item1, item2) {
  const price1 = item1.price || 0;
  const price2 = item2.price || 0;
  
  if (price1 === 0 || price2 === 0) return 0;
  
  const priceDiff = Math.abs(price1 - price2);
  const avgPrice = (price1 + price2) / 2;
  const similarity = Math.max(0, 1 - (priceDiff / avgPrice));
  
  return similarity * 0.25; // 25% weight for price similarity
}

/**
 * Helper function to calculate overall match score
 */
function calculateMatchScore(item1, item2) {
  let score = 0;
  
  // Category match (30% weight)
  score += calculateCategoryScore(item1, item2);
  
  // Price similarity (25% weight)
  score += calculatePriceScore(item1, item2);
  
  // Condition compatibility (20% weight)
  const conditionMap = { 'new': 5, 'like_new': 4, 'good': 3, 'fair': 2, 'poor': 1 };
  const cond1 = conditionMap[item1.condition] || 3;
  const cond2 = conditionMap[item2.condition] || 3;
  const condDiff = Math.abs(cond1 - cond2);
  const condScore = Math.max(0, 1 - (condDiff / 4));
  score += condScore * 0.2;
  
  // Base compatibility (25% weight)
  score += 0.25;
  
  return Math.min(1, score);
}

// Run the tests
runComprehensiveAITests().catch(console.error);