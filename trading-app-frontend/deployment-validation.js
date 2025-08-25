/**
 * Trading Post Deployment Validation Script
 * Run comprehensive validation tests to verify production readiness
 */

import deploymentValidator from './src/utils/deploymentValidator.js';

async function runDeploymentValidation() {
  console.log('🚀 Starting Trading Post Deployment Validation...\n');
  
  try {
    // Run comprehensive validation
    const validationReport = await deploymentValidator.validateDeploymentReadiness({
      verbose: true,
      includePerformanceTests: true,
      includeSecurityChecks: true
    });
    
    console.log('\n📊 DEPLOYMENT VALIDATION RESULTS');
    console.log('=' .repeat(50));
    console.log(`Overall Score: ${validationReport.validationResults.overall.score}%`);
    console.log(`Status: ${validationReport.validationResults.overall.status.toUpperCase()}`);
    console.log(`Validation Duration: ${validationReport.duration}ms`);
    
    console.log('\n📋 CATEGORY BREAKDOWN:');
    for (const [category, results] of Object.entries(validationReport.validationResults.categories)) {
      console.log(`${category}: ${Math.round(results.score)}/${results.maxScore} (${Math.round(results.score/results.maxScore*100)}%)`);
      
      // Show failing tests
      const failedTests = results.tests.filter(test => !test.passed);
      if (failedTests.length > 0) {
        console.log(`  ❌ Failed Tests:`);
        failedTests.forEach(test => {
          console.log(`    - ${test.name}: ${test.message}`);
        });
      }
    }
    
    if (validationReport.validationResults.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES:');
      validationReport.validationResults.criticalIssues.forEach(issue => {
        console.log(`  - ${issue.type}: ${issue.message}`);
      });
    }
    
    if (validationReport.validationResults.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      validationReport.validationResults.warnings.forEach(warning => {
        console.log(`  - ${warning.type}: ${warning.message}`);
      });
    }
    
    console.log('\n🎯 DEPLOYMENT RECOMMENDATION:');
    const rec = validationReport.deploymentRecommendation;
    console.log(`Decision: ${rec.decision}`);
    console.log(`Message: ${rec.message}`);
    console.log(`Confidence: ${rec.confidence}`);
    
    console.log('\n📝 NEXT STEPS:');
    validationReport.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
    
    // Export detailed report
    const reportFile = `trading-post-validation-${Date.now()}.json`;
    const fs = await import('fs');
    fs.writeFileSync(reportFile, JSON.stringify(validationReport, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportFile}`);
    
    // Return exit code based on validation status
    if (validationReport.validationResults.overall.status === 'ready') {
      console.log('\n✅ DEPLOYMENT VALIDATION PASSED - System ready for production!');
      process.exit(0);
    } else if (validationReport.validationResults.overall.status === 'ready_with_warnings') {
      console.log('\n⚠️  DEPLOYMENT VALIDATION PASSED WITH WARNINGS - Proceed with caution');
      process.exit(0);
    } else {
      console.log('\n❌ DEPLOYMENT VALIDATION FAILED - Do not deploy until issues are resolved');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Deployment validation failed with error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run validation
runDeploymentValidation();