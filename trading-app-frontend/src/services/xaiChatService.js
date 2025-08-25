/**
 * xAI Chat Service
 * Handles integration with xAI's Grok API for chat functionality
 */

class XAIChatService {
  constructor() {
    this.apiKey = import.meta.env.VITE_XAI_API_KEY || process.env.REACT_APP_XAI_API_KEY;
    this.model = import.meta.env.VITE_XAI_MODEL || process.env.REACT_APP_XAI_MODEL || 'grok-3';
    this.endpoint = import.meta.env.VITE_XAI_ENDPOINT || process.env.REACT_APP_XAI_ENDPOINT || 'https://api.x.ai/v1';
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    if (!this.apiKey) {
      console.warn('xAI API key not configured. Chat AI features will be disabled.');
    }
  }

  /**
   * Check if xAI service is properly configured
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Generate AI response for chat message
   * @param {string} message - User message
   * @param {Object} context - Chat context (conversation history, item details, etc.)
   * @returns {Promise<Object>} AI response
   */
  async generateChatResponse(message, context = {}) {
    if (!this.isConfigured()) {
      throw new Error('xAI API not configured');
    }

    const { conversationHistory = [], itemContext = null, userPreferences = {} } = context;
    
    try {
      const systemPrompt = this.buildSystemPrompt(itemContext, userPreferences);
      const messages = this.buildMessageHistory(conversationHistory, message, systemPrompt);
      
      const response = await this.callXAIAPI(messages);
      
      return {
        success: true,
        message: response.content,
        model: this.model,
        tokens: response.usage?.total_tokens || 0,
        cost: this.estimateCost(response.usage?.total_tokens || 0),
        timestamp: new Date().toISOString(),
        suggestions: this.extractSuggestions(response.content)
      };
      
    } catch (error) {
      console.error('xAI chat response generation failed:', error);
      
      return {
        success: false,
        error: error.message,
        fallback: this.generateFallbackResponse(message, context)
      };
    }
  }

  /**
   * Generate smart conversation suggestions
   * @param {Object} context - Chat context
   * @returns {Promise<Array>} Suggested conversation starters
   */
  async generateConversationSuggestions(context = {}) {
    if (!this.isConfigured()) {
      return this.getDefaultSuggestions(context);
    }

    const { itemContext = null, userProfile = null } = context;
    
    try {
      const prompt = this.buildSuggestionsPrompt(itemContext, userProfile);
      const messages = [
        { role: 'system', content: 'You are a helpful assistant for a trading/bartering platform. Generate conversation starter suggestions.' },
        { role: 'user', content: prompt }
      ];
      
      const response = await this.callXAIAPI(messages, { max_tokens: 200, temperature: 0.7 });
      
      return this.parseSuggestions(response.content);
      
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      return this.getDefaultSuggestions(context);
    }
  }

  /**
   * Analyze message for trade opportunities and insights
   * @param {string} message - Message to analyze
   * @param {Object} context - Trade context
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeTradeMessage(message, context = {}) {
    if (!this.isConfigured()) {
      return { insights: [], sentiment: 'neutral', tradeSignals: [] };
    }

    try {
      const prompt = this.buildAnalysisPrompt(message, context);
      const messages = [
        { role: 'system', content: 'Analyze this trading/bartering message for insights, sentiment, and opportunities.' },
        { role: 'user', content: prompt }
      ];
      
      const response = await this.callXAIAPI(messages, { max_tokens: 300, temperature: 0.3 });
      
      return this.parseAnalysis(response.content);
      
    } catch (error) {
      console.error('Message analysis failed:', error);
      return { insights: [], sentiment: 'neutral', tradeSignals: [] };
    }
  }

  /**
   * Call xAI API with retry logic
   * @param {Array} messages - Message history
   * @param {Object} options - API options
   * @returns {Promise<Object>} API response
   */
  async callXAIAPI(messages, options = {}) {
    const requestOptions = {
      model: this.model,
      messages: messages,
      max_tokens: options.max_tokens || 500,
      temperature: options.temperature || 0.1,
      stream: false,
      ...options
    };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(requestOptions)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`xAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid API response format');
        }

        return {
          content: data.choices[0].message.content,
          usage: data.usage,
          model: data.model,
          finish_reason: data.choices[0].finish_reason
        };
        
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        console.warn(`xAI API attempt ${attempt} failed:`, error.message);
        await this.delay(this.retryDelay * attempt);
      }
    }
  }

  /**
   * Build system prompt for chat context
   */
  buildSystemPrompt(itemContext, userPreferences) {
    let prompt = `You are a helpful AI assistant for a community trading and bartering platform called Trading Post. You help users communicate effectively about trades, provide insights about items, and facilitate fair exchanges.

Guidelines:
- Be friendly, helpful, and encouraging
- Focus on facilitating fair and beneficial trades
- Provide practical advice about items and their value
- Suggest creative trade possibilities
- Maintain a community-focused tone
- Never provide financial advice or exact monetary valuations`;

    if (itemContext) {
      prompt += `\n\nCurrent item context: ${JSON.stringify(itemContext)}`;
    }

    if (userPreferences.interests) {
      prompt += `\n\nUser interests: ${userPreferences.interests.join(', ')}`;
    }

    return prompt;
  }

  /**
   * Build message history for API call
   */
  buildMessageHistory(conversationHistory, currentMessage, systemPrompt) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 10 messages to stay within token limits)
    const recentHistory = conversationHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.sender_id ? 'user' : 'assistant',
        content: msg.content
      });
    });

    // Add current message
    messages.push({
      role: 'user',
      content: currentMessage
    });

    return messages;
  }

  /**
   * Build prompt for conversation suggestions
   */
  buildSuggestionsPrompt(itemContext, userProfile) {
    let prompt = 'Generate 3-5 conversation starter suggestions for a trading platform chat. ';
    
    if (itemContext) {
      prompt += `The conversation is about "${itemContext.title}" (${itemContext.category}). `;
    }
    
    prompt += 'Suggestions should be friendly, trade-focused, and help users connect. Return as a simple list.';
    
    return prompt;
  }

  /**
   * Build prompt for message analysis
   */
  buildAnalysisPrompt(message, context) {
    return `Analyze this trading message for insights:
"${message}"

Context: ${JSON.stringify(context)}

Provide:
1. Sentiment (positive/neutral/negative)
2. Key insights about trade interest
3. Potential trade signals or opportunities
4. Response suggestions

Format as JSON.`;
  }

  /**
   * Parse suggestions from AI response
   */
  parseSuggestions(content) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      const suggestions = lines
        .map(line => line.replace(/^[\d\-*•]\s*/, '').trim())
        .filter(line => line.length > 0 && line.length < 100)
        .slice(0, 5);
      
      return suggestions.length > 0 ? suggestions : this.getDefaultSuggestions();
    } catch (error) {
      return this.getDefaultSuggestions();
    }
  }

  /**
   * Parse analysis results
   */
  parseAnalysis(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing
      return {
        sentiment: content.toLowerCase().includes('positive') ? 'positive' : 
                  content.toLowerCase().includes('negative') ? 'negative' : 'neutral',
        insights: ['Analysis completed'],
        tradeSignals: []
      };
    } catch (error) {
      return { insights: [], sentiment: 'neutral', tradeSignals: [] };
    }
  }

  /**
   * Extract suggestions from response content
   */
  extractSuggestions(content) {
    const suggestions = [];
    
    // Look for question patterns
    const questions = content.match(/[.!?]+\s*([A-Z][^.!?]*\?)/g);
    if (questions) {
      suggestions.push(...questions.slice(0, 2));
    }
    
    return suggestions;
  }

  /**
   * Generate fallback response when AI is unavailable
   */
  generateFallbackResponse(message, context) {
    const fallbacks = [
      "Thanks for your message! I'd be happy to discuss this trade opportunity.",
      "That sounds interesting! Can you tell me more about what you're looking for?",
      "I appreciate you reaching out. Let's see if we can work something out!",
      "Great to hear from you! What did you have in mind for this trade?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  /**
   * Get default conversation suggestions
   */
  getDefaultSuggestions(context = {}) {
    const defaults = [
      "Hi! I'm interested in your item. Is it still available?",
      "Would you be open to a trade? I have some items you might like.",
      "Can you tell me more about the condition of this item?",
      "What kind of items are you looking for in exchange?",
      "Would you consider a partial trade plus cash?"
    ];
    
    return defaults.slice(0, 3);
  }

  /**
   * Estimate API cost based on tokens
   */
  estimateCost(tokens) {
    // xAI pricing (approximate - update with actual pricing)
    const costPerToken = 0.000002; // Rough estimate
    return tokens * costPerToken;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
const xaiChatService = new XAIChatService();
export default xaiChatService;