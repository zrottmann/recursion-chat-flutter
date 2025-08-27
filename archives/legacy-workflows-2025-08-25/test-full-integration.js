import WebSocket from 'ws';

console.log('🚀 Testing Claude CLI + Orchestrator Integration...\n');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('✅ Connected to Orchestrator WebSocket Server');
    
    // Test 1: Send handshake
    const handshake = {
        type: 'claude_cli_handshake',
        source: 'claude-cli-node-test',
        timestamp: Date.now()
    };
    ws.send(JSON.stringify(handshake));
    console.log('📤 Sent handshake:', handshake);
    
    // Test 2: Request server status
    setTimeout(() => {
        const statusRequest = {
            type: 'status_request',
            timestamp: Date.now()
        };
        ws.send(JSON.stringify(statusRequest));
        console.log('📤 Requested server status');
    }, 1000);
    
    // Test 3: Send orchestration command
    setTimeout(() => {
        const command = {
            type: 'orchestrate',
            action: 'initialize_project',
            payload: {
                projectName: 'test-claude-integration',
                features: ['websocket', 'ai', 'automation'],
                timestamp: Date.now()
            }
        };
        ws.send(JSON.stringify(command));
        console.log('📤 Sent orchestration command:', command);
    }, 2000);
    
    // Test 4: Send shard connection request
    setTimeout(() => {
        const shardRequest = {
            type: 'connect_to_shard',
            shardId: 'test-shard-001',
            region: 'us-east',
            timestamp: Date.now()
        };
        ws.send(JSON.stringify(shardRequest));
        console.log('📤 Requested shard connection:', shardRequest);
    }, 3000);
    
    // Close after 5 seconds
    setTimeout(() => {
        console.log('\n👋 Closing connection...');
        ws.close();
        process.exit(0);
    }, 5000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log('📥 Received:', message);
        
        // Log specific message types
        if (message.type === 'welcome') {
            console.log(`   ➡️ Client ID assigned: ${message.clientId}`);
        } else if (message.type === 'shard_connected') {
            console.log(`   ➡️ Connected to shard: ${message.shardId} with ${message.playersInShard} players`);
        } else if (message.type === 'error') {
            console.log(`   ❌ Error: ${message.message}`);
        }
    } catch (e) {
        console.log('📥 Received (raw):', data.toString());
    }
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
    console.log('🔌 Connection closed');
});