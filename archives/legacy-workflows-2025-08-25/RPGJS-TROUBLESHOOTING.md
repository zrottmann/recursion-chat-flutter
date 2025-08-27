# RPG.js v4 Development & Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting and error prevention for RPG.js v4 development based on the official documentation at https://docs.rpgjs.dev/

## Quick Start Checklist

### ✅ Environment Requirements
- [ ] Node.js 18+ installed
- [ ] Modern browser (Chrome 90+, Firefox 88+, Edge 90+)
- [ ] TypeScript 5+ support
- [ ] WebGL support enabled

### ✅ Project Setup
- [ ] Created project using `npx degit rpgjs/starter my-rpg-game`
- [ ] Installed dependencies with `npm install`
- [ ] Configured `rpg.toml` for your game type
- [ ] Set up proper TypeScript configuration

## Common Issues & Solutions

### 1. Module Resolution Errors

**Error Messages:**
- `Cannot resolve module '@rpgjs/server'`
- `Module not found: Error: Can't resolve '@rpgjs/client'`

**Solutions:**
```bash
# Reinstall RPG.js core dependencies
npm install @rpgjs/server@^4.0.0 @rpgjs/client@^4.0.0 @rpgjs/common@^4.0.0

# Clear npm cache if issues persist
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Prevention:**
- Always use exact version ranges in package.json
- Ensure all team members use same Node.js version
- Use npm ci for consistent installations

### 2. WebGL/PixiJS Errors

**Error Messages:**
- `WebGL not supported`
- `WebGL context lost`
- `PIXI is not defined`

**Solutions:**
```javascript
// Check WebGL support before initialization
function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (e) {
    return false;
  }
}

if (!checkWebGLSupport()) {
  console.error('WebGL is required for RPG.js v4');
  // Show fallback UI or error message
}
```

**Prevention:**
- Test on target browsers and devices
- Provide graceful degradation for unsupported browsers
- Update graphics drivers on development machines

### 3. TypeScript Configuration Issues

**Error Messages:**
- `TS2307: Cannot find module`
- `TS2304: Cannot find name`

**Recommended tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "esnext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Vite Build Configuration

**Error Messages:**
- `Failed to resolve entry`
- `Vite build failing`

**Recommended vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      external: ['electron'] // If using Electron
    }
  },
  server: {
    port: 3000,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

### 5. Socket.io Connection Issues

**Error Messages:**
- `WebSocket connection failed`
- `Socket.io client not connecting`

**Solutions:**
```javascript
// Ensure proper Socket.io v4 configuration
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

socket.on('connect', () => {
  console.log('Connected to RPG.js server');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});
```

### 6. Game Type Configuration

**Single-Player RPG Setup:**
```bash
# Set environment variable for single-player mode
export RPG_TYPE=rpg
npm run dev
```

**MMORPG Setup:**
```bash
# Default is MMORPG mode
npm run dev
```

## Performance Optimization

### 1. FPS Monitoring
```javascript
let lastTime = performance.now();
let frameCount = 0;

function measureFPS() {
  frameCount++;
  const currentTime = performance.now();
  
  if (currentTime >= lastTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
    console.log(`FPS: ${fps}`);
    frameCount = 0;
    lastTime = currentTime;
  }
  
  requestAnimationFrame(measureFPS);
}

measureFPS();
```

### 2. Memory Management
```javascript
// Monitor memory usage
if ('memory' in performance) {
  setInterval(() => {
    const memory = performance.memory;
    const memoryMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    if (memoryMB > 100) {
      console.warn(`High memory usage: ${memoryMB}MB`);
    }
  }, 5000);
}
```

## Development Best Practices

### 1. Project Structure
```
src/
├── game/
│   ├── main/
│   │   ├── client/
│   │   │   ├── index.ts
│   │   │   ├── maps/
│   │   │   ├── characters/
│   │   │   └── gui/
│   │   └── server/
│   │       ├── index.ts
│   │       ├── maps/
│   │       ├── events/
│   │       └── database/
│   └── index.ts
├── client.ts
├── server.ts
└── index.html
```

### 2. Error Handling
```javascript
// Global error handler for RPG.js applications
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  
  // Check for common RPG.js errors
  if (event.error.message.includes('WebGL')) {
    showWebGLError();
  } else if (event.error.message.includes('Socket')) {
    showConnectionError();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
```

### 3. Asset Loading
```javascript
// Proper asset loading with error handling
async function loadAssets() {
  try {
    const assets = [
      'images/tileset.png',
      'sounds/background.mp3',
      'maps/level1.json'
    ];
    
    const loadPromises = assets.map(asset => 
      fetch(asset).then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load ${asset}: ${response.status}`);
        }
        return response;
      })
    );
    
    await Promise.all(loadPromises);
    console.log('All assets loaded successfully');
  } catch (error) {
    console.error('Asset loading failed:', error);
    // Show error UI or retry mechanism
  }
}
```

## Deployment Guide

### 1. Production Build (MMORPG)
```bash
NODE_ENV=production npm run build
```

### 2. Production Build (Single-Player)
```bash
NODE_ENV=production RPG_TYPE=rpg npm run build
```

### 3. Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/server/main.js"]
```

## Debug Commands

When using the RPG.js Helper system, you can access these debug commands in the browser console:

```javascript
// Check system status
rpgjsHelper.generateReport()

// Validate configuration
window.rpgMain.validator.validateConfiguration()

// Monitor performance
console.log('FPS:', window.rpgFPS)
console.log('Memory:', window.rpgMemory + 'MB')

// View development tips
rpgjsHelper.getDevelopmentTips()

// Show console viewer
window.showConsoleViewer()
```

## Resources

- [Official RPG.js Documentation](https://docs.rpgjs.dev/)
- [RPG.js GitHub Repository](https://github.com/RSamaium/RPG-JS)
- [Community Discord](https://discord.gg/rpgjs)
- [Example Projects](https://github.com/RSamaium/RPG-JS/tree/main/examples)

## Getting Help

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Ask on the community Discord
4. Create a minimal reproduction case
5. File a detailed issue on GitHub

---

*Last updated: 2025-08-16*
*Based on RPG.js v4 documentation*