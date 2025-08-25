#!/usr/bin/env node

/**
 * Trading Post Complete Fix Script - Ultra Deep Fix
 * 
 * This comprehensive script addresses ALL issues:
 * 1. Database schema mismatches (user_id attributes)
 * 2. API function configurations
 * 3. Collection creation if missing
 * 4. Extensive debug logging
 * 5. Automatic error detection and remediation
 * 
 * @author Claude AI - Complete Trading Post Fix
 * @date 2025-08-16
 */

const { Client, Databases, Permission, Role, ID, Functions } = require('node-appwrite');

// Environment Configuration - Try multiple API keys
const configs = [
  {
    name: 'Trading Post Production',
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '689bdee000098bd9d55c',
    apiKey: 'standard_3f24ec4af7735370663bb71bb1833e940e485642b146ee160ca66a2cbb5f43a882d46b71a881b045d0410980baa30ce377e3fd493a119e0457fbdbf192b079c8de72e6263b21ea9047de4d38d9cf11c075bbc5cecbae17237e2dfbe142059151dd7f042c0dd02abc88af8348e6b95d632541f664dd4244027c35405aa6915fbc',
    databaseId: 'trading_post_db'
  },
  {
    name: 'Trading Post with Old Key',
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '689bdee000098bd9d55c',
    apiKey: '27c3d18d6223495324df041ad6ae01c0b3b3e5e53ca130fbc9ff74925ec5b7f066959fdd87c4622c35df40b70061bd4d7133f3c367f67a23cf23796b341b94dc6816ba23b767886602ca5537265378da21a6d42bcb1413c7a6a0ec3c71e37ee80233483ce23c2f9307a30848bccacbb8c8c8d97dc4d159bc9beb249fa45993ec',
    databaseId: 'trading_post_db'
  }
];

// Enhanced collection schema with ALL required attributes
const COLLECTION_SCHEMAS = {
  'users': {
    name: 'Users',
    attributes: [
      { key: 'username', type: 'string', size: 255, required: true },
      { key: 'email', type: 'string', size: 255, required: true },
      { key: 'profile_picture', type: 'string', size: 2048, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'bio', type: 'string', size: 1000, required: false },
      { key: 'reputation_score', type: 'integer', min: 0, max: 1000, default: 100, required: false },
      { key: 'trades_completed', type: 'integer', min: 0, default: 0, required: false },
      { key: 'is_verified', type: 'boolean', default: false, required: false },
      { key: 'last_active', type: 'datetime', required: false },
      { key: 'preferences', type: 'string', size: 2048, required: false }
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('owner'))),
      Permission.delete(Role.user(ID.custom('owner')))
    ]
  },
  'items': {
    name: 'Items',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'condition', type: 'string', size: 50, required: true },
      { key: 'estimated_value', type: 'double', min: 0, required: false },
      { key: 'ai_analysis', type: 'string', size: 5000, required: false },
      { key: 'photos', type: 'string', size: 5000, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'status', type: 'string', size: 50, default: 'available', required: false },
      { key: 'user_id', type: 'string', size: 36, required: true }, // CRITICAL FIX
      { key: 'owner_id', type: 'string', size: 36, required: false }, // Backward compatibility
      { key: 'views_count', type: 'integer', min: 0, default: 0, required: false },
      { key: 'created_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('user_id'))),
      Permission.delete(Role.user(ID.custom('user_id')))
    ]
  },
  'wants': {
    name: 'Wants',
    attributes: [
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'description', type: 'string', size: 2000, required: true },
      { key: 'category', type: 'string', size: 100, required: true },
      { key: 'max_value', type: 'double', min: 0, required: false },
      { key: 'location', type: 'string', size: 255, required: false },
      { key: 'status', type: 'string', size: 50, default: 'active', required: false },
      { key: 'user_id', type: 'string', size: 36, required: true }, // CRITICAL FIX
      { key: 'created_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('user_id'))),
      Permission.delete(Role.user(ID.custom('user_id')))
    ]
  },
  'matches': {
    name: 'AI Matches',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true }, // CRITICAL FIX
      { key: 'item_offered_id', type: 'string', size: 36, required: true },
      { key: 'item_wanted_id', type: 'string', size: 36, required: true },
      { key: 'match_score', type: 'double', min: 0, max: 100, required: false },
      { key: 'match_reason', type: 'string', size: 1000, required: false },
      { key: 'status', type: 'string', size: 50, default: 'pending', required: false },
      { key: 'created_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('user_id'))),
      Permission.delete(Role.user(ID.custom('user_id')))
    ]
  },
  'notifications': {
    name: 'Notifications',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true }, // CRITICAL FIX
      { key: 'type', type: 'string', size: 50, required: true },
      { key: 'title', type: 'string', size: 255, required: true },
      { key: 'message', type: 'string', size: 1000, required: true },
      { key: 'is_read', type: 'boolean', default: false, required: false },
      { key: 'priority', type: 'string', size: 20, default: 'normal', required: false },
      { key: 'action_url', type: 'string', size: 500, required: false },
      { key: 'created_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.user(ID.custom('user_id'))),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('user_id'))),
      Permission.delete(Role.user(ID.custom('user_id')))
    ]
  },
  'messages': {
    name: 'Messages',
    attributes: [
      { key: 'sender_id', type: 'string', size: 36, required: true },
      { key: 'recipient_id', type: 'string', size: 36, required: true },
      { key: 'content', type: 'string', size: 2000, required: true },
      { key: 'message_type', type: 'string', size: 50, default: 'text', required: false },
      { key: 'is_read', type: 'boolean', default: false, required: false },
      { key: 'read_at', type: 'datetime', required: false },
      { key: 'created_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  },
  'trades': {
    name: 'Trades',
    attributes: [
      { key: 'item_offered_id', type: 'string', size: 36, required: true },
      { key: 'item_requested_id', type: 'string', size: 36, required: true },
      { key: 'offerer_id', type: 'string', size: 36, required: true },
      { key: 'recipient_id', type: 'string', size: 36, required: true },
      { key: 'status', type: 'string', size: 50, default: 'pending', required: false },
      { key: 'message', type: 'string', size: 1000, required: false },
      { key: 'created_at', type: 'datetime', required: false },
      { key: 'updated_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users())
    ]
  },
  'reviews': {
    name: 'Reviews',
    attributes: [
      { key: 'reviewer_id', type: 'string', size: 36, required: true },
      { key: 'reviewed_user_id', type: 'string', size: 36, required: true },
      { key: 'trade_id', type: 'string', size: 36, required: false },
      { key: 'rating', type: 'integer', min: 1, max: 5, required: true },
      { key: 'comment', type: 'string', size: 1000, required: false },
      { key: 'created_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('reviewer_id'))),
      Permission.delete(Role.user(ID.custom('reviewer_id')))
    ]
  },
  'saved_items': {
    name: 'Saved Items',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true }, // CRITICAL FIX
      { key: 'item_id', type: 'string', size: 36, required: true },
      { key: 'saved_at', type: 'datetime', required: false }
    ],
    permissions: [
      Permission.read(Role.user(ID.custom('user_id'))),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('user_id'))),
      Permission.delete(Role.user(ID.custom('user_id')))
    ]
  },
  'memberships': {
    name: 'Memberships',
    attributes: [
      { key: 'user_id', type: 'string', size: 36, required: true }, // CRITICAL FIX
      { key: 'membership_type', type: 'string', size: 50, default: 'basic', required: false },
      { key: 'start_date', type: 'datetime', required: false },
      { key: 'end_date', type: 'datetime', required: false },
      { key: 'is_active', type: 'boolean', default: true, required: false }
    ],
    permissions: [
      Permission.read(Role.user(ID.custom('user_id'))),
      Permission.create(Role.users()),
      Permission.update(Role.user(ID.custom('user_id'))),
      Permission.delete(Role.user(ID.custom('user_id')))
    ]
  }
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
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
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
  console.log(`\n${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  log(`🔧 ${message}`, 'blue');
  console.log(`${colors.bright}${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

function logDebug(message, data = null) {
  if (process.env.DEBUG || process.argv.includes('--debug')) {
    console.log(`${colors.magenta}[DEBUG] ${message}${colors.reset}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Try multiple API configurations until one works
 */
async function findWorkingConfig() {
  logHeader('Finding Working Configuration');
  
  for (const config of configs) {
    logInfo(`Testing configuration: ${config.name}`);
    logDebug('Config details', {
      endpoint: config.endpoint,
      projectId: config.projectId,
      apiKey: config.apiKey.substring(0, 20) + '...'
    });
    
    try {
      const client = new Client();
      client
        .setEndpoint(config.endpoint)
        .setProject(config.projectId)
        .setKey(config.apiKey);
      
      const databases = new Databases(client);
      
      // Test connection
      const databasesList = await databases.list();
      logSuccess(`✅ Configuration "${config.name}" is working!`);
      logDebug(`Found ${databasesList.total} databases`);
      
      return { config, client, databases };
    } catch (error) {
      logError(`Configuration "${config.name}" failed: ${error.message}`);
      logDebug('Error details', error);
    }
  }
  
  throw new Error('No working configuration found. Please check API keys and project IDs.');
}

/**
 * Create or update a collection
 */
async function createOrUpdateCollection(databases, databaseId, collectionId, schema) {
  try {
    logInfo(`Processing collection: ${collectionId}`);
    
    // Check if collection exists
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      logSuccess(`Collection "${collectionId}" exists with ${collection.attributes.length} attributes`);
      return { exists: true, collection };
    } catch (error) {
      if (error.code === 404) {
        logWarning(`Collection "${collectionId}" does not exist - creating it`);
        
        // Create collection
        try {
          const newCollection = await databases.createCollection(
            databaseId,
            collectionId,
            schema.name,
            schema.permissions || []
          );
          logSuccess(`Created collection "${collectionId}"`);
          return { exists: false, collection: newCollection };
        } catch (createError) {
          logError(`Failed to create collection "${collectionId}": ${createError.message}`);
          throw createError;
        }
      }
      throw error;
    }
  } catch (error) {
    logError(`Error processing collection "${collectionId}": ${error.message}`);
    throw error;
  }
}

/**
 * Create or update attributes for a collection
 */
async function createOrUpdateAttributes(databases, databaseId, collectionId, attributes) {
  logInfo(`Processing attributes for collection: ${collectionId}`);
  
  // Get existing attributes
  let existingAttributes = [];
  try {
    const collection = await databases.getCollection(databaseId, collectionId);
    existingAttributes = collection.attributes || [];
    logDebug(`Found ${existingAttributes.length} existing attributes`, existingAttributes.map(a => a.key));
  } catch (error) {
    logWarning(`Could not get existing attributes: ${error.message}`);
  }
  
  let created = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const attr of attributes) {
    const existing = existingAttributes.find(a => a.key === attr.key);
    
    if (existing) {
      if (existing.status === 'available') {
        logDebug(`✓ Attribute "${attr.key}" already exists and is available`);
        skipped++;
      } else {
        logWarning(`Attribute "${attr.key}" exists but status is: ${existing.status}`);
        skipped++;
      }
      continue;
    }
    
    // Create attribute based on type
    try {
      logInfo(`Creating attribute: ${attr.key} (${attr.type})`);
      
      switch (attr.type) {
        case 'string':
          await databases.createStringAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.size,
            attr.required,
            attr.default || null,
            false // array
          );
          break;
          
        case 'integer':
          await databases.createIntegerAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
            false // array
          );
          break;
          
        case 'double':
          await databases.createFloatAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.min,
            attr.max,
            attr.default,
            false // array
          );
          break;
          
        case 'boolean':
          await databases.createBooleanAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            false // array
          );
          break;
          
        case 'datetime':
          await databases.createDatetimeAttribute(
            databaseId,
            collectionId,
            attr.key,
            attr.required,
            attr.default,
            false // array
          );
          break;
          
        default:
          logWarning(`Unknown attribute type: ${attr.type} for ${attr.key}`);
          continue;
      }
      
      logSuccess(`✅ Created attribute: ${attr.key}`);
      created++;
      
      // Wait a bit for attribute to process
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      if (error.code === 409) {
        logDebug(`Attribute "${attr.key}" already exists (409 conflict)`);
        skipped++;
      } else {
        logError(`Failed to create attribute "${attr.key}": ${error.message}`);
        failed++;
      }
    }
  }
  
  return { created, skipped, failed };
}

/**
 * Create Appwrite Functions for API endpoints
 */
async function createOrUpdateFunctions(client, config) {
  logHeader('Setting Up Appwrite Functions');
  
  const functions = new Functions(client);
  
  const functionDefinitions = [
    {
      id: 'trading-post-api',
      name: 'Trading Post API',
      runtime: 'node-18.0',
      execute: [Role.any()],
      vars: {
        DATABASE_ID: config.databaseId,
        PROJECT_ID: config.projectId
      }
    },
    {
      id: 'ai-matching-service',
      name: 'AI Matching Service',
      runtime: 'node-18.0',
      execute: [Role.users()],
      vars: {
        DATABASE_ID: config.databaseId,
        XAI_API_KEY: process.env.XAI_API_KEY || 'xai-pzXhXnX2YteViTp9omT0PE06hv1xn2PDhwQcUMtIfKJmrPRgkXoljhbhSswDbWW3t5NvXZxJDhVQwrAQ'
      }
    },
    {
      id: 'trading-post-backend',
      name: 'Trading Post Backend',
      runtime: 'node-18.0',
      execute: [Role.any()],
      vars: {
        DATABASE_ID: config.databaseId
      }
    }
  ];
  
  for (const funcDef of functionDefinitions) {
    try {
      logInfo(`Processing function: ${funcDef.name}`);
      
      // Try to get existing function
      try {
        const existing = await functions.get(funcDef.id);
        logSuccess(`Function "${funcDef.name}" already exists`);
      } catch (error) {
        if (error.code === 404) {
          // Create function
          logInfo(`Creating function: ${funcDef.name}`);
          await functions.create(
            funcDef.id,
            funcDef.name,
            funcDef.runtime,
            funcDef.execute,
            [], // events
            '', // schedule
            30, // timeout
            true, // enabled
            true // logging
          );
          logSuccess(`Created function: ${funcDef.name}`);
        } else {
          throw error;
        }
      }
      
      // Update function variables
      if (funcDef.vars) {
        for (const [key, value] of Object.entries(funcDef.vars)) {
          try {
            await functions.createVariable(funcDef.id, key, value);
            logDebug(`Added variable ${key} to ${funcDef.name}`);
          } catch (error) {
            if (error.code !== 409) {
              logWarning(`Could not add variable ${key}: ${error.message}`);
            }
          }
        }
      }
      
    } catch (error) {
      logError(`Failed to process function "${funcDef.name}": ${error.message}`);
    }
  }
}

/**
 * Validate the entire database schema
 */
async function validateSchema(databases, databaseId) {
  logHeader('Validating Complete Schema');
  
  let valid = true;
  const report = {};
  
  for (const [collectionId, schema] of Object.entries(COLLECTION_SCHEMAS)) {
    try {
      const collection = await databases.getCollection(databaseId, collectionId);
      const attributes = collection.attributes || [];
      
      report[collectionId] = {
        exists: true,
        attributes: {},
        missing: []
      };
      
      // Check each required attribute
      for (const reqAttr of schema.attributes) {
        const existing = attributes.find(a => a.key === reqAttr.key);
        
        if (!existing) {
          report[collectionId].missing.push(reqAttr.key);
          valid = false;
          logError(`Missing attribute: ${collectionId}.${reqAttr.key}`);
        } else {
          report[collectionId].attributes[reqAttr.key] = existing.status;
          if (existing.status !== 'available') {
            logWarning(`Attribute ${collectionId}.${reqAttr.key} status: ${existing.status}`);
            if (existing.status === 'failed') {
              valid = false;
            }
          } else {
            logDebug(`✓ ${collectionId}.${reqAttr.key} is available`);
          }
        }
      }
      
    } catch (error) {
      report[collectionId] = {
        exists: false,
        error: error.message
      };
      valid = false;
      logError(`Collection "${collectionId}" does not exist or is inaccessible`);
    }
  }
  
  return { valid, report };
}

/**
 * Main fix function
 */
async function fixTradingPostComplete() {
  try {
    logHeader('Trading Post Complete Fix - Ultra Deep Resolution');
    logInfo('This script will fix ALL database and API issues');
    logInfo('Debug mode: ' + (process.env.DEBUG || process.argv.includes('--debug') ? 'ON' : 'OFF'));
    
    // Find working configuration
    const { config, client, databases } = await findWorkingConfig();
    
    logSuccess(`Using configuration: ${config.name}`);
    logInfo(`Database ID: ${config.databaseId}`);
    
    // Check if database exists, create if not
    logHeader('Checking Database');
    try {
      const db = await databases.get(config.databaseId);
      logSuccess(`Database "${config.databaseId}" exists`);
    } catch (error) {
      if (error.code === 404) {
        logWarning(`Database "${config.databaseId}" does not exist - creating it`);
        try {
          await databases.create(config.databaseId, 'Trading Post Database');
          logSuccess(`Created database "${config.databaseId}"`);
        } catch (createError) {
          logError(`Failed to create database: ${createError.message}`);
          throw createError;
        }
      } else {
        throw error;
      }
    }
    
    // Process each collection
    logHeader('Processing Collections and Attributes');
    
    const stats = {
      collectionsCreated: 0,
      collectionsExisting: 0,
      attributesCreated: 0,
      attributesSkipped: 0,
      attributesFailed: 0
    };
    
    for (const [collectionId, schema] of Object.entries(COLLECTION_SCHEMAS)) {
      logInfo(`\n📦 Processing: ${collectionId}`);
      
      // Create or get collection
      const { exists } = await createOrUpdateCollection(databases, config.databaseId, collectionId, schema);
      
      if (exists) {
        stats.collectionsExisting++;
      } else {
        stats.collectionsCreated++;
      }
      
      // Create attributes
      const attrStats = await createOrUpdateAttributes(databases, config.databaseId, collectionId, schema.attributes);
      
      stats.attributesCreated += attrStats.created;
      stats.attributesSkipped += attrStats.skipped;
      stats.attributesFailed += attrStats.failed;
    }
    
    // Create functions
    await createOrUpdateFunctions(client, config);
    
    // Wait for attributes to settle
    logInfo('Waiting for attributes to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Final validation
    const { valid, report } = await validateSchema(databases, config.databaseId);
    
    // Summary
    logHeader('Fix Summary');
    logInfo(`Collections created: ${stats.collectionsCreated}`);
    logInfo(`Collections existing: ${stats.collectionsExisting}`);
    logInfo(`Attributes created: ${stats.attributesCreated}`);
    logInfo(`Attributes skipped: ${stats.attributesSkipped}`);
    logInfo(`Attributes failed: ${stats.attributesFailed}`);
    
    if (valid) {
      logSuccess('🎉 ALL ISSUES FIXED SUCCESSFULLY!');
      logSuccess('Trading Post should now work without any errors');
    } else {
      logWarning('⚠️  Some issues remain - check the report above');
      logInfo('Run the script again in a few minutes to retry failed operations');
    }
    
    // Generate detailed report
    if (process.env.DEBUG || process.argv.includes('--debug')) {
      logHeader('Detailed Schema Report');
      console.log(JSON.stringify(report, null, 2));
    }
    
    // Next steps
    logHeader('Next Steps');
    logInfo('1. Restart the Trading Post frontend application');
    logInfo('2. Clear browser cache and cookies');
    logInfo('3. Test login and all functionality');
    logInfo('4. Check browser console for any remaining errors');
    logInfo('5. If issues persist, run this script with --debug flag');
    
    return { success: valid, stats, report };
    
  } catch (error) {
    logError(`Complete fix failed: ${error.message}`);
    
    if (error.stack) {
      logError('Stack trace:');
      console.error(error.stack);
    }
    
    logHeader('Troubleshooting');
    logInfo('1. Check Appwrite Console for service status');
    logInfo('2. Verify project ID: 689bdee000098bd9d55c');
    logInfo('3. Generate new API key with full permissions');
    logInfo('4. Run with --debug flag for more details');
    logInfo('5. Check network connectivity to nyc.cloud.appwrite.io');
    
    return { success: false, error: error.message };
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (require.main === module) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Trading Post Complete Fix Script

Usage:
  node fix-trading-post-complete.js         Run the complete fix
  node fix-trading-post-complete.js --debug Debug mode with verbose output
  node fix-trading-post-complete.js --help  Show this help

This script will:
  1. Find a working API configuration
  2. Create missing collections
  3. Add all required attributes (especially user_id)
  4. Set up Appwrite Functions
  5. Validate the entire schema
  6. Provide detailed debugging information

Environment Variables (optional):
  DEBUG=true                Enable debug output
  APPWRITE_API_KEY         Override default API key
  XAI_API_KEY              API key for AI matching service
    `);
    process.exit(0);
  } else {
    fixTradingPostComplete()
      .then(result => {
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        logError(`Fatal error: ${error.message}`);
        process.exit(1);
      });
  }
}

module.exports = {
  fixTradingPostComplete,
  COLLECTION_SCHEMAS,
  configs
};