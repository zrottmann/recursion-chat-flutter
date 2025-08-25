// Script to add test marketplace items to Appwrite
import { client, databases, storage, ID, Query } from '../lib/appwrite';

// Appwrite configuration
const APPWRITE_CONFIG = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'trading_post_db',
  collections: {
    items: 'items',
    users: 'users',
    wants: 'wants',
    trades: 'trades',
    messages: 'messages',
    notifications: 'notifications'
  }
};

// Test items data with diverse categories and conditions
const testItems = [
  // Electronics
  {
    title: "iPhone 12 Pro - Excellent Condition",
    description: "128GB, Space Gray, includes original box and charger. Minor scratches on back, screen is perfect. Battery health at 89%.",
    category: "Electronics",
    condition: "Excellent",
    price: 599,
    images: ["https://picsum.photos/400/300?random=1"],
    tags: ["phone", "iphone", "apple", "smartphone", "mobile"],
    trade_preferences: ["Gaming console", "Laptop", "Smart watch"],
    location: "Columbia, MD"
  },
  {
    title: "Sony PlayStation 5 Console",
    description: "Barely used PS5 with 2 controllers, all cables, and 3 games (Spider-Man, God of War, Horizon). Perfect for gaming enthusiasts.",
    category: "Electronics",
    condition: "Like New",
    price: 450,
    images: ["https://picsum.photos/400/300?random=2"],
    tags: ["gaming", "ps5", "playstation", "console", "sony"],
    trade_preferences: ["Xbox Series X", "Gaming PC parts", "4K Monitor"],
    location: "Baltimore, MD"
  },
  {
    title: "Dell XPS 13 Laptop",
    description: "Intel i7, 16GB RAM, 512GB SSD. Great for work or school. Touchscreen works perfectly. Includes laptop bag.",
    category: "Electronics",
    condition: "Good",
    price: 750,
    images: ["https://picsum.photos/400/300?random=3"],
    tags: ["laptop", "dell", "computer", "xps", "ultrabook"],
    trade_preferences: ["MacBook", "iPad Pro", "Desktop PC"],
    location: "Ellicott City, MD"
  },
  
  // Furniture
  {
    title: "Mid-Century Modern Couch",
    description: "Beautiful grey fabric couch, seats 3 comfortably. Non-smoking home, pet-free. Moving sale - must go this week!",
    category: "Furniture",
    condition: "Good",
    price: 350,
    images: ["https://picsum.photos/400/300?random=4"],
    tags: ["sofa", "couch", "furniture", "living room", "modern"],
    trade_preferences: ["Dining table", "Office chair", "TV stand"],
    location: "Bethesda, MD"
  },
  {
    title: "IKEA Standing Desk",
    description: "Electric height adjustable desk, white top with black legs. Perfect for home office. Includes cable management.",
    category: "Furniture",
    condition: "Excellent",
    price: 280,
    images: ["https://picsum.photos/400/300?random=5"],
    tags: ["desk", "standing desk", "office", "ikea", "adjustable"],
    trade_preferences: ["Office chair", "Monitor", "Bookshelf"],
    location: "Silver Spring, MD"
  },
  {
    title: "Vintage Wooden Bookshelf",
    description: "Solid oak bookshelf, 6 shelves, great for home library or office. Some character marks add to vintage appeal.",
    category: "Furniture",
    condition: "Good",
    price: 150,
    images: ["https://picsum.photos/400/300?random=6"],
    tags: ["bookshelf", "vintage", "wood", "oak", "storage"],
    trade_preferences: ["Desk", "Filing cabinet", "Art pieces"],
    location: "Rockville, MD"
  },
  
  // Clothing
  {
    title: "North Face Winter Jacket",
    description: "Men's Large, black, waterproof and insulated. Perfect for skiing or cold weather. Like new, worn only twice.",
    category: "Clothing",
    condition: "Like New",
    price: 120,
    images: ["https://picsum.photos/400/300?random=7"],
    tags: ["jacket", "winter", "north face", "outdoor", "mens"],
    trade_preferences: ["Hiking boots", "Camping gear", "Sports equipment"],
    location: "Annapolis, MD"
  },
  {
    title: "Designer Handbag Collection",
    description: "3 authentic designer bags - Coach, Michael Kors, Kate Spade. All in excellent condition with dust bags.",
    category: "Clothing",
    condition: "Excellent",
    price: 400,
    images: ["https://picsum.photos/400/300?random=8"],
    tags: ["handbag", "designer", "coach", "fashion", "accessories"],
    trade_preferences: ["Jewelry", "Shoes", "Watch"],
    location: "Potomac, MD"
  },
  
  // Sports & Outdoors
  {
    title: "Trek Mountain Bike",
    description: "21-speed, aluminum frame, recently serviced. Great for trails or commuting. Includes helmet and lock.",
    category: "Sports",
    condition: "Good",
    price: 400,
    images: ["https://picsum.photos/400/300?random=9"],
    tags: ["bike", "mountain bike", "trek", "cycling", "outdoor"],
    trade_preferences: ["Road bike", "Exercise equipment", "Kayak"],
    location: "Frederick, MD"
  },
  {
    title: "Complete Home Gym Set",
    description: "Dumbbells (5-50 lbs), adjustable bench, pull-up bar, resistance bands. Everything you need for home workouts.",
    category: "Sports",
    condition: "Good",
    price: 500,
    images: ["https://picsum.photos/400/300?random=10"],
    tags: ["gym", "weights", "fitness", "exercise", "dumbbells"],
    trade_preferences: ["Treadmill", "Elliptical", "Rowing machine"],
    location: "Gaithersburg, MD"
  },
  {
    title: "Camping Gear Bundle",
    description: "4-person tent, 2 sleeping bags, camping stove, cooler, and lanterns. Perfect for family camping trips.",
    category: "Sports",
    condition: "Good",
    price: 250,
    images: ["https://picsum.photos/400/300?random=11"],
    tags: ["camping", "tent", "outdoor", "hiking", "adventure"],
    trade_preferences: ["Fishing gear", "Kayak", "Mountain bike"],
    location: "Westminster, MD"
  },
  
  // Books & Media
  {
    title: "Programming Books Collection",
    description: "20+ books on JavaScript, Python, React, and web development. Great for learning or reference.",
    category: "Books",
    condition: "Like New",
    price: 150,
    images: ["https://picsum.photos/400/300?random=12"],
    tags: ["books", "programming", "coding", "javascript", "python"],
    trade_preferences: ["Tablet", "E-reader", "Tech courses"],
    location: "College Park, MD"
  },
  {
    title: "Vinyl Record Collection",
    description: "Classic rock and jazz albums, 50+ records. Includes some rare pressings. Must go as complete set.",
    category: "Books",
    condition: "Good",
    price: 300,
    images: ["https://picsum.photos/400/300?random=13"],
    tags: ["vinyl", "records", "music", "classic rock", "jazz"],
    trade_preferences: ["Turntable", "Speakers", "Audio equipment"],
    location: "Takoma Park, MD"
  },
  
  // Tools & Garden
  {
    title: "DeWalt Power Tool Set",
    description: "Drill, circular saw, reciprocating saw, with batteries and charger. Professional grade, lightly used.",
    category: "Tools",
    condition: "Excellent",
    price: 350,
    images: ["https://picsum.photos/400/300?random=14"],
    tags: ["tools", "dewalt", "power tools", "drill", "saw"],
    trade_preferences: ["Other tools", "Generator", "Lawn equipment"],
    location: "Laurel, MD"
  },
  {
    title: "Weber Gas Grill",
    description: "3-burner gas grill with side burner, cover included. Perfect for summer BBQs. Recently cleaned.",
    category: "Garden",
    condition: "Good",
    price: 250,
    images: ["https://picsum.photos/400/300?random=15"],
    tags: ["grill", "bbq", "weber", "outdoor", "cooking"],
    trade_preferences: ["Patio furniture", "Smoker", "Fire pit"],
    location: "Bowie, MD"
  },
  
  // Baby & Kids
  {
    title: "Baby Stroller & Car Seat Combo",
    description: "Graco travel system, navy blue, excellent safety ratings. Barely used, from smoke-free home.",
    category: "Baby",
    condition: "Like New",
    price: 200,
    images: ["https://picsum.photos/400/300?random=16"],
    tags: ["stroller", "car seat", "baby", "graco", "travel system"],
    trade_preferences: ["Baby crib", "High chair", "Baby clothes"],
    location: "Germantown, MD"
  },
  {
    title: "LEGO Collection",
    description: "Multiple sets including Star Wars, City, and Creator. All pieces included with instructions.",
    category: "Toys",
    condition: "Excellent",
    price: 300,
    images: ["https://picsum.photos/400/300?random=17"],
    tags: ["lego", "toys", "star wars", "building", "kids"],
    trade_preferences: ["Video games", "Board games", "Other toys"],
    location: "Olney, MD"
  },
  
  // Home & Kitchen
  {
    title: "KitchenAid Stand Mixer",
    description: "Red, 5-quart bowl, includes 3 attachments. Perfect for baking enthusiasts. Works like new.",
    category: "Kitchen",
    condition: "Excellent",
    price: 200,
    images: ["https://picsum.photos/400/300?random=18"],
    tags: ["kitchenaid", "mixer", "baking", "kitchen", "appliance"],
    trade_preferences: ["Instant Pot", "Air fryer", "Coffee maker"],
    location: "Chevy Chase, MD"
  },
  {
    title: "Dyson V11 Vacuum",
    description: "Cordless vacuum with multiple attachments, great suction power. Battery holds charge well.",
    category: "Home",
    condition: "Good",
    price: 300,
    images: ["https://picsum.photos/400/300?random=19"],
    tags: ["dyson", "vacuum", "cleaning", "cordless", "home"],
    trade_preferences: ["Robot vacuum", "Steam cleaner", "Air purifier"],
    location: "Towson, MD"
  },
  {
    title: "Instant Pot Duo Plus",
    description: "9-in-1 pressure cooker, 6 quart. Makes cooking so easy! Includes recipe book.",
    category: "Kitchen",
    condition: "Like New",
    price: 80,
    images: ["https://picsum.photos/400/300?random=20"],
    tags: ["instant pot", "pressure cooker", "kitchen", "cooking", "appliance"],
    trade_preferences: ["Air fryer", "Blender", "Food processor"],
    location: "Catonsville, MD"
  }
];

// Function to add test items to database
export async function addTestItems(userId) {
  console.log('🎯 Starting to add test marketplace items...');
  
  const addedItems = [];
  const errors = [];
  
  for (const item of testItems) {
    try {
      // Create item document with proper structure for Appwrite
      const itemData = {
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        price: item.price,
        images: item.images,
        tags: item.tags,
        trade_preferences: item.trade_preferences,
        location: item.location,
        user_id: userId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views: Math.floor(Math.random() * 100),
        favorites: Math.floor(Math.random() * 20),
        is_featured: Math.random() > 0.8,
        
        // Add location coordinates for map display (Maryland area)
        latitude: 39.0458 + (Math.random() - 0.5) * 0.5, // Random around Maryland
        longitude: -76.6413 + (Math.random() - 0.5) * 0.5,
        
        // AI matching fields
        ai_embeddings: [], // Will be populated by AI service
        ai_category_confidence: 0.95,
        ai_suggested_price: item.price + Math.floor(Math.random() * 50) - 25,
        ai_quality_score: 0.8 + Math.random() * 0.2,
        
        // Additional metadata
        negotiable: Math.random() > 0.3,
        delivery_available: Math.random() > 0.5,
        shipping_available: Math.random() > 0.7
      };
      
      // Create the item in Appwrite
      const response = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.items,
        ID.unique(),
        itemData
      );
      
      console.log(`✅ Added item: ${item.title}`);
      addedItems.push(response);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error adding item "${item.title}":`, error);
      errors.push({ item: item.title, error: error.message });
    }
  }
  
  // Also add some "wants" for AI matching
  const testWants = [
    {
      title: "Looking for Gaming Laptop",
      description: "Need a powerful laptop for gaming and video editing. Prefer NVIDIA graphics.",
      category: "Electronics",
      tags: ["laptop", "gaming", "nvidia", "computer"],
      max_price: 1000,
      user_id: userId
    },
    {
      title: "Seeking Vintage Furniture",
      description: "Interested in mid-century modern pieces, especially chairs and tables.",
      category: "Furniture", 
      tags: ["vintage", "furniture", "mid-century", "modern"],
      max_price: 500,
      user_id: userId
    },
    {
      title: "Want Mountain Bike",
      description: "Looking for a good quality mountain bike for trail riding.",
      category: "Sports",
      tags: ["bike", "mountain bike", "cycling", "outdoor"],
      max_price: 600,
      user_id: userId
    }
  ];
  
  // Add wants to database
  for (const want of testWants) {
    try {
      const wantData = {
        ...want,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.wants,
        ID.unique(),
        wantData
      );
      
      console.log(`✅ Added want: ${want.title}`);
    } catch (error) {
      console.error(`❌ Error adding want "${want.title}":`, error);
    }
  }
  
  console.log(`
    📊 Test Data Summary:
    - Items added: ${addedItems.length}/${testItems.length}
    - Errors: ${errors.length}
    - Categories covered: Electronics, Furniture, Clothing, Sports, Books, Tools, Baby, Kitchen
  `);
  
  if (errors.length > 0) {
    console.error('Errors encountered:', errors);
  }
  
  return {
    success: addedItems.length > 0,
    itemsAdded: addedItems.length,
    errors: errors
  };
}

// Function to clear all test items (for cleanup)
export async function clearTestItems(userId) {
  console.log('🧹 Clearing test items...');
  
  try {
    // Get all items for the user
    const items = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.items,
      [Query.equal('user_id', userId)]
    );
    
    // Delete each item
    for (const item of items.documents) {
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.items,
        item.$id
      );
      console.log(`🗑️ Deleted: ${item.title}`);
    }
    
    console.log(`✅ Cleared ${items.documents.length} test items`);
    return true;
  } catch (error) {
    console.error('❌ Error clearing test items:', error);
    return false;
  }
}

// Auto-run if this file is executed directly
if (typeof window !== 'undefined' && window.location.pathname.includes('test')) {
  // Get current user ID from localStorage or session
  const getCurrentUserId = async () => {
    try {
      const account = await import('../lib/appwrite').then(m => m.account);
      const user = await account.get();
      return user.$id;
    } catch (error) {
      console.error('No logged in user found');
      return null;
    }
  };
  
  getCurrentUserId().then(userId => {
    if (userId) {
      console.log('Found user:', userId);
      addTestItems(userId);
    } else {
      console.error('Please log in first to add test items');
    }
  });
}