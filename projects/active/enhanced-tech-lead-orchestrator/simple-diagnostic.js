/**
 * Simple Diagnostic Test - Direct Function Testing
 * Tests each Appwrite function individually without complex imports
 */

console.log('🔍 STARTING SIMPLE DIAGNOSTICS...\n');

// Direct function testing without imports
async function testAppwriteFunction(functionId, payload = {}) {
  console.log(`🧪 Testing ${functionId}...`);
  
  try {
    const response = await fetch(`https://nyc.cloud.appwrite.io/v1/functions/${functionId}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': '68a4e3da0022f3e129d0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.log(`❌ ${functionId}: HTTP ${response.status} ${response.statusText}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    const execution = await response.json();
    console.log(`✅ ${functionId}: Execution started ${execution.$id}`);
    return { success: true, executionId: execution.$id };
    
  } catch (error) {
    console.log(`❌ ${functionId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runSimpleDiagnostics() {
  console.log('📋 Testing Core Functions:');
  console.log('=' .repeat(50));
  
  const functions = [
    { id: 'grok-api', payload: { prompt: 'test', context: { test: true } } },
    { id: 'claude-cli', payload: { prompt: 'test claude cli' } },
    { id: 'github-cli', payload: { operation: 'health_check' } },
    { id: 'appwrite-cli', payload: { operation: 'health_check' } }
  ];
  
  const results = {};
  
  for (const func of functions) {
    const result = await testAppwriteFunction(func.id, func.payload);
    results[func.id] = result;
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('=' .repeat(50));
  
  let working = 0;
  let failing = 0;
  
  for (const [funcId, result] of Object.entries(results)) {
    if (result.success) {
      console.log(`✅ ${funcId}: Working`);
      working++;
    } else {
      console.log(`❌ ${funcId}: ${result.error}`);
      failing++;
    }
  }
  
  console.log(`\n📈 Results: ${working} working, ${failing} failing out of ${functions.length} total`);
  
  // Recommendations
  if (failing > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    for (const [funcId, result] of Object.entries(results)) {
      if (!result.success) {
        if (result.error.includes('404')) {
          console.log(`📦 ${funcId}: Function may not exist or not deployed properly`);
        } else if (result.error.includes('timeout')) {
          console.log(`⏰ ${funcId}: Function exists but taking too long to respond`);
        } else if (result.error.includes('HTTP 4')) {
          console.log(`🔑 ${funcId}: Authentication or permission issue`);
        } else {
          console.log(`🔍 ${funcId}: Network or configuration issue - ${result.error}`);
        }
      }
    }
  }
  
  return results;
}

// Import fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  console.log('📦 Importing node-fetch...');
  try {
    const fetch = await import('node-fetch');
    global.fetch = fetch.default;
  } catch (error) {
    console.log('❌ node-fetch not available, attempting with built-in fetch...');
  }
}

// Run diagnostics
runSimpleDiagnostics()
  .then(() => {
    console.log('\n🎯 SIMPLE DIAGNOSTICS COMPLETE!');
  })
  .catch(error => {
    console.error('🚨 DIAGNOSTIC ERROR:', error);
  });