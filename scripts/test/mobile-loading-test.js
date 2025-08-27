const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Site configuration for testing
const testSites = [
    {
        name: 'Enhanced Tech-Lead Orchestrator - Main',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\enhanced-tech-lead-orchestrator\\index.html',
        url: null
    },
    {
        name: 'Tech-Lead Operations Center - Demo',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\enhanced-tech-lead-orchestrator\\examples\\demo-operations-center.html',
        url: null
    },
    {
        name: 'Operations Center - Enhanced',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\enhanced-tech-lead-orchestrator\\examples\\demo-operations-center-enhanced.html',
        url: null
    },
    {
        name: 'Operations Center - Mobile Fixed',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\enhanced-tech-lead-orchestrator\\examples\\demo-operations-center-mobile-fixed.html',
        url: null
    },
    {
        name: 'Grok Console',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\index.html',
        url: null
    },
    {
        name: 'Claude Code UI',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\claudecodeui\\index.html',
        url: null
    },
    {
        name: 'Trading Post',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\trading-post\\trading-app-frontend\\dist\\index.html',
        url: null
    },
    {
        name: 'Recursion Chat',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\recursion-chat\\client\\dist\\index.html',
        url: null
    },
    {
        name: 'Archon Knowledge Engine',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\archon\\dist\\index.html',
        url: null
    },
    {
        name: 'Slumlord RPG',
        path: 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\active-projects\\slumlord\\implementation\\web\\dist\\index.html',
        url: null
    }
];

// Mobile viewport configurations to test
const mobileViewports = [
    {
        name: 'iPhone SE',
        viewport: { width: 375, height: 667 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    },
    {
        name: 'iPhone 12 Pro',
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    },
    {
        name: 'Samsung Galaxy S21',
        viewport: { width: 360, height: 800 },
        userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
    },
    {
        name: 'iPad Mini',
        viewport: { width: 768, height: 1024 },
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
    }
];

// Test criteria
const testCriteria = {
    maxLoadTime: 5000, // 5 seconds max load time
    minUsabilityScore: 70,
    maxErrors: 2,
    requiredElements: ['title', 'meta[name="viewport"]'],
    touchFriendlyMinSize: 44 // minimum touch target size in pixels
};

class MobileLoadingTester {
    constructor() {
        this.results = [];
        this.startTime = Date.now();
        this.browser = null;
    }

    async initialize() {
        console.log('🚀 Initializing Mobile Loading Test Suite...');
        console.log(`📱 Testing ${testSites.length} sites on ${mobileViewports.length} mobile viewports`);
        
        this.browser = await chromium.launch({
            headless: false, // Set to true for CI/CD environments
            args: ['--no-sandbox', '--disable-web-security']
        });
        console.log('✅ Browser initialized');
    }

    async testSite(siteConfig, viewport) {
        const testStart = Date.now();
        const context = await this.browser.newContext({
            viewport: viewport.viewport,
            userAgent: viewport.userAgent,
            deviceScaleFactor: 2,
            hasTouch: true
        });
        
        const page = await context.newPage();
        
        // Track console errors
        const consoleErrors = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Track network failures
        const networkErrors = [];
        page.on('requestfailed', (request) => {
            networkErrors.push({
                url: request.url(),
                failure: request.failure()
            });
        });

        const testResult = {
            siteName: siteConfig.name,
            viewport: viewport.name,
            testStart: new Date(testStart).toISOString(),
            status: 'PASS',
            errors: [],
            warnings: [],
            metrics: {
                loadTime: null,
                firstContentfulPaint: null,
                largestContentfulPaint: null,
                cumulativeLayoutShift: null,
                usabilityScore: 0
            },
            accessibility: {
                hasViewportMeta: false,
                touchFriendlyElements: 0,
                keyboardAccessible: false
            },
            performance: {
                domContentLoaded: null,
                networkIdle: null,
                javascriptErrors: 0,
                networkFailures: 0
            }
        };

        try {
            // Check if file exists
            if (!fs.existsSync(siteConfig.path)) {
                throw new Error(`File not found: ${siteConfig.path}`);
            }

            console.log(`\n📱 Testing ${siteConfig.name} on ${viewport.name}...`);
            
            // Load the page with timeout
            const loadStart = Date.now();
            const fileUrl = 'file:///' + siteConfig.path.replace(/\\/g, '/');
            
            await page.goto(fileUrl, { 
                waitUntil: 'domcontentloaded',
                timeout: testCriteria.maxLoadTime 
            });
            
            testResult.metrics.loadTime = Date.now() - loadStart;
            
            // Wait for any dynamic content to load
            await page.waitForTimeout(2000);
            
            // Check basic page elements
            const title = await page.title();
            if (!title || title.trim() === '') {
                testResult.warnings.push('Page has no title or empty title');
            }

            // Check viewport meta tag
            const viewportMeta = await page.$('meta[name="viewport"]');
            testResult.accessibility.hasViewportMeta = !!viewportMeta;
            if (!viewportMeta) {
                testResult.errors.push('Missing viewport meta tag for mobile optimization');
            }

            // Check for horizontal scrolling
            const hasHorizontalScroll = await page.evaluate(() => {
                return document.body.scrollWidth > window.innerWidth;
            });
            
            if (hasHorizontalScroll) {
                testResult.errors.push('Page has horizontal scrolling on mobile viewport');
            }

            // Check touch-friendly elements
            const touchElements = await page.$$eval('button, a, input, [onclick], [role="button"]', (elements) => {
                return elements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width >= 44 && rect.height >= 44; // iOS/Android recommended minimum
                }).length;
            });
            
            testResult.accessibility.touchFriendlyElements = touchElements;

            // Performance metrics using Navigation API
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                return {
                    domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
                    largestContentfulPaint: 0 // Would need observer for this
                };
            });
            
            testResult.metrics.firstContentfulPaint = performanceMetrics.firstContentfulPaint;
            testResult.performance.domContentLoaded = performanceMetrics.domContentLoaded;

            // Count errors
            testResult.performance.javascriptErrors = consoleErrors.length;
            testResult.performance.networkFailures = networkErrors.length;

            // Calculate usability score (0-100)
            let usabilityScore = 100;
            
            // Deduct points for issues
            if (testResult.metrics.loadTime > 3000) usabilityScore -= 20;
            if (testResult.metrics.loadTime > 5000) usabilityScore -= 20;
            if (!testResult.accessibility.hasViewportMeta) usabilityScore -= 15;
            if (hasHorizontalScroll) usabilityScore -= 25;
            if (testResult.accessibility.touchFriendlyElements < 3) usabilityScore -= 10;
            if (consoleErrors.length > 0) usabilityScore -= (consoleErrors.length * 5);
            if (networkErrors.length > 0) usabilityScore -= (networkErrors.length * 10);
            
            testResult.metrics.usabilityScore = Math.max(0, usabilityScore);

            // Determine overall test status
            if (testResult.metrics.loadTime > testCriteria.maxLoadTime) {
                testResult.status = 'FAIL';
                testResult.errors.push(`Load time ${testResult.metrics.loadTime}ms exceeds limit of ${testCriteria.maxLoadTime}ms`);
            }
            
            if (testResult.metrics.usabilityScore < testCriteria.minUsabilityScore) {
                testResult.status = 'FAIL';
                testResult.errors.push(`Usability score ${testResult.metrics.usabilityScore} below minimum ${testCriteria.minUsabilityScore}`);
            }
            
            if (testResult.errors.length > testCriteria.maxErrors) {
                testResult.status = 'FAIL';
            }

            // Take screenshot for visual verification
            const screenshotPath = `C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\mobile-test-${siteConfig.name.replace(/[^a-zA-Z0-9]/g, '_')}-${viewport.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
            await page.screenshot({ 
                path: screenshotPath,
                fullPage: true
            });
            
            testResult.screenshotPath = screenshotPath;

            const testDuration = Date.now() - testStart;
            console.log(`${testResult.status === 'PASS' ? '✅' : '❌'} ${siteConfig.name} on ${viewport.name}: ${testResult.status} (${testDuration}ms)`);
            console.log(`   Load Time: ${testResult.metrics.loadTime}ms | Usability: ${testResult.metrics.usabilityScore}/100 | Errors: ${testResult.errors.length}`);
            
        } catch (error) {
            testResult.status = 'FAIL';
            testResult.errors.push(`Test failed: ${error.message}`);
            console.log(`❌ ${siteConfig.name} on ${viewport.name}: FAIL - ${error.message}`);
        } finally {
            // Add console errors to result
            if (consoleErrors.length > 0) {
                testResult.errors.push(...consoleErrors.slice(0, 3).map(err => `Console error: ${err}`));
            }
            
            // Add network errors to result
            if (networkErrors.length > 0) {
                testResult.errors.push(...networkErrors.slice(0, 2).map(err => `Network error: ${err.url} - ${err.failure}`));
            }
            
            await context.close();
        }

        return testResult;
    }

    async runAllTests() {
        console.log('\n🔄 Starting comprehensive mobile loading tests...');
        
        for (const site of testSites) {
            for (const viewport of mobileViewports) {
                const result = await this.testSite(site, viewport);
                this.results.push(result);
                
                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log('\n✅ All tests completed!');
    }

    generateReport() {
        const reportPath = 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\mobile-loading-test-report.json';
        const htmlReportPath = 'C:\\Users\\Zrott\\OneDrive\\Desktop\\Claude\\mobile-loading-test-report.html';
        
        // Summary statistics
        const summary = {
            totalTests: this.results.length,
            passed: this.results.filter(r => r.status === 'PASS').length,
            failed: this.results.filter(r => r.status === 'FAIL').length,
            averageLoadTime: this.results.reduce((acc, r) => acc + (r.metrics.loadTime || 0), 0) / this.results.length,
            averageUsabilityScore: this.results.reduce((acc, r) => acc + r.metrics.usabilityScore, 0) / this.results.length,
            testDuration: Date.now() - this.startTime,
            timestamp: new Date().toISOString()
        };

        const fullReport = {
            summary,
            testCriteria,
            results: this.results,
            sitesSummary: this.generateSitesSummary()
        };

        // Write JSON report
        fs.writeFileSync(reportPath, JSON.stringify(fullReport, null, 2));
        
        // Generate HTML report
        const htmlReport = this.generateHTMLReport(fullReport);
        fs.writeFileSync(htmlReportPath, htmlReport);
        
        console.log('\n📊 MOBILE LOADING TEST RESULTS SUMMARY');
        console.log('==========================================');
        console.log(`📱 Total Tests: ${summary.totalTests}`);
        console.log(`✅ Passed: ${summary.passed}`);
        console.log(`❌ Failed: ${summary.failed}`);
        console.log(`⏱️  Average Load Time: ${Math.round(summary.averageLoadTime)}ms`);
        console.log(`🎯 Average Usability Score: ${Math.round(summary.averageUsabilityScore)}/100`);
        console.log(`⏰ Total Test Duration: ${Math.round(summary.testDuration / 1000)}s`);
        
        console.log('\n📊 RESULTS BY SITE:');
        for (const siteSummary of fullReport.sitesSummary) {
            const status = siteSummary.passRate >= 0.75 ? '✅' : siteSummary.passRate >= 0.5 ? '⚠️' : '❌';
            console.log(`${status} ${siteSummary.siteName}: ${Math.round(siteSummary.passRate * 100)}% pass rate (${siteSummary.averageLoadTime}ms avg load)`);
        }
        
        console.log(`\n📄 Full Report: ${reportPath}`);
        console.log(`🌐 HTML Report: ${htmlReportPath}`);
        
        return fullReport;
    }

    generateSitesSummary() {
        const sites = [...new Set(this.results.map(r => r.siteName))];
        
        return sites.map(siteName => {
            const siteResults = this.results.filter(r => r.siteName === siteName);
            const passed = siteResults.filter(r => r.status === 'PASS').length;
            
            return {
                siteName,
                totalTests: siteResults.length,
                passed,
                failed: siteResults.length - passed,
                passRate: passed / siteResults.length,
                averageLoadTime: Math.round(siteResults.reduce((acc, r) => acc + (r.metrics.loadTime || 0), 0) / siteResults.length),
                averageUsabilityScore: Math.round(siteResults.reduce((acc, r) => acc + r.metrics.usabilityScore, 0) / siteResults.length),
                commonIssues: this.extractCommonIssues(siteResults)
            };
        });
    }

    extractCommonIssues(results) {
        const allErrors = results.flatMap(r => r.errors);
        const errorCounts = {};
        
        allErrors.forEach(error => {
            // Categorize errors
            let category = 'Other';
            if (error.includes('viewport')) category = 'Viewport';
            else if (error.includes('Load time')) category = 'Performance';
            else if (error.includes('horizontal scrolling')) category = 'Layout';
            else if (error.includes('Console error')) category = 'JavaScript';
            else if (error.includes('Network error')) category = 'Network';
            
            errorCounts[category] = (errorCounts[category] || 0) + 1;
        });
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([category, count]) => ({ category, count }));
    }

    generateHTMLReport(fullReport) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Loading Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #667eea; }
        .metric-label { font-size: 0.9em; color: #666; margin-top: 5px; }
        .sites-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .site-card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .site-card h3 { color: #333; margin-bottom: 15px; }
        .pass-rate { font-size: 1.5em; font-weight: bold; margin-bottom: 10px; }
        .pass-rate.good { color: #4CAF50; }
        .pass-rate.warning { color: #FF9800; }
        .pass-rate.bad { color: #F44336; }
        .detailed-results { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; font-weight: 600; }
        .status-pass { color: #4CAF50; font-weight: bold; }
        .status-fail { color: #F44336; font-weight: bold; }
        .load-time-good { color: #4CAF50; }
        .load-time-warning { color: #FF9800; }
        .load-time-bad { color: #F44336; }
        .usability-score { font-weight: bold; }
        .timestamp { color: #666; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📱 Mobile Loading Test Report</h1>
            <p>Comprehensive mobile usability and performance testing across ${fullReport.summary.totalTests} test scenarios</p>
            <p class="timestamp">Generated: ${fullReport.summary.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric-card">
                <div class="metric-value">${fullReport.summary.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #4CAF50;">${fullReport.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" style="color: #F44336;">${fullReport.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(fullReport.summary.averageLoadTime)}ms</div>
                <div class="metric-label">Avg Load Time</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(fullReport.summary.averageUsabilityScore)}</div>
                <div class="metric-label">Avg Usability Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(fullReport.summary.testDuration / 1000)}s</div>
                <div class="metric-label">Test Duration</div>
            </div>
        </div>

        <h2>📊 Results by Site</h2>
        <div class="sites-grid">
            ${fullReport.sitesSummary.map(site => `
                <div class="site-card">
                    <h3>${site.siteName}</h3>
                    <div class="pass-rate ${site.passRate >= 0.75 ? 'good' : site.passRate >= 0.5 ? 'warning' : 'bad'}">
                        ${Math.round(site.passRate * 100)}% Pass Rate
                    </div>
                    <p>Average Load Time: <strong>${site.averageLoadTime}ms</strong></p>
                    <p>Average Usability: <strong>${site.averageUsabilityScore}/100</strong></p>
                    <p>Tests: ${site.passed}/${site.totalTests} passed</p>
                    ${site.commonIssues.length > 0 ? `
                        <div style="margin-top: 10px;">
                            <strong>Common Issues:</strong>
                            ${site.commonIssues.map(issue => `<div style="font-size: 0.9em; color: #666;">• ${issue.category} (${issue.count})</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="detailed-results">
            <h2>📋 Detailed Test Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Site</th>
                        <th>Viewport</th>
                        <th>Status</th>
                        <th>Load Time</th>
                        <th>Usability</th>
                        <th>Issues</th>
                    </tr>
                </thead>
                <tbody>
                    ${fullReport.results.map(result => `
                        <tr>
                            <td>${result.siteName}</td>
                            <td>${result.viewport}</td>
                            <td class="status-${result.status.toLowerCase()}">${result.status}</td>
                            <td class="load-time-${
                                result.metrics.loadTime <= 2000 ? 'good' :
                                result.metrics.loadTime <= 4000 ? 'warning' : 'bad'
                            }">${result.metrics.loadTime || 'N/A'}ms</td>
                            <td class="usability-score">${result.metrics.usabilityScore}/100</td>
                            <td>${result.errors.length + result.warnings.length}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser cleanup completed');
        }
    }
}

// Run the tests
async function runMobileLoadingTests() {
    const tester = new MobileLoadingTester();
    
    try {
        await tester.initialize();
        await tester.runAllTests();
        const report = tester.generateReport();
        
        // Return summary for programmatic use
        return {
            success: true,
            summary: report.summary,
            recommendedActions: generateRecommendations(report)
        };
        
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        await tester.cleanup();
    }
}

function generateRecommendations(report) {
    const recommendations = [];
    
    // Performance recommendations
    if (report.summary.averageLoadTime > 3000) {
        recommendations.push({
            category: 'Performance',
            priority: 'High',
            action: 'Optimize load times - average exceeds 3 seconds',
            details: 'Consider image optimization, code splitting, and lazy loading'
        });
    }
    
    // Usability recommendations
    if (report.summary.averageUsabilityScore < 80) {
        recommendations.push({
            category: 'Usability',
            priority: 'High', 
            action: 'Improve mobile usability score',
            details: 'Focus on viewport meta tags, touch-friendly elements, and layout optimization'
        });
    }
    
    // Site-specific recommendations
    const problematicSites = report.sitesSummary.filter(site => site.passRate < 0.75);
    if (problematicSites.length > 0) {
        recommendations.push({
            category: 'Site Issues',
            priority: 'Medium',
            action: `Focus on ${problematicSites.length} sites with low pass rates`,
            details: `Sites needing attention: ${problematicSites.map(s => s.siteName).join(', ')}`
        });
    }
    
    return recommendations;
}

// Export for use as module or run directly
if (require.main === module) {
    runMobileLoadingTests()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 Mobile loading tests completed successfully!');
                process.exit(0);
            } else {
                console.error('\n💥 Mobile loading tests failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Unexpected error:', error);
            process.exit(1);
        });
} else {
    module.exports = { runMobileLoadingTests, MobileLoadingTester };
}