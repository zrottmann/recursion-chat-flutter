// WebSocket Server for Real-time Agent Communication
// Standalone Node.js server for handling remote Claude Code agents

const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');

class ClaudeCodeWebSocketServer {
  constructor(port = 8081) {
    this.port = port;
    this.agents = new Map();
    this.taskQueue = [];
    this.taskCallbacks = new Map();
    
    this.initializeServer();
    this.startHeartbeat();
  }

  initializeServer() {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      perMessageDeflate: false,
      clientTracking: true
    });

    this.wss.on('connection', (ws, request) => {
      const clientIp = request.socket.remoteAddress;
      const agentId = uuidv4();
      
      console.log(`[${new Date().toISOString()}] New connection from ${clientIp} (${agentId})`);

      // Initialize agent
      const agent = {
        id: agentId,
        websocket: ws,
        status: 'connected',
        capabilities: [],
        currentTask: null,
        lastHeartbeat: new Date(),
        metadata: {
          ip: clientIp,
          connectedAt: new Date()
        }
      };

      // Store agent
      this.agents.set(agentId, agent);

      // Set up message handlers
      ws.on('message', (data) => {
        this.handleMessage(agentId, data);
      });

      ws.on('close', (code, reason) => {
        console.log(`[${new Date().toISOString()}] Agent ${agentId} disconnected (${code}: ${reason})`);
        this.handleDisconnection(agentId);
      });

      ws.on('error', (error) => {
        console.error(`[${new Date().toISOString()}] WebSocket error for agent ${agentId}:`, error);
        this.handleAgentError(agentId, error.message);
      });

      ws.on('pong', () => {
        // Update heartbeat on pong response
        this.updateHeartbeat(agentId);
      });

      // Request agent identification
      this.sendToAgent(agentId, {
        type: 'identify',
        message: 'Please identify your capabilities'
      });
    });

    // Start HTTP server
    this.server.listen(this.port, () => {
      console.log(`[${new Date().toISOString()}] Claude Code WebSocket server listening on port ${this.port}`);
    });

    // Handle server errors
    this.server.on('error', (error) => {
      console.error(`[${new Date().toISOString()}] Server error:`, error);
    });
  }

  handleMessage(agentId, data) {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[${new Date().toISOString()}] Message from ${agentId}:`, message.type);

      switch (message.type) {
        case 'register':
          this.handleAgentRegistration(agentId, message);
          break;

        case 'taskComplete':
          this.handleTaskCompletion(agentId, message);
          break;

        case 'taskProgress':
          this.handleTaskProgress(agentId, message);
          break;

        case 'heartbeat':
          this.updateHeartbeat(agentId);
          break;

        case 'error':
          this.handleAgentError(agentId, message.error);
          break;

        case 'capabilities':
          this.updateAgentCapabilities(agentId, message.capabilities);
          break;

        default:
          console.warn(`[${new Date().toISOString()}] Unknown message type from ${agentId}:`, message.type);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error parsing message from ${agentId}:`, error);
    }
  }

  handleAgentRegistration(agentId, message) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Update agent with registration info
    agent.capabilities = message.capabilities || ['general'];
    agent.metadata = {
      ...agent.metadata,
      name: message.name || `Agent-${agentId.slice(0, 8)}`,
      version: message.version || 'unknown',
      platform: message.platform || 'unknown'
    };

    this.agents.set(agentId, agent);

    console.log(`[${new Date().toISOString()}] Agent ${agentId} registered with capabilities: ${agent.capabilities.join(', ')}`);

    // Send confirmation
    this.sendToAgent(agentId, {
      type: 'registered',
      agentId: agentId,
      message: 'Successfully registered with orchestrator',
      serverTime: new Date().toISOString()
    });

    // Try to assign queued tasks
    this.processTaskQueue();
  }

  handleTaskCompletion(agentId, message) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Mark agent as available
    agent.status = 'connected';
    agent.currentTask = null;
    this.agents.set(agentId, agent);

    // Resolve task callback if exists
    const callback = this.taskCallbacks.get(message.taskId);
    if (callback) {
      callback.resolve(message.response);
      this.taskCallbacks.delete(message.taskId);
    }

    console.log(`[${new Date().toISOString()}] Task ${message.taskId} completed by agent ${agentId}`);

    // Process next task in queue
    this.processTaskQueue();
  }

  handleTaskProgress(agentId, message) {
    console.log(`[${new Date().toISOString()}] Task progress from ${agentId}: ${message.progress}%`);
    
    // Broadcast progress to connected clients if needed
    this.broadcastTaskProgress(message.taskId, message.progress, agentId);
  }

  handleAgentError(agentId, error) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.status = 'error';
    this.agents.set(agentId, agent);

    // Reject task callback if exists
    if (agent.currentTask) {
      const callback = this.taskCallbacks.get(agent.currentTask);
      if (callback) {
        callback.reject(new Error(error));
        this.taskCallbacks.delete(agent.currentTask);
      }
      agent.currentTask = null;
    }

    console.error(`[${new Date().toISOString()}] Agent ${agentId} error: ${error}`);
  }

  handleDisconnection(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    // Handle any active task
    if (agent.currentTask) {
      const callback = this.taskCallbacks.get(agent.currentTask);
      if (callback) {
        callback.reject(new Error('Agent disconnected during task execution'));
        this.taskCallbacks.delete(agent.currentTask);
      }
    }

    // Remove agent
    this.agents.delete(agentId);
  }

  updateHeartbeat(agentId) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastHeartbeat = new Date();
      this.agents.set(agentId, agent);
    }
  }

  updateAgentCapabilities(agentId, capabilities) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.capabilities = capabilities;
      this.agents.set(agentId, agent);
      console.log(`[${new Date().toISOString()}] Updated capabilities for ${agentId}: ${capabilities.join(', ')}`);
    }
  }

  sendToAgent(agentId, message) {
    const agent = this.agents.get(agentId);
    if (agent && agent.websocket.readyState === WebSocket.OPEN) {
      agent.websocket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcastToAgents(message) {
    let sentCount = 0;
    for (const [agentId, agent] of this.agents) {
      if (this.sendToAgent(agentId, message)) {
        sentCount++;
      }
    }
    return sentCount;
  }

  broadcastTaskProgress(taskId, progress, agentId) {
    // This could be extended to send progress to a web dashboard
    const progressMessage = {
      type: 'taskProgress',
      taskId,
      progress,
      agentId,
      timestamp: new Date().toISOString()
    };

    // For now, just log it - could be extended to send to monitoring dashboard
    console.log(`[${new Date().toISOString()}] Task ${taskId} progress: ${progress}% (Agent: ${agentId})`);
  }

  // Queue and execute tasks
  async executeTask(task) {
    return new Promise((resolve, reject) => {
      // Find available agent
      const agent = this.findAvailableAgent(task.capabilities);
      
      if (!agent) {
        // Queue the task
        this.taskQueue.push({ task, resolve, reject });
        console.log(`[${new Date().toISOString()}] Task ${task.id} queued (no available agents)`);
        return;
      }

      this.assignTaskToAgent(agent.id, task, resolve, reject);
    });
  }

  assignTaskToAgent(agentId, task, resolve, reject) {
    const agent = this.agents.get(agentId);
    if (!agent || agent.status !== 'connected') {
      reject(new Error('Agent not available'));
      return;
    }

    // Mark agent as busy
    agent.status = 'busy';
    agent.currentTask = task.id;
    this.agents.set(agentId, agent);

    // Store callback
    this.taskCallbacks.set(task.id, { resolve, reject });

    // Send task to agent
    const success = this.sendToAgent(agentId, {
      type: 'executeTask',
      task: task,
      timestamp: new Date().toISOString()
    });

    if (!success) {
      // Failed to send, mark agent as error and reject
      agent.status = 'error';
      agent.currentTask = null;
      this.agents.set(agentId, agent);
      this.taskCallbacks.delete(task.id);
      reject(new Error('Failed to send task to agent'));
    } else {
      console.log(`[${new Date().toISOString()}] Task ${task.id} assigned to agent ${agentId}`);
    }
  }

  findAvailableAgent(requiredCapabilities = []) {
    for (const [agentId, agent] of this.agents) {
      if (agent.status === 'connected') {
        // Check if agent has required capabilities
        if (requiredCapabilities.length === 0) {
          return agent; // Any agent is fine
        }
        
        const hasCapabilities = requiredCapabilities.every(cap => 
          agent.capabilities.includes(cap)
        );
        
        if (hasCapabilities) {
          return agent;
        }
      }
    }
    return null;
  }

  processTaskQueue() {
    if (this.taskQueue.length === 0) return;

    console.log(`[${new Date().toISOString()}] Processing task queue (${this.taskQueue.length} tasks)`);

    // Process tasks that can be assigned
    const tasksToProcess = [];
    for (let i = this.taskQueue.length - 1; i >= 0; i--) {
      const queueItem = this.taskQueue[i];
      const agent = this.findAvailableAgent(queueItem.task.capabilities);
      
      if (agent) {
        tasksToProcess.push({ queueItem, agent, index: i });
      }
    }

    // Assign tasks and remove from queue
    for (const { queueItem, agent, index } of tasksToProcess) {
      this.assignTaskToAgent(agent.id, queueItem.task, queueItem.resolve, queueItem.reject);
      this.taskQueue.splice(index, 1);
    }
  }

  // Start heartbeat monitoring
  startHeartbeat() {
    setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 1 minute timeout

      // Check for stale agents
      for (const [agentId, agent] of this.agents) {
        if (now.getTime() - agent.lastHeartbeat.getTime() > timeout) {
          console.log(`[${new Date().toISOString()}] Agent ${agentId} heartbeat timeout`);
          this.handleDisconnection(agentId);
        } else if (agent.websocket.readyState === WebSocket.OPEN) {
          // Send ping
          agent.websocket.ping();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Get server statistics
  getStats() {
    const agents = Array.from(this.agents.values());
    return {
      totalAgents: agents.length,
      connectedAgents: agents.filter(a => a.status === 'connected').length,
      busyAgents: agents.filter(a => a.status === 'busy').length,
      errorAgents: agents.filter(a => a.status === 'error').length,
      queuedTasks: this.taskQueue.length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log(`[${new Date().toISOString()}] Shutting down WebSocket server...`);
    
    // Notify all agents
    this.broadcastToAgents({
      type: 'shutdown',
      message: 'Server is shutting down'
    });

    // Close all connections
    this.wss.clients.forEach(ws => {
      ws.close(1000, 'Server shutdown');
    });

    // Close server
    await new Promise(resolve => {
      this.server.close(resolve);
    });

    console.log(`[${new Date().toISOString()}] WebSocket server shut down successfully`);
  }
}

// Create and start server
const server = new ClaudeCodeWebSocketServer(process.env.WS_PORT || 8081);

// Handle process termination
process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

// Export for use as module
module.exports = ClaudeCodeWebSocketServer;