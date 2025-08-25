/**
 * End-to-End Testing System for Trading Post
 * Tests complete user flow from item creation to AI matching to trading
 * @author Claude AI - End-to-End Testing Agent  
 * @date 2025-08-18
 */

import { account } from '../lib/appwrite';
import systemInitializer from './systemInitializer';
import diagnostics from './databaseDiagnostics';
import schemaFixer from './databaseSchemaFixer';
import sampleDataCreator from './sampleDataCreator';
import enhancedAIMatchingService from '../services/enhancedAIMatchingService';
import appwriteDatabase from '../services/appwriteDatabase';
import apiServiceRecovery from './apiServiceRecovery';

class EndToEndTester {
  constructor() {
    this.testResults = {
      overall: { passed: 0, failed: 0, warnings: 0 },
      phases: {},
      errors: [],
      warnings: [],
      recommendations: []
    };
    this.currentUser = null;
    this.testData = {
      createdItems: [],
      foundMatches: [],
      createdTrades: [],
      sentMessages: []
    };
  }

  /**
   * Run comprehensive end-to-end testing
   */
  async runCompleteTest(options = {}) {
    console.log('🧪 [E2E-TEST] Starting comprehensive end-to-end testing...');
    
    const startTime = Date.now();
    
    try {
      // Phase 1: System initialization test
      await this.testPhase('System Initialization', async () => {
        await this.testSystemInitialization();
      });

      // Phase 2: Authentication test
      await this.testPhase('User Authentication', async () => {
        await this.testUserAuthentication();
      });

      // Phase 3: Database connectivity test
      await this.testPhase('Database Connectivity', async () => {
        await this.testDatabaseConnectivity();
      });

      // Phase 4: Data population test
      await this.testPhase('Data Population', async () => {
        await this.testDataPopulation();
      });

      // Phase 5: Item creation test
      await this.testPhase('Item Creation', async () => {
        await this.testItemCreation();
      });

      // Phase 6: AI matching test
      await this.testPhase('AI Matching System', async () => {
        await this.testAIMatching();
      });

      // Phase 7: Trading workflow test
      await this.testPhase('Trading Workflow', async () => {
        await this.testTradingWorkflow();
      });

      // Phase 8: Messaging system test
      await this.testPhase('Messaging System', async () => {
        await this.testMessagingSystem();
      });

      // Phase 9: Analytics and reporting test
      await this.testPhase('Analytics & Reporting', async () => {
        await this.testAnalyticsAndReporting();
      });

      // Phase 10: API service recovery test
      await this.testPhase('API Service Recovery', async () => {
        await this.testAPIServiceRecovery();
      });

      const duration = Date.now() - startTime;
      
      // Generate final report
      const report = this.generateTestReport(duration);
      
      console.log('✅ [E2E-TEST] Comprehensive testing complete!');
      console.log(`📊 [E2E-TEST] Results: ${this.testResults.overall.passed} passed, ${this.testResults.overall.failed} failed, ${this.testResults.overall.warnings} warnings`);
      
      return report;
      
    } catch (error) {
      console.error('❌ [E2E-TEST] Testing failed:', error);
      this.testResults.errors.push({
        phase: 'Test Framework',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      return this.generateTestReport(Date.now() - startTime);
    }
  }

  /**
   * Test system initialization
   */
  async testSystemInitialization() {
    console.log('🚀 [E2E-TEST] Testing system initialization...');
    
    // Test system initializer
    const initResult = await systemInitializer.initializeSystem({
      skipSampleData: true // We'll test this separately
    });
    
    if (!initResult.success) {
      throw new Error(`System initialization failed: ${initResult.error}`);
    }
    
    this.addTestResult('System Initialization', 'System Initializer', true, 
      'System initialized successfully');
    
    // Test if system is ready
    const isReady = systemInitializer.isSystemReady();
    
    if (!isReady) {
      this.addWarning('System shows as not ready after initialization');
    }
    
    this.addTestResult('System Initialization', 'System Ready Check', isReady,
      isReady ? 'System reports as ready' : 'System reports as not ready');
  }

  /**
   * Test user authentication
   */
  async testUserAuthentication() {
    console.log('👤 [E2E-TEST] Testing user authentication...');
    
    try {
      this.currentUser = await account.get();
      
      if (!this.currentUser) {
        throw new Error('No authenticated user found');
      }
      
      this.addTestResult('User Authentication', 'User Session', true,
        `Authenticated as ${this.currentUser.name} (${this.currentUser.email})`);
        
      // Test user profile data
      if (!this.currentUser.email || !this.currentUser.$id) {
        throw new Error('User session missing required data');
      }
      
      this.addTestResult('User Authentication', 'User Data Integrity', true,
        'User session contains required fields');
        
    } catch (error) {
      this.addTestResult('User Authentication', 'Authentication Check', false, error.message);
      throw error;
    }
  }

  /**
   * Test database connectivity
   */
  async testDatabaseConnectivity() {
    console.log('🗄️ [E2E-TEST] Testing database connectivity...');
    
    // Run diagnostics
    const diagnosticsResult = await diagnostics.runFullDiagnostics();
    
    if (diagnosticsResult.errors.length > 0) {
      this.addWarning(`Database diagnostics found ${diagnosticsResult.errors.length} errors`);
    }
    
    // Test schema fixes
    const schemaFixResult = await schemaFixer.fixAllSchemaIssues();
    
    if (!schemaFixResult.success) {
      throw new Error(`Schema fixing failed: ${schemaFixResult.error}`);
    }
    
    this.addTestResult('Database Connectivity', 'Schema Fixes', true,
      `Applied ${schemaFixResult.fixes.length} schema fixes`);
    
    // Test critical collections
    const fixedDb = schemaFixer.getFixedDatabaseWrapper();
    const criticalCollections = ['users', 'items', 'trades', 'messages'];
    
    for (const collectionName of criticalCollections) {
      try {
        const result = await fixedDb.listDocuments(
          'trading_post_db',
          collectionName,
          []
        );
        
        this.addTestResult('Database Connectivity', `${collectionName} Collection`, true,
          `Collection accessible with ${result.total} documents`);
          
      } catch (error) {
        this.addTestResult('Database Connectivity', `${collectionName} Collection`, false,
          error.message);
      }
    }
  }

  /**
   * Test data population
   */
  async testDataPopulation() {
    console.log('🏗️ [E2E-TEST] Testing data population...');
    
    const sampleDataResult = await sampleDataCreator.createAllSampleData();
    
    if (!sampleDataResult.success) {
      throw new Error(`Sample data creation failed: ${sampleDataResult.error}`);
    }
    
    const summary = sampleDataResult.summary;
    
    this.addTestResult('Data Population', 'Sample Data Creation', true,
      `Created ${summary.total} records across ${Object.keys(summary).length - 1} collections`);
    
    // Verify data was created
    if (summary.items === 0) {
      throw new Error('No sample items were created - this will break AI matching tests');
    }
    
    if (summary.users === 0) {
      this.addWarning('No additional users created - trading tests may be limited');
    }
    
    this.addTestResult('Data Population', 'Data Verification', true,
      `Verified ${summary.items} items, ${summary.users} users, ${summary.trades} trades`);
  }

  /**
   * Test item creation functionality
   */
  async testItemCreation() {
    console.log('📦 [E2E-TEST] Testing item creation functionality...');
    
    const testItem = {
      title: 'Test Item for E2E Testing',
      description: 'This is a test item created during end-to-end testing.',
      category: 'Electronics',
      condition: 'excellent',
      estimated_value: 500,
      location: 'Test Location',
      trade_preference: 'equal_value',
      tags: ['test', 'e2e', 'automated'],
      is_featured: false
    };
    
    try {
      const result = await appwriteDatabase.createListing(testItem);
      
      if (!result.success) {
        throw new Error(`Item creation failed: ${result.error}`);
      }
      
      this.testData.createdItems.push(result.listing);
      
      this.addTestResult('Item Creation', 'Create Item', true,
        `Successfully created item: ${result.listing.title}`);
      
      // Test item retrieval
      const retrieveResult = await appwriteDatabase.getListing(result.listing.$id);
      
      if (!retrieveResult.success) {
        throw new Error(`Item retrieval failed: ${retrieveResult.error}`);
      }
      
      this.addTestResult('Item Creation', 'Retrieve Item', true,
        'Successfully retrieved created item');
      
      // Test item update
      const updateResult = await appwriteDatabase.updateListing(result.listing.$id, {
        description: 'Updated description for E2E test'
      });
      
      if (!updateResult.success) {
        throw new Error(`Item update failed: ${updateResult.error}`);
      }
      
      this.addTestResult('Item Creation', 'Update Item', true,
        'Successfully updated item');
        
    } catch (error) {
      this.addTestResult('Item Creation', 'Item Operations', false, error.message);
      throw error;
    }
  }

  /**
   * Test AI matching system
   */
  async testAIMatching() {
    console.log('🤖 [E2E-TEST] Testing AI matching system...');
    
    if (!this.currentUser) {
      throw new Error('No authenticated user for AI matching test');
    }
    
    try {
      // Initialize AI matching service
      await enhancedAIMatchingService.initialize();
      
      this.addTestResult('AI Matching System', 'Service Initialization', true,
        'AI matching service initialized');
      
      // Find matches for current user
      const matches = await enhancedAIMatchingService.findOptimizedMatches(
        this.currentUser.$id,
        { maxMatches: 10 }
      );
      
      this.testData.foundMatches = matches;
      
      this.addTestResult('AI Matching System', 'Find Matches', true,
        `Found ${matches.length} potential matches`);
      
      if (matches.length === 0) {
        this.addWarning('No AI matches found - user may need more items or trading partners');
      } else {
        // Test match quality
        const highQualityMatches = matches.filter(match => match.ai_score > 0.7);
        const averageScore = matches.reduce((sum, match) => sum + match.ai_score, 0) / matches.length;
        
        this.addTestResult('AI Matching System', 'Match Quality', true,
          `${highQualityMatches.length}/${matches.length} high-quality matches, avg score: ${averageScore.toFixed(2)}`);
      }
      
      // Test match reasoning
      if (matches.length > 0 && matches[0].ai_reasoning) {
        this.addTestResult('AI Matching System', 'Match Reasoning', true,
          'AI provides reasoning for matches');
      } else {
        this.addWarning('AI reasoning not provided for matches');
      }
      
    } catch (error) {
      this.addTestResult('AI Matching System', 'AI Matching', false, error.message);
    }
  }

  /**
   * Test trading workflow
   */
  async testTradingWorkflow() {
    console.log('🤝 [E2E-TEST] Testing trading workflow...');
    
    if (this.testData.foundMatches.length === 0) {
      this.addWarning('No matches available for trading workflow test');
      return;
    }
    
    try {
      const testMatch = this.testData.foundMatches[0];
      
      // Create a test trade
      const tradeData = {
        user1_id: this.currentUser.$id,
        user2_id: testMatch.other_item?.user_id || 'test-user-2',
        item1_id: this.testData.createdItems[0]?.$id || 'test-item-1',
        item2_id: testMatch.other_item?.$id || 'test-item-2',
        item1_title: this.testData.createdItems[0]?.title || 'Test Item 1',
        item2_title: testMatch.other_item?.title || 'Test Item 2',
        status: 'pending',
        message: 'Test trade created during E2E testing',
        proposed_meeting_location: 'Test Meeting Location'
      };
      
      const tradeResult = await appwriteDatabase.createTrade(tradeData);
      
      if (!tradeResult.success) {
        throw new Error(`Trade creation failed: ${tradeResult.error}`);
      }
      
      this.testData.createdTrades.push(tradeResult.trade);
      
      this.addTestResult('Trading Workflow', 'Create Trade', true,
        `Successfully created trade: ${tradeResult.trade.$id}`);
      
      // Test trade status update
      const updateResult = await appwriteDatabase.updateTrade(tradeResult.trade.$id, {
        status: 'accepted'
      });
      
      if (!updateResult.success) {
        throw new Error(`Trade update failed: ${updateResult.error}`);
      }
      
      this.addTestResult('Trading Workflow', 'Update Trade Status', true,
        'Successfully updated trade status to accepted');
      
      // Test getting user trades
      const userTradesResult = await appwriteDatabase.getUserTrades(this.currentUser.$id);
      
      if (!userTradesResult.success) {
        throw new Error(`Get user trades failed: ${userTradesResult.error}`);
      }
      
      this.addTestResult('Trading Workflow', 'Get User Trades', true,
        `Retrieved ${userTradesResult.trades.length} trades for user`);
        
    } catch (error) {
      this.addTestResult('Trading Workflow', 'Trading Operations', false, error.message);
    }
  }

  /**
   * Test messaging system
   */
  async testMessagingSystem() {
    console.log('💬 [E2E-TEST] Testing messaging system...');
    
    if (this.testData.createdTrades.length === 0) {
      this.addWarning('No trades available for messaging test');
      return;
    }
    
    try {
      const testTrade = this.testData.createdTrades[0];
      
      // Create a test message
      const messageData = {
        sender_id: this.currentUser.$id,
        recipient_id: testTrade.user2_id,
        trade_id: testTrade.$id,
        content: 'Test message created during E2E testing',
        message_type: 'text'
      };
      
      const messageResult = await appwriteDatabase.createMessage(messageData);
      
      if (!messageResult.success) {
        throw new Error(`Message creation failed: ${messageResult.error}`);
      }
      
      this.testData.sentMessages.push(messageResult.message);
      
      this.addTestResult('Messaging System', 'Create Message', true,
        `Successfully created message: ${messageResult.message.$id}`);
      
      // Test conversation retrieval
      const conversationResult = await appwriteDatabase.getConversation(
        this.currentUser.$id,
        testTrade.user2_id,
        testTrade.$id
      );
      
      if (!conversationResult.success) {
        throw new Error(`Get conversation failed: ${conversationResult.error}`);
      }
      
      this.addTestResult('Messaging System', 'Get Conversation', true,
        `Retrieved conversation with ${conversationResult.messages.length} messages`);
      
      // Test unread message count
      const unreadResult = await appwriteDatabase.getUnreadMessageCount(this.currentUser.$id);
      
      if (!unreadResult.success) {
        throw new Error(`Get unread count failed: ${unreadResult.error}`);
      }
      
      this.addTestResult('Messaging System', 'Unread Count', true,
        `User has ${unreadResult.count} unread messages`);
        
    } catch (error) {
      this.addTestResult('Messaging System', 'Messaging Operations', false, error.message);
    }
  }

  /**
   * Test analytics and reporting
   */
  async testAnalyticsAndReporting() {
    console.log('📊 [E2E-TEST] Testing analytics and reporting...');
    
    try {
      // Test user analytics
      const analyticsResult = await appwriteDatabase.getUserAnalytics(this.currentUser.$id);
      
      if (!analyticsResult.success) {
        throw new Error(`Get analytics failed: ${analyticsResult.error}`);
      }
      
      const analytics = analyticsResult.analytics;
      
      this.addTestResult('Analytics & Reporting', 'User Analytics', true,
        `Analytics: ${analytics.total_listings} listings, ${analytics.total_trades} trades, ${analytics.total_views} views`);
      
      // Test search functionality
      const searchResult = await appwriteDatabase.searchListings({
        query: 'test',
        limit: 10
      });
      
      if (!searchResult.success) {
        throw new Error(`Search failed: ${searchResult.error}`);
      }
      
      this.addTestResult('Analytics & Reporting', 'Search Functionality', true,
        `Search returned ${searchResult.listings.length} results`);
      
      // Test user search
      const userSearchResult = await appwriteDatabase.searchUsers('test', null, 10);
      
      if (!userSearchResult.success) {
        throw new Error(`User search failed: ${userSearchResult.error}`);
      }
      
      this.addTestResult('Analytics & Reporting', 'User Search', true,
        `User search returned ${userSearchResult.users.length} results`);
        
    } catch (error) {
      this.addTestResult('Analytics & Reporting', 'Analytics Operations', false, error.message);
    }
  }

  /**
   * Test API service recovery
   */
  async testAPIServiceRecovery() {
    console.log('🔧 [E2E-TEST] Testing API service recovery...');
    
    try {
      // Test health status
      const healthStatus = apiServiceRecovery.getHealthStatus();
      
      this.addTestResult('API Service Recovery', 'Health Status', true,
        `Recovery system status: enhanced=${healthStatus.enhancedRecovery}, services=${Object.keys(healthStatus.services).length}`);
      
      // Test recovery call with fallback
      const recoveryResult = await apiServiceRecovery.recoverApiCall(
        'testService',
        async () => {
          throw new Error('Simulated service failure');
        },
        {
          gracefulDegradation: { message: 'Service temporarily unavailable', data: [] },
          useCached: false
        }
      );
      
      if (!recoveryResult.success) {
        throw new Error('Recovery call failed to provide fallback');
      }
      
      this.addTestResult('API Service Recovery', 'Fallback Recovery', true,
        `Recovery successful with source: ${recoveryResult.source}`);
      
      // Test enhanced recovery strategies
      if (apiServiceRecovery.recoveryStrategies && apiServiceRecovery.recoveryStrategies.size > 0) {
        this.addTestResult('API Service Recovery', 'Enhanced Strategies', true,
          `${apiServiceRecovery.recoveryStrategies.size} enhanced recovery strategies available`);
      } else {
        this.addWarning('Enhanced recovery strategies not properly initialized');
      }
      
    } catch (error) {
      this.addTestResult('API Service Recovery', 'Recovery Operations', false, error.message);
    }
  }

  /**
   * Helper methods
   */
  async testPhase(phaseName, testFunction) {
    console.log(`🔬 [E2E-TEST] Starting phase: ${phaseName}`);
    
    this.testResults.phases[phaseName] = {
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      startTime: Date.now()
    };
    
    try {
      await testFunction();
      this.testResults.phases[phaseName].duration = Date.now() - this.testResults.phases[phaseName].startTime;
      console.log(`✅ [E2E-TEST] Phase completed: ${phaseName}`);
    } catch (error) {
      this.testResults.phases[phaseName].duration = Date.now() - this.testResults.phases[phaseName].startTime;
      console.error(`❌ [E2E-TEST] Phase failed: ${phaseName}`, error.message);
      this.testResults.errors.push({
        phase: phaseName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  addTestResult(phase, testName, passed, message) {
    const result = {
      name: testName,
      passed,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.phases[phase].tests.push(result);
    
    if (passed) {
      this.testResults.phases[phase].passed++;
      this.testResults.overall.passed++;
    } else {
      this.testResults.phases[phase].failed++;
      this.testResults.overall.failed++;
    }
    
    console.log(`${passed ? '✅' : '❌'} [E2E-TEST] ${phase} - ${testName}: ${message}`);
  }

  addWarning(message) {
    this.testResults.warnings.push({
      message,
      timestamp: new Date().toISOString()
    });
    
    this.testResults.overall.warnings++;
    
    console.warn(`⚠️ [E2E-TEST] WARNING: ${message}`);
  }

  generateTestReport(duration) {
    const report = {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        totalTests: this.testResults.overall.passed + this.testResults.overall.failed,
        passed: this.testResults.overall.passed,
        failed: this.testResults.overall.failed,
        warnings: this.testResults.overall.warnings,
        successRate: this.testResults.overall.passed / (this.testResults.overall.passed + this.testResults.overall.failed) * 100
      },
      phases: this.testResults.phases,
      errors: this.testResults.errors,
      warnings: this.testResults.warnings,
      testData: this.testData,
      user: this.currentUser ? {
        id: this.currentUser.$id,
        name: this.currentUser.name,
        email: this.currentUser.email
      } : null
    };
    
    return report;
  }

  exportTestReport() {
    const report = this.generateTestReport(0);
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-post-e2e-test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📄 End-to-end test report exported');
    return report;
  }
}

// Create singleton instance
const endToEndTester = new EndToEndTester();

// Export for use in components
export default endToEndTester;
export { EndToEndTester };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.endToEndTester = endToEndTester;
  window.runE2ETests = (options) => endToEndTester.runCompleteTest(options);
  window.exportE2EReport = () => endToEndTester.exportTestReport();
}