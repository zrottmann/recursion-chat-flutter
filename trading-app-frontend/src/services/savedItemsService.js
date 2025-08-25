/**
 * Saved Items Service
 * Handles saved/favorite items using Appwrite
 */

import { databases, ID, Query } from '../lib/appwrite';
import config from '../config/appwriteConfig';
// Import smart database wrapper to handle schema issues
import { smartDatabases } from '../utils/fixDatabaseSchema';

class SavedItemsService {
  constructor() {
    this.databaseId = config.database.databaseId;
    this.itemsCollection = config.database.collections.items;
    this.usersCollection = config.database.collections.users;
    // We'll store saved items in user document as an array of item IDs
    // Use smart wrapper to handle field mapping issues
    this.db = smartDatabases;
  }

  /**
   * Get all saved items for current user
   */
  async getSavedItems(userId) {
    try {
      // Get user document which contains saved item IDs
      const userDoc = await this.db.getDocument(
        this.databaseId,
        this.usersCollection,
        userId
      );

      const savedItemIds = userDoc.savedItems || [];
      
      if (savedItemIds.length === 0) {
        return [];
      }

      // Fetch the actual items
      const response = await this.db.listDocuments(
        this.databaseId,
        this.itemsCollection,
        [
          Query.equal('$id', savedItemIds),
          Query.limit(100)
        ]
      );

      return response.documents;
    } catch (error) {
      console.error('Failed to fetch saved items:', error);
      return [];
    }
  }

  /**
   * Save an item to user's saved list
   */
  async saveItem(userId, itemId) {
    try {
      const userDoc = await this.db.getDocument(
        this.databaseId,
        this.usersCollection,
        userId
      );

      const savedItems = userDoc.savedItems || [];
      
      // Add item if not already saved
      if (!savedItems.includes(itemId)) {
        savedItems.push(itemId);
        
        await this.db.updateDocument(
          this.databaseId,
          this.usersCollection,
          userId,
          {
            savedItems: savedItems
          }
        );
      }

      return true;
    } catch (error) {
      console.error('Failed to save item:', error);
      throw error;
    }
  }

  /**
   * Remove an item from user's saved list
   */
  async unsaveItem(userId, itemId) {
    try {
      const userDoc = await this.db.getDocument(
        this.databaseId,
        this.usersCollection,
        userId
      );

      const savedItems = userDoc.savedItems || [];
      const updatedItems = savedItems.filter(id => id !== itemId);
      
      await this.db.updateDocument(
        this.databaseId,
        this.usersCollection,
        userId,
        {
          savedItems: updatedItems
        }
      );

      return true;
    } catch (error) {
      console.error('Failed to unsave item:', error);
      throw error;
    }
  }

  /**
   * Check if an item is saved by user
   */
  async isItemSaved(userId, itemId) {
    try {
      const userDoc = await this.db.getDocument(
        this.databaseId,
        this.usersCollection,
        userId
      );

      const savedItems = userDoc.savedItems || [];
      return savedItems.includes(itemId);
    } catch (error) {
      console.error('Failed to check saved status:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new SavedItemsService();