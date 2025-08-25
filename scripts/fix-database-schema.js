#!/usr/bin/env node

/**
 * Trading Post Database Schema Fix Script
 * 
 * CRITICAL FIX: Resolves "Invalid query: Attribute not found in schema: user_id" errors
 * 
 * This script:
 * 1. Connects to Trading Post Appwrite project (689bdee000098bd9d55c)
 * 2. Checks existing schema for missing user_id attributes
 * 3. Adds missing user_id attributes to affected collections
 * 4. Handles errors gracefully if attributes already exist
 * 5. Provides detailed logging of all changes
 * 6. Validates schema after changes
 * 
 * AFFECTED COLLECTIONS:
 * - matches: user_id (for AI matching functionality)
 * - wants: user_id (for user want listings)
 * - notifications: user_id (for user notifications)
 * - items: user_id (for item ownership)
 * - messages: sender_id & recipient_id (for messaging)
 * - trades: initiator_id & recipient_id (for trading)
 * - reviews: reviewer_id & reviewed_user_id (for reviews)
 * 
 * ROLLBACK INSTRUCTIONS:
 * If issues occur, you can manually remove attributes via Appwrite Console:
 * 1. Go to Database > Collections > [Collection Name]
 * 2. Click on Attributes tab
 * 3. Find the user_id attribute and click delete (trash icon)
 * 4. Confirm deletion
 * 
 * @author Claude AI - Trading Post Database Fix
 * @date 2025-08-16
 */

const { Client, Databases, Permission, Role, ID } = require('node-appwrite');

// Environment Configuration
const config = {
    endpoint: process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1',
    projectId: process.env.APPWRITE_PROJECT_ID || '689bdee000098bd9d55c', // Trading Post Project ID
    apiKey: process.env.APPWRITE_API_KEY || '27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec',
    databaseId: process.env.APPWRITE_DATABASE_ID || 'trading_post_db'
};

// Collection definitions with required user_id attributes
const REQUIRED_ATTRIBUTES = {
    'matches': [
        { key: 'user_id', type: 'string', size: 36, required: true }
    ],
    'wants': [
        { key: 'user_id', type: 'string', size: 36, required: true }
    ],
    'notifications': [
        { key: 'user_id', type: 'string', size: 36, required: true }
    ],
    'items': [
        { key: 'user_id', type: 'string', size: 36, required: true }
    ],
    'messages': [
        { key: 'sender_id', type: 'string', size: 36, required: true },
        { key: 'recipient_id', type: 'string', size: 36, required: true }
    ],
    'trades': [
        { key: 'initiator_id', type: 'string', size: 36, required: true },
        { key: 'recipient_id', type: 'string', size: 36, required: true }
    ],
    'reviews': [
        { key: 'reviewer_id', type: 'string', size: 36, required: true },
        { key: 'reviewed_user_id', type: 'string', size: 36, required: true }
    ],
    'saved_items': [
        { key: 'user_id', type: 'string', size: 36, required: true }
    ],
    'memberships': [
        { key: 'user_id', type: 'string', size: 36, required: true }
    ]
};

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m',
    bright: '\x1b[1m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function logHeader(message) {
    log(`\n${colors.bright}🔧 ${message}${colors.reset}`, 'blue');
}

/**
 * Validate configuration
 */
function validateConfig() {
    logHeader('Validating Configuration');
    
    const requiredEnvVars = ['APPWRITE_ENDPOINT', 'APPWRITE_PROJECT_ID', 'APPWRITE_API_KEY', 'APPWRITE_DATABASE_ID'];
    const missingVars = [];
    
    if (!config.endpoint) missingVars.push('APPWRITE_ENDPOINT');
    if (!config.projectId) missingVars.push('APPWRITE_PROJECT_ID');
    if (!config.apiKey) missingVars.push('APPWRITE_API_KEY');
    if (!config.databaseId) missingVars.push('APPWRITE_DATABASE_ID');
    
    if (missingVars.length > 0) {
        logWarning('Missing environment variables (using defaults):');
        missingVars.forEach(varName => logWarning(`  - ${varName}`));
    }
    
    logInfo(`Endpoint: ${config.endpoint}`);
    logInfo(`Project ID: ${config.projectId}`);
    logInfo(`Database ID: ${config.databaseId}`);
    logInfo(`API Key: ${config.apiKey ? config.apiKey.substring(0, 20) + '...' : 'Not provided'}`);
    
    return true;
}

/**
 * Check if collection exists and get its attributes
 */
async function getCollectionAttributes(databases, collectionId) {
    try {
        const collection = await databases.getCollection(config.databaseId, collectionId);
        return {
            exists: true,
            attributes: collection.attributes || []
        };
    } catch (error) {
        if (error.code === 404) {
            return { exists: false, attributes: [] };
        }
        throw error;
    }
}

/**
 * Create a string attribute
 */
async function createStringAttribute(databases, collectionId, attribute) {
    try {
        await databases.createStringAttribute(
            config.databaseId,
            collectionId,
            attribute.key,
            attribute.size,
            attribute.required,
            null, // default value
            false // array
        );
        return true;
    } catch (error) {
        if (error.code === 409) {
            // Attribute already exists
            return false;
        }
        throw error;
    }
}

/**
 * Wait for attribute to be available (Appwrite processes attributes asynchronously)
 */
async function waitForAttribute(databases, collectionId, attributeKey, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const collection = await databases.getCollection(config.databaseId, collectionId);
            const attribute = collection.attributes.find(attr => attr.key === attributeKey);
            
            if (attribute && attribute.status === 'available') {
                return true;
            }
            
            if (attribute && attribute.status === 'failed') {
                throw new Error(`Attribute creation failed: ${attribute.error || 'Unknown error'}`);
            }
            
            // Wait 1 second before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
        } catch (error) {
            if (error.code !== 404) {
                throw error;
            }
        }
    }
    
    return false;
}

/**
 * Validate database schema after fixes
 */
async function validateSchema(databases) {
    logHeader('Validating Database Schema');
    
    let allValid = true;
    
    for (const [collectionId, requiredAttrs] of Object.entries(REQUIRED_ATTRIBUTES)) {
        try {
            const { exists, attributes } = await getCollectionAttributes(databases, collectionId);
            
            if (!exists) {
                logError(`Collection '${collectionId}' does not exist`);
                allValid = false;
                continue;
            }
            
            logInfo(`Checking collection: ${collectionId}`);
            
            for (const requiredAttr of requiredAttrs) {
                const existingAttr = attributes.find(attr => attr.key === requiredAttr.key);
                
                if (!existingAttr) {
                    logError(`  Missing attribute: ${requiredAttr.key}`);
                    allValid = false;
                } else if (existingAttr.status !== 'available') {
                    logWarning(`  Attribute '${requiredAttr.key}' status: ${existingAttr.status}`);
                    if (existingAttr.status === 'failed') {
                        allValid = false;
                    }
                } else {
                    logSuccess(`  ✓ ${requiredAttr.key} (${existingAttr.type}, required: ${existingAttr.required})`);
                }
            }
            
        } catch (error) {
            logError(`Failed to validate collection '${collectionId}': ${error.message}`);
            allValid = false;
        }
    }
    
    return allValid;
}

/**
 * Main fix function
 */
async function fixDatabaseSchema() {
    try {
        logHeader('Trading Post Database Schema Fix');
        logInfo('This script will fix missing user_id attributes in collections');
        logInfo('Safe to run multiple times - will skip existing attributes');
        
        // Validate configuration
        if (!validateConfig()) {
            throw new Error('Configuration validation failed');
        }
        
        // Initialize Appwrite client
        const client = new Client();
        client
            .setEndpoint(config.endpoint)
            .setProject(config.projectId)
            .setKey(config.apiKey);
            
        const databases = new Databases(client);
        
        // Test connection
        logHeader('Testing Appwrite Connection');
        try {
            const databasesList = await databases.list();
            logSuccess(`Connected to Appwrite (${databasesList.total} databases found)`);
        } catch (error) {
            if (error.code === 401) {
                throw new Error('Invalid API key - please check APPWRITE_API_KEY');
            } else if (error.code === 404) {
                throw new Error('Project not found - please check APPWRITE_PROJECT_ID');
            }
            throw error;
        }
        
        // Check if target database exists
        try {
            const existingCollections = await databases.listCollections(config.databaseId);
            logSuccess(`Database '${config.databaseId}' found with ${existingCollections.total} collections`);
        } catch (error) {
            if (error.code === 404) {
                throw new Error(`Database '${config.databaseId}' not found. Please create it first.`);
            }
            throw error;
        }
        
        // Process each collection
        logHeader('Analyzing Collections and Attributes');
        
        let totalAttributesAdded = 0;
        let totalAttributesExisting = 0;
        let collectionsProcessed = 0;
        
        for (const [collectionId, requiredAttrs] of Object.entries(REQUIRED_ATTRIBUTES)) {
            logInfo(`\n📦 Processing collection: ${collectionId}`);
            
            // Check if collection exists
            const { exists, attributes } = await getCollectionAttributes(databases, collectionId);
            
            if (!exists) {
                logWarning(`Collection '${collectionId}' does not exist - skipping`);
                continue;
            }
            
            collectionsProcessed++;
            logSuccess(`Collection '${collectionId}' found with ${attributes.length} attributes`);
            
            // Process each required attribute
            for (const requiredAttr of requiredAttrs) {
                const existingAttr = attributes.find(attr => attr.key === requiredAttr.key);
                
                if (existingAttr) {
                    if (existingAttr.status === 'available') {
                        logSuccess(`  ✓ ${requiredAttr.key} already exists and is available`);
                        totalAttributesExisting++;
                    } else {
                        logWarning(`  ⏳ ${requiredAttr.key} exists but status is: ${existingAttr.status}`);
                        totalAttributesExisting++;
                    }
                } else {
                    // Attribute doesn't exist - create it
                    logInfo(`  + Creating attribute: ${requiredAttr.key}`);
                    
                    try {
                        const created = await createStringAttribute(databases, collectionId, requiredAttr);
                        
                        if (created) {
                            logSuccess(`  ✅ Created attribute: ${requiredAttr.key}`);
                            totalAttributesAdded++;
                            
                            // Wait for attribute to be available
                            logInfo(`  ⏳ Waiting for attribute to be available...`);
                            const isAvailable = await waitForAttribute(databases, collectionId, requiredAttr.key);
                            
                            if (isAvailable) {
                                logSuccess(`  ✅ Attribute '${requiredAttr.key}' is now available`);
                            } else {
                                logWarning(`  ⚠️  Attribute '${requiredAttr.key}' creation is still processing`);
                            }
                        } else {
                            logWarning(`  ⚠️  Attribute '${requiredAttr.key}' already exists (created during this run)`);
                            totalAttributesExisting++;
                        }
                        
                    } catch (error) {
                        logError(`  ❌ Failed to create ${requiredAttr.key}: ${error.message}`);
                        
                        // Continue with other attributes even if one fails
                        continue;
                    }
                }
            }
        }
        
        // Final validation
        logHeader('Final Schema Validation');
        const isValid = await validateSchema(databases);
        
        // Summary
        logHeader('Fix Summary');
        logInfo(`Collections processed: ${collectionsProcessed}`);
        logInfo(`Attributes already existing: ${totalAttributesExisting}`);
        logInfo(`Attributes added: ${totalAttributesAdded}`);
        
        if (isValid) {
            logSuccess('🎉 Database schema fix completed successfully!');
            logSuccess('All required user_id attributes are now available');
            logInfo('\nThe marketplace should now work without "Attribute not found" errors.');
        } else {
            logWarning('⚠️  Schema validation found some issues');
            logInfo('Some attributes may still be processing. Wait a few minutes and run the script again.');
        }
        
        // Next steps
        logHeader('Next Steps');
        logInfo('1. Test the Trading Post application');
        logInfo('2. Check that AI matching functionality works');
        logInfo('3. Verify that user wants and notifications are functioning');
        logInfo('4. If issues persist, check the Appwrite Console for attribute statuses');
        
        return {
            success: isValid,
            collectionsProcessed,
            attributesAdded: totalAttributesAdded,
            attributesExisting: totalAttributesExisting
        };
        
    } catch (error) {
        logError(`Database schema fix failed: ${error.message}`);
        
        if (error.stack) {
            logError('Stack trace:');
            console.error(error.stack);
        }
        
        logHeader('Troubleshooting Tips');
        logInfo('1. Check that your API key has database permissions');
        logInfo('2. Verify the project ID is correct: 689bdee000098bd9d55c');
        logInfo('3. Ensure the database "trading_post_db" exists');
        logInfo('4. Check Appwrite Console for any quota limits');
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Create validation script that checks schema without making changes
 */
async function validateSchemaOnly() {
    try {
        logHeader('Trading Post Database Schema Validation (Read-Only)');
        
        if (!validateConfig()) {
            throw new Error('Configuration validation failed');
        }
        
        const client = new Client();
        client
            .setEndpoint(config.endpoint)
            .setProject(config.projectId)
            .setKey(config.apiKey);
            
        const databases = new Databases(client);
        
        // Test connection
        await databases.list();
        logSuccess('Connected to Appwrite successfully');
        
        // Validate schema
        const isValid = await validateSchema(databases);
        
        if (isValid) {
            logSuccess('🎉 Database schema validation passed!');
            logInfo('All required attributes are present and available.');
        } else {
            logWarning('⚠️  Database schema validation found issues');
            logInfo('Run the fix script to resolve missing attributes.');
        }
        
        return { success: isValid };
        
    } catch (error) {
        logError(`Schema validation failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (require.main === module) {
    if (command === '--validate' || command === '-v') {
        validateSchemaOnly()
            .then(result => {
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                logError(`Validation failed: ${error.message}`);
                process.exit(1);
            });
    } else if (command === '--help' || command === '-h') {
        console.log(`
Trading Post Database Schema Fix Script

Usage:
  node fix-database-schema.js          Run the fix script
  node fix-database-schema.js --validate   Validate schema without making changes
  node fix-database-schema.js --help       Show this help

Environment Variables:
  APPWRITE_ENDPOINT      Appwrite endpoint (default: https://nyc.cloud.appwrite.io/v1)
  APPWRITE_PROJECT_ID    Project ID (default: 689bdee000098bd9d55c)
  APPWRITE_API_KEY       API key with database permissions
  APPWRITE_DATABASE_ID   Database ID (default: trading_post_db)

Examples:
  # Run the fix
  APPWRITE_API_KEY=your-api-key node fix-database-schema.js
  
  # Just validate
  APPWRITE_API_KEY=your-api-key node fix-database-schema.js --validate
        `);
        process.exit(0);
    } else {
        fixDatabaseSchema()
            .then(result => {
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                logError(`Fix script failed: ${error.message}`);
                process.exit(1);
            });
    }
}

module.exports = {
    fixDatabaseSchema,
    validateSchemaOnly,
    config,
    REQUIRED_ATTRIBUTES
};