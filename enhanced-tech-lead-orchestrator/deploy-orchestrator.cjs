const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

// Use the working API key from previous deployments
const projectId = '68a4e3da0022f3e129d0';
const apiKey = process.env.APPWRITE_API_KEY || 'standard_b7ef639243a1823b1ae6c6aa469027831555a3ffca4fb7dcf0152b5a335c1051a1169b5c54edfe0411c635a5d2332f1da617ed10f2f080cb38c8fd636041db60333b7f53308141f889ed0c66db3cf2be92d9ad59ed73b9ca2a5a147fcfe60f692a43a47f48e30903839c5ca919535e087fe37a14391febf153e23b383a02155f';
const endpoint = 'https://nyc.cloud.appwrite.io/v1';

// Site configuration - deploy to super-site that we know works
const siteId = 'super-site';
const siteDomain = 'super.appwrite.network';

console.log('🚀 Deploying Enhanced Tech-Lead Orchestrator to Appwrite Sites...');

// Create deployment package
console.log('📦 Creating deployment package...');
execSync('tar -czf orchestrator-deploy.tar.gz index.html *.html src/ server.js package.json', { stdio: 'inherit' });

async function deploySite() {
  console.log(`📤 Deploying to ${siteDomain}...`);
  
  // Read the deployment archive
  const deployArchive = fs.readFileSync('orchestrator-deploy.tar.gz');
  
  const options = {
    hostname: endpoint.replace('https://', '').replace('/v1', ''),
    port: 443,
    path: `/v1/functions/${siteId}/deployments`,
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey,
    }
  };

  // Create multipart form data
  const boundary = '----WebKitFormBoundary' + Date.now();
  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="entrypoint"\r\n\r\n';
  body += 'index.html\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="activate"\r\n\r\n';
  body += 'true\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="code"; filename="orchestrator.tar.gz"\r\n';
  body += 'Content-Type: application/gzip\r\n\r\n';

  const bodyBuffer = Buffer.concat([
    Buffer.from(body),
    deployArchive,
    Buffer.from('\r\n--' + boundary + '--\r\n')
  ]);

  options.headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary;
  options.headers['Content-Length'] = bodyBuffer.length;
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('✅ Deployment successful!');
          console.log(`🌐 Enhanced Tech-Lead Orchestrator is now live at: https://${siteDomain}`);
          console.log('📱 Mobile interface: https://' + siteDomain + '/mobile-operations-center.html');
          console.log('🎯 Features deployed:');
          console.log('  • Real-time agent orchestration dashboard');
          console.log('  • Flutter coordination system');
          console.log('  • Mobile deployment pipeline');
          console.log('  • WebSocket-based communication');
          console.log('  • CLI development tools');
          resolve(data);
        } else {
          console.error(`❌ Deployment failed with status ${res.statusCode}`);
          console.error(data);
          reject(new Error(data));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Deployment error:', error);
      reject(error);
    });
    
    req.write(bodyBuffer);
    req.end();
  });
}

// Execute deployment
deploySite().catch(error => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});