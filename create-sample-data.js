/**
 * Create Sample Data for Trading Post
 * Populates empty collections with test data for user: 689e8a2df25d2c257a7e
 */

import { Client, Databases, ID } from 'appwrite';

// Trading Post Appwrite Configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
const DATABASE_ID = 'trading_post_db';

// User ID from console logs
const USER_ID = '689e8a2df25d2c257a7e';
const USER_EMAIL = 'zrottmann@gmail.com';

if (!APPWRITE_API_KEY) {
  console.error('❌ APPWRITE_API_KEY environment variable is required');
  console.error('Set your API key: export APPWRITE_API_KEY=your_api_key_here');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

// Set API key for server-side operations
client.headers['X-Appwrite-Key'] = APPWRITE_API_KEY;

const databases = new Databases(client);

// Sample items data with different categories and conditions
const SAMPLE_ITEMS = [
  {
    title: "MacBook Pro 16-inch (2021)",
    description: "Excellent condition MacBook Pro with M1 Pro chip, 16GB RAM, 512GB SSD. Perfect for developers and content creators.",
    category: "Electronics",
    condition: "like_new",
    estimated_value: 2200,
    trade_preferences: "Looking for gaming laptop or desktop setup",
    city: "Seattle",
    state: "WA",
    zipcode: "98101",
    location_lat: 47.6062,
    location_lng: -122.3321
  },
  {
    title: "Nintendo Switch OLED Console",
    description: "White Nintendo Switch OLED model with dock, Joy-Cons, and 5 games included. Barely used, like new condition.",
    category: "Gaming",
    condition: "new",
    estimated_value: 450,
    trade_preferences: "Interested in PS5 games or PC gaming accessories",
    city: "Seattle",
    state: "WA",
    zipcode: "98101",
    location_lat: 47.6062,
    location_lng: -122.3321
  },
  {
    title: "Professional Camera Lens - Canon 70-200mm f/2.8",
    description: "Canon EF 70-200mm f/2.8L IS III USM lens in excellent condition. Great for portraits and sports photography.",
    category: "Photography",
    condition: "good",
    estimated_value: 1800,
    trade_preferences: "Looking for wide-angle lens or camera body upgrade",
    city: "Seattle",
    state: "WA",
    zipcode: "98101",
    location_lat: 47.6062,
    location_lng: -122.3321
  },
  {
    title: "Vintage Fender Electric Guitar",
    description: "1995 Fender Stratocaster in sunburst finish. Well-maintained with recent setup. Amazing tone and playability.",
    category: "Musical Instruments",
    condition: "good",
    estimated_value: 1200,
    trade_preferences: "Interested in acoustic guitars or recording equipment",
    city: "Seattle",
    state: "WA",
    zipcode: "98101",
    location_lat: 47.6062,
    location_lng: -122.3321
  },
  {
    title: "Mountain Bike - Trek Full Suspension",
    description: "Trek Fuel EX 8 mountain bike, size Large. Great for trails and weekend adventures. Recently serviced.",
    category: "Sports",
    condition: "good",
    estimated_value: 2800,
    trade_preferences: "Looking for road bike or cycling accessories",
    city: "Seattle",
    state: "WA",
    zipcode: "98101",
    location_lat: 47.6062,
    location_lng: -122.3321
  }
];

async function createSampleItems() {
  console.log('🚀 Creating sample items for Trading Post...');
  console.log(`👤 User: ${USER_EMAIL} (${USER_ID})`);
  
  const createdItems = [];
  
  for (const [index, itemData] of SAMPLE_ITEMS.entries()) {
    try {
      console.log(`📦 Creating item ${index + 1}/${SAMPLE_ITEMS.length}: ${itemData.title}`);
      
      const itemDocument = {
        userId: USER_ID,
        user_id: USER_ID, // Also add for compatibility
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        condition: itemData.condition,
        location: `${itemData.city}, ${itemData.state}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const createdItem = await databases.createDocument(
        DATABASE_ID,
        'items', // Collection ID
        ID.unique(),
        itemDocument
      );
      
      createdItems.push(createdItem);
      console.log(`✅ Created: ${createdItem.title} (${createdItem.$id})`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`❌ Failed to create item: ${itemData.title}`);
      console.error('Error:', error.message);
    }
  }
  
  console.log(`\n🎉 Sample data creation complete!`);
  console.log(`✅ Created ${createdItems.length} items out of ${SAMPLE_ITEMS.length} attempted`);
  
  if (createdItems.length > 0) {
    console.log('\n📋 Created Items:');
    createdItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title} - $${item.estimated_value} (${item.condition})`);
    });
    
    console.log(`\n🔍 You can now test the Trading Post with real data!`);
    console.log(`🤖 AI matching should work with these ${createdItems.length} items`);
    console.log(`📱 Visit https://tradingpost.appwrite.network to see your items`);
  }
  
  return createdItems;
}

// Run the sample data creation
createSampleItems().catch(console.error);