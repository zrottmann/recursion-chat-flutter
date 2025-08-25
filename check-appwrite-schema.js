/**
 * Check Appwrite Collection Schema
 * Inspects existing collections to understand the schema
 */

import { Client, Databases } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const APPWRITE_API_KEY = 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
const DATABASE_ID = 'trading_post_db';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

client.headers['X-Appwrite-Key'] = APPWRITE_API_KEY;

const databases = new Databases(client);

async function checkSchema() {
  console.log('🔍 Checking Appwrite Database Schema...');
  
  try {
    // Check users collection
    console.log('\n👥 Checking Users Collection...');
    const userDocs = await databases.listDocuments(DATABASE_ID, 'users');
    console.log(`Found ${userDocs.total} user documents`);
    
    if (userDocs.documents.length > 0) {
      const sampleUser = userDocs.documents[0];
      console.log(`\n🔑 User collection fields:`);
      Object.keys(sampleUser).forEach(key => {
        if (!key.startsWith('$')) {
          const value = sampleUser[key];
          const type = typeof value;
          const example = type === 'string' ? value.substring(0, 30) + '...' : value;
          console.log(`   - ${key}: ${type} (example: ${JSON.stringify(example)})`);
        }
      });
    }
    
    // Check items collection
    console.log('\n📦 Checking Items Collection...');
    const itemDocs = await databases.listDocuments(DATABASE_ID, 'items');
    console.log(`Found ${itemDocs.total} item documents`);
    
    if (itemDocs.documents.length > 0) {
      const sampleItem = itemDocs.documents[0];
      console.log(`\n🔑 Items collection fields:`);
      Object.keys(sampleItem).forEach(key => {
        if (!key.startsWith('$')) {
          const value = sampleItem[key];
          const type = typeof value;
          const example = type === 'string' ? value.substring(0, 30) + '...' : value;
          console.log(`   - ${key}: ${type} (example: ${JSON.stringify(example)})`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

checkSchema().catch(console.error);