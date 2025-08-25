/**
 * AI Vision Service - Real OpenAI Vision API Integration
 * 
 * This service integrates with the OpenAI Vision API for real photo analysis
 * with intelligent fallback to mock data and cost optimization features.
 */

import api from './api';

class AIVisionService {
  constructor() {
    this.apiCache = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.config = {
      // Cost optimization settings
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 3, // Process up to 3 images in one request
      compressionQuality: 0.8,
      maxImageSize: 1024, // Max width/height in pixels
      retryAttempts: 3,
      retryDelay: 2000,
      
      // API configuration
      openaiModel: 'gpt-4-vision-preview',
      maxTokens: 500,
      temperature: 0.1,
      
      // Fallback configuration
      useMockFallback: true,
      mockDelay: 2000, // Simulate API delay
    };
    
    this.mockDatabase = this.initializeMockDatabase();
  }

  /**
   * Main photo analysis function with real OpenAI integration
   */
  async analyzePhotos(photos, options = {}) {
    try {
      const {
        enableBatching = true,
        enableCaching = true,
        priorityLevel = 'normal',
        userId = null
      } = options;

      console.log('🔍 Starting AI photo analysis:', {
        photoCount: photos.length,
        enableBatching,
        enableCaching,
        priorityLevel
      });

      // Generate cache key for this analysis
      const cacheKey = this.generateCacheKey(photos);
      
      // Check cache first if enabled
      if (enableCaching && this.apiCache.has(cacheKey)) {
        const cached = this.apiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.config.maxCacheAge) {
          console.log('📦 Returning cached analysis');
          return this.enhanceAnalysisResult(cached.data, true);
        }
      }

      // Prepare images for analysis
      const processedImages = await this.preprocessImages(photos);
      
      // Try real OpenAI API first
      try {
        const realAnalysis = await this.callOpenAIVisionAPI(processedImages, options);
        
        // Cache successful results
        if (enableCaching) {
          this.apiCache.set(cacheKey, {
            data: realAnalysis,
            timestamp: Date.now()
          });
        }
        
        return this.enhanceAnalysisResult(realAnalysis, false);
        
      } catch (apiError) {
        console.warn('⚠️ OpenAI API failed, falling back to mock:', apiError.message);
        
        // Fallback to sophisticated mock analysis
        const mockAnalysis = await this.generateMockAnalysis(processedImages, options);
        return this.enhanceAnalysisResult(mockAnalysis, false, true);
      }

    } catch (error) {
      console.error('❌ Photo analysis failed:', error);
      throw new Error('Failed to analyze photos: ' + error.message);
    }
  }

  /**
   * Call real OpenAI Vision API
   */
  async callOpenAIVisionAPI(images, options = {}) {
    try {
      // Check if API key is configured
      const hasApiKey = await this.validateAPIConfiguration();
      if (!hasApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: this.buildAnalysisPrompt(options)
            },
            ...images.map(img => ({
              type: "image_url",
              image_url: {
                url: img.dataUrl,
                detail: options.analysisDepth || "high"
              }
            }))
          ]
        }
      ];

      const response = await api.post('/api/ai/vision-analysis', {
        model: this.config.openaiModel,
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        user_id: options.userId
      });

      return this.parseOpenAIResponse(response.data, images);

    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive analysis prompt for OpenAI
   */
  buildAnalysisPrompt(options = {}) {
    const basePrompt = `
Analyze these photos of an item for a trading marketplace. Provide detailed analysis in JSON format with:

1. ITEM IDENTIFICATION:
   - Brand and model (if applicable)
   - Category and subcategory
   - Item type and specific features
   - Year/vintage (if determinable)

2. CONDITION ASSESSMENT:
   - Overall condition score (1-10)
   - Specific damage or wear noted
   - Functional status assessment
   - Completeness check

3. MARKET VALUATION:
   - Estimated current market value range
   - Factors affecting price (condition, rarity, demand)
   - Comparable item references
   - Market trend insights

4. PHOTO QUALITY:
   - Image clarity and lighting assessment
   - Coverage completeness (angles shown)
   - Suggestions for better photos

5. TRADING INSIGHTS:
   - Desirability score for trading
   - Target demographic
   - Seasonal factors
   - Quick-sale potential

Return structured JSON only, no explanatory text.`;

    // Add specific prompts based on detected category
    if (options.suggestedCategory) {
      return basePrompt + `\n\nFocus analysis on ${options.suggestedCategory} specific features and valuation factors.`;
    }

    return basePrompt;
  }

  /**
   * Parse OpenAI response into standardized format
   */
  parseOpenAIResponse(apiResponse, originalImages) {
    try {
      const content = apiResponse.choices[0].message.content;
      const analysisData = JSON.parse(content);

      return {
        success: true,
        analysis_id: `openai_${Date.now()}`,
        timestamp: new Date().toISOString(),
        
        // Item identification
        item_identification: {
          brand: analysisData.brand || 'Unknown',
          model: analysisData.model || 'Unknown',
          category: analysisData.category || 'General',
          subcategory: analysisData.subcategory || '',
          item_type: analysisData.item_type || '',
          features: analysisData.features || [],
          year: analysisData.year || null
        },

        // Condition assessment
        condition_assessment: {
          overall_score: analysisData.condition_score || 7,
          condition_details: analysisData.condition_details || [],
          functional_status: analysisData.functional_status || 'working',
          completeness: analysisData.completeness || 'complete',
          damage_notes: analysisData.damage_notes || []
        },

        // Market valuation
        market_valuation: {
          estimated_value_min: analysisData.value_range?.min || 0,
          estimated_value_max: analysisData.value_range?.max || 0,
          confidence_level: analysisData.confidence || 0.8,
          market_factors: analysisData.market_factors || [],
          comparable_items: analysisData.comparables || [],
          trend_analysis: analysisData.trends || 'stable'
        },

        // Photo quality
        photo_analysis: {
          overall_quality: analysisData.photo_quality || 0.8,
          clarity_score: analysisData.clarity || 0.8,
          lighting_score: analysisData.lighting || 0.8,
          coverage_score: analysisData.coverage || 0.7,
          suggestions: analysisData.photo_suggestions || []
        },

        // Trading insights
        trading_insights: {
          desirability_score: analysisData.desirability || 0.7,
          target_demographic: analysisData.target_demographic || 'general',
          seasonal_factors: analysisData.seasonal || [],
          quick_sale_potential: analysisData.quick_sale || 0.6,
          trading_tips: analysisData.trading_tips || []
        },

        // Metadata
        api_source: 'openai',
        model_used: this.config.openaiModel,
        token_usage: apiResponse.usage,
        processing_time: Date.now(),
        image_count: originalImages.length
      };

    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid API response format');
    }
  }

  /**
   * Validate API configuration
   */
  async validateAPIConfiguration() {
    try {
      const response = await api.get('/api/ai/config/validate');
      return response.data.openai_configured;
    } catch (error) {
      console.warn('API configuration check failed:', error);
      return false;
    }
  }

  /**
   * Preprocess images for API submission
   */
  async preprocessImages(photos) {
    const processedImages = [];

    for (const photo of photos) {
      try {
        // Convert to data URL if needed
        const dataUrl = await this.convertToDataUrl(photo);
        
        // Compress and resize for cost optimization
        const optimizedDataUrl = await this.optimizeImage(dataUrl);
        
        processedImages.push({
          original: photo,
          dataUrl: optimizedDataUrl,
          size: this.calculateDataUrlSize(optimizedDataUrl)
        });

      } catch (error) {
        console.error('Image preprocessing failed:', error);
        // Continue with other images
      }
    }

    return processedImages;
  }

  /**
   * Convert photo to data URL
   */
  async convertToDataUrl(photo) {
    if (typeof photo === 'string' && photo.startsWith('data:')) {
      return photo;
    }

    if (photo.blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(photo.blob);
      });
    }

    if (photo.preview) {
      // Convert preview URL to data URL
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = photo.preview;
      });
    }

    throw new Error('Invalid photo format');
  }

  /**
   * Optimize image for API submission
   */
  async optimizeImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions
        const maxSize = this.config.maxImageSize;
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', this.config.compressionQuality));
      };
      img.src = dataUrl;
    });
  }

  /**
   * Calculate data URL size in bytes
   */
  calculateDataUrlSize(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    return Math.round((base64.length * 3) / 4);
  }

  /**
   * Generate cache key for analysis
   */
  generateCacheKey(photos) {
    const photoHashes = photos.map(photo => {
      if (photo.hash) return photo.hash;
      return photo.name || photo.timestamp || Math.random().toString();
    });
    return `analysis_${photoHashes.join('_')}`;
  }

  /**
   * Enhanced mock analysis for fallback
   */
  async generateMockAnalysis(images, options = {}) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.config.mockDelay));

    const mockItems = this.getMockItemData();
    const randomItem = mockItems[Math.floor(Math.random() * mockItems.length)];

    return {
      success: true,
      analysis_id: `mock_${Date.now()}`,
      timestamp: new Date().toISOString(),
      
      item_identification: {
        brand: randomItem.brand,
        model: randomItem.model,
        category: randomItem.category,
        subcategory: randomItem.subcategory,
        item_type: randomItem.type,
        features: randomItem.features,
        year: randomItem.year
      },

      condition_assessment: {
        overall_score: Math.floor(Math.random() * 3) + 7, // 7-9
        condition_details: randomItem.condition_notes,
        functional_status: 'working',
        completeness: 'complete',
        damage_notes: []
      },

      market_valuation: {
        estimated_value_min: randomItem.value_range.min,
        estimated_value_max: randomItem.value_range.max,
        confidence_level: 0.75 + Math.random() * 0.2,
        market_factors: randomItem.market_factors,
        comparable_items: randomItem.comparables,
        trend_analysis: randomItem.trend
      },

      photo_analysis: {
        overall_quality: 0.7 + Math.random() * 0.25,
        clarity_score: 0.8 + Math.random() * 0.15,
        lighting_score: 0.75 + Math.random() * 0.2,
        coverage_score: images.length > 1 ? 0.9 : 0.6,
        suggestions: images.length === 1 ? 
          ['Consider taking photos from multiple angles for better coverage'] : 
          ['Excellent multi-angle coverage']
      },

      trading_insights: {
        desirability_score: 0.6 + Math.random() * 0.3,
        target_demographic: randomItem.target_demo,
        seasonal_factors: randomItem.seasonal,
        quick_sale_potential: 0.5 + Math.random() * 0.4,
        trading_tips: randomItem.trading_tips
      },

      api_source: 'mock',
      model_used: 'mock_vision_v1',
      processing_time: Date.now(),
      image_count: images.length
    };
  }

  /**
   * Initialize mock database for fallback
   */
  initializeMockDatabase() {
    return [
      {
        brand: 'Apple',
        model: 'iPhone 12',
        category: 'Electronics',
        subcategory: 'Smartphones',
        type: 'smartphone',
        features: ['5G capable', 'Face ID', '12MP camera'],
        year: 2020,
        value_range: { min: 400, max: 600 },
        condition_notes: ['Minor scratches on corners', 'Screen in excellent condition'],
        market_factors: ['High demand', 'Apple ecosystem appeal'],
        comparables: ['iPhone 11', 'Samsung Galaxy S21'],
        trend: 'stable',
        target_demo: 'tech enthusiasts',
        seasonal: ['Back to school season boost'],
        trading_tips: ['Include original box and accessories for higher value']
      },
      {
        brand: 'Sony',
        model: 'PlayStation 5',
        category: 'Gaming',
        subcategory: 'Consoles',
        type: 'gaming console',
        features: ['4K gaming', 'Ray tracing', 'SSD storage'],
        year: 2020,
        value_range: { min: 450, max: 700 },
        condition_notes: ['Excellent condition', 'All ports functional'],
        market_factors: ['Still high demand', 'Limited availability'],
        comparables: ['Xbox Series X', 'Gaming PC'],
        trend: 'increasing',
        target_demo: 'gamers',
        seasonal: ['Holiday season peak'],
        trading_tips: ['Bundle with games for better trading appeal']
      },
      {
        brand: 'Canon',
        model: 'EOS R6',
        category: 'Photography',
        subcategory: 'Cameras',
        type: 'mirrorless camera',
        features: ['20MP sensor', '4K video', 'Image stabilization'],
        year: 2020,
        value_range: { min: 1800, max: 2200 },
        condition_notes: ['Professional condition', 'Low shutter count'],
        market_factors: ['Professional demand', 'Brand reputation'],
        comparables: ['Sony A7 III', 'Nikon Z6'],
        trend: 'stable',
        target_demo: 'photographers',
        seasonal: ['Wedding season demand'],
        trading_tips: ['Include lenses and accessories for complete package']
      }
    ];
  }

  /**
   * Get mock item data
   */
  getMockItemData() {
    return this.mockDatabase;
  }

  /**
   * Enhance analysis result with additional insights
   */
  enhanceAnalysisResult(analysis, fromCache = false, isMock = false) {
    return {
      ...analysis,
      
      // Enhanced metadata
      result_metadata: {
        from_cache: fromCache,
        is_mock_data: isMock,
        confidence_level: analysis.market_valuation?.confidence_level || 0.8,
        processing_quality: this.calculateProcessingQuality(analysis),
        recommendations: this.generateRecommendations(analysis)
      },
      
      // Cost tracking
      cost_info: {
        estimated_tokens: analysis.token_usage?.total_tokens || 0,
        estimated_cost_usd: this.estimateAPIcost(analysis.token_usage),
        cache_hit: fromCache,
        optimization_savings: fromCache ? 'Saved API call through caching' : null
      },
      
      // Enhanced suggestions
      listing_suggestions: this.generateListingSuggestions(analysis),
      pricing_recommendations: this.generatePricingRecommendations(analysis),
      improvement_tips: this.generateImprovementTips(analysis)
    };
  }

  /**
   * Calculate processing quality score
   */
  calculateProcessingQuality(analysis) {
    let score = 0.5; // Base score
    
    if (analysis.photo_analysis?.overall_quality > 0.8) score += 0.2;
    if (analysis.condition_assessment?.overall_score >= 8) score += 0.1;
    if (analysis.image_count > 1) score += 0.15;
    if (analysis.market_valuation?.confidence_level > 0.8) score += 0.15;
    
    return Math.min(1.0, score);
  }

  /**
   * Generate listing suggestions
   */
  generateListingSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.item_identification) {
      suggestions.push({
        type: 'title',
        suggestion: `${analysis.item_identification.brand} ${analysis.item_identification.model}`,
        confidence: 0.9
      });
      
      suggestions.push({
        type: 'category',
        suggestion: analysis.item_identification.category,
        confidence: 0.85
      });
    }
    
    if (analysis.condition_assessment) {
      suggestions.push({
        type: 'condition',
        suggestion: `Condition Score: ${analysis.condition_assessment.overall_score}/10`,
        confidence: 0.8
      });
    }
    
    return suggestions;
  }

  /**
   * Generate pricing recommendations
   */
  generatePricingRecommendations(analysis) {
    if (!analysis.market_valuation) return null;
    
    const { estimated_value_min, estimated_value_max, confidence_level } = analysis.market_valuation;
    
    return {
      suggested_price: Math.round((estimated_value_min + estimated_value_max) / 2),
      price_range: {
        min: estimated_value_min,
        max: estimated_value_max
      },
      confidence: confidence_level,
      strategy: confidence_level > 0.8 ? 'aggressive' : 'conservative',
      notes: [
        'Based on current market analysis',
        'Consider condition and completeness',
        'Adjust for local market conditions'
      ]
    };
  }

  /**
   * Generate improvement tips
   */
  generateImprovementTips(analysis) {
    const tips = [];
    
    if (analysis.photo_analysis?.suggestions) {
      tips.push(...analysis.photo_analysis.suggestions.map(s => ({
        category: 'photos',
        tip: s,
        impact: 'medium'
      })));
    }
    
    if (analysis.trading_insights?.trading_tips) {
      tips.push(...analysis.trading_insights.trading_tips.map(s => ({
        category: 'trading',
        tip: s,
        impact: 'high'
      })));
    }
    
    return tips;
  }

  /**
   * Estimate API cost
   */
  estimateAPIcost(tokenUsage) {
    if (!tokenUsage) return 0;
    
    // OpenAI pricing (approximate)
    const costPerToken = 0.00003; // $0.03 per 1K tokens
    return (tokenUsage.total_tokens || 0) * costPerToken;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.apiCache.clear();
    console.log('🧹 AI Vision cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      entries: this.apiCache.size,
      memoryUsage: this.apiCache.size * 1024, // Rough estimate
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }
}

// Export singleton instance
const aiVisionService = new AIVisionService();
export default aiVisionService;