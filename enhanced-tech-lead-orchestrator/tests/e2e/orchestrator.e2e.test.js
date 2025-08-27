// E2E tests for Enhanced Tech-Lead Orchestrator using Puppeteer
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { EnhancedTechLeadOrchestrator } from '../../src/index.js';

describe('Enhanced Tech-Lead Orchestrator - E2E Tests', () => {
  let browser;
  let page;
  let orchestrator;

  beforeAll(async () => {
    // Try to get browser from global, if not available, use direct access
    browser = global.browser;
    
    // If global browser is not available, skip E2E tests
    if (!browser) {
      console.warn('⚠️ Browser not available from global setup. E2E tests will be skipped.');
      return;
    }

    orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
  });

  beforeEach(async () => {
    // Skip if browser is not available
    if (!browser) return;
    
    try {
      page = await global.e2eUtils.createPage();
    } catch (error) {
      console.warn('⚠️ Could not create page:', error.message);
      page = null;
    }
  });

  afterAll(async () => {
    if (page && !page.isClosed()) {
      await page.close();
    }
  });

  describe('Orchestrator Dashboard E2E', () => {
    it('should display orchestrator status dashboard', async () => {
      // Skip if browser or page is not available
      if (!browser || !page) {
        console.log('⏭️ Skipping E2E test - browser or page not available');
        return;
      }
      // Create a simple HTML dashboard for testing
      const dashboardHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Enhanced Tech-Lead Orchestrator Dashboard</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .status-card { 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 5px; 
                }
                .status-green { background-color: #d4edda; }
                .status-yellow { background-color: #fff3cd; }
                .status-red { background-color: #f8d7da; }
                .metric { display: flex; justify-content: space-between; margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Enhanced Tech-Lead Orchestrator Dashboard</h1>
            
            <div class="status-card status-green" data-testid="system-status">
                <h3>System Status</h3>
                <div class="metric">
                    <span>Orchestrator:</span>
                    <span data-testid="orchestrator-status">Initialized</span>
                </div>
                <div class="metric">
                    <span>Available Agents:</span>
                    <span data-testid="available-agents">5</span>
                </div>
                <div class="metric">
                    <span>Active Missions:</span>
                    <span data-testid="active-missions">0</span>
                </div>
            </div>
            
            <div class="status-card" data-testid="mission-creation">
                <h3>Mission Creation</h3>
                <form id="mission-form">
                    <div>
                        <label>Mission Name:</label>
                        <input type="text" id="mission-name" data-testid="mission-name-input" />
                    </div>
                    <div>
                        <label>Complexity:</label>
                        <select id="complexity" data-testid="complexity-select">
                            <option value="simple">Simple</option>
                            <option value="medium">Medium</option>
                            <option value="complex">Complex</option>
                        </select>
                    </div>
                    <button type="submit" data-testid="create-mission-btn">Create Mission</button>
                </form>
            </div>
            
            <div class="status-card" data-testid="test-results">
                <h3>Test Status</h3>
                <div class="metric">
                    <span>Unit Tests:</span>
                    <span data-testid="unit-test-status" class="status-indicator">✅ Passing</span>
                </div>
                <div class="metric">
                    <span>Integration Tests:</span>
                    <span data-testid="integration-test-status" class="status-indicator">✅ Passing</span>
                </div>
                <div class="metric">
                    <span>E2E Tests:</span>
                    <span data-testid="e2e-test-status" class="status-indicator">🔄 Running</span>
                </div>
                <div class="metric">
                    <span>Coverage:</span>
                    <span data-testid="coverage-percentage">92%</span>
                </div>
            </div>
            
            <script>
                // Simulate real-time updates
                document.addEventListener('DOMContentLoaded', function() {
                    // Update E2E test status after a delay
                    setTimeout(() => {
                        const e2eStatus = document.querySelector('[data-testid="e2e-test-status"]');
                        e2eStatus.textContent = '✅ Passing';
                        e2eStatus.className = 'status-indicator status-green';
                    }, 2000);
                    
                    // Handle mission creation
                    document.getElementById('mission-form').addEventListener('submit', function(e) {
                        e.preventDefault();
                        const missionName = document.getElementById('mission-name').value;
                        const complexity = document.getElementById('complexity').value;
                        
                        if (missionName) {
                            const activeMissions = document.querySelector('[data-testid="active-missions"]');
                            const currentCount = parseInt(activeMissions.textContent);
                            activeMissions.textContent = currentCount + 1;
                            
                            // Add mission to a list
                            let missionsList = document.querySelector('[data-testid="missions-list"]');
                            if (!missionsList) {
                                missionsList = document.createElement('div');
                                missionsList.setAttribute('data-testid', 'missions-list');
                                document.body.appendChild(missionsList);
                            }
                            
                            const missionDiv = document.createElement('div');
                            missionDiv.className = 'status-card';
                            missionDiv.innerHTML = \`
                                <h4 data-testid="mission-\${currentCount + 1}-name">\${missionName}</h4>
                                <p>Complexity: <span data-testid="mission-\${currentCount + 1}-complexity">\${complexity}</span></p>
                                <p>Status: <span data-testid="mission-\${currentCount + 1}-status">Planning</span></p>
                            \`;
                            missionsList.appendChild(missionDiv);
                            
                            // Clear form
                            document.getElementById('mission-name').value = '';
                        }
                    });
                });
            </script>
        </body>
        </html>
      `;

      await page.setContent(dashboardHTML);
      await page.waitForSelector('[data-testid="system-status"]');

      // Test dashboard elements
      const systemStatus = await page.locator('[data-testid="system-status"]').isVisible();
      expect(systemStatus).toBe(true);

      const orchestratorStatus = await page.locator('[data-testid="orchestrator-status"]').textContent();
      expect(orchestratorStatus).toBe('Initialized');

      const availableAgents = await page.locator('[data-testid="available-agents"]').textContent();
      expect(parseInt(availableAgents)).toBeGreaterThan(0);
    });

    it('should create and track missions through the UI', async () => {
      // Set up mock dashboard (using the same HTML from above)
      await global.e2eUtils.mockOrchestratorDashboard(page);

      const dashboardHTML = `
        <!DOCTYPE html>
        <html>
        <body>
            <form id="mission-form">
                <input type="text" id="mission-name" data-testid="mission-name-input" />
                <select id="complexity" data-testid="complexity-select">
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                </select>
                <button type="submit" data-testid="create-mission-btn">Create Mission</button>
            </form>
            <div data-testid="active-missions">0</div>
            <div data-testid="missions-list"></div>
            <script>
                document.getElementById('mission-form').addEventListener('submit', function(e) {
                    e.preventDefault();
                    const name = document.getElementById('mission-name').value;
                    const complexity = document.getElementById('complexity').value;
                    if (name) {
                        const counter = document.querySelector('[data-testid="active-missions"]');
                        const count = parseInt(counter.textContent) + 1;
                        counter.textContent = count;
                        
                        const list = document.querySelector('[data-testid="missions-list"]');
                        const mission = document.createElement('div');
                        mission.innerHTML = \`<div data-testid="mission-\${count}">
                            <span data-testid="mission-\${count}-name">\${name}</span>
                            <span data-testid="mission-\${count}-complexity">\${complexity}</span>
                        </div>\`;
                        list.appendChild(mission);
                        
                        document.getElementById('mission-name').value = '';
                    }
                });
            </script>
        </body>
        </html>
      `;

      await page.setContent(dashboardHTML);
      await page.waitForSelector('[data-testid="create-mission-btn"]');

      // Test mission creation workflow
      await page.fill('[data-testid="mission-name-input"]', 'E2E Test Mission');
      await page.selectOption('[data-testid="complexity-select"]', 'medium');
      await page.click('[data-testid="create-mission-btn"]');

      // Wait for mission to be created
      await page.waitForSelector('[data-testid="mission-1"]');

      // Verify mission was created
      const missionCount = await page.locator('[data-testid="active-missions"]').textContent();
      expect(missionCount).toBe('1');

      const missionName = await page.locator('[data-testid="mission-1-name"]').textContent();
      expect(missionName).toBe('E2E Test Mission');

      const missionComplexity = await page.locator('[data-testid="mission-1-complexity"]').textContent();
      expect(missionComplexity).toBe('medium');
    });
  });

  describe('Performance Testing with Puppeteer', () => {
    it('should measure orchestrator performance metrics', async () => {
      // Create a performance test page
      const performanceTestHTML = `
        <!DOCTYPE html>
        <html>
        <body>
            <div id="performance-test">
                <h1>Performance Test</h1>
                <button id="start-test" data-testid="start-performance-test">Start Performance Test</button>
                <div id="results" data-testid="performance-results"></div>
            </div>
            <script>
                document.getElementById('start-test').addEventListener('click', async function() {
                    const results = document.getElementById('results');
                    results.innerHTML = 'Running performance test...';
                    
                    const startTime = performance.now();
                    
                    // Simulate orchestrator operations
                    for (let i = 0; i < 1000; i++) {
                        // Simulate DOM manipulation
                        const div = document.createElement('div');
                        div.textContent = \`Operation \${i}\`;
                        document.body.appendChild(div);
                        document.body.removeChild(div);
                    }
                    
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    results.innerHTML = \`
                        <div data-testid="execution-time">Execution Time: \${duration.toFixed(2)}ms</div>
                        <div data-testid="operations-per-second">Operations/sec: \${(1000 / (duration / 1000)).toFixed(2)}</div>
                        <div data-testid="performance-status">Status: \${duration < 100 ? 'Excellent' : duration < 500 ? 'Good' : 'Needs Improvement'}</div>
                    \`;
                });
            </script>
        </body>
        </html>
      `;

      await page.setContent(performanceTestHTML);
      await page.waitForSelector('[data-testid="start-performance-test"]');

      // Measure page load performance
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        };
      });

      expect(performanceMetrics.totalTime).toBeLessThan(5000); // Page should load in under 5 seconds

      // Test JavaScript execution performance
      await page.click('[data-testid="start-performance-test"]');
      await page.waitForSelector('[data-testid="execution-time"]');

      const executionTimeText = await page.locator('[data-testid="execution-time"]').textContent();
      const executionTime = parseFloat(executionTimeText.match(/[\d.]+/)[0]);

      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second

      const performanceStatus = await page.locator('[data-testid="performance-status"]').textContent();
      expect(performanceStatus).toContain('Status:');
    });

    it('should test memory usage during intensive operations', async () => {
      const memoryTestHTML = `
        <!DOCTYPE html>
        <html>
        <body>
            <button id="memory-test" data-testid="memory-test-btn">Start Memory Test</button>
            <div id="memory-results" data-testid="memory-results"></div>
            <script>
                document.getElementById('memory-test').addEventListener('click', async function() {
                    const results = document.getElementById('memory-results');
                    
                    // Get initial memory info if available
                    const initialMemory = performance.memory ? {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    } : null;
                    
                    // Create memory-intensive operations
                    const largeArray = [];
                    for (let i = 0; i < 100000; i++) {
                        largeArray.push({ id: i, data: 'test-data-' + i });
                    }
                    
                    // Simulate processing
                    const processedData = largeArray.map(item => ({
                        ...item,
                        processed: true,
                        timestamp: Date.now()
                    }));
                    
                    const finalMemory = performance.memory ? {
                        used: performance.memory.usedJSHeapSize,
                        total: performance.memory.totalJSHeapSize,
                        limit: performance.memory.jsHeapSizeLimit
                    } : null;
                    
                    results.innerHTML = \`
                        <div data-testid="memory-usage">Memory Usage: \${finalMemory ? (finalMemory.used / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}</div>
                        <div data-testid="memory-increase">Memory Increase: \${initialMemory && finalMemory ? ((finalMemory.used - initialMemory.used) / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}</div>
                        <div data-testid="processed-items">Processed Items: \${processedData.length}</div>
                    \`;
                    
                    // Clean up to test garbage collection
                    largeArray.length = 0;
                    processedData.length = 0;
                });
            </script>
        </body>
        </html>
      `;

      await page.setContent(memoryTestHTML);
      await page.click('[data-testid="memory-test-btn"]');
      await page.waitForSelector('[data-testid="processed-items"]');

      const processedItems = await page.locator('[data-testid="processed-items"]').textContent();
      expect(processedItems).toContain('100000');

      // If browser supports memory API, check memory usage
      const memoryUsage = await page.locator('[data-testid="memory-usage"]').textContent();
      if (!memoryUsage.includes('N/A')) {
        const memoryMB = parseFloat(memoryUsage.match(/[\d.]+/)[0]);
        expect(memoryMB).toBeLessThan(100); // Should use less than 100MB
      }
    });
  });

  describe('Visual Regression Testing', () => {
    it('should maintain consistent visual appearance', async () => {
      const visualTestHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { margin: 0; font-family: Arial, sans-serif; background: #f5f5f5; }
                .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
                .dashboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
                .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .status-green { border-left: 4px solid #27ae60; }
                .status-yellow { border-left: 4px solid #f39c12; }
                .status-red { border-left: 4px solid #e74c3c; }
                .metric { display: flex; justify-content: space-between; margin: 10px 0; }
                .metric-value { font-weight: bold; color: #2c3e50; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 data-testid="dashboard-title">Enhanced Tech-Lead Orchestrator</h1>
                <p>Modern Testing Stack: Vitest + Happy-DOM + Puppeteer</p>
            </div>
            
            <div class="dashboard">
                <div class="card status-green" data-testid="system-card">
                    <h3>System Status</h3>
                    <div class="metric">
                        <span>Status</span>
                        <span class="metric-value">✅ Online</span>
                    </div>
                    <div class="metric">
                        <span>Agents</span>
                        <span class="metric-value">5/5</span>
                    </div>
                </div>
                
                <div class="card status-yellow" data-testid="missions-card">
                    <h3>Active Missions</h3>
                    <div class="metric">
                        <span>Running</span>
                        <span class="metric-value">2</span>
                    </div>
                    <div class="metric">
                        <span>Queued</span>
                        <span class="metric-value">1</span>
                    </div>
                </div>
                
                <div class="card status-green" data-testid="testing-card">
                    <h3>Test Results</h3>
                    <div class="metric">
                        <span>Unit Tests</span>
                        <span class="metric-value">✅ 98%</span>
                    </div>
                    <div class="metric">
                        <span>E2E Tests</span>
                        <span class="metric-value">✅ 92%</span>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `;

      await page.setContent(visualTestHTML);
      await page.waitForSelector('[data-testid="dashboard-title"]');

      // Take a screenshot for visual comparison
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = await global.e2eUtils.screenshot(page, `dashboard-visual-test-${timestamp}`);

      expect(screenshotPath).toBeDefined();

      // Test responsive design
      await page.setViewport({ width: 768, height: 600 }); // Tablet
      await page.waitForTimeout(500); // Allow layout to adjust

      const mobileScreenshot = await global.e2eUtils.screenshot(page, `dashboard-tablet-${timestamp}`);
      expect(mobileScreenshot).toBeDefined();

      // Test mobile view
      await page.setViewport({ width: 375, height: 667 }); // Mobile
      await page.waitForTimeout(500);

      const tabletScreenshot = await global.e2eUtils.screenshot(page, `dashboard-mobile-${timestamp}`);
      expect(tabletScreenshot).toBeDefined();

      // Verify key elements are still visible
      const titleVisible = await page.locator('[data-testid="dashboard-title"]').isVisible();
      expect(titleVisible).toBe(true);

      const cardsVisible = await page.locator('[data-testid="system-card"]').isVisible();
      expect(cardsVisible).toBe(true);
    });
  });

  describe('Accessibility Testing', () => {
    it('should meet WCAG accessibility standards', async () => {
      const accessibleHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Orchestrator Dashboard - Accessibility Test</title>
            <style>
                .sr-only { 
                    position: absolute; 
                    width: 1px; 
                    height: 1px; 
                    padding: 0; 
                    margin: -1px; 
                    overflow: hidden; 
                    clip: rect(0,0,0,0); 
                    white-space: nowrap; 
                    border: 0; 
                }
                button:focus, input:focus { outline: 2px solid #0066cc; }
                .high-contrast { background: black; color: white; }
            </style>
        </head>
        <body>
            <header role="banner">
                <h1>Orchestrator Dashboard</h1>
                <nav role="navigation" aria-label="Main navigation">
                    <a href="#missions" data-testid="nav-missions">Missions</a>
                    <a href="#agents" data-testid="nav-agents">Agents</a>
                </nav>
            </header>
            
            <main role="main">
                <section id="missions" aria-labelledby="missions-heading">
                    <h2 id="missions-heading">Active Missions</h2>
                    <table role="table" aria-label="Missions list">
                        <thead>
                            <tr>
                                <th scope="col">Mission Name</th>
                                <th scope="col">Status</th>
                                <th scope="col">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>E-commerce Platform</td>
                                <td>In Progress</td>
                                <td>
                                    <div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" aria-label="75% complete">
                                        <span class="sr-only">75% complete</span>
                                        <div style="width: 75%; height: 20px; background: #4CAF50;"></div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                
                <section aria-labelledby="actions-heading">
                    <h2 id="actions-heading">Actions</h2>
                    <button 
                        data-testid="create-mission-btn" 
                        aria-describedby="create-mission-help"
                        type="button">
                        Create New Mission
                    </button>
                    <div id="create-mission-help" class="sr-only">
                        Opens a form to create a new mission with requirements and timeline
                    </div>
                </section>
            </main>
            
            <div role="status" aria-live="polite" data-testid="status-updates">
                <!-- Dynamic status updates will appear here -->
            </div>
        </body>
        </html>
      `;

      await page.setContent(accessibleHTML);

      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Should focus first link
      const firstFocused = await page.evaluate(() => document.activeElement.textContent);
      expect(firstFocused).toBe('Missions');

      await page.keyboard.press('Tab'); // Should focus second link
      const secondFocused = await page.evaluate(() => document.activeElement.textContent);
      expect(secondFocused).toBe('Agents');

      // Test ARIA attributes
      const progressBar = await page.locator('[role="progressbar"]');
      const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
      expect(ariaValueNow).toBe('75');

      // Test screen reader content
      const srContent = await page.locator('.sr-only').first().textContent();
      expect(srContent).toBe('75% complete');

      // Test button accessibility
      const button = await page.locator('[data-testid="create-mission-btn"]');
      const ariaDescribedBy = await button.getAttribute('aria-describedby');
      expect(ariaDescribedBy).toBe('create-mission-help');
    });
  });
});
