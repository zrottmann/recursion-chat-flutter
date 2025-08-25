/**
 * Example E2E Test using Puppeteer
 * 
 * This demonstrates how to use Puppeteer for end-to-end testing
 * as a replacement for Playwright browser automation.
 */

import puppeteer from 'puppeteer';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('E2E Testing with Puppeteer (Playwright Replacement)', () => {
  let browser;
  let page;

  beforeAll(async () => {
    // Launch browser in headless mode for CI/CD
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1920, height: 1080 });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should load a basic HTML page', async () => {
    // Create a simple HTML page for testing
    const html = `
      <!DOCTYPE html>
      <html>
        <head><title>Test Page</title></head>
        <body>
          <h1 id="title">Trading Post Test</h1>
          <button id="test-btn">Click Me</button>
          <div id="result"></div>
          <script>
            document.getElementById('test-btn').onclick = function() {
              document.getElementById('result').textContent = 'Button clicked!';
            };
          </script>
        </body>
      </html>
    `;
    
    await page.setContent(html);
    
    // Test page content
    const title = await page.$eval('#title', el => el.textContent);
    expect(title).toBe('Trading Post Test');
    
    // Test button interaction
    await page.click('#test-btn');
    const result = await page.$eval('#result', el => el.textContent);
    expect(result).toBe('Button clicked!');
  });

  it('should handle form interactions', async () => {
    const formHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <form id="test-form">
            <input type="text" id="username" placeholder="Username" />
            <input type="email" id="email" placeholder="Email" />
            <button type="submit" id="submit-btn">Submit</button>
          </form>
          <div id="form-result"></div>
          <script>
            document.getElementById('test-form').onsubmit = function(e) {
              e.preventDefault();
              const username = document.getElementById('username').value;
              const email = document.getElementById('email').value;
              document.getElementById('form-result').textContent = 
                'Form submitted: ' + username + ', ' + email;
            };
          </script>
        </body>
      </html>
    `;
    
    await page.setContent(formHtml);
    
    // Fill form fields
    await page.type('#username', 'testuser');
    await page.type('#email', 'test@example.com');
    
    // Submit form
    await page.click('#submit-btn');
    
    // Wait for result
    await page.waitForSelector('#form-result');
    const formResult = await page.$eval('#form-result', el => el.textContent);
    expect(formResult).toBe('Form submitted: testuser, test@example.com');
  });

  it('should handle async operations', async () => {
    const asyncHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <button id="async-btn">Load Data</button>
          <div id="async-result">Loading...</div>
          <script>
            document.getElementById('async-btn').onclick = async function() {
              document.getElementById('async-result').textContent = 'Loading...';
              
              // Simulate async operation
              await new Promise(resolve => setTimeout(resolve, 100));
              
              document.getElementById('async-result').textContent = 'Data loaded successfully';
            };
          </script>
        </body>
      </html>
    `;
    
    await page.setContent(asyncHtml);
    
    // Click button to start async operation
    await page.click('#async-btn');
    
    // Wait for the async operation to complete
    await page.waitForFunction(
      () => document.getElementById('async-result').textContent === 'Data loaded successfully',
      { timeout: 5000 }
    );
    
    const result = await page.$eval('#async-result', el => el.textContent);
    expect(result).toBe('Data loaded successfully');
  });

  it('should take screenshots for debugging', async () => {
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .success { color: green; font-weight: bold; }
            .error { color: red; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Puppeteer Screenshot Test</h1>
          <div class="success">✅ Puppeteer is working as Playwright replacement!</div>
          <div class="error">❌ This is what an error would look like</div>
        </body>
      </html>
    `;
    
    await page.setContent(testHtml);
    
    // Take screenshot (can be useful for debugging)
    const screenshot = await page.screenshot({ fullPage: true });
    expect(screenshot).toBeDefined();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  // Example test that would work with a real Trading Post URL
  it.skip('should test live Trading Post application', async () => {
    // This test is skipped by default but shows how you'd test a live site
    await page.goto('https://tradingpost.appwrite.network');
    
    // Wait for page to load
    await page.waitForSelector('body');
    
    // Check if the page loaded correctly
    const title = await page.title();
    expect(title).toContain('Trading Post');
    
    // Test authentication flow (if needed)
    // await page.click('[data-testid="login-button"]');
    // await page.waitForNavigation();
  });
});

// Utility functions for E2E testing
export const e2eHelpers = {
  /**
   * Wait for element to be visible and clickable
   */
  waitForClickableElement: async (page, selector, timeout = 5000) => {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel);
        return el && !el.disabled && el.offsetParent !== null;
      },
      { timeout },
      selector
    );
  },

  /**
   * Fill form with data
   */
  fillForm: async (page, formData) => {
    for (const [selector, value] of Object.entries(formData)) {
      await page.waitForSelector(selector);
      await page.type(selector, value);
    }
  },

  /**
   * Wait for text to appear in element
   */
  waitForText: async (page, selector, expectedText, timeout = 5000) => {
    await page.waitForFunction(
      (sel, text) => {
        const el = document.querySelector(sel);
        return el && el.textContent.includes(text);
      },
      { timeout },
      selector,
      expectedText
    );
  },

  /**
   * Take screenshot with timestamp
   */
  takeDebugScreenshot: async (page, name = 'debug') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }
};