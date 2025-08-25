/**
 * Real-Time Optimization and Dynamic Re-ranking System
 * 
 * This service implements real-time optimization algorithms that continuously
 * update match rankings based on user interactions, A/B testing, and market trends.
 */

import api from './api';
import aiMatchingService from './aiMatchingService';
import userBehaviorLearning from './userBehaviorLearning';

class RealTimeOptimizationService {
  constructor() {
    this.optimizationQueue = new Map();
    this.abTestGroups = new Map();
    this.marketTrendCache = new Map();
    this.userInteractionBuffer = new Map();
    this.performanceMetrics = new Map();
    this.isOptimizing = false;
    
    // Optimization configuration
    this.config = {
      batchSize: 50,
      optimizationInterval: 30000, // 30 seconds
      abTestSampleSize: 100,
      trendUpdateInterval: 300000, // 5 minutes
      maxQueueSize: 1000,
      
      // Learning rates for different optimization types
      userFeedbackLearningRate: 0.2,
      marketTrendLearningRate: 0.1,
      interactionLearningRate: 0.15,
      temporalDecayRate: 0.95,
      
      // A/B testing configuration
      abTestConfidence: 0.95,
      minTestDuration: 3600000, // 1 hour
      maxTestDuration: 604800000, // 1 week
      
      // Performance thresholds
      minAcceptanceRate: 0.3,
      targetAcceptanceRate: 0.85,
      maxResponseTime: 5000, // 5 seconds
      
      // Real-time weights
      recentInteractionWeight: 0.3,
      trendingItemBoost: 0.2,
      activeUserBoost: 0.15,
      geographicBoost: 0.1
    };
    
    // Initialize optimization processes
    this.initializeOptimization();
  }

  /**
   * Main real-time optimization entry point
   */
  async optimizeMatches(userId, matches, context = {}) {
    try {
      const startTime = Date.now();
      
      // Get user's optimization profile
      const optimizationProfile = await this.getUserOptimizationProfile(userId);
      
      // Apply real-time factors
      const realtimeFactors = await this.calculateRealtimeFactors(userId, context);
      
      // Apply A/B testing variations
      const abTestVariation = this.getABTestVariation(userId);
      
      // Optimize match rankings
      const optimizedMatches = await this.applyOptimizations(
        matches,
        optimizationProfile,
        realtimeFactors,
        abTestVariation
      );
      
      // Track performance metrics
      const processingTime = Date.now() - startTime;
      this.trackOptimizationPerformance(userId, {
        matchCount: matches.length,
        processingTime,
        optimizationProfile,
        abTestVariation
      });
      
      return optimizedMatches;

    } catch (error) {
      console.error('Error in real-time optimization:', error);
      return matches; // Return original matches on error
    }
  }

  /**
   * Apply comprehensive optimization algorithms
   */
  async applyOptimizations(matches, profile, realtimeFactors, abTestVariation) {
    let optimizedMatches = [...matches];
    
    // 1. User behavior-based optimization
    optimizedMatches = await this.applyBehaviorOptimization(optimizedMatches, profile);
    
    // 2. Market trend optimization
    optimizedMatches = await this.applyMarketTrendOptimization(optimizedMatches, realtimeFactors.marketTrends);
    
    // 3. Temporal optimization
    optimizedMatches = await this.applyTemporalOptimization(optimizedMatches, realtimeFactors.timeFactors);
    
    // 4. Geographic optimization
    optimizedMatches = await this.applyGeographicOptimization(optimizedMatches, realtimeFactors.locationFactors);
    
    // 5. Social proof optimization
    optimizedMatches = await this.applySocialProofOptimization(optimizedMatches, realtimeFactors.socialFactors);
    
    // 6. A/B testing variations
    optimizedMatches = await this.applyABTestOptimization(optimizedMatches, abTestVariation);
    
    // 7. Dynamic re-ranking based on recent interactions
    optimizedMatches = await this.applyDynamicReranking(optimizedMatches, profile.userId);
    
    // 8. Diversity optimization to prevent filter bubbles
    optimizedMatches = await this.applyDiversityOptimization(optimizedMatches, profile);
    
    return optimizedMatches;
  }

  /**
   * User behavior-based optimization
   */
  async applyBehaviorOptimization(matches, profile) {
    const behaviorWeights = profile.behaviorWeights || {};
    
    return matches.map(match => {
      let behaviorBoost = 0;
      
      // Category preference boost
      const category = match.item2_details?.category || match.their_listing?.category;
      if (category && behaviorWeights.categories?.[category]) {
        behaviorBoost += behaviorWeights.categories[category] * 0.15;
      }
      
      // Value tolerance optimization
      if (match.value_difference_percentage !== undefined && behaviorWeights.valueTolerance) {
        const valueDiff = Math.abs(match.value_difference_percentage);
        const tolerance = behaviorWeights.valueTolerance;
        
        if (valueDiff <= tolerance.preferred) {
          behaviorBoost += 0.1;
        } else if (valueDiff <= tolerance.max) {
          behaviorBoost += 0.05;
        }
      }
      
      // Distance preference optimization
      if (match.distance_km && behaviorWeights.locationPreference) {
        const distanceScore = this.calculateDistanceScore(match.distance_km, behaviorWeights.locationPreference);
        behaviorBoost += distanceScore * 0.1;
      }
      
      // User type preference optimization
      if (match.matched_user && behaviorWeights.userTypes) {
        const userTypeScore = this.calculateUserTypeScore(match.matched_user, behaviorWeights.userTypes);
        behaviorBoost += userTypeScore * 0.08;
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, (match.optimized_score || match.overall_score || 0.5) + behaviorBoost),
        optimization_factors: {
          ...match.optimization_factors,
          behavior_boost: behaviorBoost
        }
      };
    });
  }

  /**
   * Market trend optimization
   */
  async applyMarketTrendOptimization(matches, marketTrends) {
    if (!marketTrends) return matches;
    
    return matches.map(match => {
      let trendBoost = 0;
      const item = match.item2_details || match.their_listing;
      
      if (!item) return match;
      
      // Category trend boost
      if (marketTrends.categoryTrends?.[item.category]) {
        const categoryTrend = marketTrends.categoryTrends[item.category];
        trendBoost += categoryTrend.popularityScore * this.config.trendingItemBoost;
      }
      
      // Item popularity boost
      if (marketTrends.itemPopularity) {
        const itemKey = this.generateItemKey(item);
        const popularity = marketTrends.itemPopularity[itemKey];
        if (popularity > 0.7) {
          trendBoost += this.config.trendingItemBoost * 0.5;
        }
      }
      
      // Seasonal relevance boost
      if (marketTrends.seasonalItems) {
        const currentMonth = new Date().getMonth();
        const seasonalRelevance = marketTrends.seasonalItems[currentMonth]?.[item.category];
        if (seasonalRelevance > 0.6) {
          trendBoost += seasonalRelevance * 0.1;
        }
      }
      
      // Supply/demand optimization
      if (marketTrends.supplyDemand?.[item.category]) {
        const supplyDemand = marketTrends.supplyDemand[item.category];
        if (supplyDemand.demandRatio > 1.2) { // High demand
          trendBoost += 0.1;
        }
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, (match.optimized_score || match.overall_score || 0.5) + trendBoost),
        optimization_factors: {
          ...match.optimization_factors,
          trend_boost: trendBoost,
          is_trending: trendBoost > 0.1
        }
      };
    });
  }

  /**
   * Temporal optimization based on time patterns
   */
  async applyTemporalOptimization(matches, timeFactors) {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    
    return matches.map(match => {
      let temporalBoost = 0;
      
      // Activity time optimization
      if (timeFactors.userActiveHours?.includes(currentHour)) {
        temporalBoost += this.config.activeUserBoost;
      }
      
      // Optimal trading time boost
      if (timeFactors.optimalTradingHours?.includes(currentHour)) {
        temporalBoost += 0.1;
      }
      
      // Day of week optimization
      if (timeFactors.preferredDays?.includes(currentDay)) {
        temporalBoost += 0.05;
      }
      
      // Recency boost for newly created matches
      if (match.created_at) {
        const age = Date.now() - new Date(match.created_at).getTime();
        const ageHours = age / (1000 * 60 * 60);
        
        if (ageHours < 1) {
          temporalBoost += 0.15; // Fresh match boost
        } else if (ageHours < 24) {
          temporalBoost += 0.1; // Recent match boost
        }
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, (match.optimized_score || match.overall_score || 0.5) + temporalBoost),
        optimization_factors: {
          ...match.optimization_factors,
          temporal_boost: temporalBoost,
          is_fresh: temporalBoost > 0.1
        }
      };
    });
  }

  /**
   * Geographic optimization
   */
  async applyGeographicOptimization(matches, locationFactors) {
    if (!locationFactors) return matches;
    
    return matches.map(match => {
      let geoBoost = 0;
      
      // Local area boost
      if (match.distance_km && match.distance_km <= 10) {
        geoBoost += this.config.geographicBoost;
      }
      
      // User's preferred area boost
      if (locationFactors.preferredAreas && match.matched_user?.location) {
        const isPreferredArea = locationFactors.preferredAreas.some(area => 
          match.matched_user.location.includes(area)
        );
        if (isPreferredArea) {
          geoBoost += 0.08;
        }
      }
      
      // High-activity area boost
      if (locationFactors.highActivityAreas) {
        const userLocation = this.extractLocationArea(match.matched_user?.location);
        if (locationFactors.highActivityAreas.includes(userLocation)) {
          geoBoost += 0.05;
        }
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, (match.optimized_score || match.overall_score || 0.5) + geoBoost),
        optimization_factors: {
          ...match.optimization_factors,
          geo_boost: geoBoost,
          is_local: match.distance_km <= 10
        }
      };
    });
  }

  /**
   * Social proof optimization
   */
  async applySocialProofOptimization(matches, socialFactors) {
    if (!socialFactors) return matches;
    
    return matches.map(match => {
      let socialBoost = 0;
      const matchedUser = match.matched_user;
      
      if (!matchedUser) return match;
      
      // High-rated user boost
      if (matchedUser.rating && matchedUser.rating >= 4.5) {
        socialBoost += 0.1;
      }
      
      // Experienced trader boost
      if (matchedUser.trades_count && matchedUser.trades_count >= 10) {
        socialBoost += 0.08;
      }
      
      // Recently active user boost
      if (matchedUser.last_active) {
        const timeSinceActive = Date.now() - new Date(matchedUser.last_active).getTime();
        if (timeSinceActive < 3600000) { // Active within last hour
          socialBoost += 0.12;
        } else if (timeSinceActive < 86400000) { // Active within last day
          socialBoost += 0.06;
        }
      }
      
      // Verified user boost
      if (matchedUser.is_verified) {
        socialBoost += 0.05;
      }
      
      // Mutual connections boost (if available)
      if (socialFactors.mutualConnections?.[matchedUser.id]) {
        socialBoost += 0.07;
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, (match.optimized_score || match.overall_score || 0.5) + socialBoost),
        optimization_factors: {
          ...match.optimization_factors,
          social_boost: socialBoost,
          high_trust_user: socialBoost > 0.15
        }
      };
    });
  }

  /**
   * A/B testing optimization
   */
  async applyABTestOptimization(matches, abTestVariation) {
    if (!abTestVariation || abTestVariation.type === 'control') {
      return matches; // No modification for control group
    }
    
    switch (abTestVariation.type) {
      case 'semantic_boost':
        return this.applySemanticBoostVariation(matches, abTestVariation.parameters);
        
      case 'location_priority':
        return this.applyLocationPriorityVariation(matches, abTestVariation.parameters);
        
      case 'value_strict':
        return this.applyValueStrictVariation(matches, abTestVariation.parameters);
        
      case 'diversity_enhanced':
        return this.applyDiversityEnhancedVariation(matches, abTestVariation.parameters);
        
      case 'recency_bias':
        return this.applyRecencyBiasVariation(matches, abTestVariation.parameters);
        
      default:
        return matches;
    }
  }

  /**
   * Dynamic re-ranking based on recent interactions
   */
  async applyDynamicReranking(matches, userId) {
    const recentInteractions = await this.getRecentUserInteractions(userId);
    
    if (!recentInteractions || recentInteractions.length === 0) {
      return matches;
    }
    
    return matches.map(match => {
      let rerankingScore = 0;
      const item = match.item2_details || match.their_listing;
      
      if (!item) return match;
      
      // Boost based on recent accepts in similar categories
      const recentAccepts = recentInteractions.filter(
        interaction => interaction.type === 'match_accepted' && 
        interaction.data?.match?.item2_details?.category === item.category
      );
      
      if (recentAccepts.length > 0) {
        rerankingScore += Math.min(0.2, recentAccepts.length * 0.05);
      }
      
      // Penalize based on recent declines
      const recentDeclines = recentInteractions.filter(
        interaction => interaction.type === 'match_declined' && 
        interaction.data?.match?.item2_details?.category === item.category
      );
      
      if (recentDeclines.length > 0) {
        rerankingScore -= Math.min(0.15, recentDeclines.length * 0.03);
      }
      
      // Boost based on recent searches
      const recentSearches = recentInteractions.filter(
        interaction => interaction.type === 'search_performed' && 
        interaction.data?.query?.toLowerCase().includes(item.category.toLowerCase())
      );
      
      if (recentSearches.length > 0) {
        rerankingScore += 0.1;
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, Math.max(0.0, 
          (match.optimized_score || match.overall_score || 0.5) + rerankingScore
        )),
        optimization_factors: {
          ...match.optimization_factors,
          dynamic_reranking: rerankingScore,
          interaction_influenced: Math.abs(rerankingScore) > 0.05
        }
      };
    });
  }

  /**
   * Diversity optimization to prevent filter bubbles
   */
  async applyDiversityOptimization(matches, profile) {
    // Ensure category diversity in top matches
    const topMatches = matches.slice(0, 10);
    const categories = new Set();
    const diversifiedMatches = [];
    
    // First pass: Add top matches ensuring category diversity
    for (const match of topMatches) {
      const category = match.item2_details?.category || match.their_listing?.category;
      
      if (!category || categories.size < 5 || categories.has(category)) {
        diversifiedMatches.push(match);
        if (category) categories.add(category);
      }
    }
    
    // Second pass: Fill remaining slots with best remaining matches
    const remainingMatches = matches.slice(10);
    diversifiedMatches.push(...remainingMatches);
    
    // Apply diversity boost to promote exploration
    return diversifiedMatches.map((match, index) => {
      let diversityBoost = 0;
      
      // Boost for exploring new categories
      const category = match.item2_details?.category || match.their_listing?.category;
      if (category && !profile.frequentCategories?.includes(category)) {
        diversityBoost += 0.05;
      }
      
      // Boost for different value ranges
      const value = match.item2_details?.estimated_value || match.their_listing?.estimated_value;
      if (value && this.isNewValueRange(value, profile.typicalValueRanges)) {
        diversityBoost += 0.03;
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, (match.optimized_score || match.overall_score || 0.5) + diversityBoost),
        optimization_factors: {
          ...match.optimization_factors,
          diversity_boost: diversityBoost,
          exploration_candidate: diversityBoost > 0.03
        }
      };
    });
  }

  /**
   * Get user's optimization profile
   */
  async getUserOptimizationProfile(userId) {
    try {
      const cacheKey = `optimization_profile_${userId}`;
      
      if (this.performanceMetrics.has(cacheKey)) {
        const cached = this.performanceMetrics.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return cached.data;
        }
      }
      
      const response = await api.get(`/analytics/optimization-profile/${userId}`);
      const profile = response.data;
      
      this.performanceMetrics.set(cacheKey, {
        data: profile,
        timestamp: Date.now()
      });
      
      return profile;
      
    } catch (error) {
      console.error('Error fetching optimization profile:', error);
      return { userId, behaviorWeights: {} };
    }
  }

  /**
   * Calculate real-time factors affecting optimization
   */
  async calculateRealtimeFactors(userId, context) {
    const factors = {
      marketTrends: await this.getCurrentMarketTrends(),
      timeFactors: await this.getTimeFactors(userId),
      locationFactors: await this.getLocationFactors(userId),
      socialFactors: await this.getSocialFactors(userId),
      contextualFactors: this.processContextualFactors(context)
    };
    
    return factors;
  }

  /**
   * A/B testing methods
   */
  getABTestVariation(userId) {
    // Simple hash-based A/B testing assignment
    const hash = this.hashUserId(userId);
    const testGroup = hash % 100;
    
    if (testGroup < 20) {
      return { type: 'control', parameters: {} };
    } else if (testGroup < 35) {
      return { type: 'semantic_boost', parameters: { boostFactor: 0.2 } };
    } else if (testGroup < 50) {
      return { type: 'location_priority', parameters: { maxDistance: 25 } };
    } else if (testGroup < 65) {
      return { type: 'value_strict', parameters: { maxDifference: 15 } };
    } else if (testGroup < 80) {
      return { type: 'diversity_enhanced', parameters: { diversityWeight: 0.3 } };
    } else {
      return { type: 'recency_bias', parameters: { recencyWeight: 0.25 } };
    }
  }

  /**
   * A/B test variation implementations
   */
  applySemanticBoostVariation(matches, parameters) {
    return matches.map(match => ({
      ...match,
      optimized_score: Math.min(1.0, 
        (match.optimized_score || match.overall_score || 0.5) + 
        (match.semantic_score || 0) * parameters.boostFactor
      )
    }));
  }

  applyLocationPriorityVariation(matches, parameters) {
    return matches.map(match => {
      let locationBoost = 0;
      if (match.distance_km && match.distance_km <= parameters.maxDistance) {
        locationBoost = 0.3 - (match.distance_km / parameters.maxDistance) * 0.3;
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, 
          (match.optimized_score || match.overall_score || 0.5) + locationBoost
        )
      };
    });
  }

  applyValueStrictVariation(matches, parameters) {
    return matches.filter(match => 
      !match.value_difference_percentage || 
      Math.abs(match.value_difference_percentage) <= parameters.maxDifference
    );
  }

  applyDiversityEnhancedVariation(matches, parameters) {
    // Enhanced diversity algorithm
    return matches; // Simplified for now
  }

  applyRecencyBiasVariation(matches, parameters) {
    return matches.map(match => {
      let recencyBoost = 0;
      if (match.created_at) {
        const age = Date.now() - new Date(match.created_at).getTime();
        const ageHours = age / (1000 * 60 * 60);
        recencyBoost = Math.max(0, (24 - ageHours) / 24) * parameters.recencyWeight;
      }
      
      return {
        ...match,
        optimized_score: Math.min(1.0, 
          (match.optimized_score || match.overall_score || 0.5) + recencyBoost
        )
      };
    });
  }

  /**
   * Performance tracking and metrics
   */
  trackOptimizationPerformance(userId, metrics) {
    const timestamp = Date.now();
    const key = `${userId}_${timestamp}`;
    
    this.performanceMetrics.set(key, {
      ...metrics,
      timestamp
    });
    
    // Clean up old metrics
    this.cleanupOldMetrics();
  }

  /**
   * Utility methods
   */
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  generateItemKey(item) {
    const title = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const category = (item.category || '').toLowerCase();
    return `${category}_${title.substring(0, 20)}`;
  }

  calculateDistanceScore(distance, locationPreference) {
    const maxDistance = locationPreference.maxDistance || 50;
    return Math.max(0, 1 - (distance / maxDistance));
  }

  calculateUserTypeScore(user, userTypeWeights) {
    let score = 0.5;
    
    if (user.rating && userTypeWeights.ratingRanges) {
      const ratingRange = this.getRatingRange(user.rating);
      score += (userTypeWeights.ratingRanges[ratingRange] - 0.5) * 0.3;
    }
    
    if (user.trades_count !== undefined && userTypeWeights.experienceLevels) {
      const experienceLevel = this.getExperienceLevel(user.trades_count);
      score += (userTypeWeights.experienceLevels[experienceLevel] - 0.5) * 0.2;
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  getRatingRange(rating) {
    if (rating >= 4.5) return 'excellent';
    if (rating >= 4.0) return 'very_good';
    if (rating >= 3.5) return 'good';
    if (rating >= 3.0) return 'fair';
    return 'poor';
  }

  getExperienceLevel(tradesCount) {
    if (tradesCount === 0) return 'new';
    if (tradesCount <= 5) return 'beginner';
    if (tradesCount <= 20) return 'intermediate';
    if (tradesCount <= 50) return 'experienced';
    return 'expert';
  }

  extractLocationArea(location) {
    if (!location) return '';
    // Extract city/area from location string
    return location.split(',')[0].trim();
  }

  isNewValueRange(value, typicalRanges = []) {
    if (!typicalRanges.length) return true;
    
    return !typicalRanges.some(range => 
      value >= range.min && value <= range.max
    );
  }

  cleanupOldMetrics() {
    const cutoff = Date.now() - 86400000; // 24 hours
    for (const [key, metric] of this.performanceMetrics.entries()) {
      if (metric.timestamp < cutoff) {
        this.performanceMetrics.delete(key);
      }
    }
  }

  // Async data fetching methods
  async getCurrentMarketTrends() {
    // Implementation would fetch from market trends service
    return {};
  }

  async getTimeFactors(userId) {
    // Implementation would analyze user's time patterns
    return {};
  }

  async getLocationFactors(userId) {
    // Implementation would analyze location preferences
    return {};
  }

  async getSocialFactors(userId) {
    // Implementation would get social proof data
    return {};
  }

  async getRecentUserInteractions(userId) {
    try {
      const response = await api.get(`/analytics/recent-interactions/${userId}?limit=50`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent interactions:', error);
      return [];
    }
  }

  processContextualFactors(context) {
    // Process search context, current page, etc.
    return context || {};
  }

  /**
   * Initialize optimization background processes
   */
  initializeOptimization() {
    // Start background optimization processes
    setInterval(() => {
      this.processOptimizationQueue();
    }, this.config.optimizationInterval);
    
    setInterval(() => {
      this.updateMarketTrendCache();
    }, this.config.trendUpdateInterval);
    
    // Cleanup old cache entries
    setInterval(() => {
      this.cleanupCaches();
    }, 600000); // 10 minutes
  }

  async processOptimizationQueue() {
    if (this.isOptimizing || this.optimizationQueue.size === 0) {
      return;
    }
    
    this.isOptimizing = true;
    
    try {
      // Process queued optimization requests
      const batch = Array.from(this.optimizationQueue.entries()).slice(0, this.config.batchSize);
      
      for (const [userId, request] of batch) {
        await this.processOptimizationRequest(userId, request);
        this.optimizationQueue.delete(userId);
      }
    } catch (error) {
      console.error('Error processing optimization queue:', error);
    } finally {
      this.isOptimizing = false;
    }
  }

  async processOptimizationRequest(userId, request) {
    // Process individual optimization request
  }

  async updateMarketTrendCache() {
    // Update market trend cache
  }

  cleanupCaches() {
    const cutoff = Date.now() - this.config.trendUpdateInterval;
    
    for (const [key, cached] of this.marketTrendCache.entries()) {
      if (cached.timestamp < cutoff) {
        this.marketTrendCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export default new RealTimeOptimizationService();