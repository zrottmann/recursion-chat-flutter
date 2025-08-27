const https = require('https');
const fs = require('fs');

console.log('🚀 Deploying Enhanced Tech-Lead Orchestrator to super.appwrite.network...');

const fileData = fs.readFileSync('orchestrator-site.tar.gz');
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
  fileData,
  Buffer.from('\r\n--' + boundary + '--\r\n')
]);

const options = {
  hostname: 'nyc.cloud.appwrite.io',
  port: 443,
  path: '/v1/functions/super-site/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Deploy Status:', res.statusCode);
    console.log('Response:', data);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Enhanced Tech-Lead Orchestrator deployed successfully!');
      console.log('🌐 Main Dashboard: https://super.appwrite.network');
      console.log('📱 Mobile Interface: https://super.appwrite.network/mobile-operations-center.html');
      console.log('🎯 Operations Center: https://super.appwrite.network/examples/demo-operations-center-enhanced.html');
      console.log('💬 Chat Interface: https://super.appwrite.network/chat-index.html');
      console.log('🧪 Test Interface: https://super.appwrite.network/client-test.html');
      console.log('');
      console.log('🎉 All Enhanced Tech-Lead Orchestrator interfaces now live!');
      
      try {
        const result = JSON.parse(data);
        console.log('📋 Deployment ID:', result.$id);
      } catch (e) {
        console.log('📋 Deployment successful but could not parse response');
      }
    } else {
      console.log('❌ Deployment failed');
    }
  });
});

req.on('error', e => console.log('❌ Request error:', e.message));
req.write(bodyBuffer);
req.end();