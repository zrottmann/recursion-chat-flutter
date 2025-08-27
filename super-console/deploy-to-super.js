const https = require('https');
const fs = require('fs');

console.log('🎯 Deploying Super Console to super.appwrite.network...');

const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;
const PROJECT_ID = '68a4e3da0022f3e129d0';

// First check what sites exist
const sitesOptions = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/sites',
  method: 'GET',
  headers: {
    'X-Appwrite-Project': PROJECT_ID,
    'X-Appwrite-Key': APPWRITE_API_KEY
  }
};

console.log('1️⃣ Checking available sites...');

const sitesReq = https.request(sitesOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Sites API Status:', res.statusCode);
    
    if (res.statusCode === 200) {
      const result = JSON.parse(data);
      console.log('✅ Found sites:', result.total);
      result.sites.forEach(site => {
        console.log(`  - ${site.name} (${site.$id}) - Domain: ${site.domain || 'N/A'}`);
      });
      
      // Look for super-related site or try to deploy to first available
      const superSite = result.sites.find(site => site.name.includes('super') || site.$id.includes('super'));
      if (superSite) {
        console.log(`\n2️⃣ Deploying to site: ${superSite.name} (${superSite.$id})`);
        deployToSite(superSite.$id);
      } else if (result.sites.length > 0) {
        console.log(`\n2️⃣ No super site found, deploying to: ${result.sites[0].name}`);
        deployToSite(result.sites[0].$id);
      } else {
        console.log('\n2️⃣ No sites found. Creating new site...');
        createSite();
      }
    } else {
      console.log('❌ Sites API failed:', data);
      // Fallback: try deploying to super-site function
      console.log('\n2️⃣ Trying function deployment as fallback...');
      deployToFunction('super-site');
    }
  });
});

sitesReq.on('error', e => console.log('❌ Sites API error:', e.message));
sitesReq.end();

function deployToSite(siteId) {
  const fileData = fs.readFileSync('super-console-demo.tar.gz');
  const boundary = '----WebKitFormBoundary' + Date.now();

  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
  body += 'index.html\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
  body += 'true\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="code"; filename="super-console.tar.gz"\r\n';
  body += 'Content-Type: application/gzip\r\n\r\n';

  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    fileData,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  const deployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: `/v1/sites/${siteId}/deployments`,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': bodyBuffer.length,
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': APPWRITE_API_KEY
    }
  };

  const deployReq = https.request(deployOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Site Deploy Status:', res.statusCode);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Super Console deployed to site successfully!');
        console.log(`🌐 Site URL: https://${siteId}.appwrite.global`);
        console.log('🎯 Check: https://super.appwrite.network (if configured)');
        
        const result = JSON.parse(data);
        console.log('📋 Deployment ID:', result.$id);
      } else {
        console.log('❌ Site deployment failed');
        console.log('Response:', data);
      }
    });
  });

  deployReq.on('error', e => console.log('❌ Site deploy error:', e.message));
  deployReq.write(bodyBuffer);
  deployReq.end();
}

function deployToFunction(functionId) {
  const fileData = fs.readFileSync('super-console-demo.tar.gz');
  const boundary = '----WebKitFormBoundary' + Date.now();

  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
  body += 'index.html\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
  body += 'true\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="code"; filename="super-console.tar.gz"\r\n';
  body += 'Content-Type: application/gzip\r\n\r\n';

  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    fileData,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  const deployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: `/v1/functions/${functionId}/deployments`,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': bodyBuffer.length,
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': APPWRITE_API_KEY
    }
  };

  const deployReq = https.request(deployOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Function Deploy Status:', res.statusCode);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Super Console deployed to function!');
        console.log(`🌐 URL: https://${functionId}.appwrite.network`);
        
        const result = JSON.parse(data);
        console.log('📋 Deployment ID:', result.$id);
      } else {
        console.log('❌ Function deployment failed');
        console.log('Response:', data);
      }
    });
  });

  deployReq.on('error', e => console.log('❌ Function deploy error:', e.message));
  deployReq.write(bodyBuffer);
  deployReq.end();
}

function createSite() {
  const siteData = JSON.stringify({
    siteId: 'super-console',
    name: 'Super Console',
    domain: 'super.appwrite.network'
  });
  
  const createOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/sites',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': siteData.length,
      'X-Appwrite-Project': PROJECT_ID,
      'X-Appwrite-Key': APPWRITE_API_KEY
    }
  };
  
  const createReq = https.request(createOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Create Site Status:', res.statusCode);
      
      if (res.statusCode === 201) {
        console.log('✅ Site created! Deploying...');
        deployToSite('super-console');
      } else {
        console.log('❌ Site creation failed:', data);
      }
    });
  });
  
  createReq.on('error', e => console.log('❌ Create site error:', e.message));
  createReq.write(siteData);
  createReq.end();
}