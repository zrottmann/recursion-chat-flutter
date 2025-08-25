/**
 * Deployment Validator for Trading Post
 * Final validation before deployment to production
 * @author Claude AI - Deployment Validation Agent
 * @date 2025-08-18
 */

import systemInitializer from './systemInitializer';
import endToEndTester from './endToEndTester';
import diagnostics from './databaseDiagnostics';
import schemaFixer from './databaseSchemaFixer';
import apiServiceRecovery from './apiServiceRecovery';
import { account } from '../lib/appwrite';

class DeploymentValidator {
  constructor() {
    this.validationResults = {
      overall: { status: 'pending', score: 0 },
      categories: {},
      criticalIssues: [],
      warnings: [],
      recommendations: []
    };
  }

  /**
   * Run comprehensive deployment validation
   */
  async validateDeploymentReadiness(options = {}) {
    console.log('🚀 [DEPLOY-VALIDATE] Starting deployment validation...');
    
    const startTime = Date.now();
    
    try {
      // Category 1: System Health (25% weight)
      await this.validateSystemHealth();
      
      // Category 2: Database Integrity (25% weight)
      await this.validateDatabaseIntegrity();
      
      // Category 3: Core Functionality (30% weight)
      await this.validateCoreFunctionality();
      
      // Category 4: Performance & Recovery (20% weight)
      await this.validatePerformanceAndRecovery();
      
      // Calculate overall score and status
      this.calculateOverallScore();
      
      const duration = Date.now() - startTime;
      
      // Generate deployment readiness report
      const report = this.generateDeploymentReport(duration);
      
      console.log(`✅ [DEPLOY-VALIDATE] Validation complete! Overall score: ${this.validationResults.overall.score}%`);
      console.log(`📊 [DEPLOY-VALIDATE] Status: ${this.validationResults.overall.status}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ [DEPLOY-VALIDATE] Validation failed:', error);
      
      this.validationResults.criticalIssues.push({
        type: 'VALIDATION_FRAMEWORK_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.validationResults.overall.status = 'failed';
      
      return this.generateDeploymentReport(Date.now() - startTime);
    }
  }

  /**
   * Validate system health
   */
  async validateSystemHealth() {
    console.log('🏥 [DEPLOY-VALIDATE] Validating system health...');
    
    const categoryResults = {
      score: 0,
      maxScore: 100,
      tests: [],
      weight: 0.25
    };
    
    try {
      // Test system initialization
      const initResult = await systemInitializer.initializeSystem();
      
      if (initResult.success) {
        categoryResults.tests.push({
          name: 'System Initialization',
          passed: true,
          score: 30,
          message: 'System initialized successfully'
        });
        categoryResults.score += 30;
      } else {
        categoryResults.tests.push({
          name: 'System Initialization',
          passed: false,
          score: 0,
          message: `System initialization failed: ${initResult.error}`
        });
        
        this.validationResults.criticalIssues.push({
          type: 'SYSTEM_INIT_FAILURE',
          message: initResult.error
        });
      }
      
      // Test system readiness
      const isReady = systemInitializer.isSystemReady();
      
      if (isReady) {
        categoryResults.tests.push({
          name: 'System Readiness',
          passed: true,
          score: 20,
          message: 'All system components ready'
        });
        categoryResults.score += 20;
      } else {
        categoryResults.tests.push({
          name: 'System Readiness',
          passed: false,
          score: 0,
          message: 'System components not ready'
        });
        
        this.validationResults.warnings.push({
          type: 'SYSTEM_NOT_READY',
          message: 'System reports as not ready'
        });
      }
      
      // Test authentication
      try {
        const user = await account.get();
        
        categoryResults.tests.push({
          name: 'Authentication System',
          passed: true,
          score: 25,
          message: `Authentication working (user: ${user.email})`
        });
        categoryResults.score += 25;
        
      } catch (authError) {
        if (authError.code === 401) {
          categoryResults.tests.push({
            name: 'Authentication System',
            passed: true,
            score: 20,
            message: 'Authentication endpoint accessible (no active session)'
          });
          categoryResults.score += 20;
        } else {
          categoryResults.tests.push({
            name: 'Authentication System',
            passed: false,
            score: 0,
            message: `Authentication error: ${authError.message}`
          });
          
          this.validationResults.criticalIssues.push({
            type: 'AUTH_SYSTEM_FAILURE',
            message: authError.message
          });
        }
      }
      
      // Test API service recovery
      const recoveryHealth = apiServiceRecovery.getHealthStatus();
      
      if (recoveryHealth.enhancedRecovery) {
        categoryResults.tests.push({
          name: 'API Service Recovery',
          passed: true,
          score: 25,
          message: 'Enhanced recovery system operational'
        });
        categoryResults.score += 25;
      } else {
        categoryResults.tests.push({
          name: 'API Service Recovery',
          passed: false,
          score: 10,
          message: 'Basic recovery only - enhanced features not available'
        });
        categoryResults.score += 10;
        
        this.validationResults.warnings.push({
          type: 'LIMITED_RECOVERY',
          message: 'Enhanced API recovery not fully operational'
        });
      }
      
    } catch (error) {
      this.validationResults.criticalIssues.push({
        type: 'SYSTEM_HEALTH_ERROR',
        message: error.message
      });
    }
    
    this.validationResults.categories['System Health'] = categoryResults;
  }

  /**
   * Validate database integrity
   */
  async validateDatabaseIntegrity() {
    console.log('🗄️ [DEPLOY-VALIDATE] Validating database integrity...');
    
    const categoryResults = {
      score: 0,
      maxScore: 100,
      tests: [],
      weight: 0.25
    };
    
    try {
      // Run database diagnostics
      const diagnosticsResult = await diagnostics.runFullDiagnostics();
      
      if (diagnosticsResult.errors.length === 0) {
        categoryResults.tests.push({
          name: 'Database Diagnostics',
          passed: true,
          score: 30,
          message: 'All database collections accessible'
        });
        categoryResults.score += 30;
      } else {
        categoryResults.tests.push({
          name: 'Database Diagnostics',
          passed: false,
          score: 15,
          message: `${diagnosticsResult.errors.length} database errors found`
        });
        categoryResults.score += 15;
        
        this.validationResults.warnings.push({
          type: 'DATABASE_ERRORS',
          message: `Database has ${diagnosticsResult.errors.length} errors`
        });
      }
      
      // Test schema fixes
      const schemaResult = await schemaFixer.fixAllSchemaIssues();
      
      if (schemaResult.success) {
        categoryResults.tests.push({
          name: 'Schema Fixes',
          passed: true,
          score: 30,
          message: `Applied ${schemaResult.fixes.length} schema fixes`
        });
        categoryResults.score += 30;
      } else {
        categoryResults.tests.push({
          name: 'Schema Fixes',
          passed: false,
          score: 0,
          message: `Schema fixing failed: ${schemaResult.error}`
        });
        
        this.validationResults.criticalIssues.push({
          type: 'SCHEMA_FIX_FAILURE',
          message: schemaResult.error
        });
      }
      
      // Test data integrity
      const hasUserData = diagnosticsResult.dataIntegrity?.items?.hasUserData;
      const hasItems = diagnosticsResult.collections?.items?.totalDocuments > 0;
      
      if (hasItems && hasUserData) {
        categoryResults.tests.push({
          name: 'Data Population',
          passed: true,
          score: 40,
          message: 'Sufficient data available for testing'
        });
        categoryResults.score += 40;
      } else if (hasItems) {
        categoryResults.tests.push({
          name: 'Data Population',
          passed: true,
          score: 25,
          message: 'Basic data available but user has no items'
        });
        categoryResults.score += 25;
        
        this.validationResults.warnings.push({
          type: 'LIMITED_USER_DATA',
          message: 'Current user has no items - may affect matching'
        });
      } else {
        categoryResults.tests.push({
          name: 'Data Population',
          passed: false,
          score: 0,
          message: 'Insufficient data for proper testing'
        });
        
        this.validationResults.criticalIssues.push({
          type: 'INSUFFICIENT_DATA',
          message: 'No items found in database'
        });
      }
      
    } catch (error) {
      this.validationResults.criticalIssues.push({
        type: 'DATABASE_INTEGRITY_ERROR',
        message: error.message
      });
    }
    
    this.validationResults.categories['Database Integrity'] = categoryResults;
  }

  /**
   * Validate core functionality
   */
  async validateCoreFunctionality() {
    console.log('⚙️ [DEPLOY-VALIDATE] Validating core functionality...');
    
    const categoryResults = {
      score: 0,
      maxScore: 100,
      tests: [],
      weight: 0.30
    };
    
    try {
      // Run end-to-end tests (abbreviated version for validation)
      const e2eResult = await endToEndTester.runCompleteTest({
        skipLongRunningTests: true
      });
      
      const successRate = e2eResult.summary.successRate;
      
      if (successRate >= 90) {
        categoryResults.tests.push({
          name: 'End-to-End Tests',
          passed: true,
          score: 50,
          message: `${successRate.toFixed(1)}% success rate (${e2eResult.summary.passed}/${e2eResult.summary.totalTests})`
        });
        categoryResults.score += 50;
      } else if (successRate >= 70) {
        categoryResults.tests.push({
          name: 'End-to-End Tests',
          passed: true,
          score: 35,
          message: `${successRate.toFixed(1)}% success rate - some issues found`
        });
        categoryResults.score += 35;
        
        this.validationResults.warnings.push({
          type: 'PARTIAL_E2E_SUCCESS',
          message: `E2E tests at ${successRate.toFixed(1)}% success rate`
        });
      } else {
        categoryResults.tests.push({
          name: 'End-to-End Tests',
          passed: false,
          score: 0,
          message: `${successRate.toFixed(1)}% success rate - major issues found`
        });
        
        this.validationResults.criticalIssues.push({
          type: 'E2E_TESTS_FAILED',
          message: `E2E tests only ${successRate.toFixed(1)}% successful`
        });
      }
      
      // Check critical functionality phases
      const criticalPhases = ['User Authentication', 'Database Connectivity', 'AI Matching System'];
      let criticalPhasesScore = 0;
      
      for (const phaseName of criticalPhases) {
        const phase = e2eResult.phases[phaseName];
        if (phase && phase.passed > phase.failed) {
          criticalPhasesScore += 1;
        }
      }
      
      if (criticalPhasesScore === criticalPhases.length) {
        categoryResults.tests.push({
          name: 'Critical Features',
          passed: true,
          score: 30,
          message: 'All critical features operational'
        });
        categoryResults.score += 30;
      } else {
        categoryResults.tests.push({
          name: 'Critical Features',
          passed: false,
          score: Math.floor((criticalPhasesScore / criticalPhases.length) * 30),
          message: `${criticalPhasesScore}/${criticalPhases.length} critical features working`
        });
        categoryResults.score += Math.floor((criticalPhasesScore / criticalPhases.length) * 30);
        
        this.validationResults.criticalIssues.push({
          type: 'CRITICAL_FEATURES_FAILED',
          message: `${criticalPhases.length - criticalPhasesScore} critical features not working`
        });
      }
      
      // Check for any error count
      if (e2eResult.errors.length === 0) {
        categoryResults.tests.push({
          name: 'Error-Free Operation',
          passed: true,
          score: 20,
          message: 'No errors during functionality testing'
        });
        categoryResults.score += 20;
      } else {
        categoryResults.tests.push({
          name: 'Error-Free Operation',
          passed: false,
          score: Math.max(0, 20 - e2eResult.errors.length * 5),
          message: `${e2eResult.errors.length} errors during testing`
        });
        categoryResults.score += Math.max(0, 20 - e2eResult.errors.length * 5);
        
        this.validationResults.warnings.push({
          type: 'OPERATION_ERRORS',
          message: `${e2eResult.errors.length} errors during functionality testing`
        });
      }
      
    } catch (error) {
      this.validationResults.criticalIssues.push({
        type: 'CORE_FUNCTIONALITY_ERROR',
        message: error.message
      });
    }
    
    this.validationResults.categories['Core Functionality'] = categoryResults;
  }

  /**
   * Validate performance and recovery
   */
  async validatePerformanceAndRecovery() {
    console.log('🚀 [DEPLOY-VALIDATE] Validating performance and recovery...');
    
    const categoryResults = {
      score: 0,
      maxScore: 100,
      tests: [],
      weight: 0.20
    };
    
    try {
      // Test API recovery capabilities
      const recoveryTest = await apiServiceRecovery.recoverApiCall(
        'deploymentValidationTest',
        async () => {
          throw new Error('Simulated failure for recovery test');
        },
        {
          gracefulDegradation: { status: 'degraded', message: 'Service temporarily limited' },
          mockData: { test: 'recovery_working' }
        }
      );
      
      if (recoveryTest.success) {
        categoryResults.tests.push({
          name: 'API Recovery',
          passed: true,
          score: 40,
          message: `Recovery successful with ${recoveryTest.source} source`
        });
        categoryResults.score += 40;
      } else {
        categoryResults.tests.push({
          name: 'API Recovery',
          passed: false,
          score: 0,
          message: 'API recovery system failed'
        });
        
        this.validationResults.criticalIssues.push({
          type: 'API_RECOVERY_FAILURE',
          message: 'API recovery system not working'
        });
      }
      
      // Test system initialization speed
      const startTime = Date.now();
      await systemInitializer.reinitializeSystem();
      const initDuration = Date.now() - startTime;
      
      if (initDuration < 10000) { // Less than 10 seconds
        categoryResults.tests.push({
          name: 'Initialization Performance',
          passed: true,
          score: 30,
          message: `Fast initialization: ${initDuration}ms`
        });
        categoryResults.score += 30;
      } else if (initDuration < 20000) { // Less than 20 seconds
        categoryResults.tests.push({
          name: 'Initialization Performance',
          passed: true,
          score: 20,
          message: `Moderate initialization: ${initDuration}ms`
        });
        categoryResults.score += 20;
      } else {
        categoryResults.tests.push({
          name: 'Initialization Performance',
          passed: false,
          score: 10,
          message: `Slow initialization: ${initDuration}ms`
        });
        categoryResults.score += 10;
        
        this.validationResults.warnings.push({
          type: 'SLOW_INITIALIZATION',
          message: `System initialization took ${initDuration}ms`
        });
      }
      
      // Test memory usage (basic check)
      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        const memory = window.performance.memory;
        const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
        
        if (memoryUsageMB < 50) {
          categoryResults.tests.push({
            name: 'Memory Usage',
            passed: true,
            score: 30,
            message: `Low memory usage: ${memoryUsageMB.toFixed(1)}MB`
          });
          categoryResults.score += 30;
        } else if (memoryUsageMB < 100) {
          categoryResults.tests.push({
            name: 'Memory Usage',
            passed: true,
            score: 20,
            message: `Moderate memory usage: ${memoryUsageMB.toFixed(1)}MB`
          });
          categoryResults.score += 20;
        } else {
          categoryResults.tests.push({
            name: 'Memory Usage',
            passed: false,
            score: 10,
            message: `High memory usage: ${memoryUsageMB.toFixed(1)}MB`
          });
          categoryResults.score += 10;
          
          this.validationResults.warnings.push({
            type: 'HIGH_MEMORY_USAGE',
            message: `Memory usage at ${memoryUsageMB.toFixed(1)}MB`
          });
        }
      } else {
        categoryResults.tests.push({
          name: 'Memory Usage',
          passed: true,
          score: 15,
          message: 'Memory monitoring not available'
        });
        categoryResults.score += 15;
      }
      
    } catch (error) {
      this.validationResults.criticalIssues.push({
        type: 'PERFORMANCE_VALIDATION_ERROR',
        message: error.message
      });
    }
    
    this.validationResults.categories['Performance & Recovery'] = categoryResults;
  }

  /**
   * Calculate overall deployment readiness score
   */
  calculateOverallScore() {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (const [categoryName, category] of Object.entries(this.validationResults.categories)) {
      const weightedScore = (category.score / category.maxScore) * category.weight * 100;
      totalWeightedScore += weightedScore;
      totalWeight += category.weight;
    }
    
    this.validationResults.overall.score = Math.round(totalWeightedScore / totalWeight);
    
    // Determine deployment status
    if (this.validationResults.criticalIssues.length > 0) {
      this.validationResults.overall.status = 'not_ready';
    } else if (this.validationResults.overall.score >= 85) {
      this.validationResults.overall.status = 'ready';
    } else if (this.validationResults.overall.score >= 70) {
      this.validationResults.overall.status = 'ready_with_warnings';
    } else {
      this.validationResults.overall.status = 'not_ready';
    }
    
    // Generate recommendations
    this.generateRecommendations();
  }

  /**
   * Generate deployment recommendations
   */
  generateRecommendations() {
    // Critical issues recommendations
    if (this.validationResults.criticalIssues.length > 0) {
      this.validationResults.recommendations.push({
        priority: 'CRITICAL',
        action: 'Resolve all critical issues before deployment',
        details: this.validationResults.criticalIssues.map(issue => issue.message)
      });
    }
    
    // Score-based recommendations
    if (this.validationResults.overall.score < 85) {
      this.validationResults.recommendations.push({
        priority: 'HIGH',
        action: 'Improve system reliability',
        details: ['Address failing tests', 'Improve error handling', 'Enhance recovery mechanisms']
      });
    }
    
    // Warning-based recommendations
    if (this.validationResults.warnings.length > 5) {
      this.validationResults.recommendations.push({
        priority: 'MEDIUM',
        action: 'Address system warnings',
        details: [`${this.validationResults.warnings.length} warnings found - review and resolve`]
      });
    }
    
    // Performance recommendations
    const perfCategory = this.validationResults.categories['Performance & Recovery'];
    if (perfCategory && perfCategory.score < 70) {
      this.validationResults.recommendations.push({
        priority: 'MEDIUM',
        action: 'Optimize system performance',
        details: ['Improve initialization speed', 'Reduce memory usage', 'Enhance recovery capabilities']
      });
    }
  }

  /**
   * Generate deployment report
   */
  generateDeploymentReport(duration) {
    return {
      timestamp: new Date().toISOString(),
      duration,
      validationResults: this.validationResults,
      deploymentRecommendation: this.getDeploymentRecommendation(),
      nextSteps: this.getNextSteps()
    };
  }

  getDeploymentRecommendation() {
    switch (this.validationResults.overall.status) {
      case 'ready':
        return {
          decision: 'PROCEED',
          message: 'System is ready for production deployment',
          confidence: 'HIGH'
        };
      case 'ready_with_warnings':
        return {
          decision: 'PROCEED_WITH_CAUTION',
          message: 'System is mostly ready but has warnings that should be monitored',
          confidence: 'MEDIUM'
        };
      case 'not_ready':
        return {
          decision: 'DO_NOT_DEPLOY',
          message: 'System has critical issues that must be resolved before deployment',
          confidence: 'HIGH'
        };
      default:
        return {
          decision: 'REVIEW_REQUIRED',
          message: 'Validation incomplete - manual review required',
          confidence: 'LOW'
        };
    }
  }

  getNextSteps() {
    const steps = [];
    
    if (this.validationResults.overall.status === 'ready') {
      steps.push('Proceed with production deployment');
      steps.push('Monitor system performance after deployment');
      steps.push('Set up production monitoring and alerting');
    } else if (this.validationResults.overall.status === 'ready_with_warnings') {
      steps.push('Review and assess all warnings');
      steps.push('Implement monitoring for warned components');
      steps.push('Proceed with deployment with enhanced monitoring');
    } else {
      steps.push('Address all critical issues');
      steps.push('Re-run validation after fixes');
      steps.push('Do not deploy until validation passes');
    }
    
    return steps;
  }

  exportValidationReport() {
    const report = this.generateDeploymentReport(0);
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trading-post-deployment-validation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📄 Deployment validation report exported');
    return report;
  }
}

// Create singleton instance
const deploymentValidator = new DeploymentValidator();

// Export for use in components
export default deploymentValidator;
export { DeploymentValidator };

// Make available globally for debugging
if (typeof window !== 'undefined') {
  window.deploymentValidator = deploymentValidator;
  window.validateDeployment = (options) => deploymentValidator.validateDeploymentReadiness(options);
  window.exportDeploymentReport = () => deploymentValidator.exportValidationReport();
}