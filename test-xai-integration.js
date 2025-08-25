/**
 * Test script for xAI integration
 * Tests both frontend and backend xAI functionality
 */

// Test environment variables
console.log('🔧 Testing xAI Environment Configuration...\n');

// Backend environment variables
const backendVars = {
  'XAI_API_KEY': process.env.XAI_API_KEY,
  'XAI_MODEL': process.env.XAI_MODEL,
  'XAI_ENDPOINT': process.env.XAI_ENDPOINT
};

console.log('Backend Environment Variables:');
Object.entries(backendVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = key === 'XAI_API_KEY' ? 
    (value ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : 'Not set') : 
    value || 'Not set';
  console.log(`${status} ${key}: ${displayValue}`);
});

console.log('\n📱 Frontend Environment Variables:');
// Simulate frontend environment check
const frontendVars = {
  'VITE_XAI_API_KEY': process.env.VITE_XAI_API_KEY,
  'VITE_XAI_MODEL': process.env.VITE_XAI_MODEL,
  'VITE_XAI_ENDPOINT': process.env.VITE_XAI_ENDPOINT
};

Object.entries(frontendVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = key === 'VITE_XAI_API_KEY' ? 
    (value ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` : 'Not set') : 
    value || 'Not set';
  console.log(`${status} ${key}: ${displayValue}`);
});

// Test xAI API connection
async function testXAIConnection() {
  console.log('\n🔗 Testing xAI API Connection...\n');
  
  const apiKey = process.env.XAI_API_KEY || process.env.VITE_XAI_API_KEY;
  const endpoint = process.env.XAI_ENDPOINT || process.env.VITE_XAI_ENDPOINT || 'https://api.x.ai/v1';
  const model = process.env.XAI_MODEL || process.env.VITE_XAI_MODEL || 'grok-beta';

  if (!apiKey || apiKey === 'local_test_key') {
    console.log('❌ No valid xAI API key found. Skipping connection test.');
    return false;
  }

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: 'Hello! This is a test message for Trading Post chat integration.'
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ xAI API connection successful!');
      console.log(`📝 Test response: ${data.choices[0].message.content}`);
      console.log(`🏷️  Model used: ${data.model}`);
      console.log(`📊 Tokens used: ${data.usage?.total_tokens || 'Unknown'}`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ xAI API connection failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ xAI API connection error: ${error.message}`);
    return false;
  }
}

// Test summary
async function runTests() {
  console.log('🧪 xAI Integration Test Suite\n');
  console.log('=' .repeat(50));
  
  const envConfigured = backendVars.XAI_API_KEY && frontendVars.VITE_XAI_API_KEY;
  const apiWorking = await testXAIConnection();
  
  console.log('\n📋 Test Summary:');
  console.log('=' .repeat(30));
  console.log(`${envConfigured ? '✅' : '❌'} Environment Configuration`);
  console.log(`${apiWorking ? '✅' : '❌'} API Connection`);
  
  if (envConfigured && apiWorking) {
    console.log('\n🎉 xAI integration is ready for Trading Post chat functionality!');
    console.log('\nNext steps:');
    console.log('1. Start the Trading Post application');
    console.log('2. Navigate to a chat conversation');
    console.log('3. Look for the AI (🤖) button in the chat interface');
    console.log('4. Try generating AI suggestions or responses');
  } else {
    console.log('\n⚠️  xAI integration needs attention:');
    if (!envConfigured) {
      console.log('- Check environment variable configuration');
    }
    if (!apiWorking) {
      console.log('- Verify API key validity and network connectivity');
    }
  }
  
  console.log('\n📚 Documentation:');
  console.log('- Environment files updated with xAI configuration');
  console.log('- xAI chat service created: src/services/xaiChatService.js');
  console.log('- ChatInterface updated with AI features');
  console.log('- Backend AI matching engine supports xAI');
  console.log('- AI config service updated for xAI management');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testXAIConnection, runTests };