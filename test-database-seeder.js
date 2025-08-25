/**
 * Database Seeder Test Script
 * Tests the comprehensive database seeding functionality
 */

// This script can be run in the browser console to test seeding
console.log('🧪 Database Seeder Test Script Loaded');

// Test functions available globally
window.testDatabaseSeeding = async function() {
  console.log('🌱 Testing Database Seeding...');
  
  try {
    if (typeof window.databaseSeeder === 'undefined') {
      console.error('❌ Database seeder not available. Make sure you\'re logged in and the service is loaded.');
      return false;
    }

    // Test with minimal options
    const testOptions = {
      includeUsers: true,
      includeItems: true,
      includeWants: false,
      includeTrades: true,
      includeMessages: false,
      includeMatches: true,
      includeNotifications: false,
      includeSavedItems: false,
      userCount: 2,
      itemsPerUser: 2,
      wantsPerUser: 1
    };

    console.log('📊 Test options:', testOptions);
    
    const result = await window.databaseSeeder.seedDatabase(testOptions);
    
    if (result.success) {
      console.log('✅ Seeding test PASSED');
      console.log('📈 Results summary:', result.summary);
      return true;
    } else {
      console.error('❌ Seeding test FAILED:', result.error);
      return false;
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    return false;
  }
};

window.testCleanup = async function() {
  console.log('🧹 Testing Cleanup...');
  
  try {
    if (typeof window.databaseSeeder === 'undefined') {
      console.error('❌ Database seeder not available');
      return false;
    }

    const result = await window.databaseSeeder.cleanup();
    
    if (result.success) {
      console.log('✅ Cleanup test PASSED');
      console.log(`🗑️ Deleted ${result.deletedCount} records`);
      return true;
    } else {
      console.error('❌ Cleanup test FAILED:', result.error);
      return false;
    }

  } catch (error) {
    console.error('💥 Cleanup error:', error);
    return false;
  }
};

window.runFullSeederTest = async function() {
  console.log('🎯 Running Full Database Seeder Test Suite...');
  
  try {
    // Step 1: Test seeding
    console.log('\n1️⃣ Testing seeding...');
    const seedResult = await window.testDatabaseSeeding();
    
    if (!seedResult) {
      console.error('❌ Seeding failed, aborting test suite');
      return false;
    }

    // Step 2: Wait a moment
    console.log('\n2️⃣ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Test cleanup
    console.log('\n3️⃣ Testing cleanup...');
    const cleanupResult = await window.testCleanup();
    
    if (!cleanupResult) {
      console.error('❌ Cleanup failed');
      return false;
    }

    console.log('\n🎉 Full test suite PASSED!');
    return true;

  } catch (error) {
    console.error('💥 Test suite error:', error);
    return false;
  }
};

// Instructions
console.log(`
🧪 Database Seeder Test Commands:

1. Test seeding only:
   await testDatabaseSeeding()

2. Test cleanup only:
   await testCleanup()

3. Run full test suite:
   await runFullSeederTest()

Make sure you're logged into the Trading Post application first!
`);