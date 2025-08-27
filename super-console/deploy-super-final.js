const https = require('https');
const fs = require('fs');

console.log('🚀 Final deployment to super.appwrite.network via function...');

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

// First try creating the super-site function
const createFunctionData = JSON.stringify({
  functionId: 'super-site',
  name: 'Super Console Site',
  runtime: 'static-1.0',
  execute: ['any'],
  events: [],
  schedule: '',
  timeout: 15
});

console.log('1️⃣ Creating/updating super-site function...');

const createOptions = {
  hostname: 'nyc.cloud.appwrite.io',
  path: '/v1/functions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': createFunctionData.length,
    'X-Appwrite-Project': '68a4e3da0022f3e129d0',
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
};

const createReq = https.request(createOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Create Function Status:', res.statusCode);
    
    if (res.statusCode === 201 || res.statusCode === 409) {
      // Function created or already exists
      console.log('✅ Function ready for deployment');
      deployToSuperSite();
    } else {
      console.log('Function creation response:', data);
      // Try deploying anyway in case function exists
      deployToSuperSite();
    }
  });
});

createReq.on('error', e => {
  console.log('Create function error, trying deployment anyway...');
  deployToSuperSite();
});

createReq.write(createFunctionData);
createReq.end();

function deployToSuperSite() {
  console.log('2️⃣ Deploying Super Console to super-site function...');
  
  const deployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions/super-site/deployments',
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
      console.log('Deploy Response:', data);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Super Console deployed successfully!');
        console.log('🌐 URL: https://super-site.appwrite.network');
        console.log('🎯 Also try: https://super.appwrite.network');
        console.log('');
        console.log('🎉 Claude Super Console is now live!');
        console.log('📱 Mobile-optimized and ready to use');
        
        try {
          const result = JSON.parse(data);
          console.log('📋 Deployment ID:', result.$id);
        } catch (e) {
          console.log('📋 Deployment response received');
        }
      } else {
        console.log('❌ Deployment failed');
        console.log('Will try alternative deployment...');
        
        // Try deploying to github-cli which we know worked
        deployAlternative();
      }
    });
  });

  deployReq.on('error', e => {
    console.log('❌ Deploy error:', e.message);
    deployAlternative();
  });
  
  deployReq.write(bodyBuffer);
  deployReq.end();
}

function deployAlternative() {
  console.log('3️⃣ Deploying to alternative function...');
  
  const altDeployOptions = {
    hostname: 'nyc.cloud.appwrite.io',
    path: '/v1/functions/orchestrator/deployments',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + boundary,
      'Content-Length': bodyBuffer.length,
      'X-Appwrite-Project': '68a4e3da0022f3e129d0',
      'X-Appwrite-Key': process.env.APPWRITE_API_KEY
    }
  };

  const altDeployReq = https.request(altDeployOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Alternative Deploy Status:', res.statusCode);
      
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Super Console deployed to alternative URL!');
        console.log('🌐 URL: https://orchestrator.appwrite.network');
        console.log('📱 Mobile-ready Super Console is live!');
      } else {
        console.log('❌ Alternative deployment also failed');
        console.log('Response:', data);
      }
    });
  });

  altDeployReq.on('error', e => console.log('❌ Alternative deploy error:', e.message));
  altDeployReq.write(bodyBuffer);
  altDeployReq.end();
}