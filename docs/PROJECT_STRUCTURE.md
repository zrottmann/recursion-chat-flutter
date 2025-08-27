# Project Structure Overview

## Active Projects

### 🏪 Trading Post (`active-projects/trading-post/`)
- **Description**: Local community trading marketplace
- **Live URL**: https://tradingpost.appwrite.network
- **Project ID**: `689bdee000098bd9d55c`
- **Technology**: React + Vite, Appwrite backend
- **Structure**:
  ```
  trading-post/
  ├── trading-app-frontend/     # React frontend
  │   ├── src/                  # Source code
  │   ├── dist/                 # Build output
  │   ├── package.json          # Frontend dependencies
  │   ├── .env                  # Development config
  │   ├── .env.production       # Production config
  │   └── .env.sites            # Sites deployment config
  └── README.md                 # Project documentation
  ```

### 💬 Recursion Chat (`active-projects/recursion-chat/`)
- **Description**: Real-time chat application
- **Live URL**: https://chat.recursionsystems.com
- **Project ID**: `689bdaf500072795b0f6`
- **Technology**: React + Vite, Appwrite real-time
- **Structure**:
  ```
  recursion-chat/
  ├── client/                   # React frontend
  │   ├── src/                  # Source code
  │   ├── dist/                 # Build output
  │   ├── package.json          # Frontend dependencies
  │   ├── .env                  # Development config
  │   └── .env.development      # Development config
  ├── server.js                 # Express backend
  ├── package.json              # Backend dependencies
  └── CLAUDE.md                 # Detailed project guide
  ```

### 💬 Chat Network (`active-projects/chat-appwrite-network/`)
- **Description**: Mobile-optimized chat interface
- **Live URL**: https://chat.appwrite.network
- **Project ID**: `68a4e3da0022f3e129d0`
- **Site ID**: `68aa1b51000a9c3a9c36`
- **Technology**: Mobile-first React interface

### 🎮 Slumlord RPG (`active-projects/slumlord/`)
- **Description**: Multiplayer RPG game
- **Live URL**: https://slumlord.appwrite.network
- **Project ID**: `689fdf6a00010d7b575f`
- **Technology**: RPG-JS framework, Appwrite backend
- **Structure**:
  ```
  slumlord/
  ├── web/
  │   └── appwrite-deployment/  # Deployment config
  │       ├── dist/             # Game build output
  │       ├── package.json      # Game dependencies
  │       └── .env              # Game configuration
  └── multiplayer/              # Multiplayer components
  ```

### 🧠 Archon AI (`active-projects/archon/`)
- **Description**: AI knowledge engine platform
- **Status**: Not yet deployed
- **Technology**: Node.js backend, React frontend
- **Structure**:
  ```
  archon/
  ├── frontend/                 # React frontend
  ├── functions/               # Appwrite functions
  ├── public/                  # Static assets
  ├── server.js               # Express server
  └── package.json            # Main dependencies
  ```

### 🔧 Claude Code Remote (`active-projects/Claude-Code-Remote/`)
- **Description**: Development tool for Claude integration
- **Live URL**: https://remote.appwrite.network
- **Project ID**: `68a4e3da0022f3e129d0`
- **Technology**: Web interface for Claude Code

### 🤖 GX Multi-Agent Platform (`active-projects/gx-multi-agent-platform/`)
- **Description**: Multi-agent coordination system
- **Status**: Not yet deployed
- **Technology**: Multi-agent framework

## Configuration Management

### Centralized Environment Configurations
Location: `config/environments/`

All projects now have complete Appwrite environment configurations:
- `trading-post.env.complete` - Trading marketplace config
- `recursion-chat.env.complete` - Chat application config
- `chat-appwrite-network.env.complete` - Mobile chat config
- `slumlord.env.complete` - RPG game config
- `claude-code-remote.env.complete` - Development tool config
- `archon.env.complete` - AI platform config
- `gx-multi-agent-platform.env.complete` - Multi-agent config

### Master Template
Location: `appwrite-env-template.env`
- Complete Appwrite API coverage (336+ variables)
- OAuth providers configuration
- Real-time WebSocket settings
- Third-party integrations

## Common Scripts

### Development
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Deployment
```bash
npm run sites:build    # Build for Appwrite Sites
npm run android:build  # Build for Android (Capacitor)
npm run ios:build      # Build for iOS (Capacitor)
```

## Dependencies Management

### Optimized Package.json Files
- Removed unused devDependencies
- Consolidated duplicate scripts
- Cleaned up test configurations
- Standardized script naming

### Common Dependencies
- **React**: ^18.3.1
- **Vite**: ^6.0.2
- **Appwrite**: ^18.2.0
- **ESLint**: ^9.33.0

## Build Artifacts Cleaned

### Removed Directories
- `.turbo/` (Turborepo cache)
- `dist/` (Build outputs - regenerated on build)
- `build/` (Alternative build outputs)
- `node_modules/` (Large unused installations)

### Removed Files
- `*.log` files (npm, yarn, debug logs)
- Duplicate `.env.example` files
- Redundant configuration files

## Next Steps

1. **Testing**: Verify all projects build and deploy correctly
2. **Documentation**: Update project-specific README files
3. **CI/CD**: Ensure GitHub Actions workflows are optimized
4. **Monitoring**: Set up performance monitoring for live sites

## Quick Commands

```bash
# Build all projects
for dir in active-projects/*/; do (cd "$dir" && npm run build 2>/dev/null); done

# Check project health
for dir in active-projects/*/; do echo "=== $dir ===" && (cd "$dir" && npm run lint 2>/dev/null); done

# Deploy all sites
for dir in active-projects/*/; do (cd "$dir" && npm run sites:build 2>/dev/null); done
```