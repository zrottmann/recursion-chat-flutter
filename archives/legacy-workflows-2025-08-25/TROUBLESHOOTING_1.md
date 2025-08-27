# Agent Swarm Orchestrator - Troubleshooting Guide

## 🚨 Common Initialization Issues & Solutions

### Issue: "Agent Swarm initializing forever"
**Symptoms**: System hangs during startup without clear error messages
**Root Cause**: Silent failures in initialization chain, missing error propagation
**Solution**: Enhanced diagnostic mode now provides detailed progress tracking

### ✅ FIXED: Enhanced Diagnostic System
The system now includes:
- **Phase-by-phase initialization** with timeout mechanisms
- **Detailed progress logging** for each component
- **Port conflict detection** and automatic fallback
- **Health checks** for all systems
- **Comprehensive error reporting** with troubleshooting tips

---

## 🔧 Quick Fixes

### 1. Port Already in Use (EADDRINUSE)
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solution**: 
- Enhanced system automatically tries alternative ports (8081, 8083, 8085, etc.)
- Manual fix: Kill existing processes on port 8080
  ```bash
  # Windows
  netstat -ano | findstr :8080
  taskkill /PID <process_id> /F
  
  # Linux/Mac  
  lsof -i :8080
  kill -9 <process_id>
  ```

### 2. Missing Dependencies
```
Error: Cannot find module 'chalk'
```

**Solution**:
```bash
cd enhanced-tech-lead-orchestrator
npm install
```

### 3. Node.js Version Issues
```
SyntaxError: Unexpected token 'import'
```

**Solution**: Upgrade to Node.js 18+
```bash
node --version  # Should be 18.x.x or higher
```

---

## 📊 Enhanced Startup Process

### Phase 1: Pre-flight Checks
- ✅ Node.js version verification
- ✅ Memory usage monitoring
- ✅ Port availability scanning
- ✅ Dependency validation

### Phase 2: System Initialization
- ✅ Orchestration Engine (with agent loading)
- ✅ Risk Management System
- ✅ Quality Gate System
- ✅ Resource Management System

### Phase 3: Network Services
- ✅ WebSocket server with port fallback
- ✅ Event handler configuration
- ✅ Communication channel establishment

### Phase 4: Health Validation
- ✅ Component status verification
- ✅ System integration testing
- ✅ Memory and performance checks

---

## 🐛 Diagnostic Commands

### Enhanced Startup (Recommended)
```bash
# Use diagnostic startup script
start-optimized.bat

# Or directly with enhanced logging
set LOG_LEVEL=debug
node src/server.js
```

### Health Check
```bash
# Check system status
npm run dev -- status

# Run comprehensive tests
npm run test:all
```

### Log Analysis
```bash
# View detailed logs
cat server.log | grep ERROR
cat server.log | grep "Phase [1-5]"
```

---

## 📈 Performance Monitoring

### Initialization Timing
- **Orchestration Engine**: ~100-150ms (loading 5 agents)
- **Risk Management**: ~1-5ms (configuration loading)
- **Quality Gate**: ~1-5ms (rule initialization)  
- **Resource Management**: ~1-5ms (resource catalog)
- **WebSocket Server**: ~5-10ms (port binding)

**Total Expected Startup**: < 500ms

### Memory Usage
- **Baseline**: ~50-100MB
- **With active connections**: ~100-150MB
- **Warning threshold**: > 500MB

---

## 🔍 Advanced Debugging

### Enable Verbose Logging
```bash
set LOG_LEVEL=debug
set NODE_OPTIONS=--trace-warnings
node src/server.js
```

### Component-Specific Testing
```bash
# Test orchestration engine only
node -e "import('./src/core/orchestrationEngine.js').then(m => new m.OrchestrationEngine().initialize())"

# Test WebSocket manager
node -e "import('./src/services/websocketManager.js').then(m => new m.WebSocketManager().start(8081))"
```

### Network Debugging
```bash
# Check port usage
netstat -an | findstr 8080

# Test WebSocket connection
node test-websocket.js
```

---

## 🚀 Recovery Procedures

### Graceful Recovery
1. **Identify the hanging component** using diagnostic logs
2. **Kill the process** safely with Ctrl+C
3. **Clear port conflicts** if necessary
4. **Restart with diagnostic mode** enabled

### Hard Reset
```bash
# Kill all Node.js processes (Windows)
taskkill /IM node.exe /F

# Clean restart
npm run start
```

### Factory Reset
```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install
npm run start
```

---

## 📞 Support Information

### Log Files
- `server.log` - Main server logs with initialization details
- `orchestrator.log` - Orchestration engine specific logs

### Diagnostic Data
When reporting issues, include:
- Node.js version (`node --version`)
- Operating system details
- Complete error message from logs
- Steps to reproduce the issue

### System Requirements
- **Node.js**: 18.0.0 or higher
- **RAM**: 512MB available
- **Network**: Ports 8080-8085 available
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 18.04+)

---

## 🎯 Success Indicators

You should see this output when system starts correctly:
```
✅ Agent Swarm Orchestrator Started Successfully!

📡 WebSocket Server: ws://localhost:8080
🌐 Dashboard: Open demo-operations-center-enhanced.html
📊 Status: All systems operational  
🔍 Diagnostics: Enhanced monitoring enabled
```

## 🔧 Latest Fixes Applied

### 2025-08-19: "Agent Swarm Initializing Forever" Resolution
- **Added**: Comprehensive diagnostic logging system
- **Added**: Timeout mechanisms for all initialization steps
- **Added**: Port conflict detection and fallback system
- **Added**: Health checks for all components
- **Fixed**: Silent error handling and proper error propagation
- **Added**: Recovery mechanisms and graceful failure modes

The initialization hanging issue has been **RESOLVED** with enhanced diagnostics providing full visibility into the startup process.