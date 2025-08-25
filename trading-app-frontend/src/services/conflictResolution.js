/**
 * Intelligent Conflict Resolution Service
 * 
 * This service handles situations where multiple users are interested in the same item,
 * implementing fair distribution algorithms, priority scoring, alternative suggestions,
 * and waiting list management.
 */

import api from './api';
import aiMatchingService from './aiMatchingService';
import semanticMatchingService from './semanticMatchingService';

class ConflictResolutionService {
  constructor() {
    this.activeConflicts = new Map();
    this.waitingLists = new Map();
    this.resolutionHistory = new Map();
    this.priorityCache = new Map();
    
    // Configuration for conflict resolution
    this.config = {
      maxConflictDuration: 3600000, // 1 hour
      priorityRefreshInterval: 300000, // 5 minutes
      maxWaitingListSize: 50,
      maxAlternativeSuggestions: 10,
      
      // Priority weights
      userHistoryWeight: 0.25,
      responseTimeWeight: 0.20,
      locationWeight: 0.15,
      engagementWeight: 0.15,
      fairnessWeight: 0.25,
      
      // Fairness factors
      recentSuccessRatePenalty: 0.3,
      newUserBonus: 0.2,
      loyaltyBonus: 0.15,
      
      // Conflict resolution strategies
      strategies: {
        'first_come_first_served': { weight: 0.4 },
        'priority_based': { weight: 0.35 },
        'fairness_optimized': { weight: 0.25 }
      },
      
      // Alternative matching parameters
      semanticSimilarityThreshold: 0.7,
      maxAlternativeDistance: 100, // km
      alternativeValueTolerance: 0.3 // 30%
    };
    
    // Initialize conflict resolution processes
    this.initializeConflictResolution();
  }

  /**
   * Main conflict resolution entry point
   */
  async resolveConflict(itemId, interestedUsers, context = {}) {
    try {
      const conflictId = this.generateConflictId(itemId, interestedUsers);
      
      // Check if conflict already exists
      if (this.activeConflicts.has(conflictId)) {
        return await this.updateExistingConflict(conflictId, interestedUsers);
      }
      
      // Create new conflict resolution
      const conflict = await this.createConflictResolution(itemId, interestedUsers, context);
      this.activeConflicts.set(conflictId, conflict);
      
      // Apply resolution strategy
      const resolution = await this.applyResolutionStrategy(conflict);
      
      // Handle the resolution results
      const result = await this.handleResolutionResults(conflict, resolution);
      
      // Log the resolution for learning
      await this.logConflictResolution(conflict, resolution, result);
      
      return result;

    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive conflict resolution
   */
  async createConflictResolution(itemId, interestedUsers, context) {
    // Get item details
    const item = await this.getItemDetails(itemId);
    
    // Calculate priority scores for all interested users
    const userPriorities = await this.calculateUserPriorities(interestedUsers, item, context);
    
    // Analyze conflict complexity
    const complexity = this.analyzeConflictComplexity(interestedUsers, item);
    
    // Find alternative suggestions for all users
    const alternatives = await this.findAlternatives(interestedUsers, item);
    
    const conflict = {
      id: this.generateConflictId(itemId, interestedUsers),
      itemId,
      item,
      interestedUsers,
      userPriorities,
      alternatives,
      complexity,
      createdAt: Date.now(),
      status: 'active',
      context,
      resolutionAttempts: 0
    };
    
    return conflict;
  }

  /**
   * Calculate comprehensive user priorities
   */
  async calculateUserPriorities(users, item, context) {
    const priorities = [];
    
    for (const user of users) {
      try {
        const priority = await this.calculateUserPriority(user, item, context);
        priorities.push({
          userId: user.userId || user.id,
          user,
          priority,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('Error calculating priority for user:', user.id, error);
        priorities.push({
          userId: user.userId || user.id,
          user,
          priority: { total: 0.5, factors: {} },
          timestamp: Date.now()
        });
      }
    }
    
    // Sort by priority score (highest first)
    priorities.sort((a, b) => b.priority.total - a.priority.total);
    
    return priorities;
  }

  /**
   * Calculate individual user priority using multiple factors
   */
  async calculateUserPriority(user, item, context) {
    const factors = {};
    
    // User history factor
    factors.userHistory = await this.calculateUserHistoryScore(user, item);
    
    // Response time factor (how quickly they showed interest)
    factors.responseTime = this.calculateResponseTimeScore(user, context);
    
    // Location proximity factor
    factors.location = this.calculateLocationScore(user, item);
    
    // Engagement level factor
    factors.engagement = await this.calculateEngagementScore(user, item);
    
    // Fairness factor (recent success rate, new user bonus, etc.)
    factors.fairness = await this.calculateFairnessScore(user);
    
    // Match quality factor
    factors.matchQuality = await this.calculateMatchQualityScore(user, item);
    
    // User preference alignment
    factors.preferenceAlignment = await this.calculatePreferenceAlignment(user, item);
    
    // Trading frequency and patterns
    factors.tradingPattern = await this.calculateTradingPatternScore(user);
    
    // Calculate weighted total priority
    const total = (
      factors.userHistory * this.config.userHistoryWeight +
      factors.responseTime * this.config.responseTimeWeight +
      factors.location * this.config.locationWeight +
      factors.engagement * this.config.engagementWeight +
      factors.fairness * this.config.fairnessWeight +
      factors.matchQuality * 0.1 +
      factors.preferenceAlignment * 0.1 +
      factors.tradingPattern * 0.05
    );
    
    return {
      total: Math.min(1.0, Math.max(0.0, total)),
      factors,
      calculatedAt: Date.now()
    };
  }

  /**
   * Apply appropriate resolution strategy
   */
  async applyResolutionStrategy(conflict) {
    const { item, userPriorities, complexity, alternatives } = conflict;
    
    // Choose resolution strategy based on conflict characteristics
    const strategy = this.selectResolutionStrategy(conflict);
    
    let resolution;
    
    switch (strategy) {
      case 'first_come_first_served':
        resolution = await this.applyFirstComeFirstServedStrategy(conflict);
        break;
        
      case 'priority_based':
        resolution = await this.applyPriorityBasedStrategy(conflict);
        break;
        
      case 'fairness_optimized':
        resolution = await this.applyFairnessOptimizedStrategy(conflict);
        break;
        
      case 'alternative_distribution':
        resolution = await this.applyAlternativeDistributionStrategy(conflict);
        break;
        
      case 'waiting_list':
        resolution = await this.applyWaitingListStrategy(conflict);
        break;
        
      default:
        resolution = await this.applyPriorityBasedStrategy(conflict);
    }
    
    resolution.strategy = strategy;
    resolution.timestamp = Date.now();
    
    return resolution;
  }

  /**
   * First Come First Served strategy
   */
  async applyFirstComeFirstServedStrategy(conflict) {
    const { userPriorities } = conflict;
    
    // Sort by response time (earliest first)
    const sortedByTime = [...userPriorities].sort((a, b) => 
      a.priority.factors.responseTime - b.priority.factors.responseTime
    );
    
    const winner = sortedByTime[0];
    const waitingList = sortedByTime.slice(1);
    
    return {
      type: 'first_come_first_served',
      winner: winner.userId,
      waitingList: waitingList.map(u => u.userId),
      reasoning: `Selected based on first-come-first-served principle. ${winner.user.name || winner.userId} responded first.`,
      alternatives: await this.prepareAlternativesForUsers(waitingList, conflict.item)
    };
  }

  /**
   * Priority-based strategy
   */
  async applyPriorityBasedStrategy(conflict) {
    const { userPriorities } = conflict;
    
    const winner = userPriorities[0]; // Already sorted by priority
    const waitingList = userPriorities.slice(1);
    
    const priorityReasons = this.generatePriorityReasons(winner.priority.factors);
    
    return {
      type: 'priority_based',
      winner: winner.userId,
      waitingList: waitingList.map(u => u.userId),
      reasoning: `Selected based on priority score (${(winner.priority.total * 100).toFixed(0)}%). ${priorityReasons}`,
      alternatives: await this.prepareAlternativesForUsers(waitingList, conflict.item),
      priorityBreakdown: winner.priority.factors
    };
  }

  /**
   * Fairness-optimized strategy
   */
  async applyFairnessOptimizedStrategy(conflict) {
    const { userPriorities } = conflict;
    
    // Apply fairness adjustments
    const fairnessAdjusted = await this.applyFairnessAdjustments(userPriorities);
    
    // Sort by adjusted fairness score
    fairnessAdjusted.sort((a, b) => b.adjustedScore - a.adjustedScore);
    
    const winner = fairnessAdjusted[0];
    const waitingList = fairnessAdjusted.slice(1);
    
    return {
      type: 'fairness_optimized',
      winner: winner.userId,
      waitingList: waitingList.map(u => u.userId),
      reasoning: `Selected using fairness optimization. Considers recent trading history and ensures equal opportunities.`,
      alternatives: await this.prepareAlternativesForUsers(waitingList, conflict.item),
      fairnessFactors: winner.fairnessFactors
    };
  }

  /**
   * Alternative distribution strategy
   */
  async applyAlternativeDistributionStrategy(conflict) {
    const { userPriorities, alternatives } = conflict;
    
    // Try to match each user with their best alternative
    const distributions = [];
    const usedAlternatives = new Set();
    
    for (const userPriority of userPriorities) {
      const userAlternatives = alternatives[userPriority.userId] || [];
      const availableAlternatives = userAlternatives.filter(alt => 
        !usedAlternatives.has(alt.itemId)
      );
      
      if (availableAlternatives.length > 0) {
        const bestAlternative = availableAlternatives[0];
        distributions.push({
          userId: userPriority.userId,
          itemId: bestAlternative.itemId,
          item: bestAlternative,
          matchScore: bestAlternative.semantic_score
        });
        usedAlternatives.add(bestAlternative.itemId);
      }
    }
    
    return {
      type: 'alternative_distribution',
      distributions,
      reasoning: 'Distributed alternative items based on semantic similarity and user preferences.',
      originalItem: conflict.item,
      satisfied: distributions.length,
      total: userPriorities.length
    };
  }

  /**
   * Waiting list strategy
   */
  async applyWaitingListStrategy(conflict) {
    const { itemId, userPriorities } = conflict;
    
    // Add all users to waiting list in priority order
    const waitingListKey = `item_${itemId}`;
    
    if (!this.waitingLists.has(waitingListKey)) {
      this.waitingLists.set(waitingListKey, []);
    }
    
    const waitingList = this.waitingLists.get(waitingListKey);
    
    // Add users maintaining priority order
    for (const userPriority of userPriorities) {
      if (!waitingList.some(w => w.userId === userPriority.userId)) {
        waitingList.push({
          userId: userPriority.userId,
          priority: userPriority.priority.total,
          addedAt: Date.now(),
          notified: false
        });
      }
    }
    
    // Sort waiting list by priority
    waitingList.sort((a, b) => b.priority - a.priority);
    
    // Limit waiting list size
    if (waitingList.length > this.config.maxWaitingListSize) {
      waitingList.splice(this.config.maxWaitingListSize);
    }
    
    this.waitingLists.set(waitingListKey, waitingList);
    
    return {
      type: 'waiting_list',
      waitingList: waitingList.map(w => w.userId),
      position: waitingList.findIndex(w => w.userId === userPriorities[0].userId) + 1,
      reasoning: 'Item is highly contested. All interested users added to waiting list based on priority.',
      estimatedWaitTime: this.estimateWaitTime(waitingList.length)
    };
  }

  /**
   * Find alternative suggestions for users
   */
  async findAlternatives(users, originalItem) {
    const alternatives = {};
    
    for (const user of users) {
      try {
        const userAlternatives = await this.findAlternativesForUser(user, originalItem);
        alternatives[user.userId || user.id] = userAlternatives;
      } catch (error) {
        console.error('Error finding alternatives for user:', user.id, error);
        alternatives[user.userId || user.id] = [];
      }
    }
    
    return alternatives;
  }

  /**
   * Find alternatives for a specific user
   */
  async findAlternativesForUser(user, originalItem) {
    try {
      // Get user's preferences and location
      const userProfile = await this.getUserProfile(user.userId || user.id);
      
      // Search for similar items using semantic matching
      const semanticMatches = await this.findSemanticAlternatives(originalItem, userProfile);
      
      // Search for category-based alternatives
      const categoryMatches = await this.findCategoryAlternatives(originalItem, userProfile);
      
      // Search for value-based alternatives
      const valueMatches = await this.findValueBasedAlternatives(originalItem, userProfile);
      
      // Combine and rank alternatives
      const allAlternatives = [
        ...semanticMatches,
        ...categoryMatches,
        ...valueMatches
      ];
      
      // Remove duplicates and original item
      const uniqueAlternatives = this.removeDuplicateAlternatives(allAlternatives, originalItem.id);
      
      // Rank alternatives by multiple factors
      const rankedAlternatives = this.rankAlternatives(uniqueAlternatives, originalItem, userProfile);
      
      return rankedAlternatives.slice(0, this.config.maxAlternativeSuggestions);

    } catch (error) {
      console.error('Error finding alternatives for user:', error);
      return [];
    }
  }

  /**
   * Find semantic alternatives using the semantic matching service
   */
  async findSemanticAlternatives(originalItem, userProfile) {
    try {
      // Get available items in the user's area
      const availableItems = await this.getAvailableItemsInArea(userProfile);
      
      // Use semantic matching service to find similar items
      const semanticMatches = await semanticMatchingService.findSemanticMatches(
        originalItem,
        availableItems,
        {
          enableCrossCategory: true,
          enableBrandEquivalency: true,
          enableFunctionalMatching: true,
          minSimilarityScore: this.config.semanticSimilarityThreshold
        }
      );
      
      return semanticMatches.map(match => ({
        ...match.item,
        semantic_score: match.semantic_score,
        similarity_reasoning: match.match_reasoning,
        alternative_type: 'semantic'
      }));

    } catch (error) {
      console.error('Error finding semantic alternatives:', error);
      return [];
    }
  }

  /**
   * Find category-based alternatives
   */
  async findCategoryAlternatives(originalItem, userProfile) {
    try {
      const response = await api.post('/api/listings/search', {
        category: originalItem.category,
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        radius: this.config.maxAlternativeDistance,
        exclude_ids: [originalItem.id]
      });
      
      return response.data.map(item => ({
        ...item,
        alternative_type: 'category',
        category_match: true
      }));

    } catch (error) {
      console.error('Error finding category alternatives:', error);
      return [];
    }
  }

  /**
   * Find value-based alternatives
   */
  async findValueBasedAlternatives(originalItem, userProfile) {
    if (!originalItem.estimated_value) return [];
    
    try {
      const valueRange = {
        min: originalItem.estimated_value * (1 - this.config.alternativeValueTolerance),
        max: originalItem.estimated_value * (1 + this.config.alternativeValueTolerance)
      };
      
      const response = await api.post('/api/listings/search', {
        min_value: valueRange.min,
        max_value: valueRange.max,
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        radius: this.config.maxAlternativeDistance,
        exclude_ids: [originalItem.id]
      });
      
      return response.data.map(item => ({
        ...item,
        alternative_type: 'value',
        value_match: true,
        value_difference: Math.abs(item.estimated_value - originalItem.estimated_value)
      }));

    } catch (error) {
      console.error('Error finding value alternatives:', error);
      return [];
    }
  }

  /**
   * Priority calculation helper methods
   */
  async calculateUserHistoryScore(user, item) {
    try {
      const userStats = await this.getUserTradingStats(user.userId || user.id);
      
      let score = 0.5; // Base score
      
      // Trading experience bonus
      if (userStats.totalTrades > 0) {
        score += Math.min(0.3, userStats.totalTrades * 0.02);
      }
      
      // Success rate bonus
      if (userStats.successRate > 0.8) {
        score += 0.15;
      } else if (userStats.successRate > 0.6) {
        score += 0.1;
      }
      
      // Category experience bonus
      const categoryTrades = userStats.categoryBreakdown?.[item.category] || 0;
      if (categoryTrades > 0) {
        score += Math.min(0.1, categoryTrades * 0.01);
      }
      
      // Recent activity bonus
      if (userStats.daysSinceLastTrade <= 7) {
        score += 0.1;
      }
      
      return Math.min(1.0, score);

    } catch (error) {
      console.error('Error calculating user history score:', error);
      return 0.5;
    }
  }

  calculateResponseTimeScore(user, context) {
    if (!context.userResponseTimes || !context.userResponseTimes[user.userId || user.id]) {
      return 0.5; // Default if no timing data
    }
    
    const responseTime = context.userResponseTimes[user.userId || user.id];
    const maxResponseTime = Math.max(...Object.values(context.userResponseTimes));
    
    // Faster response = higher score
    if (maxResponseTime === 0) return 1.0;
    
    return 1.0 - (responseTime / maxResponseTime);
  }

  calculateLocationScore(user, item) {
    if (!user.latitude || !user.longitude || !item.user?.latitude || !item.user?.longitude) {
      return 0.5; // Default if no location data
    }
    
    const distance = this.calculateDistance(
      user.latitude, user.longitude,
      item.user.latitude, item.user.longitude
    );
    
    // Closer = higher score
    if (distance <= 10) return 1.0;
    if (distance <= 25) return 0.8;
    if (distance <= 50) return 0.6;
    if (distance <= 100) return 0.4;
    return 0.2;
  }

  async calculateEngagementScore(user, item) {
    try {
      const interactions = await this.getUserRecentInteractions(user.userId || user.id);
      
      let score = 0.5;
      
      // Recent platform activity
      const recentActivity = interactions.filter(i => 
        Date.now() - new Date(i.timestamp).getTime() < 86400000 // 24 hours
      );
      
      score += Math.min(0.2, recentActivity.length * 0.02);
      
      // Message quality and responsiveness
      const messageInteractions = interactions.filter(i => i.type === 'message_sent');
      if (messageInteractions.length > 0) {
        const avgResponseTime = this.calculateAverageResponseTime(messageInteractions);
        if (avgResponseTime < 3600000) { // 1 hour
          score += 0.15;
        } else if (avgResponseTime < 86400000) { // 24 hours
          score += 0.1;
        }
      }
      
      // Search and browse activity
      const searchActivity = interactions.filter(i => 
        i.type === 'search_performed' || i.type === 'match_viewed'
      );
      score += Math.min(0.15, searchActivity.length * 0.01);
      
      return Math.min(1.0, score);

    } catch (error) {
      console.error('Error calculating engagement score:', error);
      return 0.5;
    }
  }

  async calculateFairnessScore(user) {
    try {
      const fairnessData = await this.getUserFairnessData(user.userId || user.id);
      
      let score = 0.5; // Base fairness score
      
      // New user bonus
      if (fairnessData.isNewUser) {
        score += this.config.newUserBonus;
      }
      
      // Recent success rate penalty (to give others a chance)
      if (fairnessData.recentSuccessRate > 0.8) {
        score -= this.config.recentSuccessRatePenalty;
      } else if (fairnessData.recentSuccessRate < 0.3) {
        score += 0.15; // Boost for users with low recent success
      }
      
      // Loyalty bonus for long-term users
      if (fairnessData.daysSinceRegistration > 365) {
        score += this.config.loyaltyBonus;
      }
      
      // Waiting time bonus
      if (fairnessData.averageWaitingTime > 86400000) { // 1 day
        score += 0.1;
      }
      
      return Math.min(1.0, Math.max(0.0, score));

    } catch (error) {
      console.error('Error calculating fairness score:', error);
      return 0.5;
    }
  }

  async calculateMatchQualityScore(user, item) {
    try {
      // Use the AI matching service to calculate match quality
      const matchData = await aiMatchingService.scoreMatchesWithML(
        [{ item1_details: null, item2_details: item, matched_user: user }],
        { preferences: await this.getUserPreferences(user.userId || user.id) },
        {},
        {}
      );
      
      return matchData[0]?.optimized_score || 0.5;

    } catch (error) {
      console.error('Error calculating match quality score:', error);
      return 0.5;
    }
  }

  async calculatePreferenceAlignment(user, item) {
    try {
      const preferences = await this.getUserPreferences(user.userId || user.id);
      
      let alignment = 0.5;
      
      // Category preference alignment
      if (preferences.preferred_categories?.includes(item.category)) {
        alignment += 0.3;
      } else if (preferences.excluded_categories?.includes(item.category)) {
        alignment -= 0.3;
      }
      
      // Value preference alignment
      if (item.estimated_value && preferences.min_item_value && preferences.max_item_value) {
        if (item.estimated_value >= preferences.min_item_value && 
            item.estimated_value <= preferences.max_item_value) {
          alignment += 0.2;
        }
      }
      
      return Math.min(1.0, Math.max(0.0, alignment));

    } catch (error) {
      console.error('Error calculating preference alignment:', error);
      return 0.5;
    }
  }

  async calculateTradingPatternScore(user) {
    try {
      const pattern = await this.getUserTradingPattern(user.userId || user.id);
      
      let score = 0.5;
      
      // Consistent trading frequency
      if (pattern.tradingFrequency === 'regular') {
        score += 0.2;
      } else if (pattern.tradingFrequency === 'frequent') {
        score += 0.1;
      }
      
      // Successful completion rate
      if (pattern.completionRate > 0.9) {
        score += 0.2;
      } else if (pattern.completionRate > 0.7) {
        score += 0.1;
      }
      
      // Communication quality
      if (pattern.communicationRating > 4.0) {
        score += 0.1;
      }
      
      return Math.min(1.0, score);

    } catch (error) {
      console.error('Error calculating trading pattern score:', error);
      return 0.5;
    }
  }

  /**
   * Utility methods
   */
  generateConflictId(itemId, users) {
    const userIds = users.map(u => u.userId || u.id).sort().join('_');
    return `conflict_${itemId}_${userIds}`;
  }

  analyzeConflictComplexity(users, item) {
    return {
      userCount: users.length,
      itemValue: item.estimated_value || 0,
      complexity: users.length > 3 ? 'high' : users.length > 1 ? 'medium' : 'low'
    };
  }

  selectResolutionStrategy(conflict) {
    const { complexity, userPriorities } = conflict;
    
    // Simple strategy selection logic
    if (complexity.userCount <= 2) {
      return 'priority_based';
    } else if (complexity.userCount <= 4) {
      return 'fairness_optimized';
    } else {
      return 'waiting_list';
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // API and data fetching methods
  async getItemDetails(itemId) {
    try {
      const response = await api.get(`/api/listings/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {};
    }
  }

  async getUserTradingStats(userId) {
    try {
      const response = await api.get(`/analytics/user-stats/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user trading stats:', error);
      return {
        totalTrades: 0,
        successRate: 0.5,
        categoryBreakdown: {},
        daysSinceLastTrade: 999
      };
    }
  }

  async getUserRecentInteractions(userId) {
    try {
      const response = await api.get(`/analytics/recent-interactions/${userId}?limit=100`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user interactions:', error);
      return [];
    }
  }

  async getUserFairnessData(userId) {
    try {
      const response = await api.get(`/analytics/fairness-data/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching fairness data:', error);
      return {
        isNewUser: false,
        recentSuccessRate: 0.5,
        daysSinceRegistration: 30,
        averageWaitingTime: 0
      };
    }
  }

  async getUserPreferences(userId) {
    try {
      const response = await api.get(`/matching/matching-preferences?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  }

  async getUserTradingPattern(userId) {
    try {
      const response = await api.get(`/analytics/trading-pattern/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching trading pattern:', error);
      return {
        tradingFrequency: 'occasional',
        completionRate: 0.5,
        communicationRating: 3.0
      };
    }
  }

  async getAvailableItemsInArea(userProfile) {
    try {
      const response = await api.post('/api/listings/search', {
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
        radius: this.config.maxAlternativeDistance
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching available items:', error);
      return [];
    }
  }

  // Additional helper methods
  generatePriorityReasons(factors) {
    const reasons = [];
    
    if (factors.userHistory > 0.7) reasons.push('strong trading history');
    if (factors.responseTime > 0.8) reasons.push('quick response');
    if (factors.location > 0.7) reasons.push('close location');
    if (factors.engagement > 0.7) reasons.push('high engagement');
    if (factors.fairness > 0.7) reasons.push('fairness consideration');
    
    return reasons.length > 0 ? reasons.join(', ') : 'overall compatibility';
  }

  async applyFairnessAdjustments(userPriorities) {
    return userPriorities.map(up => ({
      ...up,
      adjustedScore: up.priority.total * (0.5 + up.priority.factors.fairness * 0.5),
      fairnessFactors: up.priority.factors.fairness
    }));
  }

  async prepareAlternativesForUsers(waitingList, originalItem) {
    const alternatives = {};
    
    for (const userPriority of waitingList) {
      alternatives[userPriority.userId] = await this.findAlternativesForUser(
        userPriority.user, 
        originalItem
      );
    }
    
    return alternatives;
  }

  removeDuplicateAlternatives(alternatives, originalItemId) {
    const seen = new Set([originalItemId]);
    return alternatives.filter(alt => {
      if (seen.has(alt.id)) return false;
      seen.add(alt.id);
      return true;
    });
  }

  rankAlternatives(alternatives, originalItem, userProfile) {
    return alternatives.sort((a, b) => {
      // Rank by semantic score, location, and user preferences
      const scoreA = (a.semantic_score || 0) * 0.4 + 
                    (a.location_score || 0.5) * 0.3 + 
                    (a.preference_score || 0.5) * 0.3;
      const scoreB = (b.semantic_score || 0) * 0.4 + 
                    (b.location_score || 0.5) * 0.3 + 
                    (b.preference_score || 0.5) * 0.3;
      return scoreB - scoreA;
    });
  }

  calculateAverageResponseTime(messageInteractions) {
    if (messageInteractions.length === 0) return 86400000; // 24 hours default
    
    const responseTimes = messageInteractions.map(interaction => 
      interaction.responseTime || 86400000
    );
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  estimateWaitTime(position) {
    // Simple wait time estimation
    const baseWaitTime = 3600000; // 1 hour
    return baseWaitTime * position;
  }

  async updateExistingConflict(conflictId, newUsers) {
    // Update existing conflict with new interested users
    const conflict = this.activeConflicts.get(conflictId);
    
    // Add new users to the conflict
    const existingUserIds = new Set(conflict.interestedUsers.map(u => u.userId || u.id));
    const newUniqueUsers = newUsers.filter(u => !existingUserIds.has(u.userId || u.id));
    
    if (newUniqueUsers.length > 0) {
      conflict.interestedUsers.push(...newUniqueUsers);
      conflict.userPriorities = await this.calculateUserPriorities(
        conflict.interestedUsers, 
        conflict.item, 
        conflict.context
      );
      conflict.resolutionAttempts++;
    }
    
    return await this.applyResolutionStrategy(conflict);
  }

  async handleResolutionResults(conflict, resolution) {
    // Process and communicate resolution results
    const result = {
      conflictId: conflict.id,
      resolution,
      timestamp: Date.now(),
      affectedUsers: conflict.interestedUsers.map(u => u.userId || u.id)
    };
    
    // Send notifications to affected users
    await this.sendResolutionNotifications(conflict, resolution);
    
    // Update waiting lists if applicable
    if (resolution.type === 'waiting_list') {
      await this.notifyWaitingListUsers(conflict.itemId, resolution.waitingList);
    }
    
    return result;
  }

  async sendResolutionNotifications(conflict, resolution) {
    // Send appropriate notifications to all affected users
    // Implementation would integrate with notification service
  }

  async notifyWaitingListUsers(itemId, waitingList) {
    // Notify users about their waiting list position
    // Implementation would integrate with notification service
  }

  async logConflictResolution(conflict, resolution, result) {
    try {
      await api.post('/analytics/conflict-resolution', {
        conflictId: conflict.id,
        itemId: conflict.itemId,
        userCount: conflict.interestedUsers.length,
        strategy: resolution.strategy,
        resolution: resolution.type,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging conflict resolution:', error);
    }
  }

  /**
   * Initialize conflict resolution background processes
   */
  initializeConflictResolution() {
    // Cleanup old conflicts
    setInterval(() => {
      this.cleanupOldConflicts();
    }, 300000); // 5 minutes
    
    // Process waiting list notifications
    setInterval(() => {
      this.processWaitingListNotifications();
    }, 600000); // 10 minutes
  }

  cleanupOldConflicts() {
    const cutoff = Date.now() - this.config.maxConflictDuration;
    
    for (const [conflictId, conflict] of this.activeConflicts.entries()) {
      if (conflict.createdAt < cutoff) {
        this.activeConflicts.delete(conflictId);
      }
    }
  }

  async processWaitingListNotifications() {
    // Process and send waiting list notifications
    // Implementation would check for available items and notify waiting users
  }
}

// Export singleton instance
export default new ConflictResolutionService();