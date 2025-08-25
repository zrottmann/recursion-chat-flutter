#!/usr/bin/env node

/**
 * Direct Database Seeder for Trading Post Marketplace
 * This script directly populates the Appwrite database with test items
 */

import { Client, Databases, ID, Query } from 'node-appwrite';

// Configuration - matches frontend configuration
const CONFIG = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    project: '689bdee000098bd9d55c',
    database: 'trading_post_db',
    collection: 'items',
    // You'll need to get this from Appwrite console -> Settings -> API Keys
    apiKey: '27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec',
    // Default user ID - replace with actual user ID from your account
    defaultUserId: 'user_placeholder'
};

// Initialize Appwrite client
const client = new Client()
    .setEndpoint(CONFIG.endpoint)
    .setProject(CONFIG.project)
    .setKey(CONFIG.apiKey);

const databases = new Databases(client);

// Test items to create
const TEST_ITEMS = [
    {
        title: "iPhone 12 Pro - Excellent Condition",
        description: "Barely used iPhone 12 Pro with original box, charger, and case. Battery health at 95%. No scratches or damage.",
        category: "electronics",
        condition: "excellent",
        estimated_value: 650.00,
        tags: ["apple", "smartphone", "iphone", "mobile"]
    },
    {
        title: "Nike Air Jordan 1 Sneakers",
        description: "Authentic Air Jordan 1 sneakers in size 10. Good condition with some wear on soles but uppers look great.",
        category: "clothing",
        condition: "good", 
        estimated_value: 220.00,
        tags: ["nike", "jordan", "sneakers", "shoes", "basketball"]
    },
    {
        title: "MacBook Pro 2020 - 13 inch",
        description: "MacBook Pro with M1 chip, 256GB SSD, 8GB RAM. Perfect for students or professionals. Includes original charger.",
        category: "electronics",
        condition: "good",
        estimated_value: 900.00,
        tags: ["apple", "laptop", "macbook", "computer"]
    },
    {
        title: "Harry Potter Complete Book Collection",
        description: "All 7 Harry Potter books in hardcover first editions. Some shelf wear but pages are in excellent condition.",
        category: "books",
        condition: "good",
        estimated_value: 150.00,
        tags: ["books", "harry potter", "collection", "hardcover"]
    },
    {
        title: "Solid Oak Dining Table",
        description: "Beautiful solid oak dining table that seats 6 people comfortably. Minor scratches but very sturdy construction.",
        category: "furniture", 
        condition: "fair",
        estimated_value: 400.00,
        tags: ["furniture", "dining", "table", "oak", "wood"]
    },
    {
        title: "PlayStation 5 Console - Like New",
        description: "PS5 console barely used, still has original packaging. Comes with controller and all cables.",
        category: "electronics",
        condition: "like_new",
        estimated_value: 500.00,
        tags: ["gaming", "playstation", "ps5", "console"]
    },
    {
        title: "Trek Mountain Bike - Adult",
        description: "Trek mountain bike in excellent condition. Recently tuned up with new tires and brake pads.",
        category: "sports",
        condition: "excellent", 
        estimated_value: 450.00,
        tags: ["bike", "trek", "mountain", "cycling", "sports"]
    },
    {
        title: "KitchenAid Stand Mixer",
        description: "Red KitchenAid stand mixer with dough hook, whisk, and paddle attachments. Works perfectly.",
        category: "home",
        condition: "good",
        estimated_value: 180.00,
        tags: ["kitchen", "mixer", "kitchenaid", "appliance", "baking"]
    }
];

// Utility functions
function log(message, data = null) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
}

function formatError(error) {
    return {
        message: error.message,
        code: error.code || 'unknown',
        type: error.type || 'unknown'
    };
}

// Main seeding function
async function seedItems() {
    log('🌱 Starting marketplace seeding process...');
    log('Configuration:', {
        endpoint: CONFIG.endpoint,
        project: CONFIG.project,
        database: CONFIG.database,
        collection: CONFIG.collection,
        itemCount: TEST_ITEMS.length
    });

    try {
        // First, try to list existing documents to verify connection
        log('🔍 Testing database connection...');
        const testResponse = await databases.listDocuments(
            CONFIG.database,
            CONFIG.collection,
            [Query.limit(1)]
        );
        log('✅ Database connection successful');
        log(`📊 Current items in database: ${testResponse.total}`);

        // Ask for user ID if using placeholder
        if (CONFIG.defaultUserId === 'user_placeholder') {
            log('⚠️  WARNING: Using placeholder user ID. Items will be created without a valid user.');
            log('   To fix this, replace defaultUserId in the script with a real user ID from your database.');
            
            // Try to get a real user from the database
            try {
                const usersResponse = await databases.listDocuments(CONFIG.database, 'users', [Query.limit(1)]);
                if (usersResponse.documents.length > 0) {
                    CONFIG.defaultUserId = usersResponse.documents[0].$id;
                    log(`✅ Found user ID: ${CONFIG.defaultUserId}`);
                } else {
                    log('⚠️  No users found in database. Items will be created with placeholder user ID.');
                }
            } catch (userError) {
                log('⚠️  Could not fetch users from database. Continuing with placeholder.');
            }
        }

        // Create items
        log('🚀 Creating test items...');
        let created = 0;
        let failed = 0;

        for (let i = 0; i < TEST_ITEMS.length; i++) {
            const template = TEST_ITEMS[i];
            
            try {
                log(`Creating item ${i + 1}/${TEST_ITEMS.length}: ${template.title}`);

                const itemData = {
                    userId: CONFIG.defaultUserId,
                    title: template.title,
                    description: template.description,
                    category: template.category,
                    condition: template.condition,
                    estimated_value: template.estimated_value,
                    images: [],
                    tags: template.tags || [],
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                const response = await databases.createDocument(
                    CONFIG.database,
                    CONFIG.collection,
                    ID.unique(),
                    itemData
                );

                created++;
                log(`✅ Created "${template.title}" with ID: ${response.$id}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (itemError) {
                failed++;
                log(`❌ Failed to create "${template.title}":`, formatError(itemError));
            }
        }

        // Final results
        log('🎉 Seeding process completed!');
        log(`📊 Results: ${created} created, ${failed} failed`);
        
        if (created > 0) {
            log('✅ Success! Your marketplace should now have test items.');
            log('   Go to your Trading Post app and refresh the marketplace to see them.');
        }
        
        if (failed > 0) {
            log('⚠️  Some items failed to create. Check the error messages above.');
        }

        // Verify final count
        const finalResponse = await databases.listDocuments(
            CONFIG.database,
            CONFIG.collection,
            [Query.limit(1)]
        );
        log(`📊 Total items now in database: ${finalResponse.total}`);

    } catch (error) {
        log('❌ Seeding process failed:', formatError(error));
        
        if (error.code === 401) {
            log('💡 Authentication error. Make sure your API key is correct.');
        } else if (error.code === 404) {
            log('💡 Database or collection not found. Check your configuration.');
        } else {
            log('💡 Check your Appwrite configuration and network connection.');
        }
        
        process.exit(1);
    }
}

// Clear items function
async function clearItems() {
    log('🧹 Clearing all items from database...');
    
    try {
        const response = await databases.listDocuments(CONFIG.database, CONFIG.collection);
        const items = response.documents;
        
        log(`Found ${items.length} items to delete`);
        
        let deleted = 0;
        for (const item of items) {
            try {
                await databases.deleteDocument(CONFIG.database, CONFIG.collection, item.$id);
                deleted++;
                log(`Deleted: ${item.title} (${deleted}/${items.length})`);
            } catch (error) {
                log(`Failed to delete ${item.title}:`, formatError(error));
            }
        }
        
        log(`🎉 Cleared ${deleted} items from database`);
    } catch (error) {
        log('❌ Clear operation failed:', formatError(error));
    }
}

// Command line interface
const command = process.argv[2];

switch (command) {
    case 'seed':
        seedItems();
        break;
    case 'clear':
        clearItems();
        break;
    case 'test':
        log('🧪 Testing database connection...');
        databases.listDocuments(CONFIG.database, CONFIG.collection, [Query.limit(1)])
            .then(response => {
                log('✅ Connection successful');
                log(`📊 Current items: ${response.total}`);
            })
            .catch(error => {
                log('❌ Connection failed:', formatError(error));
            });
        break;
    default:
        console.log(`
Trading Post Marketplace Seeder

Usage:
  node seed-items.js seed   - Add test items to marketplace
  node seed-items.js clear  - Remove all items from marketplace  
  node seed-items.js test   - Test database connection

Configuration:
  Edit the CONFIG object in this file to match your Appwrite setup.
        `);
}