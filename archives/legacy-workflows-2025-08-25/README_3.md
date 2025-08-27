# GX Multi-Agent Platform

A comprehensive multi-agent code generation platform with Grok API integration, designed to orchestrate multiple specialized AI agents for complex development tasks.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Redis server
- PostgreSQL database
- Grok API key from X.AI

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd gx-multi-agent-platform
   npm install -g pnpm@8.15.1
   pnpm install
   ```

2. **Run the setup script:**
   ```bash
   node setup.js
   ```

3. **Start required services:**
   ```bash
   # Option 1: Using Docker (recommended)
   docker compose up -d
   
   # Option 2: Install locally
   # Redis: https://redis.io/download
   # PostgreSQL: https://www.postgresql.org/download/
   ```

4. **Configure environment:**
   ```bash
   # Update .env with your actual values
   GROK_API_KEY=your-actual-grok-api-key
   DATABASE_URL=postgresql://gxuser:gxpass@localhost:5432/gx_platform
   ```

5. **Test the platform:**
   ```bash
   node test-platform.js
   ```

6. **Start the platform:**
   ```bash
   node start.js
   ```

## 🎮 Usage

### Basic Commands

```bash
# Create a plan from natural language
node orchestrator/cli/index.js plan "Create a React todo app with authentication"

# Execute a plan
node orchestrator/cli/index.js run <plan-id>

# Check system status
node orchestrator/cli/index.js status

# Run a demo scenario
node orchestrator/cli/index.js demo
```

### Example Usage

```bash
# Full-stack application
node orchestrator/cli/index.js plan "Create a social media app with user auth, posts, comments, and real-time chat using React, Node.js, and PostgreSQL"

# API-only project
node orchestrator/cli/index.js plan "Create a REST API for task management with user authentication and project management" --type api --stack typescript,node,postgresql

# Frontend-only project
node orchestrator/cli/index.js plan "Create a React dashboard with charts and real-time data" --type web --stack typescript,react,tailwind
```

## 🏗️ Architecture

```
┌─────────────────┐
│   CLI Client    │ ← Command interface
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Orchestrator   │ ← Main coordination service
│   - Planning    │
│   - Execution   │
│   - Monitoring  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Task Queue     │   │  Agent Runner   │   │  State Manager  │
│  (Bull/Redis)   │◄──┤  (Multi-agent)  │──►│  (PostgreSQL)   │
└─────────────────┘   └─────────────────┘   └─────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Code Generator │   │  Test Generator │   │ Doc Generator   │
│     Agent       │   │     Agent       │   │     Agent       │
└─────────────────┘   └─────────────────┘   └─────────────────┘
```

## 🤖 Specialized Agents

### Code Generator Agent
- **Purpose**: Generates production-ready code from natural language descriptions
- **Capabilities**: React, Node.js, TypeScript, Python, API endpoints, database schemas
- **Features**: Framework detection, best practices, modular architecture

### Test Generator Agent
- **Purpose**: Creates comprehensive test suites for generated code
- **Capabilities**: Unit tests, integration tests, E2E tests, mocking
- **Features**: Coverage analysis, test patterns, edge case detection

### Documentation Generator Agent
- **Purpose**: Produces technical documentation and guides
- **Capabilities**: API docs, README files, code comments, deployment guides
- **Features**: Auto-generation from code, markdown formatting, examples

### Base Agent System
- **Purpose**: Provides common functionality for all agents
- **Capabilities**: Task execution, error handling, metrics collection
- **Features**: Event emission, state tracking, performance monitoring

## 📊 Monitoring & Observability

The platform includes comprehensive monitoring:

- **Real-time Progress**: Watch plan execution in real-time
- **Performance Metrics**: Execution time, memory usage, throughput
- **Error Tracking**: Detailed error reporting and stack traces
- **Agent Health**: Individual agent status and performance
- **Queue Monitoring**: Task queue depth and processing rates

## 🔧 Configuration

### Environment Variables

```bash
# Core Configuration
GROK_API_KEY=your-grok-api-key
GROK_API_URL=https://api.x.ai/v1
DATABASE_URL=postgresql://user:pass@localhost:5432/gx_platform

# Agent Configuration
MAX_CONCURRENT_AGENTS=10
AGENT_TIMEOUT_MS=300000
AGENT_RETRY_ATTEMPTS=3

# Queue Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
QUEUE_CONCURRENCY=5

# Development
NODE_ENV=development
LOG_LEVEL=info
```

### Scaling Configuration

```bash
# Production Settings
MAX_CONCURRENT_AGENTS=100
QUEUE_CONCURRENCY=20
AGENT_TIMEOUT_MS=600000

# Performance Tuning
REDIS_URL=redis://production-redis:6379
DATABASE_URL=postgresql://prod-user:pass@prod-db:5432/gx_platform
```

## 🚀 Deployment

### Docker Deployment

```bash
# Start infrastructure
docker compose up -d

# Run platform
node start.js
```

### Production Deployment

1. **Infrastructure Setup:**
   - Redis cluster for high availability
   - PostgreSQL with read replicas
   - Load balancer for multiple orchestrator instances

2. **Environment Setup:**
   ```bash
   NODE_ENV=production
   MAX_CONCURRENT_AGENTS=100
   GROK_RATE_LIMIT_RPM=1000
   ```

3. **Monitoring Setup:**
   - Application metrics collection
   - Log aggregation
   - Health check endpoints

## 🧪 Testing

### Run Platform Tests
```bash
node test-platform.js
```

### Run Unit Tests
```bash
pnpm test
```

### Run Specific Agent Tests
```bash
pnpm test --filter=@gx/code-generator
```

## 📝 Example Scenarios

### Scenario 1: E-commerce Platform
```bash
node orchestrator/cli/index.js plan "Create an e-commerce platform with product catalog, shopping cart, payment integration, user accounts, order management, and admin panel using React, Node.js, PostgreSQL, and Stripe"
```

### Scenario 2: Real-time Chat Application
```bash
node orchestrator/cli/index.js plan "Build a real-time chat application with channels, direct messages, file sharing, user presence, and notification system using React, Socket.io, Node.js, and Redis"
```

### Scenario 3: Analytics Dashboard
```bash
node orchestrator/cli/index.js plan "Create an analytics dashboard with data visualization, real-time metrics, filtering, export functionality, and user management using React, D3.js, Node.js, and ClickHouse"
```

## 🛠️ Development

### Project Structure
```
gx-multi-agent-platform/
├── orchestrator/           # Main orchestration service
├── agents/                # Specialized AI agents
│   ├── base/              # Base agent functionality
│   ├── code-generator/    # Code generation agent
│   ├── test-generator/    # Test generation agent
│   └── documentation-generator/ # Documentation agent
├── packages/              # Shared packages
│   └── auth-sdk/          # Authentication SDK
├── apps/                  # Application services
├── infra/                 # Infrastructure configuration
└── scripts/               # Utility scripts
```

### Adding New Agents

1. **Create agent directory:**
   ```bash
   mkdir agents/my-new-agent
   cd agents/my-new-agent
   ```

2. **Implement agent interface:**
   ```typescript
   import { BaseAgent } from '../base/src/base-agent.js';
   
   export class MyNewAgent extends BaseAgent {
     async execute(task: AgentTask): Promise<AgentResult> {
       // Implementation
     }
   }
   ```

3. **Register agent:**
   Add to orchestrator agent registry

## 🔐 Security

- **API Key Management**: Secure storage and rotation
- **Input Validation**: All user inputs are validated
- **Sandboxed Execution**: Agents run in isolated environments
- **Audit Logging**: Complete audit trail of all operations
- **Rate Limiting**: Protection against abuse

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Documentation**: Check this README and inline comments
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join GitHub Discussions for questions

## 🚀 Roadmap

- [ ] Web UI for plan management
- [ ] Additional language support (Python, Go, Rust)
- [ ] Cloud deployment templates
- [ ] Advanced monitoring dashboard
- [ ] Plugin system for custom agents
- [ ] Integration with popular IDEs