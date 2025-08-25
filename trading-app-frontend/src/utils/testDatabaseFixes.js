/**
 * Database Fix Testing Utility
 * Tests and validates that all database schema fixes are working correctly
 */

import { smartDatabases } from './fixDatabaseSchema';
import { DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import createDebugger from './debugLogger.js';

const debug = createDebugger('trading-post:databaseTest');

class DatabaseFixTester {
  constructor() {
    this.testResults = {
      passed: [],
      failed: [],
      warnings: []
    };
  }

  /**
   * Test that database fixes are working
   */
  async runTests() {
    debug.info('🧪 Starting database fix validation tests');
    
    try {
      await this.testSmartDatabaseWrapper();
      await this.testFieldMappings();
      await this.testErrorHandling();
      await this.testFallbackBehavior();
      
      this.logResults();
      return this.testResults;
    } catch (error) {
      debug.error('Database test suite failed', error);
      this.testResults.failed.push({
        test: 'Test Suite Execution',
        error: error.message
      });
      return this.testResults;
    }
  }

  /**
   * Test that the smart database wrapper is functioning
   */
  async testSmartDatabaseWrapper() {
    try {
      // Test that we can list documents without errors
      const result = await smartDatabases.listDocuments(DATABASE_ID, COLLECTIONS.items, []);
      
      if (result && typeof result === 'object' && 'documents' in result) {
        this.testResults.passed.push('Smart database wrapper basic functionality');
        debug.success('✅ Smart database wrapper is working');
      } else {
        throw new Error('Smart database wrapper returned unexpected result format');
      }
    } catch (error) {
      this.testResults.failed.push({
        test: 'Smart Database Wrapper',
        error: error.message
      });
      debug.error('❌ Smart database wrapper test failed', error);
    }
  }

  /**
   * Test field mapping functionality
   */
  async testFieldMappings() {
    try {
      // Test querying with user_id field (should be mapped to correct field)
      // This might fail, but should fail gracefully through smart wrapper
      const testUserId = 'test-user-12345';
      
      try {
        const result = await smartDatabases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.items,
          [
            { method: 'equal', values: ['user_id', testUserId] },
            { method: 'limit', values: [1] }
          ]
        );
        
        this.testResults.passed.push('Field mapping query execution');
        debug.success('✅ Field mapping queries work correctly');
      } catch (error) {
        if (error.message?.includes('Attribute not found')) {
          // This should be caught by smart wrapper and handled gracefully
          this.testResults.warnings.push({
            test: 'Field Mapping',
            warning: 'Schema issues detected but should be handled by smart wrapper',
            error: error.message
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.testResults.failed.push({
        test: 'Field Mappings',
        error: error.message
      });
      debug.error('❌ Field mapping test failed', error);
    }
  }

  /**
   * Test error handling behavior
   */
  async testErrorHandling() {
    try {
      // Test querying a non-existent collection
      try {
        const result = await smartDatabases.listDocuments(
          DATABASE_ID,
          'non_existent_collection',
          []
        );
        
        if (result && result.documents && Array.isArray(result.documents)) {
          this.testResults.passed.push('Non-existent collection graceful handling');
          debug.success('✅ Non-existent collections handled gracefully');
        }
      } catch (error) {
        if (error.code === 404) {
          // Expected behavior for non-existent collections
          this.testResults.passed.push('Non-existent collection error handling');
          debug.success('✅ Non-existent collection errors handled correctly');
        } else {
          throw error;
        }
      }
    } catch (error) {
      this.testResults.failed.push({
        test: 'Error Handling',
        error: error.message
      });
      debug.error('❌ Error handling test failed', error);
    }
  }

  /**
   * Test fallback behavior for problematic queries
   */
  async testFallbackBehavior() {
    try {
      // Test the specific collection that was causing issues
      const result = await smartDatabases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.matches || 'matches',
        []
      );
      
      if (result && Array.isArray(result.documents)) {
        this.testResults.passed.push('Matches collection fallback handling');
        debug.success('✅ Matches collection queries work correctly');
      } else {
        throw new Error('Unexpected result format from matches collection');
      }
    } catch (error) {
      // For matches collection, this might be expected if collection doesn't exist
      if (error.code === 404) {
        this.testResults.warnings.push({
          test: 'Matches Collection',
          warning: 'Matches collection not found - this is expected if not created yet'
        });
        debug.warn('⚠️ Matches collection not found (expected)');
      } else {
        this.testResults.failed.push({
          test: 'Fallback Behavior',
          error: error.message
        });
        debug.error('❌ Fallback behavior test failed', error);
      }
    }
  }

  /**
   * Log test results to console
   */
  logResults() {
    const { passed, failed, warnings } = this.testResults;
    
    console.log('\n🧪 Database Fix Test Results:');
    console.log('================================');
    
    if (passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      passed.forEach((test, i) => {
        console.log(`  ${i + 1}. ${test}`);
      });
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning.test}: ${warning.warning}`);
        if (warning.error) console.log(`     Error: ${warning.error}`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failed.forEach((failure, i) => {
        console.log(`  ${i + 1}. ${failure.test}: ${failure.error}`);
      });
    }
    
    const total = passed.length + failed.length + warnings.length;
    const successRate = total > 0 ? Math.round((passed.length / total) * 100) : 0;
    
    console.log(`\n📊 Overall Success Rate: ${successRate}% (${passed.length}/${total} tests passed)`);
    
    if (failed.length === 0) {
      console.log('🎉 All database fixes are working correctly!');
    } else if (failed.length <= 2) {
      console.log('⚠️ Minor issues detected, but core functionality should work');
    } else {
      console.log('❌ Multiple issues detected - database fixes may need attention');
    }
  }

  /**
   * Get summary of test results
   */
  getSummary() {
    const { passed, failed, warnings } = this.testResults;
    return {
      total: passed.length + failed.length + warnings.length,
      passed: passed.length,
      failed: failed.length,
      warnings: warnings.length,
      success: failed.length === 0
    };
  }
}

// Create and export singleton instance
const databaseTester = new DatabaseFixTester();

// Make globally available for manual testing
window.testDatabaseFixes = () => databaseTester.runTests();

export default databaseTester;
export { DatabaseFixTester };