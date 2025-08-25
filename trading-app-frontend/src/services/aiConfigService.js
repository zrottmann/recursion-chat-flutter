/**
 * AI Configuration Service
 * Handles API key management, validation, and configuration for AI services
 */

import api from './api';

class AIConfigService {
  constructor() {
    this.config = {
      openai: {
        apiKey: null,
        organization: null,
        model: 'gpt-4-vision-preview',
        maxTokens: 500,
        temperature: 0.1,
        isConfigured: false,
        lastValidated: null
      },
      xai: {
        apiKey: import.meta.env.VITE_XAI_API_KEY || process.env.REACT_APP_XAI_API_KEY,
        model: import.meta.env.VITE_XAI_MODEL || process.env.REACT_APP_XAI_MODEL || 'grok-3',
        endpoint: import.meta.env.VITE_XAI_ENDPOINT || process.env.REACT_APP_XAI_ENDPOINT || 'https://api.x.ai/v1',
        maxTokens: 500,
        temperature: 0.1,
        isConfigured: false,
        lastValidated: null
      },
      usage: {
        dailyLimit: 100, // requests per day
        monthlyLimit: 2000, // requests per month
        costLimit: 50.00, // USD per month
        currentUsage: {
          daily: 0,
          monthly: 0,
          cost: 0
        }
      },
      fallback: {
        enableMockFallback: true,
        mockSuccessRate: 0.95,
        mockDelay: 2000
      }
    };
    
    this.listeners = new Set();
    this.loadConfiguration();
    this.initializeXAI();
  }

  /**
   * Initialize xAI configuration
   */
  initializeXAI() {
    // Auto-configure xAI if API key is available
    if (this.config.xai.apiKey && this.config.xai.apiKey !== 'undefined') {
      this.config.xai.isConfigured = true;
      console.log('✅ xAI auto-configured from environment variables');
    } else {
      console.log('⚠️ xAI API key not found in environment variables');
    }
  }

  /**
   * Load configuration from localStorage and validate
   */
  async loadConfiguration() {
    try {
      // Load from localStorage
      const savedConfig = localStorage.getItem('aiConfig');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.config = { ...this.config, ...parsed };
      }

      // Validate with backend
      await this.validateConfiguration();
      
    } catch (error) {
      console.error('Failed to load AI configuration:', error);
    }
  }

  /**
   * Save configuration to localStorage
   */
  saveConfiguration() {
    try {
      localStorage.setItem('aiConfig', JSON.stringify(this.config));
      this.notifyListeners('config_saved', this.config);
    } catch (error) {
      console.error('Failed to save AI configuration:', error);
    }
  }

  /**
   * Validate OpenAI API configuration
   */
  async validateConfiguration() {
    try {
      const response = await api.post('/api/ai/config/validate', {
        test_connection: true
      });

      const { data } = response;
      
      this.config.openai.isConfigured = data.openai_configured;
      this.config.openai.lastValidated = new Date().toISOString();
      
      // Validate xAI configuration if available
      if (data.xai_configured !== undefined) {
        this.config.xai.isConfigured = data.xai_configured;
        this.config.xai.lastValidated = new Date().toISOString();
      }
      
      if (data.usage_stats) {
        this.config.usage.currentUsage = data.usage_stats;
      }
      
      this.saveConfiguration();
      this.notifyListeners('config_validated', {
        isConfigured: this.config.openai.isConfigured || this.config.xai.isConfigured,
        openai: this.config.openai.isConfigured,
        xai: this.config.xai.isConfigured,
        usage: this.config.usage.currentUsage
      });
      
      return {
        success: true,
        configured: this.config.openai.isConfigured || this.config.xai.isConfigured,
        openai: this.config.openai.isConfigured,
        xai: this.config.xai.isConfigured,
        usage: this.config.usage.currentUsage
      };
      
    } catch (error) {
      console.error('Configuration validation failed:', error);
      
      this.config.openai.isConfigured = false;
      this.config.openai.lastValidated = new Date().toISOString();
      this.saveConfiguration();
      
      return {
        success: false,
        error: error.message,
        configured: false
      };
    }
  }

  /**
   * Configure OpenAI API key (admin only)
   */
  async configureOpenAI(apiKey, organization = null) {
    try {
      const response = await api.post('/api/ai/config/openai', {
        api_key: apiKey,
        organization: organization,
        test_connection: true
      });

      if (response.data.success) {
        this.config.openai.isConfigured = true;
        this.config.openai.lastValidated = new Date().toISOString();
        this.saveConfiguration();
        
        this.notifyListeners('openai_configured', {
          success: true,
          model: response.data.model_info
        });
        
        return { success: true, message: 'OpenAI configured successfully' };
      } else {
        throw new Error(response.data.error || 'Configuration failed');
      }
      
    } catch (error) {
      console.error('OpenAI configuration failed:', error);
      
      this.notifyListeners('openai_config_failed', {
        error: error.message
      });
      
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }

  /**
   * Configure xAI API key
   */
  async configureXAI(apiKey, model = 'grok-3', endpoint = 'https://api.x.ai/v1') {
    try {
      const response = await api.post('/api/ai/config/xai', {
        api_key: apiKey,
        model: model,
        endpoint: endpoint,
        test_connection: true
      });

      if (response.data.success) {
        this.config.xai.isConfigured = true;
        this.config.xai.lastValidated = new Date().toISOString();
        this.config.xai.model = model;
        this.config.xai.endpoint = endpoint;
        this.saveConfiguration();
        
        this.notifyListeners('xai_configured', {
          success: true,
          model: response.data.model_info
        });
        
        return { success: true, message: 'xAI configured successfully' };
      } else {
        throw new Error(response.data.error || 'Configuration failed');
      }
      
    } catch (error) {
      console.error('xAI configuration failed:', error);
      
      this.notifyListeners('xai_config_failed', {
        error: error.message
      });
      
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }

  /**
   * Check if API is ready for use
   */
  isAPIReady() {
    return (this.config.openai.isConfigured || this.config.xai.isConfigured) && !this.isUsageLimitExceeded();
  }

  /**
   * Check if xAI is ready for use
   */
  isXAIReady() {
    return this.config.xai.isConfigured && !this.isUsageLimitExceeded();
  }

  /**
   * Check if usage limits are exceeded
   */
  isUsageLimitExceeded() {
    const { currentUsage, dailyLimit, monthlyLimit, costLimit } = this.config.usage;
    
    return (
      currentUsage.daily >= dailyLimit ||
      currentUsage.monthly >= monthlyLimit ||
      currentUsage.cost >= costLimit
    );
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    const { currentUsage, dailyLimit, monthlyLimit, costLimit } = this.config.usage;
    
    return {
      daily: {
        used: currentUsage.daily,
        limit: dailyLimit,
        percentage: (currentUsage.daily / dailyLimit) * 100,
        remaining: Math.max(0, dailyLimit - currentUsage.daily)
      },
      monthly: {
        used: currentUsage.monthly,
        limit: monthlyLimit,
        percentage: (currentUsage.monthly / monthlyLimit) * 100,
        remaining: Math.max(0, monthlyLimit - currentUsage.monthly)
      },
      cost: {
        used: currentUsage.cost,
        limit: costLimit,
        percentage: (currentUsage.cost / costLimit) * 100,
        remaining: Math.max(0, costLimit - currentUsage.cost)
      }
    };
  }

  /**
   * Record API usage
   */
  async recordUsage(tokens, cost) {
    try {
      await api.post('/api/ai/usage/record', {
        tokens: tokens,
        cost: cost,
        timestamp: new Date().toISOString()
      });

      // Update local usage
      this.config.usage.currentUsage.daily += 1;
      this.config.usage.currentUsage.monthly += 1;
      this.config.usage.currentUsage.cost += cost;
      
      this.saveConfiguration();
      this.notifyListeners('usage_updated', this.getUsageStats());
      
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }

  /**
   * Update usage limits (admin only)
   */
  async updateUsageLimits(limits) {
    try {
      const response = await api.post('/api/ai/config/limits', limits);
      
      if (response.data.success) {
        this.config.usage = { ...this.config.usage, ...limits };
        this.saveConfiguration();
        
        this.notifyListeners('limits_updated', this.config.usage);
        return { success: true };
      }
      
    } catch (error) {
      console.error('Failed to update usage limits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset usage counters (admin only)
   */
  async resetUsage(period = 'daily') {
    try {
      const response = await api.post('/api/ai/usage/reset', { period });
      
      if (response.data.success) {
        if (period === 'daily') {
          this.config.usage.currentUsage.daily = 0;
        } else if (period === 'monthly') {
          this.config.usage.currentUsage.monthly = 0;
          this.config.usage.currentUsage.cost = 0;
        }
        
        this.saveConfiguration();
        this.notifyListeners('usage_reset', { period, usage: this.config.usage.currentUsage });
        return { success: true };
      }
      
    } catch (error) {
      console.error('Failed to reset usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cost estimation for analysis
   */
  estimateAnalysisCost(imageCount, imageSize = 'medium') {
    const sizeCostMultiplier = {
      small: 0.5,
      medium: 1.0,
      large: 1.5,
      xlarge: 2.0
    };
    
    const baseCost = 0.02; // Approximate cost per image
    const multiplier = sizeCostMultiplier[imageSize] || 1.0;
    
    return {
      estimatedCost: imageCount * baseCost * multiplier,
      tokensEstimate: imageCount * 300 * multiplier, // Rough token estimate
      currency: 'USD'
    };
  }

  /**
   * Check if analysis can proceed
   */
  canPerformAnalysis(imageCount, imageSize = 'medium') {
    if (!this.isAPIReady()) {
      return {
        allowed: false,
        reason: 'API not configured or limits exceeded',
        details: this.getUsageStats()
      };
    }
    
    const costEstimate = this.estimateAnalysisCost(imageCount, imageSize);
    const currentUsage = this.getUsageStats();
    
    if (currentUsage.cost.remaining < costEstimate.estimatedCost) {
      return {
        allowed: false,
        reason: 'Cost limit would be exceeded',
        estimate: costEstimate,
        remaining: currentUsage.cost.remaining
      };
    }
    
    if (currentUsage.daily.remaining < 1) {
      return {
        allowed: false,
        reason: 'Daily request limit exceeded',
        nextReset: this.getNextResetTime('daily')
      };
    }
    
    return {
      allowed: true,
      estimate: costEstimate,
      usage: currentUsage
    };
  }

  /**
   * Get next reset time for usage counters
   */
  getNextResetTime(period) {
    const now = new Date();
    
    if (period === 'daily') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.toISOString();
    }
    
    if (period === 'monthly') {
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth.toISOString();
    }
    
    return null;
  }

  /**
   * Get configuration summary
   */
  getConfigSummary() {
    return {
      openai: {
        configured: this.config.openai.isConfigured,
        model: this.config.openai.model,
        lastValidated: this.config.openai.lastValidated
      },
      xai: {
        configured: this.config.xai.isConfigured,
        model: this.config.xai.model,
        endpoint: this.config.xai.endpoint,
        lastValidated: this.config.xai.lastValidated
      },
      usage: this.getUsageStats(),
      fallback: this.config.fallback,
      ready: this.isAPIReady(),
      xaiReady: this.isXAIReady()
    };
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
  }

  /**
   * Export configuration for backup
   */
  exportConfiguration() {
    const exportData = {
      ...this.config,
      exported_at: new Date().toISOString(),
      version: '1.0'
    };
    
    // Remove sensitive data from export
    delete exportData.openai.apiKey;
    
    return exportData;
  }

  /**
   * Import configuration from backup
   */
  importConfiguration(configData) {
    try {
      if (!configData.version) {
        throw new Error('Invalid configuration format');
      }
      
      // Merge with current config, excluding sensitive data
      this.config = {
        ...this.config,
        ...configData,
        openai: {
          ...this.config.openai,
          ...configData.openai,
          apiKey: this.config.openai.apiKey // Keep current API key
        }
      };
      
      this.saveConfiguration();
      this.notifyListeners('config_imported', this.config);
      
      return { success: true };
      
    } catch (error) {
      console.error('Configuration import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      const response = await api.post('/api/ai/test', {
        test_type: 'connection',
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        latency: response.data.latency,
        model: response.data.model_info,
        limits: response.data.current_limits
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallback_available: this.config.fallback.enableMockFallback
      };
    }
  }
}

// Export singleton instance
const aiConfigService = new AIConfigService();
export default aiConfigService;