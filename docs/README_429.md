# Claude Development Portfolio

A comprehensive development workspace for Claude-assisted software projects, featuring production-ready applications and multi-agent collaboration tools.

## 🚀 Active Applications

### [Trading Post](active-projects/trading-post/) - Marketplace Platform
**Status**: ✅ Production Ready | **Platform**: Appwrite Sites  
**Live Demo**: https://tradingpost.appwrite.network

A full-stack marketplace application featuring:
- **Frontend**: React 19 with modern hooks and Bootstrap 5
- **Backend**: Python FastAPI with Appwrite integration
- **Features**: User authentication, item trading, real-time messaging, payment processing
- **Deployment**: Single-command Appwrite Sites deployment

```bash
cd active-projects/trading-post
npm run build  # Builds and deploys to Appwrite
```

### [Recursion Chat](active-projects/recursion-chat/) - Real-time Communication
**Status**: ✅ Production Ready | **Platform**: Appwrite Sites  
**Live Demo**: https://chat.recursionsystems.com

A modern real-time chat application featuring:
- **Frontend**: React with Vite, modern UI components
- **Backend**: Appwrite realtime database and authentication  
- **Features**: Multi-room chat, user authentication, responsive design
- **Deployment**: Automated Appwrite deployment pipeline

```bash
cd active-projects/recursion-chat
npm run build  # Builds and deploys to Appwrite
```

### [SlumLord RPG](active-projects/slumlord-unified/) - Interactive Game
**Status**: ✅ Enhanced with Grok AI | **Platform**: Canvas-based Web Game  
**Features**: NPC dialogue system with Grok AI integration for dynamic conversations

A browser-based RPG featuring:
- **Frontend**: HTML5 Canvas with JavaScript ES6 modules
- **AI Integration**: xAI Grok API for dynamic NPC conversations
- **Features**: Player movement, NPC interaction, proximity detection, spacebar dialogue
- **Innovation**: First RPG with integrated AI-powered NPC conversations

## 🛠️ Technology Stack

**Frontend Technologies:**
- React 19 with modern hooks
- Vite build system  
- HTML5 Canvas for game development
- Bootstrap 5 / Modern CSS
- Real-time WebSocket integration

**Backend & Services:**
- Appwrite Cloud (Database, Auth, Storage, Realtime)
- Python FastAPI (for complex business logic)
- xAI Grok API (for AI-powered conversations)
- JavaScript/Node.js services

**Deployment Platform:**
- **Primary**: Appwrite Sites (recommended)
- **Alternative**: Netlify, Vercel compatible builds

## 📁 Project Structure

```
Claude/
├── active-projects/           # Production applications
│   ├── trading-post/         # Marketplace platform
│   ├── recursion-chat/       # Chat application
│   ├── slumlord-unified/     # RPG with AI integration
│   ├── archon/               # Advanced multi-agent platform
│   └── gx-multi-agent/       # Agent orchestration system
├── enhanced-tech-lead-orchestrator/  # AI agent coordination
├── _archived_docs/           # Historical documentation
├── _archived_legacy/         # Legacy deployment scripts
└── _archived_unity_projects/ # Unity game projects
```

## 🤖 AI & Agent Features

This workspace includes advanced AI integration capabilities:

- **Grok AI Integration**: Dynamic NPC conversations in games
- **Tech Lead Orchestrator**: Multi-agent project coordination
- **Agent Swarm Coordination**: Optimized for multi-agent development workflows
- **Security-First**: Sensitive files and credentials kept per-project

## 🚀 Quick Start

**Prerequisites:**
- Node.js 20+
- Appwrite Cloud account
- Git
- (Optional) xAI API key for Grok features

**Deploy Any App:**
```bash
# Clone repository
git clone [repository-url]
cd Claude

# Choose an application
cd active-projects/[trading-post|recursion-chat|slumlord-unified]

# Install dependencies and deploy
npm install
npm run build  # Automatically deploys to Appwrite
```

## 📚 Documentation

Each application includes comprehensive documentation:

- **[Trading Post Guide](active-projects/trading-post/README.md)** - Complete marketplace setup
- **[Recursion Chat Guide](active-projects/recursion-chat/README.md)** - Chat application deployment
- **[SlumLord RPG Guide](active-projects/slumlord-unified/README.md)** - AI-enhanced game development

## 🔧 Development

Applications follow modern development practices:

- **Clean Architecture**: Separation of concerns, modular components
- **Modern React**: Hooks, functional components, context API
- **TypeScript Support**: Type-safe development where applicable
- **AI Integration**: Seamless AI API integration patterns
- **Automated Deployment**: Single-command deployment to Appwrite
- **Responsive Design**: Mobile-first, accessible user interfaces

## 🌐 Live Deployments

| Application | Status | URL | Last Updated |
|------------|---------|-----|---------------|
| Trading Post | 🟢 Live | https://tradingpost.appwrite.network | Latest |
| Recursion Chat | 🟢 Live | https://chat.recursionsystems.com | Latest |
| SlumLord RPG | 🟢 Enhanced | Local development with AI | Latest |

## 🔒 Security

- GitHub secret scanning protection enabled
- Comprehensive `.gitignore` prevents credential exposure
- Per-project credential isolation
- Environment-based configuration management

## 📄 License

MIT License - Feel free to use these applications as templates for your own projects.

---

**Ready to deploy!** All applications are configured for immediate deployment with modern CI/CD pipelines.
