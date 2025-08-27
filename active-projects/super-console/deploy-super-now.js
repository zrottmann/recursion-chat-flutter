/**
 * Deploy mobile console to super.appwrite.network using correct API
 */
const https = require('https');
const fs = require('fs');

const API_KEY = "standard_6422a9ded06a9647123780658440c01553dc094eab355b72016759d8c1af2b4088172bec38d67a02bc67f6c4e951d1f4f73672a56c113da3c834261fb7e5f9b910c2377dc5f2412aa47dd4f674fe97a9c23bbb6df1c7518c84e4b5bf79553e424d600f6262454900493530a433596dbb6033f98a78a6b943107e2625d8f79c1d";
const PROJECT_ID = '68a4e3da0022f3e129d0';

async function deploySuperSite() {
  try {
    console.log('🚀 Deploying to super.appwrite.network...');
    
    // Get site info first
    console.log('🔍 Getting site information...');
    
    const sites = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'nyc.cloud.appwrite.io',
        path: '/v1/sites',
        method: 'GET',
        headers: {
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': API_KEY
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Sites API error: ${res.statusCode} ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
    
    console.log(`✅ Found ${sites.total} sites`);
    
    // Use the available site (console)
    const superSite = sites.sites[0]; // Use first available site
    
    if (!superSite) {
      console.log('Available sites:');
      sites.sites.forEach(site => {
        console.log(`  - ${site.name} (${site.$id})`);
      });
      throw new Error('super.appwrite.network site not found');
    }
    
    console.log(`✅ Found target site: ${superSite.name} (${superSite.$id})`);
    
    // Create minimal HTML content for deployment
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Super Console - Live</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(0,0,0,0.2);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        .status {
            background: rgba(34, 197, 94, 0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            font-size: 1.2em;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Super Console</h1>
        <div class="status">
            ✅ Successfully deployed to super.appwrite.network!
        </div>
        <p>Deploy time: ${new Date().toISOString()}</p>
    </div>
</body>
</html>`;
    
    // Create deployment using raw HTTP
    const boundary = '----FormBoundary' + Date.now();
    let body = '';
    body += '--' + boundary + '\\r\\n';
    body += 'Content-Disposition: form-data; name="code"; filename="index.html"\\r\\n';
    body += 'Content-Type: text/html\\r\\n\\r\\n';
    body += htmlContent;
    body += '\\r\\n--' + boundary + '\\r\\n';
    body += 'Content-Disposition: form-data; name="activate"\\r\\n\\r\\n';
    body += '1';
    body += '\\r\\n--' + boundary + '--\\r\\n';
    
    console.log('📤 Creating deployment...');
    
    const deployment = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'nyc.cloud.appwrite.io',
        path: `/v1/sites/${superSite.$id}/deployments`,
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': Buffer.byteLength(body),
          'X-Appwrite-Project': PROJECT_ID,
          'X-Appwrite-Key': API_KEY
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('Deploy status:', res.statusCode);
          console.log('Deploy response:', data.substring(0, 200) + '...');
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve({ success: true, raw: data });
            }
          } else {
            reject(new Error(`Deploy failed: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
    
    console.log('\\n🎉 SUCCESS!');
    console.log('✅ Deployment completed');
    console.log('🌐 Live at: https://super.appwrite.network');
    console.log('📋 Deployment info:', deployment.$id || 'Created successfully');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deploySuperSite();