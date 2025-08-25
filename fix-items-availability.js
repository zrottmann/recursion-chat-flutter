/**
 * Fix Items Availability Field
 * Updates existing items to have the is_available field that the UI expects
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

async function fixItemsAvailability() {
  console.log('🔧 Fixing items availability fields...');
  
  try {
    // Get all items
    const items = await databases.listDocuments(DATABASE_ID, 'items');
    console.log(`📦 Found ${items.total} items`);
    
    let updatedCount = 0;
    
    for (const item of items.documents) {
      try {
        console.log(`📝 Checking item: ${item.title} (${item.$id})`);
        
        // Check if item needs updating
        const hasIsAvailable = 'is_available' in item;
        const isActiveStatus = item.status === 'active';
        
        if (!hasIsAvailable || item.is_available !== isActiveStatus) {
          console.log(`  🔄 Updating item: ${item.title}`);
          
          // Update the item with is_available field
          await databases.updateDocument(
            DATABASE_ID,
            'items',
            item.$id,
            {
              is_available: isActiveStatus
            }
          );
          
          updatedCount++;
          console.log(`  ✅ Updated: ${item.title} (is_available: ${isActiveStatus})`);
        } else {
          console.log(`  ✅ Already correct: ${item.title} (is_available: ${item.is_available})`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to update item ${item.title}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Availability fix complete!`);
    console.log(`✅ Updated ${updatedCount} items`);
    console.log(`📊 Total items processed: ${items.total}`);
    console.log(`🌐 Items should now appear in the marketplace!`);
    
  } catch (error) {
    console.error('❌ Failed to fix items availability:', error.message);
  }
}

fixItemsAvailability().catch(console.error);