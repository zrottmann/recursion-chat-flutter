// WebSocket Integration for Claude Code Remote Chat
// Integrates with enhanced-tech-lead-orchestrator WebSocket manager

class ClaudeCodeWebSocketManager {
    constructor() {
        this.ws = null;
        this.clientId = null;
        this.connectionStatus = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = null;
        this.pingInterval = null;
        this.messageHandlers = new Map();
        this.connectionCallbacks = new Map();
        
        // Connection configuration
        this.config = {
            ports: [9100, 9200, 9300, 8080, 8081], // Try common orchestrator ports
            reconnectDelay: 3000,
            pingInterval: 30000,
            connectionTimeout: 10000
        };
    }

    // Initialize WebSocket connection
    async connect(consoleEndpoint) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log('Already connected to WebSocket');
            return true;
        }

        this.connectionStatus = 'connecting';
        this.emit('status:connecting', { endpoint: consoleEndpoint });

        try {
            // Parse endpoint or use default ports
            const wsUrl = this.parseEndpoint(consoleEndpoint);
            
            this.ws = new WebSocket(wsUrl);
            
            // Set connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.ws.readyState === WebSocket.CONNECTING) {
                    this.ws.close();
                    this.handleConnectionError(new Error('Connection timeout'));
                }
            }, this.config.connectionTimeout);

            this.ws.onopen = () => {
                clearTimeout(connectionTimeout);
                this.connectionStatus = 'connected';
                this.reconnectAttempts = 0;
                
                console.log('✅ WebSocket connected successfully');
                this.emit('status:connected', { endpoint: wsUrl });
                
                // Send handshake
                this.sendHandshake();
                
                // Start ping interval
                this.startPingInterval();
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('❌ Invalid message received:', error);
                }
            };

            this.ws.onerror = (error) => {
                clearTimeout(connectionTimeout);
                this.handleConnectionError(error);
            };

            this.ws.onclose = (event) => {
                clearTimeout(connectionTimeout);
                this.handleDisconnection(event);
            };

            return new Promise((resolve, reject) => {
                this.connectionCallbacks.set('connect', { resolve, reject });
            });

        } catch (error) {
            this.handleConnectionError(error);
            return false;
        }
    }

    // Parse endpoint or try default ports
    parseEndpoint(endpoint) {
        if (endpoint && endpoint.startsWith('ws')) {
            return endpoint;
        }

        // Try to extract hostname/port from endpoint
        if (endpoint && endpoint.includes(':')) {
            const [host, port] = endpoint.replace(/^(ws|wss):\/\//, '').split(':');
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${host}:${port}`;
        }

        // Default to localhost with first available port
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const port = this.config.ports[this.reconnectAttempts % this.config.ports.length];
        return `${protocol}//localhost:${port}`;
    }

    // Send handshake message to identify as Claude Code Remote client
    sendHandshake() {
        this.send({
            type: 'handshake',
            clientType: 'claude-code-remote',
            version: '1.0.0',
            features: ['chat', 'multi-console', 'real-time']
        });
    }

    // Handle incoming WebSocket messages
    handleMessage(data) {
        const { type } = data;
        
        switch (type) {
            case 'connection:welcome':
                this.clientId = data.clientId;
                console.log(`🎉 Welcome message received. Client ID: ${this.clientId}`);
                this.resolveConnection(true);
                break;

            case 'handshake:response':
                this.clientId = data.clientId;
                console.log(`🤝 Handshake successful. Server version: ${data.serverVersion}`);
                this.resolveConnection(true);
                break;

            case 'pong':
                console.log('📡 Pong received');
                break;

            case 'ai:response':
                this.emit('claude:response', data);
                break;

            case 'agent:command-broadcast':
                this.emit('command:response', data);
                break;

            case 'error':
                console.error('❌ Server error:', data.error);
                this.emit('error', data);
                break;

            default:
                // Emit to registered handlers
                this.emit(type, data);
        }
    }

    // Handle connection errors
    handleConnectionError(error) {
        console.error('❌ WebSocket connection error:', error);
        this.connectionStatus = 'error';
        this.emit('status:error', { error });
        
        // Attempt reconnection
        this.attemptReconnection();
    }

    // Handle disconnection
    handleDisconnection(event) {
        console.log(`⚠️ WebSocket disconnected: Code ${event.code}, Reason: ${event.reason}`);
        this.connectionStatus = 'disconnected';
        this.clientId = null;
        
        // Clear intervals
        this.stopPingInterval();
        
        this.emit('status:disconnected', { 
            code: event.code, 
            reason: event.reason 
        });

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000) {
            this.attemptReconnection();
        }
    }

    // Attempt to reconnect
    attemptReconnection() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Max reconnection attempts reached');
            this.emit('status:max-reconnect-attempts');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        this.reconnectInterval = setTimeout(() => {
            // Try next port in the list
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const port = this.config.ports[this.reconnectAttempts % this.config.ports.length];
            const endpoint = `${protocol}//localhost:${port}`;
            
            this.connect(endpoint).catch(() => {
                // Connection failed, will retry automatically
            });
        }, this.config.reconnectDelay);
    }

    // Send message to Claude Code via WebSocket
    sendClaudeMessage(message, consoleId = 'default') {
        if (!this.isConnected()) {
            throw new Error('Not connected to WebSocket server');
        }

        this.send({
            type: 'ai:request',
            requestId: Date.now().toString(),
            prompt: message,
            consoleId: consoleId,
            timestamp: new Date().toISOString()
        });
    }

    // Send command to specific console
    sendCommand(command, consoleId, options = {}) {
        if (!this.isConnected()) {
            throw new Error('Not connected to WebSocket server');
        }

        this.send({
            type: 'agent:command',
            command: command,
            agentId: consoleId,
            data: {
                ...options,
                source: 'claude-code-remote'
            },
            timestamp: new Date().toISOString()
        });
    }

    // Generic send method
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                ...data,
                clientId: this.clientId,
                timestamp: data.timestamp || new Date().toISOString()
            }));
            return true;
        }
        return false;
    }

    // Send ping to keep connection alive
    sendPing() {
        this.send({ type: 'ping' });
    }

    // Start ping interval
    startPingInterval() {
        this.pingInterval = setInterval(() => {
            this.sendPing();
        }, this.config.pingInterval);
    }

    // Stop ping interval
    stopPingInterval() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    // Disconnect from WebSocket
    disconnect() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        this.stopPingInterval();

        if (this.ws) {
            this.ws.close(1000, 'User disconnect');
            this.ws = null;
        }

        this.connectionStatus = 'disconnected';
        this.clientId = null;
        this.reconnectAttempts = 0;
    }

    // Check if connected
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN && this.connectionStatus === 'connected';
    }

    // Get connection status
    getStatus() {
        return {
            status: this.connectionStatus,
            clientId: this.clientId,
            connected: this.isConnected(),
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Register message handler
    on(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);
    }

    // Unregister message handler
    off(type, handler) {
        if (this.messageHandlers.has(type)) {
            const handlers = this.messageHandlers.get(type);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    // Emit event to handlers
    emit(type, data) {
        if (this.messageHandlers.has(type)) {
            this.messageHandlers.get(type).forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error('❌ Handler error:', error);
                }
            });
        }
    }

    // Resolve connection promise
    resolveConnection(success) {
        const callback = this.connectionCallbacks.get('connect');
        if (callback) {
            if (success) {
                callback.resolve(true);
            } else {
                callback.reject(new Error('Connection failed'));
            }
            this.connectionCallbacks.delete('connect');
        }
    }
}

// Export for use in the main application
window.ClaudeCodeWebSocketManager = ClaudeCodeWebSocketManager;