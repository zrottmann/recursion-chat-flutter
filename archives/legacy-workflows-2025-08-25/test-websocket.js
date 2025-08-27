// WebSocket Connection Test for Agent Swarm Orchestrator
import WebSocket from 'ws';
import chalk from 'chalk';

console.log(chalk.cyan('🔌 Testing WebSocket connection to Agent Swarm Orchestrator...'));

const ws = new WebSocket('ws://localhost:12300');

ws.on('open', () => {
    console.log(chalk.green('✅ Connected to Agent Swarm Orchestrator!'));
    
    // Send a test message
    ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
    }));
    
    console.log(chalk.blue('📤 Sent ping message'));
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(chalk.green('📥 Received message:'), message);
        
        if (message.type === 'connection:welcome') {
            console.log(chalk.yellow('🎉 Welcome message received!'));
            console.log('Server features:', message.features);
            
            // Try authentication
            ws.send(JSON.stringify({
                type: 'auth:login',
                payload: {
                    token: 'test-token-123',
                    userId: 'test-user',
                    role: 'admin'
                }
            }));
            
            console.log(chalk.blue('🔐 Sent authentication request'));
        }
        
        if (message.type === 'auth:success') {
            console.log(chalk.green('✅ Authentication successful!'));
            
            // Subscribe to topics
            ws.send(JSON.stringify({
                type: 'subscribe',
                payload: {
                    topics: ['missions', 'agents', 'system']
                }
            }));
            
            console.log(chalk.blue('📡 Subscribed to topics'));
        }
        
        if (message.type === 'subscription:success') {
            console.log(chalk.green('✅ Subscription successful!'));
            console.log(`Total subscriptions: ${message.totalSubscriptions}`);
            
            // Test complete - close connection
            setTimeout(() => {
                console.log(chalk.yellow('🔚 Test complete, closing connection...'));
                ws.close();
            }, 2000);
        }
        
    } catch (error) {
        console.error(chalk.red('❌ Error parsing message:'), error);
    }
});

ws.on('error', (error) => {
    console.error(chalk.red('❌ WebSocket error:'), error.message);
    if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow('⚠️ Server is not running. Start it with: npm run start:server'));
    }
});

ws.on('close', (code, reason) => {
    console.log(chalk.blue(`📱 Connection closed (code: ${code}, reason: ${reason || 'none'})`));
    process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log(chalk.yellow('⏱️ Test timeout - closing connection'));
    ws.close();
    process.exit(1);
}, 10000);