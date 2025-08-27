/**
 * Check Appwrite Function Logs
 * Debug the Grok API function execution failure
 */

const { Client, Functions } = require('node-appwrite');

async function checkFunctionLogs() {
  try {
    console.log('🔍 Checking Grok API function logs...');
    
    const client = new Client()
      .setEndpoint('https://nyc.cloud.appwrite.io/v1')
      .setProject('68a4e3da0022f3e129d0')
      .setKey(process.env.APPWRITE_API_KEY || 'standard_34a3dd31a7b8b3f8c3b17ed8e92a7ea8a79e2b71bc31d41cd07cfe4d03fffa51bfe61b4e8226b6ce8b5c52ec0d5e72b1e93c6e5b45d23c1c17a95d01c6b7e948ac16f15b7eb07f4d6d3b3a1a8f5e6c2e0a3e4f2a9d7e1e5b6f8c3a9d7e1a2b');
    
    const functions = new Functions(client);
    
    // Get recent executions
    const executions = await functions.listExecutions('grok-api');
    
    console.log(`📋 Found ${executions.executions.length} recent executions`);
    
    if (executions.executions.length > 0) {
      const latest = executions.executions[0];
      console.log('\n🔍 Latest execution details:');
      console.log('ID:', latest.$id);
      console.log('Status:', latest.status);
      console.log('Duration:', latest.duration, 'seconds');
      console.log('Response Code:', latest.responseStatusCode);
      console.log('Logs:', latest.logs || 'No logs available');
      console.log('Errors:', latest.errors || 'No errors logged');
      console.log('Response Body:', latest.responseBody || 'Empty response body');
      
      if (latest.status === 'failed') {
        console.log('\n❌ Function execution failed');
        
        // Try to get more detailed error information
        if (latest.errors) {
          console.log('Error details:', latest.errors);
        }
        
        // Check if it's a common issue
        if (latest.duration < 0.1) {
          console.log('⚠️ Very quick failure suggests code compilation/syntax error');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check logs:', error.message);
    
    if (error.code === 401) {
      console.log('💡 Tip: Make sure APPWRITE_API_KEY environment variable is set');
    }
  }
}

checkFunctionLogs();