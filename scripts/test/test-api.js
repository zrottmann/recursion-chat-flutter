const https = require('https');

console.log('Testing API key permissions...');

// Test getting site info
const options = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/sites/68aa1b51000a9c3a9c36',
  method: 'GET',
  headers: {
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ API key has read access to sites');
      
      // Try listing sites
      const listOptions = {
        hostname: 'nyc.cloud.appwrite.io',
        path: '/v1/sites',
        method: 'GET',
        headers: {
          'X-Appwrite-Project': '68a4e3da0022f3e129d0',
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY
        }
      };
      
      const listReq = https.request(listOptions, (listRes) => {
        let listData = '';
        listRes.on('data', (chunk) => listData += chunk);
        listRes.on('end', () => {
          console.log('\nList Sites Status:', listRes.statusCode);
          console.log('List Sites Response:', listData);
        });
      });
      
      listReq.on('error', (e) => console.error('List error:', e.message));
      listReq.end();
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();