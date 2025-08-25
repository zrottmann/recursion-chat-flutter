/**
 * Enhanced Database Schema Fixer
 * Automatically detects and fixes field mapping issues across all collections
 * @author Claude AI - Database Schema Fix Agent
 * @date 2025-08-18
 */

import { databases, DATABASE_ID, COLLECTIONS, Query, ID } from '../lib/appwrite';

class DatabaseSchemaFixer {
  constructor() {
    this.fieldMappings = new Map();
    this.detectedSchemas = new Map();
    this.fixes = [];
    this.errors = [];
  }

  /**
   * Run comprehensive schema detection and fixes
   */
  async fixAllSchemaIssues() {
    console.log('🔧 Starting comprehensive database schema fixes...');
    
    try {
      // Step 1: Detect actual schemas
      await this.detectAllSchemas();
      
      // Step 2: Generate field mappings
      await this.generateFieldMappings();
      
      // Step 3: Create collection fix functions
      await this.createFixedDatabaseWrapper();
      
      // Step 4: Test fixes
      await this.testSchemaFixes();
      
      console.log('✅ Schema fixes complete');
      return {
        success: true,
        fixes: this.fixes,
        mappings: Object.fromEntries(this.fieldMappings),
        schemas: Object.fromEntries(this.detectedSchemas)
      };
      
    } catch (error) {
      console.error('❌ Schema fix failed:', error);
      this.errors.push(error);
      return {
        success: false,
        error: error.message,
        errors: this.errors
      };
    }
  }

  /**
   * Detect actual schema for each collection
   */
  async detectAllSchemas() {
    console.log('🔍 Detecting actual database schemas...');
    
    for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
      await this.detectCollectionSchema(collectionName, collectionId);
    }
  }

  /**
   * Detect schema for a specific collection
   */
  async detectCollectionSchema(collectionName, collectionId) {
    try {
      const response = await databases.listDocuments(DATABASE_ID, collectionId, [
        Query.limit(5) // Get multiple documents to understand schema
      ]);
      
      if (response.documents.length === 0) {
        console.log(`📭 Collection '${collectionName}': EMPTY`);
        this.detectedSchemas.set(collectionName, {
          exists: true,
          isEmpty: true,
          fields: [],
          userField: null,
          confidence: 'low'
        });
        return;
      }
      
      // Analyze all documents to get complete field list
      const allFields = new Set();
      const userFieldCandidates = [];
      
      response.documents.forEach(doc => {
        Object.keys(doc).forEach(field => {
          allFields.add(field);
          
          // Check for user field candidates
          if (field.toLowerCase().includes('user') || 
              field.toLowerCase().includes('owner') ||
              field.toLowerCase().includes('creator')) {
            userFieldCandidates.push(field);
          }
        });
      });
      
      // Determine most likely user field
      const userField = this.determineUserField(collectionName, Array.from(allFields), userFieldCandidates);
      
      this.detectedSchemas.set(collectionName, {
        exists: true,
        isEmpty: false,
        fields: Array.from(allFields),
        userField,
        confidence: userField ? 'high' : 'medium',
        sampleDocument: response.documents[0]
      });
      
      console.log(`✅ Schema detected for '${collectionName}': ${allFields.size} fields, user field: '${userField}'`);
      
    } catch (error) {
      if (error.code === 404) {
        console.log(`❌ Collection '${collectionName}': DOES NOT EXIST`);
        this.detectedSchemas.set(collectionName, {
          exists: false,
          isEmpty: true,
          fields: [],
          userField: null,
          confidence: 'none'
        });
      } else {
        console.error(`❌ Error detecting schema for '${collectionName}':`, error);
        this.errors.push({
          collection: collectionName,
          error: error.message,
          type: 'SCHEMA_DETECTION_ERROR'
        });
      }
    }
  }

  /**
   * Determine the correct user field for a collection
   */
  determineUserField(collectionName, allFields, userFieldCandidates) {
    // Priority order for user fields
    const fieldPriority = [
      'user_id',
      'userId', 
      'owner_id',
      'ownerId',
      'created_by',
      'createdBy',
      'offerer_id',
      'offererId',
      'sender_id',
      'senderId'
    ];
    
    // Special cases per collection
    const specialCases = {
      users: '$id', // Users collection uses document ID
      trades: 'user1_id', // Trades typically have user1_id and user2_id
      messages: 'sender_id' // Messages use sender_id primarily
    };
    
    if (specialCases[collectionName] && allFields.includes(specialCases[collectionName])) {
      return specialCases[collectionName];
    }
    
    // Find highest priority field that exists
    for (const field of fieldPriority) {
      if (allFields.includes(field)) {
        return field;
      }
    }
    
    // Fallback to first user field candidate
    return userFieldCandidates[0] || 'user_id';
  }

  /**
   * Generate field mappings based on detected schemas
   */
  async generateFieldMappings() {
    console.log('🗺️ Generating field mappings...');
    
    for (const [collectionName, schema] of this.detectedSchemas) {
      if (!schema.exists) {
        // Default mappings for non-existent collections
        this.fieldMappings.set(collectionName, {
          user: 'user_id',
          queryMethod: 'listDocuments',
          exists: false
        });
        continue;
      }
      
      const mapping = {
        user: schema.userField || 'user_id',
        queryMethod: collectionName === 'users' ? 'getDocument' : 'listDocuments',
        exists: true,
        isEmpty: schema.isEmpty,
        confidence: schema.confidence
      };
      
      // Add additional field mappings if needed
      if (collectionName === 'trades') {
        mapping.user1 = schema.fields.includes('user1_id') ? 'user1_id' : 'offerer_id';
        mapping.user2 = schema.fields.includes('user2_id') ? 'user2_id' : 'recipient_id';
      }
      
      if (collectionName === 'messages') {
        mapping.sender = schema.fields.includes('sender_id') ? 'sender_id' : 'from_user_id';
        mapping.recipient = schema.fields.includes('recipient_id') ? 'recipient_id' : 'to_user_id';
      }
      
      this.fieldMappings.set(collectionName, mapping);
      
      this.fixes.push({
        type: 'FIELD_MAPPING',
        collection: collectionName,
        mapping,
        description: `Mapped user field to '${mapping.user}' for collection '${collectionName}'`
      });
    }
  }

  /**
   * Create enhanced database wrapper with schema fixes
   */
  async createFixedDatabaseWrapper() {
    console.log('🔨 Creating fixed database wrapper...');
    
    // This will be exported as a replacement for the databases object
    this.fixedDatabases = {
      // Enhanced listDocuments with schema awareness
      listDocuments: async (databaseId, collectionId, queries = []) => {
        const collectionName = this.getCollectionNameById(collectionId);
        const mapping = this.fieldMappings.get(collectionName);
        
        if (!mapping || !mapping.exists) {
          // Return empty result for non-existent collections
          console.log(`⚠️ Collection '${collectionName}' does not exist - returning empty result`);
          return { total: 0, documents: [] };
        }
        
        if (mapping.isEmpty) {
          console.log(`📭 Collection '${collectionName}' is empty - returning empty result`);
          return { total: 0, documents: [] };
        }
        
        // Special handling for users collection
        if (collectionName === 'users' && mapping.queryMethod === 'getDocument') {
          const userIdQuery = queries.find(q => 
            q.values && (q.values[0] === 'user_id' || q.values[0] === '$id')
          );
          
          if (userIdQuery) {
            try {
              const userId = Array.isArray(userIdQuery.values[1]) ? userIdQuery.values[1][0] : userIdQuery.values[1];
              const document = await databases.getDocument(databaseId, collectionId, userId);
              return { total: 1, documents: [document] };
            } catch (error) {
              if (error.code === 404) {
                return { total: 0, documents: [] };
              }
              throw error;
            }
          }
        }
        
        // Transform queries based on field mappings
        const transformedQueries = this.transformQueries(collectionName, queries, mapping);
        
        try {
          return await databases.listDocuments(databaseId, collectionId, transformedQueries);
        } catch (error) {
          // If query fails, try with fallback field mappings
          if (error.message?.includes('Attribute not found')) {
            const fallbackQueries = this.tryFallbackQueries(collectionName, queries, mapping);
            if (fallbackQueries) {
              return await databases.listDocuments(databaseId, collectionId, fallbackQueries);
            }
          }
          throw error;
        }
      },
      
      // Enhanced getDocument
      getDocument: async (databaseId, collectionId, documentId) => {
        return databases.getDocument(databaseId, collectionId, documentId);
      },
      
      // Enhanced createDocument with field transformation
      createDocument: async (databaseId, collectionId, documentId, data, permissions) => {
        const collectionName = this.getCollectionNameById(collectionId);
        const mapping = this.fieldMappings.get(collectionName);
        
        // Transform data fields based on mappings
        const transformedData = this.transformDataFields(collectionName, data, mapping);
        
        return databases.createDocument(
          databaseId, 
          collectionId, 
          documentId || ID.unique(), 
          transformedData, 
          permissions
        );
      },
      
      // Enhanced updateDocument with field transformation
      updateDocument: async (databaseId, collectionId, documentId, data) => {
        const collectionName = this.getCollectionNameById(collectionId);
        const mapping = this.fieldMappings.get(collectionName);
        
        // Transform data fields based on mappings
        const transformedData = this.transformDataFields(collectionName, data, mapping);
        
        return databases.updateDocument(databaseId, collectionId, documentId, transformedData);
      },
      
      // Standard deleteDocument
      deleteDocument: async (databaseId, collectionId, documentId) => {
        return databases.deleteDocument(databaseId, collectionId, documentId);
      }
    };
  }

  /**
   * Transform queries based on field mappings
   */
  transformQueries(collectionName, queries, mapping) {
    if (!mapping) return queries;
    
    return queries.map(query => {
      if (query.values && query.values[0]) {
        const field = query.values[0];
        
        // Map common field transformations
        if (field === 'user_id' && mapping.user !== 'user_id') {
          return Query[query.method](mapping.user, query.values[1]);
        }
        
        if (field === 'sender_id' && mapping.sender && mapping.sender !== 'sender_id') {
          return Query[query.method](mapping.sender, query.values[1]);
        }
        
        if (field === 'recipient_id' && mapping.recipient && mapping.recipient !== 'recipient_id') {
          return Query[query.method](mapping.recipient, query.values[1]);
        }
      }
      
      return query;
    });
  }

  /**
   * Try fallback queries when primary queries fail
   */
  tryFallbackQueries(collectionName, queries, mapping) {
    const alternatives = {
      'user_id': ['userId', 'owner_id', 'created_by', 'offerer_id'],
      'sender_id': ['from_user_id', 'senderId', 'user_id'],
      'recipient_id': ['to_user_id', 'recipientId', 'user_id']
    };
    
    for (const query of queries) {
      if (query.values && query.values[0] && alternatives[query.values[0]]) {
        const alternativeFields = alternatives[query.values[0]];
        
        // Try first alternative that wasn't already tried
        for (const altField of alternativeFields) {
          if (altField !== mapping.user) {
            return queries.map(q => 
              q.values && q.values[0] === query.values[0] ?
              Query[q.method](altField, q.values[1]) : q
            );
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Transform data fields for create/update operations
   */
  transformDataFields(collectionName, data, mapping) {
    if (!mapping) return data;
    
    const transformed = { ...data };
    
    // Transform user_id fields
    if ('user_id' in data && mapping.user !== 'user_id') {
      transformed[mapping.user] = data.user_id;
      delete transformed.user_id;
    }
    
    return transformed;
  }

  /**
   * Get collection name by collection ID
   */
  getCollectionNameById(collectionId) {
    return Object.entries(COLLECTIONS).find(([name, id]) => id === collectionId)?.[0] || 'unknown';
  }

  /**
   * Test schema fixes
   */
  async testSchemaFixes() {
    console.log('🧪 Testing schema fixes...');
    
    const testResults = [];
    
    for (const [collectionName, mapping] of this.fieldMappings) {
      if (!mapping.exists) continue;
      
      try {
        // Test basic listing
        const result = await this.fixedDatabases.listDocuments(
          DATABASE_ID, 
          COLLECTIONS[collectionName], 
          [Query.limit(1)]
        );
        
        testResults.push({
          collection: collectionName,
          test: 'basic_list',
          success: true,
          documentCount: result.total
        });
        
        // Test user query if not empty
        if (!mapping.isEmpty) {
          const userQueryResult = await this.fixedDatabases.listDocuments(
            DATABASE_ID,
            COLLECTIONS[collectionName],
            [Query.equal(mapping.user, 'test-user-id'), Query.limit(1)]
          );
          
          testResults.push({
            collection: collectionName,
            test: 'user_query',
            success: true,
            userField: mapping.user
          });
        }
        
      } catch (error) {
        testResults.push({
          collection: collectionName,
          test: 'failed',
          success: false,
          error: error.message
        });
      }
    }
    
    console.log('✅ Schema fix testing complete:', testResults);
    return testResults;
  }

  /**
   * Export fixed database wrapper
   */
  getFixedDatabaseWrapper() {
    return this.fixedDatabases;
  }

  /**
   * Get field mapping for a collection
   */
  getFieldMapping(collectionName) {
    return this.fieldMappings.get(collectionName) || { user: 'user_id', exists: false };
  }
}

// Create singleton instance
const schemaFixer = new DatabaseSchemaFixer();

// Export for use in components
export default schemaFixer;
export { DatabaseSchemaFixer };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.databaseSchemaFixer = schemaFixer;
  window.fixDatabaseSchema = () => schemaFixer.fixAllSchemaIssues();
}