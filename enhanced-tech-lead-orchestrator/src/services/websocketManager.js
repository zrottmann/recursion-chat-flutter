// WebSocket Manager for Real-Time Communication
import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import winston from 'winston';

/**
 * 🌐 WebSocket Manager
 *
 * Handles real-time communication between the Operations Center
 * and connected clients (dashboards, agents, external systems)
 */
class WebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map();
    this.rooms = new Map(); // For organizing clients into groups
    this.heartbeatInterval = null;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
      ),
      transports: [
        new winston.transports.Console()
      ]
    });
  }

  async start(port = 8080) {
    try {
      this.wss = new WebSocketServer({
        port,
        perMessageDeflate: {
          zlibDeflateOptions: {
            threshold: 1024,
            concurrencyLimit: 10
          },
          zlibInflateOptions: {
            chunkSize: 1024
          },
          threshold: 1024,
          concurrencyLimit: 10,
          clientMaxWindow: 15,
          serverMaxWindow: 15,
          serverMaxNoContextTakeover: false,
          clientMaxNoContextTakeover: false
        }
      });

      this.wss.on('connection', (ws, request) => {
        this.handleConnection(ws, request);
      });

      this.startHeartbeat();

      this.logger.info(chalk.green(`🌐 WebSocket server started on port ${port}`));
      return true;
    } catch (error) {
      this.logger.error(chalk.red('❌ Failed to start WebSocket server:'), error);
      throw error;
    }
  }

  handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const clientInfo = {
      id: clientId,
      ws,
      ip: request.socket.remoteAddress,
      userAgent: request.headers['user-agent'],
      connectedAt: new Date(),
      lastPing: new Date(),
      subscriptions: new Set(),
      type: 'dashboard', // dashboard, agent, external
      authenticated: false
    };

    this.clients.set(clientId, clientInfo);

    this.logger.info(chalk.blue(`📱 New client connected: ${clientId}`));

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connection:welcome',
      clientId,
      serverTime: new Date().toISOString(),
      features: ['real-time-updates', 'subscriptions', 'rooms', 'heartbeat']
    });

    // Set up event handlers
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    ws.on('close', (code, reason) => {
      this.handleDisconnection(clientId, code, reason);
    });

    ws.on('error', (error) => {
      this.logger.error(chalk.red(`❌ WebSocket error for client ${clientId}:`), error);
    });

    ws.on('pong', () => {
      if (this.clients.has(clientId)) {
        this.clients.get(clientId).lastPing = new Date();
      }
    });

    this.emit('client:connected', clientInfo);
  }

  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      this.logger.debug(chalk.gray(`📥 Message from ${clientId}: ${message.type}`));

      switch (message.type) {
      case 'auth:login':
        this.handleAuthentication(clientId, message.payload);
        break;

      case 'subscribe':
        this.handleSubscription(clientId, message.payload);
        break;

      case 'unsubscribe':
        this.handleUnsubscription(clientId, message.payload);
        break;

      case 'join:room':
        this.handleJoinRoom(clientId, message.payload.room);
        break;

      case 'leave:room':
        this.handleLeaveRoom(clientId, message.payload.room);
        break;

      case 'mission:action':
        this.handleMissionAction(clientId, message.payload);
        break;

      case 'agent:command':
        this.handleAgentCommand(clientId, message.payload);
        break;

      case 'dashboard:interaction':
        this.handleDashboardInteraction(clientId, message.payload);
        break;

      case 'player_join':
        this.handlePlayerJoin(clientId, message);
        break;

      case 'player_leave':
        this.handlePlayerLeave(clientId, message);
        break;

      case 'shard_join':
        this.handleShardJoin(clientId, message);
        break;

      case 'shard_leave':
        this.handleShardLeave(clientId, message);
        break;

      case 'shard_message':
        this.handleShardMessage(clientId, message);
        break;

      case 'handshake':
        this.handleHandshake(clientId, message);
        break;

      case 'request:initial-data':
        this.handleInitialDataRequest(clientId, message);
        break;

      case 'ai:request':
        this.handleAIRequest(clientId, message);
        break;

      case 'build:website':
        this.handleWebsiteBuild(clientId, message);
        break;

      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      default:
        this.logger.warn(chalk.yellow(`⚠️ Unknown message type: ${message.type}`));
      }
    } catch (error) {
      this.logger.error(chalk.red(`❌ Error handling message from ${clientId}:`), error);
    }
  }

  handleDisconnection(clientId, code, reason) {
    const client = this.clients.get(clientId);
    if (client) {
      // Clean up subscriptions
      client.subscriptions.clear();

      // Remove from rooms
      this.rooms.forEach((room, roomName) => {
        room.delete(clientId);
        if (room.size === 0) {
          this.rooms.delete(roomName);
        }
      });

      this.clients.delete(clientId);

      this.logger.info(chalk.blue(`📱 Client disconnected: ${clientId} (code: ${code})`));
      this.emit('client:disconnected', { clientId, code, reason });
    }
  }

  // 🔐 Authentication
  handleAuthentication(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Validate authentication (implement your auth logic here)
    const isValid = this.validateAuthToken(payload.token);

    if (isValid) {
      client.authenticated = true;
      client.userId = payload.userId;
      client.role = payload.role;

      this.sendToClient(clientId, {
        type: 'auth:success',
        user: {
          id: payload.userId,
          role: payload.role
        }
      });

      this.logger.info(chalk.green(`✅ Client authenticated: ${clientId} (${payload.userId})`));
    } else {
      this.sendToClient(clientId, {
        type: 'auth:failed',
        error: 'Invalid credentials'
      });

      this.logger.warn(chalk.yellow(`⚠️ Authentication failed for client: ${clientId}`));
    }
  }

  validateAuthToken(token) {
    // Implement your token validation logic here
    // For demo purposes, accept any non-empty token
    return token && token.length > 0;
  }

  // 🤝 Handshake Management
  handleHandshake(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.logger.info(chalk.green(`🤝 Handshake from ${clientId}: ${message.clientType || 'unknown'} v${message.version || 'unknown'}`));

    // Store client information
    client.clientType = message.clientType || 'unknown';
    client.version = message.version || 'unknown';
    client.authenticated = true; // Auto-authenticate for handshake

    // Send handshake response
    this.sendToClient(clientId, {
      type: 'handshake:response',
      status: 'success',
      serverVersion: '2.0.0',
      clientId,
      features: ['real-time-updates', 'subscriptions', 'rooms', 'heartbeat']
    });
  }

  // 📊 Initial Data Request
  handleInitialDataRequest(clientId, _message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.logger.info(chalk.blue(`📊 Initial data request from ${clientId}`));

    // Prepare initial dashboard data
    const initialData = {
      type: 'initial-data:response',
      data: {
        systemStatus: {
          version: '2.0.0',
          uptime: process.uptime(),
          connections: this.clients.size,
          timestamp: new Date().toISOString()
        },
        missions: {
          active: 0,
          completed: 0,
          total: 0
        },
        agents: {
          total: 5,
          available: 5,
          busy: 0
        },
        performance: {
          cpu: Math.floor(Math.random() * 30) + 10,
          memory: Math.floor(Math.random() * 40) + 30,
          network: Math.floor(Math.random() * 20) + 80
        }
      },
      timestamp: new Date().toISOString()
    };

    this.sendToClient(clientId, initialData);
  }

  // 🤖 AI Request Handler
  handleAIRequest(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { prompt, type: requestType } = message;
    this.logger.info(chalk.cyan(`🤖 AI request from ${clientId}: "${prompt}"`));

    // Simulate AI processing with instant response
    const response = this.generateAIResponse(prompt, requestType);
    
    this.sendToClient(clientId, {
      type: 'ai:response',
      requestId: message.requestId,
      prompt,
      response,
      timestamp: new Date().toISOString()
    });
  }

  // 🌐 Website Build Handler  
  handleWebsiteBuild(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { description, requirements } = message;
    this.logger.info(chalk.green(`🌐 Website build request from ${clientId}: "${description}"`));

    // Generate website build plan
    const buildPlan = this.generateWebsiteBuildPlan(description, requirements);
    
    this.sendToClient(clientId, {
      type: 'build:response',
      requestId: message.requestId,
      description,
      buildPlan,
      timestamp: new Date().toISOString()
    });

    // Simulate build progress
    this.simulateBuildProgress(clientId, message.requestId, buildPlan);
  }

  // 🧠 AI Response Generator
  generateAIResponse(prompt, _requestType = 'general') {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('cat') && lowerPrompt.includes('website')) {
      return {
        success: true,
        explanation: `I'll help you create a beautiful cat website! Here's my plan:

🐱 **Cat Paradise Website**
- Modern responsive design with cat-themed colors
- Interactive cat gallery with adoption profiles
- Contact form for potential adopters  
- Mobile-friendly layout with smooth animations
- Cat care tips and information pages

I'll coordinate our agent swarm to build this:
- **Frontend Agent**: React components and styling
- **Design Agent**: Cat-themed UI/UX design
- **Content Agent**: Cat photos and descriptions
- **DevOps Agent**: Deployment and hosting`,
        
        commands: [
          { type: 'agent:assign', agent: 'frontend', task: 'Create React cat website structure' },
          { type: 'agent:assign', agent: 'design', task: 'Design cat-themed UI components' },
          { type: 'agent:assign', agent: 'content', task: 'Gather cat photos and content' },
          { type: 'agent:assign', agent: 'devops', task: 'Setup deployment pipeline' }
        ],
        
        estimatedTime: '2-3 hours',
        agents: 4
      };
    }
    
    if (lowerPrompt.includes('website') || lowerPrompt.includes('build') || lowerPrompt.includes('create')) {
      return {
        success: true,
        explanation: `I'll orchestrate our agent swarm to build your "${prompt}" project!

🚀 **Project Plan**
- Analyzing requirements and breaking down into tasks
- Assigning specialized agents to different components
- Coordinating development workflow
- Setting up quality gates and testing

Our agent swarm will handle:
- Architecture planning and design
- Code generation and implementation  
- Testing and quality assurance
- Deployment and monitoring`,
        
        commands: [
          { type: 'agent:assign', agent: 'architect', task: 'Plan project structure' },
          { type: 'agent:assign', agent: 'frontend', task: 'Build user interface' },
          { type: 'agent:assign', agent: 'backend', task: 'Implement server logic' },
          { type: 'quality:gate', check: 'All tests passing' }
        ],
        
        estimatedTime: '1-4 hours',
        agents: 3
      };
    }
    
    return {
      success: true,
      explanation: `I understand you want help with: "${prompt}"

As an agent swarm orchestrator, I can coordinate multiple AI agents to:
- Build web applications and websites
- Create development workflows
- Manage project architecture  
- Handle testing and deployment
- Provide real-time progress tracking

What specific project would you like our agent swarm to work on?`,
      
      commands: [],
      suggestions: [
        'Build a portfolio website',
        'Create a cat adoption site', 
        'Develop a React dashboard',
        'Setup a blog platform'
      ]
    };
  }

  // 🏗️ Website Build Plan Generator
  generateWebsiteBuildPlan(description, requirements = {}) {
    const isCatWebsite = description.toLowerCase().includes('cat');
    
    return {
      projectName: isCatWebsite ? 'cat-paradise-website' : 'custom-website',
      description,
      requirements,
      
      phases: [
        {
          name: 'Planning & Architecture',
          duration: '30 minutes',
          tasks: [
            'Analyze requirements',
            'Design system architecture',
            'Create wireframes',
            'Setup project structure'
          ],
          agents: ['architect', 'designer']
        },
        {
          name: 'Development',
          duration: '2 hours',
          tasks: [
            'Build frontend components',
            'Implement backend API',
            'Create responsive design',
            'Add interactive features'
          ],
          agents: ['frontend', 'backend', 'designer']
        },
        {
          name: 'Testing & Quality',
          duration: '45 minutes', 
          tasks: [
            'Unit testing',
            'Integration testing',
            'Performance optimization',
            'Accessibility review'
          ],
          agents: ['qa', 'performance']
        },
        {
          name: 'Deployment',
          duration: '30 minutes',
          tasks: [
            'Setup hosting',
            'Configure domain',
            'Deploy application',
            'Monitor performance'
          ],
          agents: ['devops']
        }
      ],
      
      technologies: isCatWebsite ? 
        ['React', 'Tailwind CSS', 'Node.js', 'MongoDB', 'Appwrite'] :
        ['React', 'CSS3', 'Node.js', 'Database', 'Cloud Hosting'],
        
      estimatedCompletion: '3-4 hours',
      totalAgents: 6
    };
  }

  // 📊 Build Progress Simulator
  simulateBuildProgress(clientId, requestId, buildPlan) {
    let currentPhase = 0;
    let currentTask = 0;
    
    const progressInterval = setInterval(() => {
      const phase = buildPlan.phases[currentPhase];
      if (!phase) {
        // Build complete
        clearInterval(progressInterval);
        this.sendToClient(clientId, {
          type: 'build:complete',
          requestId,
          status: 'success',
          deploymentUrl: `https://${buildPlan.projectName}-${Date.now().toString(36)}.appwrite.network`,
          completionTime: new Date().toISOString()
        });
        return;
      }
      
      const task = phase.tasks[currentTask];
      if (task) {
        this.sendToClient(clientId, {
          type: 'build:progress',
          requestId,
          currentPhase: currentPhase + 1,
          totalPhases: buildPlan.phases.length,
          phaseName: phase.name,
          currentTask: currentTask + 1,
          totalTasks: phase.tasks.length,
          taskName: task,
          progress: Math.round(((currentPhase * 4 + currentTask) / (buildPlan.phases.length * 4)) * 100)
        });
        
        currentTask++;
        if (currentTask >= phase.tasks.length) {
          currentTask = 0;
          currentPhase++;
        }
      }
    }, 2000); // Progress every 2 seconds
  }

  // 📡 Subscription Management
  handleSubscription(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) {
      this.sendToClient(clientId, {
        type: 'subscription:error',
        error: 'Authentication required'
      });
      return;
    }

    const { topics } = payload;
    topics.forEach(topic => {
      client.subscriptions.add(topic);
    });

    this.sendToClient(clientId, {
      type: 'subscription:success',
      topics,
      totalSubscriptions: client.subscriptions.size
    });

    this.logger.info(chalk.green(`📡 Client ${clientId} subscribed to: ${topics.join(', ')}`));
  }

  handleUnsubscription(clientId, payload) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { topics } = payload;
    topics.forEach(topic => {
      client.subscriptions.delete(topic);
    });

    this.sendToClient(clientId, {
      type: 'unsubscription:success',
      topics,
      totalSubscriptions: client.subscriptions.size
    });
  }

  // 🏠 Room Management
  handleJoinRoom(clientId, roomName) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }

    this.rooms.get(roomName).add(clientId);

    this.sendToClient(clientId, {
      type: 'room:joined',
      room: roomName,
      members: this.rooms.get(roomName).size
    });

    // Notify other room members
    this.broadcastToRoom(roomName, {
      type: 'room:member-joined',
      clientId,
      members: this.rooms.get(roomName).size
    }, [clientId]);

    this.logger.info(chalk.blue(`🏠 Client ${clientId} joined room: ${roomName}`));
  }

  handleLeaveRoom(clientId, roomName) {
    if (this.rooms.has(roomName)) {
      this.rooms.get(roomName).delete(clientId);

      if (this.rooms.get(roomName).size === 0) {
        this.rooms.delete(roomName);
      } else {
        // Notify remaining members
        this.broadcastToRoom(roomName, {
          type: 'room:member-left',
          clientId,
          members: this.rooms.get(roomName).size
        });
      }
    }

    this.sendToClient(clientId, {
      type: 'room:left',
      room: roomName
    });
  }

  // 🎯 Mission Actions
  handleMissionAction(clientId, payload) {
    const { action, missionId, data } = payload;

    this.logger.info(chalk.cyan(`🎯 Mission action: ${action} for mission ${missionId}`));

    // Emit to operations center
    this.emit('mission:action', { clientId, action, missionId, data });

    // Broadcast to subscribed clients
    this.broadcast({
      type: 'mission:action-broadcast',
      action,
      missionId,
      data,
      timestamp: new Date().toISOString()
    }, ['missions', `mission:${missionId}`]);
  }

  // 🤖 Agent Commands
  handleAgentCommand(clientId, payload) {
    const { command, agentId, data } = payload;

    this.logger.info(chalk.green(`🤖 Agent command: ${command} for agent ${agentId}`));

    // Emit to operations center
    this.emit('agent:command', { clientId, command, agentId, data });

    // Broadcast to subscribed clients
    this.broadcast({
      type: 'agent:command-broadcast',
      command,
      agentId,
      data,
      timestamp: new Date().toISOString()
    }, ['agents', `agent:${agentId}`]);
  }

  // 🎛️ Dashboard Interactions
  handleDashboardInteraction(clientId, payload) {
    const { interaction, data } = payload;

    this.emit('dashboard:interaction', { clientId, interaction, data });
  }

  // 🎮 Player Management
  handlePlayerJoin(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { playerId, name, region } = message;

    // Update client info with player data
    client.type = 'player';
    client.playerId = playerId || `player_${clientId}`;
    client.playerName = name || `Player_${clientId.substring(0, 8)}`;
    client.region = region || 'default';

    // Send confirmation
    this.sendToClient(clientId, {
      type: 'player_join_response',
      success: true,
      playerId: client.playerId,
      playerName: client.playerName,
      region: client.region,
      timestamp: new Date().toISOString()
    });

    // Broadcast to other players
    this.broadcast({
      type: 'player_joined',
      playerId: client.playerId,
      playerName: client.playerName,
      region: client.region
    }, ['players']);

    this.logger.info(chalk.green(`🎮 Player joined: ${client.playerName} (${client.playerId}) from ${client.region}`));
  }

  handlePlayerLeave(clientId, _message) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'player') return;

    // Broadcast departure
    this.broadcast({
      type: 'player_left',
      playerId: client.playerId,
      playerName: client.playerName,
      region: client.region
    }, ['players']);

    // Clean up player data
    client.type = 'dashboard';
    delete client.playerId;
    delete client.playerName;
    delete client.region;

    this.sendToClient(clientId, {
      type: 'player_leave_response',
      success: true
    });

    this.logger.info(chalk.yellow(`🎮 Player left: ${client.playerName} (${client.playerId})`));
  }

  // 🌐 Shard Management
  handleShardJoin(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.type !== 'player') {
      this.sendToClient(clientId, {
        type: 'shard_join_response',
        success: false,
        error: 'Must be a player to join shards'
      });
      return;
    }

    const { shardId, region } = message;
    const targetShard = shardId || `${region || client.region || 'default'}_shard_1`;

    // Create or join shard room
    if (!this.rooms.has(targetShard)) {
      this.rooms.set(targetShard, new Set());
    }

    const shard = this.rooms.get(targetShard);
    shard.add(clientId);

    // Update client shard info
    client.currentShard = targetShard;

    this.sendToClient(clientId, {
      type: 'shard_join_response',
      success: true,
      shardId: targetShard,
      playerCount: shard.size,
      players: Array.from(shard).map(id => {
        const p = this.clients.get(id);
        return { id: p.playerId, name: p.playerName };
      })
    });

    // Notify other shard members
    this.broadcastToRoom(targetShard, {
      type: 'shard_player_joined',
      playerId: client.playerId,
      playerName: client.playerName,
      playerCount: shard.size
    }, [clientId]);

    this.logger.info(chalk.blue(`🌐 Player ${client.playerName} joined shard: ${targetShard} (${shard.size} players)`));
  }

  handleShardLeave(clientId, _message) {
    const client = this.clients.get(clientId);
    if (!client || !client.currentShard) return;

    const shardId = client.currentShard;
    const shard = this.rooms.get(shardId);

    if (shard) {
      shard.delete(clientId);

      // Notify remaining members
      if (shard.size > 0) {
        this.broadcastToRoom(shardId, {
          type: 'shard_player_left',
          playerId: client.playerId,
          playerName: client.playerName,
          playerCount: shard.size
        });
      } else {
        // Remove empty shard
        this.rooms.delete(shardId);
      }
    }

    delete client.currentShard;

    this.sendToClient(clientId, {
      type: 'shard_leave_response',
      success: true,
      shardId
    });

    this.logger.info(chalk.yellow(`🌐 Player ${client.playerName} left shard: ${shardId}`));
  }

  handleShardMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.currentShard) {
      this.sendToClient(clientId, {
        type: 'shard_message_error',
        error: 'Not in a shard'
      });
      return;
    }

    const { content, messageType } = message;
    const shardMessage = {
      type: 'shard_message_received',
      senderId: client.playerId,
      senderName: client.playerName,
      content: content || message.message,
      messageType: messageType || 'chat',
      shardId: client.currentShard,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all shard members
    this.broadcastToRoom(client.currentShard, shardMessage);

    this.logger.debug(chalk.gray(`💬 Shard message from ${client.playerName} in ${client.currentShard}`));
  }

  // 📤 Broadcasting Methods
  broadcast(message, topics = null) {
    const messageStr = JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });

    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        // If topics specified, only send to subscribed clients
        if (topics) {
          const hasSubscription = topics.some(topic => client.subscriptions.has(topic));
          if (!hasSubscription) return;
        }

        try {
          client.ws.send(messageStr);
          sentCount++;
        } catch (error) {
          this.logger.error(chalk.red(`❌ Error broadcasting to ${clientId}:`), error);
        }
      }
    });

    this.logger.debug(chalk.gray(`📡 Broadcast sent to ${sentCount} clients`));
  }

  broadcastToRoom(roomName, message, excludeClients = []) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    const messageStr = JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;

    room.forEach(clientId => {
      if (excludeClients.includes(clientId)) return;

      const client = this.clients.get(clientId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
          sentCount++;
        } catch (error) {
          this.logger.error(chalk.red(`❌ Error sending to room member ${clientId}:`), error);
        }
      }
    });

    this.logger.debug(chalk.gray(`🏠 Room broadcast sent to ${sentCount} members in ${roomName}`));
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      this.logger.error(chalk.red(`❌ Error sending to client ${clientId}:`), error);
      return false;
    }
  }

  // 💓 Heartbeat System
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleClients = [];

      this.clients.forEach((client, clientId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Check if client is stale (no pong in 60 seconds)
          if (now - client.lastPing > 60000) {
            staleClients.push(clientId);
          } else {
            // Send ping
            try {
              client.ws.ping();
            } catch (_error) {
              staleClients.push(clientId);
            }
          }
        } else {
          staleClients.push(clientId);
        }
      });

      // Clean up stale clients
      staleClients.forEach(clientId => {
        this.logger.info(chalk.yellow(`⚠️ Cleaning up stale client: ${clientId}`));
        this.handleDisconnection(clientId, 1001, 'Heartbeat timeout');
      });

    }, 30000); // Every 30 seconds
  }

  // 🛠️ Utility Methods
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients() {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      type: client.type,
      authenticated: client.authenticated,
      connectedAt: client.connectedAt,
      subscriptions: Array.from(client.subscriptions),
      ip: client.ip
    }));
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter(c => c.authenticated).length,
      totalRooms: this.rooms.size,
      totalSubscriptions: Array.from(this.clients.values())
        .reduce((total, client) => total + client.subscriptions.size, 0),
      uptime: process.uptime()
    };
  }

  // 🧹 Cleanup
  async stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.wss) {
      this.wss.close(() => {
        this.logger.info(chalk.blue('🌐 WebSocket server stopped'));
      });
    }

    this.clients.clear();
    this.rooms.clear();
  }
}

export { WebSocketManager };

