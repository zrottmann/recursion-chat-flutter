/**
 * Appwrite AI Matching Service
 * Implements intelligent matching with Appwrite backend
 */

import { databases, functions, DATABASE_ID, COLLECTIONS, ID, Query, handleAppwriteError } from '../lib/appwrite';
import { account } from '../lib/appwrite';
import { smartDatabases } from '../utils/fixDatabaseSchema';
import aiMatchingService from './aiMatchingService';
import semanticMatchingService from './semanticMatchingService';
import bundleMatching from './bundleMatching';
import proactiveMatching from './proactiveMatching';

class AppwriteAIMatching {
  constructor() {
    this.db = smartDatabases;
    this.matchCache = new Map();
    this.processingQueue = [];
    this.isProcessing = false;
  }

  /**
   * Initialize AI matching for current user
   */
  async initializeForUser() {
    try {
      const user = await account.get();
      if (!user) return null;

      // Check if user has matches collection entry
      const userMatches = await this.getUserMatchesProfile(user.$id);
      
      if (!userMatches) {
        // Create initial matches profile
        await this.createMatchesProfile(user.$id);
      }

      // Start background matching process
      this.startBackgroundMatching(user.$id);
      
      return user.$id;
    } catch (error) {
      console.error('Failed to initialize AI matching:', error);
      return null;
    }
  }

  /**
   * Get or create user matches profile
   */
  async getUserMatchesProfile(userId) {
    try {
      const profiles = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.matches,
        [Query.equal('user_id', userId), Query.limit(1)]
      );
      
      return profiles.documents[0] || null;
    } catch (error) {
      console.error('Error fetching matches profile:', error);
      return null;
    }
  }

  /**
   * Create matches profile for new user
   */
  async createMatchesProfile(userId) {
    try {
      const profile = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        ID.unique(),
        {
          user_id: userId,
          preferences: {
            categories: [],
            max_distance: 50,
            value_range: { min: 0, max: 10000 },
            auto_match: true
          },
          statistics: {
            total_matches: 0,
            accepted_matches: 0,
            declined_matches: 0,
            success_rate: 0
          },
          last_match_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      );
      
      console.log('✅ Created matches profile for user');
      return profile;
    } catch (error) {
      console.error('Failed to create matches profile:', error);
      return null;
    }
  }

  /**
   * Generate AI matches for user's items
   */
  async generateAIMatches(userId, options = {}) {
    try {
      const {
        maxMatches = 10,
        includeSemanticMatches = true,
        includeBundleMatches = true,
        includeProactiveMatches = true
      } = options;

      console.log('🤖 Generating AI matches for user:', userId);

      // Get user's active items
      const userItems = await this.getUserItems(userId);
      if (!userItems.length) {
        console.log('No items to match');
        return [];
      }

      // Get potential matches from multiple sources
      const matches = [];

      // 1. Traditional AI matching
      const aiMatches = await aiMatchingService.findOptimizedMatches(userId, {
        maxMatches: Math.floor(maxMatches * 0.4),
        includeSemanticMatches,
        includeBundleMatches
      });
      matches.push(...this.formatAIMatches(aiMatches, 'ai'));

      // 2. Semantic matching
      if (includeSemanticMatches) {
        for (const item of userItems.slice(0, 3)) { // Top 3 items
          const semanticMatches = await semanticMatchingService.findSemanticMatches(
            item.title + ' ' + item.description,
            {
              maxResults: Math.floor(maxMatches * 0.2),
              excludeUserId: userId,
              category: item.category
            }
          );
          matches.push(...this.formatSemanticMatches(semanticMatches, item, 'semantic'));
        }
      }

      // 3. Bundle matching
      if (includeBundleMatches) {
        const bundleMatches = await bundleMatching.findBundleMatches(userId, {
          maxBundles: Math.floor(maxMatches * 0.2)
        });
        matches.push(...this.formatBundleMatches(bundleMatches, 'bundle'));
      }

      // 4. Proactive matching
      if (includeProactiveMatches) {
        const proactiveMatches = await proactiveMatching.generateProactivePredictions(userId, {
          includeTrendPredictions: true,
          includeSeasonalPredictions: true
        });
        if (proactiveMatches.proactiveMatches) {
          matches.push(...this.formatProactiveMatches(proactiveMatches.proactiveMatches, 'proactive'));
        }
      }

      // Remove duplicates and sort by score
      const uniqueMatches = this.deduplicateMatches(matches);
      const sortedMatches = uniqueMatches.sort((a, b) => b.score - a.score);

      // Store matches in Appwrite
      await this.storeMatches(userId, sortedMatches.slice(0, maxMatches));

      return sortedMatches.slice(0, maxMatches);

    } catch (error) {
      console.error('Failed to generate AI matches:', error);
      return [];
    }
  }

  /**
   * Get user's items for matching
   */
  async getUserItems(userId) {
    try {
      const response = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.items,
        [
          Query.equal('user_id', userId),
          Query.equal('status', 'active'),
          Query.orderDesc('$createdAt'),
          Query.limit(10)
        ]
      );
      
      return response.documents;
    } catch (error) {
      console.error('Failed to fetch user items:', error);
      return [];
    }
  }

  /**
   * Format AI matches for storage
   */
  formatAIMatches(matches, type) {
    return matches.map(match => ({
      id: ID.unique(),
      type,
      score: match.optimized_score || match.score || 0,
      user_item_id: match.user_item?.id,
      matched_item_id: match.matched_item?.id,
      matched_user_id: match.matched_user?.id,
      explanation: match.explanation || 'AI-powered match based on multiple factors',
      metadata: {
        value_match: match.value_compatibility,
        location_match: match.location_score,
        category_match: match.category_score
      }
    }));
  }

  /**
   * Format semantic matches
   */
  formatSemanticMatches(matches, userItem, type) {
    return matches.map(match => ({
      id: ID.unique(),
      type,
      score: match.similarity_score || 0,
      user_item_id: userItem.$id,
      matched_item_id: match.id,
      matched_user_id: match.user_id,
      explanation: `Similar to your "${userItem.title}"`,
      metadata: {
        semantic_score: match.similarity_score,
        matched_keywords: match.matched_keywords
      }
    }));
  }

  /**
   * Format bundle matches
   */
  formatBundleMatches(bundles, type) {
    return bundles.map(bundle => ({
      id: ID.unique(),
      type,
      score: bundle.total_score || 0,
      bundle_items: bundle.items.map(item => item.id),
      matched_bundle: bundle.matched_bundle.map(item => item.id),
      explanation: bundle.explanation || 'Bundle match for multiple items',
      metadata: {
        bundle_value: bundle.total_value,
        items_count: bundle.items.length
      }
    }));
  }

  /**
   * Format proactive matches
   */
  formatProactiveMatches(matches, type) {
    return matches.map(match => ({
      id: ID.unique(),
      type,
      score: match.confidence || 0,
      predicted_item: match.predicted_item,
      reason: match.reason,
      explanation: match.explanation || 'Predicted based on your activity',
      metadata: {
        prediction_type: match.prediction_type,
        trend_based: match.trend_based
      }
    }));
  }

  /**
   * Remove duplicate matches
   */
  deduplicateMatches(matches) {
    const seen = new Set();
    return matches.filter(match => {
      const key = `${match.user_item_id}-${match.matched_item_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Store matches in Appwrite
   */
  async storeMatches(userId, matches) {
    try {
      const timestamp = new Date().toISOString();
      
      for (const match of matches) {
        await this.db.createDocument(
          DATABASE_ID,
          COLLECTIONS.matches,
          ID.unique(),
          {
            user_id: userId,
            ...match,
            status: 'pending',
            created_at: timestamp
          }
        );
      }
      
      console.log(`✅ Stored ${matches.length} matches for user`);
    } catch (error) {
      console.error('Failed to store matches:', error);
    }
  }

  /**
   * Accept a match
   */
  async acceptMatch(matchId, userId) {
    try {
      const match = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId,
        {
          status: 'accepted',
          accepted_at: new Date().toISOString()
        }
      );

      // Create conversation if needed
      await this.createMatchConversation(match);
      
      // Update user statistics
      await this.updateMatchStatistics(userId, 'accepted');
      
      console.log('✅ Match accepted:', matchId);
      return { success: true, match };
    } catch (error) {
      console.error('Failed to accept match:', error);
      return { success: false, error: handleAppwriteError(error) };
    }
  }

  /**
   * Decline a match
   */
  async declineMatch(matchId, userId, reason = null) {
    try {
      const match = await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        matchId,
        {
          status: 'declined',
          declined_at: new Date().toISOString(),
          decline_reason: reason
        }
      );

      // Update user statistics
      await this.updateMatchStatistics(userId, 'declined');
      
      // Learn from decline for future matching
      if (reason) {
        await this.learnFromDecline(match, reason);
      }
      
      console.log('✅ Match declined:', matchId);
      return { success: true, match };
    } catch (error) {
      console.error('Failed to decline match:', error);
      return { success: false, error: handleAppwriteError(error) };
    }
  }

  /**
   * Create conversation for accepted match
   */
  async createMatchConversation(match) {
    try {
      // Check if conversation already exists
      const existing = await this.db.listDocuments(
        DATABASE_ID,
        COLLECTIONS.conversations,
        [
          Query.equal('match_id', match.$id),
          Query.limit(1)
        ]
      );

      if (existing.documents.length > 0) {
        return existing.documents[0];
      }

      // Create new conversation
      const conversation = await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.conversations,
        ID.unique(),
        {
          match_id: match.$id,
          participants: [match.user_id, match.matched_user_id],
          status: 'active',
          created_at: new Date().toISOString()
        }
      );

      console.log('✅ Created conversation for match');
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  }

  /**
   * Update user match statistics
   */
  async updateMatchStatistics(userId, action) {
    try {
      const profile = await this.getUserMatchesProfile(userId);
      if (!profile) return;

      const stats = profile.statistics || {};
      
      if (action === 'accepted') {
        stats.accepted_matches = (stats.accepted_matches || 0) + 1;
      } else if (action === 'declined') {
        stats.declined_matches = (stats.declined_matches || 0) + 1;
      }
      
      stats.total_matches = (stats.accepted_matches || 0) + (stats.declined_matches || 0);
      stats.success_rate = stats.total_matches > 0 
        ? (stats.accepted_matches / stats.total_matches) * 100 
        : 0;

      await this.db.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matches,
        profile.$id,
        { statistics: stats }
      );
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  /**
   * Learn from declined matches
   */
  async learnFromDecline(match, reason) {
    // Store decline feedback for ML improvement
    try {
      await this.db.createDocument(
        DATABASE_ID,
        COLLECTIONS.feedback,
        ID.unique(),
        {
          type: 'match_decline',
          match_id: match.$id,
          user_id: match.user_id,
          reason,
          match_type: match.type,
          match_score: match.score,
          created_at: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Failed to store decline feedback:', error);
    }
  }

  /**
   * Start background matching process
   */
  startBackgroundMatching(userId) {
    // Run matching every 30 minutes
    setInterval(async () => {
      try {
        const matches = await this.generateAIMatches(userId, {
          maxMatches: 5,
          includeProactiveMatches: true
        });
        console.log(`🔄 Background matching generated ${matches.length} new matches`);
      } catch (error) {
        console.error('Background matching failed:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }
}

export default new AppwriteAIMatching();