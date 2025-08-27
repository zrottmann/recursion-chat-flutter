// E2E specific setup for Puppeteer integration
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

beforeAll(async () => {
  // Wait a bit for global setup to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!global.browser) {
    throw new Error('Browser not available from global setup. E2E setup may have failed.');
  }
  
  console.log('E2E test setup: Browser available from global setup');
});

beforeEach(async () => {
  // Ensure browser is still available for each test
  if (!global.browser) {
    throw new Error('Browser not available. E2E global setup may have failed.');
  }
});

afterEach(async () => {
  // Clean up any pages created during the test
  if (global.browser) {
    const pages = await global.browser.pages();
    // Close all pages except the default one (index 0)
    for (let i = 1; i < pages.length; i++) {
      await pages[i].close();
    }
  }
});

afterAll(async () => {
  // Cleanup is handled by globalTeardown.js
  console.log('E2E test teardown: Browser cleanup will be handled by global teardown');
});

// E2E specific utilities
global.e2eUtils = {
  // Create a new page for testing
  async createPage() {
    if (global.browser) {
      const page = await global.browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      return page;
    }
    throw new Error('Browser not available. Make sure E2E global setup is running.');
  },

  // Wait for network idle (Puppeteer version)
  async waitForNetworkIdle(page, timeout = 5000) {
    await page.waitForLoadState ? 
      page.waitForLoadState('networkidle', { timeout }) :
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout });
  },

  // Screenshot utility for debugging
  async screenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `tests/e2e/screenshots/${name}-${timestamp}.png`;
    
    // Ensure screenshots directory exists
    const fs = await import('fs');
    const fsPromises = fs.promises;
    try {
      await fsPromises.mkdir('tests/e2e/screenshots', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    await page.screenshot({ path: filename, fullPage: true });
    return filename;
  },

  // Mock orchestrator dashboard
  async mockOrchestratorDashboard(page) {
    await page.route('**/api/missions', route => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          global.testUtils.mockMission('medium'),
          global.testUtils.mockMission('simple')
        ])
      });
    });

    await page.route('**/api/agents', route => {
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          global.testUtils.mockAgent('backend-architect', ['architecture', 'backend']),
          global.testUtils.mockAgent('security-auditor', ['security', 'audit']),
          global.testUtils.mockAgent('react-expert', ['frontend', 'react'])
        ])
      });
    });
  }
};
