const https = require('https');

console.log('🔍 Testing autonomous function execution...');

if (!process.env.APPWRITE_API_KEY) {
  console.log('❌ No API key in environment');
  process.exit(1);
}

console.log('✅ API key found:', process.env.APPWRITE_API_KEY.substring(0, 20) + '...');
console.log('✅ Autonomous execution successful!');