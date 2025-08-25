/**
 * Deep Learning User Preferences Tracking Component
 * 
 * This service implements machine learning algorithms to understand and learn from
 * user behavior patterns, creating personalized matching preferences that evolve over time.
 */

import api from './api';

class UserBehaviorLearningService {
  constructor() {
    this.behaviorCache = new Map();
    this.learningQueue = [];
    this.isProcessing = false;
    
    // Learning configuration
    this.config = {
      learningRate: 0.1,
      decayRate: 0.95,
      minInteractions: 5,
      maxHistory: 1000,
      confidenceThreshold: 0.7,
      
      // Behavioral pattern weights
      acceptanceWeight: 1.0,
      declineWeight: -0.5,
      viewTimeWeight: 0.3,
      messageWeight: 0.8,
      searchWeight: 0.2,
      
      // Time decay factors
      hourlyDecay: 0.99,
      dailyDecay: 0.95,
      weeklyDecay: 0.90,
      monthlyDecay: 0.80,
    };
    
    // Initialize learning patterns
    this.initializeLearningPatterns();
  }

  /**
   * Main behavior learning function - processes user interactions to extract preferences
   */
  async learnFromUserInteraction(userId, interaction) {
    try {
      // Validate interaction data
      if (!this.validateInteraction(interaction)) {
        console.warn('Invalid interaction data:', interaction);
        return;
      }

      // Get current user behavior data
      const currentBehavior = await this.getUserBehavior(userId);
      
      // Process the interaction using ML algorithms
      const updatedBehavior = await this.processInteractionML(currentBehavior, interaction);
      
      // Update user preferences based on learned patterns
      await this.updateUserPreferences(userId, updatedBehavior);
      
      // Cache the updated behavior
      this.behaviorCache.set(userId, {
        data: updatedBehavior,
        timestamp: Date.now()
      });
      
      // Trigger real-time optimization if significant change detected
      if (this.isSignificantChange(currentBehavior, updatedBehavior)) {
        await this.triggerRealtimeOptimization(userId);
      }

    } catch (error) {
      console.error('Error learning from user interaction:', error);
    }
  }

  /**
   * Process interaction using machine learning algorithms
   */
  async processInteractionML(currentBehavior, interaction) {
    const updatedBehavior = { ...currentBehavior };
    const { type, data, timestamp } = interaction;
    
    // Calculate time decay factor
    const timeDecay = this.calculateTimeDecay(timestamp);
    
    switch (type) {
      case 'match_accepted':
        await this.processMatchAcceptance(updatedBehavior, data, timeDecay);
        break;
        
      case 'match_declined':
        await this.processMatchDecline(updatedBehavior, data, timeDecay);
        break;
        
      case 'match_viewed':
        await this.processMatchView(updatedBehavior, data, timeDecay);
        break;
        
      case 'message_sent':
        await this.processMessageSent(updatedBehavior, data, timeDecay);
        break;
        
      case 'search_performed':
        await this.processSearchBehavior(updatedBehavior, data, timeDecay);
        break;
        
      case 'listing_created':
        await this.processListingCreation(updatedBehavior, data, timeDecay);
        break;
        
      case 'profile_viewed':
        await this.processProfileView(updatedBehavior, data, timeDecay);
        break;
        
      default:
        console.warn('Unknown interaction type:', type);
    }
    
    // Apply global learning algorithms
    await this.applyGlobalLearning(updatedBehavior, interaction);
    
    // Update confidence scores
    this.updateConfidenceScores(updatedBehavior);
    
    return updatedBehavior;
  }

  /**
   * Process match acceptance to learn positive preferences
   */
  async processMatchAcceptance(behavior, data, timeDecay) {
    const { match, acceptTime, messageLength } = data;
    const learningRate = this.config.learningRate * timeDecay;
    
    // Initialize behavior structures if needed
    if (!behavior.category_preferences) behavior.category_preferences = {};
    if (!behavior.value_tolerance) behavior.value_tolerance = { min: 5, max: 20, preferred: 10 };
    if (!behavior.location_preferences) behavior.location_preferences = {};
    if (!behavior.user_type_preferences) behavior.user_type_preferences = {};
    if (!behavior.acceptance_patterns) behavior.acceptance_patterns = {};
    
    // Learn category preferences
    const category = match.item2_details?.category || match.their_listing?.category;
    if (category) {
      const currentPreference = behavior.category_preferences[category] || 0.5;
      behavior.category_preferences[category] = Math.min(1.0, 
        currentPreference + (learningRate * this.config.acceptanceWeight)
      );
    }
    
    // Learn value tolerance
    if (match.value_difference_percentage !== undefined) {
      const valueDiff = Math.abs(match.value_difference_percentage);
      this.updateValueTolerance(behavior.value_tolerance, valueDiff, learningRate, true);
    }
    
    // Learn location preferences
    if (match.distance_km !== undefined) {
      const distance = match.distance_km;
      this.updateLocationPreferences(behavior.location_preferences, distance, learningRate, true);
    }
    
    // Learn user type preferences
    const matchedUser = match.matched_user;
    if (matchedUser) {
      this.updateUserTypePreferences(behavior.user_type_preferences, matchedUser, learningRate, true);
    }
    
    // Learn acceptance patterns
    this.updateAcceptancePatterns(behavior.acceptance_patterns, {
      match,
      acceptTime,
      messageLength,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    });
    
    // Learn item-specific preferences
    await this.learnItemSpecificPreferences(behavior, match, learningRate, true);
  }

  /**
   * Process match decline to learn negative preferences
   */
  async processMatchDecline(behavior, data, timeDecay) {
    const { match, reason, feedback, blockSimilar } = data;
    const learningRate = this.config.learningRate * timeDecay;
    
    // Initialize structures
    if (!behavior.decline_patterns) behavior.decline_patterns = {};
    if (!behavior.blocked_preferences) behavior.blocked_preferences = {};
    
    // Learn from decline reason
    switch (reason) {
      case 'location':
        this.updateLocationPreferences(behavior.location_preferences, match.distance_km, learningRate, false);
        break;
        
      case 'value':
        this.updateValueTolerance(behavior.value_tolerance, Math.abs(match.value_difference_percentage), learningRate, false);
        break;
        
      case 'category':
        const category = match.item2_details?.category || match.their_listing?.category;
        if (category) {
          const currentPreference = behavior.category_preferences[category] || 0.5;
          behavior.category_preferences[category] = Math.max(0.0,
            currentPreference + (learningRate * this.config.declineWeight)
          );
        }
        break;
        
      case 'quality':
        this.learnQualityPreferences(behavior, match, learningRate, false);
        break;
    }
    
    // Process blocking of similar matches
    if (blockSimilar) {
      this.addBlockedPreferences(behavior.blocked_preferences, match);
    }
    
    // Learn from feedback text using NLP
    if (feedback) {
      await this.analyzeFeedbackNLP(behavior, feedback, match);
    }
    
    // Update decline patterns
    this.updateDeclinePatterns(behavior.decline_patterns, { match, reason, feedback });
  }

  /**
   * Process match view to understand browsing behavior
   */
  async processMatchView(behavior, data, timeDecay) {
    const { match, viewDuration, scrollDepth, clickedDetails } = data;
    
    if (!behavior.browsing_patterns) behavior.browsing_patterns = {};
    if (!behavior.interest_indicators) behavior.interest_indicators = {};
    
    // Learn from view duration
    const category = match.item2_details?.category || match.their_listing?.category;
    if (category && viewDuration > 3000) { // 3+ seconds indicates interest
      const interest = Math.min(viewDuration / 30000, 1.0); // Max 30 seconds
      const currentInterest = behavior.interest_indicators[category] || 0.5;
      behavior.interest_indicators[category] = currentInterest + (interest * 0.1);
    }
    
    // Learn from interaction depth
    if (clickedDetails || scrollDepth > 0.5) {
      const learningRate = this.config.learningRate * timeDecay * 0.5; // Reduced rate for views
      if (category) {
        const currentPreference = behavior.category_preferences[category] || 0.5;
        behavior.category_preferences[category] = Math.min(1.0,
          currentPreference + (learningRate * this.config.viewTimeWeight)
        );
      }
    }
    
    // Update browsing patterns
    this.updateBrowsingPatterns(behavior.browsing_patterns, {
      category,
      viewDuration,
      scrollDepth,
      timeOfDay: new Date().getHours()
    });
  }

  /**
   * Process search behavior to understand user intent
   */
  async processSearchBehavior(behavior, data, timeDecay) {
    const { query, filters, results, selectedItems } = data;
    
    if (!behavior.search_patterns) behavior.search_patterns = {};
    if (!behavior.keyword_preferences) behavior.keyword_preferences = {};
    
    // Learn from search queries
    if (query) {
      await this.analyzeSearchQuery(behavior, query);
    }
    
    // Learn from applied filters
    if (filters) {
      this.learnFromFilters(behavior, filters);
    }
    
    // Learn from selected results
    if (selectedItems && selectedItems.length > 0) {
      this.learnFromSearchSelection(behavior, selectedItems, timeDecay);
    }
    
    // Update search patterns
    this.updateSearchPatterns(behavior.search_patterns, {
      query,
      filters,
      resultCount: results?.length || 0,
      selectionRate: selectedItems?.length / (results?.length || 1)
    });
  }

  /**
   * Advanced value tolerance learning with dynamic adaptation
   */
  updateValueTolerance(valueTolerance, valueDiff, learningRate, isPositive) {
    if (isPositive) {
      // User accepted this value difference - expand tolerance
      if (valueDiff > valueTolerance.max) {
        valueTolerance.max = Math.min(100, valueTolerance.max + (learningRate * 10));
      }
      if (valueDiff < valueTolerance.min) {
        valueTolerance.min = Math.max(0, valueTolerance.min - (learningRate * 2));
      }
      // Update preferred range
      valueTolerance.preferred = (valueTolerance.preferred + valueDiff * learningRate) / (1 + learningRate);
    } else {
      // User declined - contract tolerance
      if (valueDiff >= valueTolerance.preferred) {
        valueTolerance.max = Math.max(valueTolerance.preferred, valueTolerance.max - (learningRate * 5));
      }
    }
  }

  /**
   * Advanced location preferences learning
   */
  updateLocationPreferences(locationPrefs, distance, learningRate, isPositive) {
    if (!locationPrefs.max_distance) locationPrefs.max_distance = 50;
    if (!locationPrefs.preferred_distance) locationPrefs.preferred_distance = 25;
    if (!locationPrefs.distance_weights) locationPrefs.distance_weights = {};
    
    if (isPositive) {
      // User accepted this distance
      if (distance > locationPrefs.max_distance) {
        locationPrefs.max_distance = Math.min(500, distance + (learningRate * 10));
      }
      // Update preferred distance
      locationPrefs.preferred_distance = (locationPrefs.preferred_distance + distance * learningRate) / (1 + learningRate);
    } else {
      // User declined - reduce tolerance
      if (distance >= locationPrefs.preferred_distance) {
        locationPrefs.max_distance = Math.max(5, Math.min(locationPrefs.max_distance, distance - (learningRate * 5)));
      }
    }
    
    // Update distance bucket weights
    const bucket = this.getDistanceBucket(distance);
    const currentWeight = locationPrefs.distance_weights[bucket] || 0.5;
    locationPrefs.distance_weights[bucket] = isPositive ? 
      Math.min(1.0, currentWeight + learningRate) :
      Math.max(0.0, currentWeight - learningRate);
  }

  /**
   * Learn user type preferences (trading partners)
   */
  updateUserTypePreferences(userTypePrefs, matchedUser, learningRate, isPositive) {
    if (!userTypePrefs.experience_levels) userTypePrefs.experience_levels = {};
    if (!userTypePrefs.activity_levels) userTypePrefs.activity_levels = {};
    if (!userTypePrefs.rating_ranges) userTypePrefs.rating_ranges = {};
    
    // Learn from user experience
    if (matchedUser.trades_count !== undefined) {
      const experienceLevel = this.getExperienceLevel(matchedUser.trades_count);
      const currentPref = userTypePrefs.experience_levels[experienceLevel] || 0.5;
      userTypePrefs.experience_levels[experienceLevel] = isPositive ?
        Math.min(1.0, currentPref + learningRate) :
        Math.max(0.0, currentPref - learningRate);
    }
    
    // Learn from user activity
    if (matchedUser.last_active) {
      const activityLevel = this.getActivityLevel(matchedUser.last_active);
      const currentPref = userTypePrefs.activity_levels[activityLevel] || 0.5;
      userTypePrefs.activity_levels[activityLevel] = isPositive ?
        Math.min(1.0, currentPref + learningRate) :
        Math.max(0.0, currentPref - learningRate);
    }
    
    // Learn from user ratings
    if (matchedUser.rating !== undefined) {
      const ratingRange = this.getRatingRange(matchedUser.rating);
      const currentPref = userTypePrefs.rating_ranges[ratingRange] || 0.5;
      userTypePrefs.rating_ranges[ratingRange] = isPositive ?
        Math.min(1.0, currentPref + learningRate) :
        Math.max(0.0, currentPref - learningRate);
    }
  }

  /**
   * Learn item-specific preferences using deep pattern analysis
   */
  async learnItemSpecificPreferences(behavior, match, learningRate, isPositive) {
    if (!behavior.item_patterns) behavior.item_patterns = {};
    
    const item = match.item2_details || match.their_listing;
    if (!item) return;
    
    // Learn brand preferences
    const brand = this.extractBrand(item.title);
    if (brand) {
      if (!behavior.item_patterns.brands) behavior.item_patterns.brands = {};
      const currentPref = behavior.item_patterns.brands[brand] || 0.5;
      behavior.item_patterns.brands[brand] = isPositive ?
        Math.min(1.0, currentPref + learningRate) :
        Math.max(0.0, currentPref - learningRate);
    }
    
    // Learn condition preferences
    if (item.condition) {
      if (!behavior.item_patterns.conditions) behavior.item_patterns.conditions = {};
      const currentPref = behavior.item_patterns.conditions[item.condition] || 0.5;
      behavior.item_patterns.conditions[item.condition] = isPositive ?
        Math.min(1.0, currentPref + learningRate) :
        Math.max(0.0, currentPref - learningRate);
    }
    
    // Learn age preferences
    if (item.age_years !== undefined) {
      if (!behavior.item_patterns.age_ranges) behavior.item_patterns.age_ranges = {};
      const ageRange = this.getAgeRange(item.age_years);
      const currentPref = behavior.item_patterns.age_ranges[ageRange] || 0.5;
      behavior.item_patterns.age_ranges[ageRange] = isPositive ?
        Math.min(1.0, currentPref + learningRate) :
        Math.max(0.0, currentPref - learningRate);
    }
    
    // Learn keyword preferences from item descriptions
    if (item.description) {
      await this.learnKeywordPreferences(behavior, item.description, isPositive, learningRate);
    }
  }

  /**
   * Natural Language Processing for feedback analysis
   */
  async analyzeFeedbackNLP(behavior, feedback, match) {
    if (!behavior.nlp_insights) behavior.nlp_insights = {};
    
    // Simple keyword extraction (can be enhanced with external NLP APIs)
    const keywords = this.extractKeywords(feedback);
    const sentiment = this.analyzeSentiment(feedback);
    
    // Learn from negative feedback keywords
    if (sentiment < 0.3) { // Negative sentiment
      for (const keyword of keywords) {
        if (!behavior.nlp_insights.negative_keywords) behavior.nlp_insights.negative_keywords = {};
        const currentWeight = behavior.nlp_insights.negative_keywords[keyword] || 0;
        behavior.nlp_insights.negative_keywords[keyword] = Math.min(1.0, currentWeight + 0.1);
      }
    }
    
    // Extract specific complaints
    const complaints = this.extractComplaints(feedback);
    for (const complaint of complaints) {
      this.processComplaint(behavior, complaint, match);
    }
  }

  /**
   * Calculate time decay factor for temporal learning
   */
  calculateTimeDecay(timestamp) {
    const now = Date.now();
    const timeDiff = now - new Date(timestamp).getTime();
    
    const hours = timeDiff / (1000 * 60 * 60);
    const days = hours / 24;
    const weeks = days / 7;
    const months = days / 30;
    
    let decay = 1.0;
    
    if (months > 1) {
      decay *= Math.pow(this.config.monthlyDecay, months - 1);
    } else if (weeks > 1) {
      decay *= Math.pow(this.config.weeklyDecay, weeks - 1);
    } else if (days > 1) {
      decay *= Math.pow(this.config.dailyDecay, days - 1);
    } else if (hours > 1) {
      decay *= Math.pow(this.config.hourlyDecay, hours - 1);
    }
    
    return Math.max(0.1, decay); // Minimum decay factor
  }

  /**
   * Update confidence scores for all learned preferences
   */
  updateConfidenceScores(behavior) {
    if (!behavior.confidence_scores) behavior.confidence_scores = {};
    
    // Calculate confidence based on interaction count and consistency
    Object.keys(behavior).forEach(key => {
      if (typeof behavior[key] === 'object' && behavior[key] !== null) {
        const interactions = this.countInteractions(behavior[key]);
        const consistency = this.calculateConsistency(behavior[key]);
        
        behavior.confidence_scores[key] = Math.min(1.0,
          (interactions / this.config.minInteractions) * consistency
        );
      }
    });
  }

  /**
   * Apply global learning algorithms across all user patterns
   */
  async applyGlobalLearning(behavior, interaction) {
    // Cross-category learning
    this.applyCrossCategoryLearning(behavior);
    
    // Temporal pattern learning
    this.applyTemporalPatternLearning(behavior, interaction);
    
    // Consistency checking and outlier detection
    this.detectAndHandleOutliers(behavior);
    
    // Preference evolution tracking
    this.trackPreferenceEvolution(behavior);
  }

  /**
   * Utility methods
   */
  validateInteraction(interaction) {
    return interaction && 
           interaction.type && 
           interaction.data && 
           interaction.timestamp;
  }

  getDistanceBucket(distance) {
    if (distance <= 5) return 'very_close';
    if (distance <= 15) return 'close';
    if (distance <= 50) return 'moderate';
    if (distance <= 100) return 'far';
    return 'very_far';
  }

  getExperienceLevel(tradesCount) {
    if (tradesCount === 0) return 'new';
    if (tradesCount <= 5) return 'beginner';
    if (tradesCount <= 20) return 'intermediate';
    if (tradesCount <= 50) return 'experienced';
    return 'expert';
  }

  getActivityLevel(lastActive) {
    const timeDiff = Date.now() - new Date(lastActive).getTime();
    const hours = timeDiff / (1000 * 60 * 60);
    
    if (hours <= 1) return 'very_active';
    if (hours <= 24) return 'active';
    if (hours <= 168) return 'moderate'; // 1 week
    if (hours <= 720) return 'inactive'; // 1 month
    return 'very_inactive';
  }

  getRatingRange(rating) {
    if (rating >= 4.5) return 'excellent';
    if (rating >= 4.0) return 'very_good';
    if (rating >= 3.5) return 'good';
    if (rating >= 3.0) return 'fair';
    return 'poor';
  }

  getAgeRange(ageYears) {
    if (ageYears <= 1) return 'brand_new';
    if (ageYears <= 3) return 'recent';
    if (ageYears <= 7) return 'moderate';
    if (ageYears <= 15) return 'older';
    return 'vintage';
  }

  extractBrand(title) {
    const brands = [
      'apple', 'samsung', 'google', 'microsoft', 'sony', 'nintendo',
      'nike', 'adidas', 'under armour', 'puma', 'reebok',
      'canon', 'nikon', 'fujifilm', 'olympus',
      'honda', 'toyota', 'ford', 'bmw', 'audi',
      'lego', 'hasbro', 'mattel', 'fisher-price'
    ];
    
    const titleLower = title.toLowerCase();
    return brands.find(brand => titleLower.includes(brand));
  }

  extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  analyzeSentiment(text) {
    const positiveWords = ['great', 'good', 'excellent', 'love', 'like', 'amazing', 'awesome', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst', 'dislike', 'poor'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });
    
    return Math.max(0, Math.min(1, score));
  }

  // API methods
  async getUserBehavior(userId) {
    try {
      const cacheKey = userId;
      if (this.behaviorCache.has(cacheKey)) {
        const cached = this.behaviorCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
          return cached.data;
        }
      }

      const response = await api.get(`/analytics/user-behavior/${userId}`);
      return response.data || {};
    } catch (error) {
      console.error('Error fetching user behavior:', error);
      return {};
    }
  }

  async updateUserPreferences(userId, behaviorData) {
    try {
      await api.put(`/analytics/user-behavior/${userId}`, behaviorData);
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  async triggerRealtimeOptimization(userId) {
    try {
      await api.post(`/matching/trigger-optimization/${userId}`);
    } catch (error) {
      console.error('Error triggering real-time optimization:', error);
    }
  }

  // Initialize default learning patterns
  initializeLearningPatterns() {
    // Default patterns can be loaded here
  }

  // Placeholder methods for advanced features
  applyCrossCategoryLearning(behavior) {
    // Cross-category pattern learning implementation
  }

  applyTemporalPatternLearning(behavior, interaction) {
    // Time-based pattern learning implementation
  }

  detectAndHandleOutliers(behavior) {
    // Outlier detection and handling implementation
  }

  trackPreferenceEvolution(behavior) {
    // Preference evolution tracking implementation
  }

  isSignificantChange(oldBehavior, newBehavior) {
    // Compare behaviors to detect significant changes
    return false; // Placeholder
  }

  countInteractions(obj) {
    // Count number of interactions in behavior object
    return Object.keys(obj).length;
  }

  calculateConsistency(obj) {
    // Calculate consistency score for behavior patterns
    return 0.8; // Placeholder
  }

  // Additional helper methods for NLP and pattern recognition
  extractComplaints(feedback) {
    const complaintPatterns = [
      /too far/i,
      /not worth/i,
      /bad condition/i,
      /overpriced/i,
      /not interested/i
    ];
    
    return complaintPatterns.filter(pattern => pattern.test(feedback))
      .map(pattern => pattern.source);
  }

  processComplaint(behavior, complaint, match) {
    // Process specific complaints to update preferences
  }

  async learnKeywordPreferences(behavior, description, isPositive, learningRate) {
    if (!behavior.keyword_preferences) behavior.keyword_preferences = {};
    
    const keywords = this.extractKeywords(description);
    keywords.forEach(keyword => {
      const currentPref = behavior.keyword_preferences[keyword] || 0.5;
      behavior.keyword_preferences[keyword] = isPositive ?
        Math.min(1.0, currentPref + learningRate * 0.1) :
        Math.max(0.0, currentPref - learningRate * 0.1);
    });
  }

  // Additional methods for search and browsing behavior
  async analyzeSearchQuery(behavior, query) {
    // Analyze search query to understand user intent
  }

  learnFromFilters(behavior, filters) {
    // Learn from applied search filters
  }

  learnFromSearchSelection(behavior, selectedItems, timeDecay) {
    // Learn from items selected in search results
  }

  updateSearchPatterns(searchPatterns, data) {
    // Update search behavior patterns
  }

  updateBrowsingPatterns(browsingPatterns, data) {
    // Update browsing behavior patterns
  }

  updateAcceptancePatterns(acceptancePatterns, data) {
    // Update acceptance behavior patterns
  }

  updateDeclinePatterns(declinePatterns, data) {
    // Update decline behavior patterns
  }

  addBlockedPreferences(blockedPrefs, match) {
    // Add items to blocked preferences
  }

  learnQualityPreferences(behavior, match, learningRate, isPositive) {
    // Learn quality-related preferences
  }
}

// Export singleton instance
export default new UserBehaviorLearningService();