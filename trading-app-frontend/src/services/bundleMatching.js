/**
 * Bundle Matching and Conditional Matching Service
 * 
 * This service implements intelligent bundle matching (single item ↔ multiple items)
 * and conditional matching based on user-specified conditions. It enables complex
 * trading scenarios while maintaining value equivalency and user preferences.
 */

import api from './api';
import aiMatchingService from './aiMatchingService';
import semanticMatchingService from './semanticMatchingService';

class BundleMatchingService {
  constructor() {
    this.bundleCache = new Map();
    this.conditionalMatches = new Map();
    this.valueCalculationCache = new Map();
    this.bundleTemplates = new Map();
    
    // Configuration for bundle matching
    this.config = {
      maxBundleSize: 5,
      maxValueVariance: 0.2, // 20% value difference tolerance
      minBundleValue: 10, // Minimum total bundle value
      maxBundleValue: 10000, // Maximum total bundle value
      
      // Bundle scoring weights
      valueMatchWeight: 0.35,
      complementarityWeight: 0.25,
      categoryCoherenceWeight: 0.20,
      conditionSimilarityWeight: 0.10,
      logisticsWeight: 0.10,
      
      // Conditional matching parameters
      maxConditions: 3,
      conditionComplexityLimit: 2,
      conditionalCacheTimeout: 1800000, // 30 minutes
      
      // Bundle types
      bundleTypes: {
        'complementary': { // Items that work together
          weight: 1.0,
          examples: ['laptop + mouse', 'console + games', 'camera + lens']
        },
        'collection': { // Items from same collection/series
          weight: 0.9,
          examples: ['book series', 'trading cards', 'collectibles']
        },
        'upgrade_path': { // Progressive upgrades
          weight: 0.8,
          examples: ['phone + accessories', 'tools + upgrades']
        },
        'variety_pack': { // Different items of similar value
          weight: 0.7,
          examples: ['mixed books', 'various tools']
        }
      },
      
      // Conditional operators
      conditionalOperators: {
        'AND': { symbol: '&&', priority: 2 },
        'OR': { symbol: '||', priority: 1 },
        'NOT': { symbol: '!', priority: 3 },
        'IF': { symbol: '=>', priority: 0 }
      }
    };
    
    // Initialize bundle patterns and templates
    this.initializeBundlePatterns();
  }

  /**
   * Find bundle matches for a single item against multiple items
   */
  async findBundleMatches(sourceItem, candidateItems, options = {}) {
    try {
      const {
        maxBundles = 20,
        allowedBundleTypes = Object.keys(this.config.bundleTypes),
        includeConditional = true,
        userPreferences = null
      } = options;

      // Generate potential bundles
      const potentialBundles = await this.generatePotentialBundles(
        candidateItems, 
        sourceItem,
        allowedBundleTypes
      );

      // Score and rank bundles
      const scoredBundles = await this.scoreBundles(
        potentialBundles,
        sourceItem,
        userPreferences
      );

      // Filter by value compatibility
      const valueCompatibleBundles = this.filterByValueCompatibility(
        scoredBundles,
        sourceItem
      );

      // Apply conditional matching if enabled
      let finalBundles = valueCompatibleBundles;
      if (includeConditional && userPreferences?.conditions) {
        finalBundles = await this.applyConditionalFiltering(
          valueCompatibleBundles,
          userPreferences.conditions
        );
      }

      // Sort by score and limit results
      return finalBundles
        .sort((a, b) => b.bundle_score - a.bundle_score)
        .slice(0, maxBundles);

    } catch (error) {
      console.error('Error finding bundle matches:', error);
      return [];
    }
  }

  /**
   * Find single items that match against a bundle
   */
  async findSingleItemMatches(sourceBundle, candidateItems, options = {}) {
    try {
      const {
        maxMatches = 20,
        includePartialMatches = true,
        userPreferences = null
      } = options;

      const bundleValue = this.calculateBundleValue(sourceBundle);
      const bundleCharacteristics = this.analyzeBundleCharacteristics(sourceBundle);

      const matches = [];

      for (const candidate of candidateItems) {
        const match = await this.evaluateSingleItemForBundle(
          candidate,
          sourceBundle,
          bundleValue,
          bundleCharacteristics,
          userPreferences
        );

        if (match && match.compatibility_score > 0.5) {
          matches.push(match);
        }
      }

      return matches
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, maxMatches);

    } catch (error) {
      console.error('Error finding single item matches:', error);
      return [];
    }
  }

  /**
   * Process conditional matching with user-defined rules
   */
  async processConditionalMatching(matches, conditions, context = {}) {
    try {
      if (!conditions || conditions.length === 0) {
        return matches;
      }

      const processedMatches = [];

      for (const match of matches) {
        const conditionResults = await this.evaluateConditions(
          conditions,
          match,
          context
        );

        if (conditionResults.passed) {
          processedMatches.push({
            ...match,
            conditional_match: true,
            condition_results: conditionResults,
            condition_reasoning: conditionResults.reasoning
          });
        }
      }

      return processedMatches;

    } catch (error) {
      console.error('Error processing conditional matching:', error);
      return matches;
    }
  }

  /**
   * Generate potential bundles from candidate items
   */
  async generatePotentialBundles(candidateItems, sourceItem, allowedTypes) {
    const bundles = [];
    
    // Generate bundles of different sizes (2-5 items)
    for (let bundleSize = 2; bundleSize <= this.config.maxBundleSize; bundleSize++) {
      const combinations = this.generateCombinations(candidateItems, bundleSize);
      
      for (const combination of combinations) {
        // Skip if bundle exceeds value limits
        const bundleValue = this.calculateBundleValue(combination);
        if (bundleValue < this.config.minBundleValue || 
            bundleValue > this.config.maxBundleValue) {
          continue;
        }

        // Determine bundle type
        const bundleType = this.determineBundleType(combination, sourceItem);
        
        // Skip if bundle type not allowed
        if (!allowedTypes.includes(bundleType)) {
          continue;
        }

        bundles.push({
          items: combination,
          bundle_type: bundleType,
          bundle_value: bundleValue,
          bundle_size: bundleSize,
          created_at: Date.now()
        });
      }
    }

    return bundles;
  }

  /**
   * Score bundles based on multiple factors
   */
  async scoreBundles(bundles, sourceItem, userPreferences) {
    const scoredBundles = [];

    for (const bundle of bundles) {
      try {
        const score = await this.calculateBundleScore(bundle, sourceItem, userPreferences);
        
        if (score.total_score > 0.3) { // Minimum threshold
          scoredBundles.push({
            ...bundle,
            bundle_score: score.total_score,
            score_breakdown: score.breakdown,
            score_reasoning: score.reasoning
          });
        }
      } catch (error) {
        console.error('Error scoring bundle:', error);
      }
    }

    return scoredBundles;
  }

  /**
   * Calculate comprehensive bundle score
   */
  async calculateBundleScore(bundle, sourceItem, userPreferences) {
    const breakdown = {};
    
    // 1. Value match score
    breakdown.value_match = this.calculateValueMatchScore(bundle, sourceItem);
    
    // 2. Complementarity score
    breakdown.complementarity = await this.calculateComplementarityScore(bundle, sourceItem);
    
    // 3. Category coherence score
    breakdown.category_coherence = this.calculateCategoryCoherenceScore(bundle);
    
    // 4. Condition similarity score
    breakdown.condition_similarity = this.calculateConditionSimilarityScore(bundle);
    
    // 5. Logistics feasibility score
    breakdown.logistics = this.calculateLogisticsScore(bundle, sourceItem);
    
    // 6. User preference alignment
    breakdown.user_preference = userPreferences ? 
      this.calculateUserPreferenceScore(bundle, userPreferences) : 0.5;
    
    // Calculate weighted total score
    const total_score = (
      breakdown.value_match * this.config.valueMatchWeight +
      breakdown.complementarity * this.config.complementarityWeight +
      breakdown.category_coherence * this.config.categoryCoherenceWeight +
      breakdown.condition_similarity * this.config.conditionSimilarityWeight +
      breakdown.logistics * this.config.logisticsWeight +
      breakdown.user_preference * 0.1
    );

    // Generate reasoning
    const reasoning = this.generateBundleScoreReasoning(breakdown, bundle);

    return {
      total_score: Math.min(1.0, Math.max(0.0, total_score)),
      breakdown,
      reasoning
    };
  }

  /**
   * Calculate value match score between bundle and source item
   */
  calculateValueMatchScore(bundle, sourceItem) {
    const bundleValue = bundle.bundle_value;
    const sourceValue = sourceItem.estimated_value || sourceItem.price || 0;
    
    if (sourceValue === 0 || bundleValue === 0) return 0.5;
    
    const valueDifference = Math.abs(bundleValue - sourceValue);
    const averageValue = (bundleValue + sourceValue) / 2;
    const relativeError = valueDifference / averageValue;
    
    // Score decreases as relative error increases
    if (relativeError <= 0.05) return 1.0; // 5% or less difference
    if (relativeError <= 0.10) return 0.9; // 10% or less difference
    if (relativeError <= 0.20) return 0.7; // 20% or less difference
    if (relativeError <= 0.35) return 0.5; // 35% or less difference
    return 0.2; // More than 35% difference
  }

  /**
   * Calculate complementarity score - how well items work together
   */
  async calculateComplementarityScore(bundle, sourceItem) {
    let complementarityScore = 0.5; // Base score
    
    // Check for known complementary patterns
    const complementaryPairs = this.findComplementaryPairs(bundle.items);
    if (complementaryPairs.length > 0) {
      complementarityScore += 0.3 * Math.min(1.0, complementaryPairs.length / 2);
    }
    
    // Check semantic relationships with source item
    for (const bundleItem of bundle.items) {
      try {
        const semantic = await semanticMatchingService.calculateSemanticSimilarity(
          sourceItem, 
          bundleItem
        );
        
        if (semantic.equivalency_type === 'functional_equivalent') {
          complementarityScore += 0.2;
        } else if (semantic.overall_score > 0.6) {
          complementarityScore += 0.1;
        }
      } catch (error) {
        console.error('Error calculating semantic similarity:', error);
      }
    }
    
    // Check for upgrade paths
    const upgradeScore = this.calculateUpgradePathScore(bundle.items, sourceItem);
    complementarityScore += upgradeScore * 0.2;
    
    return Math.min(1.0, complementarityScore);
  }

  /**
   * Calculate category coherence score - how well bundle categories fit together
   */
  calculateCategoryCoherenceScore(bundle) {
    const categories = bundle.items.map(item => item.category).filter(Boolean);
    const uniqueCategories = new Set(categories);
    
    // Single category gets high score
    if (uniqueCategories.size === 1) {
      return 1.0;
    }
    
    // Check for related categories
    const relatedScore = this.calculateCategoryRelationshipScore(Array.from(uniqueCategories));
    
    // Penalize too much category diversity
    const diversityPenalty = Math.max(0, (uniqueCategories.size - 2) * 0.1);
    
    return Math.max(0.2, relatedScore - diversityPenalty);
  }

  /**
   * Calculate condition similarity score for bundle items
   */
  calculateConditionSimilarityScore(bundle) {
    const conditions = bundle.items
      .map(item => item.condition)
      .filter(condition => condition);
    
    if (conditions.length === 0) return 0.5;
    
    const conditionMap = { 'new': 5, 'like_new': 4, 'good': 3, 'fair': 2, 'poor': 1 };
    const conditionValues = conditions.map(c => conditionMap[c] || 3);
    
    // Calculate variance in condition values
    const mean = conditionValues.reduce((sum, val) => sum + val, 0) / conditionValues.length;
    const variance = conditionValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / conditionValues.length;
    
    // Lower variance = higher score
    return Math.max(0.2, 1.0 - (variance / 4)); // Normalize variance
  }

  /**
   * Calculate logistics feasibility score
   */
  calculateLogisticsScore(bundle, sourceItem) {
    let logisticsScore = 0.8; // Base score
    
    // Check if all bundle items are from same location/user
    const userIds = bundle.items.map(item => item.user_id || item.userId).filter(Boolean);
    const uniqueUsers = new Set(userIds);
    
    if (uniqueUsers.size === 1) {
      logisticsScore += 0.2; // Bonus for single source
    } else {
      logisticsScore -= uniqueUsers.size * 0.05; // Penalty for multiple sources
    }
    
    // Check bundle size logistics
    if (bundle.bundle_size > 3) {
      logisticsScore -= 0.1; // Penalty for complex bundles
    }
    
    // Check for shipping complexity
    const totalWeight = this.estimateBundleWeight(bundle.items);
    const totalSize = this.estimateBundleSize(bundle.items);
    
    if (totalWeight > 20 || totalSize > 100) { // Arbitrary limits
      logisticsScore -= 0.1;
    }
    
    return Math.max(0.2, Math.min(1.0, logisticsScore));
  }

  /**
   * Calculate user preference alignment score
   */
  calculateUserPreferenceScore(bundle, userPreferences) {
    let preferenceScore = 0.5;
    
    // Check category preferences
    if (userPreferences.preferred_categories) {
      const bundleCategories = bundle.items.map(item => item.category);
      const preferredCount = bundleCategories.filter(cat => 
        userPreferences.preferred_categories.includes(cat)
      ).length;
      
      preferenceScore += (preferredCount / bundle.items.length) * 0.3;
    }
    
    // Check excluded categories
    if (userPreferences.excluded_categories) {
      const bundleCategories = bundle.items.map(item => item.category);
      const excludedCount = bundleCategories.filter(cat => 
        userPreferences.excluded_categories.includes(cat)
      ).length;
      
      if (excludedCount > 0) {
        preferenceScore -= 0.5; // Heavy penalty for excluded categories
      }
    }
    
    // Check value range preferences
    if (userPreferences.min_item_value || userPreferences.max_item_value) {
      const bundleValue = bundle.bundle_value;
      const min = userPreferences.min_item_value || 0;
      const max = userPreferences.max_item_value || Infinity;
      
      if (bundleValue >= min && bundleValue <= max) {
        preferenceScore += 0.2;
      } else {
        preferenceScore -= 0.2;
      }
    }
    
    return Math.max(0.0, Math.min(1.0, preferenceScore));
  }

  /**
   * Filter bundles by value compatibility
   */
  filterByValueCompatibility(bundles, sourceItem) {
    const sourceValue = sourceItem.estimated_value || sourceItem.price || 0;
    
    return bundles.filter(bundle => {
      if (sourceValue === 0) return true; // No source value to compare
      
      const valueDifference = Math.abs(bundle.bundle_value - sourceValue);
      const relativeError = valueDifference / Math.max(sourceValue, bundle.bundle_value);
      
      return relativeError <= this.config.maxValueVariance;
    });
  }

  /**
   * Apply conditional filtering based on user conditions
   */
  async applyConditionalFiltering(bundles, conditions) {
    const filteredBundles = [];
    
    for (const bundle of bundles) {
      const conditionResults = await this.evaluateConditions(conditions, bundle);
      
      if (conditionResults.passed) {
        filteredBundles.push({
          ...bundle,
          conditional_filtering_applied: true,
          condition_results: conditionResults
        });
      }
    }
    
    return filteredBundles;
  }

  /**
   * Evaluate conditional matching conditions
   */
  async evaluateConditions(conditions, match, context = {}) {
    const results = {
      passed: true,
      evaluations: [],
      reasoning: ''
    };

    try {
      for (const condition of conditions) {
        const evaluation = await this.evaluateSingleCondition(condition, match, context);
        results.evaluations.push(evaluation);
        
        if (!evaluation.passed) {
          results.passed = false;
        }
      }
      
      // Generate overall reasoning
      results.reasoning = this.generateConditionReasoning(results.evaluations);
      
    } catch (error) {
      console.error('Error evaluating conditions:', error);
      results.passed = false;
      results.reasoning = 'Error evaluating conditions';
    }

    return results;
  }

  /**
   * Evaluate a single condition
   */
  async evaluateSingleCondition(condition, match, context) {
    const { type, operator, value, field } = condition;
    
    try {
      let fieldValue;
      
      // Extract field value from match
      if (field.includes('.')) {
        fieldValue = this.getNestedFieldValue(match, field);
      } else {
        fieldValue = match[field];
      }
      
      // Apply condition logic
      let passed = false;
      
      switch (operator) {
        case 'equals':
          passed = fieldValue === value;
          break;
        case 'not_equals':
          passed = fieldValue !== value;
          break;
        case 'greater_than':
          passed = Number(fieldValue) > Number(value);
          break;
        case 'less_than':
          passed = Number(fieldValue) < Number(value);
          break;
        case 'contains':
          passed = String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'not_contains':
          passed = !String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
          break;
        case 'in_range':
          const numValue = Number(fieldValue);
          passed = numValue >= value.min && numValue <= value.max;
          break;
        case 'exists':
          passed = fieldValue !== undefined && fieldValue !== null;
          break;
        case 'not_exists':
          passed = fieldValue === undefined || fieldValue === null;
          break;
        default:
          console.warn('Unknown condition operator:', operator);
          passed = true;
      }
      
      return {
        condition,
        fieldValue,
        passed,
        reasoning: `${field} ${operator} ${JSON.stringify(value)} → ${passed ? 'PASS' : 'FAIL'}`
      };
      
    } catch (error) {
      console.error('Error evaluating single condition:', error);
      return {
        condition,
        fieldValue: null,
        passed: false,
        reasoning: `Error evaluating condition: ${error.message}`
      };
    }
  }

  /**
   * Utility methods for bundle analysis
   */
  calculateBundleValue(items) {
    return items.reduce((total, item) => {
      return total + (item.estimated_value || item.price || 0);
    }, 0);
  }

  analyzeBundleCharacteristics(bundle) {
    const categories = bundle.map(item => item.category).filter(Boolean);
    const conditions = bundle.map(item => item.condition).filter(Boolean);
    const ages = bundle.map(item => item.age_years).filter(age => age !== undefined);
    
    return {
      categories: [...new Set(categories)],
      conditions: [...new Set(conditions)],
      avgAge: ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : null,
      bundleSize: bundle.length,
      totalValue: this.calculateBundleValue(bundle)
    };
  }

  determineBundleType(items, sourceItem) {
    // Check for complementary items
    if (this.areItemsComplementary(items)) {
      return 'complementary';
    }
    
    // Check for collection items
    if (this.areItemsFromSameCollection(items)) {
      return 'collection';
    }
    
    // Check for upgrade path
    if (this.isUpgradePath(items, sourceItem)) {
      return 'upgrade_path';
    }
    
    // Default to variety pack
    return 'variety_pack';
  }

  findComplementaryPairs(items) {
    const complementaryPairs = [];
    const complementaryPatterns = [
      ['laptop', 'mouse'], ['laptop', 'keyboard'], ['laptop', 'bag'],
      ['console', 'game'], ['console', 'controller'], ['console', 'headset'],
      ['camera', 'lens'], ['camera', 'tripod'], ['camera', 'flash'],
      ['phone', 'case'], ['phone', 'charger'], ['phone', 'headphones'],
      ['guitar', 'amplifier'], ['guitar', 'picks'], ['guitar', 'strap'],
      ['book', 'bookmark'], ['book', 'light'], ['cookbook', 'utensils']
    ];
    
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const item1Title = items[i].title?.toLowerCase() || '';
        const item2Title = items[j].title?.toLowerCase() || '';
        
        const isComplementary = complementaryPatterns.some(([a, b]) => 
          (item1Title.includes(a) && item2Title.includes(b)) ||
          (item1Title.includes(b) && item2Title.includes(a))
        );
        
        if (isComplementary) {
          complementaryPairs.push([items[i], items[j]]);
        }
      }
    }
    
    return complementaryPairs;
  }

  generateCombinations(items, size) {
    if (size === 1) return items.map(item => [item]);
    if (size > items.length) return [];
    
    const combinations = [];
    
    function combine(start, currentCombination) {
      if (currentCombination.length === size) {
        combinations.push([...currentCombination]);
        return;
      }
      
      for (let i = start; i < items.length; i++) {
        currentCombination.push(items[i]);
        combine(i + 1, currentCombination);
        currentCombination.pop();
      }
    }
    
    combine(0, []);
    return combinations;
  }

  generateBundleScoreReasoning(breakdown, bundle) {
    const reasons = [];
    
    if (breakdown.value_match > 0.8) {
      reasons.push('excellent value match');
    } else if (breakdown.value_match > 0.6) {
      reasons.push('good value alignment');
    }
    
    if (breakdown.complementarity > 0.7) {
      reasons.push('items work well together');
    }
    
    if (breakdown.category_coherence > 0.8) {
      reasons.push('coherent category grouping');
    }
    
    if (breakdown.logistics > 0.8) {
      reasons.push('easy logistics');
    }
    
    if (reasons.length === 0) {
      reasons.push('decent bundle opportunity');
    }
    
    return `Bundle score based on: ${reasons.join(', ')}.`;
  }

  calculateCategoryRelationshipScore(categories) {
    // Simplified category relationship scoring
    const relationshipMap = {
      'Electronics-Gaming': 0.9,
      'Electronics-Appliances': 0.8,
      'Books-Electronics': 0.4,
      'Music-Electronics': 0.7,
      'Art-Collectibles': 0.8,
      'Sports-Electronics': 0.5,
      'Tools-Electronics': 0.6
    };
    
    let totalScore = 0;
    let comparisons = 0;
    
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const key1 = `${categories[i]}-${categories[j]}`;
        const key2 = `${categories[j]}-${categories[i]}`;
        
        const score = relationshipMap[key1] || relationshipMap[key2] || 0.3;
        totalScore += score;
        comparisons++;
      }
    }
    
    return comparisons > 0 ? totalScore / comparisons : 0.5;
  }

  calculateUpgradePathScore(bundleItems, sourceItem) {
    // Check if bundle represents an upgrade path from source item
    const sourceCategory = sourceItem.category;
    const bundleCategories = bundleItems.map(item => item.category);
    
    if (!bundleCategories.includes(sourceCategory)) {
      return 0;
    }
    
    // Simple upgrade detection (would be more sophisticated in production)
    const upgradeKeywords = ['pro', 'plus', 'max', 'premium', 'deluxe', 'advanced'];
    const sourceTitle = sourceItem.title?.toLowerCase() || '';
    
    const upgradeCount = bundleItems.filter(item => {
      const itemTitle = item.title?.toLowerCase() || '';
      return upgradeKeywords.some(keyword => itemTitle.includes(keyword) && !sourceTitle.includes(keyword));
    }).length;
    
    return Math.min(1.0, upgradeCount / bundleItems.length);
  }

  areItemsComplementary(items) {
    return this.findComplementaryPairs(items).length > 0;
  }

  areItemsFromSameCollection(items) {
    // Check for series/collection indicators
    const seriesIndicators = items.map(item => this.extractSeriesIndicator(item.title || ''));
    const uniqueIndicators = new Set(seriesIndicators.filter(Boolean));
    
    return uniqueIndicators.size === 1 && uniqueIndicators.size > 0;
  }

  extractSeriesIndicator(title) {
    const lowerTitle = title.toLowerCase();
    
    // Look for volume/book/part numbers
    const volumeMatch = lowerTitle.match(/vol\w*\s*\d+|volume\s*\d+|book\s*\d+|part\s*\d+|#\d+/);
    if (volumeMatch) {
      return lowerTitle.replace(volumeMatch[0], '').trim();
    }
    
    // Look for series names
    const seriesMatch = lowerTitle.match(/(.+?)\s+(series|collection|set)/);
    if (seriesMatch) {
      return seriesMatch[1].trim();
    }
    
    return null;
  }

  isUpgradePath(items, sourceItem) {
    const upgradeScore = this.calculateUpgradePathScore(items, sourceItem);
    return upgradeScore > 0.5;
  }

  estimateBundleWeight(items) {
    // Simplified weight estimation based on category
    const categoryWeights = {
      'Electronics': 2,
      'Books': 0.5,
      'Clothing': 0.3,
      'Tools': 3,
      'Appliances': 5,
      'Furniture': 10
    };
    
    return items.reduce((total, item) => {
      const weight = categoryWeights[item.category] || 1;
      return total + weight;
    }, 0);
  }

  estimateBundleSize(items) {
    // Simplified size estimation (cubic units)
    const categorySizes = {
      'Electronics': 10,
      'Books': 5,
      'Clothing': 3,
      'Tools': 8,
      'Appliances': 20,
      'Furniture': 50
    };
    
    return items.reduce((total, item) => {
      const size = categorySizes[item.category] || 5;
      return total + size;
    }, 0);
  }

  getNestedFieldValue(obj, fieldPath) {
    return fieldPath.split('.').reduce((current, key) => {
      return current && current[key];
    }, obj);
  }

  generateConditionReasoning(evaluations) {
    const passedCount = evaluations.filter(e => e.passed).length;
    const totalCount = evaluations.length;
    
    if (passedCount === totalCount) {
      return `All ${totalCount} conditions passed`;
    } else if (passedCount === 0) {
      return `None of the ${totalCount} conditions passed`;
    } else {
      return `${passedCount} of ${totalCount} conditions passed`;
    }
  }

  async evaluateSingleItemForBundle(item, bundle, bundleValue, bundleCharacteristics, userPreferences) {
    try {
      // Calculate value compatibility
      const itemValue = item.estimated_value || item.price || 0;
      const valueCompatibility = this.calculateValueCompatibility(itemValue, bundleValue);
      
      if (valueCompatibility < 0.3) {
        return null; // Skip if value is too different
      }
      
      // Calculate category alignment
      const categoryAlignment = this.calculateCategoryAlignment(
        item.category, 
        bundleCharacteristics.categories
      );
      
      // Calculate condition compatibility
      const conditionCompatibility = this.calculateConditionCompatibility(
        item.condition,
        bundleCharacteristics.conditions
      );
      
      // Calculate overall compatibility
      const compatibility_score = (
        valueCompatibility * 0.5 +
        categoryAlignment * 0.3 +
        conditionCompatibility * 0.2
      );
      
      if (compatibility_score < 0.5) {
        return null;
      }
      
      return {
        item,
        bundle_characteristics: bundleCharacteristics,
        compatibility_score,
        value_compatibility: valueCompatibility,
        category_alignment: categoryAlignment,
        condition_compatibility: conditionCompatibility,
        match_reasoning: this.generateSingleItemMatchReasoning(
          compatibility_score,
          valueCompatibility,
          categoryAlignment,
          conditionCompatibility
        )
      };
      
    } catch (error) {
      console.error('Error evaluating single item for bundle:', error);
      return null;
    }
  }

  calculateValueCompatibility(itemValue, bundleValue) {
    if (itemValue === 0 || bundleValue === 0) return 0.5;
    
    const ratio = Math.min(itemValue, bundleValue) / Math.max(itemValue, bundleValue);
    return ratio;
  }

  calculateCategoryAlignment(itemCategory, bundleCategories) {
    if (!itemCategory || bundleCategories.length === 0) return 0.5;
    
    if (bundleCategories.includes(itemCategory)) {
      return 1.0;
    }
    
    // Check for related categories
    const relationshipScore = this.calculateCategoryRelationshipScore([itemCategory, ...bundleCategories]);
    return relationshipScore;
  }

  calculateConditionCompatibility(itemCondition, bundleConditions) {
    if (!itemCondition || bundleConditions.length === 0) return 0.5;
    
    const conditionMap = { 'new': 5, 'like_new': 4, 'good': 3, 'fair': 2, 'poor': 1 };
    const itemValue = conditionMap[itemCondition] || 3;
    const bundleValues = bundleConditions.map(c => conditionMap[c] || 3);
    
    // Calculate similarity to bundle condition range
    const minBundle = Math.min(...bundleValues);
    const maxBundle = Math.max(...bundleValues);
    
    if (itemValue >= minBundle && itemValue <= maxBundle) {
      return 1.0;
    }
    
    const distance = Math.min(
      Math.abs(itemValue - minBundle),
      Math.abs(itemValue - maxBundle)
    );
    
    return Math.max(0.2, 1.0 - (distance / 4));
  }

  generateSingleItemMatchReasoning(compatibilityScore, valueComp, categoryAlign, conditionComp) {
    const reasons = [];
    
    if (valueComp > 0.8) reasons.push('excellent value match');
    else if (valueComp > 0.6) reasons.push('good value alignment');
    
    if (categoryAlign > 0.8) reasons.push('perfect category fit');
    else if (categoryAlign > 0.6) reasons.push('related category');
    
    if (conditionComp > 0.8) reasons.push('matching condition');
    
    return reasons.length > 0 ? 
      `Single item match: ${reasons.join(', ')}` : 
      'Basic compatibility match';
  }

  /**
   * Initialize bundle patterns and templates
   */
  initializeBundlePatterns() {
    // Initialize common bundle patterns
    // This would be loaded from a configuration file or database in production
  }
}

// Export singleton instance
export default new BundleMatchingService();