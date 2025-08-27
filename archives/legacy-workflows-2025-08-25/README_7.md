# 🎮 Slumlord ARPG - Mobile Testing Suite

Comprehensive mobile testing framework for the Slumlord Action RPG, focusing on mobile browser performance, touch controls, ARPG mechanics, multiplayer functionality, and network resilience.

## 🚀 Quick Start

```bash
# Install dependencies
cd tests
npm install

# Install Playwright browsers
npm run install:browsers

# Run all mobile tests
npm run test:all

# Run specific test suites
npm run test:mobile          # Mobile browser tests
npm run test:performance     # Performance benchmarking  
npm run test:load           # Load testing with Artillery
npm run test:network        # Network quality testing
```

## 📱 Test Categories

### 1. Mobile Browser Testing (`mobile-tests/`)
**Playwright-based tests for real mobile browser behavior**

#### Game Loading Tests (`game-loading.spec.js`)
- ✅ Loading screen display and optimization
- ⏱️ Load time performance on mobile networks
- 🔄 Graceful timeout and error handling
- 📱 Responsive design during loading states
- 🔄 Orientation change handling
- 💾 Loading state persistence through interruptions

#### Touch Controls Tests (`touch-controls.spec.js`)
- 👆 Basic touch event detection and response
- 🎯 Multi-touch gesture support for combat
- 📱 Mobile Quick UI visibility and interaction
- 🌊 Swipe gesture recognition for movement
- 🚫 Prevention of unwanted browser behaviors (zoom, scroll)
- ⚡ Touch responsiveness under load
- 🔄 Orientation change adaptation
- 📳 Haptic feedback integration

#### ARPG Mechanics Tests (`arpg-mechanics.spec.js`)
- ⚔️ Combat system initialization and touch interaction
- 🏃 Character movement via touch controls
- 🎒 Equipment system mobile interface
- 💎 Loot collection through touch
- 📊 Mobile-optimized HUD elements
- 📈 Character progression and stats display
- 💬 Mobile chat system integration
- ⚡ Performance during intensive ARPG gameplay

#### Multiplayer Concurrent Tests (`multiplayer-concurrent.spec.js`)
- 👥 Multiple mobile users connecting simultaneously
- 🚀 Performance with concurrent mobile sessions
- 🔌 Connection stability and reconnection handling
- 🗺️ Player position synchronization across devices
- 💬 Mobile chat communication between players

### 2. Performance Testing (`performance/`)
**Comprehensive mobile performance benchmarking**

#### Mobile Performance Suite (`mobile-performance.js`)
- 📊 Load time analysis across device types
- 🎮 Frame rate monitoring during gameplay
- 🧠 Memory usage tracking and leak detection  
- 👆 Touch response time measurement
- 📦 Asset loading optimization validation
- 🔋 Battery impact assessment

**Device Coverage:**
- 📱 Pixel 5 (Android)
- 🍎 iPhone 12 (iOS Safari)
- 📱 Galaxy S21 (Android)

### 3. Network Quality Testing (`network-tests/`)
**Mobile network condition simulation and testing**

#### Network Quality Tests (`mobile-network-quality.spec.js`)
- 📡 3G network condition simulation
- 🔄 Intermittent connection handling
- 📊 Data usage optimization validation
- ⏱️ High latency performance testing
- 📱 Offline mode and caching capability
- 🐌 Slow asset loading graceful degradation
- 📡 WebSocket connection stability
- 🔄 Network switching (WiFi to cellular)

### 4. Load Testing (`load-tests/`)
**Artillery-based multiplayer load testing**

#### Mobile Multiplayer Load Tests (`mobile-multiplayer.yml`)
- 👥 Concurrent mobile user simulation (up to 25 users)
- 📱 Mobile-specific user scenarios
- 🔌 WebSocket multiplayer connection testing
- ⚡ Touch interaction load testing
- 🎮 ARPG feature stress testing

## 🛠️ Configuration

### Test Environments
```bash
# Local development
export SLUMLORD_URL=http://localhost:5173

# Staging
export SLUMLORD_URL=https://slumlord-staging.appwrite.network  

# Production (default)
export SLUMLORD_URL=https://slumlord.appwrite.network
```

### Mobile Device Simulation
Tests run against multiple device configurations:
- **Mobile Chrome** (Pixel 5): 393×851px
- **Mobile Safari** (iPhone 12): 390×844px  
- **Small Mobile** (Galaxy S5): 360×640px
- **Tablet** (iPad Pro): 1024×1366px

## 📊 Test Reports

### HTML Reports
- 📱 `test-results/mobile-html-report/` - Interactive Playwright results
- 🚀 `test-results/mobile-performance-report.html` - Performance benchmarks
- 📡 `test-results/network-html-report/` - Network quality results

### JSON Data
- 📊 `test-results/mobile-results.json` - Raw test data
- 🚀 `test-results/mobile-performance-results.json` - Performance metrics
- 📡 `test-results/network-results.json` - Network test data

## 🎯 Performance Expectations

### Mobile Performance Targets
- ⏱️ **Load Time**: < 15 seconds on 3G networks
- 🎮 **Frame Rate**: ≥ 20 FPS sustained during gameplay
- 🧠 **Memory Usage**: < 150MB total, < 50MB increase during session
- 👆 **Touch Response**: < 50ms average, < 100ms maximum
- 📦 **Asset Size**: < 25MB total for mobile optimization
- 🔋 **Battery Impact**: < 70% drain per hour of gameplay

### Network Resilience
- 📡 **3G Performance**: Game loads within 45 seconds
- 🔄 **Connection Recovery**: Automatic reconnection within 5 seconds
- 💾 **Offline Capability**: Basic gameplay with cached assets
- 📊 **Data Efficiency**: < 50MB initial download

## 🐛 Debugging

### Debug Mode
```bash
# Run tests with browser visible
npm run test:debug

# Run with detailed logging
DEBUG=pw:* npm run test:mobile

# Performance monitoring
HEADED=true node performance/mobile-performance.js
```

### Common Issues
- **Canvas not found**: Game may not be fully initialized
- **Touch events not registered**: Check touch simulation settings
- **WebSocket timeouts**: Network conditions may be too restrictive
- **Memory leaks**: Check for uncleaned event listeners

## 🔧 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Mobile Tests
  run: |
    cd tests
    npm install
    npm run install:browsers
    npm run test:mobile
    
- name: Upload Test Results  
  uses: actions/upload-artifact@v3
  with:
    name: mobile-test-results
    path: tests/test-results/
```

## 📈 Continuous Monitoring

### Key Metrics to Track
- 📱 Mobile load time trends
- 🎮 Frame rate stability across devices  
- 🧠 Memory usage patterns
- 👆 Touch responsiveness consistency
- 👥 Concurrent user capacity
- 📡 Network resilience effectiveness

### Alerts and Thresholds
- 🚨 Load time > 20 seconds
- ⚠️ FPS drops below 15
- 🚨 Memory usage > 200MB
- ⚠️ Success rate < 90%
- 🚨 Touch response > 100ms average

## 🤝 Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Include device-specific configurations
4. Add performance expectations
5. Update this README with new test descriptions

### Test Quality Standards
- ✅ All tests must pass on multiple device types
- 📱 Mobile-first design and assumptions
- 🔄 Handle async operations properly
- ⏰ Use appropriate timeouts for mobile networks
- 📊 Include meaningful performance metrics

---

## 📞 Support

For questions about mobile testing setup or results interpretation:
- 📧 Create an issue in the repository
- 📱 Include device and browser information
- 📊 Attach relevant test reports
- 🔍 Provide steps to reproduce any issues