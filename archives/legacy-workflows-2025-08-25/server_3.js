// Enhanced Tech-Lead Orchestrator - WebSocket Server
import chalk from 'chalk';
import winston from 'winston';
import { WebSocketManager } from './services/websocketManager.js';
import { EnhancedTechLeadOrchestrator } from './index.js';

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

class OrchestratorServer {
  constructor() {
    this.orchestrator = new EnhancedTechLeadOrchestrator();
    this.wsManager = new WebSocketManager();
    this.port = process.env.WS_PORT || 8080;
    this.isRunning = false;
  }

  async start() {
    console.clear();
    console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🤖  Agent Swarm Orchestrator - WebSocket Server          ║
║                                                               ║
║     Version: 2.0.0                                            ║
║     Mode: Pure Agent Coordination                             ║
║     Debug: Enhanced Diagnostic Mode                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `));

    logger.info(chalk.cyan('🚀 Starting Orchestrator Server with Enhanced Diagnostics...'));

    try {
      // Phase 1: Pre-flight checks
      logger.info(chalk.yellow('🔍 Phase 1: Pre-flight system checks...'));
      await this.performPreflightChecks();

      // Phase 2: Initialize orchestrator systems with timeout
      logger.info(chalk.blue('📦 Phase 2: Initializing orchestrator systems...'));
      const initTimeout = 30000; // 30 seconds timeout
      const initSuccess = await this.initializeWithTimeout(
        () => this.orchestrator.initialize(), 
        initTimeout, 
        'Orchestrator system initialization'
      );

      if (!initSuccess) {
        throw new Error('Failed to initialize orchestrator systems within timeout');
      }
      logger.info(chalk.green('✅ Orchestrator systems initialized successfully'));

      // Phase 3: Start WebSocket server with port conflict detection
      logger.info(chalk.blue(`🌐 Phase 3: Starting WebSocket server on port ${this.port}...`));
      await this.startWebSocketWithFallback();

      // Phase 4: Setup event handlers
      logger.info(chalk.blue('📡 Phase 4: Setting up WebSocket event handlers...'));
      this.setupEventHandlers();
      logger.info(chalk.green('✅ Event handlers configured'));

      // Phase 5: Final system validation
      logger.info(chalk.blue('🔬 Phase 5: Final system validation...'));
      await this.validateSystemHealth();

      this.isRunning = true;

      logger.info(chalk.green.bold(`
✅ Agent Swarm Orchestrator Started Successfully!

📡 WebSocket Server: ws://localhost:${this.port}
🌐 Dashboard: Open demo-operations-center-enhanced.html in your browser
📊 Status: All systems operational
🔍 Diagnostics: Enhanced monitoring enabled

Press Ctrl+C to stop the server
      `));

      // Log periodic status updates
      this.startStatusUpdates();

    } catch (error) {
      logger.error(chalk.red('❌ Agent Swarm Orchestrator startup failed:'), error);
      logger.error(chalk.red('💡 Troubleshooting tips:'));
      logger.error(chalk.red('   • Check if port 8080 is already in use'));
      logger.error(chalk.red('   • Verify all dependencies are installed'));
      logger.error(chalk.red('   • Check server.log for detailed error information'));
      process.exit(1);
    }
  }

  async performPreflightChecks() {
    const checks = [
      { name: 'Node.js Version', check: () => this.checkNodeVersion() },
      { name: 'Memory Available', check: () => this.checkMemory() },
      { name: 'Port Availability', check: () => this.checkPortAvailability() },
      { name: 'Dependencies', check: () => this.checkDependencies() }
    ];

    for (const { name, check } of checks) {
      try {
        logger.info(chalk.gray(`  • Checking ${name}...`));
        await check();
        logger.info(chalk.green(`  ✅ ${name}: OK`));
      } catch (error) {
        logger.warn(chalk.yellow(`  ⚠️ ${name}: ${error.message}`));
      }
    }
  }

  async checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js ${version} detected. Requires Node.js 18+`);
    }
    return version;
  }

  async checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMB = Math.round(memUsage.rss / 1024 / 1024);
    if (totalMB > 500) {
      throw new Error(`High memory usage: ${totalMB}MB`);
    }
    return `${totalMB}MB used`;
  }

  async checkPortAvailability() {
    const net = await import('net');
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(this.port, () => {
        server.once('close', () => resolve('Available'));
        server.close();
      });
      server.on('error', (err) => {
        reject(new Error(`Port ${this.port} unavailable: ${err.message}`));
      });
    });
  }

  async checkDependencies() {
    const requiredModules = ['chalk', 'winston', 'ws'];
    for (const module of requiredModules) {
      try {
        await import(module);
      } catch (_error) {
        throw new Error(`Missing module: ${module}`);
      }
    }
    return `${requiredModules.length} modules verified`;
  }

  async initializeWithTimeout(operation, timeoutMs, operationName) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      const executeOperation = async () => {
        try {
          const result = await operation();
          clearTimeout(timeout);
          resolve(result);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      executeOperation();
    });
  }

  async startWebSocketWithFallback() {
    const maxRetries = 5;
    let currentPort = this.port;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(chalk.gray(`  • Attempting to start WebSocket server on port ${currentPort}...`));
        
        // First check if port is available
        await this.checkSpecificPortAvailability(currentPort);
        
        // If check passes, start the server
        await this.wsManager.start(currentPort);
        this.port = currentPort; // Update the port if it changed
        logger.info(chalk.green(`  ✅ WebSocket server started on port ${currentPort}`));
        return;
      } catch (error) {
        logger.warn(chalk.yellow(`  ⚠️ Port ${currentPort} failed: ${error.message}`));
        if (attempt < maxRetries) {
          // Use higher port range to avoid conflicts
          currentPort = 12000 + (attempt * 100); // Try ports 12100, 12200, 12300, 12400
          logger.info(chalk.blue(`  🔄 Trying alternate port ${currentPort}...`));
        } else {
          throw new Error(`Failed to start WebSocket server after ${maxRetries} attempts. Last error: ${error.message}`);
        }
      }
    }
  }

  async checkSpecificPortAvailability(port) {
    const net = await import('net');
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve('Available'));
        server.close();
      });
      server.on('error', (err) => {
        reject(new Error(`Port ${port} unavailable: ${err.message}`));
      });
    });
  }

  async validateSystemHealth() {
    const healthChecks = [
      { name: 'Orchestrator Status', check: () => this.orchestrator.getStatus() },
      { name: 'WebSocket Status', check: () => this.wsManager.getStats() },
      { name: 'Memory Health', check: () => this.checkMemory() }
    ];

    for (const { name, check } of healthChecks) {
      try {
        const result = await check();
        logger.info(chalk.green(`  ✅ ${name}: Healthy`));
        logger.debug(chalk.gray(`    ${JSON.stringify(result)}`));
      } catch (error) {
        logger.error(chalk.red(`  ❌ ${name}: ${error.message}`));
        throw new Error(`Health check failed: ${name}`);
      }
    }
  }

  setupEventHandlers() {
    // Handle client connections
    this.wsManager.on('client:connected', (client) => {
      logger.info(chalk.green(`✅ Client connected: ${client.id} from ${client.ip}`));

      // Send welcome message with system status
      this.wsManager.sendToClient(client.id, {
        type: 'connection:welcome',
        status: this.orchestrator.getStatus(),
        timestamp: new Date().toISOString()
      });
    });

    // Handle client disconnections
    this.wsManager.on('client:disconnected', ({ clientId, code, reason }) => {
      logger.info(chalk.yellow(`📱 Client disconnected: ${clientId} (${code}: ${reason || 'No reason'})`));
    });

    // Handle mission actions
    this.wsManager.on('mission:action', async ({ clientId, action, missionId, data }) => {
      logger.info(chalk.cyan(`🎯 Mission action from ${clientId}: ${action} on ${missionId}`));

      try {
        // Process mission action through orchestrator
        const result = await this.processMissionAction(action, missionId, data);

        // Send response to client
        this.wsManager.sendToClient(clientId, {
          type: 'mission:action:response',
          action,
          missionId,
          result,
          success: true
        });

        // Broadcast update to all subscribed clients
        this.wsManager.broadcast({
          type: 'mission:update',
          missionId,
          action,
          data: result
        }, ['missions']);

      } catch (error) {
        logger.error(chalk.red(`❌ Mission action failed: ${error.message}`));

        this.wsManager.sendToClient(clientId, {
          type: 'mission:action:response',
          action,
          missionId,
          success: false,
          error: error.message
        });
      }
    });

    // Handle agent commands
    this.wsManager.on('agent:command', async ({ clientId, command, agentId, data }) => {
      logger.info(chalk.green(`🤖 Agent command from ${clientId}: ${command} for ${agentId}`));

      try {
        // Process agent command
        const result = await this.processAgentCommand(command, agentId, data);

        // Send response
        this.wsManager.sendToClient(clientId, {
          type: 'agent:command:response',
          command,
          agentId,
          result,
          success: true
        });

        // Broadcast update
        this.wsManager.broadcast({
          type: 'agent:update',
          agentId,
          command,
          data: result
        }, ['agents']);

      } catch (error) {
        logger.error(chalk.red(`❌ Agent command failed: ${error.message}`));

        this.wsManager.sendToClient(clientId, {
          type: 'agent:command:response',
          command,
          agentId,
          success: false,
          error: error.message
        });
      }
    });

    // Handle dashboard interactions
    this.wsManager.on('dashboard:interaction', ({ clientId, interaction, data }) => {
      logger.debug(chalk.gray(`🎛️ Dashboard interaction from ${clientId}: ${interaction}`));

      // Process dashboard interaction
      this.processDashboardInteraction(clientId, interaction, data);
    });
  }

  async processMissionAction(action, missionId, _data) {
    // Simulate mission action processing
    logger.info(chalk.blue(`Processing mission action: ${action} for ${missionId}`));

    switch (action) {
    case 'start':
      return { status: 'started', startTime: new Date().toISOString() };
    case 'pause':
      return { status: 'paused', pauseTime: new Date().toISOString() };
    case 'resume':
      return { status: 'resumed', resumeTime: new Date().toISOString() };
    case 'complete':
      return { status: 'completed', completionTime: new Date().toISOString() };
    case 'cancel':
      return { status: 'cancelled', cancelTime: new Date().toISOString() };
    default:
      throw new Error(`Unknown mission action: ${action}`);
    }
  }

  async processAgentCommand(command, agentId, data) {
    // Simulate agent command processing
    logger.info(chalk.blue(`Processing agent command: ${command} for ${agentId}`));

    switch (command) {
    case 'assign':
      return { status: 'assigned', assignment: data.task };
    case 'release':
      return { status: 'available' };
    case 'upgrade':
      return { status: 'upgraded', newVersion: data.version };
    case 'health-check':
      return { status: 'healthy', performance: Math.floor(Math.random() * 20) + 80 };
    default:
      throw new Error(`Unknown agent command: ${command}`);
    }
  }

  processDashboardInteraction(clientId, interaction, _data) {
    // Log dashboard interactions for analytics
    logger.debug(chalk.gray(`Dashboard interaction: ${interaction} from ${clientId}`));

    // Could be used for tracking user behavior, analytics, etc.
  }

  startStatusUpdates() {
    // Send periodic status updates to all connected clients
    setInterval(() => {
      if (!this.isRunning) return;

      const stats = this.wsManager.getStats();
      const orchestratorStatus = this.orchestrator.getStatus();

      // Broadcast system status
      this.wsManager.broadcast({
        type: 'system:status',
        stats,
        orchestratorStatus,
        timestamp: new Date().toISOString()
      });

      // Log status to console
      logger.debug(chalk.gray(`📊 Connected clients: ${stats.totalClients}, Authenticated: ${stats.authenticatedClients}`));

    }, 30000); // Every 30 seconds
  }

  async stop() {
    logger.info(chalk.yellow('🛑 Stopping server...'));

    this.isRunning = false;

    // Stop WebSocket server
    await this.wsManager.stop();

    logger.info(chalk.red('🛑 Server stopped'));
    process.exit(0);
  }
}

// Create and start server
const server = new OrchestratorServer();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n');
  await server.stop();
});

process.on('SIGTERM', async () => {
  await server.stop();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error(chalk.red('❌ Uncaught exception:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(chalk.red('❌ Unhandled rejection at:'), promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
server.start().catch((error) => {
  logger.error(chalk.red('❌ Failed to start server:'), error);
  process.exit(1);
});

