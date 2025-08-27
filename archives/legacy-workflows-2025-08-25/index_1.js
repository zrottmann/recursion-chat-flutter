// Slumlord Game Server Entry Point
import { ShardManager } from './sharding/ShardManager.js';
import { GameStateSynchronizer } from './networking/GameStateSynchronizer.js';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pino from 'pino';

const logger = pino({ level: 'info' });
const port = process.env.PORT || 3000;

class SlumlordServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        this.shardManager = null;
        this.gameSync = null;
    }

    async initialize() {
        logger.info('🎮 Starting Slumlord Game Server...');
        
        // Setup Express middleware
        this.app.use(express.json());
        this.app.use(express.static('web/dist')); // Serve web client
        
        // Initialize shard manager
        this.shardManager = new ShardManager({
            maxPlayersPerShard: process.env.MAX_PLAYERS_PER_SHARD || 100,
            maxShards: process.env.MAX_SHARDS || 10,
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
        });
        
        await this.shardManager.initialize();
        
        // Initialize game state synchronizer
        this.gameSync = new GameStateSynchronizer({
            tickRate: 60,
            sendRate: 20
        });
        
        this.gameSync.initialize();
        
        // Setup WebSocket connections
        this.setupWebSocket();
        
        // Setup HTTP routes
        this.setupRoutes();
        
        // Start server
        this.server.listen(port, () => {
            logger.info(`🚀 Slumlord server running on port ${port}`);
            logger.info(`📊 Shard Manager: ${this.shardManager.shards.size} active shards`);
            logger.info(`🌐 WebSocket ready for connections`);
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            logger.info('New WebSocket connection');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    logger.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid message format' }));
                }
            });
            
            ws.on('close', () => {
                logger.info('WebSocket connection closed');
                // Handle player disconnect
            });
            
            ws.on('error', (error) => {
                logger.error('WebSocket error:', error);
            });
        });
    }

    async handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'AUTH':
                // Handle authentication
                const authResult = await this.authenticatePlayer(message.username, message.password);
                ws.send(JSON.stringify({
                    type: 'AUTH',
                    success: authResult.success,
                    player: authResult.player
                }));
                break;
                
            case 'PLAYER_MOVE':
                // Handle player movement
                this.gameSync.updateQueue.push({
                    type: 'PLAYER_MOVE',
                    playerId: ws.playerId,
                    data: message.data
                });
                break;
                
            case 'PLAYER_ATTACK':
                // Handle player attack
                this.gameSync.updateQueue.push({
                    type: 'PLAYER_ATTACK',
                    playerId: ws.playerId,
                    data: message.data
                });
                break;
                
            case 'CHAT':
                // Handle chat message
                this.broadcastChat(ws.playerId, message.message);
                break;
                
            default:
                logger.warn('Unknown message type:', message.type);
        }
    }

    async authenticatePlayer(username, password) {
        // Demo authentication - in production, use proper auth
        return {
            success: true,
            player: {
                id: `player_${Date.now()}`,
                username,
                position: { x: 400, y: 300 },
                health: 100,
                maxHealth: 100,
                mana: 50,
                maxMana: 50,
                level: 1,
                experience: 0
            }
        };
    }

    broadcastChat(playerId, message) {
        const chatData = {
            type: 'CHAT',
            player: playerId,
            text: message,
            timestamp: Date.now()
        };
        
        this.wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(chatData));
            }
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                shards: this.shardManager.shards.size,
                uptime: process.uptime(),
                version: '2.0.0'
            });
        });
        
        // Game stats endpoint
        this.app.get('/stats', (req, res) => {
            const stats = {
                totalPlayers: 0,
                totalShards: this.shardManager.shards.size,
                gameState: this.gameSync.gameState.tick
            };
            
            // Count total players across shards
            this.shardManager.shards.forEach(shard => {
                stats.totalPlayers += shard.currentLoad;
            });
            
            res.json(stats);
        });
        
        // Serve game client
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../web/dist/index.html'));
        });
    }

    async shutdown() {
        logger.info('Shutting down Slumlord server...');
        
        if (this.gameSync) {
            await this.gameSync.shutdown();
        }
        
        if (this.shardManager) {
            await this.shardManager.shutdown();
        }
        
        this.server.close();
        logger.info('Server shutdown complete');
    }
}

// Start server
const server = new SlumlordServer();
server.initialize().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());