/**
 * Execution Monitor - Tests function completion and response handling
 * Identifies if functions start but fail during execution
 */

console.log('🔍 EXECUTION MONITORING TEST...\n');

async function monitorExecution(executionId, functionId, maxWait = 30000) {
  console.log(`🔍 Monitoring ${functionId} execution ${executionId}...`);
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < maxWait) {
    attempts++;
    
    try {
      const response = await fetch(
        `https://nyc.cloud.appwrite.io/v1/functions/${functionId}/executions/${executionId}`,
        {
          headers: {
            'X-Appwrite-Project': '68a4e3da0022f3e129d0'
          }
        }
      );

      if (!response.ok) {
        console.log(`⚠️  ${functionId}: Status check failed ${response.status} (attempt ${attempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      const execution = await response.json();
      const elapsed = Date.now() - startTime;
      
      console.log(`📊 ${functionId}: ${execution.status} (${elapsed}ms, attempt ${attempts})`);
      
      if (execution.status === 'completed') {
        console.log(`✅ ${functionId}: COMPLETED successfully`);
        try {
          const responseData = execution.responseBody ? JSON.parse(execution.responseBody) : {};
          console.log(`📄 ${functionId} response:`, JSON.stringify(responseData, null, 2));
          return {
            success: true,
            data: responseData,
            executionTime: elapsed,
            attempts
          };
        } catch (e) {
          console.log(`📄 ${functionId} raw response:`, execution.responseBody || 'No response body');
          return {
            success: true,
            data: { response: execution.responseBody || 'Function completed' },
            executionTime: elapsed,
            attempts
          };
        }
      } else if (execution.status === 'failed') {
        console.log(`❌ ${functionId}: FAILED`);
        console.log(`📄 Error details:`, execution.errors || 'No error details');
        console.log(`📄 Logs:`, execution.logs || 'No logs');
        console.log(`📄 Stderr:`, execution.stderr || 'No stderr');
        
        return {
          success: false,
          error: execution.errors || 'Function execution failed',
          executionTime: elapsed,
          attempts,
          logs: execution.logs || [],
          stderr: execution.stderr
        };
      }
      
      // Still running
      if (attempts % 3 === 0) {
        console.log(`⏳ ${functionId}: Still running... (${elapsed}ms)`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`⚠️  ${functionId}: Monitor error ${error.message} (attempt ${attempts})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log(`⏰ ${functionId}: TIMEOUT after ${maxWait}ms`);
  return {
    success: false,
    error: 'Execution timeout',
    executionTime: Date.now() - startTime,
    attempts
  };
}

async function testFunctionExecution(functionId, payload, maxWait = 30000) {
  console.log(`\n🧪 TESTING ${functionId.toUpperCase()}:`);
  console.log('=' .repeat(50));
  
  try {
    // Start execution
    const response = await fetch(`https://nyc.cloud.appwrite.io/v1/functions/${functionId}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': '68a4e3da0022f3e129d0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.log(`❌ ${functionId}: Failed to start - HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const execution = await response.json();
    console.log(`🚀 ${functionId}: Execution started ${execution.$id}`);
    
    // Monitor execution
    const result = await monitorExecution(execution.$id, functionId, maxWait);
    
    return result;
    
  } catch (error) {
    console.log(`❌ ${functionId}: Test error ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runExecutionTests() {
  // Import fetch for Node.js if needed
  if (typeof fetch === 'undefined') {
    try {
      const fetch = await import('node-fetch');
      global.fetch = fetch.default;
    } catch (error) {
      console.log('❌ node-fetch not available');
      return;
    }
  }

  console.log('📋 EXECUTION MONITORING TESTS:');
  console.log('Testing function execution completion and responses\n');
  
  // Test each function with appropriate payloads
  const tests = [
    {
      id: 'grok-api',
      payload: { prompt: 'test simple response', context: { test: true, skip_pipeline: true } },
      timeout: 25000
    },
    {
      id: 'claude-cli', 
      payload: { prompt: 'test claude cli connectivity' },
      timeout: 45000
    },
    {
      id: 'github-cli',
      payload: { operation: 'health_check', test: true },
      timeout: 30000
    },
    {
      id: 'appwrite-cli',
      payload: { operation: 'health_check', test: true },
      timeout: 30000
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    const result = await testFunctionExecution(test.id, test.payload, test.timeout);
    results[test.id] = result;
  }
  
  // Summary
  console.log('\n📊 EXECUTION TEST SUMMARY:');
  console.log('=' .repeat(50));
  
  let completed = 0;
  let failed = 0;
  let timed_out = 0;
  
  for (const [funcId, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${funcId}: COMPLETED (${result.executionTime}ms, ${result.attempts} attempts)`);
      completed++;
    } else if (result.error === 'Execution timeout') {
      console.log(`⏰ ${funcId}: TIMEOUT (${result.executionTime}ms, ${result.attempts} attempts)`);
      timed_out++;
    } else {
      console.log(`❌ ${funcId}: FAILED - ${result.error}`);
      failed++;
    }
  }
  
  console.log(`\n📈 FINAL RESULTS:`);
  console.log(`   ✅ Completed: ${completed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏰ Timed out: ${timed_out}`);
  console.log(`   📊 Total tested: ${Object.keys(results).length}`);
  
  if (failed > 0 || timed_out > 0) {
    console.log(`\n🔍 ROOT CAUSE ANALYSIS:`);
    for (const [funcId, result] of Object.entries(results)) {
      if (!result.success) {
        if (result.error === 'Execution timeout') {
          console.log(`⏰ ${funcId}: Function starts but never completes - possible infinite loop or blocking operation`);
        } else {
          console.log(`❌ ${funcId}: ${result.error} - check function logs and dependencies`);
        }
      }
    }
  }
  
  return results;
}

// Run the tests
runExecutionTests()
  .then(() => {
    console.log('\n🎯 EXECUTION MONITORING COMPLETE!');
  })
  .catch(error => {
    console.error('🚨 EXECUTION TEST ERROR:', error);
  });