const https = require('https');
const fs = require('fs');

console.log('🚀 Deploying Super Console directly...');

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
  path: '/v1/functions/remote/deployments',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': bodyBuffer.length,
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

const deployReq = https.request(deployOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Deploy Status:', res.statusCode);
    
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('✅ Super Console deployed successfully!');
      console.log('🌐 URL: https://remote.appwrite.network');
      console.log('🎯 Console available at: https://remote.appwrite.network');
      console.log('');
      console.log('🎉 Features now live:');
      console.log('  • Modern xterm.js terminal interface');
      console.log('  • Session management system');
      console.log('  • File explorer with tree view');
      console.log('  • Responsive design for mobile and desktop');
      console.log('  • Real-time command execution simulation');
      const result = JSON.parse(data);
      console.log('📋 Deployment ID:', result.$id);
    } else {
      console.log('❌ Deployment failed');
      console.log('Response:', data);
    }
  });
});

deployReq.on('error', e => console.log('❌ Deploy error:', e.message));
deployReq.write(bodyBuffer);
deployReq.end();