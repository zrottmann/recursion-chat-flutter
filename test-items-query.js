/**
 * Test Items Query
 * Tests if items can be fetched with the correct query
 */

import { Client, Databases, Query } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const APPWRITE_API_KEY = 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
const DATABASE_ID = 'trading_post_db';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

client.headers['X-Appwrite-Key'] = APPWRITE_API_KEY;

const databases = new Databases(client);

async function testQuery() {
  console.log('🔍 Testing items query...');
  
  try {
    // Test query with status = 'active'
    console.log('\n1️⃣ Testing with status = "active"');
    const activeItems = await databases.listDocuments(
      DATABASE_ID, 
      'items',
      [
        Query.equal('status', 'active'),
        Query.orderDesc('createdAt'),
        Query.limit(10)
      ]
    );
    console.log(`✅ Found ${activeItems.total} active items`);
    
    // Show sample items
    if (activeItems.documents.length > 0) {
      console.log('\n📦 Sample active items:');
      activeItems.documents.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} by ${item.userId} (${item.category}) - Status: ${item.status}`);
      });
    }
    
    // Test query with no filters (all items)
    console.log('\n2️⃣ Testing with no filters (all items)');
    const allItems = await databases.listDocuments(
      DATABASE_ID, 
      'items',
      [
        Query.orderDesc('createdAt'),
        Query.limit(10)
      ]
    );
    console.log(`✅ Found ${allItems.total} total items`);
    
    // Show all statuses
    const statuses = [...new Set(allItems.documents.map(item => item.status))];
    console.log(`📊 Item statuses found: ${statuses.join(', ')}`);
    
    // Test with users collection to get user names
    console.log('\n3️⃣ Testing users lookup');
    const users = await databases.listDocuments(DATABASE_ID, 'users', [Query.limit(10)]);
    console.log(`👥 Found ${users.total} users`);
    
    const userMap = {};
    users.documents.forEach(user => {
      userMap[user.$id] = user.fullName || user.username || user.email;
    });
    
    console.log('\n👤 User mapping:');
    Object.entries(userMap).forEach(([id, name]) => {
      console.log(`  ${id}: ${name}`);
    });
    
    console.log('\n🎉 Query test complete! Items should now be visible in the marketplace.');
    
  } catch (error) {
    console.error('❌ Query test failed:', error.message);
  }
}

testQuery().catch(console.error);