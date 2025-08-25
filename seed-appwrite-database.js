/**
 * Comprehensive Appwrite Database Seeding Script
 * Creates test users, items, and related data for Trading Post
 */

import { Client, Databases, ID } from 'appwrite';

// Trading Post Appwrite Configuration
const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || 'standard_69ad410fb689c99811130c74cc3947ab6a818f385776fe7dea7eaca24b6e924ed00191d7ba6749d01abb212e9c0967f91308f7da31ed16d1cc983c7045358d7169ae80225d99605771b222c974a382535af6af874c142770e70e7955b855b201af836d4c7b594fde0498bde883915e0e751b9d0968e58b78d5385d32e63b62c2';
const DATABASE_ID = 'trading_post_db';

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

// Sample users data with Maryland locations
const SAMPLE_USERS = [
  {
    email: 'alice.chen@example.com',
    password: 'TestPass123!',
    name: 'Alice Chen',
    specialization: 'Tech Professional',
    city: 'Baltimore',
    state: 'MD',
    zipcode: '21201',
    latitude: 39.2833,
    longitude: -76.6122
  },
  {
    email: 'bob.martinez@example.com', 
    password: 'TestPass123!',
    name: 'Bob Martinez',
    specialization: 'Home Improvement',
    city: 'Rockville',
    state: 'MD',
    zipcode: '20850',
    latitude: 39.0458,
    longitude: -77.1625
  },
  {
    email: 'charlie.davis@example.com',
    password: 'TestPass123!', 
    name: 'Charlie Davis',
    specialization: 'Sports & Recreation',
    city: 'Gaithersburg',
    state: 'MD',
    zipcode: '20878',
    latitude: 39.1434,
    longitude: -77.2014
  },
  {
    email: 'david.kim@example.com',
    password: 'TestPass123!',
    name: 'David Kim',
    specialization: 'Books & Education',
    city: 'Washington',
    state: 'DC', 
    zipcode: '20001',
    latitude: 38.9072,
    longitude: -77.0369
  },
  {
    email: 'emma.wilson@example.com',
    password: 'TestPass123!',
    name: 'Emma Wilson', 
    specialization: 'Kitchen & Culinary',
    city: 'Bel Air',
    state: 'MD',
    zipcode: '21014',
    latitude: 39.5696,
    longitude: -76.3558
  },
  {
    email: 'frank.johnson@example.com',
    password: 'TestPass123!',
    name: 'Frank Johnson',
    specialization: 'Tools & Workshop',
    city: 'Towson',
    state: 'MD', 
    zipcode: '21204',
    latitude: 39.4143,
    longitude: -76.7886
  }
];

// Sample items data categorized by user specialization
const SAMPLE_ITEMS = {
  'Tech Professional': [
    {
      title: 'MacBook Pro 14" M3',
      description: 'Excellent condition MacBook Pro with M3 chip, 16GB RAM, 512GB SSD. Perfect for developers.',
      category: 'Electronics',
      condition: 'like_new',
      estimated_value: 2400
    },
    {
      title: 'iPhone 15 Pro Max',
      description: 'Brand new iPhone 15 Pro Max, 256GB, Natural Titanium. Still in box with warranty.',
      category: 'Electronics', 
      condition: 'new',
      estimated_value: 1200
    },
    {
      title: 'Dell 4K Monitor',
      description: '27" Dell UltraSharp 4K monitor, USB-C hub, great for productivity.',
      category: 'Electronics',
      condition: 'good', 
      estimated_value: 450
    }
  ],
  'Home Improvement': [
    {
      title: 'DeWalt Power Drill Set',
      description: 'Complete DeWalt 20V MAX drill set with bits, case, and extra battery.',
      category: 'Tools',
      condition: 'good',
      estimated_value: 180
    },
    {
      title: 'Craftsman Tool Chest',
      description: 'Rolling tool chest with multiple drawers, great condition.',
      category: 'Tools', 
      condition: 'good',
      estimated_value: 320
    }
  ],
  'Sports & Recreation': [
    {
      title: 'Trek Mountain Bike',
      description: 'Trek Fuel EX 8 mountain bike, size Large. Recently serviced, great condition.',
      category: 'Sports',
      condition: 'good',
      estimated_value: 2800
    },
    {
      title: 'Golf Club Set',
      description: 'Complete Titleist golf set with bag, excellent for intermediate players.',
      category: 'Sports',
      condition: 'good', 
      estimated_value: 650
    }
  ],
  'Books & Education': [
    {
      title: 'Programming Books Collection',
      description: 'Collection of 15 programming books including Clean Code, Design Patterns, etc.',
      category: 'Books',
      condition: 'good',
      estimated_value: 200
    },
    {
      title: 'Kindle Paperwhite',
      description: 'Amazon Kindle Paperwhite 11th Gen, waterproof, barely used.',
      category: 'Electronics',
      condition: 'like_new',
      estimated_value: 120
    }
  ],
  'Kitchen & Culinary': [
    {
      title: 'KitchenAid Stand Mixer',
      description: 'Professional KitchenAid stand mixer with attachments, perfect condition.',
      category: 'Kitchen',
      condition: 'like_new', 
      estimated_value: 380
    },
    {
      title: 'Cast Iron Cookware Set',
      description: 'Lodge cast iron set - skillet, Dutch oven, grill pan. Well-seasoned.',
      category: 'Kitchen',
      condition: 'good',
      estimated_value: 150
    }
  ],
  'Tools & Workshop': [
    {
      title: 'Table Saw - Delta Contractor',
      description: 'Delta 10" contractor table saw, fence system included, excellent condition.',
      category: 'Tools',
      condition: 'good',
      estimated_value: 800
    },
    {
      title: 'Woodworking Hand Tools',
      description: 'Collection of premium hand tools - chisels, planes, hand saws.',
      category: 'Tools',
      condition: 'good',
      estimated_value: 250
    }
  ]
};

async function createTestUserProfiles() {
  console.log('👥 Creating test user profiles...');
  const createdUsers = [];
  
  for (const [index, userData] of SAMPLE_USERS.entries()) {
    try {
      console.log(`👤 Creating user profile ${index + 1}/${SAMPLE_USERS.length}: ${userData.name}`);
      
      const userId = ID.unique();
      
      // Create user profile document
      const userProfile = await databases.createDocument(
        DATABASE_ID,
        'users',
        userId,
        {
          email: userData.email,
          username: userData.name.toLowerCase().replace(/\s+/g, ''),
          fullName: userData.name,
          location: `${userData.city}, ${userData.state}`,
          isVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );
      
      createdUsers.push({ $id: userId, profile: userProfile, specialization: userData.specialization, name: userData.name });
      console.log(`✅ Created user profile: ${userData.name} (${userId})`);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`❌ Failed to create user: ${userData.name}`);
      console.error('Error:', error.message);
    }
  }
  
  return createdUsers;
}

async function createTestItems(createdUsers) {
  console.log('\n📦 Creating test items...');
  const createdItems = [];
  
  for (const user of createdUsers) {
    const userSpecialization = user.specialization;
    const userItems = SAMPLE_ITEMS[userSpecialization] || [];
    
    console.log(`\n📋 Creating ${userItems.length} items for ${user.name} (${userSpecialization})`);
    
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
            location: user.profile.location,
            coordinates: [],
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        );
        
        createdItems.push(item);
        console.log(`✅ Created: ${item.title} (${item.category})`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ Failed to create item: ${itemData.title}`);
        console.error('Error:', error.message);
      }
    }
  }
  
  return createdItems;
}

async function seedAppwriteDatabase() {
  console.log('🚀 Starting Appwrite Database Seeding...');
  console.log(`📍 Endpoint: ${APPWRITE_ENDPOINT}`);
  console.log(`🆔 Project: ${APPWRITE_PROJECT_ID}`);
  console.log(`💾 Database: ${DATABASE_ID}`);
  
  try {
    // Create test user profiles
    const createdUsers = await createTestUserProfiles();
    console.log(`\n✅ Created ${createdUsers.length} user profiles`);
    
    // Create test items for each user
    const createdItems = await createTestItems(createdUsers);
    console.log(`\n✅ Created ${createdItems.length} items`);
    
    // Summary
    console.log('\n🎉 Appwrite Database Seeding Complete!');
    console.log('📊 Summary:');
    console.log(`👥 User Profiles: ${createdUsers.length}`);
    console.log(`📦 Items: ${createdItems.length}`);
    console.log(`📝 Categories: ${[...new Set(createdItems.map(item => item.category))].join(', ')}`);
    
    if (createdUsers.length > 0) {
      console.log('\n👤 Created User Profiles:');
      createdUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.specialization}) - ${user.profile.location}`);
      });
    }
    
    console.log(`\n🌐 Visit https://tradingpost.appwrite.network to see your test data!`);
    console.log(`🔍 Check the Appwrite console to verify the data was created`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
}

// Run the seeding process
seedAppwriteDatabase().catch(console.error);