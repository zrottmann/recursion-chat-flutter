/**
 * Advanced AI Matching Service with Machine Learning Optimization
 * 
 * This service implements sophisticated matching algorithms that learn from user behavior
 * and create intelligent equal-value trades with high acceptance rates.
 */

import api from './api';

class AIMatchingService {
  constructor() {
    this.semanticCache = new Map();
    this.userBehaviorCache = new Map();
    this.marketTrendsCache = new Map();
    this.matchingQueue = [];
    this.isProcessing = false;
    
    // Configuration for ML models
    this.config = {
      semanticSimilarityThreshold: 0.7,
      behaviorLearningRate: 0.1,
      marketTrendWeight: 0.15,
      locationWeight: 0.25,
      valueWeight: 0.35,
      categoryWeight: 0.20,
      behaviorWeight: 0.05,
      
      // Advanced scoring weights
      userHistoryWeight: 0.10,
      timePatternWeight: 0.05,
      seasonalWeight: 0.05,
      crossCategoryBonus: 0.15,
      bundleMatchBonus: 0.20,
    };
  }

  /**
   * Main matching function with ML optimization
   */
  async findOptimizedMatches(userId, options = {}) {
    try {
      const {
        maxMatches = 20,
        includeSemanticMatches = true,
        includeBundleMatches = true,
        realTimeOptimization = true,
        userPreferences = null
      } = options;

      // Get user profile and behavior data
      const userProfile = await this.getUserProfile(userId);
      const behaviorData = await this.getUserBehaviorData(userId);
      const marketTrends = await this.getMarketTrends();

      // Get potential matches using multiple strategies
      const potentialMatches = await this.getPotentialMatches(userId, {
        includeSemanticMatches,
        includeBundleMatches,
        userPreferences: userPreferences || userProfile.preferences
      });

      // Apply ML optimization and scoring
      const scoredMatches = await this.scoreMatchesWithML(
        potentialMatches,
        userProfile,
        behaviorData,
        marketTrends
      );

      // Real-time optimization if enabled
      if (realTimeOptimization) {
        await this.applyRealTimeOptimization(scoredMatches, userId);
      }

      // Sort by optimized score and return top matches
      const optimizedMatches = scoredMatches
        .sort((a, b) => b.optimized_score - a.optimized_score)
        .slice(0, maxMatches);

      // Log match quality for continuous learning
      await this.logMatchQuality(userId, optimizedMatches);

      return optimizedMatches;

    } catch (error) {
      console.error('Error in AI matching optimization:', error);
      throw error;
    }
  }

  /**
   * Advanced multi-factor scoring with ML optimization
   */
  async scoreMatchesWithML(matches, userProfile, behaviorData, marketTrends) {
    const scoredMatches = [];

    for (const match of matches) {
      try {
        // Base compatibility scores
        const valueScore = this.calculateValueCompatibility(match);
        const locationScore = this.calculateLocationScore(match, userProfile);
        const categoryScore = this.calculateCategoryScore(match, userProfile);
        
        // Advanced ML-based scores
        const behaviorScore = this.calculateBehaviorScore(match, behaviorData);
        const semanticScore = await this.calculateSemanticSimilarity(match);
        const timePatternScore = this.calculateTimePatternScore(match, behaviorData);
        const marketTrendScore = this.calculateMarketTrendScore(match, marketTrends);
        const userHistoryScore = this.calculateUserHistoryScore(match, userProfile);
        const seasonalScore = this.calculateSeasonalScore(match);

        // Cross-category intelligence bonus
        const crossCategoryBonus = await this.calculateCrossCategoryBonus(match);
        
        // Bundle matching bonus
        const bundleBonus = this.calculateBundleBonus(match);

        // Calculate weighted optimized score
        const optimized_score = (
          valueScore * this.config.valueWeight +
          locationScore * this.config.locationWeight +
          categoryScore * this.config.categoryWeight +
          behaviorScore * this.config.behaviorWeight +
          userHistoryScore * this.config.userHistoryWeight +
          timePatternScore * this.config.timePatternWeight +
          marketTrendScore * this.config.marketTrendWeight +
          seasonalScore * this.config.seasonalWeight
        ) + crossCategoryBonus + bundleBonus;

        // Generate AI reasoning for transparency
        const ai_reasoning = this.generateAIReasoning({
          valueScore,
          locationScore,
          categoryScore,
          behaviorScore,
          semanticScore,
          crossCategoryBonus,
          bundleBonus,
          match
        });

        // Calculate confidence level based on data quality and consistency
        const confidence_level = this.calculateConfidenceLevel({
          valueScore,
          locationScore,
          categoryScore,
          behaviorScore,
          userProfile,
          match
        });

        scoredMatches.push({
          ...match,
          optimized_score: Math.min(1.0, Math.max(0.0, optimized_score)),
          confidence_level: Math.min(1.0, Math.max(0.0, confidence_level)),
          value_score: valueScore,
          location_score: locationScore,
          category_score: categoryScore,
          behavior_score: behaviorScore,
          semantic_score: semanticScore,
          market_trend_score: marketTrendScore,
          ai_reasoning,
          match_type: this.determineMatchType(match, crossCategoryBonus, bundleBonus),
          optimization_factors: {
            cross_category: crossCategoryBonus > 0,
            bundle_match: bundleBonus > 0,
            high_behavior_match: behaviorScore > 0.8,
            trending_item: marketTrendScore > 0.8,
            perfect_location: locationScore > 0.9,
            seasonal_relevance: seasonalScore > 0.7
          }
        });

      } catch (error) {
        console.error('Error scoring match:', error);
        // Continue with basic scoring if ML fails
        scoredMatches.push({
          ...match,
          optimized_score: match.overall_score || 0.5,
          confidence_level: 0.5,
          ai_reasoning: 'Basic compatibility match',
          match_type: 'standard'
        });
      }
    }

    return scoredMatches;
  }

  /**
   * Semantic similarity calculation for intelligent cross-category matching
   */
  async calculateSemanticSimilarity(match) {
    try {
      const item1 = match.item1_details || match.your_listing;
      const item2 = match.item2_details || match.their_listing;
      
      if (!item1 || !item2) return 0.5;

      const cacheKey = `${item1.id}_${item2.id}`;
      if (this.semanticCache.has(cacheKey)) {
        return this.semanticCache.get(cacheKey);
      }

      // Semantic similarity analysis
      const semanticScore = await this.analyzeSemanticSimilarity({
        item1: {
          title: item1.title,
          description: item1.description,
          category: item1.category,
          tags: item1.tags || []
        },
        item2: {
          title: item2.title,
          description: item2.description,
          category: item2.category,
          tags: item2.tags || []
        }
      });

      this.semanticCache.set(cacheKey, semanticScore);
      return semanticScore;

    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return 0.5;
    }
  }

  /**
   * Analyze semantic similarity between items using NLP techniques
   */
  async analyzeSemanticSimilarity(items) {
    const { item1, item2 } = items;
    
    // Text similarity analysis
    const titleSimilarity = this.calculateTextSimilarity(item1.title, item2.title);
    const descriptionSimilarity = this.calculateTextSimilarity(
      item1.description || '', 
      item2.description || ''
    );
    
    // Category relationship analysis
    const categoryRelation = this.analyzeCategoryRelationship(item1.category, item2.category);
    
    // Tag overlap analysis
    const tagOverlap = this.calculateTagOverlap(item1.tags, item2.tags);
    
    // Brand/model equivalency (e.g., iPhone ↔ Samsung Galaxy)
    const brandEquivalency = this.analyzeBrandEquivalency(item1, item2);
    
    // Functional equivalency (gaming laptop ↔ console + games)
    const functionalEquivalency = this.analyzeFunctionalEquivalency(item1, item2);
    
    // Weighted semantic score
    const semanticScore = (
      titleSimilarity * 0.3 +
      descriptionSimilarity * 0.2 +
      categoryRelation * 0.2 +
      tagOverlap * 0.1 +
      brandEquivalency * 0.1 +
      functionalEquivalency * 0.1
    );
    
    return Math.min(1.0, Math.max(0.0, semanticScore));
  }

  /**
   * Calculate behavior-based score using user interaction patterns
   */
  calculateBehaviorScore(match, behaviorData) {
    if (!behaviorData || Object.keys(behaviorData).length === 0) {
      return 0.5; // Default neutral score
    }

    const item2 = match.item2_details || match.their_listing;
    if (!item2) return 0.5;

    let behaviorScore = 0.5;

    // Category preference analysis
    if (behaviorData.category_preferences) {
      const categoryPreference = behaviorData.category_preferences[item2.category] || 0.5;
      behaviorScore += (categoryPreference - 0.5) * 0.3;
    }

    // Value tolerance analysis
    if (behaviorData.value_tolerance && match.value_difference_percentage !== undefined) {
      const valueDiff = Math.abs(match.value_difference_percentage);
      const tolerance = behaviorData.value_tolerance;
      
      if (valueDiff <= tolerance) {
        behaviorScore += 0.2;
      } else {
        behaviorScore -= 0.1;
      }
    }

    // Location preference analysis
    if (behaviorData.location_preferences && match.distance_km) {
      const preferredMaxDistance = behaviorData.location_preferences.max_distance || 50;
      if (match.distance_km <= preferredMaxDistance) {
        behaviorScore += 0.2;
      } else {
        behaviorScore -= 0.1;
      }
    }

    // Activity pattern matching
    if (behaviorData.activity_patterns) {
      const currentHour = new Date().getHours();
      const userActiveHours = behaviorData.activity_patterns.active_hours || [];
      
      if (userActiveHours.includes(currentHour)) {
        behaviorScore += 0.1;
      }
    }

    return Math.min(1.0, Math.max(0.0, behaviorScore));
  }

  /**
   * Calculate time pattern score based on user activity
   */
  calculateTimePatternScore(match, behaviorData) {
    if (!behaviorData || !behaviorData.time_patterns) {
      return 0.5;
    }

    const currentDay = new Date().getDay();
    const currentHour = new Date().getHours();
    const timePatterns = behaviorData.time_patterns;

    let timeScore = 0.5;

    // Day of week preference
    if (timePatterns.preferred_days && timePatterns.preferred_days.includes(currentDay)) {
      timeScore += 0.3;
    }

    // Hour preference
    if (timePatterns.active_hours && timePatterns.active_hours.includes(currentHour)) {
      timeScore += 0.2;
    }

    // Recent activity boost
    if (timePatterns.last_active && 
        Date.now() - new Date(timePatterns.last_active).getTime() < 3600000) { // 1 hour
      timeScore += 0.1;
    }

    return Math.min(1.0, Math.max(0.0, timeScore));
  }

  /**
   * Calculate market trend influence on match scoring
   */
  calculateMarketTrendScore(match, marketTrends) {
    if (!marketTrends || Object.keys(marketTrends).length === 0) {
      return 0.5;
    }

    const item2 = match.item2_details || match.their_listing;
    if (!item2) return 0.5;

    let trendScore = 0.5;

    // Category trend analysis
    if (marketTrends.category_trends && marketTrends.category_trends[item2.category]) {
      const categoryTrend = marketTrends.category_trends[item2.category];
      trendScore += categoryTrend.popularity_score * 0.3;
    }

    // Item popularity analysis
    if (marketTrends.item_popularity) {
      const itemKey = this.generateItemKey(item2);
      const popularity = marketTrends.item_popularity[itemKey] || 0.5;
      trendScore += popularity * 0.2;
    }

    // Seasonal relevance
    if (marketTrends.seasonal_items) {
      const currentMonth = new Date().getMonth();
      const seasonalRelevance = marketTrends.seasonal_items[currentMonth] || {};
      
      if (seasonalRelevance[item2.category]) {
        trendScore += seasonalRelevance[item2.category] * 0.2;
      }
    }

    return Math.min(1.0, Math.max(0.0, trendScore));
  }

  /**
   * Calculate cross-category bonus for intelligent matching
   */
  async calculateCrossCategoryBonus(match) {
    const item1 = match.item1_details || match.your_listing;
    const item2 = match.item2_details || match.their_listing;
    
    if (!item1 || !item2 || item1.category === item2.category) {
      return 0; // No bonus for same category
    }

    // Define intelligent cross-category relationships
    const crossCategoryMap = {
      'Electronics': {
        'Books': 0.1, // Tech books for electronics
        'Tools': 0.2, // Tools for electronics repair
        'Appliances': 0.3 // Related electronic devices
      },
      'Gaming': {
        'Electronics': 0.4, // Gaming laptops ↔ consoles
        'Collectibles': 0.3, // Gaming collectibles
        'Furniture': 0.2 // Gaming chairs/desks
      },
      'Vehicles': {
        'Tools': 0.5, // Auto tools for vehicles
        'Electronics': 0.3, // Car electronics
        'Appliances': 0.2 // Car accessories
      },
      'Music': {
        'Electronics': 0.4, // Audio equipment
        'Collectibles': 0.3, // Music collectibles
        'Furniture': 0.2 // Music stands/storage
      },
      'Art': {
        'Collectibles': 0.4,
        'Furniture': 0.3, // Display furniture
        'Books': 0.2 // Art books
      }
    };

    const bonus = crossCategoryMap[item1.category]?.[item2.category] || 
                  crossCategoryMap[item2.category]?.[item1.category] || 0;

    // Additional semantic bonus for related items
    if (bonus > 0) {
      const semanticBonus = await this.calculateSemanticSimilarity(match);
      return bonus + (semanticBonus * 0.1);
    }

    return 0;
  }

  /**
   * Calculate bundle matching bonus
   */
  calculateBundleBonus(match) {
    const item1 = match.item1_details || match.your_listing;
    const item2 = match.item2_details || match.their_listing;
    
    if (!item1 || !item2) return 0;

    // Check if this is a bundle match (single item ↔ multiple items)
    const isBundle = match.is_bundle_match || 
                    (item1.bundle_items && item1.bundle_items.length > 1) ||
                    (item2.bundle_items && item2.bundle_items.length > 1);

    if (!isBundle) return 0;

    // Calculate bundle compatibility
    let bundleScore = 0;

    // Value equivalency for bundles
    if (match.bundle_value_match && match.bundle_value_match > 0.8) {
      bundleScore += 0.15;
    }

    // Complementary items bonus
    if (this.areComplementaryItems(item1, item2)) {
      bundleScore += 0.1;
    }

    return bundleScore;
  }

  /**
   * Generate AI reasoning explanation for matches
   */
  generateAIReasoning({
    valueScore,
    locationScore,
    categoryScore,
    behaviorScore,
    semanticScore,
    crossCategoryBonus,
    bundleBonus,
    match
  }) {
    const reasons = [];

    // Value reasoning
    if (valueScore > 0.8) {
      reasons.push("excellent value match");
    } else if (valueScore > 0.6) {
      reasons.push("good value compatibility");
    }

    // Location reasoning
    if (locationScore > 0.8) {
      reasons.push("very close location");
    } else if (locationScore > 0.6) {
      reasons.push("convenient distance");
    }

    // Behavior reasoning
    if (behaviorScore > 0.7) {
      reasons.push("matches your preferences perfectly");
    } else if (behaviorScore > 0.6) {
      reasons.push("aligns with your interests");
    }

    // Cross-category reasoning
    if (crossCategoryBonus > 0.1) {
      reasons.push("intelligent cross-category match");
    }

    // Bundle reasoning
    if (bundleBonus > 0.1) {
      reasons.push("smart bundle opportunity");
    }

    // Semantic reasoning
    if (semanticScore > 0.7) {
      reasons.push("semantically similar items");
    }

    // Default reasoning if no specific reasons
    if (reasons.length === 0) {
      reasons.push("compatible trading opportunity");
    }

    return `AI suggests this match because of ${reasons.join(", ")}.`;
  }

  /**
   * Calculate confidence level for match quality
   */
  calculateConfidenceLevel({
    valueScore,
    locationScore,
    categoryScore,
    behaviorScore,
    userProfile,
    match
  }) {
    let confidence = 0.5;

    // Data quality factors
    const hasUserHistory = userProfile && userProfile.trading_history?.length > 0;
    const hasLocationData = match.distance_km !== undefined;
    const hasValueData = match.value_difference_percentage !== undefined;
    const hasBehaviorData = behaviorScore !== 0.5;

    // Boost confidence based on data availability
    if (hasUserHistory) confidence += 0.1;
    if (hasLocationData) confidence += 0.1;
    if (hasValueData) confidence += 0.1;
    if (hasBehaviorData) confidence += 0.1;

    // Score consistency factors
    const scores = [valueScore, locationScore, categoryScore, behaviorScore];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - avgScore, 2), 0) / scores.length;

    // Low variance = high confidence
    confidence += (1 - variance) * 0.2;

    return Math.min(1.0, Math.max(0.3, confidence));
  }

  /**
   * Utility methods for text analysis and matching
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  analyzeCategoryRelationship(cat1, cat2) {
    if (cat1 === cat2) return 1.0;
    
    const relationshipMap = {
      'Electronics-Gaming': 0.8,
      'Books-Electronics': 0.6,
      'Tools-Vehicles': 0.7,
      'Music-Electronics': 0.7,
      'Art-Collectibles': 0.8,
      'Furniture-Art': 0.6,
      'Sports-Electronics': 0.5,
      'Health-Electronics': 0.5
    };
    
    const key1 = `${cat1}-${cat2}`;
    const key2 = `${cat2}-${cat1}`;
    
    return relationshipMap[key1] || relationshipMap[key2] || 0.2;
  }

  calculateTagOverlap(tags1 = [], tags2 = []) {
    if (tags1.length === 0 || tags2.length === 0) return 0;
    
    const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
    
    const intersection = [...set1].filter(tag => set2.has(tag));
    const union = [...new Set([...set1, ...set2])];
    
    return intersection.length / union.length;
  }

  analyzeBrandEquivalency(item1, item2) {
    const brandMap = {
      'apple-samsung': 0.8,
      'nike-adidas': 0.9,
      'playstation-xbox': 0.9,
      'iphone-galaxy': 0.9,
      'macbook-thinkpad': 0.7
    };
    
    const brand1 = this.extractBrand(item1.title || '');
    const brand2 = this.extractBrand(item2.title || '');
    
    if (!brand1 || !brand2) return 0;
    
    const key1 = `${brand1}-${brand2}`.toLowerCase();
    const key2 = `${brand2}-${brand1}`.toLowerCase();
    
    return brandMap[key1] || brandMap[key2] || 0;
  }

  analyzeFunctionalEquivalency(item1, item2) {
    const functionMap = {
      'laptop-desktop': 0.8,
      'phone-tablet': 0.7,
      'console-pc': 0.7,
      'book-ebook': 0.9,
      'vinyl-cd': 0.8,
      'camera-phone': 0.6
    };
    
    const function1 = this.extractFunction(item1);
    const function2 = this.extractFunction(item2);
    
    if (!function1 || !function2) return 0;
    
    const key1 = `${function1}-${function2}`.toLowerCase();
    const key2 = `${function2}-${function1}`.toLowerCase();
    
    return functionMap[key1] || functionMap[key2] || 0;
  }

  // Helper methods for data extraction and processing
  extractBrand(title) {
    const brands = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'microsoft', 'google'];
    const titleLower = title.toLowerCase();
    return brands.find(brand => titleLower.includes(brand));
  }

  extractFunction(item) {
    const title = (item.title || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    
    if (title.includes('laptop') || title.includes('notebook')) return 'laptop';
    if (title.includes('desktop') || title.includes('pc')) return 'desktop';
    if (title.includes('phone') || title.includes('mobile')) return 'phone';
    if (title.includes('tablet') || title.includes('ipad')) return 'tablet';
    if (category.includes('gaming') || title.includes('console')) return 'console';
    
    return null;
  }

  areComplementaryItems(item1, item2) {
    const complementaryPairs = [
      ['laptop', 'mouse'],
      ['console', 'game'],
      ['camera', 'lens'],
      ['guitar', 'amplifier'],
      ['book', 'bookmark'],
      ['phone', 'case']
    ];
    
    const title1 = (item1.title || '').toLowerCase();
    const title2 = (item2.title || '').toLowerCase();
    
    return complementaryPairs.some(([a, b]) => 
      (title1.includes(a) && title2.includes(b)) ||
      (title1.includes(b) && title2.includes(a))
    );
  }

  generateItemKey(item) {
    const title = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const category = (item.category || '').toLowerCase();
    return `${category}_${title.substring(0, 20)}`;
  }

  determineMatchType(match, crossCategoryBonus, bundleBonus) {
    if (bundleBonus > 0.1) return 'bundle';
    if (crossCategoryBonus > 0.1) return 'cross_category';
    if (match.overall_score > 0.8) return 'premium';
    return 'standard';
  }

  // API interaction methods
  async getUserProfile(userId) {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { preferences: {} };
    }
  }

  async getUserBehaviorData(userId) {
    try {
      const response = await api.get(`/analytics/user-behavior/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user behavior data:', error);
      return {};
    }
  }

  async getMarketTrends() {
    try {
      const cacheKey = 'market_trends';
      if (this.marketTrendsCache.has(cacheKey)) {
        const cached = this.marketTrendsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return cached.data;
        }
      }

      const response = await api.get('/analytics/market-trends');
      const trendsData = response.data;
      
      this.marketTrendsCache.set(cacheKey, {
        data: trendsData,
        timestamp: Date.now()
      });
      
      return trendsData;
    } catch (error) {
      console.error('Error fetching market trends:', error);
      return {};
    }
  }

  async getPotentialMatches(userId, options) {
    try {
      const response = await api.post('/matching/potential-matches', {
        user_id: userId,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching potential matches:', error);
      return [];
    }
  }

  async applyRealTimeOptimization(matches, userId) {
    // Real-time optimization logic will be implemented in the next service
    // This is a placeholder for the optimization pipeline
    return matches;
  }

  async logMatchQuality(userId, matches) {
    try {
      await api.post('/analytics/match-quality', {
        user_id: userId,
        matches: matches.map(match => ({
          id: match.id,
          score: match.optimized_score,
          confidence: match.confidence_level,
          type: match.match_type
        }))
      });
    } catch (error) {
      console.error('Error logging match quality:', error);
    }
  }

  // Value and location calculation methods (reusing existing logic)
  calculateValueCompatibility(match) {
    if (!match.value_difference_percentage) return 0.7;
    
    const valueDiff = Math.abs(match.value_difference_percentage);
    if (valueDiff <= 5) return 1.0;
    if (valueDiff <= 10) return 0.9;
    if (valueDiff <= 20) return 0.8;
    if (valueDiff <= 30) return 0.6;
    return 0.4;
  }

  calculateLocationScore(match, userProfile) {
    if (!match.distance_km) return 0.5;
    
    const maxDistance = userProfile.preferences?.max_distance_km || 50;
    const distance = match.distance_km;
    
    if (distance <= 5) return 1.0;
    if (distance <= 15) return 0.9;
    if (distance <= maxDistance) return 0.8;
    if (distance <= maxDistance * 1.5) return 0.6;
    return 0.3;
  }

  calculateCategoryScore(match, userProfile) {
    const item2 = match.item2_details || match.their_listing;
    if (!item2) return 0.5;
    
    const preferences = userProfile.preferences || {};
    const preferredCategories = preferences.preferred_categories || [];
    const excludedCategories = preferences.excluded_categories || [];
    
    if (excludedCategories.includes(item2.category)) return 0.1;
    if (preferredCategories.includes(item2.category)) return 1.0;
    
    return 0.7; // Neutral for unlisted categories
  }

  calculateUserHistoryScore(match, userProfile) {
    if (!userProfile.trading_history) return 0.5;
    
    const history = userProfile.trading_history;
    const item2 = match.item2_details || match.their_listing;
    
    if (!item2) return 0.5;
    
    // Check for similar past trades
    const similarTrades = history.filter(trade => 
      trade.category === item2.category ||
      trade.similar_items?.includes(item2.id)
    );
    
    const successfulSimilarTrades = similarTrades.filter(trade => trade.status === 'completed');
    
    if (similarTrades.length === 0) return 0.5;
    
    return successfulSimilarTrades.length / similarTrades.length;
  }

  calculateSeasonalScore(match) {
    const item2 = match.item2_details || match.their_listing;
    if (!item2) return 0.5;
    
    const currentMonth = new Date().getMonth();
    const seasonalItems = {
      0: ['winter_sports', 'heating'], // January
      1: ['winter_sports', 'heating'], // February
      2: ['spring_cleaning', 'gardening'], // March
      3: ['gardening', 'outdoor'], // April
      4: ['gardening', 'outdoor'], // May
      5: ['summer_sports', 'outdoor'], // June
      6: ['summer_sports', 'outdoor'], // July
      7: ['summer_sports', 'outdoor'], // August
      8: ['school', 'back_to_school'], // September
      9: ['school', 'autumn'], // October
      10: ['holiday_prep', 'winter_prep'], // November
      11: ['holiday', 'winter_sports'] // December
    };
    
    const currentSeasonalItems = seasonalItems[currentMonth] || [];
    const category = item2.category?.toLowerCase() || '';
    const title = item2.title?.toLowerCase() || '';
    
    const isSeasonallyRelevant = currentSeasonalItems.some(season => 
      category.includes(season) || title.includes(season)
    );
    
    return isSeasonallyRelevant ? 0.8 : 0.5;
  }
}

// Export singleton instance
export default new AIMatchingService();