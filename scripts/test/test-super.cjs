const https = require('https');

console.log('🔧 Troubleshooting super.appwrite.network timeout...');

const API_KEY = "standard_6422a9ded06a9647123780658440c01553dc094eab355b72016759d8c1af2b4088172bec38d67a02bc67f6c4e951d1f4f73672a56c113da3c834261fb7e5f9b910c2377dc5f2412aa47dd4f674fe97a9c23bbb6df1c7518c84e4b5bf79553e424d600f6262454900493530a433596dbb6033f98a78a6b943107e2625d8f79c1d";

// Check function health
function checkFunctionHealth() {
  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions/super',
    method: 'GET',
    headers: {
      'X-Appwrite-Project': '68a4e3da0022f3e129d0',
      'X-Appwrite-Key': API_KEY
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const func = JSON.parse(data);
        console.log('✅ Function exists and is enabled:', func.enabled);
        console.log('Runtime:', func.runtime);
        console.log('Deployment:', func.deployment);
        
        if (func.enabled && func.deployment) {
          console.log('🧪 Testing function execution...');
          testFunctionExecution();
        } else {
          console.log('❌ Function not properly deployed or disabled');
        }
      } else {
        console.log('❌ Function check failed:', data);
      }
    });
  });

  req.on('error', e => console.log('❌ Function check error:', e.message));
  req.end();
}

function testFunctionExecution() {
  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions/super/executions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': '68a4e3da0022f3e129d0',
      'X-Appwrite-Key': API_KEY
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Function execution status:', res.statusCode);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const result = JSON.parse(data);
        console.log('✅ Function execution created');
        console.log('Execution ID:', result.$id);
        
        // Wait and check result
        setTimeout(() => {
          checkExecutionResult(result.$id);
        }, 5000);
      } else {
        console.log('❌ Function execution failed:', data);
      }
    });
  });

  req.on('error', e => console.log('❌ Execution error:', e.message));
  req.write(JSON.stringify({
    async: false,
    data: JSON.stringify({ 
      method: 'GET', 
      path: '/',
      headers: {}
    })
  }));
  req.end();
}

function checkExecutionResult(executionId) {
  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: `/v1/functions/super/executions/${executionId}`,
    method: 'GET',
    headers: {
      'X-Appwrite-Project': '68a4e3da0022f3e129d0',
      'X-Appwrite-Key': API_KEY
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const execution = JSON.parse(data);
        console.log('\n📊 Execution Results:');
        console.log('Status:', execution.status);
        console.log('Duration:', execution.duration + 'ms');
        console.log('Response Code:', execution.responseStatusCode);
        console.log('Response Size:', execution.responseSize, 'bytes');
        
        if (execution.logs) {
          console.log('\n📝 Logs:');
          console.log(execution.logs);
        }
        
        if (execution.errors) {
          console.log('\n❌ Errors:');
          console.log(execution.errors);
        }
        
        if (execution.responseStatusCode === 200) {
          console.log('\n✅ Function is working correctly!');
          console.log('🔍 Issue might be domain/DNS related, not function code');
          testDirectUrl();
        } else {
          console.log('\n❌ Function returning error:', execution.responseStatusCode);
          console.log('This explains the timeout issue');
        }
      }
    });
  });

  req.on('error', e => console.log('❌ Check result error:', e.message));
  req.end();
}

function testDirectUrl() {
  console.log('\n🌐 Testing direct URL access...');
  
  const options = {
    hostname: 'super.appwrite.network',
    path: '/',
    method: 'GET',
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    console.log('Direct URL status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    if (res.statusCode === 200) {
      console.log('✅ super.appwrite.network is accessible!');
    } else if (res.statusCode === 502) {
      console.log('❌ Bad Gateway - function not responding properly');
    } else if (res.statusCode === 503) {
      console.log('❌ Service Unavailable - function may be down');
    } else {
      console.log('⚠️ Unexpected status:', res.statusCode);
    }
    
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (body.includes('error') || body.includes('Error')) {
        console.log('📄 Response contains errors');
        console.log(body.substring(0, 500));
      } else {
        console.log('📄 Response looks normal (', body.length, 'bytes)');
      }
    });
  });

  req.on('error', e => {
    console.log('❌ Direct URL error:', e.message);
    if (e.code === 'ENOTFOUND') {
      console.log('🔍 Domain not found - DNS issue');
    } else if (e.code === 'ETIMEDOUT') {
      console.log('⏰ Request timeout - server not responding');
    } else if (e.code === 'ECONNRESET') {
      console.log('🔌 Connection reset - server dropped connection');
    }
  });

  req.on('timeout', () => {
    console.log('⏰ Direct URL timeout after 15 seconds');
    console.log('This confirms the timeout issue you\'re experiencing');
    req.destroy();
  });

  req.end();
}

// Start the diagnostic
checkFunctionHealth();