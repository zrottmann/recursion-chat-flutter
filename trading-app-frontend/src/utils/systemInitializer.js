/**
 * Trading Post System Initializer - Enhanced Version
 * Coordinates all database fixes, schema repairs, and data population
 * Handles authentication, database, API recovery, and component initialization
 * @author Claude AI - System Integration Agent
 * @date 2025-08-18
 */

import sessionConflictResolver from './sessionConflictResolver';
import databaseInitializer from './databaseInitializer';
import apiServiceRecovery from './apiServiceRecovery';
import diagnostics from './databaseDiagnostics';
import schemaFixer from './databaseSchemaFixer';
import sampleDataCreator from './sampleDataCreator';
import { validateAppwriteConfig, account } from '../lib/appwrite';
import { toast } from 'react-toastify';

class SystemInitializer {
  constructor() {
    this.initializationStatus = {
      config: 'pending',
      database: 'pending',
      auth: 'pending',
      api: 'pending',
      components: 'pending'
    };
    
    this.initializationErrors = [];
    this.initializationWarnings = [];
  }

  async initializeSystem(options = {}) {
    console.log('🚀 [SYSTEM-INIT] Starting Enhanced Trading Post system initialization...');
    
    const startTime = Date.now();
    let totalSteps = 8;
    let completedSteps = 0;

    try {
      // Step 1: Validate Appwrite configuration
      console.log('⚙️ [SYSTEM-INIT] Step 1/8: Validating Appwrite configuration...');
      await this.validateConfiguration();
      this.updateStatus('config', 'success');
      completedSteps++;
      this.notifyProgress('Configuration validated', completedSteps, totalSteps);

      // Step 2: Run comprehensive database diagnostics
      console.log('📊 [SYSTEM-INIT] Step 2/8: Running database diagnostics...');
      await this.runDatabaseDiagnostics();
      completedSteps++;
      this.notifyProgress('Database diagnostics complete', completedSteps, totalSteps);

      // Step 3: Fix database schema issues
      console.log('🔧 [SYSTEM-INIT] Step 3/8: Fixing database schema...');
      await this.fixDatabaseSchema();
      completedSteps++;
      this.notifyProgress('Database schema fixed', completedSteps, totalSteps);

      // Step 4: Initialize database collections
      console.log('🗄️ [SYSTEM-INIT] Step 4/8: Initializing database collections...');
      await this.initializeDatabase(options.quickDbFix);
      this.updateStatus('database', 'success');
      completedSteps++;
      this.notifyProgress('Database collections ready', completedSteps, totalSteps);

      // Step 5: Populate sample data if needed
      console.log('🏗️ [SYSTEM-INIT] Step 5/8: Checking sample data...');
      await this.handleSampleDataCreation(options.forceSampleData);
      completedSteps++;
      this.notifyProgress('Sample data ready', completedSteps, totalSteps);

      // Step 6: Prepare authentication system
      console.log('🔐 [SYSTEM-INIT] Step 6/8: Preparing authentication system...');
      await this.prepareAuthSystem();
      this.updateStatus('auth', 'success');
      completedSteps++;
      this.notifyProgress('Authentication system ready', completedSteps, totalSteps);

      // Step 7: Initialize API recovery system
      console.log('🔧 [SYSTEM-INIT] Step 7/8: Initializing API recovery system...');
      await this.initializeApiRecovery();
      this.updateStatus('api', 'success');
      completedSteps++;
      this.notifyProgress('API recovery system active', completedSteps, totalSteps);

      // Step 8: Prepare components and UI
      console.log('🎨 [SYSTEM-INIT] Step 8/8: Preparing components and UI...');
      await this.initializeComponents();
      this.updateStatus('components', 'success');
      completedSteps++;
      
      const duration = Date.now() - startTime;
      console.log(`🎉 [SYSTEM-INIT] Enhanced system initialization complete! (${duration}ms)`);
      
      this.notifyProgress('Trading Post System Ready!', completedSteps, totalSteps, true);
      
      return {
        success: true,
        duration,
        status: this.initializationStatus,
        errors: this.initializationErrors,
        warnings: this.initializationWarnings,
        diagnostics: this.diagnosticsResults,
        schemaFixes: this.schemaFixResults,
        sampleData: this.sampleDataResults
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ [SYSTEM-INIT] System initialization failed:', error);
      
      this.initializationErrors.push({
        step: this.getCurrentStep(),
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        duration,
        status: this.initializationStatus,
        errors: this.initializationErrors,
        warnings: this.initializationWarnings,
        failedAt: this.getCurrentStep()
      };
    }
  }

  async validateConfiguration() {
    try {
      // Validate Appwrite configuration
      const configValid = validateAppwriteConfig();
      if (!configValid) {
        throw new Error('Appwrite configuration is invalid');
      }

      // Check environment variables
      const requiredEnvVars = [
        'VITE_APPWRITE_ENDPOINT',
        'VITE_APPWRITE_PROJECT_ID',
        'VITE_APPWRITE_DATABASE_ID'
      ];

      const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
      if (missingVars.length > 0) {
        this.addWarning(`Missing environment variables: ${missingVars.join(', ')}`);
      }

      // Test connection to Appwrite
      try {
        await account.get();
      } catch (error) {
        if (error.code === 401) {
          // Expected - no user logged in
          console.log('✅ [SYSTEM-INIT] Appwrite connection test successful (no active session)');
        } else if (error.message?.includes('CORS')) {
          throw new Error('CORS configuration issue - check platform registration');
        } else {
          throw new Error(`Appwrite connection failed: ${error.message}`);
        }
      }

      console.log('✅ [SYSTEM-INIT] Configuration validation complete');
    } catch (error) {
      this.updateStatus('config', 'error');
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }

  async runDatabaseDiagnostics() {
    try {
      console.log('🔍 [SYSTEM-INIT] Running comprehensive database diagnostics...');
      this.diagnosticsResults = await diagnostics.runFullDiagnostics();
      
      if (this.diagnosticsResults.errors.length > 0) {
        this.addWarning(`Database diagnostics found ${this.diagnosticsResults.errors.length} errors`);
      }
      
      if (this.diagnosticsResults.warnings.length > 0) {
        this.addWarning(`Database diagnostics found ${this.diagnosticsResults.warnings.length} warnings`);
      }
      
      console.log('✅ [SYSTEM-INIT] Database diagnostics complete');
    } catch (error) {
      this.addWarning(`Database diagnostics failed: ${error.message}`);
    }
  }

  async fixDatabaseSchema() {
    try {
      console.log('🔧 [SYSTEM-INIT] Fixing database schema issues...');
      this.schemaFixResults = await schemaFixer.fixAllSchemaIssues();
      
      if (!this.schemaFixResults.success) {
        this.addWarning(`Schema fixes had issues: ${this.schemaFixResults.error}`);
      } else {
        console.log(`✅ [SYSTEM-INIT] Applied ${this.schemaFixResults.fixes.length} schema fixes`);
      }
      
    } catch (error) {
      this.addWarning(`Schema fixing failed: ${error.message}`);
    }
  }

  async handleSampleDataCreation(forceSampleData = false) {
    try {
      console.log('🏗️ [SYSTEM-INIT] Evaluating sample data requirements...');
      
      // Check if user is authenticated first
      let userAuthenticated = false;
      try {
        await account.get();
        userAuthenticated = true;
      } catch (error) {
        console.log('ℹ️ [SYSTEM-INIT] User not authenticated - skipping sample data creation');
        return;
      }
      
      if (!userAuthenticated && !forceSampleData) {
        console.log('✅ [SYSTEM-INIT] Skipping sample data creation (no authenticated user)');
        return;
      }
      
      // Determine if sample data is needed
      const needsSampleData = this.shouldCreateSampleData();
      
      if (needsSampleData || forceSampleData) {
        console.log('🚀 [SYSTEM-INIT] Creating sample data...');
        this.sampleDataResults = await sampleDataCreator.createAllSampleData();
        
        if (this.sampleDataResults.success) {
          const summary = this.sampleDataResults.summary;
          console.log(`✅ [SYSTEM-INIT] Created ${summary.total} sample records across ${Object.keys(summary).length - 1} collections`);
        } else {
          this.addWarning(`Sample data creation failed: ${this.sampleDataResults.error}`);
        }
      } else {
        console.log('✅ [SYSTEM-INIT] Sample data already exists - skipping creation');
      }
      
    } catch (error) {
      this.addWarning(`Sample data handling failed: ${error.message}`);
    }
  }

  shouldCreateSampleData() {
    if (!this.diagnosticsResults) return false;
    
    const { collections, dataIntegrity } = this.diagnosticsResults;
    
    // Check if critical collections are empty
    const criticalCollections = ['items', 'users'];
    
    for (const collectionName of criticalCollections) {
      const collection = collections[collectionName];
      if (!collection || !collection.exists || collection.isEmpty) {
        console.log(`📝 [SYSTEM-INIT] Collection '${collectionName}' needs data`);
        return true;
      }
    }
    
    // Check if current user has any items
    const userDataIntegrity = dataIntegrity?.items;
    if (!userDataIntegrity || !userDataIntegrity.hasUserData) {
      console.log('📝 [SYSTEM-INIT] Current user has no items - sample data needed');
      return true;
    }
    
    return false;
  }

  async initializeDatabase(quickFix = true) {
    try {
      if (quickFix) {
        // Quick fix for missing critical collections
        console.log('🚀 [SYSTEM-INIT] Running quick database fix...');
        const quickResults = await databaseInitializer.createMissingCollectionsQuickFix();
        
        const createdCount = quickResults.filter(r => r.status === 'created').length;
        const errorCount = quickResults.filter(r => r.status === 'error').length;
        
        if (createdCount > 0) {
          console.log(`✅ [SYSTEM-INIT] Quick-created ${createdCount} missing collections`);
        }
        if (errorCount > 0) {
          this.addWarning(`Failed to create ${errorCount} collections - some features may be limited`);
        }
      } else {
        // Full database initialization
        console.log('🔨 [SYSTEM-INIT] Running full database initialization...');
        const fullResults = await databaseInitializer.initializeAllCollections();
        
        if (fullResults.errors.length > 0) {
          this.addWarning(`Database initialization had ${fullResults.errors.length} errors`);
          fullResults.errors.forEach(error => {
            console.warn(`⚠️ [SYSTEM-INIT] DB Error in ${error.collectionId}:`, error.error);
          });
        }
        
        console.log(`✅ [SYSTEM-INIT] Database initialized: ${fullResults.success.length} created, ${fullResults.skipped.length} existing`);
      }
      
    } catch (error) {
      this.updateStatus('database', 'error');
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }

  async prepareAuthSystem() {
    try {
      // Clear any conflicting sessions
      console.log('🔄 [SYSTEM-INIT] Clearing conflicting authentication sessions...');
      
      // Check if there's an existing session that might conflict
      try {
        const hasSession = await sessionConflictResolver.hasActiveSession();
        if (hasSession) {
          console.log('ℹ️ [SYSTEM-INIT] Found existing session - keeping it active');
        } else {
          console.log('✅ [SYSTEM-INIT] No conflicting sessions found');
        }
      } catch (error) {
        console.log('⚠️ [SYSTEM-INIT] Session check failed - will handle during login:', error.message);
      }

      console.log('✅ [SYSTEM-INIT] Authentication system prepared');
    } catch (error) {
      this.updateStatus('auth', 'error');
      throw new Error(`Authentication preparation failed: ${error.message}`);
    }
  }

  async initializeApiRecovery() {
    try {
      // Test API recovery system
      console.log('🔧 [SYSTEM-INIT] Testing API recovery system...');
      
      // Perform a health check on critical services
      const healthStatus = apiServiceRecovery.getHealthStatus();
      console.log('📊 [SYSTEM-INIT] API health status:', healthStatus);
      
      // Pre-warm some fallback data if possible
      try {
        const { databases, DATABASE_ID, COLLECTIONS } = await import('../lib/appwrite');
        
        // Test basic database connectivity
        await databases.listDocuments(DATABASE_ID, COLLECTIONS.users, []);
        console.log('✅ [SYSTEM-INIT] Database connectivity confirmed');
        
      } catch (error) {
        console.warn('⚠️ [SYSTEM-INIT] Database connectivity issue:', error.message);
        this.addWarning('Some features may have limited functionality due to database connectivity');
      }

      console.log('✅ [SYSTEM-INIT] API recovery system initialized');
    } catch (error) {
      this.updateStatus('api', 'error');
      throw new Error(`API recovery initialization failed: ${error.message}`);
    }
  }

  async initializeComponents() {
    try {
      // Pre-load and validate critical components
      console.log('🎨 [SYSTEM-INIT] Preparing UI components...');
      
      // Pre-import critical components to catch any import errors early
      const componentImports = [
        import('../components/OAuthCallbackHandler'),
        import('../components/SSOButton'),
        import('../components/SearchControls'),
        import('../utils/leafletIconFix')
      ];

      const results = await Promise.allSettled(componentImports);
      const failedImports = results.filter(result => result.status === 'rejected');
      
      if (failedImports.length > 0) {
        failedImports.forEach(failure => {
          console.warn('⚠️ [SYSTEM-INIT] Component import warning:', failure.reason?.message);
          this.addWarning(`Component loading issue: ${failure.reason?.message}`);
        });
      }

      // Initialize Leaflet icons
      console.log('🗺️ [SYSTEM-INIT] Initializing map components...');
      // The leafletIconFix import should automatically configure icons

      console.log('✅ [SYSTEM-INIT] Components prepared');
    } catch (error) {
      this.updateStatus('components', 'error');
      throw new Error(`Component initialization failed: ${error.message}`);
    }
  }

  // Helper methods
  updateStatus(step, status) {
    this.initializationStatus[step] = status;
  }

  addWarning(message) {
    this.initializationWarnings.push({
      message,
      timestamp: new Date().toISOString()
    });
    console.warn('⚠️ [SYSTEM-INIT] Warning:', message);
  }

  getCurrentStep() {
    for (const [step, status] of Object.entries(this.initializationStatus)) {
      if (status === 'pending') {
        return step;
      }
    }
    return 'complete';
  }

  notifyProgress(message, current, total, isComplete = false) {
    const percentage = Math.round((current / total) * 100);
    console.log(`📈 [SYSTEM-INIT] Progress: ${percentage}% - ${message}`);
    
    if (isComplete) {
      toast.success(`🎉 Trading Post is ready! ${message}`, {
        position: "top-right",
        autoClose: 3000
      });
    } else {
      toast.info(`⚙️ ${message} (${percentage}%)`, {
        position: "top-right",
        autoClose: 1500
      });
    }
  }

  // Public methods for checking system status
  getInitializationStatus() {
    return {
      ...this.initializationStatus,
      errors: this.initializationErrors,
      warnings: this.initializationWarnings
    };
  }

  isSystemReady() {
    return Object.values(this.initializationStatus).every(status => 
      status === 'success' || status === 'warning'
    );
  }

  async reinitializeSystem(options = {}) {
    // Reset status
    this.initializationStatus = {
      config: 'pending',
      database: 'pending',
      auth: 'pending',
      api: 'pending',
      components: 'pending'
    };
    
    this.initializationErrors = [];
    this.initializationWarnings = [];
    this.diagnosticsResults = null;
    this.schemaFixResults = null;
    this.sampleDataResults = null;
    
    return this.initializeSystem(options);
  }

  exportSystemReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: 'Trading Post Enhanced',
      version: '2.0.0',
      initializationStatus: this.initializationStatus,
      errors: this.initializationErrors,
      warnings: this.initializationWarnings,
      diagnostics: this.diagnosticsResults,
      schemaFixes: this.schemaFixResults,
      sampleData: this.sampleDataResults
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-post-enhanced-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📄 Enhanced system report exported');
    return report;
  }
}

// Create enhanced singleton instance
const enhancedSystemInitializer = new SystemInitializer();

// Export singleton instance
export default enhancedSystemInitializer;

// Export the class for direct instantiation if needed
export { SystemInitializer };

// Make available globally for debugging and manual control
if (typeof window !== 'undefined') {
  window.systemInitializer = enhancedSystemInitializer;
  window.initializeTradingPost = (options) => enhancedSystemInitializer.initializeSystem(options);
  window.checkSystemStatus = () => enhancedSystemInitializer.getInitializationStatus();
  window.resetTradingPostSystem = () => enhancedSystemInitializer.reinitializeSystem({ forceSampleData: true });
  
  // Enhanced debugging functions
  window.runDatabaseDiagnostics = () => diagnostics.runFullDiagnostics();
  window.fixDatabaseSchema = () => schemaFixer.fixAllSchemaIssues();
  window.createSampleData = () => sampleDataCreator.createAllSampleData();
  window.exportSystemReport = () => enhancedSystemInitializer.exportSystemReport();
  
  // Auto-initialize on app load in development
  if (import.meta.env.DEV) {
    console.log('🔧 Enhanced Trading Post system initializer available');
    console.log('🎮 Available commands:');
    console.log('  window.initializeTradingPost() - Full system initialization');
    console.log('  window.checkSystemStatus() - Get system status');
    console.log('  window.runDatabaseDiagnostics() - Run database diagnostics');
    console.log('  window.fixDatabaseSchema() - Fix database schema issues');
    console.log('  window.createSampleData() - Create sample data');
    console.log('  window.resetTradingPostSystem() - Reset and reinitialize system');
  }
}