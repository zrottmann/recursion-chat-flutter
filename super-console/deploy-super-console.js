const https = require('https');
const fs = require('fs');

console.log('🚀 Deploying Super Console to super.appwrite.network...');

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
  path: '/v1/functions/super-site/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': '68a0db634634a6d0392f',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

const deployReq = https.request(deployOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Deploy Status:', res.statusCode);
    console.log('Deploy Response:', data);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Deployment successful!');
      console.log('🌐 Super Console URL: https://super.appwrite.network');
    } else {
      console.log('❌ Deployment failed');
    }
  });
});

deployReq.on('error', e => console.log('❌ Deploy error:', e.message));
deployReq.write(bodyBuffer);
deployReq.end();