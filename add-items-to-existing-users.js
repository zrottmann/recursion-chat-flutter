/**
 * Add Items to Existing Users in Appwrite
 */

import { Client, Databases, ID, Query } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const APPWRITE_API_KEY = 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
const DATABASE_ID = 'trading_post_db';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

client.headers['X-Appwrite-Key'] = APPWRITE_API_KEY;

const databases = new Databases(client);

// Sample items mapped to user specializations based on fullName
const USER_ITEMS = {
  'Alice Chen': [
    {
      title: 'MacBook Pro 14" M3',
      description: 'Excellent condition MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers.',
      category: 'Electronics',
      condition: 'like_new'
    },
    {
      title: 'iPhone 15 Pro Max',
      description: 'Brand new iPhone 15 Pro Max, 256GB, Natural Titanium. Still in box with warranty.',
      category: 'Electronics', 
      condition: 'new'
    },
    {
      title: 'Dell 4K Monitor',
      description: '27" Dell UltraSharp 4K monitor, USB-C hub, great for productivity.',
      category: 'Electronics',
      condition: 'good'
    }
  ],
  'Bob Martinez': [
    {
      title: 'DeWalt Power Drill Set',
      description: 'Complete DeWalt 20V MAX drill set with bits, case, and extra battery.',
      category: 'Tools',
      condition: 'good'
    },
    {
      title: 'Craftsman Tool Chest',
      description: 'Rolling tool chest with multiple drawers, great condition.',
      category: 'Tools', 
      condition: 'good'
    }
  ],
  'Charlie Davis': [
    {
      title: 'Trek Mountain Bike',
      description: 'Trek Fuel EX 8 mountain bike, size Large. Recently serviced, great condition.',
      category: 'Sports',
      condition: 'good'
    },
    {
      title: 'Golf Club Set',
      description: 'Complete Titleist golf set with bag, excellent for intermediate players.',
      category: 'Sports',
      condition: 'good'
    }
  ],
  'David Kim': [
    {
      title: 'Programming Books Collection',
      description: 'Collection of 15 programming books including Clean Code, Design Patterns, etc.',
      category: 'Books',
      condition: 'good'
    },
    {
      title: 'Kindle Paperwhite',
      description: 'Amazon Kindle Paperwhite 11th Gen, waterproof, barely used.',
      category: 'Electronics',
      condition: 'like_new'
    }
  ],
  'Emma Wilson': [
    {
      title: 'KitchenAid Stand Mixer',
      description: 'Professional KitchenAid stand mixer with attachments, perfect condition.',
      category: 'Kitchen',
      condition: 'like_new'
    },
    {
      title: 'Cast Iron Cookware Set',
      description: 'Lodge cast iron set - skillet, Dutch oven, grill pan. Well-seasoned.',
      category: 'Kitchen',
      condition: 'good'
    }
  ],
  'Frank Johnson': [
    {
      title: 'Table Saw - Delta Contractor',
      description: 'Delta 10" contractor table saw, fence system included, excellent condition.',
      category: 'Tools',
      condition: 'good'
    },
    {
      title: 'Woodworking Hand Tools',
      description: 'Collection of premium hand tools - chisels, planes, hand saws.',
      category: 'Tools',
      condition: 'good'
    }
  ]
};

async function createItemsForUsers() {
  console.log('🚀 Adding items to existing users...');
  
  try {
    // Get all existing users
    const users = await databases.listDocuments(DATABASE_ID, 'users');
    console.log(`👥 Found ${users.total} existing users`);
    
    let totalItemsCreated = 0;
    
    for (const user of users.documents) {
      const userName = user.fullName;
      const userItems = USER_ITEMS[userName] || [];
      
      if (userItems.length === 0) {
        console.log(`⚠️  No items defined for ${userName}`);
        continue;
      }
      
      console.log(`\n📋 Creating ${userItems.length} items for ${userName}...`);
      
      for (const [index, itemData] of userItems.entries()) {
        try {
          console.log(`📦 Creating item ${index + 1}/${userItems.length}: ${itemData.title}`);
          
          const item = await databases.createDocument(
            DATABASE_ID,
            'items',
            ID.unique(),
            {
              userId: user.$id,
              user_id: user.$id,
              title: itemData.title,
              description: itemData.description,
              category: itemData.category,
              condition: itemData.condition,
              images: [],
              location: user.location || 'Maryland, USA',
              coordinates: [],
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          );
          
          totalItemsCreated++;
          console.log(`✅ Created: ${item.title} (${item.category})`);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Failed to create item: ${itemData.title}`);
          console.error('Error:', error.message);
        }
      }
    }
    
    console.log(`\n🎉 Items creation complete!`);
    console.log(`✅ Created ${totalItemsCreated} items for ${users.total} users`);
    console.log(`🌐 Visit https://tradingpost.appwrite.network to see your items!`);
    console.log(`🔍 Check the Appwrite console to verify the items were created`);
    
  } catch (error) {
    console.error('❌ Failed to create items:', error.message);
  }
}

createItemsForUsers().catch(console.error);