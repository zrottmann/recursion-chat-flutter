/**
 * Local Test Script for Super Site Function
 * Run with: node test-local.js
 */

// Mock Appwrite function environment
const mockReq = {
  method: 'GET',
  path: '/',
  headers: {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
  }
};

const mockRes = {
  send: (content, status = 200, headers = {}) => {
    console.log('\n=== RESPONSE ===');
    console.log(`Status: ${status}`);
    console.log('Headers:', headers);
    console.log('Content length:', content.length, 'bytes');
    console.log('Content preview (first 500 chars):');
    console.log(content.substring(0, 500) + '...');
    return { status, headers, content };
  }
};

const mockLog = (message) => {
  console.log(`[LOG] ${message}`);
};

const mockError = (message) => {
  console.error(`[ERROR] ${message}`);
};

// Import and test the function
const superSiteFunction = require('./index.js');

console.log('🚀 Testing Super Site Function Locally...\n');

// Test the function
superSiteFunction({
  req: mockReq,
  res: mockRes,
  log: mockLog,
  error: mockError
}).then((result) => {
  console.log('\n✅ Function executed successfully!');
  console.log('Result:', result ? 'Response sent' : 'No explicit return');
}).catch((err) => {
  console.error('\n❌ Function failed:', err.message);
  console.error('Stack:', err.stack);
});

// Test error handling
console.log('\n🧪 Testing error handling with invalid request...');
const invalidReq = { ...mockReq, path: null };

superSiteFunction({
  req: invalidReq,
  res: mockRes,
  log: mockLog,
  error: mockError
}).then(() => {
  console.log('\n✅ Error handling test completed');
}).catch((err) => {
  console.error('\n❌ Error handling failed:', err.message);
});