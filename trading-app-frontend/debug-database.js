/**
 * Debug script to test Trading Post database connection
 * Run this in browser console to test database access
 */

// Test database connectivity
async function testDatabaseConnection() {
  console.log('🔍 Testing Trading Post database connection...');
  
  try {
    // Import the required modules
    const { databases, DATABASE_ID, COLLECTIONS, Query } = await import('./src/lib/appwrite.js');
    
    console.log('✅ Appwrite modules imported successfully');
    console.log('📊 Database ID:', DATABASE_ID);
    console.log('📦 Collections:', COLLECTIONS);
    
    // Test 1: List items without any filters
    console.log('\n🧪 Test 1: Basic items query...');
    try {
      const basicQuery = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
        Query.limit(5)
      ]);
      console.log('✅ Basic query successful:', basicQuery.documents.length, 'items found');
      if (basicQuery.documents.length > 0) {
        console.log('📝 Sample item fields:', Object.keys(basicQuery.documents[0]));
        console.log('📝 Sample item:', basicQuery.documents[0]);
      }
    } catch (error) {
      console.error('❌ Basic query failed:', error);
    }
    
    // Test 2: Test with active status filter
    console.log('\n🧪 Test 2: Active items query...');
    try {
      const activeQuery = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
        Query.equal('status', 'active'),
        Query.limit(5)
      ]);
      console.log('✅ Active query successful:', activeQuery.documents.length, 'active items found');
    } catch (error) {
      console.error('❌ Active query failed:', error);
      console.log('💡 Trying alternative status field names...');
      
      // Try with is_active
      try {
        const isActiveQuery = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
          Query.equal('is_active', true),
          Query.limit(5)
        ]);
        console.log('✅ is_active query successful:', isActiveQuery.documents.length, 'items found');
      } catch (error2) {
        console.error('❌ is_active query also failed:', error2);
      }
    }
    
    // Test 3: Test sorting
    console.log('\n🧪 Test 3: Sorting test...');
    try {
      const sortQuery = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
        Query.orderDesc('$createdAt'),
        Query.limit(3)
      ]);
      console.log('✅ Sort query successful:', sortQuery.documents.length, 'items found');
    } catch (error) {
      console.error('❌ Sort query failed:', error);
      
      // Try alternative sort fields
      try {
        const altSortQuery = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
          Query.orderDesc('createdAt'),
          Query.limit(3)
        ]);
        console.log('✅ Alternative sort successful:', altSortQuery.documents.length, 'items found');
      } catch (error2) {
        console.error('❌ Alternative sort also failed:', error2);
      }
    }
    
    // Test 4: Collection existence check
    console.log('\n🧪 Test 4: Collection metadata...');
    try {
      // Just try to list with minimal params to verify collection exists
      const existenceTest = await databases.listDocuments(DATABASE_ID, COLLECTIONS.items);
      console.log('✅ Collection exists and accessible. Total items:', existenceTest.total);
    } catch (error) {
      console.error('❌ Collection might not exist or be accessible:', error);
    }
    
  } catch (importError) {
    console.error('❌ Failed to import Appwrite modules:', importError);
  }
}

// Make it available globally for browser console testing
window.testDatabaseConnection = testDatabaseConnection;

console.log('🎮 Debug script loaded. Run testDatabaseConnection() in console to test database access.');