/**
 * ULTRATHINK CLI Diagnostics Runner
 * Systematically test each CLI component to identify timeout source
 */

import { diagnostics } from './src/services/diagnostics.js';
import { appwriteIntegration } from './src/services/appwriteIntegration.js';

async function runComprehensiveDiagnostics() {
  console.log('\n🔬 ULTRATHINK CLI DIAGNOSTICS STARTING...\n');
  console.log('=' * 60);
  
  const startTime = Date.now();
  
  // Phase 1: Individual CLI component testing
  console.log('\n🧪 PHASE 1: Individual CLI Component Testing');
  console.log('-' * 50);
  
  const fullDiagnostics = await diagnostics.runFullDiagnostics();
  
  // Phase 2: Integration testing
  console.log('\n🔗 PHASE 2: Integration Layer Testing');
  console.log('-' * 50);
  
  // Test the actual failing scenario
  diagnostics.info('INTEGRATION', 'Testing exact failing scenario: "build cat website"');
  
  try {
    const failingResult = await appwriteIntegration.callGrokAPI('build cat website', {
      test: true,
      diagnostics: true,
      ultrathink: true
    });
    
    diagnostics.success('INTEGRATION', 'Build cat website test completed', failingResult);
  } catch (error) {
    diagnostics.error('INTEGRATION', 'Build cat website test failed', {
      error: error.message,
      stack: error.stack
    });
  }
  
  // Phase 3: Component isolation testing
  console.log('\n🎯 PHASE 3: Component Isolation Testing');
  console.log('-' * 50);
  
  // Test simple prompts to isolate complexity
  const testPrompts = [
    'hello',
    'test',
    'simple response',
    'build hello world',
    'build cat website'
  ];
  
  for (const prompt of testPrompts) {
    try {
      diagnostics.info('ISOLATION', `Testing prompt: "${prompt}"`);
      
      const result = await Promise.race([
        appwriteIntegration.callGrokAPI(prompt, { test: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Test timeout after 45s')), 45000)
        )
      ]);
      
      diagnostics.success('ISOLATION', `Prompt "${prompt}" completed`, {
        executionTime: result.executionTime,
        success: result.success
      });
      
    } catch (error) {
      diagnostics.error('ISOLATION', `Prompt "${prompt}" failed`, {
        error: error.message,
        isTimeout: error.message.includes('timeout')
      });
      
      // If we get a timeout here, this is likely our culprit
      if (error.message.includes('timeout')) {
        diagnostics.error('ISOLATION', `🚨 TIMEOUT DETECTED at prompt: "${prompt}"`, {
          prompt,
          complexity: prompt.length,
          containsBuild: prompt.includes('build')
        });
      }
    }
  }
  
  // Phase 4: Generate comprehensive report
  console.log('\n📊 PHASE 4: Analysis & Recommendations');
  console.log('-' * 50);
  
  const report = diagnostics.generateReport();
  
  console.log('\n🎯 ULTRATHINK DIAGNOSIS COMPLETE');
  console.log('=' * 60);
  console.log(`Total diagnostic time: ${Date.now() - startTime}ms`);
  
  // Key findings
  console.log('\n🔍 KEY FINDINGS:');
  
  const workingCLIs = fullDiagnostics.summary.workingFunctions;
  const failingCLIs = fullDiagnostics.summary.failingFunctions;
  
  if (workingCLIs.length > 0) {
    console.log(`✅ Working CLIs (${workingCLIs.length}): ${workingCLIs.join(', ')}`);
  }
  
  if (failingCLIs.length > 0) {
    console.log(`❌ Failed CLIs (${failingCLIs.length}):`);
    failingCLIs.forEach(({ name, error }) => {
      console.log(`   - ${name}: ${error}`);
    });
  }
  
  // Timeout analysis
  const timeoutErrors = report.error_summary.filter(e => 
    e.message.includes('timeout') || e.message.includes('Timed out')
  );
  
  if (timeoutErrors.length > 0) {
    console.log(`\n⏱️ TIMEOUT PATTERN DETECTED (${timeoutErrors.length} occurrences):`);
    timeoutErrors.forEach(error => {
      console.log(`   - ${error.component}: ${error.message}`);
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 ULTRATHINK RECOMMENDATIONS:');
    report.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec.issue}: ${rec.solution}`);
      console.log(`   Affected: ${rec.affected.join(', ')}`);
    });
  }
  
  // Export detailed report
  const fs = await import('fs');
  const reportPath = './diagnostic-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    diagnostics: fullDiagnostics,
    report,
    totalTime: Date.now() - startTime
  }, null, 2));
  
  console.log(`\n📋 Detailed report saved to: ${reportPath}`);
  
  return {
    fullDiagnostics,
    report,
    recommendations: report.recommendations
  };
}

// Error handling wrapper
async function main() {
  try {
    const results = await runComprehensiveDiagnostics();
    
    // Final diagnosis
    console.log('\n🧠 FINAL ULTRATHINK DIAGNOSIS:');
    
    const { fullDiagnostics } = results;
    
    if (fullDiagnostics.summary.failing > 0) {
      console.log(`\n🎯 ROOT CAUSE IDENTIFIED:`);
      console.log(`${fullDiagnostics.summary.failing} CLI(s) are failing:`);
      
      fullDiagnostics.summary.failingFunctions.forEach(({ name, error }) => {
        console.log(`\n❌ ${name.toUpperCase()}:`);
        console.log(`   Error: ${error}`);
        
        if (error.includes('timeout')) {
          console.log(`   🔧 SOLUTION: This CLI is timing out - needs optimization or timeout increase`);
        } else if (error.includes('HTTP')) {
          console.log(`   🔧 SOLUTION: This CLI has deployment/connection issues`);
        }
      });
    } else {
      console.log('\n✅ All individual CLIs are working correctly');
      console.log('🎯 The issue is likely in the integration layer or specific prompt handling');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 DIAGNOSTIC SYSTEM FAILURE:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run diagnostics
main();