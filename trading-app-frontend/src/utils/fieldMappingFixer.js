/**
 * Field Mapping Fixer for Trading Post
 * Handles inconsistencies between frontend expectations and Appwrite schema
 */

import { Query } from '../lib/appwrite';

// Field mapping configuration based on discovered schema
const FIELD_MAPPINGS = {
  items: {
    userField: 'userId', // Primary user field in items collection
    fallbacks: ['user_id'], // Fallback field names to try
    requiredFields: ['userId', 'title', 'description', 'category', 'condition', 'location', 'createdAt', 'updatedAt']
  },
  matches: {
    userField: 'userId', // Based on error messages
    fallbacks: ['user_id', 'offerer_id', 'recipient_id'],
    requiredFields: ['userId', 'createdAt']
  },
  trades: {
    userField: 'userId',
    fallbacks: ['user_id', 'initiator_id', 'recipient_id'],
    requiredFields: ['userId', 'createdAt']
  },
  saved_items: {
    userField: 'userId',
    fallbacks: ['user_id'],
    requiredFields: ['userId', 'itemId', 'createdAt']
  },
  messages: {
    userField: 'userId',
    fallbacks: ['user_id', 'sender_id', 'recipient_id'],
    requiredFields: ['userId', 'createdAt']
  },
  notifications: {
    userField: 'userId',
    fallbacks: ['user_id', 'recipient_id'],
    requiredFields: ['userId', 'createdAt']
  },
  users: {
    userField: 'username', // Users collection requires username as primary identifier
    fallbacks: ['name', 'email'],
    requiredFields: ['username', 'email'] // Required fields for users
  },
  wants: {
    userField: 'userId',
    fallbacks: ['user_id'],
    requiredFields: ['userId', 'title', 'description']
  }
};

export class FieldMappingFixer {
  /**
   * Get the correct user field name for a collection
   */
  static getUserField(collectionName) {
    const mapping = FIELD_MAPPINGS[collectionName];
    return mapping ? mapping.userField : 'userId'; // Default fallback
  }

  /**
   * Get fallback field names for a collection
   */
  static getFallbackFields(collectionName) {
    const mapping = FIELD_MAPPINGS[collectionName];
    return mapping ? mapping.fallbacks : ['user_id'];
  }

  /**
   * Create a user query with automatic fallback handling
   */
  static createUserQuery(collectionName, userId) {
    const primaryField = this.getUserField(collectionName);
    
    try {
      return Query.equal(primaryField, userId);
    } catch (error) {
      console.warn(`[FieldMappingFixer] Primary field ${primaryField} failed for ${collectionName}, trying fallbacks`);
      
      // Try fallback fields
      const fallbacks = this.getFallbackFields(collectionName);
      for (const fallbackField of fallbacks) {
        try {
          console.log(`[FieldMappingFixer] Trying fallback field: ${fallbackField}`);
          return Query.equal(fallbackField, userId);
        } catch (fallbackError) {
          console.warn(`[FieldMappingFixer] Fallback field ${fallbackField} also failed`);
        }
      }
      
      // If all fails, throw the original error
      throw error;
    }
  }

  /**
   * Prepare document data with correct field names
   */
  static prepareDocumentData(collectionName, data, userId = null) {
    const mapping = FIELD_MAPPINGS[collectionName];
    if (!mapping) return data;

    const preparedData = { ...data };
    const userField = mapping.userField;
    
    // Special handling for users collection
    if (collectionName === 'users') {
      // For users collection, ensure username is set
      if (!preparedData.username && preparedData.name) {
        preparedData.username = preparedData.name;
      }
      if (!preparedData.username && preparedData.email) {
        preparedData.username = preparedData.email.split('@')[0];
      }
      // Ensure email is set
      if (!preparedData.email && preparedData.username) {
        preparedData.email = `${preparedData.username}@example.com`;
      }
    } else {
      // Add user field if userId provided for other collections
      if (userId) {
        preparedData[userField] = userId;
        // Also add fallback fields for compatibility
        mapping.fallbacks.forEach(fallback => {
          preparedData[fallback] = userId;
        });
      }
    }
    
    // Ensure timestamps are in correct format
    const now = new Date().toISOString();
    if (!preparedData.createdAt) {
      preparedData.createdAt = now;
    }
    if (!preparedData.updatedAt) {
      preparedData.updatedAt = now;
    }
    
    return preparedData;
  }

  /**
   * Validate that document has required fields
   */
  static validateDocument(collectionName, data) {
    const mapping = FIELD_MAPPINGS[collectionName];
    if (!mapping) return true;

    const missingFields = mapping.requiredFields.filter(field => {
      return !data.hasOwnProperty(field) || data[field] === undefined || data[field] === null;
    });

    if (missingFields.length > 0) {
      console.warn(`[FieldMappingFixer] Missing required fields for ${collectionName}:`, missingFields);
      return false;
    }

    return true;
  }

  /**
   * Fix common field name inconsistencies in response data
   */
  static normalizeResponseData(data) {
    if (!data || typeof data !== 'object') return data;
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.normalizeResponseData(item));
    }
    
    // Handle single objects
    const normalized = { ...data };
    
    // Common field normalizations
    const fieldMappings = {
      'user_id': 'userId',
      'item_id': 'itemId', 
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
      'primary_image_url': 'primaryImageUrl',
      'is_available': 'isAvailable',
      'is_featured': 'isFeatured',
      'ai_tags': 'aiTags',
      'ai_analysis': 'aiAnalysis',
      'estimated_value': 'estimatedValue',
      'ai_estimated_value': 'aiEstimatedValue',
      'trade_preferences': 'tradePreferences',
      'location_lat': 'locationLat',
      'location_lng': 'locationLng'
    };
    
    // Apply normalizations
    Object.entries(fieldMappings).forEach(([oldField, newField]) => {
      if (normalized.hasOwnProperty(oldField)) {
        normalized[newField] = normalized[oldField];
        // Keep old field for backward compatibility
      }
    });
    
    return normalized;
  }

  /**
   * Debug helper to log field mapping attempts
   */
  static debugFieldMapping(collectionName, operation, result) {
    console.log(`[FieldMappingFixer] ${collectionName} ${operation}:`, {
      primaryField: this.getUserField(collectionName),
      fallbacks: this.getFallbackFields(collectionName),
      success: !!result
    });
  }
}

export default FieldMappingFixer;