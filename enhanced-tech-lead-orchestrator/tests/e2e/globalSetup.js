// Global setup for E2E tests - starts Puppeteer browser
import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';

export default async function globalSetup() {
  console.log('🚀 Starting E2E global setup...');

  try {
    // Ensure screenshots directory exists
    await mkdir('tests/e2e/screenshots', { recursive: true });

    // Launch Puppeteer browser
    const browser = await puppeteer.launch({
      headless: process.env.CI ? 'new' : false, // Show browser in local dev, hide in CI
      slowMo: process.env.CI ? 0 : 50, // Slow down actions in local dev for visibility
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: {
        width: 1280,
        height: 720
      }
    });

    // Store browser instance globally
    global.browser = browser;

    // Create a test page to verify browser is working
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>E2E Test Environment Ready</h1>');
    await page.close();

    console.log('✅ E2E global setup complete - Browser launched successfully');

    return () => {
      // This teardown function will be called after all tests
      console.log('🧹 E2E global setup teardown initiated...');
    };

  } catch (error) {
    console.error('❌ E2E global setup failed:', error);
    throw error;
  }
}
