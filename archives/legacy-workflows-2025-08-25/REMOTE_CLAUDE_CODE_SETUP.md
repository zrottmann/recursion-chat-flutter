# Remote Claude Code Setup Guide

This guide explains how to set up and use the Remote Claude Code functionality for the AI Development Orchestrator.

## 🎯 Overview

The Remote Claude Code system enables distributed execution of Claude Code agents across multiple machines, providing:

- **Real-time WebSocket communication** between orchestrator and agents
- **Advanced task coordination** with dependency management and parallel execution
- **Comprehensive error recovery** with multiple fallback strategies
- **Security layer** with authentication, rate limiting, and access control
- **Performance monitoring** and health checks

## 🏗️ Architecture Components

### Core Services

1. **Claude Code API Service** (`claude-code-api.ts`)
   - Manages remote agent connections
   - Handles task execution and queueing
   - Provides local fallback capabilities

2. **WebSocket Server** (`websocket-server.js`)
   - Real-time communication hub
   - Agent registration and heartbeat monitoring
   - Task distribution and progress tracking

3. **Remote Agent Coordinator** (`remote-agent-coordinator.ts`)
   - Intelligent task routing and load balancing
   - Dependency graph resolution
   - Performance metrics collection

4. **Error Recovery System** (`error-recovery-system.ts`)
   - Circuit breaker pattern implementation
   - Multiple fallback strategies
   - Health monitoring and auto-recovery

5. **Security Manager** (`security-manager.ts`)
   - JWT-based authentication
   - Rate limiting and IP blocking
   - Audit logging and threat detection

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Ensure you have Claude Code CLI available
# Follow: https://github.com/anthropics/claude-code
```

### Environment Setup

Create a `.env.local` file:

```bash
# WebSocket Configuration
WS_PORT=8080
WS_HOST=localhost

# Security Configuration
JWT_SECRET=your-secure-jwt-secret-here
API_KEY_PREFIX=claude_remote_

# Rate Limiting
REQUESTS_PER_MINUTE=100
REQUESTS_PER_HOUR=1000

# Claude Code Settings
CLAUDE_API_KEY=your-claude-api-key
CLAUDE_PROJECT_PATH=/path/to/your/projects

# Development vs Production
NODE_ENV=development
```

### Starting the System

#### Option 1: Full System (Recommended)
```bash
# Start both WebSocket server and Next.js app
npm run start:remote-system
```

#### Option 2: Manual Start
```bash
# Terminal 1: Start WebSocket server
npm run ws:server

# Terminal 2: Start Next.js app
npm run dev
```

### Testing the System

```bash
# Run comprehensive test suite
npm run test:remote

# Run test with server auto-start
npm run test:remote-full
```

## 🔧 Configuration

### WebSocket Server Configuration

Edit `websocket-server.js` to customize:

```javascript
const server = new ClaudeCodeWebSocketServer({
  port: process.env.WS_PORT || 8080,
  host: process.env.WS_HOST || 'localhost',
  maxConnections: 100,
  heartbeatInterval: 30000
});
```

### Security Configuration

Update security settings in your environment or code:

```javascript
const securityConfig = {
  jwtSecret: process.env.JWT_SECRET,
  maxTokenAge: 24 * 60 * 60 * 1000, // 24 hours
  rateLimits: {
    requestsPerMinute: parseInt(process.env.REQUESTS_PER_MINUTE) || 100,
    requestsPerHour: parseInt(process.env.REQUESTS_PER_HOUR) || 1000
  },
  allowedOrigins: ['localhost', '127.0.0.1', 'your-domain.com'],
  requireApiKey: process.env.NODE_ENV === 'production'
};
```

### Error Recovery Configuration

Customize fallback strategies:

```javascript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'network_timeout',
    'agent_disconnected',
    'rate_limit_exceeded'
  ]
};
```

## 🤖 Remote Agent Setup

### Creating a Remote Agent

Create a remote agent script that connects to the orchestrator:

```javascript
// remote-agent.js
const WebSocket = require('ws');
const { spawn } = require('child_process');

class RemoteClaudeAgent {
  constructor(orchestratorUrl, apiKey) {
    this.orchestratorUrl = orchestratorUrl;
    this.apiKey = apiKey;
    this.agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.capabilities = ['web-development', 'api-development'];
  }

  async connect() {
    this.ws = new WebSocket(this.orchestratorUrl);
    
    this.ws.on('open', () => {
      console.log('Connected to orchestrator');
      this.register();
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      this.handleMessage(message);
    });
  }

  register() {
    this.ws.send(JSON.stringify({
      type: 'register',
      agentId: this.agentId,
      name: `Claude Agent ${this.agentId.slice(-8)}`,
      capabilities: this.capabilities,
      version: '1.0.0',
      platform: process.platform
    }));
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'executeTask':
        await this.executeTask(message.task);
        break;
    }
  }

  async executeTask(task) {
    try {
      console.log('Executing task:', task.command);
      
      // Execute Claude Code CLI
      const result = await this.executeClaudeCommand(task.command, task.cwd);
      
      this.ws.send(JSON.stringify({
        type: 'taskComplete',
        taskId: task.id,
        response: {
          success: true,
          output: result.stdout,
          executionTime: Date.now() - task.startTime,
          agentId: this.agentId
        }
      }));
      
    } catch (error) {
      this.ws.send(JSON.stringify({
        type: 'error',
        taskId: task.id,
        agentId: this.agentId,
        error: error.message
      }));
    }
  }

  async executeClaudeCommand(command, cwd) {
    return new Promise((resolve, reject) => {
      const child = spawn('claude-code', command.split(' '), { 
        cwd: cwd || process.cwd(),
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Claude Code exited with code ${code}: ${stderr}`));
        }
      });
    });
  }
}

// Start agent
const agent = new RemoteClaudeAgent('ws://localhost:8080', process.env.CLAUDE_API_KEY);
agent.connect();
```

### Running Remote Agents

```bash
# Start a remote agent
node remote-agent.js

# Start multiple agents
for i in {1..3}; do
  node remote-agent.js &
done
```

## 🖥️ Using the Web Interface

### Accessing the Console

1. Open http://localhost:3000
2. You'll see the AI Development Orchestrator interface
3. The **Remote Agent Network** section shows connection status

### Submitting Tasks

1. Use the **Task Input** form to describe your project
2. The system will:
   - Analyze requirements with Grok AI
   - Create execution plan
   - Distribute tasks to remote agents
   - Show real-time progress
   - Display generated code artifacts

### Monitoring Progress

The interface provides several monitoring views:

- **Remote Agent Network**: Connection health and statistics
- **AI Agent Details**: Individual agent status and performance
- **Activity Timeline**: Real-time task progress and completions

## 🛠️ API Endpoints

### Remote Agent Status

```bash
# Get remote agent status
GET /api/remote-agents/status

# Update agent configuration
POST /api/remote-agents/status
{
  "action": "updateConfig",
  "config": {
    "routing": { "strategy": "capability-matched" },
    "retry": { "maxRetries": 5 }
  }
}
```

### Task Orchestration

```bash
# Submit new task
POST /api/orchestrator
{
  "project": {
    "name": "My Project",
    "description": "Project description",
    "type": "web",
    "requirements": ["Feature 1", "Feature 2"]
  }
}

# Get task status
GET /api/orchestrator?taskId=task-123
```

## 🔍 Troubleshooting

### WebSocket Connection Issues

```bash
# Check if WebSocket server is running
netstat -an | grep 8080

# Test WebSocket connection
wscat -c ws://localhost:8080
```

### Agent Registration Problems

1. **Check agent capabilities**: Ensure they match task requirements
2. **Verify authentication**: Check API keys and JWT tokens
3. **Review security logs**: Look for blocked IPs or rate limiting

### Task Execution Failures

1. **Check agent logs**: Look for Claude Code CLI errors
2. **Verify Claude API key**: Ensure it's valid and has sufficient quota
3. **Review error recovery**: Check if fallback strategies are working

### Performance Issues

1. **Monitor connection health**: Check network stability
2. **Review task distribution**: Ensure proper load balancing
3. **Analyze execution times**: Look for bottlenecks

## 📊 Monitoring and Metrics

### Health Checks

The system provides comprehensive health monitoring:

```javascript
// Access health metrics
const stats = {
  websocket: websocketServer.getStats(),
  coordination: remoteAgentCoordinator.getCoordinationStats(),
  errors: errorRecoverySystem.getErrorStats(),
  security: securityManager.getSecurityStats()
};
```

### Performance Metrics

Monitor these key metrics:

- **Agent Utilization**: Percentage of agents actively working
- **Task Success Rate**: Ratio of successful to failed executions
- **Average Execution Time**: Performance baseline for optimization
- **Error Rate**: System reliability indicator
- **Network Health**: Connection stability measurement

## 🔐 Security Considerations

### Production Deployment

For production use:

1. **Use HTTPS/WSS**: Encrypt all communications
2. **Implement proper authentication**: Use strong API keys
3. **Enable rate limiting**: Prevent abuse and DoS attacks
4. **Monitor security events**: Set up alerting for threats
5. **Regular security updates**: Keep dependencies current

### Access Control

Configure appropriate access levels:

```javascript
const permissions = {
  'admin': ['all'],
  'operator': ['task:submit', 'task:monitor', 'agent:view'],
  'viewer': ['task:view', 'agent:view']
};
```

## 🎯 Advanced Usage

### Custom Fallback Strategies

Add custom error recovery strategies:

```javascript
errorRecoverySystem.addFallbackStrategy({
  name: 'custom_strategy',
  description: 'Custom error handling',
  priority: 90,
  canHandle: (error) => error.errorType === 'custom_error',
  execute: async (error, task) => {
    // Custom recovery logic
    return customRecoveryResponse;
  }
});
```

### Task Routing Strategies

Customize how tasks are distributed:

```javascript
remoteAgentCoordinator.setRoutingStrategy({
  strategy: 'priority-weighted',
  parameters: {
    priorityWeights: { high: 3, medium: 2, low: 1 },
    capabilityBonus: 10
  }
});
```

## 🚀 Production Deployment

### Docker Deployment

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  orchestrator:
    build: .
    ports:
      - "3000:3000"
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    volumes:
      - ./data:/app/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Kubernetes Deployment

Create Kubernetes manifests for scalable deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-orchestrator
spec:
  replicas: 3
  selector:
    matchLabels:
      app: claude-orchestrator
  template:
    metadata:
      labels:
        app: claude-orchestrator
    spec:
      containers:
      - name: orchestrator
        image: claude-orchestrator:latest
        ports:
        - containerPort: 3000
        - containerPort: 8080
```

## 📚 Additional Resources

- **Claude Code Documentation**: https://github.com/anthropics/claude-code
- **WebSocket API Reference**: See `websocket-server.js` for message protocol
- **Error Recovery Strategies**: See `error-recovery-system.ts` for implementation details
- **Security Best Practices**: Review `security-manager.ts` for configuration options

## 🆘 Support

If you encounter issues:

1. **Run the test suite**: `npm run test:remote`
2. **Check logs**: Both WebSocket server and Next.js app logs
3. **Review configuration**: Ensure all environment variables are set
4. **Monitor health metrics**: Use the web interface monitoring tools

The Remote Claude Code system is designed to be robust and self-healing, with comprehensive error recovery and monitoring capabilities.