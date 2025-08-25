// Script to create demo users and populate them with test items
import { account, databases, ID, Query } from '../lib/appwrite';

// Appwrite configuration
const APPWRITE_CONFIG = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || 'trading_post_db',
  collections: {
    users: 'users',
    items: 'items',
    wants: 'wants'
  }
};

// Demo user profiles
const demoUsers = [
  {
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
    location: "Columbia, MD",
    bio: "Tech enthusiast and vintage furniture collector. Love finding unique pieces with character!",
    rating: 4.8,
    total_trades: 23,
    member_since: "2023-03-15",
    verified: true,
    badges: ["Top Trader", "Tech Expert", "Verified"],
    phone: "+1 (555) 123-4567",
    social_links: {
      instagram: "@sarahvintage",
      facebook: "sarah.chen.vintage"
    }
  },
  {
    name: "Mike Rodriguez",
    email: "mike.rodriguez@example.com", 
    avatar: "https://i.pravatar.cc/150?img=2",
    location: "Baltimore, MD",
    bio: "Outdoor enthusiast and sports gear collector. Always looking for the next adventure!",
    rating: 4.6,
    total_trades: 31,
    member_since: "2022-11-08",
    verified: true,
    badges: ["Sports Pro", "Outdoor Expert"],
    phone: "+1 (555) 234-5678",
    social_links: {
      instagram: "@mikeoutdoors",
      twitter: "@mike_adventures"
    }
  },
  {
    name: "Emily Johnson",
    email: "emily.johnson@example.com",
    avatar: "https://i.pravatar.cc/150?img=3", 
    location: "Bethesda, MD",
    bio: "Book lover and home baker. Creating cozy spaces one item at a time.",
    rating: 4.9,
    total_trades: 18,
    member_since: "2023-07-22",
    verified: true,
    badges: ["Bookworm", "Kitchen Queen", "Rising Star"],
    phone: "+1 (555) 345-6789",
    social_links: {
      instagram: "@emilybakes",
      pinterest: "emily_cozy_home"
    }
  },
  {
    name: "David Kim",
    email: "david.kim@example.com",
    avatar: "https://i.pravatar.cc/150?img=4",
    location: "Silver Spring, MD", 
    bio: "Gaming enthusiast and electronics expert. Building the ultimate setup one trade at a time!",
    rating: 4.7,
    total_trades: 42,
    member_since: "2022-05-12",
    verified: true,
    badges: ["Gaming Guru", "Tech Wizard", "Power Trader"],
    phone: "+1 (555) 456-7890",
    social_links: {
      twitch: "davidkim_gaming",
      discord: "DavidK#1234"
    }
  },
  {
    name: "Lisa Thompson",
    email: "lisa.thompson@example.com",
    avatar: "https://i.pravatar.cc/150?img=5",
    location: "Rockville, MD",
    bio: "Fashion enthusiast and designer items collector. Style is my passion!",
    rating: 4.5,
    total_trades: 27,
    member_since: "2023-01-30",
    verified: false,
    badges: ["Fashion Forward", "Designer Deals"],
    phone: "+1 (555) 567-8901",
    social_links: {
      instagram: "@lisastyle",
      tiktok: "@lisa_fashion"
    }
  }
];

// Items for each demo user
const userItems = {
  "sarah.chen@example.com": [
    {
      title: "Mid-Century Danish Teak Dresser",
      description: "Beautiful 1960s Danish teak dresser with clean lines and original hardware. Some minor wear consistent with age but structurally perfect. A real statement piece!",
      category: "Furniture", 
      condition: "Good",
      price: 450,
      images: ["https://picsum.photos/400/300?random=21"],
      tags: ["vintage", "danish", "teak", "dresser", "mid-century"],
      trade_preferences: ["Eames chair", "Vintage lighting", "Ceramics"],
      negotiable: true,
      delivery_available: false,
      shipping_available: true
    },
    {
      title: "MacBook Pro 13\" M1 (2021)",
      description: "Excellent condition MacBook Pro with M1 chip, 8GB RAM, 256GB SSD. Perfect for creative work, comes with original box and charger.",
      category: "Electronics",
      condition: "Excellent", 
      price: 900,
      images: ["https://picsum.photos/400/300?random=22"],
      tags: ["macbook", "apple", "laptop", "m1", "computer"],
      trade_preferences: ["iPad Pro", "Monitor", "Audio equipment"],
      negotiable: true,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Vintage Pyrex Mixing Bowl Set",
      description: "Complete set of vintage Pyrex nesting bowls in primary colors. No chips or cracks, perfect for baking enthusiasts!",
      category: "Kitchen",
      condition: "Excellent",
      price: 85,
      images: ["https://picsum.photos/400/300?random=23"],
      tags: ["pyrex", "vintage", "bowls", "kitchen", "baking"],
      trade_preferences: ["Vintage kitchen items", "Ceramics", "Cookbooks"],
      negotiable: false,
      delivery_available: true,
      shipping_available: true
    }
  ],
  
  "mike.rodriguez@example.com": [
    {
      title: "REI Co-op Backpacking Tent",
      description: "2-person ultralight tent, perfect for backpacking. Only used on 3 trips, excellent condition with stuff sack and footprint included.",
      category: "Sports",
      condition: "Like New",
      price: 280,
      images: ["https://picsum.photos/400/300?random=24"],
      tags: ["tent", "backpacking", "camping", "rei", "ultralight"],
      trade_preferences: ["Sleeping bag", "Backpack", "Hiking boots"],
      negotiable: true,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Yeti Cooler 45qt",
      description: "Built like a tank! Perfect for camping trips, tailgating, or beach days. Keeps ice for days. Minor scratches but works perfectly.",
      category: "Sports",
      condition: "Good",
      price: 250,
      images: ["https://picsum.photos/400/300?random=25"],
      tags: ["yeti", "cooler", "camping", "outdoor", "insulated"],
      trade_preferences: ["Grill", "Outdoor furniture", "Fishing gear"],
      negotiable: true,
      delivery_available: false,
      shipping_available: false
    },
    {
      title: "Specialized Mountain Bike Helmet",
      description: "Size Large, MIPS technology, barely used. Safety is paramount! Includes original packaging.",
      category: "Sports",
      condition: "Like New",
      price: 75,
      images: ["https://picsum.photos/400/300?random=26"],
      tags: ["helmet", "mountain bike", "specialized", "mips", "safety"],
      trade_preferences: ["Bike accessories", "Lights", "Tools"],
      negotiable: false,
      delivery_available: true,
      shipping_available: true
    }
  ],
  
  "emily.johnson@example.com": [
    {
      title: "First Edition Harry Potter Collection",
      description: "Books 1-7, all first editions in excellent condition. Kept in protective covers, no library markings. A treasure for any Potter fan!",
      category: "Books",
      condition: "Excellent",
      price: 400,
      images: ["https://picsum.photos/400/300?random=27"],
      tags: ["harry potter", "first edition", "books", "collectible", "jk rowling"],
      trade_preferences: ["Other first editions", "Art books", "Signed books"],
      negotiable: true,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Le Creuset Dutch Oven 5.5qt",
      description: "Cherry red enameled cast iron Dutch oven. Perfect for braising, baking bread, or making soups. Some minor wear but functions perfectly.",
      category: "Kitchen",
      condition: "Good",
      price: 180,
      images: ["https://picsum.photos/400/300?random=28"],
      tags: ["le creuset", "dutch oven", "cooking", "cast iron", "kitchen"],
      trade_preferences: ["Stand mixer", "Bread proofing basket", "Cookbooks"],
      negotiable: true,
      delivery_available: true,
      shipping_available: false
    },
    {
      title: "Antique Recipe Box with Cards",
      description: "Beautiful wooden recipe box from the 1940s with 100+ handwritten recipe cards. A piece of culinary history!",
      category: "Kitchen",
      condition: "Good",
      price: 65,
      images: ["https://picsum.photos/400/300?random=29"],
      tags: ["vintage", "recipe box", "antique", "cooking", "collection"],
      trade_preferences: ["Vintage cookbooks", "Kitchen scales", "Baking tools"],
      negotiable: false,
      delivery_available: true,
      shipping_available: true
    }
  ],
  
  "david.kim@example.com": [
    {
      title: "ASUS ROG Gaming Monitor 27\"",
      description: "144Hz, 1ms response time, G-Sync compatible. Perfect for competitive gaming. Includes all cables and original stand.",
      category: "Electronics",
      condition: "Excellent",
      price: 320,
      images: ["https://picsum.photos/400/300?random=30"],
      tags: ["monitor", "gaming", "asus", "rog", "144hz"],
      trade_preferences: ["Graphics card", "Mechanical keyboard", "Gaming chair"],
      negotiable: true,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Nintendo Switch OLED + Games",
      description: "Switch OLED with 5 games: Zelda BOTW, Mario Odyssey, Smash Bros, Animal Crossing, and Metroid Dread. All games digital.",
      category: "Electronics",
      condition: "Like New",
      price: 380,
      images: ["https://picsum.photos/400/300?random=31"],
      tags: ["nintendo", "switch", "oled", "gaming", "console"],
      trade_preferences: ["PS5", "Xbox Series X", "Gaming laptop"],
      negotiable: true,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Mechanical Keyboard Collection",
      description: "3 high-end mechanical keyboards: Ducky, Keychron, and custom built. All have different switch types. Selling as bundle only.",
      category: "Electronics", 
      condition: "Excellent",
      price: 450,
      images: ["https://picsum.photos/400/300?random=32"],
      tags: ["keyboard", "mechanical", "gaming", "custom", "collection"],
      trade_preferences: ["Audio equipment", "Monitor", "PC components"],
      negotiable: true,
      delivery_available: false,
      shipping_available: true
    }
  ],
  
  "lisa.thompson@example.com": [
    {
      title: "Designer Handbag Bundle",
      description: "Authentic bags from Coach, Kate Spade, and Michael Kors. All in excellent condition with dust bags and authenticity cards.",
      category: "Clothing",
      condition: "Excellent",
      price: 380,
      images: ["https://picsum.photos/400/300?random=33"],
      tags: ["designer", "handbag", "coach", "kate spade", "michael kors"],
      trade_preferences: ["Jewelry", "Designer shoes", "Luxury accessories"],
      negotiable: true,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Vintage Chanel Silk Scarf",
      description: "Authentic Chanel silk scarf in excellent condition. Classic design that never goes out of style. Comes with original packaging.",
      category: "Clothing",
      condition: "Excellent",
      price: 220,
      images: ["https://picsum.photos/400/300?random=34"],
      tags: ["chanel", "silk", "scarf", "vintage", "luxury"],
      trade_preferences: ["Other designer items", "Vintage jewelry", "Silk items"],
      negotiable: false,
      delivery_available: true,
      shipping_available: true
    },
    {
      title: "Professional Jewelry Display Case",
      description: "Glass display case perfect for jewelry or collectibles. LED lighting included. Great for organizing or displaying collections.",
      category: "Home",
      condition: "Like New",
      price: 150,
      images: ["https://picsum.photos/400/300?random=35"],
      tags: ["display case", "jewelry", "organization", "glass", "led"],
      trade_preferences: ["Jewelry", "Storage solutions", "Home decor"],
      negotiable: true,
      delivery_available: false,
      shipping_available: false
    }
  ]
};

// Create user profile in database
async function createUserProfile(userData) {
  try {
    const userProfile = {
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar,
      location: userData.location,
      bio: userData.bio,
      rating: userData.rating,
      total_trades: userData.total_trades,
      member_since: userData.member_since,
      verified: userData.verified,
      badges: userData.badges,
      phone: userData.phone,
      social_links: userData.social_links,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Additional profile fields
      preferences: {
        email_notifications: true,
        sms_notifications: false,
        public_profile: true,
        show_location: true
      },
      
      // Location coordinates for map (Maryland area)
      latitude: 39.0458 + (Math.random() - 0.5) * 0.5,
      longitude: -76.6413 + (Math.random() - 0.5) * 0.5,
      
      // Stats
      items_sold: Math.floor(userData.total_trades * 0.6),
      items_bought: Math.floor(userData.total_trades * 0.4),
      wishlist_count: Math.floor(Math.random() * 10) + 5,
      follower_count: Math.floor(Math.random() * 50) + 10,
      following_count: Math.floor(Math.random() * 30) + 5
    };
    
    const response = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.users,
      ID.unique(),
      userProfile
    );
    
    console.log(`✅ Created user profile: ${userData.name}`);
    return response;
  } catch (error) {
    console.error(`❌ Error creating user profile for ${userData.name}:`, error);
    return null;
  }
}

// Add items for a specific user
async function addItemsForUser(userEmail, userId) {
  const items = userItems[userEmail] || [];
  const addedItems = [];
  
  for (const item of items) {
    try {
      const itemData = {
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        price: item.price,
        images: item.images,
        tags: item.tags,
        trade_preferences: item.trade_preferences,
        user_id: userId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Random engagement stats
        views: Math.floor(Math.random() * 200) + 50,
        favorites: Math.floor(Math.random() * 30) + 5,
        is_featured: Math.random() > 0.7,
        
        // Location (inherit from user's area)
        location: demoUsers.find(u => u.email === userEmail)?.location || "Maryland",
        latitude: 39.0458 + (Math.random() - 0.5) * 0.5,
        longitude: -76.6413 + (Math.random() - 0.5) * 0.5,
        
        // Additional fields
        negotiable: item.negotiable,
        delivery_available: item.delivery_available,
        shipping_available: item.shipping_available,
        
        // AI fields
        ai_category_confidence: 0.9 + Math.random() * 0.1,
        ai_suggested_price: item.price + Math.floor(Math.random() * 40) - 20,
        ai_quality_score: 0.75 + Math.random() * 0.25
      };
      
      const response = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.items,
        ID.unique(),
        itemData
      );
      
      console.log(`✅ Added item: ${item.title} for ${userEmail}`);
      addedItems.push(response);
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error adding item "${item.title}" for ${userEmail}:`, error);
    }
  }
  
  return addedItems;
}

// Main function to create all demo data
export async function createDemoUsersAndItems() {
  console.log('🎭 Creating demo users and populating with items...');
  
  const createdUsers = [];
  const allItems = [];
  
  for (const userData of demoUsers) {
    // Create user profile
    const userProfile = await createUserProfile(userData);
    if (userProfile) {
      createdUsers.push(userProfile);
      
      // Add items for this user
      const userItems = await addItemsForUser(userData.email, userProfile.$id);
      allItems.push(...userItems);
    }
    
    // Delay between users
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Create some "wants" for variety
  const demoWants = [
    {
      title: "Looking for Vintage Record Player",
      description: "Seeking a working vintage turntable, preferably from the 70s or 80s. Must be in good working condition.",
      category: "Electronics",
      tags: ["turntable", "vintage", "record player", "audio"],
      max_price: 200,
      user_id: createdUsers[0]?.$id
    },
    {
      title: "Want Gaming Desktop PC",
      description: "Looking for a powerful gaming PC for streaming and content creation. RTX 3070 or better preferred.",
      category: "Electronics", 
      tags: ["gaming pc", "desktop", "rtx", "gaming"],
      max_price: 1500,
      user_id: createdUsers[3]?.$id
    },
    {
      title: "Seeking Vintage Cookbooks",
      description: "Collecting vintage cookbooks from the 1950s-1970s. Especially interested in regional or community cookbooks.",
      category: "Books",
      tags: ["cookbook", "vintage", "cooking", "recipe"],
      max_price: 50,
      user_id: createdUsers[2]?.$id
    }
  ];
  
  // Add wants to database
  for (const want of demoWants) {
    if (want.user_id) {
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
  }
  
  console.log(`
    🎉 Demo Data Creation Complete!
    
    👥 Users Created: ${createdUsers.length}
    📦 Items Added: ${allItems.length}
    🔍 Wants Added: ${demoWants.length}
    
    Demo users can now log in with:
    ${demoUsers.map(u => `- ${u.email}`).join('\n    ')}
  `);
  
  return {
    users: createdUsers,
    items: allItems,
    success: createdUsers.length > 0
  };
}

// Function to clean up demo data
export async function cleanupDemoData() {
  console.log('🧹 Cleaning up demo data...');
  
  try {
    // Get all demo users
    const demoEmails = demoUsers.map(u => u.email);
    
    // Clean up items first
    for (const email of demoEmails) {
      const users = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.users,
        [Query.equal('email', email)]
      );
      
      for (const user of users.documents) {
        // Delete user's items
        const items = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.items,
          [Query.equal('user_id', user.$id)]
        );
        
        for (const item of items.documents) {
          await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.items,
            item.$id
          );
        }
        
        // Delete user's wants
        const wants = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.wants,
          [Query.equal('user_id', user.$id)]
        );
        
        for (const want of wants.documents) {
          await databases.deleteDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collections.wants,
            want.$id
          );
        }
        
        // Delete user profile
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.users,
          user.$id
        );
        
        console.log(`🗑️ Cleaned up data for: ${email}`);
      }
    }
    
    console.log('✅ Demo data cleanup complete');
    return true;
  } catch (error) {
    console.error('❌ Error cleaning up demo data:', error);
    return false;
  }
}

// Auto-run if accessed with demo parameter
if (typeof window !== 'undefined' && window.location.search.includes('demo=true')) {
  createDemoUsersAndItems();
}