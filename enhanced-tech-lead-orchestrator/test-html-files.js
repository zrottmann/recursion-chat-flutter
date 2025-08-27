import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

// HTML files to test
const htmlFiles = [
    'examples/demo-operations-center.html',
    'examples/demo-operations-center-enhanced.html',
    'examples/demo-operations-center-mobile-fixed.html',
    'index.html',
    'mobile-operations-center.html',
    'chat-index.html',
    'client-test.html',
    'grok-console-test.html',
    'rpg-spell-game.html',
    'generated-cat-website.html'
];

// Test results array
const testResults = [];

// Test configuration
const testConfig = {
    timeout: 30000,
    headless: true,
    viewport: {
        width: 1920,
        height: 1080
    },
    mobileViewport: {
        width: 375,
        height: 667
    }
};

/**
 * Test HTML file loading and basic functionality
 */
async function testHtmlFile(browser, filePath) {
    const fileName = path.basename(filePath);
    const fullPath = path.resolve(filePath);
    
    console.log(`🧪 Testing: ${fileName}`);
    
    const result = {
        file: fileName,
        path: filePath,
        exists: false,
        loads: false,
        hasValidHtml: false,
        hasTitle: false,
        title: '',
        hasCss: false,
        hasJs: false,
        consoleErrors: [],
        consoleWarnings: [],
        performanceMetrics: {},
        mobileResponsive: false,
        interactivity: {
            buttons: 0,
            clickableElements: 0,
            forms: 0,
            interactiveTests: []
        },
        accessibility: {
            hasAltText: false,
            hasHeadings: false,
            hasLandmarks: false,
            colorContrast: 'unknown'
        },
        status: 'fail'
    };

    try {
        // Check if file exists
        await fs.access(fullPath);
        result.exists = true;
        
        const page = await browser.newPage();
        
        // Monitor console messages
        page.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                result.consoleErrors.push(text);
            } else if (msg.type() === 'warning') {
                result.consoleWarnings.push(text);
            }
        });

        // Set up performance monitoring
        const startTime = Date.now();
        
        // Load the HTML file
        await page.goto(`file://${fullPath}`, { 
            waitUntil: 'networkidle',
            timeout: testConfig.timeout 
        });
        
        const loadTime = Date.now() - startTime;
        result.performanceMetrics.loadTime = loadTime;
        result.loads = true;

        // Test basic HTML structure
        const htmlContent = await page.content();
        result.hasValidHtml = htmlContent.includes('<!DOCTYPE html>');
        
        // Get title
        const title = await page.title();
        result.hasTitle = title.length > 0;
        result.title = title;

        // Check for CSS and JavaScript
        const styleElements = await page.$$('style, link[rel="stylesheet"]');
        result.hasCss = styleElements.length > 0;
        
        const scriptElements = await page.$$('script');
        result.hasJs = scriptElements.length > 0;

        // Test interactivity
        const buttons = await page.$$('button');
        const clickableElements = await page.$$('a, button, input[type="button"], input[type="submit"], [onclick], [role="button"]');
        const forms = await page.$$('form');
        
        result.interactivity.buttons = buttons.length;
        result.interactivity.clickableElements = clickableElements.length;
        result.interactivity.forms = forms.length;

        // Test button functionality (sample a few buttons)
        if (buttons.length > 0) {
            try {
                // Test first button click
                const firstButton = buttons[0];
                const buttonText = await firstButton.textContent();
                await firstButton.click();
                result.interactivity.interactiveTests.push({
                    element: 'button',
                    text: buttonText?.trim() || 'unnamed',
                    success: true
                });
            } catch (error) {
                result.interactivity.interactiveTests.push({
                    element: 'button',
                    text: 'first button',
                    success: false,
                    error: error.message
                });
            }
        }

        // Test mobile responsiveness
        await page.setViewportSize(testConfig.mobileViewport);
        await page.waitForTimeout(1000); // Allow layout to adjust
        
        const isMobileResponsive = await page.evaluate(() => {
            const viewport = window.innerWidth;
            const hasViewportMeta = document.querySelector('meta[name="viewport"]');
            const hasResponsiveCSS = document.querySelector('style, link[rel="stylesheet"]');
            
            // Check for common responsive indicators
            const hasFlexbox = getComputedStyle(document.body).display === 'flex';
            const hasGridLayout = [...document.querySelectorAll('*')].some(el => 
                getComputedStyle(el).display === 'grid'
            );
            
            return {
                viewportWidth: viewport,
                hasViewportMeta: !!hasViewportMeta,
                hasResponsiveCSS: !!hasResponsiveCSS,
                hasFlexbox,
                hasGridLayout
            };
        });
        
        result.mobileResponsive = isMobileResponsive.hasViewportMeta && 
                                  isMobileResponsive.hasResponsiveCSS;

        // Test accessibility basics
        const images = await page.$$('img');
        const imagesWithAlt = await page.$$('img[alt]');
        result.accessibility.hasAltText = images.length === 0 || imagesWithAlt.length === images.length;
        
        const headings = await page.$$('h1, h2, h3, h4, h5, h6');
        result.accessibility.hasHeadings = headings.length > 0;
        
        const landmarks = await page.$$('nav, main, header, footer, aside, section[aria-labelledby], section[aria-label]');
        result.accessibility.hasLandmarks = landmarks.length > 0;

        // Performance metrics
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
                loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
                domInteractive: navigation?.domInteractive - navigation?.domContentLoadedEventStart || 0
            };
        });
        
        result.performanceMetrics = { ...result.performanceMetrics, ...performanceMetrics };

        // Test viewport back to desktop
        await page.setViewportSize(testConfig.viewport);

        await page.close();
        
        // Determine overall status
        const criticalIssues = result.consoleErrors.length;
        const hasBasicFunctionality = result.hasValidHtml && result.hasTitle && result.loads;
        
        if (criticalIssues === 0 && hasBasicFunctionality) {
            result.status = 'pass';
        } else if (hasBasicFunctionality) {
            result.status = 'warning';
        } else {
            result.status = 'fail';
        }

    } catch (error) {
        result.error = error.message;
        result.status = 'fail';
        console.error(`❌ Error testing ${fileName}:`, error.message);
    }

    return result;
}

/**
 * Generate HTML test report
 */
function generateHtmlReport(results) {
    const passed = results.filter(r => r.status === 'pass').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    const failed = results.filter(r => r.status === 'fail').length;
    
    const report = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML Files Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-card { flex: 1; padding: 15px; border-radius: 6px; text-align: center; }
        .pass { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        .fail { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .test-result { margin: 20px 0; padding: 15px; border-radius: 6px; border: 1px solid #ddd; }
        .test-result h3 { margin: 0 0 10px 0; }
        .status-pass { border-left: 4px solid #28a745; }
        .status-warning { border-left: 4px solid #ffc107; }
        .status-fail { border-left: 4px solid #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 10px 0; }
        .metric { padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 0.9em; }
        .error-list { background: #fff5f5; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .warning-list { background: #fffbf0; padding: 10px; border-radius: 4px; margin: 10px 0; }
        .interactive-tests { background: #f0f8ff; padding: 10px; border-radius: 4px; margin: 10px 0; }
        code { background: #f1f1f1; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
        .timestamp { color: #666; font-size: 0.9em; margin-top: 20px; text-align: right; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 HTML Files Test Report</h1>
        <p>Enhanced Tech-Lead Orchestrator HTML files validation results</p>
        
        <div class="summary">
            <div class="summary-card pass">
                <h3>${passed}</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card warning">
                <h3>${warnings}</h3>
                <p>Warnings</p>
            </div>
            <div class="summary-card fail">
                <h3>${failed}</h3>
                <p>Failed</p>
            </div>
        </div>

        ${results.map(result => `
            <div class="test-result status-${result.status}">
                <h3>📄 ${result.file}</h3>
                <p><strong>Path:</strong> <code>${result.path}</code></p>
                <p><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${
                    result.status === 'pass' ? '#28a745' : 
                    result.status === 'warning' ? '#ffc107' : '#dc3545'
                }">${result.status}</span></p>
                
                <div class="metrics">
                    <div class="metric">
                        <strong>Exists:</strong> ${result.exists ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Loads:</strong> ${result.loads ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Valid HTML:</strong> ${result.hasValidHtml ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Has Title:</strong> ${result.hasTitle ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Has CSS:</strong> ${result.hasCss ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Has JavaScript:</strong> ${result.hasJs ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Mobile Responsive:</strong> ${result.mobileResponsive ? '✅' : '❌'}
                    </div>
                    <div class="metric">
                        <strong>Load Time:</strong> ${result.performanceMetrics?.loadTime || 0}ms
                    </div>
                </div>

                ${result.title ? `<p><strong>Title:</strong> ${result.title}</p>` : ''}
                
                ${result.interactivity.buttons > 0 || result.interactivity.clickableElements > 0 ? `
                    <div class="interactive-tests">
                        <strong>Interactivity:</strong>
                        <ul>
                            <li>Buttons: ${result.interactivity.buttons}</li>
                            <li>Clickable Elements: ${result.interactivity.clickableElements}</li>
                            <li>Forms: ${result.interactivity.forms}</li>
                        </ul>
                        ${result.interactivity.interactiveTests.length > 0 ? `
                            <strong>Interaction Tests:</strong>
                            <ul>
                                ${result.interactivity.interactiveTests.map(test => `
                                    <li>${test.success ? '✅' : '❌'} ${test.element}: ${test.text} ${test.error ? `(${test.error})` : ''}</li>
                                `).join('')}
                            </ul>
                        ` : ''}
                    </div>
                ` : ''}

                ${result.consoleErrors.length > 0 ? `
                    <div class="error-list">
                        <strong>❌ Console Errors (${result.consoleErrors.length}):</strong>
                        <ul>
                            ${result.consoleErrors.map(error => `<li><code>${error}</code></li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${result.consoleWarnings.length > 0 ? `
                    <div class="warning-list">
                        <strong>⚠️ Console Warnings (${result.consoleWarnings.length}):</strong>
                        <ul>
                            ${result.consoleWarnings.map(warning => `<li><code>${warning}</code></li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${result.error ? `
                    <div class="error-list">
                        <strong>❌ Test Error:</strong>
                        <code>${result.error}</code>
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        <div class="timestamp">
            Generated: ${new Date().toLocaleString()}
        </div>
    </div>
</body>
</html>`;

    return report;
}

/**
 * Main test execution
 */
async function runTests() {
    console.log('🚀 Starting HTML files test suite...\n');
    
    const browser = await chromium.launch({ 
        headless: testConfig.headless,
        timeout: testConfig.timeout 
    });

    try {
        // Test each HTML file
        for (const filePath of htmlFiles) {
            const result = await testHtmlFile(browser, filePath);
            testResults.push(result);
        }

        await browser.close();

        // Generate reports
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const passed = testResults.filter(r => r.status === 'pass');
        const warnings = testResults.filter(r => r.status === 'warning');
        const failed = testResults.filter(r => r.status === 'fail');
        
        console.log(`✅ Passed: ${passed.length}/${testResults.length}`);
        console.log(`⚠️ Warnings: ${warnings.length}/${testResults.length}`);
        console.log(`❌ Failed: ${failed.length}/${testResults.length}`);
        
        // Show detailed results
        testResults.forEach(result => {
            const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            console.log(`\n${icon} ${result.file}:`);
            console.log(`   - Loads: ${result.loads ? '✅' : '❌'}`);
            console.log(`   - Mobile Responsive: ${result.mobileResponsive ? '✅' : '❌'}`);
            console.log(`   - Interactive Elements: ${result.interactivity.clickableElements}`);
            console.log(`   - Console Errors: ${result.consoleErrors.length}`);
            if (result.performanceMetrics?.loadTime) {
                console.log(`   - Load Time: ${result.performanceMetrics.loadTime}ms`);
            }
            if (result.error) {
                console.log(`   - Error: ${result.error}`);
            }
        });

        // Generate HTML report
        const htmlReport = generateHtmlReport(testResults);
        await fs.writeFile('html-test-report.html', htmlReport);
        console.log('\n📝 Detailed HTML report generated: html-test-report.html');

        // Generate JSON report for programmatic use
        await fs.writeFile('html-test-results.json', JSON.stringify(testResults, null, 2));
        console.log('📄 JSON results saved: html-test-results.json');

    } catch (error) {
        console.error('❌ Test suite failed:', error);
        await browser.close();
        process.exit(1);
    }
}

// Run tests
runTests().catch(console.error);