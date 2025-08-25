/**
 * Semantic Similarity Matching Service
 * 
 * This service implements advanced semantic analysis for intelligent cross-category matching.
 * It enables matching semantically similar items like iPhone ↔ Samsung Galaxy, 
 * gaming laptop ↔ console + games, and other intelligent equivalencies.
 */

import api from './api';

class SemanticMatchingService {
  constructor() {
    this.semanticCache = new Map();
    this.embeddingCache = new Map();
    this.categoryRelationships = new Map();
    this.brandEquivalencies = new Map();
    this.functionalMappings = new Map();
    
    // Initialize semantic knowledge base
    this.initializeSemanticKnowledge();
    
    // Configuration for semantic analysis
    this.config = {
      similarityThreshold: 0.7,
      crossCategoryBonus: 0.15,
      brandEquivalencyWeight: 0.25,
      functionalWeight: 0.30,
      descriptionWeight: 0.20,
      titleWeight: 0.35,
      tagWeight: 0.15,
      
      // Cache settings
      cacheTimeout: 3600000, // 1 hour
      maxCacheSize: 10000,
      
      // NLP settings
      stopWords: new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those']),
      minWordLength: 2,
      maxKeywords: 20
    };
  }

  /**
   * Main semantic matching function - finds semantically similar items across categories
   */
  async findSemanticMatches(sourceItem, candidateItems, options = {}) {
    try {
      const {
        enableCrossCategory = true,
        enableBrandEquivalency = true,
        enableFunctionalMatching = true,
        minSimilarityScore = 0.6
      } = options;

      const semanticMatches = [];

      // Get semantic embedding for source item
      const sourceEmbedding = await this.getItemEmbedding(sourceItem);

      for (const candidate of candidateItems) {
        try {
          // Skip same category items if cross-category is disabled
          if (!enableCrossCategory && sourceItem.category === candidate.category) {
            continue;
          }

          // Calculate comprehensive semantic similarity
          const similarity = await this.calculateSemanticSimilarity(
            sourceItem, 
            candidate, 
            sourceEmbedding,
            {
              enableBrandEquivalency,
              enableFunctionalMatching
            }
          );

          if (similarity.overall_score >= minSimilarityScore) {
            semanticMatches.push({
              item: candidate,
              semantic_score: similarity.overall_score,
              similarity_factors: similarity.factors,
              match_reasoning: similarity.reasoning,
              cross_category: sourceItem.category !== candidate.category,
              equivalency_type: similarity.equivalency_type
            });
          }

        } catch (error) {
          console.error('Error calculating semantic similarity for item:', candidate.id, error);
        }
      }

      // Sort by semantic score
      semanticMatches.sort((a, b) => b.semantic_score - a.semantic_score);

      return semanticMatches;

    } catch (error) {
      console.error('Error finding semantic matches:', error);
      return [];
    }
  }

  /**
   * Calculate comprehensive semantic similarity between two items
   */
  async calculateSemanticSimilarity(item1, item2, item1Embedding = null, options = {}) {
    const cacheKey = `${item1.id}_${item2.id}`;
    
    // Check cache first
    if (this.semanticCache.has(cacheKey)) {
      const cached = this.semanticCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Get embeddings for both items
      const embedding1 = item1Embedding || await this.getItemEmbedding(item1);
      const embedding2 = await this.getItemEmbedding(item2);

      // Calculate different types of similarity
      const titleSimilarity = this.calculateTextSimilarity(item1.title, item2.title);
      const descriptionSimilarity = this.calculateTextSimilarity(
        item1.description || '', 
        item2.description || ''
      );
      const tagSimilarity = this.calculateTagSimilarity(item1.tags || [], item2.tags || []);
      
      // Brand equivalency analysis
      const brandEquivalency = options.enableBrandEquivalency ? 
        this.calculateBrandEquivalency(item1, item2) : 0;
      
      // Functional equivalency analysis
      const functionalEquivalency = options.enableFunctionalMatching ? 
        this.calculateFunctionalEquivalency(item1, item2) : 0;
      
      // Category relationship analysis
      const categoryRelation = this.calculateCategoryRelationship(item1.category, item2.category);
      
      // Embedding-based semantic similarity
      const embeddingSimilarity = this.calculateEmbeddingSimilarity(embedding1, embedding2);
      
      // Feature-based similarity
      const featureSimilarity = this.calculateFeatureSimilarity(item1, item2);
      
      // Price-point equivalency
      const priceEquivalency = this.calculatePriceEquivalency(item1, item2);

      // Calculate weighted overall score
      const overall_score = (
        titleSimilarity * this.config.titleWeight +
        descriptionSimilarity * this.config.descriptionWeight +
        tagSimilarity * this.config.tagWeight +
        brandEquivalency * this.config.brandEquivalencyWeight +
        functionalEquivalency * this.config.functionalWeight +
        categoryRelation * 0.15 +
        embeddingSimilarity * 0.20 +
        featureSimilarity * 0.10 +
        priceEquivalency * 0.05
      );

      // Determine equivalency type
      const equivalency_type = this.determineEquivalencyType({
        brandEquivalency,
        functionalEquivalency,
        categoryRelation,
        titleSimilarity,
        overall_score
      });

      // Generate reasoning explanation
      const reasoning = this.generateSemanticReasoning({
        item1,
        item2,
        titleSimilarity,
        brandEquivalency,
        functionalEquivalency,
        categoryRelation,
        equivalency_type
      });

      const result = {
        overall_score: Math.min(1.0, Math.max(0.0, overall_score)),
        factors: {
          title_similarity: titleSimilarity,
          description_similarity: descriptionSimilarity,
          tag_similarity: tagSimilarity,
          brand_equivalency: brandEquivalency,
          functional_equivalency: functionalEquivalency,
          category_relation: categoryRelation,
          embedding_similarity: embeddingSimilarity,
          feature_similarity: featureSimilarity,
          price_equivalency: priceEquivalency
        },
        equivalency_type,
        reasoning
      };

      // Cache the result
      this.semanticCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error calculating semantic similarity:', error);
      return {
        overall_score: 0.0,
        factors: {},
        equivalency_type: 'none',
        reasoning: 'Error calculating similarity'
      };
    }
  }

  /**
   * Get semantic embedding for an item using multiple techniques
   */
  async getItemEmbedding(item) {
    const cacheKey = `embedding_${item.id}`;
    
    if (this.embeddingCache.has(cacheKey)) {
      const cached = this.embeddingCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Create composite text representation
      const compositeText = this.createCompositeText(item);
      
      // Generate embedding using multiple techniques
      const embedding = {
        // TF-IDF based embedding
        tfidf: await this.generateTFIDFEmbedding(compositeText),
        
        // Keyword-based embedding
        keywords: this.generateKeywordEmbedding(compositeText),
        
        // Feature-based embedding
        features: this.generateFeatureEmbedding(item),
        
        // Category-based embedding
        category: this.generateCategoryEmbedding(item.category)
      };

      // Cache the embedding
      this.embeddingCache.set(cacheKey, {
        data: embedding,
        timestamp: Date.now()
      });

      return embedding;

    } catch (error) {
      console.error('Error generating item embedding:', error);
      return { tfidf: [], keywords: [], features: [], category: [] };
    }
  }

  /**
   * Calculate brand equivalency between items
   */
  calculateBrandEquivalency(item1, item2) {
    const brand1 = this.extractBrand(item1.title);
    const brand2 = this.extractBrand(item2.title);
    
    if (!brand1 || !brand2) return 0;
    
    if (brand1 === brand2) return 1.0; // Same brand
    
    // Check for known brand equivalencies
    const equivalencyKey = `${brand1}_${brand2}`;
    const reverseKey = `${brand2}_${brand1}`;
    
    if (this.brandEquivalencies.has(equivalencyKey)) {
      return this.brandEquivalencies.get(equivalencyKey);
    }
    
    if (this.brandEquivalencies.has(reverseKey)) {
      return this.brandEquivalencies.get(reverseKey);
    }
    
    // Check for competitor relationships
    const competitorScore = this.getCompetitorScore(brand1, brand2);
    
    return competitorScore;
  }

  /**
   * Calculate functional equivalency between items
   */
  calculateFunctionalEquivalency(item1, item2) {
    const function1 = this.extractFunction(item1);
    const function2 = this.extractFunction(item2);
    
    if (!function1 || !function2) return 0;
    
    if (function1 === function2) return 1.0; // Same function
    
    // Check for functional mappings
    const functionKey = `${function1}_${function2}`;
    const reverseKey = `${function2}_${function1}`;
    
    if (this.functionalMappings.has(functionKey)) {
      return this.functionalMappings.get(functionKey);
    }
    
    if (this.functionalMappings.has(reverseKey)) {
      return this.functionalMappings.get(reverseKey);
    }
    
    // Check for functional relationships
    return this.getFunctionalRelationshipScore(function1, function2);
  }

  /**
   * Calculate category relationship strength
   */
  calculateCategoryRelationship(category1, category2) {
    if (category1 === category2) return 1.0;
    
    const relationKey = `${category1}_${category2}`;
    const reverseKey = `${category2}_${category1}`;
    
    if (this.categoryRelationships.has(relationKey)) {
      return this.categoryRelationships.get(relationKey);
    }
    
    if (this.categoryRelationships.has(reverseKey)) {
      return this.categoryRelationships.get(reverseKey);
    }
    
    return 0.1; // Default minimal relationship
  }

  /**
   * Calculate embedding-based similarity using cosine similarity
   */
  calculateEmbeddingSimilarity(embedding1, embedding2) {
    try {
      // Combine different embedding types
      const tfidfSim = this.cosineSimilarity(embedding1.tfidf, embedding2.tfidf);
      const keywordSim = this.cosineSimilarity(embedding1.keywords, embedding2.keywords);
      const featureSim = this.cosineSimilarity(embedding1.features, embedding2.features);
      const categorySim = this.cosineSimilarity(embedding1.category, embedding2.category);
      
      // Weighted combination
      return (tfidfSim * 0.4 + keywordSim * 0.3 + featureSim * 0.2 + categorySim * 0.1);
      
    } catch (error) {
      console.error('Error calculating embedding similarity:', error);
      return 0;
    }
  }

  /**
   * Calculate feature-based similarity
   */
  calculateFeatureSimilarity(item1, item2) {
    let similarity = 0;
    let featureCount = 0;
    
    // Compare common features
    const features = ['condition', 'age_years', 'brand', 'model', 'color', 'size'];
    
    features.forEach(feature => {
      if (item1[feature] !== undefined && item2[feature] !== undefined) {
        featureCount++;
        
        if (feature === 'condition') {
          similarity += this.compareConditions(item1[feature], item2[feature]);
        } else if (feature === 'age_years') {
          similarity += this.compareAges(item1[feature], item2[feature]);
        } else if (item1[feature] === item2[feature]) {
          similarity += 1.0;
        }
      }
    });
    
    return featureCount > 0 ? similarity / featureCount : 0.5;
  }

  /**
   * Calculate price point equivalency
   */
  calculatePriceEquivalency(item1, item2) {
    const price1 = item1.estimated_value || item1.price;
    const price2 = item2.estimated_value || item2.price;
    
    if (!price1 || !price2) return 0.5;
    
    const ratio = Math.min(price1, price2) / Math.max(price1, price2);
    
    // Convert ratio to similarity score
    if (ratio >= 0.9) return 1.0;
    if (ratio >= 0.8) return 0.9;
    if (ratio >= 0.7) return 0.8;
    if (ratio >= 0.5) return 0.6;
    if (ratio >= 0.3) return 0.4;
    return 0.2;
  }

  /**
   * Generate TF-IDF embedding for text
   */
  async generateTFIDFEmbedding(text) {
    try {
      // Simple TF-IDF implementation
      const words = this.tokenizeText(text);
      const wordCounts = {};
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
      
      // Convert to normalized vector
      const totalWords = words.length;
      const embedding = [];
      
      Object.entries(wordCounts).forEach(([word, count]) => {
        const tf = count / totalWords;
        const idf = this.getIDF(word); // Inverse document frequency
        embedding.push(tf * idf);
      });
      
      return this.normalizeVector(embedding);
      
    } catch (error) {
      console.error('Error generating TF-IDF embedding:', error);
      return [];
    }
  }

  /**
   * Generate keyword-based embedding
   */
  generateKeywordEmbedding(text) {
    const keywords = this.extractKeywords(text);
    const keywordWeights = {};
    
    keywords.forEach((keyword, index) => {
      // Weight by position (earlier keywords are more important)
      const weight = 1.0 - (index / keywords.length) * 0.5;
      keywordWeights[keyword] = weight;
    });
    
    return Object.values(keywordWeights);
  }

  /**
   * Generate feature-based embedding
   */
  generateFeatureEmbedding(item) {
    const features = [];
    
    // Encode categorical features
    if (item.condition) {
      features.push(...this.encodeCondition(item.condition));
    }
    
    if (item.category) {
      features.push(...this.encodeCategory(item.category));
    }
    
    // Encode numerical features
    if (item.age_years !== undefined) {
      features.push(this.normalizeAge(item.age_years));
    }
    
    if (item.estimated_value !== undefined) {
      features.push(this.normalizePrice(item.estimated_value));
    }
    
    return features;
  }

  /**
   * Generate category-based embedding
   */
  generateCategoryEmbedding(category) {
    // One-hot encoding for categories
    const categories = [
      'Electronics', 'Clothing', 'Books', 'Furniture', 'Tools', 
      'Vehicles', 'Services', 'Appliances', 'Collectibles', 'Sports',
      'Music', 'Art', 'Garden', 'Kids', 'Pets', 'Health', 'Food', 'Gaming'
    ];
    
    const embedding = new Array(categories.length).fill(0);
    const index = categories.indexOf(category);
    
    if (index !== -1) {
      embedding[index] = 1.0;
    }
    
    return embedding;
  }

  /**
   * Cosine similarity calculation
   */
  cosineSimilarity(vector1, vector2) {
    if (!vector1.length || !vector2.length) return 0;
    
    const maxLength = Math.max(vector1.length, vector2.length);
    const v1 = [...vector1, ...new Array(maxLength - vector1.length).fill(0)];
    const v2 = [...vector2, ...new Array(maxLength - vector2.length).fill(0)];
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < maxLength; i++) {
      dotProduct += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) return 0;
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Initialize semantic knowledge base
   */
  initializeSemanticKnowledge() {
    // Brand equivalencies
    this.brandEquivalencies.set('apple_samsung', 0.85);
    this.brandEquivalencies.set('iphone_galaxy', 0.90);
    this.brandEquivalencies.set('macbook_thinkpad', 0.70);
    this.brandEquivalencies.set('macbook_surface', 0.75);
    this.brandEquivalencies.set('ipad_galaxy_tab', 0.85);
    this.brandEquivalencies.set('airpods_galaxy_buds', 0.80);
    this.brandEquivalencies.set('nike_adidas', 0.90);
    this.brandEquivalencies.set('playstation_xbox', 0.95);
    this.brandEquivalencies.set('nintendo_playstation', 0.70);
    this.brandEquivalencies.set('canon_nikon', 0.85);
    this.brandEquivalencies.set('sony_panasonic', 0.75);
    
    // Functional mappings
    this.functionalMappings.set('smartphone_tablet', 0.70);
    this.functionalMappings.set('laptop_desktop', 0.80);
    this.functionalMappings.set('console_gaming_pc', 0.75);
    this.functionalMappings.set('ebook_physical_book', 0.85);
    this.functionalMappings.set('vinyl_cd', 0.80);
    this.functionalMappings.set('digital_camera_phone_camera', 0.60);
    this.functionalMappings.set('smartwatch_fitness_tracker', 0.70);
    this.functionalMappings.set('headphones_speakers', 0.65);
    this.functionalMappings.set('keyboard_piano', 0.75);
    
    // Category relationships
    this.categoryRelationships.set('Electronics_Gaming', 0.80);
    this.categoryRelationships.set('Electronics_Appliances', 0.70);
    this.categoryRelationships.set('Books_Electronics', 0.40); // ebooks
    this.categoryRelationships.set('Music_Electronics', 0.75);
    this.categoryRelationships.set('Art_Collectibles', 0.65);
    this.categoryRelationships.set('Sports_Electronics', 0.50);
    this.categoryRelationships.set('Tools_Electronics', 0.45);
    this.categoryRelationships.set('Vehicles_Electronics', 0.55);
    this.categoryRelationships.set('Gaming_Collectibles', 0.60);
    this.categoryRelationships.set('Furniture_Electronics', 0.30); // TV stands, etc.
    this.categoryRelationships.set('Health_Electronics', 0.50);
  }

  /**
   * Utility methods
   */
  createCompositeText(item) {
    return [
      item.title || '',
      item.description || '',
      item.category || '',
      (item.tags || []).join(' '),
      item.brand || '',
      item.model || ''
    ].filter(text => text.length > 0).join(' ');
  }

  tokenizeText(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length >= this.config.minWordLength && 
        !this.config.stopWords.has(word)
      );
  }

  extractKeywords(text) {
    const words = this.tokenizeText(text);
    const wordFreq = {};
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, this.config.maxKeywords)
      .map(([word]) => word);
  }

  extractBrand(title) {
    const brands = [
      'apple', 'samsung', 'google', 'microsoft', 'sony', 'nintendo', 'lg',
      'nike', 'adidas', 'under armour', 'puma', 'reebok',
      'canon', 'nikon', 'fujifilm', 'olympus', 'panasonic',
      'honda', 'toyota', 'ford', 'bmw', 'audi', 'mercedes',
      'lego', 'hasbro', 'mattel', 'fisher-price',
      'dell', 'hp', 'lenovo', 'asus', 'acer'
    ];
    
    const titleLower = title.toLowerCase();
    return brands.find(brand => titleLower.includes(brand));
  }

  extractFunction(item) {
    const title = (item.title || '').toLowerCase();
    const category = (item.category || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    
    const text = `${title} ${category} ${description}`;
    
    // Function extraction patterns
    if (text.includes('smartphone') || text.includes('phone') || text.includes('mobile')) return 'smartphone';
    if (text.includes('tablet') || text.includes('ipad')) return 'tablet';
    if (text.includes('laptop') || text.includes('notebook')) return 'laptop';
    if (text.includes('desktop') || (text.includes('pc') && !text.includes('laptop'))) return 'desktop';
    if (text.includes('console') || text.includes('playstation') || text.includes('xbox')) return 'console';
    if (text.includes('smartwatch') || text.includes('watch')) return 'smartwatch';
    if (text.includes('headphones') || text.includes('earbuds')) return 'headphones';
    if (text.includes('speaker')) return 'speaker';
    if (text.includes('camera') && !text.includes('phone')) return 'camera';
    if (text.includes('ebook') || (text.includes('book') && text.includes('digital'))) return 'ebook';
    if (text.includes('vinyl') || text.includes('record')) return 'vinyl';
    if (text.includes('cd') || text.includes('compact disc')) return 'cd';
    
    return null;
  }

  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = new Set(this.tokenizeText(text1));
    const words2 = new Set(this.tokenizeText(text2));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  calculateTagSimilarity(tags1, tags2) {
    if (!tags1.length || !tags2.length) return 0;
    
    const set1 = new Set(tags1.map(tag => tag.toLowerCase()));
    const set2 = new Set(tags2.map(tag => tag.toLowerCase()));
    
    const intersection = new Set([...set1].filter(tag => set2.has(tag)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  getCompetitorScore(brand1, brand2) {
    const competitors = {
      'apple': ['samsung', 'google', 'microsoft'],
      'samsung': ['apple', 'lg', 'google'],
      'nike': ['adidas', 'puma', 'under armour'],
      'canon': ['nikon', 'sony', 'fujifilm'],
      'playstation': ['xbox', 'nintendo'],
      'honda': ['toyota', 'nissan', 'ford']
    };
    
    if (competitors[brand1]?.includes(brand2) || competitors[brand2]?.includes(brand1)) {
      return 0.75; // High competitor relationship
    }
    
    return 0.1; // Low relationship
  }

  getFunctionalRelationshipScore(func1, func2) {
    const relationships = {
      'smartphone': { 'tablet': 0.7, 'smartwatch': 0.6, 'camera': 0.5 },
      'laptop': { 'desktop': 0.8, 'tablet': 0.6 },
      'console': { 'desktop': 0.7, 'laptop': 0.6 },
      'headphones': { 'speaker': 0.6, 'smartphone': 0.4 },
      'camera': { 'smartphone': 0.5, 'tablet': 0.3 }
    };
    
    return relationships[func1]?.[func2] || relationships[func2]?.[func1] || 0.1;
  }

  determineEquivalencyType(factors) {
    const { brandEquivalency, functionalEquivalency, categoryRelation, titleSimilarity, overall_score } = factors;
    
    if (brandEquivalency > 0.8) return 'brand_equivalent';
    if (functionalEquivalency > 0.7) return 'functional_equivalent';
    if (categoryRelation > 0.8) return 'category_similar';
    if (titleSimilarity > 0.7) return 'title_similar';
    if (overall_score > 0.6) return 'semantically_similar';
    
    return 'loosely_related';
  }

  generateSemanticReasoning({ item1, item2, titleSimilarity, brandEquivalency, functionalEquivalency, categoryRelation, equivalency_type }) {
    const reasons = [];
    
    if (equivalency_type === 'brand_equivalent') {
      const brand1 = this.extractBrand(item1.title);
      const brand2 = this.extractBrand(item2.title);
      reasons.push(`${brand1} and ${brand2} are equivalent brands in the same market`);
    }
    
    if (equivalency_type === 'functional_equivalent') {
      const func1 = this.extractFunction(item1);
      const func2 = this.extractFunction(item2);
      reasons.push(`${func1} and ${func2} serve similar functions`);
    }
    
    if (titleSimilarity > 0.6) {
      reasons.push('similar product names and descriptions');
    }
    
    if (categoryRelation > 0.6 && item1.category !== item2.category) {
      reasons.push(`${item1.category} and ${item2.category} are related categories`);
    }
    
    if (reasons.length === 0) {
      reasons.push('general semantic similarity detected');
    }
    
    return `Semantic match found: ${reasons.join(', ')}.`;
  }

  // Encoding and normalization methods
  encodeCondition(condition) {
    const conditions = ['new', 'like_new', 'good', 'fair', 'poor'];
    const index = conditions.indexOf(condition);
    return index !== -1 ? [index / (conditions.length - 1)] : [0.5];
  }

  encodeCategory(category) {
    return this.generateCategoryEmbedding(category);
  }

  normalizeAge(age) {
    return Math.min(1.0, age / 20); // Normalize to 20 years max
  }

  normalizePrice(price) {
    return Math.min(1.0, Math.log10(price + 1) / 5); // Log scale normalization
  }

  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  compareConditions(condition1, condition2) {
    const conditionValues = { 'new': 5, 'like_new': 4, 'good': 3, 'fair': 2, 'poor': 1 };
    const val1 = conditionValues[condition1] || 3;
    const val2 = conditionValues[condition2] || 3;
    
    const diff = Math.abs(val1 - val2);
    return 1.0 - (diff / 4); // Normalize to 0-1
  }

  compareAges(age1, age2) {
    const maxAge = 20;
    const diff = Math.abs(age1 - age2);
    return 1.0 - Math.min(diff / maxAge, 1.0);
  }

  getIDF(word) {
    // Simplified IDF calculation - in production, this would use a large corpus
    const commonWords = new Set(['laptop', 'phone', 'computer', 'game', 'book', 'music', 'camera']);
    return commonWords.has(word) ? 0.5 : 1.0;
  }
}

// Export singleton instance
export default new SemanticMatchingService();