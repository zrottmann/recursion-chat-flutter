const sdk = require('node-appwrite');
console.log('Available SDK services:');
console.log(Object.keys(sdk));

// Check if we can create a client
try {
  const client = new sdk.Client();
  console.log('✅ Client created successfully');
} catch (error) {
  console.error('❌ Client creation failed:', error);
}