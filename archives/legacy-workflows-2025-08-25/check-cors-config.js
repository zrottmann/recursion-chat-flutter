// Simple script to test CORS configuration
const testCORS = async () => {
  console.log('🔍 Testing CORS configuration for Trading Post...\n');
  
  const endpoint = 'https://nyc.cloud.appwrite.io/v1';
  const projectId = '689bdee000098bd9d55c';
  
  // Test from different origins
  const origins = [
    'https://tradingpost.appwrite.network',
    'https://689cb415001a367e69f8.appwrite.global',
    'http://localhost:3000'
  ];
  
  console.log('Testing Appwrite endpoint:', endpoint);
  console.log('Project ID:', projectId);
  console.log('\n📋 Testing origins:');
  
  for (const origin of origins) {
    console.log(`\n  Testing from: ${origin}`);
    
    try {
      const response = await fetch(`${endpoint}/account`, {
        method: 'GET',
        headers: {
          'X-Appwrite-Project': projectId,
          'Origin': origin,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      const corsHeader = response.headers.get('access-control-allow-origin');
      console.log(`    CORS Header: ${corsHeader || 'Not set'}`);
      console.log(`    Status: ${response.status}`);
      
      if (corsHeader === origin || corsHeader === '*') {
        console.log(`    ✅ CORS configured correctly for ${origin}`);
      } else {
        console.log(`    ❌ CORS mismatch - Expected: ${origin}, Got: ${corsHeader}`);
      }
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n\n📝 CORS Configuration Summary:');
  console.log('If you see CORS mismatches above, you need to:');
  console.log('1. Go to: https://cloud.appwrite.io/console/project-689bdee000098bd9d55c/settings');
  console.log('2. Navigate to the "Platforms" section');
  console.log('3. Ensure these platforms are added as "Web" platforms:');
  console.log('   - tradingpost.appwrite.network');
  console.log('   - 689cb415001a367e69f8.appwrite.global');
  console.log('   - localhost (for development)');
};

testCORS();