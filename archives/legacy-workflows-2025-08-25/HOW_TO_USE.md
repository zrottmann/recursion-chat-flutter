# 🎯 Enhanced Tech-Lead Orchestrator - User Guide

## Installation & Setup

```bash
# Navigate to the project directory
cd enhanced-tech-lead-orchestrator

# Install dependencies
npm install

# Initialize the system
node src/index.js init
```

## Core Commands

### 1. Initialize System
```bash
node src/index.js init
```
Starts all orchestrator systems and verifies connectivity.

### 2. Check Status
```bash
node src/index.js status
```
Shows the current status of all systems.

### 3. Plan a Mission
```bash
# Using a requirements file
node src/index.js plan --file requirements.json

# Using inline JSON
node src/index.js plan --requirements '{"name":"My Project","features":{"api":true}}'
```

### 4. Run Tests
```bash
# Run all tests
node src/index.js test

# Run specific test suites
node src/index.js test --unit
node src/index.js test --integration
node src/index.js test --e2e
```

### 5. Run Demo
```bash
node demo.js
```
Runs a complete demonstration of the system capabilities.

## 📋 Creating Mission Requirements

Create a `requirements.json` file:

```json
{
  "name": "E-Commerce Platform",
  "description": "Build a scalable e-commerce solution",
  "features": {
    "api": true,
    "database": true,
    "authentication": true,
    "frontend": true,
    "realTime": true,
    "mobile": false
  },
  "scale": "medium",
  "performance": {
    "highLoad": true,
    "realTime": false
  },
  "security": {
    "compliance": true,
    "encryption": true
  },
  "timeline": {
    "deadline": "2025-06-01",
    "urgent": false
  }
}
```

## 🎮 Interactive Usage Examples

### Example 1: Simple Web App
```bash
# Create requirements
echo {
  "name": "Blog Platform",
  "features": {
    "api": true,
    "database": true,
    "frontend": true
  },
  "scale": "simple"
} > blog-requirements.json

# Plan the mission
node src/index.js plan --file blog-requirements.json
```

### Example 2: Complex Enterprise System
```bash
node src/index.js plan --requirements '{
  "name": "Banking System",
  "features": {
    "api": true,
    "database": true,
    "authentication": true,
    "frontend": true,
    "realTime": true,
    "mobile": true
  },
  "scale": "complex",
  "security": {
    "compliance": true,
    "encryption": true
  },
  "performance": {
    "highLoad": true,
    "realTime": true
  }
}'
```

## 🌐 WebSocket Real-Time Monitoring

### Start WebSocket Server
```javascript
// In your code
import { WebSocketManager } from './src/services/websocketManager.js';

const wsManager = new WebSocketManager();
await wsManager.start(8080); // Port 8080
```

### Connect as Client
```javascript
// Client connection example
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  // Authenticate
  ws.send(JSON.stringify({
    type: 'auth:login',
    payload: {
      token: 'your-auth-token',
      userId: 'user123',
      role: 'admin'
    }
  }));
  
  // Subscribe to updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    payload: {
      topics: ['missions', 'agents', 'quality-gates']
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Update:', message);
});
```

## 📊 Mission Output Format

When you plan a mission, you'll get output like:

```json
{
  "id": "mission-1234567890-abc123",
  "name": "E-Commerce Platform",
  "complexity": "medium",
  "riskLevel": "medium",
  "estimatedTime": 480,
  "tasks": [
    {
      "id": "task-1",
      "name": "Requirements Analysis",
      "type": "analysis",
      "estimatedHours": 16,
      "assignedAgent": "Analyst-Prime",
      "dependencies": []
    },
    {
      "id": "task-2",
      "name": "Database Design",
      "type": "design",
      "estimatedHours": 24,
      "assignedAgent": "Architect-Alpha",
      "dependencies": ["task-1"]
    }
  ],
  "qualityGates": [
    {
      "name": "Code Review",
      "criteria": ["coverage > 80%", "no critical issues"]
    },
    {
      "name": "Security Audit",
      "criteria": ["OWASP compliance", "encryption verified"]
    }
  ],
  "timeline": {
    "totalHours": 480,
    "estimatedDays": 60,
    "criticalPath": ["task-1", "task-2", "task-5", "task-8"]
  }
}
```

## 🤖 Available AI Agents

The system includes these specialized agents:

- **Analyst-Prime** - Requirements analysis and documentation
- **Architect-Alpha** - System design and architecture
- **Dev-Backend-01** - Backend development
- **Dev-Frontend-01** - Frontend development
- **QA-Master** - Quality assurance and testing
- **Security-Sentinel** - Security analysis and implementation
- **DevOps-Dragon** - Deployment and infrastructure
- **Data-Wizard** - Database design and optimization

## 🔧 Advanced Configuration

### Custom Agent Configuration
Create `agents-config.json`:
```json
{
  "agents": [
    {
      "name": "Custom-Agent",
      "capabilities": ["api", "database", "custom-skill"],
      "performance": {
        "successRate": 0.95,
        "averageTime": 100,
        "qualityScore": 90
      }
    }
  ]
}
```

### Risk Thresholds
Modify risk assessment in `config.json`:
```json
{
  "riskManagement": {
    "thresholds": {
      "low": 0.3,
      "medium": 0.7,
      "high": 1.0
    }
  }
}
```

## 🎯 Common Use Cases

### 1. Planning a New Project
```bash
# Step 1: Create requirements
node src/index.js plan --file my-project.json > mission-plan.json

# Step 2: Review the plan
cat mission-plan.json

# Step 3: Execute (if integrated with your CI/CD)
node src/index.js execute --plan mission-plan.json
```

### 2. Monitoring Active Missions
```bash
# Start monitoring dashboard
node src/index.js monitor --port 8080

# Or use the demo
node demo.js
```

### 3. Quality Gate Validation
```bash
# Check if project passes quality gates
node src/index.js validate --mission-id mission-123
```

## 🐛 Troubleshooting

### System Won't Initialize
```bash
# Check dependencies
npm install

# Verify Node version (requires 18+)
node --version

# Run with debug logging
DEBUG=* node src/index.js init
```

### WebSocket Connection Issues
```bash
# Check if port is available
netstat -an | grep 8080

# Use different port
node demo.js --ws-port 9090
```

### Test Failures
```bash
# Run tests with verbose output
npm run test:unit -- --reporter=verbose

# Check test logs
cat test-results/unit.json
```

## 📚 API Reference

### Programmatic Usage
```javascript
import { EnhancedTechLeadOrchestrator } from './src/index.js';

// Initialize
const orchestrator = new EnhancedTechLeadOrchestrator();
await orchestrator.initialize();

// Plan a mission
const plan = await orchestrator.planMission({
  name: 'My Project',
  features: { api: true, database: true }
});

// Execute mission
const execution = await orchestrator.executeMission(plan);

// Get status
const status = orchestrator.getStatus();
console.log(status);
```

## 🎨 Dashboard Integration

To integrate with a web dashboard:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Orchestrator Dashboard</title>
</head>
<body>
  <div id="status"></div>
  <script>
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      document.getElementById('status').innerHTML = `
        <h2>Mission: ${data.missionId}</h2>
        <p>Status: ${data.status}</p>
        <p>Progress: ${data.progress}%</p>
      `;
    };
  </script>
</body>
</html>
```

## 🚀 Quick Start Examples

### Fastest Way to See It Work
```bash
# 1. Run the demo
node demo.js

# 2. Or plan a simple mission
node src/index.js plan --requirements '{"name":"Quick Test","features":{"api":true}}'
```

### Production Setup
```bash
# 1. Build for production
npm run build

# 2. Run from dist folder
cd dist
node src/index.js init

# 3. Start with PM2 (if installed)
pm2 start src/index.js --name orchestrator
```

## 📞 Support

- **Documentation**: See `README.md`
- **Tests**: Run `npm test` to verify setup
- **Examples**: Check `demo.js` for usage patterns

---

Last Updated: 2025-01-19
Version: 2.0.0