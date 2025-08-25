/**
 * Comprehensive Database Diagnostics Tool
 * Analyzes Trading Post Appwrite database schema and data integrity
 * @author Claude AI - Database Diagnostics Agent
 * @date 2025-08-18
 */

import { databases, DATABASE_ID, COLLECTIONS, Query, account } from '../lib/appwrite';

class DatabaseDiagnostics {
  constructor() {
    this.results = {
      collections: {},
      fieldMappings: {},
      dataIntegrity: {},
      errors: [],
      warnings: [],
      recommendations: []
    };
  }

  /**
   * Run comprehensive database diagnostics
   */
  async runFullDiagnostics() {
    console.log('🔍 Starting comprehensive database diagnostics...');
    
    try {
      // Get current user info
      this.currentUser = await account.get();
      console.log('👤 Current user:', this.currentUser.name, this.currentUser.$id);
      
      // Test all collections
      await this.testCollections();
      
      // Analyze field mappings
      await this.analyzeFieldMappings();
      
      // Check data integrity
      await this.checkDataIntegrity();
      
      // Generate recommendations
      this.generateRecommendations();
      
      console.log('✅ Database diagnostics complete');
      return this.results;
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      this.results.errors.push({
        type: 'DIAGNOSTIC_ERROR',
        message: error.message,
        error
      });
      return this.results;
    }
  }

  /**
   * Test all collections for existence and basic functionality
   */
  async testCollections() {
    console.log('📋 Testing collections...');
    
    const collectionTests = [
      'users', 'items', 'wants', 'trades', 
      'messages', 'matches', 'notifications', 'savedItems'
    ];
    
    for (const collectionName of collectionTests) {
      await this.testCollection(collectionName);
    }
  }

  /**
   * Test individual collection
   */
  async testCollection(collectionName) {
    const collectionId = COLLECTIONS[collectionName];
    const collectionData = {
      name: collectionName,
      id: collectionId,
      exists: false,
      isEmpty: true,
      sampleDocument: null,
      availableFields: [],
      errors: []
    };

    try {
      // Test if collection exists by listing documents
      const response = await databases.listDocuments(DATABASE_ID, collectionId, [
        Query.limit(1)
      ]);
      
      collectionData.exists = true;
      collectionData.isEmpty = response.total === 0;
      collectionData.totalDocuments = response.total;
      
      if (response.documents.length > 0) {
        collectionData.sampleDocument = response.documents[0];
        collectionData.availableFields = Object.keys(response.documents[0]);
      }
      
      console.log(`✅ Collection '${collectionName}': EXISTS, ${response.total} documents`);
      
    } catch (error) {
      if (error.code === 404) {
        collectionData.exists = false;
        collectionData.errors.push('Collection does not exist');
        console.log(`❌ Collection '${collectionName}': DOES NOT EXIST`);
      } else {
        collectionData.exists = true; // Assume exists but has other issues
        collectionData.errors.push(error.message);
        console.log(`⚠️ Collection '${collectionName}': ERROR - ${error.message}`);
      }
    }
    
    this.results.collections[collectionName] = collectionData;
  }

  /**
   * Analyze field mappings and detect inconsistencies
   */
  async analyzeFieldMappings() {
    console.log('🔍 Analyzing field mappings...');
    
    const userFieldVariations = ['user_id', 'userId', 'owner_id', 'ownerId', 'created_by', 'createdBy'];
    
    for (const [collectionName, collectionData] of Object.entries(this.results.collections)) {
      if (!collectionData.exists || collectionData.isEmpty) {
        this.results.fieldMappings[collectionName] = {
          userField: null,
          detectionMethod: 'unknown',
          confidence: 'low'
        };
        continue;
      }
      
      // Analyze user field mapping
      const userField = userFieldVariations.find(field => 
        collectionData.availableFields.includes(field)
      );
      
      this.results.fieldMappings[collectionName] = {
        userField: userField || 'user_id',
        detectionMethod: userField ? 'detected' : 'default',
        confidence: userField ? 'high' : 'low',
        availableFields: collectionData.availableFields
      };
    }
  }

  /**
   * Check data integrity and relationships
   */
  async checkDataIntegrity() {
    console.log('🔬 Checking data integrity...');
    
    // Check if current user has any items
    await this.checkUserData();
    
    // Check for orphaned records
    await this.checkOrphanedRecords();
    
    // Validate required fields
    await this.validateRequiredFields();
  }

  /**
   * Check current user's data across collections
   */
  async checkUserData() {
    const userId = this.currentUser.$id;
    
    for (const [collectionName, collectionData] of Object.entries(this.results.collections)) {
      if (!collectionData.exists || collectionData.isEmpty) continue;
      
      try {
        const userField = this.results.fieldMappings[collectionName].userField;
        
        // Special handling for users collection
        if (collectionName === 'users') {
          try {
            const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.users, userId);
            this.results.dataIntegrity[collectionName] = {
              userRecordExists: true,
              userDocument: userDoc
            };
          } catch (error) {
            this.results.dataIntegrity[collectionName] = {
              userRecordExists: false,
              error: error.message
            };
          }
          continue;
        }
        
        // Query for user's documents in this collection
        const queries = userField ? [Query.equal(userField, userId), Query.limit(10)] : [Query.limit(10)];
        const userDocs = await databases.listDocuments(DATABASE_ID, collectionData.id, queries);
        
        this.results.dataIntegrity[collectionName] = {
          userDocumentCount: userDocs.total,
          hasUserData: userDocs.total > 0,
          sampleUserDocuments: userDocs.documents.slice(0, 3)
        };
        
        console.log(`📊 User data in '${collectionName}': ${userDocs.total} documents`);
        
      } catch (error) {
        this.results.dataIntegrity[collectionName] = {
          error: error.message,
          hasUserData: false
        };
        
        if (error.message.includes('Attribute not found')) {
          this.results.warnings.push({
            type: 'FIELD_MAPPING_ERROR',
            collection: collectionName,
            message: `Field mapping error: ${error.message}`
          });
        }
      }
    }
  }

  /**
   * Check for orphaned records
   */
  async checkOrphanedRecords() {
    // Check for trades without corresponding items
    // Check for messages without corresponding trades
    // This would require more complex queries - placeholder for now
    console.log('🔍 Checking for orphaned records...');
  }

  /**
   * Validate required fields are present
   */
  async validateRequiredFields() {
    const requiredFields = {
      items: ['title', 'description', 'category', 'condition', 'user_id'],
      trades: ['user1_id', 'user2_id', 'status', 'created_at'],
      messages: ['sender_id', 'recipient_id', 'content', 'created_at'],
      matches: ['user_id', 'matched_item_id', 'confidence_score']
    };
    
    for (const [collectionName, fields] of Object.entries(requiredFields)) {
      const collectionData = this.results.collections[collectionName];
      if (!collectionData || !collectionData.exists || collectionData.isEmpty) continue;
      
      const missingFields = fields.filter(field => 
        !collectionData.availableFields.includes(field)
      );
      
      if (missingFields.length > 0) {
        this.results.warnings.push({
          type: 'MISSING_REQUIRED_FIELDS',
          collection: collectionName,
          missingFields,
          message: `Collection '${collectionName}' missing required fields: ${missingFields.join(', ')}`
        });
      }
    }
  }

  /**
   * Generate recommendations based on diagnostics
   */
  generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    // Check for non-existent collections
    const missingCollections = Object.entries(this.results.collections)
      .filter(([name, data]) => !data.exists)
      .map(([name]) => name);
    
    if (missingCollections.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        type: 'CREATE_COLLECTIONS',
        action: 'Create missing collections in Appwrite Console',
        collections: missingCollections,
        description: `Collections ${missingCollections.join(', ')} do not exist and need to be created`
      });
    }
    
    // Check for empty collections
    const emptyCollections = Object.entries(this.results.collections)
      .filter(([name, data]) => data.exists && data.isEmpty)
      .map(([name]) => name);
    
    if (emptyCollections.length > 0) {
      this.results.recommendations.push({
        priority: 'MEDIUM',
        type: 'POPULATE_DATA',
        action: 'Create sample data for testing',
        collections: emptyCollections,
        description: `Collections ${emptyCollections.join(', ')} are empty and need sample data for testing`
      });
    }
    
    // Check for field mapping issues
    const fieldMappingIssues = this.results.warnings.filter(w => w.type === 'FIELD_MAPPING_ERROR');
    if (fieldMappingIssues.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        type: 'FIX_FIELD_MAPPINGS',
        action: 'Update database queries to use correct field names',
        issues: fieldMappingIssues,
        description: 'Database queries are failing due to incorrect field name assumptions'
      });
    }
    
    // Check if user needs items for AI matching
    const userItemCount = this.results.dataIntegrity.items?.userDocumentCount || 0;
    if (userItemCount === 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        type: 'CREATE_USER_ITEMS',
        action: 'Create items for current user to enable AI matching',
        userId: this.currentUser.$id,
        description: 'User has no items, which prevents AI matching system from working'
      });
    }
  }

  /**
   * Export diagnostics report
   */
  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      user: {
        id: this.currentUser.$id,
        name: this.currentUser.name,
        email: this.currentUser.email
      },
      database: {
        endpoint: 'https://nyc.cloud.appwrite.io/v1',
        projectId: '689bdee000098bd9d55c',
        databaseId: DATABASE_ID
      },
      ...this.results
    };
    
    // Export to JSON file
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-post-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📄 Diagnostics report exported');
    return report;
  }
}

// Create global instance
const diagnostics = new DatabaseDiagnostics();

// Export for use in components and debugging
export default diagnostics;
export { DatabaseDiagnostics };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.databaseDiagnostics = diagnostics;
  window.runDatabaseDiagnostics = () => diagnostics.runFullDiagnostics();
}