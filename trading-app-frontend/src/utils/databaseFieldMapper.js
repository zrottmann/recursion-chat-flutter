/**
 * Database Field Mapper
 * Dynamically detects and maps field names across different collections
 * Handles inconsistencies between user_id, userId, owner_id, etc.
 */

import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

class DatabaseFieldMapper {
  constructor() {
    this.fieldMappings = new Map();
    this.initialized = false;
  }

  /**
   * Initialize field mappings by querying collections and detecting field names
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🔍 [FieldMapper] Initializing database field mappings...');

    try {
      // Common field variations to check (userId first as it's most common in Appwrite)
      const userFieldVariations = ['userId', 'user_id', 'owner_id', 'ownerId', 'created_by', 'createdBy', 'user'];
      
      for (const [collectionName, collectionId] of Object.entries(COLLECTIONS)) {
        await this.detectFieldsForCollection(collectionName, collectionId, userFieldVariations);
      }

      this.initialized = true;
      console.log('✅ [FieldMapper] Field mappings initialized:', Object.fromEntries(this.fieldMappings));
    } catch (error) {
      console.error('❌ [FieldMapper] Failed to initialize field mappings:', error);
    }
  }

  /**
   * Detect the correct field names for a collection
   */
  async detectFieldsForCollection(collectionName, collectionId, fieldVariations) {
    try {
      // Special handling for users collection - it uses document ID as user identifier
      if (collectionName === 'users') {
        this.fieldMappings.set(`${collectionName}.user`, '$id');
        this.fieldMappings.set(`${collectionName}.queryMethod`, 'getDocument'); // Use getDocument instead of listDocuments
        console.log(`✅ [FieldMapper] ${collectionName}: uses document $id as user identifier (direct lookup)`);
        
        // Get sample to store available fields
        try {
          const response = await databases.listDocuments(DATABASE_ID, collectionId, [
            Query.limit(1)
          ]);
          
          if (response.documents.length > 0) {
            const availableFields = Object.keys(response.documents[0]);
            this.fieldMappings.set(`${collectionName}.fields`, availableFields);
            console.log(`📝 [FieldMapper] ${collectionName}: available fields:`, availableFields);
          } else {
            console.log(`📭 [FieldMapper] ${collectionName}: collection is empty`);
          }
        } catch (error) {
          console.log(`⚠️ [FieldMapper] ${collectionName}: couldn't list documents:`, error.message);
        }
        return;
      }

      // Get a sample document to see what fields exist
      const response = await databases.listDocuments(DATABASE_ID, collectionId, [
        Query.limit(1)
      ]);

      if (response.documents.length > 0) {
        const sampleDoc = response.documents[0];
        const availableFields = Object.keys(sampleDoc);
        
        // Find the user field
        const userField = fieldVariations.find(field => availableFields.includes(field));
        
        if (userField) {
          this.fieldMappings.set(`${collectionName}.user`, userField);
          console.log(`✅ [FieldMapper] ${collectionName}: user field is '${userField}'`);
        } else {
          // Default to userId (Appwrite standard) if no field found
          this.fieldMappings.set(`${collectionName}.user`, 'userId');
          console.log(`📝 [FieldMapper] ${collectionName}: defaulting to 'userId' field (Appwrite standard)`);
        }

        // Store all available fields for reference
        this.fieldMappings.set(`${collectionName}.fields`, availableFields);
      } else {
        console.log(`📭 [FieldMapper] ${collectionName}: collection is empty, cannot detect fields`);
        // Set default for empty collections (use Appwrite standard)
        this.fieldMappings.set(`${collectionName}.user`, 'userId');
      }
    } catch (error) {
      if (error.code === 404) {
        console.warn(`⚠️ [FieldMapper] ${collectionName}: collection does not exist`);
        // Set defaults for non-existent collections (use Appwrite standard)
        this.fieldMappings.set(`${collectionName}.user`, 'userId');
      } else {
        console.error(`❌ [FieldMapper] Error detecting fields for ${collectionName}:`, error);
      }
    }
  }

  /**
   * Get the correct field name for a collection and field type
   */
  getFieldName(collectionName, fieldType) {
    if (!this.initialized) {
      console.warn('⚠️ [FieldMapper] Not initialized, using fallback field names');
      return this.getFallbackFieldName(fieldType);
    }

    const mappedField = this.fieldMappings.get(`${collectionName}.${fieldType}`);
    return mappedField || this.getFallbackFieldName(fieldType);
  }

  /**
   * Fallback field names when mapping fails
   */
  getFallbackFieldName(fieldType) {
    const fallbacks = {
      user: 'userId',  // Use Appwrite standard field name
      owner: 'ownerId',
      id: '$id'
    };
    return fallbacks[fieldType] || fieldType;
  }

  /**
   * Create a query with the correct field name
   */
  createUserQuery(collectionName, userId, additionalQueries = []) {
    // Special handling for users collection - query by document ID
    if (collectionName === 'users') {
      return [
        Query.equal('$id', [userId]),
        ...additionalQueries
      ];
    }
    
    const userField = this.getFieldName(collectionName, 'user');
    return [
      Query.equal(userField, [userId]),
      ...additionalQueries
    ];
  }

  /**
   * Check if a collection exists
   */
  async collectionExists(collectionName) {
    try {
      const collectionId = COLLECTIONS[collectionName];
      if (!collectionId) return false;

      await databases.listDocuments(DATABASE_ID, collectionId, [Query.limit(1)]);
      return true;
    } catch (error) {
      return error.code !== 404;
    }
  }

  /**
   * Get all available fields for a collection
   */
  getAvailableFields(collectionName) {
    return this.fieldMappings.get(`${collectionName}.fields`) || [];
  }

  /**
   * Create collections that don't exist
   */
  async ensureCollectionsExist() {
    const requiredCollections = ['matches', 'notifications', 'saved_items'];
    
    for (const collectionName of requiredCollections) {
      if (!(await this.collectionExists(collectionName))) {
        console.log(`📝 [FieldMapper] Collection '${collectionName}' needs to be created`);
        // Note: Collections should be created via Appwrite Console or backend
        // This is just for logging purposes
      }
    }
  }
}

// Create singleton instance
const fieldMapper = new DatabaseFieldMapper();

// Auto-initialize when imported
fieldMapper.initialize().catch(console.error);

export default fieldMapper;

// Export convenience functions
export const getFieldName = (collection, fieldType) => fieldMapper.getFieldName(collection, fieldType);
export const createUserQuery = (collection, userId, additional = []) => {
  // Special handling for users collection - return empty array for direct document lookup
  // The smartDatabases wrapper will handle this by using getDocument instead
  if (collection === 'users') {
    // Return a special marker query that smartDatabases will recognize
    return [
      Query.equal('user_id', [userId]),
      ...additional
    ];
  }
  return fieldMapper.createUserQuery(collection, userId, additional);
};
export const collectionExists = (collection) => fieldMapper.collectionExists(collection);
export const ensureCollectionsExist = () => fieldMapper.ensureCollectionsExist();

// Export helper to check if we should use getDocument for a collection
export const shouldUseGetDocument = (collection, userId) => {
  return collection === 'users' && userId;
};