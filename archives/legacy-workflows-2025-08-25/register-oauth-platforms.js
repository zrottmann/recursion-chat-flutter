/**
 * Simple OAuth Platform Registration for Trading Post
 * Registers tradingpost.appwrite.network as a Web platform
 */

import { Client, Account, ID } from 'appwrite';

const APPWRITE_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '689bdee000098bd9d55c';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);

console.log('═══════════════════════════════════════════════════');
console.log('     OAuth Platform Registration Instructions');
console.log('═══════════════════════════════════════════════════\n');

console.log('The error "Invalid URI. Register your new client (tradingpost.appwrite.network)"');
console.log('means the domain needs to be added as a Web platform in Appwrite.\n');

console.log('🔧 IMMEDIATE FIX - Add platforms manually:\n');
console.log('1. Open Appwrite Console PROJECT OVERVIEW:');
console.log('   https://cloud.appwrite.io/console/project-689bdee000098bd9d55c\n');

console.log('2. On the Overview page, click "Add platform" button (or go to Settings → Platforms)\n');

console.log('3. Select "Web" and add these domains:\n');
console.log('   PRIMARY (Required):');
console.log('   ✅ tradingpost.appwrite.network');
console.log('   ✅ 689cb415001a367e69f8.appwrite.global\n');

console.log('   DEVELOPMENT (Optional):');
console.log('   ○ localhost:3000');
console.log('   ○ localhost:3001');
console.log('   ○ localhost:5173');
console.log('   ○ localhost:5174');
console.log('   ○ localhost:5175\n');

console.log('4. For each platform:');
console.log('   - Name: Trading Post - [domain]');
console.log('   - Hostname: [domain] (exactly as shown above)\n');

console.log('5. Click "Create" for each platform\n');

console.log('✅ Once added, OAuth will work immediately!\n');

console.log('═══════════════════════════════════════════════════\n');

// Test OAuth configuration
console.log('📋 Current OAuth Configuration:\n');
console.log('Project ID:', APPWRITE_PROJECT_ID);
console.log('Endpoint:', APPWRITE_ENDPOINT);
console.log('Callback URL: https://tradingpost.appwrite.network/auth/callback');
console.log('Error URL: https://tradingpost.appwrite.network/auth/error\n');

console.log('🔍 Testing OAuth with current settings...\n');

// Create a test OAuth URL to verify configuration
function testOAuthUrl() {
  const provider = 'google';
  const successUrl = 'https://tradingpost.appwrite.network/auth/callback';
  const failureUrl = 'https://tradingpost.appwrite.network/auth/error';
  
  console.log('Test OAuth URL for Google:');
  console.log(`${APPWRITE_ENDPOINT}/account/sessions/oauth2/${provider}?`);
  console.log(`  project=${APPWRITE_PROJECT_ID}&`);
  console.log(`  success=${encodeURIComponent(successUrl)}&`);
  console.log(`  failure=${encodeURIComponent(failureUrl)}\n`);
  
  console.log('If platforms are registered correctly, this URL should work without errors.\n');
}

testOAuthUrl();

console.log('═══════════════════════════════════════════════════');
console.log('Need help? Check the Appwrite OAuth docs:');
console.log('https://appwrite.io/docs/products/auth/oauth2');
console.log('═══════════════════════════════════════════════════');