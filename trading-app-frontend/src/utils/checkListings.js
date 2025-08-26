/**
 * Check Listings Debug Utility
 * Verifies what items exist in the database
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';
import itemsService from '../services/itemsService';
import { smartDatabases } from './fixDatabaseSchema';

export async function checkListings() {
  console.log('🔍 Checking database for listings...\n');
  
  const results = {
    directCheck: null,
    serviceCheck: null,
    smartDbCheck: null
  };
  
  // Method 1: Direct Appwrite SDK check
  try {
    console.log('1️⃣ Direct Appwrite SDK check...');
    const directResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.items,
      [
        Query.limit(100)
      ]
    );
    
    results.directCheck = {
      success: true,
      count: directResult.total,
      documents: directResult.documents
    };
    
    console.log(`✅ Direct check: Found ${directResult.total} items`);
    if (directResult.documents.length > 0) {
      console.log('Sample item:', directResult.documents[0]);
    }
  } catch (error) {
    console.error('❌ Direct check failed:', error);
    results.directCheck = {
      success: false,
      error: error.message
    };
  }
  
  // Method 2: ItemsService check
  try {
    console.log('\n2️⃣ ItemsService check...');
    const serviceResult = await itemsService.getItems({
      limit: 100,
      page: 1
    });
    
    results.serviceCheck = {
      success: serviceResult.success,
      count: serviceResult.total || 0,
      items: serviceResult.items
    };
    
    console.log(`✅ Service check: Found ${serviceResult.total || 0} items`);
    if (serviceResult.items && serviceResult.items.length > 0) {
      console.log('Sample item:', serviceResult.items[0]);
    }
  } catch (error) {
    console.error('❌ Service check failed:', error);
    results.serviceCheck = {
      success: false,
      error: error.message
    };
  }
  
  // Method 3: Smart Database check
  try {
    console.log('\n3️⃣ Smart Database wrapper check...');
    const smartResult = await smartDatabases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.items,
      [
        Query.limit(100)
      ]
    );
    
    results.smartDbCheck = {
      success: true,
      count: smartResult.total,
      documents: smartResult.documents
    };
    
    console.log(`✅ Smart DB check: Found ${smartResult.total} items`);
    if (smartResult.documents.length > 0) {
      console.log('Sample item:', smartResult.documents[0]);
    }
  } catch (error) {
    console.error('❌ Smart DB check failed:', error);
    results.smartDbCheck = {
      success: false,
      error: error.message
    };
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log('==========');
  console.log(`Direct SDK: ${results.directCheck?.success ? `✅ ${results.directCheck.count} items` : '❌ Failed'}`);
  console.log(`ItemsService: ${results.serviceCheck?.success ? `✅ ${results.serviceCheck.count} items` : '❌ Failed'}`);
  console.log(`Smart DB: ${results.smartDbCheck?.success ? `✅ ${results.smartDbCheck.count} items` : '❌ Failed'}`);
  
  // Check for specific issues
  if (results.directCheck?.success && results.directCheck.count > 0) {
    console.log('\n✨ Items exist in database!');
    
    // Check if service layer has issues
    if (!results.serviceCheck?.success || results.serviceCheck.count === 0) {
      console.log('⚠️ Issue with ItemsService - may be field mapping problem');
    }
    
    // Check first item structure
    const firstItem = results.directCheck.documents[0];
    console.log('\n📋 First item structure:');
    console.log('- ID:', firstItem.$id);
    console.log('- Title:', firstItem.title);
    console.log('- User ID field:', firstItem.userId || firstItem.user_id || 'MISSING');
    console.log('- Status:', firstItem.status);
    console.log('- Created:', firstItem.$createdAt);
  } else {
    console.log('\n⚠️ No items found in database');
    console.log('Try clicking "Add Sample Listings" button in the marketplace');
  }
  
  return results;
}

// Also check collections exist
export async function checkCollections() {
  console.log('\n🔍 Checking database collections...\n');
  
  const collections = Object.entries(COLLECTIONS);
  const results = {};
  
  for (const [name, id] of collections) {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        id,
        [Query.limit(1)]
      );
      results[name] = {
        exists: true,
        id: id,
        count: result.total
      };
      console.log(`✅ ${name} (${id}): ${result.total} documents`);
    } catch (error) {
      if (error.code === 404) {
        results[name] = {
          exists: false,
          id: id,
          error: 'Collection not found'
        };
        console.log(`❌ ${name} (${id}): Collection doesn't exist`);
      } else {
        results[name] = {
          exists: 'unknown',
          id: id,
          error: error.message
        };
        console.log(`⚠️ ${name} (${id}): ${error.message}`);
      }
    }
  }
  
  return results;
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.checkListings = checkListings;
  window.checkCollections = checkCollections;
  console.log('💡 Debug functions available:');
  console.log('   window.checkListings() - Check for items in database');
  console.log('   window.checkCollections() - Check if collections exist');
}