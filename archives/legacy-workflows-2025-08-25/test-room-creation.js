/**
 * Test Room Creation Endpoint
 * Tests JWT authentication and room creation flow
 */

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

// Configuration - matches server.js
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const SERVER_URL = 'http://localhost:3456';

// Generate a valid JWT token for testing
function generateTestToken(userId = 'test_user_123', username = 'testuser') {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

// Test room creation with valid token
async function testRoomCreationWithAuth() {
    console.log('\n=== Testing Room Creation WITH Authentication ===');
    
    const token = generateTestToken();
    console.log('✓ Generated JWT token');
    
    const roomData = {
        name: `Test Room ${Date.now()}`,
        description: 'This is a test room created by automated test',
        topics: ['test', 'automation'],
        is_public: true
    };
    
    try {
        const response = await fetch(`${SERVER_URL}/api/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(roomData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Room creation SUCCESSFUL!');
            console.log('Room ID:', result.room.id);
            console.log('Room Name:', result.room.name);
            console.log('Creator ID:', result.room.creator_id);
            return true;
        } else {
            console.log('❌ Room creation FAILED');
            console.log('Status:', response.status);
            console.log('Error:', result.error);
            console.log('Message:', result.message);
            console.log('Full response:', JSON.stringify(result, null, 2));
            return false;
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
        return false;
    }
}

// Test room creation without token (should fail with 401)
async function testRoomCreationWithoutAuth() {
    console.log('\n=== Testing Room Creation WITHOUT Authentication ===');
    
    const roomData = {
        name: `Test Room ${Date.now()}`,
        description: 'This should fail',
        topics: ['test'],
        is_public: true
    };
    
    try {
        const response = await fetch(`${SERVER_URL}/api/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roomData)
        });
        
        const result = await response.json();
        
        if (response.status === 401) {
            console.log('✅ Correctly rejected with 401 Unauthorized');
            console.log('Message:', result.message);
            return true;
        } else {
            console.log('❌ Unexpected response:', response.status);
            console.log('Result:', result);
            return false;
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
        return false;
    }
}

// Test room creation with invalid token (should fail with 403)
async function testRoomCreationWithInvalidToken() {
    console.log('\n=== Testing Room Creation with INVALID Token ===');
    
    // Create an invalid token (wrong secret)
    const invalidToken = jwt.sign(
        { userId: 'test', username: 'test' },
        'wrong-secret-key',
        { expiresIn: '24h' }
    );
    
    const roomData = {
        name: `Test Room ${Date.now()}`,
        description: 'This should fail',
        topics: ['test'],
        is_public: true
    };
    
    try {
        const response = await fetch(`${SERVER_URL}/api/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${invalidToken}`
            },
            body: JSON.stringify(roomData)
        });
        
        const result = await response.json();
        
        if (response.status === 403) {
            console.log('✅ Correctly rejected with 403 Forbidden');
            console.log('Message:', result.message);
            return true;
        } else {
            console.log('❌ Unexpected response:', response.status);
            console.log('Result:', result);
            return false;
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
        return false;
    }
}

// Check if server is running
async function checkServerHealth() {
    console.log('\n=== Checking Server Health ===');
    try {
        const response = await fetch(`${SERVER_URL}/api/test`);
        if (response.ok) {
            console.log('✅ Server is running on', SERVER_URL);
            return true;
        } else {
            console.log('⚠️ Server responded with status:', response.status);
            return true; // Server is running but maybe test endpoint doesn't exist
        }
    } catch (error) {
        console.log('❌ Server is NOT running on', SERVER_URL);
        console.log('Error:', error.message);
        console.log('\nPlease start the server with: npm start');
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('================================================');
    console.log('     ROOM CREATION ENDPOINT TEST SUITE');
    console.log('================================================');
    
    // Check if server is running
    const serverRunning = await checkServerHealth();
    if (!serverRunning) {
        console.log('\n⚠️ Cannot run tests without server. Exiting...');
        process.exit(1);
    }
    
    // Run test suite
    const results = [];
    
    results.push(await testRoomCreationWithoutAuth());
    results.push(await testRoomCreationWithInvalidToken());
    results.push(await testRoomCreationWithAuth());
    
    // Summary
    console.log('\n================================================');
    console.log('                TEST SUMMARY');
    console.log('================================================');
    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    
    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Room creation is working correctly!');
    } else {
        console.log('\n⚠️ Some tests failed. Check the output above for details.');
    }
}

// Run the tests
runTests().catch(console.error);