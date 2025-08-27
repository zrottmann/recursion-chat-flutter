const https = require('https');

console.log('🔍 Testing API key permissions comprehensively...\n');

const apiKey = process.env.APPWRITE_API_KEY;
const projectId = '68a4e3da0022f3e129d0';

const endpoints = [
  { path: '/v1/health', name: 'Health Check' },
  { path: '/v1/projects', name: 'Projects' },
  { path: '/v1/functions', name: 'Functions' },
  { path: '/v1/databases', name: 'Databases' },
  { path: '/v1/storage/buckets', name: 'Storage Buckets' },
  { path: '/v1/users', name: 'Users' },
  { path: '/v1/teams', name: 'Teams' },
  { path: '/v1/sites', name: 'Sites' },
];

let completed = 0;

endpoints.forEach(endpoint => {
  const options = {
    hostname: 'nyc.cloud.appwrite.io',
    path: endpoint.path,
    method: 'GET',
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log(`✅ ${endpoint.name}: ALLOWED`);
        try {
          const parsed = JSON.parse(data);
          if (parsed.total !== undefined) {
            console.log(`   Found ${parsed.total} items`);
          }
        } catch (e) {}
      } else if (res.statusCode === 401) {
        console.log(`❌ ${endpoint.name}: DENIED (Unauthorized)`);
      } else if (res.statusCode === 404) {
        console.log(`⚠️  ${endpoint.name}: NOT FOUND (Endpoint may not exist)`);
      } else {
        console.log(`❓ ${endpoint.name}: Status ${res.statusCode}`);
      }
      
      completed++;
      if (completed === endpoints.length) {
        console.log('\n📋 Summary: This API key has limited permissions.');
        console.log('🔑 Key info:');
        console.log('   Project ID:', projectId);
        console.log('   Site ID: 68aa1b51000a9c3a9c36');
        console.log('\n💡 Recommendation: The API key may need additional scopes for Sites deployment.');
      }
    });
  });
  
  req.on('error', e => {
    console.log(`❌ ${endpoint.name}: Request failed - ${e.message}`);
    completed++;
  });
  
  req.end();
});