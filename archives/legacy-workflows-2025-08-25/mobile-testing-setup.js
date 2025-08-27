#!/usr/bin/env node

/**
 * Mobile Testing Setup Script
 * 
 * Automated setup for mobile device testing environment.
 * Configures browser settings, device emulation, and testing utilities
 * for comprehensive mobile validation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TESTING_CONFIG = {
  devices: [
    { name: 'iPhone 14 Pro', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15', viewport: { width: 393, height: 852 } },
    { name: 'iPhone 13', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15', viewport: { width: 390, height: 844 } },
    { name: 'Samsung Galaxy S23', userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36', viewport: { width: 360, height: 780 } },
    { name: 'iPad Pro 11', userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15', viewport: { width: 834, height: 1194 } },
    { name: 'Google Pixel 7', userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36', viewport: { width: 412, height: 915 } }
  ],
  networkConditions: [
    { name: 'Fast 3G', downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
    { name: 'Slow 3G', downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
    { name: 'Offline', downloadThroughput: 0, uploadThroughput: 0, latency: 0 }
  ],
  testUrls: [
    'http://localhost:5173',
    'https://chat.recursionsystems.com',
    'https://staging.recursionsystems.com'
  ]
};

class MobileTestingSetup {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testingDir = path.join(this.projectRoot, 'testing');
    this.configDir = path.join(this.testingDir, 'config');
    this.resultsDir = path.join(this.testingDir, 'results');
  }

  // Initialize testing environment
  async initialize() {
    console.log('🔧 Initializing mobile testing environment...');
    
    try {
      await this.createDirectories();
      await this.installDependencies();
      await this.setupBrowserConfigs();
      await this.createTestScripts();
      await this.setupCIConfig();
      
      console.log('✅ Mobile testing environment ready!');
      this.printUsageInstructions();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  // Create required directories
  async createDirectories() {
    console.log('📁 Creating testing directories...');
    
    const dirs = [
      this.testingDir,
      this.configDir,
      this.resultsDir,
      path.join(this.resultsDir, 'lighthouse'),
      path.join(this.resultsDir, 'performance'),
      path.join(this.resultsDir, 'screenshots')
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`  ✓ Created ${dir}`);
      }
    }
  }

  // Install testing dependencies
  async installDependencies() {
    console.log('📦 Installing testing dependencies...');
    
    const dependencies = [
      'lighthouse',
      'puppeteer',
      'playwright',
      'chrome-launcher',
      'axe-core',
      'pa11y'
    ];

    try {
      const packageJson = path.join(this.projectRoot, 'package.json');
      let pkg = {};
      
      if (fs.existsSync(packageJson)) {
        pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
      }

      if (!pkg.devDependencies) pkg.devDependencies = {};

      // Add testing dependencies
      dependencies.forEach(dep => {
        if (!pkg.devDependencies[dep] && !pkg.dependencies?.[dep]) {
          pkg.devDependencies[dep] = 'latest';
        }
      });

      // Add testing scripts
      if (!pkg.scripts) pkg.scripts = {};
      
      Object.assign(pkg.scripts, {
        'test:mobile': 'node scripts/mobile-testing-setup.js run',
        'test:lighthouse': 'node scripts/run-lighthouse-tests.js',
        'test:performance': 'node scripts/run-performance-tests.js',
        'test:accessibility': 'node scripts/run-accessibility-tests.js',
        'test:devices': 'node scripts/run-device-tests.js'
      });

      fs.writeFileSync(packageJson, JSON.stringify(pkg, null, 2));
      console.log('  ✓ Updated package.json');

      // Install dependencies
      console.log('  📥 Installing packages...');
      execSync('npm install', { stdio: 'inherit', cwd: this.projectRoot });
      
    } catch (error) {
      console.warn('⚠️ Could not install dependencies automatically:', error.message);
      console.log('Please run: npm install lighthouse puppeteer playwright chrome-launcher axe-core pa11y --save-dev');
    }
  }

  // Setup browser configurations
  async setupBrowserConfigs() {
    console.log('🌐 Setting up browser configurations...');

    // Chrome DevTools configuration
    const chromeConfig = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1638.4,
          uploadThroughputKbps: 750
        },
        screenEmulation: {
          mobile: true,
          width: 393,
          height: 852,
          deviceScaleFactor: 3,
          disabled: false
        },
        emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
      }
    };

    fs.writeFileSync(
      path.join(this.configDir, 'lighthouse-mobile.json'),
      JSON.stringify(chromeConfig, null, 2)
    );

    // Puppeteer configuration
    const puppeteerConfig = {
      devices: TESTING_CONFIG.devices,
      networkConditions: TESTING_CONFIG.networkConditions,
      testUrls: TESTING_CONFIG.testUrls,
      options: {
        headless: false,
        devtools: true,
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--enable-experimental-web-platform-features',
          '--enable-features=TouchpadAndWheelScrollLatching'
        ]
      }
    };

    fs.writeFileSync(
      path.join(this.configDir, 'puppeteer-config.json'),
      JSON.stringify(puppeteerConfig, null, 2)
    );

    // Playwright configuration
    const playwrightConfig = `
module.exports = {
  testDir: './testing',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 13 Pro'],
        browserName: 'webkit'
      }
    },
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        browserName: 'chromium'
      }
    },
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
        browserName: 'webkit'
      }
    }
  ],

  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI
  }
};`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'playwright.config.js'),
      playwrightConfig
    );

    console.log('  ✓ Browser configurations created');
  }

  // Create test scripts
  async createTestScripts() {
    console.log('📝 Creating test scripts...');

    // Lighthouse test runner
    const lighthouseRunner = `
#!/usr/bin/env node
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const config = require('./config/lighthouse-mobile.json');
const testUrls = ${JSON.stringify(TESTING_CONFIG.testUrls)};

async function runLighthouseTests() {
  console.log('🔍 Running Lighthouse mobile tests...');
  
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  
  for (const url of testUrls) {
    console.log(\`Testing: \${url}\`);
    
    try {
      const runnerResult = await lighthouse(url, {
        port: chrome.port,
        output: 'html',
        logLevel: 'info'
      }, config);

      const reportHtml = runnerResult.report;
      const reportPath = path.join('./testing/results/lighthouse', \`report-\${Date.now()}.html\`);
      
      fs.writeFileSync(reportPath, reportHtml);
      console.log(\`  ✓ Report saved: \${reportPath}\`);
      
      // Log key metrics
      const { lhr } = runnerResult;
      console.log(\`  Performance: \${Math.round(lhr.categories.performance.score * 100)}\`);
      console.log(\`  PWA: \${Math.round(lhr.categories.pwa.score * 100)}\`);
      console.log(\`  Accessibility: \${Math.round(lhr.categories.accessibility.score * 100)}\`);
      
    } catch (error) {
      console.error(\`❌ Test failed for \${url}:\`, error.message);
    }
  }
  
  await chrome.kill();
  console.log('✅ Lighthouse tests complete!');
}

runLighthouseTests().catch(console.error);`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'run-lighthouse-tests.js'),
      lighthouseRunner
    );

    // Device test runner
    const deviceTestRunner = `
#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const config = require('./testing/config/puppeteer-config.json');

async function runDeviceTests() {
  console.log('📱 Running device-specific tests...');
  
  const browser = await puppeteer.launch(config.options);
  
  for (const device of config.devices) {
    console.log(\`Testing device: \${device.name}\`);
    
    const page = await browser.newPage();
    await page.setUserAgent(device.userAgent);
    await page.setViewport(device.viewport);
    
    for (const url of config.testUrls) {
      try {
        console.log(\`  Testing URL: \${url}\`);
        
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // Take screenshot
        const screenshotPath = path.join(
          './testing/results/screenshots',
          \`\${device.name.replace(' ', '-')}-\${Date.now()}.png\`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Test touch events
        const touchSupported = await page.evaluate(() => 'ontouchstart' in window);
        console.log(\`    Touch support: \${touchSupported}\`);
        
        // Test PWA readiness  
        const pwaReady = await page.evaluate(() => {
          return 'serviceWorker' in navigator && 'PushManager' in window;
        });
        console.log(\`    PWA ready: \${pwaReady}\`);
        
        // Test performance
        const metrics = await page.metrics();
        console.log(\`    JS Heap: \${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB\`);
        
      } catch (error) {
        console.error(\`❌ Test failed for \${url}:\`, error.message);
      }
    }
    
    await page.close();
  }
  
  await browser.close();
  console.log('✅ Device tests complete!');
}

runDeviceTests().catch(console.error);`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'run-device-tests.js'),
      deviceTestRunner
    );

    // Performance test runner
    const performanceRunner = `
#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runPerformanceTests() {
  console.log('⚡ Running performance tests...');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Enable performance monitoring
  await page.setCacheEnabled(false);
  
  const testUrls = ['http://localhost:5173', 'https://chat.recursionsystems.com'];
  const results = [];
  
  for (const url of testUrls) {
    console.log(\`Testing: \${url}\`);
    
    // Start tracing
    await page.tracing.start({ path: \`./testing/results/performance/trace-\${Date.now()}.json\` });
    
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2' });
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    const metrics = await page.metrics();
    
    const result = {
      url,
      loadTime,
      metrics: performanceMetrics,
      memory: {
        jsHeapUsedSize: metrics.JSHeapUsedSize,
        jsHeapTotalSize: metrics.JSHeapTotalSize
      }
    };
    
    results.push(result);
    console.log(\`  Load time: \${loadTime}ms\`);
    console.log(\`  DOM content loaded: \${performanceMetrics.domContentLoaded}ms\`);
    console.log(\`  First contentful paint: \${performanceMetrics.firstContentfulPaint}ms\`);
    
    await page.tracing.stop();
  }
  
  // Save results
  fs.writeFileSync(
    path.join('./testing/results/performance', \`results-\${Date.now()}.json\`),
    JSON.stringify(results, null, 2)
  );
  
  await browser.close();
  console.log('✅ Performance tests complete!');
}

runPerformanceTests().catch(console.error);`;

    fs.writeFileSync(
      path.join(this.projectRoot, 'scripts', 'run-performance-tests.js'),
      performanceRunner
    );

    // Make scripts executable
    try {
      execSync('chmod +x scripts/*.js', { cwd: this.projectRoot });
    } catch (error) {
      // Windows doesn't need chmod
    }

    console.log('  ✓ Test scripts created');
  }

  // Setup CI configuration
  async setupCIConfig() {
    console.log('🔄 Setting up CI configuration...');

    const ciConfig = `
name: Mobile Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  mobile-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build app
      run: npm run build
    
    - name: Install Playwright
      run: npx playwright install
    
    - name: Run Lighthouse tests
      run: npm run test:lighthouse
    
    - name: Run device tests
      run: npm run test:devices
    
    - name: Run performance tests  
      run: npm run test:performance
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: mobile-test-results
        path: testing/results/
`;

    const githubDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(githubDir, 'mobile-testing.yml'),
      ciConfig
    );

    console.log('  ✓ CI configuration created');
  }

  // Print usage instructions
  printUsageInstructions() {
    console.log('\n🎉 Mobile Testing Setup Complete!\n');
    
    console.log('📋 Available Commands:');
    console.log('  npm run test:mobile      - Run full mobile test suite');
    console.log('  npm run test:lighthouse  - Run Lighthouse performance tests'); 
    console.log('  npm run test:devices     - Run device-specific tests');
    console.log('  npm run test:performance - Run performance benchmarks');
    console.log('  npm run test:accessibility - Run accessibility tests\n');
    
    console.log('📁 Directory Structure:');
    console.log('  testing/');
    console.log('  ├── config/           - Testing configurations');
    console.log('  ├── results/          - Test results and reports');
    console.log('  │   ├── lighthouse/   - Lighthouse HTML reports');
    console.log('  │   ├── performance/  - Performance metrics'); 
    console.log('  │   └── screenshots/  - Device screenshots');
    console.log('  └── mobile-device-testing-guide.md\n');
    
    console.log('🔧 Manual Testing:');
    console.log('  1. Start dev server: npm run dev');
    console.log('  2. Open Chrome DevTools');
    console.log('  3. Enable device simulation');
    console.log('  4. Use MobileTestPanel component\n');
    
    console.log('📱 Browser Testing URLs:');
    TESTING_CONFIG.testUrls.forEach(url => {
      console.log(`  ${url}`);
    });
    
    console.log('\n✅ Ready to test mobile functionality!');
  }

  // Run existing tests
  async runTests() {
    console.log('🧪 Running mobile test suite...');
    
    try {
      console.log('Running Lighthouse tests...');
      execSync('npm run test:lighthouse', { stdio: 'inherit' });
      
      console.log('Running device tests...');
      execSync('npm run test:devices', { stdio: 'inherit' });
      
      console.log('Running performance tests...');
      execSync('npm run test:performance', { stdio: 'inherit' });
      
      console.log('✅ All mobile tests completed!');
      
    } catch (error) {
      console.error('❌ Some tests failed:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const setup = new MobileTestingSetup();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
      await setup.runTests();
      break;
    case 'init':
    default:
      await setup.initialize();
      break;
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = MobileTestingSetup;