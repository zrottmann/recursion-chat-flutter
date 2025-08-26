/**
 * Sample Data Creator for Trading Post
 * Creates realistic sample data to populate empty collections for testing
 * @author Claude AI - Data Population Agent
 * @date 2025-08-18
 */

import { databases, DATABASE_ID, COLLECTIONS, Query, ID, account } from '../lib/appwrite';
import schemaFixer from './databaseSchemaFixer';

class SampleDataCreator {
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
    this.sampleItems = [];
    this.sampleUsers = [];
  }

  /**
   * Initialize and create comprehensive sample data
   */
  async createAllSampleData() {
    console.log('🏗️ Creating comprehensive sample data for Trading Post...');
    
    try {
      // Get current user
      this.currentUser = await account.get();
      console.log('👤 Current user:', this.currentUser.name, this.currentUser.$id);
      
      // Fix database schema first
      await schemaFixer.fixAllSchemaIssues();
      const fixedDb = schemaFixer.getFixedDatabaseWrapper();
      
      // Step 1: Create/update user profile
      await this.createUserProfile(fixedDb);
      
      // Step 2: Create sample items for current user
      await this.createSampleItems(fixedDb);
      
      // Step 3: Create sample wants
      await this.createSampleWants(fixedDb);
      
      // Step 4: Create sample other users (for trading partners)
      await this.createSampleUsers(fixedDb);
      
      // Step 5: Create sample trades
      await this.createSampleTrades(fixedDb);
      
      // Step 6: Create sample messages
      await this.createSampleMessages(fixedDb);
      
      // Step 7: Create AI matches
      await this.createSampleMatches(fixedDb);
      
      // Step 8: Create notifications
      await this.createSampleNotifications(fixedDb);
      
      // Step 9: Create saved items
      await this.createSampleSavedItems(fixedDb);
      
      console.log('✅ Sample data creation complete!');
      return {
        success: true,
        createdData: this.createdData,
        summary: this.generateSummary()
      };
      
    } catch (error) {
      console.error('❌ Sample data creation failed:', error);
      return {
        success: false,
        error: error.message,
        partialData: this.createdData
      };
    }
  }

  /**
   * Create or update user profile
   */
  async createUserProfile(db) {
    console.log('👤 Creating/updating user profile...');
    
    try {
      // Check if user profile already exists
      const existingUser = await db.getDocument(DATABASE_ID, COLLECTIONS.users, this.currentUser.$id);
      console.log('✅ User profile already exists');
      return existingUser;
    } catch (error) {
      if (error.code === 404) {
        // Create user profile
        const userData = {
          user_id: this.currentUser.$id,
          name: this.currentUser.name || 'Trading Post User',
          email: this.currentUser.email,
          location: 'New York, NY',
          bio: 'Enthusiastic trader looking for great deals and unique items!',
          rating: 4.8,
          trade_count: 12,
          member_since: new Date().toISOString(),
          preferences: {
            categories: ['Electronics', 'Books', 'Collectibles', 'Home & Garden'],
            max_distance: 50,
            preferred_meeting_type: 'public_place'
          },
          is_active: true,
          last_active: new Date().toISOString(),
          verification_status: 'verified',
          profile_image_url: null
        };
        
        const newUser = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          this.currentUser.$id,
          userData
        );
        
        this.createdData.users.push(newUser);
        console.log('✅ User profile created');
        return newUser;
      }
      throw error;
    }
  }

  /**
   * Create sample items for current user
   */
  async createSampleItems(db) {
    console.log('📦 Creating sample items...');
    
    const sampleItemsData = [
      {
        title: 'MacBook Pro 13" 2021',
        description: 'Gently used MacBook Pro in excellent condition. Includes original charger and box. Perfect for students or professionals.',
        category: 'Electronics',
        subcategory: 'Computers',
        condition: 'excellent',
        estimated_value: 1200,
        trade_preference: 'equal_value',
        location: 'Manhattan, NY',
        images: [],
        tags: ['macbook', 'laptop', 'apple', 'professional'],
        is_featured: true,
        trade_status: 'available'
      },
      {
        title: 'Vintage Vinyl Record Collection',
        description: 'Rare collection of 1970s rock and jazz vinyl records. Over 50 albums including Led Zeppelin, Pink Floyd, and Miles Davis.',
        category: 'Collectibles',
        subcategory: 'Music',
        condition: 'good',
        estimated_value: 800,
        trade_preference: 'music_related',
        location: 'Brooklyn, NY',
        images: [],
        tags: ['vinyl', 'records', 'vintage', 'music', 'collectible'],
        is_featured: false,
        trade_status: 'available'
      },
      {
        title: 'Professional Camera Kit',
        description: 'Canon EOS 5D Mark IV with 24-70mm lens, tripod, and camera bag. Excellent for photography enthusiasts.',
        category: 'Electronics',
        subcategory: 'Cameras',
        condition: 'excellent',
        estimated_value: 2000,
        trade_preference: 'photography_equipment',
        location: 'Queens, NY',
        images: [],
        tags: ['camera', 'canon', 'photography', 'professional'],
        is_featured: true,
        trade_status: 'available'
      },
      {
        title: 'Antique Oak Dining Table',
        description: 'Beautiful handcrafted oak dining table that seats 6. Some minor wear but very sturdy and character-rich.',
        category: 'Furniture',
        subcategory: 'Dining',
        condition: 'good',
        estimated_value: 600,
        trade_preference: 'furniture',
        location: 'Staten Island, NY',
        images: [],
        tags: ['furniture', 'dining', 'oak', 'antique'],
        is_featured: false,
        trade_status: 'available'
      },
      {
        title: 'Rare Book Collection',
        description: 'First edition science fiction novels including Dune, Foundation series, and Neuromancer. Well-preserved collector items.',
        category: 'Books',
        subcategory: 'Fiction',
        condition: 'excellent',
        estimated_value: 400,
        trade_preference: 'books',
        location: 'Manhattan, NY',
        images: [],
        tags: ['books', 'first-edition', 'science-fiction', 'collectible'],
        is_featured: false,
        trade_status: 'available'
      }
    ];
    
    for (const itemData of sampleItemsData) {
      try {
        const item = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.items,
          ID.unique(),
          {
            ...itemData,
            user_id: this.currentUser.$id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            view_count: Math.floor(Math.random() * 50) + 10,
            save_count: Math.floor(Math.random() * 15) + 2,
            is_active: true
          }
        );
        
        this.createdData.items.push(item);
        this.sampleItems.push(item);
        console.log(`✅ Created item: ${item.title}`);
      } catch (error) {
        console.error(`❌ Failed to create item ${itemData.title}:`, error);
      }
    }
  }

  /**
   * Create sample wants/wishlist items
   */
  async createSampleWants(db) {
    console.log('🎯 Creating sample wants...');
    
    const sampleWants = [
      {
        title: 'Gaming Laptop',
        description: 'Looking for a high-performance gaming laptop with RTX graphics card',
        category: 'Electronics',
        max_value: 1500,
        preferred_brands: ['ASUS', 'MSI', 'Alienware'],
        priority: 'high'
      },
      {
        title: 'Vintage Guitar',
        description: 'Interested in vintage acoustic or electric guitars, especially Fender or Gibson',
        category: 'Musical Instruments',
        max_value: 1000,
        preferred_brands: ['Fender', 'Gibson', 'Martin'],
        priority: 'medium'
      },
      {
        title: 'Art Supplies',
        description: 'Professional art supplies including easel, canvas, and oil paints',
        category: 'Art & Crafts',
        max_value: 300,
        preferred_brands: ['Winsor & Newton', 'Liquitex'],
        priority: 'low'
      }
    ];
    
    for (const wantData of sampleWants) {
      try {
        const want = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.wants,
          ID.unique(),
          {
            ...wantData,
            user_id: this.currentUser.$id,
            created_at: new Date().toISOString(),
            is_active: true,
            location_preference: 'New York, NY',
            max_distance: 25
          }
        );
        
        this.createdData.wants.push(want);
        console.log(`✅ Created want: ${want.title}`);
      } catch (error) {
        console.error(`❌ Failed to create want ${wantData.title}:`, error);
      }
    }
  }

  /**
   * Create sample users for trading partners
   */
  async createSampleUsers(db) {
    console.log('👥 Creating sample trading partners...');
    
    const sampleUsersData = [
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
        location: 'Brooklyn, NY',
        bio: 'Art enthusiast and book collector. Love finding unique vintage items!',
        rating: 4.9,
        trade_count: 28
      },
      {
        name: 'Bob Martinez',
        email: 'bob.martinez@example.com',
        location: 'Queens, NY',
        bio: 'Tech professional always looking for the latest gadgets and equipment.',
        rating: 4.7,
        trade_count: 15
      },
      {
        name: 'Carol Zhang',
        email: 'carol.zhang@example.com',
        location: 'Manhattan, NY',
        bio: 'Furniture restorer and home decor enthusiast. Sustainable living advocate.',
        rating: 4.8,
        trade_count: 22
      }
    ];
    
    for (const userData of sampleUsersData) {
      try {
        const userId = ID.unique();
        // Prepare user data with required fields
        const userDocument = {
          ...userData,
          username: userData.name.toLowerCase().replace(/\s+/g, '_'), // Generate username from name
          user_id: userId, // Add user_id field
          userId: userId, // Add userId field for consistency
          member_since: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          last_active: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          verification_status: 'verified',
          preferences: {
            categories: ['Electronics', 'Art', 'Furniture', 'Books'],
            max_distance: 30,
              preferred_meeting_type: 'public_place'
          }
        };
        
        console.log('🔍 [SampleData] Creating user:', userDocument.name, 'with username:', userDocument.username);
        
        const user = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.users,
          userId,
          userDocument
        );
        
        this.createdData.users.push(user);
        this.sampleUsers.push(user);
        console.log(`✅ Created user: ${user.name}`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.name}:`, error);
      }
    }
  }

  /**
   * Create sample trades
   */
  async createSampleTrades(db) {
    console.log('🤝 Creating sample trades...');
    
    if (this.sampleItems.length === 0 || this.sampleUsers.length === 0) {
      console.log('⚠️ No sample items or users available for trade creation');
      return;
    }
    
    const sampleTrades = [
      {
        status: 'pending',
        trade_type: 'direct_swap',
        message: 'Hi! I\'m interested in trading my vintage guitar for your MacBook. Let me know if you\'re interested!'
      },
      {
        status: 'accepted',
        trade_type: 'direct_swap',
        message: 'Great! I\'d love to trade my art supplies for your book collection. When can we meet?'
      },
      {
        status: 'completed',
        trade_type: 'direct_swap',
        message: 'Perfect trade! Thank you for the camera equipment. Everything works great!'
      }
    ];
    
    for (let i = 0; i < Math.min(sampleTrades.length, this.sampleItems.length, this.sampleUsers.length); i++) {
      try {
        const tradeData = sampleTrades[i];
        const item = this.sampleItems[i];
        const otherUser = this.sampleUsers[i];
        
        const trade = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.trades,
          ID.unique(),
          {
            ...tradeData,
            user1_id: this.currentUser.$id, // Current user offering
            user2_id: otherUser.$id, // Other user interested
            item1_id: item.$id,
            item1_title: item.title,
            proposed_meeting_location: 'Central Park, NYC',
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
            meeting_details: tradeData.status === 'accepted' ? {
              location: 'Central Park Bethesda Fountain',
              date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              confirmed: true
            } : {},
            completion_details: tradeData.status === 'completed' ? {
              completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              rating_user1: 5,
              rating_user2: 5
            } : {}
          }
        );
        
        this.createdData.trades.push(trade);
        console.log(`✅ Created trade: ${tradeData.status}`);
      } catch (error) {
        console.error(`❌ Failed to create trade:`, error);
      }
    }
  }

  /**
   * Create sample messages
   */
  async createSampleMessages(db) {
    console.log('💬 Creating sample messages...');
    
    if (this.sampleUsers.length === 0) {
      console.log('⚠️ No sample users available for message creation');
      return;
    }
    
    const messageThreads = [
      {
        otherUser: this.sampleUsers[0],
        messages: [
          { sender: 'other', content: 'Hi! I saw your MacBook listing. Is it still available?', timestamp: -60 },
          { sender: 'current', content: 'Yes, it\'s still available! Are you interested in trading?', timestamp: -45 },
          { sender: 'other', content: 'Definitely! I have a vintage guitar collection. Want to see some photos?', timestamp: -30 },
          { sender: 'current', content: 'That sounds interesting! I\'d love to see what you have.', timestamp: -15 }
        ]
      },
      {
        otherUser: this.sampleUsers[1],
        messages: [
          { sender: 'other', content: 'Your camera equipment looks amazing! What would you want to trade for it?', timestamp: -120 },
          { sender: 'current', content: 'Thanks! I\'m looking for professional art supplies or maybe some tech gadgets.', timestamp: -100 },
          { sender: 'other', content: 'I have a great set of Wacom tablets and digital art tools. Interested?', timestamp: -80 }
        ]
      }
    ];
    
    for (const thread of messageThreads) {
      for (const msg of thread.messages) {
        try {
          const message = await db.createDocument(
            DATABASE_ID,
            COLLECTIONS.messages,
            ID.unique(),
            {
              sender_id: msg.sender === 'current' ? this.currentUser.$id : thread.otherUser.$id,
              recipient_id: msg.sender === 'current' ? thread.otherUser.$id : this.currentUser.$id,
              content: msg.content,
              created_at: new Date(Date.now() + msg.timestamp * 60 * 1000).toISOString(),
              is_read: Math.random() > 0.3,
              message_type: 'text',
              attachments: [],
              metadata: {}
            }
          );
          
          this.createdData.messages.push(message);
        } catch (error) {
          console.error(`❌ Failed to create message:`, error);
        }
      }
    }
    
    console.log(`✅ Created ${this.createdData.messages.length} messages`);
  }

  /**
   * Create sample AI matches
   */
  async createSampleMatches(db) {
    console.log('🤖 Creating sample AI matches...');
    
    if (this.sampleItems.length === 0) {
      console.log('⚠️ No sample items available for match creation');
      return;
    }
    
    for (let i = 0; i < Math.min(this.sampleItems.length, this.sampleUsers.length); i++) {
      try {
        const match = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.matches,
          ID.unique(),
          {
            user_id: this.currentUser.$id,
            matched_item_id: this.sampleItems[i].$id,
            matched_user_id: this.sampleUsers[i % this.sampleUsers.length].$id,
            confidence_score: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
            match_reasons: [
              'Similar value range',
              'Complementary categories',
              'Location proximity',
              'High user rating'
            ],
            ai_explanation: `This match has a ${Math.floor((Math.random() * 0.4 + 0.6) * 100)}% compatibility based on value, location, and trading preferences.`,
            status: 'active',
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        );
        
        this.createdData.matches.push(match);
        console.log(`✅ Created AI match with ${match.confidence_score.toFixed(2)} confidence`);
      } catch (error) {
        console.error(`❌ Failed to create match:`, error);
      }
    }
  }

  /**
   * Create sample notifications
   */
  async createSampleNotifications(db) {
    console.log('🔔 Creating sample notifications...');
    
    const notificationTypes = [
      {
        type: 'new_match',
        title: 'New AI Match Found!',
        message: 'We found a great trading partner for your MacBook Pro. Check it out!',
        priority: 'high'
      },
      {
        type: 'trade_request',
        title: 'New Trade Request',
        message: 'Someone wants to trade for your vintage vinyl collection.',
        priority: 'medium'
      },
      {
        type: 'message_received',
        title: 'New Message',
        message: 'You have a new message from Alice about the camera equipment.',
        priority: 'low'
      },
      {
        type: 'trade_accepted',
        title: 'Trade Accepted!',
        message: 'Great news! Bob accepted your trade proposal.',
        priority: 'high'
      }
    ];
    
    for (const notifData of notificationTypes) {
      try {
        const notificationDoc = {
          ...notifData,
          userId: this.currentUser.$id, // Primary field required by field mapping
          user_id: this.currentUser.$id, // Fallback field
          recipient_id: this.currentUser.$id, // Another fallback field
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_read: Math.random() > 0.6,
          action_url: '/trades',
          metadata: {
            source: 'ai_matching_system'
          }
        };
        
        console.log('🔍 [SampleData] Creating notification with userId:', notificationDoc.userId);
        
        const notification = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.notifications,
          ID.unique(),
          notificationDoc
        );
        
        this.createdData.notifications.push(notification);
        console.log(`✅ Created notification: ${notification.title}`);
      } catch (error) {
        console.error(`❌ Failed to create notification:`, error);
      }
    }
  }

  /**
   * Create sample saved items
   */
  async createSampleSavedItems(db) {
    console.log('💾 Creating sample saved items...');
    
    if (this.sampleItems.length === 0) {
      console.log('⚠️ No sample items available for saved items creation');
      return;
    }
    
    // Save a few random items
    const itemsToSave = this.sampleItems.slice(0, 3);
    
    for (const item of itemsToSave) {
      try {
        const savedItem = await db.createDocument(
          DATABASE_ID,
          COLLECTIONS.savedItems,
          ID.unique(),
          {
            user_id: this.currentUser.$id,
            item_id: item.$id,
            item_title: item.title,
            item_owner_id: item.user_id,
            saved_at: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Interesting trade opportunity',
            priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
          }
        );
        
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
}

// Create singleton instance
const sampleDataCreator = new SampleDataCreator();

// Export for use in components
export default sampleDataCreator;
export { SampleDataCreator };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.sampleDataCreator = sampleDataCreator;
  window.createSampleData = () => sampleDataCreator.createAllSampleData();
}