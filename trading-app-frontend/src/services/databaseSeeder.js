/**
 * Enhanced Database Seeder for Trading Post
 * Comprehensive test data creation service that combines and enhances existing utilities
 * @author Claude Code - Technical Lead Orchestrator
 * @date 2025-08-18
 */

import { databases, DATABASE_ID, COLLECTIONS, Query, ID, account } from '../lib/appwrite';
import { smartDatabases } from '../utils/fixDatabaseSchema';

class DatabaseSeeder {
  constructor() {
    this.currentUser = null;
    this.createdData = {
      users: [],
      items: [],
      wants: [],
      trades: [],
      messages: [],
      matches: [],
      notifications: [],
      savedItems: []
    };
  }

  /**
   * Main seeding function - creates comprehensive test data
   */
  async seedDatabase(options = {}) {
    console.log('🌱 Starting comprehensive database seeding...');
    
    const {
      includeUsers = true,
      includeItems = true,
      includeWants = true,
      includeTrades = true,
      includeMessages = true,
      includeMatches = true,
      includeNotifications = true,
      includeSavedItems = true,
      userCount = 8,
      itemsPerUser = 4,
      wantsPerUser = 2
    } = options;

    try {
      // Get current user
      this.currentUser = await account.get();
      console.log('👤 Seeding for user:', this.currentUser.name, this.currentUser.$id);

      // Use smart database wrapper
      const db = smartDatabases;

      // Create current user profile if it doesn't exist
      await this.createCurrentUserProfile(db);

      // Create diverse user base
      if (includeUsers) {
        await this.createDiverseUsers(db, userCount);
      }

      // Create items for all users
      if (includeItems) {
        await this.createItemsForAllUsers(db, itemsPerUser);
      }

      // Create wants/wishlist items
      if (includeWants) {
        await this.createWantsForUsers(db, wantsPerUser);
      }

      // Create trades between users
      if (includeTrades) {
        await this.createRealisticTrades(db);
      }

      // Create message conversations
      if (includeMessages) {
        await this.createMessageThreads(db);
      }

      // Create AI matches
      if (includeMatches) {
        await this.createAIMatches(db);
      }

      // Create notifications
      if (includeNotifications) {
        await this.createNotifications(db);
      }

      // Create saved items
      if (includeSavedItems) {
        await this.createSavedItems(db);
      }

      const summary = this.generateSummary();
      console.log(`
🎉 Database seeding complete!

📊 Summary:
👥 Users: ${summary.users}
📦 Items: ${summary.items}
🎯 Wants: ${summary.wants}
🤝 Trades: ${summary.trades}
💬 Messages: ${summary.messages}
🤖 Matches: ${summary.matches}
🔔 Notifications: ${summary.notifications}
💾 Saved Items: ${summary.savedItems}

Total records created: ${summary.total}
      `);

      return {
        success: true,
        summary,
        createdData: this.createdData
      };

    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      return {
        success: false,
        error: error.message,
        partialData: this.createdData
      };
    }
  }

  /**
   * Create or update current user profile
   */
  async createCurrentUserProfile(db) {
    try {
      const existingProfile = await db.getDocument(DATABASE_ID, COLLECTIONS.users, this.currentUser.$id);
      console.log('✅ User profile already exists');
      return existingProfile;
    } catch (error) {
      if (error.code === 404) {
        const userData = {
          email: this.currentUser.email,
          username: this.currentUser.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user' + Date.now().toString().slice(-6),
          bio: 'Enthusiastic trader looking for great deals and unique items!',
          location: 'Baltimore, MD',
          rating: 4.8,
          totalReviews: 15,
          totalTrades: 23,
          joinedDate: new Date().toISOString(),
          isVerified: true,
          preferences: {
            notifications: true,
            newsletter: false,
            publicProfile: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const profile = await db.createDocument(DATABASE_ID, COLLECTIONS.users, this.currentUser.$id, userData);
        this.createdData.users.push(profile);
        console.log('✅ Created user profile');
        return profile;
      }
      throw error;
    }
  }

  /**
   * Create diverse user base with different demographics and interests
   */
  async createDiverseUsers(db, count) {
    console.log(`👥 Creating ${count} diverse users...`);

    const userTemplates = [
      {
        name: "Sarah Chen",
        email: "sarah.chen@example.com",
        username: "sarahc_trades",
        bio: "Tech enthusiast and vintage furniture collector. Love finding unique pieces with character!",
        location: "Columbia, MD",
        interests: ["technology", "vintage", "furniture", "art"],
        rating: 4.9,
        totalTrades: 34,
        specialties: ["Electronics", "Furniture", "Art"]
      },
      {
        name: "Marcus Johnson",
        email: "marcus.j@example.com", 
        username: "marcus_outdoor",
        bio: "Outdoor enthusiast and sports gear expert. Always ready for the next adventure!",
        location: "Annapolis, MD",
        interests: ["outdoors", "sports", "fitness", "camping"],
        rating: 4.7,
        totalTrades: 28,
        specialties: ["Sports", "Outdoor Gear", "Fitness"]
      },
      {
        name: "Elena Rodriguez",
        email: "elena.rodriguez@example.com",
        username: "elena_bookworm",
        bio: "Literature professor and book collector. Passionate about first editions and rare finds.",
        location: "Bethesda, MD",
        interests: ["books", "literature", "education", "coffee"],
        rating: 4.8,
        totalTrades: 19,
        specialties: ["Books", "Education", "Collectibles"]
      },
      {
        name: "David Kim",
        email: "david.kim@example.com",
        username: "dkim_gamer",
        bio: "Gaming enthusiast and electronics expert. Building the ultimate setup one trade at a time!",
        location: "Silver Spring, MD",
        interests: ["gaming", "technology", "electronics", "streaming"],
        rating: 4.6,
        totalTrades: 41,
        specialties: ["Electronics", "Gaming", "Technology"]
      },
      {
        name: "Lisa Thompson",
        email: "lisa.thompson@example.com",
        username: "lisa_fashion",
        bio: "Fashion designer and style consultant. Curating beautiful wardrobes through sustainable trading.",
        location: "Rockville, MD",
        interests: ["fashion", "design", "sustainability", "art"],
        rating: 4.7,
        totalTrades: 25,
        specialties: ["Clothing", "Fashion", "Accessories"]
      },
      {
        name: "Ahmed Hassan",
        email: "ahmed.hassan@example.com",
        username: "ahmed_music",
        bio: "Music producer and vinyl collector. Always hunting for rare records and audio equipment.",
        location: "College Park, MD",
        interests: ["music", "audio", "production", "vinyl"],
        rating: 4.8,
        totalTrades: 32,
        specialties: ["Music", "Audio Equipment", "Vinyl"]
      },
      {
        name: "Jennifer Walsh",
        email: "jennifer.walsh@example.com",
        username: "jen_kitchen",
        bio: "Professional chef and culinary tools enthusiast. Love trading kitchen gadgets and cookbooks!",
        location: "Gaithersburg, MD",
        interests: ["cooking", "culinary", "kitchen", "food"],
        rating: 4.9,
        totalTrades: 22,
        specialties: ["Kitchen", "Cooking", "Appliances"]
      },
      {
        name: "Robert Chen",
        email: "robert.chen@example.com",
        username: "rob_tools",
        bio: "Master carpenter and tool collector. Quality craftsmanship tools deserve good homes!",
        location: "Frederick, MD",
        interests: ["woodworking", "tools", "craftsmanship", "DIY"],
        rating: 4.6,
        totalTrades: 37,
        specialties: ["Tools", "Woodworking", "DIY"]
      }
    ];

    const selectedUsers = userTemplates.slice(0, count);

    for (const template of selectedUsers) {
      try {
        const userId = ID.unique();
        const userData = {
          ...template,
          user_id: userId,
          totalReviews: Math.floor(template.totalTrades * 0.8) + Math.floor(Math.random() * 5),
          isVerified: Math.random() > 0.2, // 80% verification rate
          joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preferences: {
            notifications: Math.random() > 0.3,
            newsletter: Math.random() > 0.6,
            publicProfile: Math.random() > 0.1
          }
        };

        const user = await db.createDocument(DATABASE_ID, COLLECTIONS.users, userId, userData);
        this.createdData.users.push(user);
        console.log(`✅ Created user: ${template.name}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        console.error(`❌ Failed to create user ${template.name}:`, error);
      }
    }
  }

  /**
   * Create realistic items for all users
   */
  async createItemsForAllUsers(db, itemsPerUser) {
    console.log(`📦 Creating ${itemsPerUser} items per user...`);

    const itemCategories = {
      "Electronics": [
        {
          title: "MacBook Pro 16\" M1 Max",
          description: "Professional laptop in excellent condition. Perfect for video editing, development, and creative work. Includes original charger and documentation.",
          condition: "excellent",
          estimated_value: 2200,
          tags: ["macbook", "laptop", "apple", "professional", "m1"]
        },
        {
          title: "Sony A7R IV Camera Kit",
          description: "Professional mirrorless camera with 24-70mm f/2.8 lens, extra batteries, and carrying case. Perfect for photography enthusiasts.",
          condition: "like_new", 
          estimated_value: 2800,
          tags: ["camera", "sony", "photography", "professional", "mirrorless"]
        },
        {
          title: "iPhone 14 Pro - 256GB",
          description: "Space Black iPhone in pristine condition. Always kept in case with screen protector. Battery health 96%.",
          condition: "excellent",
          estimated_value: 900,
          tags: ["iphone", "apple", "smartphone", "mobile", "256gb"]
        },
        {
          title: "ASUS ROG Gaming Laptop",
          description: "High-performance gaming laptop with RTX 3080, perfect for gaming and content creation. Includes gaming mouse.",
          condition: "good",
          estimated_value: 1500,
          tags: ["gaming", "laptop", "asus", "rtx", "high-performance"]
        }
      ],
      "Furniture": [
        {
          title: "Mid-Century Modern Dining Set",
          description: "Authentic 1960s teak dining table with 6 matching chairs. Recently restored, beautiful wood grain and craftsmanship.",
          condition: "excellent",
          estimated_value: 1200,
          tags: ["mid-century", "dining", "teak", "vintage", "restored"]
        },
        {
          title: "Herman Miller Aeron Chair",
          description: "Size B ergonomic office chair in graphite. All adjustments work perfectly, recently deep cleaned.",
          condition: "good",
          estimated_value: 600,
          tags: ["office", "chair", "herman-miller", "ergonomic", "desk"]
        },
        {
          title: "Vintage Industrial Bookshelf",
          description: "Solid steel and wood bookshelf with amazing character. Perfect for modern industrial or loft spaces.",
          condition: "good",
          estimated_value: 400,
          tags: ["bookshelf", "industrial", "vintage", "storage", "steel"]
        },
        {
          title: "Scandinavian Sofa Set",
          description: "Beautiful grey fabric 3-seater sofa with matching armchair. Clean lines, very comfortable, pet-free home.",
          condition: "excellent",
          estimated_value: 800,
          tags: ["sofa", "scandinavian", "modern", "living-room", "fabric"]
        }
      ],
      "Sports": [
        {
          title: "Trek Mountain Bike - Full Suspension",
          description: "High-end mountain bike with 29\" wheels, recently serviced with new tires. Perfect for trails and adventure.",
          condition: "excellent",
          estimated_value: 1800,
          tags: ["mountain-bike", "trek", "full-suspension", "cycling", "29-inch"]
        },
        {
          title: "Complete Home Gym Setup",
          description: "Professional home gym including power rack, Olympic barbell, 300lbs plates, and adjustable bench.",
          condition: "good",
          estimated_value: 1200,
          tags: ["gym", "weights", "fitness", "power-rack", "olympic"]
        },
        {
          title: "Kayak with Accessories",
          description: "10ft recreational kayak in excellent condition. Includes paddle, life jacket, and dry bag storage.",
          condition: "like_new",
          estimated_value: 600,
          tags: ["kayak", "water-sports", "outdoor", "recreation", "accessories"]
        },
        {
          title: "Golf Club Set - Premium",
          description: "Complete Titleist golf set with driver, irons, wedges, putter, and premium golf bag. Well maintained.",
          condition: "good",
          estimated_value: 1500,
          tags: ["golf", "titleist", "clubs", "premium", "complete-set"]
        }
      ],
      "Books": [
        {
          title: "First Edition Science Fiction Collection",
          description: "Rare collection including first editions of Dune, Foundation, Neuromancer, and other sci-fi classics.",
          condition: "excellent",
          estimated_value: 800,
          tags: ["first-edition", "science-fiction", "collectible", "rare", "classic"]
        },
        {
          title: "Programming Books Library",
          description: "Professional development library with latest editions of JavaScript, Python, React, and system design books.",
          condition: "like_new",
          estimated_value: 300,
          tags: ["programming", "technical", "javascript", "python", "development"]
        },
        {
          title: "Vintage Art Books Collection",
          description: "Beautiful collection of art history books, museum catalogs, and coffee table books on various artists.",
          condition: "good",
          estimated_value: 450,
          tags: ["art", "history", "vintage", "museum", "coffee-table"]
        },
        {
          title: "Medical Textbooks - Latest Editions",
          description: "Current medical school textbooks including anatomy, physiology, and clinical references. Excellent for students.",
          condition: "excellent",
          estimated_value: 1200,
          tags: ["medical", "textbooks", "anatomy", "clinical", "education"]
        }
      ],
      "Kitchen": [
        {
          title: "Professional KitchenAid Stand Mixer",
          description: "6-quart professional mixer in pristine condition. Includes dough hook, whisk, and paddle attachments.",
          condition: "excellent",
          estimated_value: 400,
          tags: ["kitchenaid", "mixer", "professional", "baking", "appliance"]
        },
        {
          title: "Complete Knife Set - German Steel",
          description: "Professional chef knife set with magnetic block, sharpener, and kitchen scissors. Restaurant quality.",
          condition: "like_new",
          estimated_value: 600,
          tags: ["knives", "chef", "german-steel", "professional", "cooking"]
        },
        {
          title: "Espresso Machine - Semi-Automatic",
          description: "Breville Barista Express with built-in grinder. Makes café-quality espresso at home. Recently serviced.",
          condition: "good",
          estimated_value: 500,
          tags: ["espresso", "coffee", "breville", "semi-automatic", "grinder"]
        },
        {
          title: "Cast Iron Collection",
          description: "Le Creuset Dutch oven, Lodge skillets, and enameled cookware set. Perfect for serious home cooking.",
          condition: "excellent",
          estimated_value: 350,
          tags: ["cast-iron", "le-creuset", "lodge", "cookware", "dutch-oven"]
        }
      ],
      "Tools": [
        {
          title: "DeWalt Cordless Tool Kit",
          description: "Complete set including drill, impact driver, circular saw, reciprocating saw with 4 batteries and charger.",
          condition: "excellent",
          estimated_value: 800,
          tags: ["dewalt", "cordless", "power-tools", "complete-set", "batteries"]
        },
        {
          title: "Woodworking Hand Tools",
          description: "Vintage hand plane set, chisels, and measuring tools. Perfect for traditional woodworking crafts.",
          condition: "good",
          estimated_value: 400,
          tags: ["woodworking", "hand-tools", "vintage", "planes", "chisels"]
        },
        {
          title: "Professional Mechanic Tools",
          description: "Complete socket and wrench set with tool chest. Everything needed for automotive and general repair work.",
          condition: "like_new",
          estimated_value: 600,
          tags: ["mechanic", "tools", "socket-set", "automotive", "professional"]
        },
        {
          title: "Table Saw - Cabinet Style",
          description: "Professional cabinet table saw with fence system, excellent for precision woodworking projects.",
          condition: "good",
          estimated_value: 1500,
          tags: ["table-saw", "cabinet", "woodworking", "professional", "precision"]
        }
      ]
    };

    // Create items for each user based on their specialties
    for (const user of this.createdData.users) {
      const userSpecialties = user.specialties || ["Electronics", "Furniture", "Kitchen"];
      
      for (let i = 0; i < itemsPerUser; i++) {
        try {
          // Choose category based on user's specialty
          const category = userSpecialties[Math.floor(Math.random() * userSpecialties.length)];
          const categoryItems = itemCategories[category] || itemCategories["Electronics"];
          const itemTemplate = categoryItems[Math.floor(Math.random() * categoryItems.length)];

          const itemData = {
            title: itemTemplate.title,
            description: itemTemplate.description,
            category: category,
            condition: itemTemplate.condition,
            estimated_value: itemTemplate.estimated_value,
            ai_estimated_value: itemTemplate.estimated_value + (Math.random() * 200 - 100),
            trade_preferences: this.generateTradePreferences(category),
            location_lat: 39.0458 + (Math.random() - 0.5) * 0.3,
            location_lng: -76.6413 + (Math.random() - 0.5) * 0.3,
            city: user.location.split(',')[0],
            state: 'MD',
            zipcode: this.generateMDZipcode(),
            images: JSON.stringify([`https://picsum.photos/400/300?random=${Date.now() + Math.random()}`]),
            primary_image_url: `https://picsum.photos/400/300?random=${Date.now() + Math.random()}`,
            is_available: Math.random() > 0.1, // 90% available
            is_featured: Math.random() > 0.8, // 20% featured
            views: Math.floor(Math.random() * 200) + 10,
            likes: Math.floor(Math.random() * 30) + 2,
            ai_tags: JSON.stringify(itemTemplate.tags),
            ai_analysis: JSON.stringify({
              confidence: 0.85 + Math.random() * 0.15,
              category_match: 0.95,
              condition_assessment: itemTemplate.condition,
              value_accuracy: 0.88
            }),
            created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user.$id
          };

          const item = await db.createDocument(DATABASE_ID, COLLECTIONS.items, ID.unique(), itemData);
          this.createdData.items.push(item);
          console.log(`✅ Created item: ${item.title} for ${user.username}`);

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 150));

        } catch (error) {
          console.error(`❌ Failed to create item for ${user.username}:`, error);
        }
      }
    }
  }

  /**
   * Generate trade preferences based on category
   */
  generateTradePreferences(category) {
    const preferences = {
      "Electronics": ["Latest gadgets", "Audio equipment", "Gaming gear", "Smart home devices"],
      "Furniture": ["Mid-century pieces", "Industrial furniture", "Office furniture", "Storage solutions"],
      "Sports": ["Outdoor gear", "Fitness equipment", "Water sports", "Cycling accessories"],
      "Books": ["First editions", "Technical books", "Art books", "Academic texts"],
      "Kitchen": ["Professional cookware", "Small appliances", "Specialty tools", "Bakeware"],
      "Tools": ["Power tools", "Hand tools", "Workshop equipment", "Specialty tools"]
    };

    const categoryPrefs = preferences[category] || preferences["Electronics"];
    return categoryPrefs.slice(0, 2 + Math.floor(Math.random() * 2)).join(", ");
  }

  /**
   * Generate Maryland zipcode
   */
  generateMDZipcode() {
    const mdZipcodes = ['21201', '21212', '21218', '21224', '20814', '20815', '20816', '20832', '20850', '20904', '20906'];
    return mdZipcodes[Math.floor(Math.random() * mdZipcodes.length)];
  }

  /**
   * Create wants for users
   */
  async createWantsForUsers(db, wantsPerUser) {
    console.log(`🎯 Creating ${wantsPerUser} wants per user...`);

    const wantTemplates = [
      {
        title: "Looking for Professional Camera",
        description: "Seeking a full-frame mirrorless camera for professional photography work",
        category: "Electronics",
        max_value: 2000
      },
      {
        title: "Vintage Mid-Century Furniture",
        description: "Interested in authentic mid-century modern pieces, especially seating",
        category: "Furniture", 
        max_value: 800
      },
      {
        title: "Mountain Bike - Full Suspension",
        description: "Looking for a quality mountain bike for weekend trail riding",
        category: "Sports",
        max_value: 1200
      },
      {
        title: "Professional Kitchen Equipment",
        description: "Need commercial-grade kitchen tools for home cooking setup",
        category: "Kitchen",
        max_value: 600
      },
      {
        title: "First Edition Books",
        description: "Collecting first edition novels, particularly science fiction classics",
        category: "Books",
        max_value: 300
      }
    ];

    for (const user of this.createdData.users.slice(0, 5)) { // Create wants for first 5 users
      for (let i = 0; i < wantsPerUser; i++) {
        try {
          const template = wantTemplates[Math.floor(Math.random() * wantTemplates.length)];
          
          const wantData = {
            title: template.title,
            description: template.description,
            category: template.category,
            max_value: template.max_value,
            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            location_preference: user.location,
            max_distance: 25 + Math.floor(Math.random() * 25),
            created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            user_id: user.$id
          };

          const want = await db.createDocument(DATABASE_ID, COLLECTIONS.wants, ID.unique(), wantData);
          this.createdData.wants.push(want);
          console.log(`✅ Created want: ${want.title}`);

        } catch (error) {
          console.error(`❌ Failed to create want:`, error);
        }
      }
    }
  }

  /**
   * Create realistic trade scenarios
   */
  async createRealisticTrades(db) {
    console.log(`🤝 Creating realistic trades...`);

    if (this.createdData.items.length < 2 || this.createdData.users.length < 2) {
      console.log('⚠️ Not enough items or users for trade creation');
      return;
    }

    const tradeScenarios = [
      { status: 'pending', message: 'Hi! I\'m interested in your item. Would you consider a trade?' },
      { status: 'accepted', message: 'Perfect! Let\'s meet up this weekend to complete the trade.' },
      { status: 'completed', message: 'Great trade! Everything was exactly as described.' },
      { status: 'rejected', message: 'Thanks for the offer, but I\'m looking for something different.' }
    ];

    for (let i = 0; i < Math.min(6, this.createdData.items.length); i++) {
      try {
        const item = this.createdData.items[i];
        const otherUser = this.createdData.users[i % this.createdData.users.length];
        const scenario = tradeScenarios[Math.floor(Math.random() * tradeScenarios.length)];

        const tradeData = {
          user1_id: this.currentUser.$id,
          user2_id: otherUser.$id,
          item1_id: item.$id,
          item1_title: item.title,
          status: scenario.status,
          trade_type: 'direct_swap',
          message: scenario.message,
          proposed_meeting_location: 'Public location in ' + item.city,
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        };

        if (scenario.status === 'completed') {
          tradeData.completion_details = {
            completed_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            rating_user1: 4 + Math.floor(Math.random() * 2), // 4 or 5 stars
            rating_user2: 4 + Math.floor(Math.random() * 2),
            feedback_user1: 'Great trade partner, highly recommended!',
            feedback_user2: 'Item was exactly as described, smooth transaction.'
          };
        }

        const trade = await db.createDocument(DATABASE_ID, COLLECTIONS.trades, ID.unique(), tradeData);
        this.createdData.trades.push(trade);
        console.log(`✅ Created ${scenario.status} trade`);

      } catch (error) {
        console.error(`❌ Failed to create trade:`, error);
      }
    }
  }

  /**
   * Create message threads
   */
  async createMessageThreads(db) {
    console.log(`💬 Creating message conversations...`);

    if (this.createdData.users.length === 0) {
      console.log('⚠️ No users available for message creation');
      return;
    }

    const conversations = [
      [
        { sender: 'other', content: 'Hi! Is your MacBook still available for trade?', delay: -120 },
        { sender: 'current', content: 'Yes, it is! What did you have in mind?', delay: -90 },
        { sender: 'other', content: 'I have a professional camera kit that might interest you', delay: -60 },
        { sender: 'current', content: 'That sounds great! Can you send some photos?', delay: -30 }
      ],
      [
        { sender: 'other', content: 'Your vintage furniture piece caught my eye!', delay: -240 },
        { sender: 'current', content: 'Thanks! It\'s a beautiful piece with great history', delay: -200 },
        { sender: 'other', content: 'Would you be interested in some professional tools?', delay: -150 },
        { sender: 'current', content: 'Possibly! What kind of tools are we talking about?', delay: -100 },
        { sender: 'other', content: 'DeWalt cordless set with lots of batteries and accessories', delay: -70 }
      ]
    ];

    for (let i = 0; i < Math.min(conversations.length, this.createdData.users.length); i++) {
      const otherUser = this.createdData.users[i];
      const conversation = conversations[i];

      for (const message of conversation) {
        try {
          const messageData = {
            sender_id: message.sender === 'current' ? this.currentUser.$id : otherUser.$id,
            recipient_id: message.sender === 'current' ? otherUser.$id : this.currentUser.$id,
            content: message.content,
            created_at: new Date(Date.now() + message.delay * 60 * 1000).toISOString(),
            is_read: Math.random() > 0.4, // 60% read rate
            message_type: 'text',
            attachments: [],
            metadata: {}
          };

          const msg = await db.createDocument(DATABASE_ID, COLLECTIONS.messages, ID.unique(), messageData);
          this.createdData.messages.push(msg);

        } catch (error) {
          console.error(`❌ Failed to create message:`, error);
        }
      }
    }

    console.log(`✅ Created ${this.createdData.messages.length} messages`);
  }

  /**
   * Create AI matches
   */
  async createAIMatches(db) {
    console.log(`🤖 Creating AI matches...`);

    for (let i = 0; i < Math.min(5, this.createdData.items.length); i++) {
      try {
        const item = this.createdData.items[i];
        const matchedUser = this.createdData.users[i % this.createdData.users.length];

        const matchData = {
          user_id: this.currentUser.$id,
          matched_item_id: item.$id,
          matched_user_id: matchedUser.$id,
          confidence_score: 0.65 + Math.random() * 0.35,
          match_reasons: [
            'Similar value range',
            'Compatible categories',
            'Geographic proximity',
            'High user rating'
          ],
          ai_explanation: `High compatibility match based on trading history and preferences`,
          status: 'active',
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        const match = await db.createDocument(DATABASE_ID, COLLECTIONS.matches, ID.unique(), matchData);
        this.createdData.matches.push(match);
        console.log(`✅ Created AI match with ${match.confidence_score.toFixed(2)} confidence`);

      } catch (error) {
        console.error(`❌ Failed to create match:`, error);
      }
    }
  }

  /**
   * Create notifications
   */
  async createNotifications(db) {
    console.log(`🔔 Creating notifications...`);

    const notificationTypes = [
      {
        type: 'new_match',
        title: 'New AI Match Found!',
        message: 'We found a perfect trading partner for your item',
        priority: 'high'
      },
      {
        type: 'trade_request',
        title: 'Trade Request Received',
        message: 'Someone wants to trade with you',
        priority: 'medium'
      },
      {
        type: 'message_received',
        title: 'New Message',
        message: 'You have a new message from a trader',
        priority: 'low'
      },
      {
        type: 'trade_accepted',
        title: 'Trade Accepted!',
        message: 'Great news! Your trade was accepted',
        priority: 'high'
      }
    ];

    for (const notifType of notificationTypes) {
      try {
        const notificationData = {
          user_id: this.currentUser.$id,
          type: notifType.type,
          title: notifType.title,
          message: notifType.message,
          priority: notifType.priority,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_read: Math.random() > 0.7, // 30% read
          action_url: '/trades',
          metadata: {
            source: 'database_seeder'
          }
        };

        const notification = await db.createDocument(DATABASE_ID, COLLECTIONS.notifications, ID.unique(), notificationData);
        this.createdData.notifications.push(notification);
        console.log(`✅ Created notification: ${notification.title}`);

      } catch (error) {
        console.error(`❌ Failed to create notification:`, error);
      }
    }
  }

  /**
   * Create saved items
   */
  async createSavedItems(db) {
    console.log(`💾 Creating saved items...`);

    const itemsToSave = this.createdData.items.slice(0, 4);

    for (const item of itemsToSave) {
      try {
        const savedItemData = {
          user_id: this.currentUser.$id,
          item_id: item.$id,
          item_title: item.title,
          item_owner_id: item.user_id,
          saved_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Interesting trading opportunity',
          priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
        };

        const savedItem = await db.createDocument(DATABASE_ID, COLLECTIONS.savedItems, ID.unique(), savedItemData);
        this.createdData.savedItems.push(savedItem);
        console.log(`✅ Saved item: ${item.title}`);

      } catch (error) {
        console.error(`❌ Failed to save item:`, error);
      }
    }
  }

  /**
   * Generate summary of created data
   */
  generateSummary() {
    return {
      users: this.createdData.users.length,
      items: this.createdData.items.length,
      wants: this.createdData.wants.length,
      trades: this.createdData.trades.length,
      messages: this.createdData.messages.length,
      matches: this.createdData.matches.length,
      notifications: this.createdData.notifications.length,
      savedItems: this.createdData.savedItems.length,
      total: Object.values(this.createdData).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  /**
   * Clean up all seeded data
   */
  async cleanup() {
    console.log('🧹 Cleaning up seeded data...');

    try {
      const db = smartDatabases;
      let deletedCount = 0;

      // Delete in reverse dependency order
      for (const collection of ['savedItems', 'notifications', 'matches', 'messages', 'trades', 'wants', 'items', 'users']) {
        if (this.createdData[collection]?.length > 0) {
          for (const item of this.createdData[collection]) {
            try {
              // Don't delete current user
              if (collection === 'users' && item.$id === this.currentUser?.$id) {
                continue;
              }
              
              await db.deleteDocument(DATABASE_ID, COLLECTIONS[collection], item.$id);
              deletedCount++;
            } catch (error) {
              console.error(`Failed to delete ${collection} item:`, error);
            }
          }
        }
      }

      console.log(`✅ Cleanup complete! Deleted ${deletedCount} records`);
      this.createdData = {
        users: [],
        items: [],
        wants: [],
        trades: [],
        messages: [],
        matches: [],
        notifications: [],
        savedItems: []
      };

      return { success: true, deletedCount };

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const databaseSeeder = new DatabaseSeeder();

export default databaseSeeder;
export { DatabaseSeeder };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.databaseSeeder = databaseSeeder;
  window.seedDatabase = (options) => databaseSeeder.seedDatabase(options);
  window.cleanupSeededData = () => databaseSeeder.cleanup();
}