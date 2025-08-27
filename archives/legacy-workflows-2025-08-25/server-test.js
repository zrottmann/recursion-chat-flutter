// Simple server test to verify basic functionality
require('dotenv').config();
const express = require('express');

const app = express();
const PORT = 5175; // Different port to avoid conflicts

// Basic middleware
app.use(express.json());

// Test endpoints
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Test server running' });
});

app.post('/api/auth/appwrite-sync', (req, res) => {
    console.log('Appwrite sync endpoint hit');
    res.json({ success: true, message: 'Endpoint working' });
});

app.get('/api/invitations', (req, res) => {
    res.json({ success: true, invitations: [] });
});

app.get('/api/notifications', (req, res) => {
    res.json({ success: true, notifications: [] });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🧪 Test server running on port ${PORT}`);
    console.log('Test the following endpoints:');
    console.log(`• http://localhost:${PORT}/health`);
    console.log(`• http://localhost:${PORT}/api/auth/appwrite-sync`);
    console.log(`• http://localhost:${PORT}/api/invitations`);
    console.log(`• http://localhost:${PORT}/api/notifications`);
});