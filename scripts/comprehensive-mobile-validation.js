#!/usr/bin/env node

/**
 * Comprehensive Mobile Validation Script
 * Real Browser Testing for Console-Safe Mobile Enhancement
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SITES = {
  'Super Console': 'https://super.appwrite.network',
  'Remote Console': 'https://remote.appwrite.network', 
  'Recursion Chat': 'https://chat.recursionsystems.com',
  'Trading Post': 'https://tradingpost.appwrite.network',
  'Slum Lord RPG': 'https://slumlord.appwrite.network'
};

const MOBILE_DEVICES = [
  { name: 'iPhone 12 Pro', width: 390, height: 844, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  { name: 'iPhone SE', width: 375, height: 667, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' },
  { name: 'Samsung Galaxy S21', width: 384, height: 854, userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.210 Mobile Safari/537.36' },
  { name: 'iPad Mini', width: 768, height: 1024, userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1' }
];

class MobileValidationEngine {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testingMode: 'console-safe-browser-automation',
      sites: {},
      summary: {},
      consoleValidation: {}
    };
  }

  async validateSiteOnMobile(siteName, siteUrl, device) {
    const browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set mobile viewport and user agent
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });
      
      await page.setUserAgent(device.userAgent);
      
      console.log(`📱 Testing ${siteName} on ${device.name}`);
      
      const startTime = Date.now();
      let errors = [];
      let consoleErrors = [];
      
      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      page.on('pageerror', error => {
        errors.push(`Page Error: ${error.message}`);
      });
      
      // Navigate to site
      const response = await page.goto(siteUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
      
      const loadTime = Date.now() - startTime;
      
      // Basic accessibility and mobile UX checks
      const mobileAnalysis = await page.evaluate(() => {
        const analysis = {
          responsive: true,
          touchTargets: [],
          textSizes: [],
          viewportFit: true,
          consoleElements: {}
        };
        
        // Check if content fits viewport
        const bodyWidth = document.body.scrollWidth;
        const viewportWidth = window.innerWidth;
        analysis.responsive = bodyWidth <= viewportWidth + 10; // 10px tolerance
        
        // Check touch targets (buttons, links, etc.)
        const interactiveElements = document.querySelectorAll('button, a, input, textarea, select');
        interactiveElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const size = Math.min(rect.width, rect.height);
          if (size > 0 && size < 44) { // 44px is Apple's recommended minimum
            analysis.touchTargets.push({
              element: el.tagName.toLowerCase(),
              size: size,
              text: el.textContent?.substring(0, 50) || el.getAttribute('aria-label') || ''
            });
          }
        });
        
        // Check text sizes
        const textElements = document.querySelectorAll('p, div, span, a, button, h1, h2, h3, h4, h5, h6');
        textElements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 14) {
            analysis.textSizes.push({
              element: el.tagName.toLowerCase(),
              fontSize: fontSize,
              text: el.textContent?.substring(0, 30) || ''
            });
          }
        });
        
        // Console-specific element detection
        const consoleSelectors = [
          '.terminal', '.console', '[class*="terminal"]', '[class*="console"]',
          '.file-explorer', '[class*="file"]', '.websocket', '[class*="socket"]',
          '.chat-container', '.status-indicator', '.connection-status'
        ];
        
        consoleSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            analysis.consoleElements[selector] = {
              count: elements.length,
              visible: Array.from(elements).some(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden';
              })
            };
          }
        });
        
        return analysis;
      });
      
      // Take screenshot
      const screenshotPath = path.join(__dirname, `mobile-test-${siteName.replace(/\s+/g, '_')}-${device.name.replace(/\s+/g, '_')}.png`);
      await page.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      // Console-specific functionality test
      let consoleFunctionalityStatus = 'unknown';
      if (siteName.includes('Console')) {
        consoleFunctionalityStatus = await this.testConsoleFunctionality(page, siteName);
      }
      
      return {
        device: device.name,
        loadTime,
        responseStatus: response?.status() || 'unknown',
        errors,
        consoleErrors,
        mobileAnalysis,
        screenshotPath,
        consoleFunctionalityStatus,
        timestamp: new Date().toISOString()
      };
      
    } finally {
      await browser.close();
    }
  }
  
  async testConsoleFunctionality(page, siteName) {
    try {
      console.log(`🔍 Testing console functionality for ${siteName}`);
      
      // Test for common console elements and functionality
      const functionalityTest = await page.evaluate(() => {
        const tests = {
          hasWebSocketConnection: false,
          hasFileExplorer: false,
          hasTerminalInterface: false,
          hasAuthenticationElements: false,
          hasStatusIndicators: false,
          overallFunctional: false
        };
        
        // Check for WebSocket indicators
        tests.hasWebSocketConnection = !!(
          document.querySelector('.status-dot, .connection-status, [class*="websocket"], [class*="connected"]') ||
          document.querySelector('.chat-container, .real-time, [class*="realtime"]')
        );
        
        // Check for file explorer elements
        tests.hasFileExplorer = !!(
          document.querySelector('.file-explorer, [class*="file"], .directory, .folder') ||
          document.querySelector('input[type="file"], .upload, .browse')
        );
        
        // Check for terminal interface
        tests.hasTerminalInterface = !!(
          document.querySelector('.terminal, .console, .command, [class*="term"]') ||
          document.querySelector('textarea[placeholder*="command"], input[placeholder*="command"]')
        );
        
        // Check for authentication elements
        tests.hasAuthenticationElements = !!(
          document.querySelector('.auth, .login, .signin, .oauth') ||
          document.querySelector('button[class*="auth"], button[class*="login"]')
        );
        
        // Check for status indicators
        tests.hasStatusIndicators = !!(
          document.querySelector('.status, .indicator, .health, .monitor') ||
          document.querySelector('[class*="status"], [class*="indicator"]')
        );
        
        // Overall assessment
        const functionalElements = Object.values(tests).filter(t => t === true).length;
        tests.overallFunctional = functionalElements >= 2; // At least 2 console features present
        
        return tests;
      });
      
      return {
        ...functionalityTest,
        preservationStatus: functionalityTest.overallFunctional ? 'REQUIRES_PRESERVATION' : 'STANDARD_SITE'
      };
      
    } catch (error) {
      console.error(`❌ Console functionality test failed: ${error.message}`);
      return { error: error.message, preservationStatus: 'TEST_FAILED' };
    }
  }
  
  async runComprehensiveValidation() {
    console.log('🚀 Starting Comprehensive Mobile Validation');
    console.log('🛡️ Console-Safe Testing Mode Active\n');
    
    for (const [siteName, siteUrl] of Object.entries(SITES)) {
      console.log(`\n🌐 Validating: ${siteName}`);
      
      this.results.sites[siteName] = {
        url: siteUrl,
        deviceTests: {},
        overallMobileCompatibility: 'pending',
        consolePreservationRequired: siteName.includes('Console'),
        recommendations: []
      };
      
      for (const device of MOBILE_DEVICES) {
        try {
          const deviceResult = await this.validateSiteOnMobile(siteName, siteUrl, device);
          this.results.sites[siteName].deviceTests[device.name] = deviceResult;
          
          // Log immediate results
          console.log(`   📱 ${device.name}: ${deviceResult.responseStatus} (${deviceResult.loadTime}ms)`);
          if (deviceResult.errors.length > 0) {
            console.log(`      ❌ Errors: ${deviceResult.errors.length}`);
          }
          if (deviceResult.consoleFunctionalityStatus?.preservationStatus) {
            console.log(`      🛡️ Console Status: ${deviceResult.consoleFunctionalityStatus.preservationStatus}`);
          }
          
        } catch (error) {
          console.error(`   ❌ Device test failed: ${error.message}`);
          this.results.sites[siteName].deviceTests[device.name] = {
            error: error.message,
            device: device.name,
            timestamp: new Date().toISOString()
          };
        }
        
        // Wait between device tests to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Analyze results for this site
      this.analyzeSiteResults(siteName);
    }
    
    // Generate comprehensive summary
    this.generateValidationSummary();
    
    // Save results
    await this.saveResults();
    
    console.log('\n✅ Comprehensive Mobile Validation Complete');
  }
  
  analyzeSiteResults(siteName) {
    const siteResults = this.results.sites[siteName];
    const deviceTests = Object.values(siteResults.deviceTests);
    
    // Overall compatibility assessment
    const successfulTests = deviceTests.filter(test => !test.error && test.responseStatus === 200);
    const compatibilityScore = (successfulTests.length / deviceTests.length) * 100;
    
    siteResults.overallMobileCompatibility = {
      score: Math.round(compatibilityScore),
      status: compatibilityScore >= 75 ? 'good' : compatibilityScore >= 50 ? 'needs-improvement' : 'poor',
      successfulDevices: successfulTests.length,
      totalDevices: deviceTests.length
    };
    
    // Generate recommendations
    const allMobileAnalysis = successfulTests.map(test => test.mobileAnalysis).filter(Boolean);
    if (allMobileAnalysis.length > 0) {
      const recommendations = [];
      
      // Responsive design issues
      const nonResponsive = allMobileAnalysis.filter(analysis => !analysis.responsive);
      if (nonResponsive.length > 0) {
        recommendations.push('Implement responsive design - content overflowing viewport on mobile devices');
      }
      
      // Touch target issues
      const touchIssues = allMobileAnalysis.filter(analysis => analysis.touchTargets.length > 0);
      if (touchIssues.length > 0) {
        recommendations.push('Increase touch target sizes - elements smaller than 44px detected');
      }
      
      // Text size issues
      const textIssues = allMobileAnalysis.filter(analysis => analysis.textSizes.length > 0);
      if (textIssues.length > 0) {
        recommendations.push('Improve text readability - text smaller than 14px detected');
      }
      
      // Console-specific recommendations
      if (siteResults.consolePreservationRequired) {
        recommendations.push('CRITICAL: Preserve all console functionality during mobile enhancement');
        recommendations.push('Use progressive enhancement approach - add mobile features without modifying console core');
        recommendations.push('Test console operations after any mobile-related changes');
      } else {
        recommendations.push('Standard mobile optimization - full responsive redesign acceptable');
        recommendations.push('Implement mobile-first approach with touch-optimized interactions');
      }
      
      siteResults.recommendations = recommendations;
    }
  }
  
  generateValidationSummary() {
    const summary = {
      totalSites: Object.keys(this.results.sites).length,
      consoleSites: 0,
      applicationSites: 0,
      overallMobileReadiness: 'pending',
      criticalFindings: [],
      nextSteps: []
    };
    
    for (const [siteName, results] of Object.entries(this.results.sites)) {
      if (results.consolePreservationRequired) {
        summary.consoleSites++;
        
        // Check if console functionality is at risk
        const hasConsoleFunctionality = Object.values(results.deviceTests).some(test => 
          test.consoleFunctionalityStatus?.preservationStatus === 'REQUIRES_PRESERVATION'
        );
        
        if (hasConsoleFunctionality) {
          summary.criticalFindings.push(`${siteName}: Console functionality detected - MUST preserve during mobile enhancement`);
        }
      } else {
        summary.applicationSites++;
      }
    }
    
    // Overall mobile readiness assessment
    const siteScores = Object.values(this.results.sites)
      .map(site => site.overallMobileCompatibility?.score || 0);
    const averageScore = siteScores.reduce((a, b) => a + b, 0) / siteScores.length;
    
    summary.overallMobileReadiness = {
      score: Math.round(averageScore),
      status: averageScore >= 75 ? 'ready' : averageScore >= 50 ? 'needs-work' : 'significant-issues',
      consoleSitesRequiringCare: summary.consoleSites
    };
    
    // Next steps based on findings
    if (summary.consoleSites > 0) {
      summary.nextSteps.push('PHASE 1: Implement console-safe mobile enhancements (progressive enhancement only)');
    }
    if (summary.applicationSites > 0) {
      summary.nextSteps.push('PHASE 2: Full mobile optimization for application sites');
    }
    summary.nextSteps.push('PHASE 3: Comprehensive testing with console functionality validation');
    summary.nextSteps.push('PHASE 4: Gradual deployment with rollback capability');
    
    this.results.summary = summary;
  }
  
  async saveResults() {
    const resultsPath = path.join(__dirname, 'comprehensive-mobile-validation-results.json');
    const summaryPath = path.join(__dirname, 'mobile-validation-summary.md');
    
    try {
      // Save JSON results
      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
      console.log(`💾 Validation results saved: ${resultsPath}`);
      
      // Generate and save markdown summary
      const markdown = this.generateMarkdownReport();
      fs.writeFileSync(summaryPath, markdown);
      console.log(`📋 Summary report saved: ${summaryPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }
  
  generateMarkdownReport() {
    const summary = this.results.summary;
    
    return `# Comprehensive Mobile Validation Report
Generated: ${this.results.timestamp}

## Executive Summary
- **Total Sites Tested**: ${summary.totalSites}
- **Console Sites (Critical)**: ${summary.consoleSites}
- **Application Sites**: ${summary.applicationSites}
- **Overall Mobile Readiness**: ${summary.overallMobileReadiness.score}% (${summary.overallMobileReadiness.status})

## Critical Findings
${summary.criticalFindings.map(finding => `- 🚨 ${finding}`).join('\n')}

## Site-by-Site Analysis

${Object.entries(this.results.sites).map(([siteName, results]) => `
### ${siteName}
- **URL**: ${results.url}
- **Console Site**: ${results.consolePreservationRequired ? '🛡️ YES (Preservation Required)' : '📱 No (Standard Enhancement)'}
- **Mobile Compatibility**: ${results.overallMobileCompatibility?.score || 0}% (${results.overallMobileCompatibility?.status || 'unknown'})
- **Device Tests**: ${results.overallMobileCompatibility?.successfulDevices || 0}/${results.overallMobileCompatibility?.totalDevices || 0} successful

#### Recommendations:
${results.recommendations?.map(rec => `- ${rec}`).join('\n') || '- Analysis pending'}
`).join('\n')}

## Next Steps
${summary.nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Implementation Priority
1. **HIGH PRIORITY**: Console sites require careful preservation-first approach
2. **MEDIUM PRIORITY**: Application sites can use standard mobile optimization
3. **CRITICAL**: All changes must be tested for console functionality impact

## Risk Mitigation
- Console functionality testing is mandatory before any deployment
- Rollback procedures must be in place for all console site changes
- Progressive enhancement approach is required for console sites
- Feature flags should be used for any new mobile-specific functionality
`;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new MobileValidationEngine();
  validator.runComprehensiveValidation().catch(console.error);
}

module.exports = MobileValidationEngine;