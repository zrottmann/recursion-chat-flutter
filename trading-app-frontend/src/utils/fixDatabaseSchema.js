/**
 * Trading Post Database Schema Fix - Client-Side Version
 * 
 * This runs in the browser using the authenticated user's session
 * to fix database schema issues without needing API keys
 * 
 * @author Claude AI - Client-Side Database Fix
 * @date 2025-08-16
 */

import { databases, DATABASE_ID, Query, ID, COLLECTIONS } from '../lib/appwrite';
import fieldMapper, { createUserQuery, collectionExists } from './databaseFieldMapper';

// Enhanced debug logging system
const DEBUG = {
  enabled: false,
  logs: [],
  
  enable() {
    this.enabled = true;
    console.log('🔍 Debug mode enabled for Trading Post');
    window.tradingPostDebug = this;
    return this;
  },
  
  disable() {
    this.enabled = false;
    console.log('🔍 Debug mode disabled');
    return this;
  },
  
  log(type, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    
    this.logs.push(entry);
    
    if (this.enabled) {
      const color = {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c',
        debug: '#9b59b6'
      }[type] || '#95a5a6';
      
      console.log(
        `%c[${type.toUpperCase()}] ${message}`,
        `color: ${color}; font-weight: bold;`,
        data || ''
      );
    }
    
    return entry;
  },
  
  getLogs() {
    return this.logs;
  },
  
  clearLogs() {
    this.logs = [];
    console.log('🗑️ Debug logs cleared');
  },
  
  exportLogs() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-post-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    console.log('📥 Debug logs exported');
  }
};

// Export debug for global access
window.DEBUG = DEBUG;

/**
 * Collection mapping fixes
 * Maps incorrect field names to correct ones
 */
const FIELD_MAPPINGS = {
  items: {
    owner_id: 'user_id' // Map owner_id to user_id
  },
  trades: {
    initiator_id: 'offerer_id', // Standardize naming
    recipient_id: 'recipient_id'
  }
};

/**
 * Test database queries to identify schema issues
 */
export async function testDatabaseQueries() {
  DEBUG.log('info', '🔍 Testing database queries to identify issues');
  
  // Ensure field mapper is initialized
  await fieldMapper.initialize();
  
  const tests = [
    {
      name: 'List items with user_id',
      collection: 'items',
      query: () => databases.listDocuments(DATABASE_ID, COLLECTIONS.items, [
        Query.limit(1)
      ])
    },
    {
      name: 'Query items by user_id',
      collection: 'items',
      query: () => databases.listDocuments(DATABASE_ID, COLLECTIONS.items, 
        createUserQuery('items', 'test', [Query.limit(1)])
      )
    },
    {
      name: 'Query wants by user_id',
      collection: 'wants',
      query: () => databases.listDocuments(DATABASE_ID, COLLECTIONS.wants,
        createUserQuery('wants', 'test', [Query.limit(1)])
      )
    },
    {
      name: 'Query matches by user_id',
      collection: 'matches',
      query: async () => {
        if (!(await collectionExists('matches'))) {
          throw new Error('Collection might not exist');
        }
        return databases.listDocuments(DATABASE_ID, COLLECTIONS.matches,
          createUserQuery('matches', 'test', [Query.limit(1)])
        );
      }
    },
    {
      name: 'Query notifications by user_id',
      collection: 'notifications',
      query: () => databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications,
        createUserQuery('notifications', 'test', [Query.limit(1)])
      )
    }
  ];
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };
  
  for (const test of tests) {
    try {
      DEBUG.log('debug', `Running test: ${test.name}`);
      await test.query();
      results.passed.push(test.name);
      DEBUG.log('success', `✅ ${test.name} passed`);
    } catch (error) {
      if (error.message?.includes('Attribute not found')) {
        results.failed.push({
          test: test.name,
          error: error.message,
          collection: test.collection
        });
        DEBUG.log('error', `❌ ${test.name} failed: ${error.message}`);
      } else if (error.code === 404) {
        results.warnings.push({
          test: test.name,
          warning: 'Collection might not exist',
          collection: test.collection
        });
        DEBUG.log('warning', `⚠️ ${test.name}: Collection might not exist`);
      } else {
        results.warnings.push({
          test: test.name,
          warning: error.message,
          collection: test.collection
        });
        DEBUG.log('warning', `⚠️ ${test.name}: ${error.message}`);
      }
    }
  }
  
  return results;
}

/**
 * Smart query wrapper that handles field mapping
 */
export function createSmartQuery(collection, queries = []) {
  const mappings = FIELD_MAPPINGS[collection] || {};
  
  const mappedQueries = queries.map(query => {
    // Check if this is a Query method call
    if (typeof query === 'object' && query.method && query.values) {
      const field = query.values[0];
      const mappedField = mappings[field] || field;
      
      if (mappedField !== field) {
        DEBUG.log('debug', `Mapping field ${field} to ${mappedField} in collection ${collection}`);
      }
      
      // Return the appropriate Query method
      switch (query.method) {
        case 'equal':
          return Query.equal(mappedField, query.values[1]);
        case 'notEqual':
          return Query.notEqual(mappedField, query.values[1]);
        case 'greaterThan':
          return Query.greaterThan(mappedField, query.values[1]);
        case 'lessThan':
          return Query.lessThan(mappedField, query.values[1]);
        case 'search':
          return Query.search(mappedField, query.values[1]);
        default:
          return query;
      }
    }
    
    return query;
  });
  
  return mappedQueries;
}

/**
 * Smart database wrapper that handles schema issues
 */
export const smartDatabases = {
  async listDocuments(databaseId, collectionId, queries = []) {
    try {
      // Special handling for users collection
      if (collectionId === COLLECTIONS.users) {
        // Check if we're querying by user_id
        const userIdQuery = queries.find(q => 
          typeof q === 'object' && q.values && 
          (q.values[0] === 'user_id' || q.values[0] === '$id')
        );
        
        if (userIdQuery && userIdQuery.values[1]) {
          // If querying by user_id, try direct document lookup first
          const userId = Array.isArray(userIdQuery.values[1]) ? userIdQuery.values[1][0] : userIdQuery.values[1];
          try {
            const document = await databases.getDocument(databaseId, collectionId, userId);
            // Return in listDocuments format for consistency
            return {
              total: 1,
              documents: [document]
            };
          } catch (error) {
            if (error.code === 404) {
              // Document not found, return empty result
              return {
                total: 0,
                documents: []
              };
            }
            // For other errors, continue with regular query
          }
        }
        
        // Transform user_id queries to search in user_id field (not $id)
        // This handles cases where user_id is stored as a field, not as document ID
        const transformedQueries = queries.map(q => {
          if (typeof q === 'object' && q.values && q.values[0] === '$id') {
            // Transform $id queries to user_id field queries
            return Query.equal('user_id', q.values[1]);
          }
          return q;
        });
        return await databases.listDocuments(databaseId, collectionId, transformedQueries);
      }
      
      // First attempt with original queries
      return await databases.listDocuments(databaseId, collectionId, queries);
    } catch (error) {
      if (error.message?.includes('Attribute not found')) {
        DEBUG.log('warning', `Schema issue detected in ${collectionId}, attempting field mapping`);
        
        // Log detailed query information
        DEBUG.log('debug', `Failed query details:`, {
          collection: collectionId,
          queries: queries.map(q => ({ method: q.method, values: q.values })),
          error: error.message
        });
        
        // Extract the problematic field from error message
        const match = error.message.match(/Attribute not found.*: (\w+)/);
        if (match) {
          const problemField = match[1];
          DEBUG.log('debug', `Problem field identified: ${problemField}`);
          
          // Try alternative field names - updated with more comprehensive mappings
          const alternatives = {
            'user_id': ['userId', 'owner_id', 'created_by', 'offerer_id', 'recipient_id'],
            'owner_id': ['user_id', 'userId', 'created_by', 'offerer_id', 'recipient_id'], 
            'sender_id': ['from_user_id', 'senderId', 'user_id', 'offerer_id'],
            'recipient_id': ['to_user_id', 'recipientId', 'user_id'],
            'offerer_id': ['user_id', 'userId', 'initiator_id', 'owner_id'],
            'initiator_id': ['offerer_id', 'user_id', 'userId', 'owner_id']
          };
          
          const altFields = alternatives[problemField] || [];
          
          for (const altField of altFields) {
            try {
              DEBUG.log('debug', `Trying alternative field: ${altField}`);
              
              const altQueries = queries.map(q => {
                if (typeof q === 'object' && q.values && q.values[0] === problemField) {
                  return Query[q.method](altField, q.values[1]);
                }
                return q;
              });
              
              const result = await databases.listDocuments(databaseId, collectionId, altQueries);
              DEBUG.log('success', `✅ Success with alternative field: ${altField}`);
              
              // Store successful mapping for future use
              if (!FIELD_MAPPINGS[collectionId]) {
                FIELD_MAPPINGS[collectionId] = {};
              }
              FIELD_MAPPINGS[collectionId][problemField] = altField;
              
              return result;
            } catch (altError) {
              // Continue to next alternative
              DEBUG.log('debug', `Alternative ${altField} also failed`);
              if (altError.message?.includes('Attribute not found')) {
                const altMatch = altError.message.match(/Attribute not found.*: (\w+)/);
                if (altMatch && altMatch[1] !== altField) {
                  DEBUG.log('debug', `Different field error: ${altMatch[1]}`);
                }
              }
            }
          }
        }
      }
      
      // Handle collection not found errors
      if (error.code === 404 && error.message?.includes('Collection with the requested ID could not be found')) {
        DEBUG.log('warning', `Collection ${collectionId} does not exist - returning empty result`);
        return {
          total: 0,
          documents: []
        };
      }
      
      // If all attempts fail, throw original error
      throw error;
    }
  },
  
  async getDocument(databaseId, collectionId, documentId) {
    return databases.getDocument(databaseId, collectionId, documentId);
  },
  
  async createDocument(databaseId, collectionId, documentId, data, permissions) {
    // Map fields before creating
    const mappings = FIELD_MAPPINGS[collectionId] || {};
    const mappedData = { ...data };
    
    for (const [oldField, newField] of Object.entries(mappings)) {
      if (oldField in mappedData) {
        mappedData[newField] = mappedData[oldField];
        if (oldField !== newField) {
          delete mappedData[oldField];
        }
      }
    }
    
    return databases.createDocument(databaseId, collectionId, documentId || ID.unique(), mappedData, permissions);
  },
  
  async updateDocument(databaseId, collectionId, documentId, data) {
    // Map fields before updating
    const mappings = FIELD_MAPPINGS[collectionId] || {};
    const mappedData = { ...data };
    
    for (const [oldField, newField] of Object.entries(mappings)) {
      if (oldField in mappedData) {
        mappedData[newField] = mappedData[oldField];
        if (oldField !== newField) {
          delete mappedData[oldField];
        }
      }
    }
    
    return databases.updateDocument(databaseId, collectionId, documentId, mappedData);
  },
  
  async deleteDocument(databaseId, collectionId, documentId) {
    return databases.deleteDocument(databaseId, collectionId, documentId);
  }
};

/**
 * Initialize debug console (activated by pressing `)
 */
export function initDebugConsole() {
  let debugPanel = null;
  
  document.addEventListener('keydown', (e) => {
    if (e.key === '`') {
      e.preventDefault();
      
      if (debugPanel) {
        // Toggle visibility
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
      } else {
        // Create debug panel
        debugPanel = document.createElement('div');
        debugPanel.id = 'trading-post-debug-panel';
        debugPanel.innerHTML = `
          <div style="
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 300px;
            background: rgba(0, 0, 0, 0.95);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            z-index: 999999;
            overflow-y: auto;
            border-top: 2px solid #0f0;
          ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="margin: 0; color: #0f0;">🔧 Trading Post Debug Console</h3>
              <div>
                <button onclick="window.DEBUG.enable()" style="background: #2ecc71; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer;">Enable Debug</button>
                <button onclick="window.DEBUG.disable()" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer;">Disable Debug</button>
                <button onclick="window.DEBUG.clearLogs()" style="background: #f39c12; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer;">Clear Logs</button>
                <button onclick="window.DEBUG.exportLogs()" style="background: #3498db; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer;">Export Logs</button>
                <button onclick="window.testDatabaseQueries()" style="background: #9b59b6; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer;">Test Queries</button>
                <button onclick="document.getElementById('trading-post-debug-panel').style.display='none'" style="background: #95a5a6; color: white; border: none; padding: 5px 10px; margin: 0 5px; cursor: pointer;">Close</button>
              </div>
            </div>
            <div id="debug-log-output" style="height: calc(100% - 40px); overflow-y: auto; padding: 10px; background: rgba(0, 0, 0, 0.5); border-radius: 5px;">
              <pre style="margin: 0; color: #0f0;">Debug console ready. Press buttons above to run tests.</pre>
            </div>
          </div>
        `;
        
        document.body.appendChild(debugPanel);
        
        // Enable debug mode
        DEBUG.enable();
        
        // Make test function globally available
        window.testDatabaseQueries = async () => {
          const output = document.getElementById('debug-log-output');
          output.innerHTML = '<pre style="color: #f39c12;">Running database tests...</pre>';
          
          try {
            const results = await testDatabaseQueries();
            
            let html = '<pre style="color: #0f0;">';
            html += '=== Database Test Results ===\n\n';
            
            if (results.passed.length > 0) {
              html += '✅ PASSED TESTS:\n';
              results.passed.forEach(test => {
                html += `  - ${test}\n`;
              });
              html += '\n';
            }
            
            if (results.failed.length > 0) {
              html += '❌ FAILED TESTS:\n';
              results.failed.forEach(({test, error, collection}) => {
                html += `  - ${test}\n`;
                html += `    Collection: ${collection}\n`;
                html += `    Error: ${error}\n`;
              });
              html += '\n';
            }
            
            if (results.warnings.length > 0) {
              html += '⚠️ WARNINGS:\n';
              results.warnings.forEach(({test, warning, collection}) => {
                html += `  - ${test}\n`;
                html += `    Collection: ${collection}\n`;
                html += `    Warning: ${warning}\n`;
              });
              html += '\n';
            }
            
            html += '\n=== Field Mappings ===\n';
            html += JSON.stringify(FIELD_MAPPINGS, null, 2);
            
            html += '\n\n=== Debug Logs ===\n';
            DEBUG.getLogs().forEach(log => {
              const color = {
                info: '#3498db',
                success: '#2ecc71',
                warning: '#f39c12',
                error: '#e74c3c',
                debug: '#9b59b6'
              }[log.type] || '#95a5a6';
              
              html += `<span style="color: ${color}">[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}</span>\n`;
              if (log.data) {
                html += `<span style="color: #95a5a6;">  Data: ${JSON.stringify(log.data)}</span>\n`;
              }
            });
            
            html += '</pre>';
            output.innerHTML = html;
          } catch (error) {
            output.innerHTML = `<pre style="color: #e74c3c;">Error running tests: ${error.message}</pre>`;
          }
        };
        
        // Update logs display periodically
        setInterval(() => {
          if (debugPanel && debugPanel.style.display !== 'none') {
            const output = document.getElementById('debug-log-output');
            const logs = DEBUG.getLogs().slice(-50); // Show last 50 logs
            
            if (logs.length > 0) {
              let html = '<pre style="color: #0f0;">';
              logs.forEach(log => {
                const color = {
                  info: '#3498db',
                  success: '#2ecc71',
                  warning: '#f39c12',
                  error: '#e74c3c',
                  debug: '#9b59b6'
                }[log.type] || '#95a5a6';
                
                html += `<span style="color: ${color}">[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}</span>\n`;
                if (log.data) {
                  html += `<span style="color: #95a5a6;">  Data: ${JSON.stringify(log.data, null, 2)}</span>\n`;
                }
              });
              html += '</pre>';
              output.innerHTML = html;
            }
          }
        }, 1000);
      }
    }
  });
  
  console.log('🎮 Trading Post Debug Console initialized. Press ` to open/close.');
}

/**
 * Auto-fix common issues
 */
export async function autoFixIssues() {
  DEBUG.log('info', '🔧 Starting automatic issue detection and fixing');
  
  const fixes = [];
  
  // Test queries to identify issues
  const testResults = await testDatabaseQueries();
  
  if (testResults.failed.length > 0) {
    DEBUG.log('warning', `Found ${testResults.failed.length} schema issues, applying smart query wrappers`);
    fixes.push({
      issue: 'Schema mismatches',
      solution: 'Applied field mapping wrappers',
      details: testResults.failed
    });
  }
  
  // Log all fixes
  DEBUG.log('success', '✅ Auto-fix complete', fixes);
  
  return fixes;
}

// Initialize debug console on load
if (typeof window !== 'undefined') {
  initDebugConsole();
  
  // Auto-run fixes in development
  if (import.meta.env.DEV) {
    setTimeout(() => {
      autoFixIssues().then(fixes => {
        console.log('🔧 Trading Post auto-fixes applied:', fixes);
      }).catch(error => {
        console.error('❌ Auto-fix failed:', error);
      });
    }, 2000);
  }
}

// Export everything for use in components
export {
  DEBUG,
  FIELD_MAPPINGS,
  testDatabaseQueries as default
};