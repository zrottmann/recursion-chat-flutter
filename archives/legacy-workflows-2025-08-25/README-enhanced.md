# GX - Generator eXecutor

> Multi-agent code generation platform that transforms natural language into fully-functional applications

![GX Banner](https://img.shields.io/badge/GX-Generator%20eXecutor-blue?style=for-the-badge&logo=typescript)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## 🚀 What is GX?

GX is a revolutionary multi-agent orchestration platform that converts natural language descriptions into production-ready applications. It leverages AI-powered planning with deterministic execution to build complete software projects with minimal human intervention.

### Key Features

- **🧠 AI-Powered Planning**: Uses Grok API to expand natural language into detailed project plans
- **🔄 Concurrent Execution**: Supports up to 1000 concurrent agents for maximum parallelization
- **🩺 Self-Healing**: Automatic error detection and repair loop for resilient execution
- **🌳 Git Integration**: Deterministic branching, merging, and pull request management
- **📊 Real-Time Monitoring**: Live progress tracking and execution analytics
- **🎯 Specialized Agents**: Purpose-built agents for scaffolding, code generation, testing, and more

## 🏗️ Architecture

```
gx-monorepo/
├── orchestrator/          # Core orchestration engine
│   ├── src/
│   │   ├── agents/        # Specialized code generation agents
│   │   ├── commands/      # CLI command implementations
│   │   ├── execution/     # Task execution engine
│   │   ├── git/          # Git operations and branching
│   │   ├── providers/     # LLM provider integrations
│   │   ├── queue/        # Task queue management (BullMQ + Redis)
│   │   └── types/        # TypeScript type definitions
│   └── package.json
├── apps/                 # Generated applications
├── packages/            # Generated shared packages
└── agents/              # Custom agent definitions
```

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- PNPM 8+
- Redis (for task queue)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd gx-monorepo

# Install dependencies
pnpm install

# Build the orchestrator
cd orchestrator && pnpm build

# Add GX to your PATH (or use npx)
npm link
```

### Basic Usage

```bash
# Generate a project plan
gx plan "Build a SaaS app with auth, chat, and payments"

# Execute the plan
gx run

# Monitor progress
gx status

# Run demo
gx demo --scenario=saas
```

## 🎯 Core Commands

### ✅ **NEW: Working with Existing Projects**

**Real Grok API Key Configured**: `xai-[REDACTED_FOR_SECURITY]`

#### `gx analyze <project-path>`

Analyze existing codebases with AI-powered insights.

```bash
# Analyze your Trading Post project
gx analyze "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\trading-post" --detailed

# Analyze with Grok AI
gx analyze "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\recursion-chat" --output analysis.json
```

**Options:**
- `--output <file>` - Save analysis to file
- `--detailed` - Include detailed analysis with code snippets
- `--grok` - Use Grok AI for deep analysis (default: true)

#### `gx enhance <project-path> "<request>"`

Enhance existing projects with AI-powered improvements.

```bash
# Add error boundaries to Trading Post
gx enhance "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\trading-post" "Add React error boundary component with user-friendly error messages" --backup

# Optimize performance 
gx enhance "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\recursion-chat" "Optimize React components with useMemo and useCallback" --analyze-first

# Add dark mode (dry run)
gx enhance "C:\Users\Zrott\OneDrive\Desktop\Claude\active-projects\rpg-js-appwrite" "Implement dark mode toggle with CSS variables" --dry-run
```

**Options:**
- `--analyze-first` - Run analysis before enhancement (recommended)
- `--dry-run` - Show enhancement plan without applying changes
- `--backup` - Create backup before applying changes
- `--output <dir>` - Output directory for enhancement logs

### 🚀 **Original Commands (Project Generation)**

#### `gx plan <request>`

Converts natural language into an executable project plan.

```bash
gx plan "Create a blog platform with user auth and comments" \
  --stack="nextjs,postgres,redis" \
  --features="auth,cms,comments,seo" \
  --output="./my-blog-plan"
```

#### `gx run [options]`

Executes a generated plan with concurrent agents.

```bash
gx run --concurrency=50 --plan="./plans/latest/plan.yaml"
```

#### `gx status`

Shows current execution status and system health.

```bash
gx status --watch  # Live updates
```

#### `gx demo`

Runs pre-configured demonstrations.

```bash
gx demo --scenario=saas     # Full SaaS application
gx demo --scenario=blog     # Blog platform
gx demo --scenario=minimal  # Simple task manager
```

## 🤖 Agent System

GX includes specialized agents for different aspects of software development:

### Built-in Agents

- **✅ AnalyzerAgent**: Analyzes existing codebases with Grok AI integration
- **✅ EnhancerAgent**: Makes targeted improvements to existing projects  
- **ScaffoldAgent**: Creates project structure and configuration
- **CodegenAgent**: Generates application code and components
- **TesterAgent**: Creates and runs test suites
- **FixerAgent**: Analyzes and repairs errors automatically

### Agent Capabilities

Each agent is designed for specific tasks:

```typescript
interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  tools: string[];           // [git, codegen, test, etc.]
  capabilities: string[];    // [auth, database, api, etc.]
  maxConcurrency: number;   // Parallel execution limit
}
```

## 🔧 Configuration

### Environment Variables

```bash
# LLM Provider
GROK_API_KEY=your_grok_api_key

# Task Queue
REDIS_URL=redis://localhost:6379

# Execution
MAX_CONCURRENT_AGENTS=100
MAX_RETRIES=3
LOG_LEVEL=info
```

### Plan Structure

Plans are generated as YAML files with this structure:

```yaml
project:
  name: "my-saas-app"
  description: "Full-stack SaaS application"
  stack: ["nextjs", "postgres", "redis"]
  capabilities: ["auth", "chat", "payments"]

artifacts:
  - path: "apps/web"
    type: "app"
    ownerAgent: "nextjs-app"
    acceptance:
      - cmd: "npm run build"
      - test: "**/*.test.tsx"

graph:
  nodes:
    - id: "scaffold-monorepo"
      title: "Scaffold monorepo structure"
      writes: ["package.json", "pnpm-workspace.yaml"]
      reads: []
      tools: ["git", "scaffold"]
      dependsOn: []
      estMinutes: 15
      priority: 10
  limits:
    maxConcurrency: 100
    maxRetries: 3
```

## 🏁 Example Workflows

### Building a SaaS Application

```bash
# 1. Generate comprehensive plan
gx plan "Build a multi-tenant SaaS with user auth, real-time chat, subscription billing, and admin dashboard" \
  --stack="nextjs,nodejs,postgres,redis,stripe" \
  --features="auth,chat,payments,admin,analytics"

# 2. Execute with high concurrency
gx run --concurrency=50

# 3. Monitor progress
gx status --watch
```

### Creating a Blog Platform

```bash
# Quick demo
gx demo --scenario=blog

# Or custom build
gx plan "Create a headless blog with markdown support, SEO optimization, and comment system"
gx run --dry-run  # Preview first
gx run            # Execute
```

## 📊 Monitoring & Analytics

### Real-Time Status

```bash
# Current execution overview
gx status

# Detailed breakdown
┌─────────────────────┬─────────┬─────────────────────┐
│ Component           │ Status  │ Details             │
├─────────────────────┼─────────┼─────────────────────┤
│ Task Queue          │ ✅ Healthy │ Redis connected     │
│ Git Repository      │ ✅ Ready │ Repository ready    │
│ Execution Engine    │ 🔄 Running │ 15/50 tasks done   │
└─────────────────────┴─────────┴─────────────────────┘
```

### Queue Statistics

- **Waiting**: Tasks queued for execution
- **Active**: Currently running tasks
- **Completed**: Successfully finished tasks
- **Failed**: Tasks requiring attention
- **Delayed**: Scheduled for later execution

## 🔄 Self-Healing System

GX includes an advanced error recovery system:

1. **Error Detection**: Automatic monitoring of task execution
2. **Context Analysis**: AI-powered error classification
3. **Patch Generation**: Automated fix creation via Grok API
4. **Verification**: Fix validation and re-execution
5. **Learning**: Pattern recognition for future improvements

### Error Types Handled

- **Missing Dependencies**: Auto-install packages
- **Type Errors**: Fix TypeScript issues
- **Syntax Errors**: Correct code syntax
- **Missing Files**: Generate placeholder files
- **Build Failures**: Resolve configuration issues

## 🚀 Advanced Features

### Custom Agents

Create specialized agents for your domain:

```typescript
import { BaseAgent, AgentResult } from '@gx/orchestrator';

export class MyCustomAgent extends BaseAgent {
  constructor() {
    super({
      id: 'my-agent',
      name: 'Custom Agent',
      tools: ['custom-tool'],
      capabilities: ['domain-specific'],
      maxConcurrency: 5
    });
  }

  async execute(task: TaskNode, context: ExecutionContext): Promise<AgentResult> {
    // Your custom logic here
  }
}
```

### Git Integration

- **Deterministic Branching**: Each task gets its own branch
- **Automatic Merging**: Successful tasks merged to main
- **Conflict Resolution**: AI-powered merge conflict resolution
- **Pull Request Generation**: Automated PR creation and management

### Extensibility

- **Plugin System**: Add custom tools and capabilities
- **Provider Integration**: Support for multiple LLM providers
- **Webhook Support**: Real-time notifications and integrations
- **Custom Workflows**: Define complex multi-stage processes

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd gx-monorepo
pnpm install

# Start development
cd orchestrator
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Grok API** for advanced language understanding
- **BullMQ** for robust task queue management
- **TypeScript** for type safety and developer experience
- **Redis** for high-performance caching and queuing

---

**Built with ❤️ by the GX team**

*Transform ideas into reality with the power of AI-driven development*