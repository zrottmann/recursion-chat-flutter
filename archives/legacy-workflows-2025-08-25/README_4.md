# Active Applications Directory

This directory contains **production-ready applications** deployed exclusively on **Appwrite Cloud**. All applications are modern, scalable, and ready for immediate deployment.

## 🚀 Production Applications

### 📦 [trading-post/](trading-post/) - Marketplace Platform
**Status**: ✅ Live Production | **Platform**: Appwrite Sites  
**URL**: https://tradingpost.appwrite.network

**Full-stack marketplace application featuring:**
- **Frontend**: React 19 with Bootstrap 5 and modern hooks
- **Backend**: Python FastAPI with Appwrite integration  
- **Database**: Appwrite Cloud Database with real-time sync
- **Authentication**: Appwrite Auth with Google OAuth support
- **Features**: Item trading, user profiles, real-time messaging, payment processing

**Quick Deploy:**
```bash
cd trading-post
npm run build  # Installs dependencies and deploys to Appwrite
```

### 💬 [recursion-chat/](recursion-chat/) - Real-time Chat Application  
**Status**: ✅ Live Production | **Platform**: Appwrite Sites  
**URL**: https://chat.recursionsystems.com

**Modern chat application featuring:**
- **Frontend**: React with Vite build system
- **Backend**: Appwrite Realtime Database and Functions
- **Authentication**: Appwrite Auth with session management
- **Features**: Multi-room chat, real-time messaging, user presence, responsive UI

**Quick Deploy:**
```bash
cd recursion-chat  
npm run build  # Builds and deploys to Appwrite
```

## 🛠️ Technology Stack

**Deployment Platform:**
- **Appwrite Sites** - Primary deployment platform
- **Appwrite Cloud** - Database, Auth, Storage, Realtime

**Frontend Technologies:**
- React 19 with modern hooks and context API
- Vite/Create React App build systems
- Bootstrap 5 / Modern CSS frameworks
- Real-time WebSocket integration

**Backend Services:**
- Appwrite Cloud (Database, Auth, Storage, Realtime)
- Python FastAPI (for complex business logic)
- Node.js integration services

## 📦 Deployment Instructions

### Prerequisites
- Node.js 20+
- Appwrite Cloud account (free tier available)
- Git repository access

### Universal Deployment Steps
```bash
# 1. Navigate to any application
cd [trading-post|recursion-chat]

# 2. Install dependencies and deploy
npm install --legacy-peer-deps
npm run build

# 3. Applications auto-deploy to Appwrite Sites
```

### Environment Setup
Both applications use Appwrite Cloud with the following configuration:
- **Project Region**: NYC (New York)  
- **Database**: Real-time enabled
- **Authentication**: Email/password and OAuth providers
- **Storage**: File uploads and asset management

## 🔧 Development Workflow

### Local Development
```bash
# Start local development server
cd [application-directory]
npm start  # Runs on localhost:3000 or localhost:5173

# Run with Appwrite local development
npm run dev  # Connects to Appwrite Cloud for development
```

### Production Deployment
```bash
# Build and deploy to production
npm run build  # Automatically deploys to live URLs
```

## 📚 Documentation

Each application includes comprehensive setup guides:

- **[Trading Post Setup Guide](trading-post/README.md)** - Complete marketplace deployment
- **[Recursion Chat Setup Guide](recursion-chat/README.md)** - Chat application configuration

## 🌐 Live Application Status

| Application | Status | Production URL | Last Updated |
|-------------|---------|----------------|--------------|
| **Trading Post** | 🟢 Live | https://tradingpost.appwrite.network | Latest |
| **Recursion Chat** | 🟢 Live | https://chat.recursionsystems.com | Latest |

## 🎯 Key Features

### Trading Post
- ✅ User authentication and profiles
- ✅ Item listing with photo upload
- ✅ Real-time messaging between users
- ✅ Secure payment processing
- ✅ Geospatial search and filtering
- ✅ Responsive mobile-first design

### Recursion Chat  
- ✅ Real-time multi-room chat
- ✅ User authentication and session management
- ✅ Modern responsive UI
- ✅ Message history and persistence
- ✅ User presence indicators
- ✅ Mobile-optimized interface

---

**Ready for immediate deployment!** Both applications are production-ready with Appwrite Cloud integration.