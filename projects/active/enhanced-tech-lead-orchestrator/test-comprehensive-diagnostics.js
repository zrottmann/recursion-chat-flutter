/**
 * Comprehensive Diagnostic Test for Enhanced Tech Lead Orchestrator
 * Uses UltraThink methodology to identify integration issues
 */

import { diagnostics } from './src/services/diagnostics.js';
import { appwriteIntegration } from './src/services/appwriteIntegration.js';

async function runComprehensiveDiagnostics() {
  console.log('🔍 ULTRATHINK DIAGNOSTIC SYSTEM STARTING...\n');
  
  // Phase 1: Individual Function Testing
  console.log('📋 Phase 1: Individual Function Health Checks');
  console.log('=' .repeat(60));
  
  const healthResults = await appwriteIntegration.healthCheck();
  
  console.log('\n📊 DIAGNOSTIC RESULTS:');
  console.log(`✅ Working Functions: ${healthResults.summary.working}/${healthResults.summary.total}`);
  console.log(`❌ Failed Functions: ${healthResults.summary.failing}/${healthResults.summary.total}`);
  
  if (healthResults.summary.workingFunctions.length > 0) {
    console.log(`\n🟢 Working: ${healthResults.summary.workingFunctions.join(', ')}`);
  }
  
  if (healthResults.summary.failingFunctions.length > 0) {
    console.log(`\n🔴 Failed: ${healthResults.summary.failingFunctions.map(f => `${f.name} (${f.error})`).join(', ')}`);
  }
  
  // Phase 2: Pipeline Testing
  console.log('\n📋 Phase 2: End-to-End Pipeline Testing');
  console.log('=' .repeat(60));
  
  if (healthResults.summary.working >= 2) {
    console.log('🚀 Testing basic pipeline workflow...');
    
    try {
      diagnostics.info('PIPELINE', 'Testing simple grok-api call...');
      const grokResult = await appwriteIntegration.testFunction('grok-api', {
        prompt: 'test simple response',
        context: { test: true, skip_pipeline: true }
      });
      
      if (grokResult.success) {
        diagnostics.success('PIPELINE', 'Grok API basic test successful');
        
        // Test Claude CLI if available
        if (healthResults.summary.workingFunctions.includes('claude-cli')) {
          diagnostics.info('PIPELINE', 'Testing Claude CLI integration...');
          const claudeResult = await appwriteIntegration.testFunction('claude-cli', {
            prompt: 'test claude cli connectivity',
            context: { test: true }
          });
          
          if (claudeResult.success) {
            diagnostics.success('PIPELINE', 'Claude CLI integration working');
          } else {
            diagnostics.error('PIPELINE', 'Claude CLI integration failed', claudeResult);
          }
        }
        
      } else {
        diagnostics.error('PIPELINE', 'Grok API basic test failed', grokResult);
      }
      
    } catch (error) {
      diagnostics.error('PIPELINE', 'Pipeline testing failed', { error: error.message });
    }
  } else {
    console.log('⚠️  Insufficient working functions for pipeline testing');
  }
  
  // Phase 3: Error Analysis
  console.log('\n📋 Phase 3: Error Analysis & Recommendations');
  console.log('=' .repeat(60));
  
  const report = diagnostics.generateReport();
  
  console.log(`\n📈 Session Statistics:`);
  console.log(`   Duration: ${Math.round(report.diagnostic_session.duration / 1000)}s`);
  console.log(`   Total Logs: ${report.diagnostic_session.total_logs}`);
  console.log(`   Total Errors: ${report.diagnostic_session.total_errors}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec.issue}`);
      console.log(`      Solution: ${rec.solution}`);
      console.log(`      Affected: ${rec.affected.join(', ')}`);
    });
  }
  
  // Phase 4: Detailed Error Reporting
  if (report.error_summary.length > 0) {
    console.log('\n🔍 Detailed Error Analysis:');
    console.log('=' .repeat(60));
    
    const errorsByComponent = {};
    report.error_summary.forEach(error => {
      if (!errorsByComponent[error.component]) {
        errorsByComponent[error.component] = [];
      }
      errorsByComponent[error.component].push(error);
    });
    
    Object.entries(errorsByComponent).forEach(([component, errors]) => {
      console.log(`\n❌ ${component} Errors (${errors.length}):`);
      errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
        if (error.data) {
          console.log(`      Details: ${JSON.stringify(error.data, null, 2)}`);
        }
      });
    });
  }
  
  // Phase 5: Next Steps
  console.log('\n📋 Phase 5: Next Steps');
  console.log('=' .repeat(60));
  
  const nextSteps = generateNextSteps(healthResults);
  nextSteps.forEach((step, i) => {
    console.log(`${i + 1}. ${step}`);
  });
  
  console.log('\n🎯 DIAGNOSTIC COMPLETE!');
  console.log(`Full diagnostic report saved to logs.`);
  
  return {
    healthResults,
    diagnosticReport: report,
    nextSteps
  };
}

function generateNextSteps(healthResults) {
  const steps = [];
  
  if (healthResults.summary.failing > 0) {
    steps.push('🔧 Fix failing functions first - they are blocking the pipeline');
    
    healthResults.summary.failingFunctions.forEach(func => {
      if (func.error.includes('timeout')) {
        steps.push(`⏰ ${func.name}: Increase timeout or optimize function performance`);
      } else if (func.error.includes('404')) {
        steps.push(`📦 ${func.name}: Verify function deployment and existence`);
      } else if (func.error.includes('HTTP')) {
        steps.push(`🌐 ${func.name}: Check API endpoint and authentication`);
      } else {
        steps.push(`🔍 ${func.name}: Debug specific error - ${func.error}`);
      }
    });
  }
  
  if (healthResults.summary.working >= 2) {
    steps.push('✅ Test partial pipeline with working functions');
  }
  
  if (healthResults.summary.working === healthResults.summary.total) {
    steps.push('🚀 All functions working - test full app creation pipeline');
  }
  
  steps.push('📊 Monitor function logs in Appwrite console for detailed errors');
  steps.push('🔄 Re-run diagnostics after fixes to verify improvements');
  
  return steps;
}

// Error handling wrapper
async function main() {
  try {
    const results = await runComprehensiveDiagnostics();
    
    // Write detailed report to file
    const reportData = JSON.stringify(results, null, 2);
    console.log('\n📄 Writing detailed diagnostic report...');
    
    return results;
  } catch (error) {
    console.error('🚨 DIAGNOSTIC SYSTEM ERROR:', error);
    diagnostics.error('MAIN', 'Diagnostic system failure', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Export for use in other scripts
export { runComprehensiveDiagnostics, main };

// Run if called directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch(console.error);
}