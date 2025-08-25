/**
 * Matching Service
 * Handles AI-powered matching and trade suggestions using Appwrite
 */

import createDebugger from '../utils/debugLogger.js';

const debug = createDebugger('trading-post:matchingService');

import { databases, functions, DATABASE_ID, COLLECTIONS, ID, Query, handleAppwriteError } from '../lib/appwrite';
import { account } from '../lib/appwrite';
import itemsService from './itemsService';
// Import database wrapper to handle schema issues and missing collections
import databaseWrapper from '../utils/databaseServiceWrapper';
import fieldMapper from '../utils/databaseFieldMapper';

class MatchingService {
  constructor() {
    this.currentUser = null;
    // Use database wrapper to handle schema issues and missing collections
    this.db = databaseWrapper;
    this.fieldMapper = fieldMapper;
    // Initialize field mappings
    this.initializeFieldMappings();
  }

  /**
   * Initialize field mappings for database queries
   */
  async initializeFieldMappings() {
    try {
      await this.fieldMapper.initialize();
    } catch (error) {
      debug.error('Failed to initialize field mappings', error);
    }
  }

  /**
   * Get current user ID
   */
  async getCurrentUserId() {
    try {
      if (!this.currentUser) {
        this.currentUser = await account.get();
      }
      return this.currentUser.$id;
    } catch (error) {
      debug.error('Failed to get current user', error);
      return null;
    }
  }

  /**
   * Get AI matches for user's items
   */
  async getMatches(options = {}) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const {
        page = 1,
        limit = 20,
        status = 'pending'
      } = options;

      debug.info('Fetching AI matches', options);

      // Use the special wrapper method for matches with graceful degradation
      const response = await this.db.getMatchesForUser(userId, {
        limit,
        offset: (page - 1) * limit,
        status
      });

      // Handle fallback cases
      if (response.fallback || response.error) {
        debug.warn('Matches collection not available or error occurred', response);
        return {
          matches: [],
          total: 0,
          page,
          hasMore: false,
          message: response.message || 'Matches service temporarily unavailable'
        };
      }

      // Fetch item details for each match
      const matchesWithDetails = await Promise.all(
        response.documents.map(async (match) => {
          try {
            // Get user's item
            const userItem = await this.db.getDocument(
              DATABASE_ID,
              COLLECTIONS.items,
              match.item_id
            );

            // Get matched item
            const matchedItem = await this.db.getDocument(
              DATABASE_ID,
              COLLECTIONS.items,
              match.matched_item_id
            );

            // Get matched user
            const matchedUser = await this.db.getDocument(
              DATABASE_ID,
              COLLECTIONS.users,
              match.matched_user_id
            );

            return {
              ...match,
              user_item: {
                ...userItem,
                images: userItem.images ? JSON.parse(userItem.images) : []
              },
              matched_item: {
                ...matchedItem,
                images: matchedItem.images ? JSON.parse(matchedItem.images) : []
              },
              matched_user: {
                id: matchedUser.$id,
                name: matchedUser.name,
                username: matchedUser.username,
                rating_average: matchedUser.rating_average,
                trades_completed: matchedUser.trades_completed
              }
            };
          } catch (error) {
            console.error('Error fetching match details:', error);
            return match;
          }
        })
      );

      console.log(`✅ Fetched ${matchesWithDetails.length} matches`);

      return {
        success: true,
        matches: matchesWithDetails,
        page,
        total_pages: Math.ceil(response.total / limit),
        total: response.total
      };

    } catch (error) {
      console.error('❌ Failed to fetch matches:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error),
        matches: [],
        total: 0
      };
    }
  }

  /**
   * Generate AI matches for an item
   */
  async generateMatches(itemId) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('🤖 Generating AI matches for item:', itemId);

      // Get the item details
      const item = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.items,
        itemId
      );

      // Get the correct user field for items collection
      const userField = this.fieldMapper.getFieldName('items', 'user');
      
      if (item[userField] !== userId) {
        throw new Error('You can only generate matches for your own items');
      }

      // Search for potential matches using proper field mapping
      const queries = [
        Query.equal('status', 'active'),
        Query.notEqual(userField, userId), // Don't match with own items
        Query.limit(50)
      ];

      // Add category filter for better matches
      if (item.category) {
        queries.push(Query.equal('category', item.category));
      }

      const potentialMatches = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        queries
      );

      // Calculate match scores
      const matches = [];
      for (const potentialMatch of potentialMatches.documents) {
        const score = this.calculateMatchScore(item, potentialMatch);
        
        if (score >= 0.5) { // Only include matches with score >= 50%
          // Check if match already exists
          const existingMatch = await this.checkExistingMatch(itemId, potentialMatch.$id);
          
          if (!existingMatch) {
            const matchDoc = {
              user_id: userId, // matches collection uses user_id field
              item_id: itemId,
              matched_item_id: potentialMatch.$id,
              matched_user_id: potentialMatch[userField], // Use mapped field for items collection
              match_score: score,
              match_reason: this.generateMatchReason(item, potentialMatch, score),
              status: 'pending',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            const createdMatch = await this.db.createDocument(
              DATABASE_ID,
              COLLECTIONS.matches,
              ID.unique(),
              matchDoc
            );

            matches.push(createdMatch);
          }
        }
      }

      console.log(`✅ Generated ${matches.length} new matches`);

      return {
        success: true,
        matches,
        total: matches.length
      };

    } catch (error) {
      console.error('❌ Failed to generate matches:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error),
        matches: []
      };
    }
  }

  /**
   * Calculate match score between two items
   */
  calculateMatchScore(item1, item2) {
    let score = 0;
    let factors = 0;

    // Category match (30% weight)
    if (item1.category === item2.category) {
      score += 0.3;
    }
    factors++;

    // Value similarity (25% weight)
    const value1 = item1.estimated_value || item1.ai_estimated_value || 0;
    const value2 = item2.estimated_value || item2.ai_estimated_value || 0;
    
    if (value1 > 0 && value2 > 0) {
      const valueDiff = Math.abs(value1 - value2);
      const avgValue = (value1 + value2) / 2;
      const valueScore = Math.max(0, 1 - (valueDiff / avgValue));
      score += valueScore * 0.25;
      factors++;
    }

    // Condition compatibility (20% weight)
    const conditionMap = {
      'new': 5,
      'like_new': 4,
      'good': 3,
      'fair': 2,
      'poor': 1
    };
    
    const cond1 = conditionMap[item1.condition] || 3;
    const cond2 = conditionMap[item2.condition] || 3;
    const condDiff = Math.abs(cond1 - cond2);
    const condScore = Math.max(0, 1 - (condDiff / 4));
    score += condScore * 0.2;

    // Location proximity (15% weight)
    if (item1.location_lat && item1.location_lng && item2.location_lat && item2.location_lng) {
      const distance = itemsService.calculateDistance(
        item1.location_lat,
        item1.location_lng,
        item2.location_lat,
        item2.location_lng
      );
      
      // Score based on distance (closer is better)
      const distanceScore = Math.max(0, 1 - (distance / 100)); // 100 miles max
      score += distanceScore * 0.15;
      factors++;
    }

    // AI tags similarity (10% weight)
    if (item1.ai_tags && item2.ai_tags) {
      const tags1 = JSON.parse(item1.ai_tags || '[]');
      const tags2 = JSON.parse(item2.ai_tags || '[]');
      
      if (tags1.length > 0 && tags2.length > 0) {
        const commonTags = tags1.filter(tag => tags2.includes(tag));
        const tagScore = commonTags.length / Math.max(tags1.length, tags2.length);
        score += tagScore * 0.1;
        factors++;
      }
    }

    return score;
  }

  /**
   * Generate human-readable match reason
   */
  generateMatchReason(item1, item2, score) {
    const reasons = [];
    
    if (item1.category === item2.category) {
      reasons.push(`Both items are in the ${item1.category} category`);
    }
    
    const value1 = item1.estimated_value || item1.ai_estimated_value || 0;
    const value2 = item2.estimated_value || item2.ai_estimated_value || 0;
    
    if (value1 > 0 && value2 > 0) {
      const valueDiff = Math.abs(value1 - value2);
      if (valueDiff < value1 * 0.2) {
        reasons.push('Similar estimated values');
      }
    }
    
    if (item1.condition === item2.condition) {
      reasons.push(`Both items are in ${item1.condition} condition`);
    }
    
    if (item1.location_lat && item2.location_lat) {
      const distance = itemsService.calculateDistance(
        item1.location_lat,
        item1.location_lng,
        item2.location_lat,
        item2.location_lng
      );
      
      if (distance < 25) {
        reasons.push(`Located within ${Math.round(distance)} miles`);
      }
    }
    
    if (reasons.length === 0) {
      reasons.push(`${Math.round(score * 100)}% compatibility score`);
    }
    
    return reasons.join('. ');
  }

  /**
   * Check if a match already exists
   */
  async checkExistingMatch(itemId, matchedItemId) {
    try {
      const queries = [
        Query.equal('item_id', itemId),
        Query.equal('matched_item_id', matchedItemId),
        Query.limit(1)
      ];

      const response = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.matches,
        queries
      );

      return response.documents.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Accept a match
   */
  async acceptMatch(matchId) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('✅ Accepting match:', matchId);

      // Get the match
      const match = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId
      );

      // For matches collection, user_id is the correct field name based on schema
      if (match.user_id !== userId) {
        throw new Error('You can only accept your own matches');
      }

      // Update match status
      const updatedMatch = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId,
        {
          status: 'accepted',
          updated_at: new Date().toISOString()
        }
      );

      // Create a trade proposal
      const trade = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.trades,
        ID.unique(),
        {
          initiator_id: userId,
          recipient_id: match.matched_user_id,
          initiator_items: JSON.stringify([match.item_id]),
          recipient_items: JSON.stringify([match.matched_item_id]),
          status: 'pending',
          message: `I'm interested in trading based on our AI match (${Math.round(match.match_score * 100)}% compatibility)`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      console.log('✅ Match accepted and trade created:', trade.$id);

      return {
        success: true,
        match: updatedMatch,
        trade
      };

    } catch (error) {
      console.error('❌ Failed to accept match:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error)
      };
    }
  }

  /**
   * Decline a match
   */
  async declineMatch(matchId) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('❌ Declining match:', matchId);

      // Get the match
      const match = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId
      );

      if (match.user_id !== userId) {
        throw new Error('You can only decline your own matches');
      }

      // Update match status
      const updatedMatch = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId,
        {
          status: 'declined',
          updated_at: new Date().toISOString()
        }
      );

      console.log('✅ Match declined');

      return {
        success: true,
        match: updatedMatch
      };

    } catch (error) {
      console.error('❌ Failed to decline match:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error)
      };
    }
  }

  /**
   * Get matching preferences
   */
  async getMatchingPreferences() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      // Get user profile
      const user = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        userId
      );

      // Return preferences from user profile
      const preferences = user.preferences ? JSON.parse(user.preferences) : {};
      
      return {
        success: true,
        preferences: {
          categories: preferences.preferred_categories || [],
          max_distance: preferences.max_distance || 50,
          min_value: preferences.min_value || 0,
          max_value: preferences.max_value || 10000,
          conditions: preferences.acceptable_conditions || ['new', 'like_new', 'good'],
          auto_match: preferences.auto_match !== false
        }
      };

    } catch (error) {
      console.error('❌ Failed to get preferences:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error),
        preferences: {}
      };
    }
  }

  /**
   * Update matching preferences
   */
  async updateMatchingPreferences(preferences) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('📝 Updating matching preferences:', preferences);

      // Update user profile with preferences
      const updatedUser = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        userId,
        {
          preferences: JSON.stringify(preferences),
          updated_at: new Date().toISOString()
        }
      );

      console.log('✅ Preferences updated');

      return {
        success: true,
        preferences
      };

    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error)
      };
    }
  }

  /**
   * Provide feedback on a match
   */
  async provideFeedback(matchId, feedback) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      console.log('💬 Providing feedback on match:', matchId, feedback);

      // Get the match
      const match = await this.db.getDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId
      );

      if (match.user_id !== userId) {
        throw new Error('You can only provide feedback on your own matches');
      }

      // Update match with feedback
      const updatedMatch = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId,
        {
          user_feedback: feedback,
          updated_at: new Date().toISOString()
        }
      );

      console.log('✅ Feedback recorded');

      return {
        success: true,
        match: updatedMatch
      };

    } catch (error) {
      console.error('❌ Failed to provide feedback:', error);
      return { 
        success: false, 
        error: handleAppwriteError(error)
      };
    }
  }
}

// Create singleton instance
const matchingService = new MatchingService();

export default matchingService;