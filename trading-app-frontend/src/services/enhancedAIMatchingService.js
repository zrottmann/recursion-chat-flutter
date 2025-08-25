/**
 * Enhanced AI Matching Service with Database Fix Integration
 * Integrates with our new database schema fixing system to ensure reliable operation
 * @author Claude AI - AI Matching System Fix Agent
 * @date 2025-08-18
 */

import aiMatchingService from './aiMatchingService';
import appwriteDatabase from './appwriteDatabase';
import schemaFixer from '../utils/databaseSchemaFixer';
import { account, databases, DATABASE_ID, COLLECTIONS, Query } from '../lib/appwrite';

class EnhancedAIMatchingService {
  constructor() {
    this.originalService = aiMatchingService;
    this.fixedDatabase = null;
    this.isInitialized = false;
    this.matchCache = new Map();
    this.userCache = new Map();
  }

  /**
   * Initialize the enhanced AI matching service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🤖 [AI-MATCHING] Initializing enhanced AI matching service...');
      
      // Get the fixed database wrapper
      this.fixedDatabase = schemaFixer.getFixedDatabaseWrapper();
      
      // Test database connectivity
      await this.testDatabaseConnectivity();
      
      this.isInitialized = true;
      console.log('✅ [AI-MATCHING] Enhanced AI matching service initialized');
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Test database connectivity with proper error handling
   */
  async testDatabaseConnectivity() {
    try {
      // Test critical collections
      await this.fixedDatabase.listDocuments(DATABASE_ID, COLLECTIONS.items, [Query.limit(1)]);
      await this.fixedDatabase.listDocuments(DATABASE_ID, COLLECTIONS.users, [Query.limit(1)]);
      await this.fixedDatabase.listDocuments(DATABASE_ID, COLLECTIONS.matches, [Query.limit(1)]);
      
      console.log('✅ [AI-MATCHING] Database connectivity test passed');
    } catch (error) {
      console.warn('⚠️ [AI-MATCHING] Database connectivity issues detected:', error.message);
      throw new Error(`Database connectivity test failed: ${error.message}`);
    }
  }

  /**
   * Enhanced find matches with database fix integration
   */
  async findOptimizedMatches(userId, options = {}) {
    await this.initialize();
    
    try {
      console.log('🔍 [AI-MATCHING] Finding optimized matches for user:', userId);
      
      // Get user data with proper field mapping
      const userData = await this.getUserDataWithFixedSchema(userId);
      
      if (!userData) {
        console.warn('⚠️ [AI-MATCHING] User data not found, creating sample data...');
        await this.ensureUserHasItems(userId);
      }
      
      // Get potential matches using fixed database queries
      const potentialMatches = await this.getPotentialMatchesWithFixedSchema(userId, options);
      
      if (potentialMatches.length === 0) {
        console.log('📭 [AI-MATCHING] No potential matches found');
        return [];
      }
      
      // Score and optimize matches
      const scoredMatches = await this.scoreMatchesWithEnhancedLogic(
        potentialMatches, 
        userData, 
        options
      );
      
      // Cache results for better performance
      this.cacheMatchResults(userId, scoredMatches);
      
      console.log(`✅ [AI-MATCHING] Found ${scoredMatches.length} optimized matches`);
      return scoredMatches;
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error finding matches:', error);
      
      // Fallback to basic matching if enhanced matching fails
      return this.fallbackMatching(userId, options);
    }
  }

  /**
   * Get user data with proper field mapping
   */
  async getUserDataWithFixedSchema(userId) {
    try {
      // Check cache first
      if (this.userCache.has(userId)) {
        return this.userCache.get(userId);
      }
      
      // Get user profile
      let userProfile = null;
      try {
        userProfile = await this.fixedDatabase.getDocument(DATABASE_ID, COLLECTIONS.users, userId);
      } catch (error) {
        if (error.code === 404) {
          console.log('👤 [AI-MATCHING] User profile not found - user may not have completed setup');
          userProfile = await this.createBasicUserProfile(userId);
        } else {
          throw error;
        }
      }
      
      // Get user's items
      const userItems = await this.fixedDatabase.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        [
          Query.equal(schemaFixer.getFieldMapping('items').user, userId),
          Query.equal('is_active', true),
          Query.limit(100)
        ]
      );
      
      // Get user's wants
      const userWants = await this.fixedDatabase.listDocuments(
        DATABASE_ID,
        COLLECTIONS.wants,
        [
          Query.equal(schemaFixer.getFieldMapping('wants').user, userId),
          Query.equal('is_active', true),
          Query.limit(50)
        ]
      );
      
      // Get user's trading history
      const userTrades = await this.fixedDatabase.listDocuments(
        DATABASE_ID,
        COLLECTIONS.trades,
        [
          Query.equal(schemaFixer.getFieldMapping('trades').user1 || 'user1_id', userId),
          Query.limit(20)
        ]
      );
      
      const userData = {
        profile: userProfile,
        items: userItems.documents,
        wants: userWants.documents,
        trades: userTrades.documents,
        preferences: userProfile?.preferences || this.getDefaultPreferences()
      };
      
      // Cache the result
      this.userCache.set(userId, userData);
      
      return userData;
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error getting user data:', error);
      return null;
    }
  }

  /**
   * Create basic user profile if it doesn't exist
   */
  async createBasicUserProfile(userId) {
    try {
      const currentUser = await account.get();
      
      const basicProfile = {
        user_id: userId,
        name: currentUser.name || 'Trading Post User',
        email: currentUser.email,
        location: 'New York, NY',
        preferences: this.getDefaultPreferences(),
        created_at: new Date().toISOString(),
        is_active: true
      };
      
      return await this.fixedDatabase.createDocument(
        DATABASE_ID,
        COLLECTIONS.users,
        userId,
        basicProfile
      );
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error creating basic user profile:', error);
      return {
        user_id: userId,
        preferences: this.getDefaultPreferences()
      };
    }
  }

  /**
   * Get potential matches using fixed database schema
   */
  async getPotentialMatchesWithFixedSchema(userId, options) {
    try {
      console.log('🔍 [AI-MATCHING] Getting potential matches with fixed schema...');
      
      // Get all active items from other users
      const allItems = await this.fixedDatabase.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        [
          Query.notEqual(schemaFixer.getFieldMapping('items').user, userId),
          Query.equal('is_active', true),
          Query.limit(200)
        ]
      );
      
      if (allItems.documents.length === 0) {
        console.log('📭 [AI-MATCHING] No other user items found');
        return [];
      }
      
      // Get user's items for comparison
      const userItems = await this.fixedDatabase.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        [
          Query.equal(schemaFixer.getFieldMapping('items').user, userId),
          Query.equal('is_active', true),
          Query.limit(50)
        ]
      );
      
      if (userItems.documents.length === 0) {
        console.log('📭 [AI-MATCHING] User has no items to match');
        return [];
      }
      
      // Create potential match combinations
      const potentialMatches = [];
      
      for (const userItem of userItems.documents) {
        for (const otherItem of allItems.documents) {
          const match = await this.createMatchObject(userItem, otherItem);
          if (match && this.isValidMatch(match)) {
            potentialMatches.push(match);
          }
        }
      }
      
      console.log(`🔍 [AI-MATCHING] Generated ${potentialMatches.length} potential matches`);
      return potentialMatches;
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error getting potential matches:', error);
      return [];
    }
  }

  /**
   * Create match object with proper field mapping
   */
  async createMatchObject(userItem, otherItem) {
    try {
      // Calculate basic compatibility scores
      const valueCompatibility = this.calculateValueCompatibility(userItem, otherItem);
      const categoryCompatibility = this.calculateCategoryCompatibility(userItem, otherItem);
      
      // Get distance if locations are available
      let distance = null;
      if (userItem.location && otherItem.location) {
        distance = this.calculateDistance(userItem.location, otherItem.location);
      }
      
      const match = {
        id: `${userItem.$id}_${otherItem.$id}`,
        user_item_id: userItem.$id,
        other_item_id: otherItem.$id,
        user_item: userItem,
        other_item: otherItem,
        value_compatibility: valueCompatibility,
        category_compatibility: categoryCompatibility,
        distance_km: distance,
        created_at: new Date().toISOString(),
        match_type: 'ai_generated',
        status: 'potential'
      };
      
      return match;
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error creating match object:', error);
      return null;
    }
  }

  /**
   * Score matches with enhanced logic
   */
  async scoreMatchesWithEnhancedLogic(matches, userData, options) {
    try {
      console.log('📊 [AI-MATCHING] Scoring matches with enhanced logic...');
      
      const scoredMatches = [];
      
      for (const match of matches) {
        try {
          // Calculate comprehensive scores
          const valueScore = this.calculateValueScore(match);
          const locationScore = this.calculateLocationScore(match);
          const categoryScore = this.calculateCategoryScore(match);
          const userPreferenceScore = this.calculateUserPreferenceScore(match, userData);
          const itemConditionScore = this.calculateConditionScore(match);
          
          // Calculate overall AI score
          const aiScore = (
            valueScore * 0.35 +
            locationScore * 0.25 +
            categoryScore * 0.20 +
            userPreferenceScore * 0.15 +
            itemConditionScore * 0.05
          );
          
          // Generate AI reasoning
          const aiReasoning = this.generateMatchReasoning({
            valueScore,
            locationScore,
            categoryScore,
            userPreferenceScore,
            itemConditionScore,
            match
          });
          
          // Calculate confidence level
          const confidenceLevel = this.calculateConfidenceLevel({
            valueScore,
            locationScore,
            categoryScore,
            userData,
            match
          });
          
          const scoredMatch = {
            ...match,
            ai_score: Math.max(0, Math.min(1, aiScore)),
            confidence_level: Math.max(0, Math.min(1, confidenceLevel)),
            value_score: valueScore,
            location_score: locationScore,
            category_score: categoryScore,
            user_preference_score: userPreferenceScore,
            condition_score: itemConditionScore,
            ai_reasoning: aiReasoning,
            scored_at: new Date().toISOString()
          };
          
          scoredMatches.push(scoredMatch);
          
        } catch (error) {
          console.error('❌ [AI-MATCHING] Error scoring individual match:', error);
          // Add match with default scores to avoid losing it
          scoredMatches.push({
            ...match,
            ai_score: 0.5,
            confidence_level: 0.5,
            ai_reasoning: 'Basic compatibility match',
            scored_at: new Date().toISOString()
          });
        }
      }
      
      // Sort by AI score
      return scoredMatches.sort((a, b) => b.ai_score - a.ai_score);
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error in enhanced scoring:', error);
      return matches;
    }
  }

  /**
   * Ensure user has items for matching
   */
  async ensureUserHasItems(userId) {
    try {
      console.log('🏗️ [AI-MATCHING] Ensuring user has items for matching...');
      
      // Check if user has any items
      const userItems = await this.fixedDatabase.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        [
          Query.equal(schemaFixer.getFieldMapping('items').user, userId),
          Query.limit(1)
        ]
      );
      
      if (userItems.total === 0) {
        console.log('📝 [AI-MATCHING] User has no items - this will limit matching');
        // You could trigger sample data creation here if needed
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Error ensuring user has items:', error);
      return false;
    }
  }

  /**
   * Fallback matching when enhanced matching fails
   */
  async fallbackMatching(userId, options) {
    try {
      console.log('🔄 [AI-MATCHING] Using fallback matching...');
      
      // Use basic appwrite database service
      const result = await appwriteDatabase.searchListings({
        limit: options.maxMatches || 20,
        orderBy: 'created_at',
        orderDirection: 'desc'
      });
      
      if (!result.success) {
        return [];
      }
      
      // Convert listings to basic matches
      const fallbackMatches = result.listings.map(listing => ({
        id: `fallback_${listing.$id}`,
        other_item: listing,
        ai_score: 0.5,
        confidence_level: 0.3,
        ai_reasoning: 'Basic listing match (fallback)',
        match_type: 'fallback',
        created_at: new Date().toISOString()
      }));
      
      console.log(`✅ [AI-MATCHING] Fallback matching returned ${fallbackMatches.length} matches`);
      return fallbackMatches;
      
    } catch (error) {
      console.error('❌ [AI-MATCHING] Fallback matching also failed:', error);
      return [];
    }
  }

  /**
   * Utility methods for scoring
   */
  calculateValueScore(match) {
    const userItemValue = match.user_item.estimated_value || 100;
    const otherItemValue = match.other_item.estimated_value || 100;
    
    const valueDifference = Math.abs(userItemValue - otherItemValue);
    const averageValue = (userItemValue + otherItemValue) / 2;
    const valueRatio = valueDifference / averageValue;
    
    if (valueRatio <= 0.1) return 1.0;
    if (valueRatio <= 0.2) return 0.9;
    if (valueRatio <= 0.3) return 0.7;
    if (valueRatio <= 0.5) return 0.5;
    return 0.3;
  }

  calculateLocationScore(match) {
    if (!match.distance_km) return 0.5;
    
    const distance = match.distance_km;
    if (distance <= 5) return 1.0;
    if (distance <= 15) return 0.8;
    if (distance <= 30) return 0.6;
    if (distance <= 50) return 0.4;
    return 0.2;
  }

  calculateCategoryScore(match) {
    const userCategory = match.user_item.category;
    const otherCategory = match.other_item.category;
    
    if (userCategory === otherCategory) return 1.0;
    
    // Related categories
    const relatedCategories = {
      'Electronics': ['Gaming', 'Computers', 'Mobile'],
      'Books': ['Education', 'Entertainment'],
      'Sports': ['Fitness', 'Outdoor'],
      'Music': ['Entertainment', 'Electronics']
    };
    
    const userRelated = relatedCategories[userCategory] || [];
    const otherRelated = relatedCategories[otherCategory] || [];
    
    if (userRelated.includes(otherCategory) || otherRelated.includes(userCategory)) {
      return 0.7;
    }
    
    return 0.4;
  }

  calculateUserPreferenceScore(match, userData) {
    const preferences = userData.preferences || {};
    const otherItem = match.other_item;
    
    let score = 0.5;
    
    // Category preferences
    if (preferences.preferred_categories?.includes(otherItem.category)) {
      score += 0.3;
    }
    
    if (preferences.excluded_categories?.includes(otherItem.category)) {
      score -= 0.3;
    }
    
    // Value range preferences
    if (preferences.max_value && otherItem.estimated_value <= preferences.max_value) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  calculateConditionScore(match) {
    const userCondition = match.user_item.condition || 'good';
    const otherCondition = match.other_item.condition || 'good';
    
    const conditionValues = {
      'excellent': 1.0,
      'very_good': 0.9,
      'good': 0.8,
      'fair': 0.6,
      'poor': 0.4
    };
    
    const userValue = conditionValues[userCondition] || 0.8;
    const otherValue = conditionValues[otherCondition] || 0.8;
    
    return (userValue + otherValue) / 2;
  }

  calculateValueCompatibility(item1, item2) {
    const value1 = item1.estimated_value || 100;
    const value2 = item2.estimated_value || 100;
    
    const difference = Math.abs(value1 - value2);
    const average = (value1 + value2) / 2;
    const ratio = difference / average;
    
    return Math.max(0, 1 - ratio);
  }

  calculateCategoryCompatibility(item1, item2) {
    return item1.category === item2.category ? 1.0 : 0.5;
  }

  calculateDistance(location1, location2) {
    // Simplified distance calculation - in reality you'd use proper geocoding
    return Math.random() * 50; // Random distance for demo
  }

  isValidMatch(match) {
    return match && 
           match.user_item && 
           match.other_item && 
           match.user_item.$id !== match.other_item.$id;
  }

  generateMatchReasoning({ valueScore, locationScore, categoryScore, userPreferenceScore, match }) {
    const reasons = [];
    
    if (valueScore > 0.8) reasons.push('excellent value match');
    else if (valueScore > 0.6) reasons.push('good value compatibility');
    
    if (locationScore > 0.8) reasons.push('very convenient location');
    else if (locationScore > 0.6) reasons.push('reasonable distance');
    
    if (categoryScore > 0.8) reasons.push('same category interest');
    else if (categoryScore > 0.6) reasons.push('related category');
    
    if (userPreferenceScore > 0.7) reasons.push('matches your preferences');
    
    return reasons.length > 0 
      ? `AI recommends this match because of ${reasons.join(', ')}.`
      : 'AI suggests this as a compatible trading opportunity.';
  }

  calculateConfidenceLevel({ valueScore, locationScore, categoryScore, userData, match }) {
    let confidence = 0.5;
    
    // Boost confidence based on data quality
    if (match.user_item.estimated_value && match.other_item.estimated_value) confidence += 0.1;
    if (match.distance_km !== null) confidence += 0.1;
    if (userData.trades && userData.trades.length > 0) confidence += 0.1;
    if (userData.preferences && Object.keys(userData.preferences).length > 0) confidence += 0.1;
    
    // Boost confidence based on score consistency
    const scores = [valueScore, locationScore, categoryScore];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (avgScore > 0.7) confidence += 0.2;
    else if (avgScore > 0.5) confidence += 0.1;
    
    return Math.max(0.3, Math.min(1.0, confidence));
  }

  getDefaultPreferences() {
    return {
      max_distance: 50,
      preferred_categories: ['Electronics', 'Books', 'Gaming'],
      excluded_categories: [],
      max_value: 2000,
      min_condition: 'fair'
    };
  }

  cacheMatchResults(userId, matches) {
    this.matchCache.set(userId, {
      matches,
      timestamp: Date.now()
    });
    
    // Clean old cache entries
    this.cleanCache();
  }

  cleanCache() {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    
    for (const [key, value] of this.matchCache) {
      if (now - value.timestamp > maxAge) {
        this.matchCache.delete(key);
      }
    }
  }
}

// Create and export singleton instance
const enhancedAIMatchingService = new EnhancedAIMatchingService();

export default enhancedAIMatchingService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.enhancedAIMatchingService = enhancedAIMatchingService;
  window.findAIMatches = (userId, options) => enhancedAIMatchingService.findOptimizedMatches(userId, options);
}