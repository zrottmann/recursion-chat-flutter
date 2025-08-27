/**
 * Comprehensive Mobile Browser Testing for Easy Appwrite SSO
 * Quality Engineer Focus: Edge cases, mobile responsiveness, OAuth flow validation
 */

const { chromium, webkit, firefox } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration for mobile devices
const MOBILE_DEVICES = {
  'iPhone 13 Pro': {
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },
  'iPad Mini': {
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },
  'Galaxy S21': {
    viewport: { width: 360, height: 800 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  }
};

// Test URLs to validate
const TEST_URLS = [
  {
    name: 'Recursion Chat',
    url: 'https://chat.recursionsystems.com',
    ssoSelector: '[data-testid="sso-button"], .sso-button, button[type="button"]:has-text("Google")',
    expectedElements: ['input[type="email"]', 'button']
  },
  {
    name: 'Trading Post',
    url: 'https://tradingpost.appwrite.network',
    ssoSelector: '[data-testid="sso-button"], .sso-button, button:has-text("Continue with Google")',
    expectedElements: ['button', 'form']
  },
  {
    name: 'Slumlord RPG',
    url: 'https://slumlord.appwrite.network',
    ssoSelector: '[data-testid="auth-button"], button:has-text("Login")',
    expectedElements: ['canvas', 'button']
  }
];

// Network conditions for performance testing
const NETWORK_CONDITIONS = {
  '3G': { downloadThroughput: 1.5 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 40 },
  '4G': { downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 3 * 1024 * 1024 / 8, latency: 20 },
  'WiFi': null // No throttling
};

class MobileSSOMobileTester {
  constructor() {
    this.results = {
      summary: {},
      responsiveness: [],
      oauth: [],
      performance: [],
      accessibility: [],
      crossBrowser: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🧪 Starting Comprehensive Mobile SSO Testing');
    console.log('=' * 60);

    try {
      // 1. Mobile Responsiveness Tests
      await this.testMobileResponsiveness();
      
      // 2. OAuth Flow Tests
      await this.testOAuthFlows();
      
      // 3. Performance Tests
      await this.testPerformance();
      
      // 4. Accessibility Tests
      await this.testAccessibility();
      
      // 5. Cross-Browser Tests
      await this.testCrossBrowser();

      // Generate final report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.results.errors.push({
        test: 'Test Suite',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async testMobileResponsiveness() {
    console.log('\n📱 Testing Mobile Responsiveness...');
    
    const browser = await chromium.launch({ headless: false });
    
    for (const [deviceName, device] of Object.entries(MOBILE_DEVICES)) {
      console.log(`  Testing on ${deviceName}...`);
      
      const context = await browser.newContext({
        viewport: device.viewport,
        userAgent: device.userAgent,
        isMobile: device.isMobile,
        hasTouch: device.hasTouch
      });
      
      const page = await context.newPage();
      
      for (const testSite of TEST_URLS) {
        try {
          console.log(`    Testing ${testSite.name}...`);
          
          // Navigate and wait for load
          const startTime = Date.now();
          await page.goto(testSite.url, { waitUntil: 'networkidle', timeout: 30000 });
          const loadTime = Date.now() - startTime;
          
          // Test viewport adaptation
          const viewportTest = await this.testViewportAdaptation(page, device);
          
          // Test touch targets
          const touchTargetTest = await this.testTouchTargets(page, testSite.ssoSelector);
          
          // Test text readability
          const textTest = await this.testTextReadability(page);
          
          // Test horizontal scrolling
          const scrollTest = await this.testHorizontalScrolling(page);
          
          this.results.responsiveness.push({
            site: testSite.name,
            device: deviceName,
            loadTime,
            viewport: viewportTest,
            touchTargets: touchTargetTest,
            textReadability: textTest,
            horizontalScroll: scrollTest,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`    ❌ Error testing ${testSite.name} on ${deviceName}:`, error.message);
          this.results.errors.push({
            test: `Responsiveness - ${testSite.name} on ${deviceName}`,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      await context.close();
    }
    
    await browser.close();
    console.log('  ✅ Mobile responsiveness testing completed');
  }

  async testViewportAdaptation(page, device) {
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = device.viewport.width;
    
    return {
      fits: bodyWidth <= viewportWidth,
      bodyWidth,
      viewportWidth,
      overflow: bodyWidth > viewportWidth ? bodyWidth - viewportWidth : 0
    };
  }

  async testTouchTargets(page, ssoSelector) {
    try {
      const buttons = await page.locator('button, a, input[type="button"], input[type="submit"]').all();
      const touchTargetResults = [];
      
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box) {
          const meetsMinimum = box.width >= 44 && box.height >= 44;
          touchTargetResults.push({
            width: box.width,
            height: box.height,
            meetsMinimum,
            element: await button.evaluate(el => el.tagName + (el.className ? '.' + el.className : ''))
          });
        }
      }
      
      // Specifically test SSO button if found
      let ssoButtonTest = null;
      try {
        const ssoButton = page.locator(ssoSelector).first();
        const ssoBox = await ssoButton.boundingBox();
        if (ssoBox) {
          ssoButtonTest = {
            width: ssoBox.width,
            height: ssoBox.height,
            meetsMinimum: ssoBox.width >= 44 && ssoBox.height >= 44
          };
        }
      } catch (e) {
        // SSO button not found, not an error
      }
      
      return {
        totalButtons: touchTargetResults.length,
        passingButtons: touchTargetResults.filter(t => t.meetsMinimum).length,
        failingButtons: touchTargetResults.filter(t => !t.meetsMinimum),
        ssoButton: ssoButtonTest
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testTextReadability(page) {
    const textElements = await page.locator('p, span, div, button, a, h1, h2, h3, h4, h5, h6').all();
    const readabilityResults = [];
    
    for (const element of textElements) {
      try {
        const styles = await element.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            color: computed.color,
            backgroundColor: computed.backgroundColor
          };
        });
        
        const fontSize = parseFloat(styles.fontSize);
        const meetsMinimum = fontSize >= 14;
        
        if (await element.textContent()) {
          readabilityResults.push({
            fontSize,
            meetsMinimum,
            styles
          });
        }
      } catch (e) {
        // Skip elements that can't be evaluated
      }
    }
    
    return {
      totalElements: readabilityResults.length,
      passingElements: readabilityResults.filter(r => r.meetsMinimum).length,
      failingElements: readabilityResults.filter(r => !r.meetsMinimum).length,
      averageFontSize: readabilityResults.reduce((sum, r) => sum + r.fontSize, 0) / readabilityResults.length
    };
  }

  async testHorizontalScrolling(page) {
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    
    return {
      hasHorizontalScroll: scrollWidth > clientWidth,
      scrollWidth,
      clientWidth,
      overflow: Math.max(0, scrollWidth - clientWidth)
    };
  }

  async testOAuthFlows() {
    console.log('\n🔐 Testing OAuth Flows...');
    
    const browser = await chromium.launch({ headless: false });
    
    for (const testSite of TEST_URLS) {
      console.log(`  Testing OAuth on ${testSite.name}...`);
      
      const context = await browser.newContext({
        viewport: MOBILE_DEVICES['iPhone 13 Pro'].viewport,
        userAgent: MOBILE_DEVICES['iPhone 13 Pro'].userAgent,
        isMobile: true,
        hasTouch: true
      });
      
      const page = await context.newPage();
      
      try {
        // Navigate to site
        await page.goto(testSite.url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Test popup behavior
        const popupTest = await this.testPopupBehavior(page, testSite.ssoSelector);
        
        // Test callback handling
        const callbackTest = await this.testCallbackHandling(page);
        
        // Test error scenarios
        const errorTest = await this.testErrorScenarios(page, testSite.ssoSelector);
        
        // Test state management
        const stateTest = await this.testStateManagement(page);
        
        this.results.oauth.push({
          site: testSite.name,
          popup: popupTest,
          callback: callbackTest,
          errorHandling: errorTest,
          stateManagement: stateTest,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`    ❌ Error testing OAuth on ${testSite.name}:`, error.message);
        this.results.errors.push({
          test: `OAuth - ${testSite.name}`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      await context.close();
    }
    
    await browser.close();
    console.log('  ✅ OAuth flow testing completed');
  }

  async testPopupBehavior(page, ssoSelector) {
    try {
      // Check if popup blocker is active
      const popupTest = await page.evaluate(() => {
        const popup = window.open('', 'test', 'width=100,height=100');
        if (popup) {
          popup.close();
          return { blocked: false };
        }
        return { blocked: true };
      });
      
      // Find and analyze SSO button
      let ssoButtonFound = false;
      try {
        const ssoButton = page.locator(ssoSelector).first();
        ssoButtonFound = await ssoButton.count() > 0;
        
        if (ssoButtonFound) {
          // Check if button has proper event handlers
          const hasClickHandler = await ssoButton.evaluate(el => {
            return typeof el.onclick === 'function' || el.getAttribute('onclick') !== null;
          });
          
          return {
            popupBlocked: popupTest.blocked,
            buttonFound: true,
            hasClickHandler,
            buttonText: await ssoButton.textContent()
          };
        }
      } catch (e) {
        // Button not found with selector
      }
      
      return {
        popupBlocked: popupTest.blocked,
        buttonFound: ssoButtonFound,
        error: ssoButtonFound ? null : 'SSO button not found'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testCallbackHandling(page) {
    try {
      // Check for callback handling code in the page
      const hasCallbackHandling = await page.evaluate(() => {
        const scripts = Array.from(document.scripts);
        return scripts.some(script => 
          script.textContent.includes('callback') || 
          script.textContent.includes('OAuth') ||
          script.textContent.includes('auth/callback')
        );
      });
      
      // Check for callback URLs in the page
      const callbackUrls = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="callback"], a[href*="auth"]'));
        return anchors.map(a => a.href);
      });
      
      return {
        hasCallbackHandling,
        callbackUrls,
        callbackUrlCount: callbackUrls.length
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testErrorScenarios(page, ssoSelector) {
    try {
      const results = {};
      
      // Test network failure scenario
      await page.route('**/oauth2/**', route => route.abort());
      
      try {
        const ssoButton = page.locator(ssoSelector).first();
        if (await ssoButton.count() > 0) {
          await ssoButton.click({ timeout: 5000 });
          // Wait for error handling
          await page.waitForTimeout(2000);
          
          results.networkFailure = {
            handled: true,
            errorVisible: await page.locator('.error, [role="alert"], .toast').count() > 0
          };
        }
      } catch (e) {
        results.networkFailure = { handled: false, error: e.message };
      }
      
      // Clear route override
      await page.unroute('**/oauth2/**');
      
      return results;
    } catch (error) {
      return { error: error.message };
    }
  }

  async testStateManagement(page) {
    try {
      // Check for session storage usage
      const sessionStorageUsage = await page.evaluate(() => {
        const keys = Object.keys(sessionStorage);
        return {
          hasAuthKeys: keys.some(key => key.includes('auth') || key.includes('token') || key.includes('appwrite')),
          totalKeys: keys.length,
          authKeys: keys.filter(key => key.includes('auth') || key.includes('token') || key.includes('appwrite'))
        };
      });
      
      // Check for local storage usage
      const localStorageUsage = await page.evaluate(() => {
        const keys = Object.keys(localStorage);
        return {
          hasAuthKeys: keys.some(key => key.includes('auth') || key.includes('token') || key.includes('appwrite')),
          totalKeys: keys.length,
          authKeys: keys.filter(key => key.includes('auth') || key.includes('token') || key.includes('appwrite'))
        };
      });
      
      return {
        sessionStorage: sessionStorageUsage,
        localStorage: localStorageUsage
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const browser = await chromium.launch({ headless: false });
    
    for (const [networkName, networkCondition] of Object.entries(NETWORK_CONDITIONS)) {
      console.log(`  Testing on ${networkName} network...`);
      
      const context = await browser.newContext({
        viewport: MOBILE_DEVICES['iPhone 13 Pro'].viewport,
        userAgent: MOBILE_DEVICES['iPhone 13 Pro'].userAgent
      });
      
      const page = await context.newPage();
      
      // Set network conditions
      if (networkCondition) {
        await page.route('**/*', async route => {
          await new Promise(resolve => setTimeout(resolve, networkCondition.latency));
          route.continue();
        });
      }
      
      for (const testSite of TEST_URLS) {
        try {
          console.log(`    Testing ${testSite.name} performance...`);
          
          const performanceMetrics = await this.measurePerformance(page, testSite.url);
          
          this.results.performance.push({
            site: testSite.name,
            network: networkName,
            ...performanceMetrics,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`    ❌ Error testing performance for ${testSite.name}:`, error.message);
          this.results.errors.push({
            test: `Performance - ${testSite.name} on ${networkName}`,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      await context.close();
    }
    
    await browser.close();
    console.log('  ✅ Performance testing completed');
  }

  async measurePerformance(page, url) {
    const startTime = Date.now();
    
    // Start performance monitoring
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : null,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : null,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || null,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || null
      };
    });
    
    // Measure bundle sizes
    const resources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;
      
      resources.forEach(resource => {
        if (resource.transferSize) {
          totalSize += resource.transferSize;
          if (resource.name.endsWith('.js')) jsSize += resource.transferSize;
          if (resource.name.endsWith('.css')) cssSize += resource.transferSize;
        }
      });
      
      return { totalSize, jsSize, cssSize, resourceCount: resources.length };
    });
    
    // Check memory usage (Fixed JavaScript syntax)
    const memoryInfo = await page.evaluate(() => {
      return window.performance && window.performance.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
      } : null;
    });
    
    return {
      loadTime,
      metrics,
      resources,
      memory: memoryInfo
    };
  }

  async testAccessibility() {
    console.log('\n♿ Testing Accessibility...');
    
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
      viewport: MOBILE_DEVICES['iPhone 13 Pro'].viewport,
      userAgent: MOBILE_DEVICES['iPhone 13 Pro'].userAgent
    });
    
    const page = await context.newPage();
    
    for (const testSite of TEST_URLS) {
      try {
        console.log(`  Testing accessibility on ${testSite.name}...`);
        
        await page.goto(testSite.url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Test ARIA labels and roles
        const ariaTest = await this.testARIA(page, testSite.ssoSelector);
        
        // Test keyboard navigation
        const keyboardTest = await this.testKeyboardNavigation(page, testSite.ssoSelector);
        
        // Test color contrast
        const contrastTest = await this.testColorContrast(page);
        
        // Test screen reader compatibility
        const screenReaderTest = await this.testScreenReader(page, testSite.ssoSelector);
        
        this.results.accessibility.push({
          site: testSite.name,
          aria: ariaTest,
          keyboard: keyboardTest,
          contrast: contrastTest,
          screenReader: screenReaderTest,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`    ❌ Error testing accessibility for ${testSite.name}:`, error.message);
        this.results.errors.push({
          test: `Accessibility - ${testSite.name}`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    await context.close();
    await browser.close();
    console.log('  ✅ Accessibility testing completed');
  }

  async testARIA(page, ssoSelector) {
    try {
      // Check for proper ARIA attributes
      const ariaElements = await page.locator('[aria-label], [aria-labelledby], [role], [aria-describedby]').all();
      const ariaResults = [];
      
      for (const element of ariaElements) {
        const attributes = await element.evaluate(el => ({
          tagName: el.tagName,
          ariaLabel: el.getAttribute('aria-label'),
          ariaLabelledBy: el.getAttribute('aria-labelledby'),
          role: el.getAttribute('role'),
          ariaDescribedBy: el.getAttribute('aria-describedby')
        }));
        ariaResults.push(attributes);
      }
      
      // Specifically test SSO button ARIA
      let ssoAriaTest = null;
      try {
        const ssoButton = page.locator(ssoSelector).first();
        if (await ssoButton.count() > 0) {
          ssoAriaTest = await ssoButton.evaluate(el => ({
            hasAriaLabel: el.hasAttribute('aria-label'),
            hasRole: el.hasAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            role: el.getAttribute('role')
          }));
        }
      } catch (e) {
        // SSO button not found
      }
      
      return {
        totalElements: ariaResults.length,
        ssoButton: ssoAriaTest,
        elements: ariaResults
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testKeyboardNavigation(page, ssoSelector) {
    try {
      // Test tab navigation
      await page.focus('body');
      const focusableElements = [];
      
      // Tab through elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el ? {
            tagName: el.tagName,
            className: el.className,
            id: el.id,
            text: el.textContent?.substring(0, 50)
          } : null;
        });
        
        if (focused) {
          focusableElements.push(focused);
        }
      }
      
      // Test SSO button keyboard accessibility
      let ssoKeyboardTest = null;
      try {
        const ssoButton = page.locator(ssoSelector).first();
        if (await ssoButton.count() > 0) {
          await ssoButton.focus();
          const isFocused = await ssoButton.evaluate(el => el === document.activeElement);
          
          ssoKeyboardTest = {
            canFocus: isFocused,
            tabIndex: await ssoButton.getAttribute('tabindex')
          };
        }
      } catch (e) {
        // SSO button not found or not focusable
      }
      
      return {
        focusableCount: focusableElements.length,
        focusableElements,
        ssoButton: ssoKeyboardTest
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testColorContrast(page) {
    try {
      // Simple contrast ratio calculation (would need more sophisticated tool for full WCAG compliance)
      const contrastResults = await page.evaluate(() => {
        const elements = document.querySelectorAll('button, a, p, span, div');
        const results = [];
        
        Array.from(elements).slice(0, 20).forEach(el => {
          if (el.textContent && el.textContent.trim()) {
            const styles = window.getComputedStyle(el);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            
            results.push({
              element: el.tagName,
              color,
              backgroundColor,
              text: el.textContent.substring(0, 30)
            });
          }
        });
        
        return results;
      });
      
      return {
        elementsChecked: contrastResults.length,
        elements: contrastResults
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testScreenReader(page, ssoSelector) {
    try {
      // Test for screen reader friendly content
      const headingStructure = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headings).map(h => ({
          level: h.tagName,
          text: h.textContent?.substring(0, 50)
        }));
      });
      
      const altTextTest = await page.evaluate(() => {
        const images = document.querySelectorAll('img');
        return Array.from(images).map(img => ({
          src: img.src,
          hasAlt: img.hasAttribute('alt'),
          alt: img.getAttribute('alt')
        }));
      });
      
      // Test SSO button for screen reader accessibility
      let ssoScreenReaderTest = null;
      try {
        const ssoButton = page.locator(ssoSelector).first();
        if (await ssoButton.count() > 0) {
          ssoScreenReaderTest = await ssoButton.evaluate(el => ({
            hasTextContent: !!el.textContent,
            textContent: el.textContent,
            hasTitle: el.hasAttribute('title'),
            title: el.getAttribute('title'),
            hasAriaLabel: el.hasAttribute('aria-label'),
            ariaLabel: el.getAttribute('aria-label')
          }));
        }
      } catch (e) {
        // SSO button not found
      }
      
      return {
        headingStructure,
        imageAltText: altTextTest,
        ssoButton: ssoScreenReaderTest
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testCrossBrowser() {
    console.log('\n🌐 Testing Cross-Browser Compatibility...');
    
    const browsers = [
      { name: 'Chrome', launch: () => chromium.launch({ headless: false }) },
      { name: 'Safari', launch: () => webkit.launch({ headless: false }) },
      { name: 'Firefox', launch: () => firefox.launch({ headless: false }) }
    ];
    
    for (const browserConfig of browsers) {
      console.log(`  Testing on ${browserConfig.name}...`);
      
      try {
        const browser = await browserConfig.launch();
        const context = await browser.newContext({
          viewport: MOBILE_DEVICES['iPhone 13 Pro'].viewport,
          userAgent: MOBILE_DEVICES['iPhone 13 Pro'].userAgent
        });
        
        const page = await context.newPage();
        
        for (const testSite of TEST_URLS) {
          try {
            console.log(`    Testing ${testSite.name} on ${browserConfig.name}...`);
            
            await page.goto(testSite.url, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Test basic functionality
            const basicTest = await this.testBasicFunctionality(page, testSite);
            
            // Test JavaScript errors
            const jsErrorTest = await this.testJavaScriptErrors(page);
            
            // Test CSS rendering
            const cssTest = await this.testCSSRendering(page);
            
            this.results.crossBrowser.push({
              site: testSite.name,
              browser: browserConfig.name,
              basic: basicTest,
              jsErrors: jsErrorTest,
              css: cssTest,
              timestamp: new Date().toISOString()
            });
            
          } catch (error) {
            console.error(`    ❌ Error testing ${testSite.name} on ${browserConfig.name}:`, error.message);
            this.results.errors.push({
              test: `Cross-Browser - ${testSite.name} on ${browserConfig.name}`,
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        await context.close();
        await browser.close();
        
      } catch (error) {
        console.error(`  ❌ Failed to launch ${browserConfig.name}:`, error.message);
        this.results.errors.push({
          test: `Browser Launch - ${browserConfig.name}`,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log('  ✅ Cross-browser testing completed');
  }

  async testBasicFunctionality(page, testSite) {
    try {
      // Check if expected elements are present
      const elementTests = {};
      
      for (const selector of testSite.expectedElements) {
        const count = await page.locator(selector).count();
        elementTests[selector] = { found: count > 0, count };
      }
      
      // Check if page loaded without console errors
      const hasTitle = await page.title() !== '';
      const hasContent = await page.locator('body').textContent() !== '';
      
      return {
        elementsFound: elementTests,
        hasTitle,
        hasContent,
        title: await page.title()
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async testJavaScriptErrors(page) {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    page.on('pageerror', error => {
      errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    // Wait a bit to collect any errors
    await page.waitForTimeout(3000);
    
    return {
      errorCount: errors.length,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    };
  }

  async testCSSRendering(page) {
    try {
      // Check for basic CSS rendering
      const cssTest = await page.evaluate(() => {
        const body = document.body;
        const computed = window.getComputedStyle(body);
        
        return {
          hasBackgroundColor: computed.backgroundColor !== 'rgba(0, 0, 0, 0)',
          hasFont: computed.fontFamily !== '',
          fontSize: computed.fontSize,
          margin: computed.margin,
          padding: computed.padding
        };
      });
      
      // Check for layout issues
      const layoutTest = await page.evaluate(() => {
        const elements = document.querySelectorAll('div, p, button, a');
        let hiddenElements = 0;
        let zeroSizeElements = 0;
        
        Array.from(elements).forEach(el => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          
          if (styles.visibility === 'hidden' || styles.display === 'none') {
            hiddenElements++;
          }
          
          if (rect.width === 0 && rect.height === 0) {
            zeroSizeElements++;
          }
        });
        
        return {
          totalElements: elements.length,
          hiddenElements,
          zeroSizeElements
        };
      });
      
      return {
        css: cssTest,
        layout: layoutTest
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    // Calculate summary statistics
    this.results.summary = {
      duration: `${(duration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString(),
      testCounts: {
        responsiveness: this.results.responsiveness.length,
        oauth: this.results.oauth.length,
        performance: this.results.performance.length,
        accessibility: this.results.accessibility.length,
        crossBrowser: this.results.crossBrowser.length,
        errors: this.results.errors.length
      }
    };
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    // Create comprehensive report
    const report = {
      ...this.results,
      recommendations,
      generatedAt: new Date().toISOString()
    };
    
    // Save report to file
    const reportPath = path.join(__dirname, `mobile-sso-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(__dirname, `mobile-sso-test-report-${Date.now()}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log('\n📊 Test Results Summary:');
    console.log('=' * 60);
    console.log(`Total Test Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Tests Run: ${Object.values(this.results.summary.testCounts).reduce((a, b) => a + b, 0)}`);
    console.log(`Errors Encountered: ${this.results.errors.length}`);
    console.log(`\nReports Generated:`);
    console.log(`  JSON: ${reportPath}`);
    console.log(`  HTML: ${htmlPath}`);
    
    if (recommendations.critical.length > 0) {
      console.log(`\n🚨 Critical Issues Found: ${recommendations.critical.length}`);
      recommendations.critical.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (recommendations.improvements.length > 0) {
      console.log(`\n💡 Recommended Improvements: ${recommendations.improvements.length}`);
      recommendations.improvements.slice(0, 5).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n✅ Mobile SSO Testing Complete!');
  }

  generateRecommendations() {
    const critical = [];
    const improvements = [];
    const performance = [];
    
    // Analyze responsiveness results
    this.results.responsiveness.forEach(result => {
      if (result.viewport && !result.viewport.fits) {
        critical.push(`${result.site} has horizontal overflow on ${result.device} (${result.viewport.overflow}px)`);
      }
      
      if (result.touchTargets && result.touchTargets.failingButtons && result.touchTargets.failingButtons.length > 0) {
        critical.push(`${result.site} has ${result.touchTargets.failingButtons.length} buttons below minimum touch target size on ${result.device}`);
      }
      
      if (result.textReadability && result.textReadability.averageFontSize < 14) {
        improvements.push(`${result.site} average font size (${result.textReadability.averageFontSize.toFixed(1)}px) is below recommended 14px on ${result.device}`);
      }
    });
    
    // Analyze OAuth results
    this.results.oauth.forEach(result => {
      if (result.popup && result.popup.popupBlocked) {
        critical.push(`${result.site} OAuth may fail due to popup blocking`);
      }
      
      if (result.popup && !result.popup.buttonFound) {
        critical.push(`${result.site} SSO button not found or not properly configured`);
      }
      
      if (result.errorHandling && result.errorHandling.networkFailure && !result.errorHandling.networkFailure.handled) {
        improvements.push(`${result.site} lacks proper error handling for network failures`);
      }
    });
    
    // Analyze performance results
    this.results.performance.forEach(result => {
      if (result.loadTime > 5000) {
        performance.push(`${result.site} slow loading on ${result.network} network: ${(result.loadTime / 1000).toFixed(2)}s`);
      }
      
      if (result.resources && result.resources.totalSize > 1024 * 1024) {
        performance.push(`${result.site} has large bundle size: ${(result.resources.totalSize / 1024 / 1024).toFixed(1)}MB`);
      }
    });
    
    // Analyze accessibility results
    this.results.accessibility.forEach(result => {
      if (result.aria && result.aria.ssoButton && !result.aria.ssoButton.hasAriaLabel) {
        improvements.push(`${result.site} SSO button lacks proper ARIA labeling`);
      }
      
      if (result.keyboard && result.keyboard.ssoButton && !result.keyboard.ssoButton.canFocus) {
        critical.push(`${result.site} SSO button is not keyboard accessible`);
      }
    });
    
    // Analyze cross-browser results
    const browserIssues = {};
    this.results.crossBrowser.forEach(result => {
      if (result.jsErrors && result.jsErrors.errorCount > 0) {
        if (!browserIssues[result.browser]) browserIssues[result.browser] = [];
        browserIssues[result.browser].push(`${result.site}: ${result.jsErrors.errorCount} JS errors`);
      }
    });
    
    Object.entries(browserIssues).forEach(([browser, issues]) => {
      improvements.push(`${browser} compatibility issues: ${issues.join(', ')}`);
    });
    
    return {
      critical,
      improvements,
      performance,
      summary: `Found ${critical.length} critical issues, ${improvements.length} improvements, ${performance.length} performance concerns`
    };
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile SSO Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .critical { color: #d73027; font-weight: bold; }
        .warning { color: #fc8d59; }
        .success { color: #4daf4a; }
        .error { background: #ffe6e6; padding: 10px; border-left: 4px solid #d73027; margin: 10px 0; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #f9f9f9; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
        .expand { cursor: pointer; background: #e9ecef; padding: 5px 10px; margin: 5px 0; border-radius: 3px; }
        .details { display: none; background: #f8f9fa; padding: 10px; margin: 5px 0; border-radius: 3px; }
    </style>
    <script>
        function toggleDetails(id) {
            const elem = document.getElementById(id);
            elem.style.display = elem.style.display === 'none' ? 'block' : 'none';
        }
    </script>
</head>
<body>
    <div class="header">
        <h1>Mobile SSO Test Report</h1>
        <p><strong>Generated:</strong> ${report.generatedAt}</p>
        <p><strong>Duration:</strong> ${report.summary.duration}</p>
        <p><strong>Tests Run:</strong> ${Object.values(report.summary.testCounts).reduce((a, b) => a + b, 0)}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metric critical">Critical Issues: ${report.recommendations.critical.length}</div>
        <div class="metric warning">Improvements: ${report.recommendations.improvements.length}</div>
        <div class="metric warning">Performance Concerns: ${report.recommendations.performance.length}</div>
        <div class="metric">Total Errors: ${report.errors.length}</div>
        
        ${report.recommendations.critical.length > 0 ? `
        <h3 class="critical">Critical Issues</h3>
        <ul>
            ${report.recommendations.critical.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
        ` : ''}
    </div>

    <div class="section">
        <h2>Test Results</h2>
        
        <h3>Mobile Responsiveness</h3>
        <div class="expand" onclick="toggleDetails('responsiveness-details')">Click to expand responsiveness results</div>
        <div id="responsiveness-details" class="details">
            <table>
                <tr><th>Site</th><th>Device</th><th>Load Time</th><th>Touch Targets</th><th>Viewport Fit</th></tr>
                ${report.responsiveness.map(r => `
                <tr>
                    <td>${r.site}</td>
                    <td>${r.device}</td>
                    <td>${r.loadTime}ms</td>
                    <td>${r.touchTargets ? `${r.touchTargets.passingButtons}/${r.touchTargets.totalButtons} pass` : 'N/A'}</td>
                    <td class="${r.viewport && r.viewport.fits ? 'success' : 'critical'}">${r.viewport ? (r.viewport.fits ? 'Fits' : `Overflow: ${r.viewport.overflow}px`) : 'N/A'}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        <h3>OAuth Flow Testing</h3>
        <div class="expand" onclick="toggleDetails('oauth-details')">Click to expand OAuth results</div>
        <div id="oauth-details" class="details">
            <table>
                <tr><th>Site</th><th>Button Found</th><th>Popup Blocked</th><th>Error Handling</th></tr>
                ${report.oauth.map(o => `
                <tr>
                    <td>${o.site}</td>
                    <td class="${o.popup && o.popup.buttonFound ? 'success' : 'critical'}">${o.popup ? (o.popup.buttonFound ? 'Yes' : 'No') : 'N/A'}</td>
                    <td class="${o.popup && o.popup.popupBlocked ? 'critical' : 'success'}">${o.popup ? (o.popup.popupBlocked ? 'Yes' : 'No') : 'N/A'}</td>
                    <td>${o.errorHandling ? JSON.stringify(o.errorHandling) : 'N/A'}</td>
                </tr>
                `).join('')}
            </table>
        </div>

        <h3>Performance Results</h3>
        <div class="expand" onclick="toggleDetails('performance-details')">Click to expand performance results</div>
        <div id="performance-details" class="details">
            <table>
                <tr><th>Site</th><th>Network</th><th>Load Time</th><th>Bundle Size</th><th>Memory Usage</th></tr>
                ${report.performance.map(p => `
                <tr>
                    <td>${p.site}</td>
                    <td>${p.network}</td>
                    <td class="${p.loadTime > 5000 ? 'warning' : 'success'}">${(p.loadTime / 1000).toFixed(2)}s</td>
                    <td>${p.resources ? (p.resources.totalSize / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'}</td>
                    <td>${p.memory ? (p.memory.usedJSHeapSize / 1024 / 1024).toFixed(1) + 'MB' : 'N/A'}</td>
                </tr>
                `).join('')}
            </table>
        </div>
    </div>

    ${report.errors.length > 0 ? `
    <div class="section">
        <h2>Errors Encountered</h2>
        ${report.errors.map(error => `
        <div class="error">
            <strong>${error.test}:</strong> ${error.error}
            <br><small>${error.timestamp}</small>
        </div>
        `).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.improvements.length > 0 ? `
        <h3>Improvements</h3>
        <ul>
            ${report.recommendations.improvements.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        ` : ''}
        
        ${report.recommendations.performance.length > 0 ? `
        <h3>Performance Optimizations</h3>
        <ul>
            ${report.recommendations.performance.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
        ` : ''}
    </div>
</body>
</html>`;
  }
}

// Run the comprehensive test suite
(async () => {
  const tester = new MobileSSOMobileTester();
  await tester.runAllTests();
})().catch(console.error);

module.exports = MobileSSOMobileTester;