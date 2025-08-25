/**
 * Database Service Wrapper
 * Provides fallback mechanisms for missing collections and schema issues
 * 
 * This wrapper ensures the app functions even when certain collections
 * like 'matches' or 'saved_items' don't exist in the database yet.
 */

import { smartDatabases } from './fixDatabaseSchema';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

class DatabaseServiceWrapper {
  constructor() {
    this.smartDb = smartDatabases;
    this.missingCollections = new Set();
    this.collectionStatus = new Map();
  }

  /**
   * Check if a collection exists and cache the result
   */
  async checkCollectionExists(collectionId) {
    if (this.collectionStatus.has(collectionId)) {
      return this.collectionStatus.get(collectionId);
    }

    try {
      // Try to list documents with limit 1 to check if collection exists
      await databases.listDocuments(DATABASE_ID, collectionId, [Query.limit(1)]);
      this.collectionStatus.set(collectionId, true);
      return true;
    } catch (error) {
      if (error.code === 404) {
        this.collectionStatus.set(collectionId, false);
        this.missingCollections.add(collectionId);
        console.warn(`⚠️ Collection '${collectionId}' does not exist - using fallbacks`);
        return false;
      }
      // For other errors, assume collection exists but has other issues
      this.collectionStatus.set(collectionId, true);
      return true;
    }
  }

  /**
   * List documents with fallback for missing collections
   */
  async listDocuments(databaseId, collectionId, queries = []) {
    // Check if collection exists first
    const exists = await this.checkCollectionExists(collectionId);
    
    if (!exists) {
      console.warn(`📭 Collection '${collectionId}' doesn't exist - returning empty result`);
      return {
        total: 0,
        documents: []
      };
    }

    // Use smart database wrapper for schema fixes
    return await this.smartDb.listDocuments(databaseId, collectionId, queries);
  }

  /**
   * Get document with fallback for missing collections
   */
  async getDocument(databaseId, collectionId, documentId) {
    const exists = await this.checkCollectionExists(collectionId);
    
    if (!exists) {
      throw new Error(`Collection '${collectionId}' does not exist`);
    }

    return await this.smartDb.getDocument(databaseId, collectionId, documentId);
  }

  /**
   * Create document with fallback for missing collections
   */
  async createDocument(databaseId, collectionId, documentId, data, permissions) {
    const exists = await this.checkCollectionExists(collectionId);
    
    if (!exists) {
      console.error(`❌ Cannot create document in missing collection '${collectionId}'`);
      throw new Error(`Collection '${collectionId}' does not exist. Please create it in Appwrite Console first.`);
    }

    return await this.smartDb.createDocument(databaseId, collectionId, documentId, data, permissions);
  }

  /**
   * Update document with fallback for missing collections
   */
  async updateDocument(databaseId, collectionId, documentId, data) {
    const exists = await this.checkCollectionExists(collectionId);
    
    if (!exists) {
      throw new Error(`Collection '${collectionId}' does not exist`);
    }

    return await this.smartDb.updateDocument(databaseId, collectionId, documentId, data);
  }

  /**
   * Delete document with fallback for missing collections
   */
  async deleteDocument(databaseId, collectionId, documentId) {
    const exists = await this.checkCollectionExists(collectionId);
    
    if (!exists) {
      throw new Error(`Collection '${collectionId}' does not exist`);
    }

    return await this.smartDb.deleteDocument(databaseId, collectionId, documentId);
  }

  /**
   * Get list of missing collections
   */
  getMissingCollections() {
    return Array.from(this.missingCollections);
  }

  /**
   * Reset collection status cache (useful after creating new collections)
   */
  resetCollectionCache() {
    this.collectionStatus.clear();
    this.missingCollections.clear();
  }

  /**
   * Special method to handle matches queries with graceful degradation
   */
  async getMatchesForUser(userId, options = {}) {
    try {
      const exists = await this.checkCollectionExists(COLLECTIONS.matches);
      
      if (!exists) {
        console.log('🤖 Matches collection not available - using fallback empty result');
        return {
          total: 0,
          documents: [],
          fallback: true,
          message: 'Matches collection not yet created. AI matching will be available once the collection is set up.'
        };
      }

      // Use smart database wrapper for actual query
      const queries = [
        Query.equal('user_id', userId), // Will be mapped by smart wrapper
        Query.limit(options.limit || 20),
        Query.orderDesc('$createdAt')
      ];

      return await this.smartDb.listDocuments(DATABASE_ID, COLLECTIONS.matches, queries);
    } catch (error) {
      console.error('❌ Failed to fetch matches:', error);
      return {
        total: 0,
        documents: [],
        error: true,
        message: error.message
      };
    }
  }

  /**
   * Special method to handle saved items queries with graceful degradation
   */
  async getSavedItemsForUser(userId, options = {}) {
    try {
      const exists = await this.checkCollectionExists(COLLECTIONS.savedItems);
      
      if (!exists) {
        console.log('💾 Saved items collection not available - using fallback empty result');
        return {
          total: 0,
          documents: [],
          fallback: true,
          message: 'Saved items collection not yet created.'
        };
      }

      const queries = [
        Query.equal('user_id', userId), // Will be mapped by smart wrapper
        Query.limit(options.limit || 50),
        Query.orderDesc('$createdAt')
      ];

      return await this.smartDb.listDocuments(DATABASE_ID, COLLECTIONS.savedItems, queries);
    } catch (error) {
      console.error('❌ Failed to fetch saved items:', error);
      return {
        total: 0,
        documents: [],
        error: true,
        message: error.message
      };
    }
  }
}

// Export singleton instance
export default new DatabaseServiceWrapper();