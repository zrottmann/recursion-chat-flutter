import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

// Key HTML files to test (focusing on examples directory and main files)
const htmlFiles = [
    'examples/demo-operations-center.html',
    'examples/demo-operations-center-enhanced.html',
    'examples/demo-operations-center-mobile-fixed.html',
    'index.html',
    'mobile-operations-center.html',
    'chat-index.html'
];

async function quickTestHtmlFile(browser, filePath) {
    const fileName = path.basename(filePath);
    const fullPath = path.resolve(filePath);
    
    console.log(`🧪 Testing: ${fileName}`);
    
    const result = {
        file: fileName,
        path: filePath,
        exists: false,
        loads: false,
        loadTime: 0,
        hasTitle: false,
        title: '',
        hasCss: false,
        hasJs: false,
        consoleErrors: [],
        mobileResponsive: false,
        interactiveElements: 0,
        status: 'fail'
    };

    try {
        // Check if file exists
        await fs.access(fullPath);
        result.exists = true;
        
        const page = await browser.newPage();
        
        // Monitor console errors only
        page.on('console', msg => {
            if (msg.type() === 'error') {
                result.consoleErrors.push(msg.text());
            }
        });

        const startTime = Date.now();
        
        // Load with shorter timeout
        await page.goto(`file://${fullPath}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000
        });
        
        result.loadTime = Date.now() - startTime;
        result.loads = true;

        // Quick checks
        result.title = await page.title();
        result.hasTitle = result.title.length > 0;

        // Check for CSS and JS
        const styleCount = await page.$$eval('style, link[rel="stylesheet"]', elements => elements.length);
        const scriptCount = await page.$$eval('script', elements => elements.length);
        result.hasCss = styleCount > 0;
        result.hasJs = scriptCount > 0;

        // Count interactive elements
        result.interactiveElements = await page.$$eval(
            'button, a, input, [onclick], [role="button"]', 
            elements => elements.length
        );

        // Quick mobile test
        const hasViewportMeta = await page.$('meta[name="viewport"]');
        result.mobileResponsive = !!hasViewportMeta;

        // Test one button click if available
        const firstButton = await page.$('button');
        if (firstButton) {
            try {
                await firstButton.click();
                // Button clicked successfully
            } catch (e) {
                // Click might have failed, but that's ok for this quick test
            }
        }

        await page.close();
        
        // Determine status
        if (result.loads && result.consoleErrors.length === 0 && result.hasTitle) {
            result.status = 'pass';
        } else if (result.loads && result.hasTitle) {
            result.status = 'warning';
        }

    } catch (error) {
        result.error = error.message;
        console.error(`❌ Error testing ${fileName}:`, error.message);
    }

    return result;
}

async function runQuickTests() {
    console.log('🚀 Running quick HTML validation tests...\n');
    
    const browser = await chromium.launch({ headless: true });
    const results = [];

    try {
        for (const filePath of htmlFiles) {
            const result = await quickTestHtmlFile(browser, filePath);
            results.push(result);
        }

        await browser.close();

        // Display results
        console.log('\n📊 Quick Test Results:');
        console.log('=====================');
        
        const passed = results.filter(r => r.status === 'pass').length;
        const warnings = results.filter(r => r.status === 'warning').length;
        const failed = results.filter(r => r.status === 'fail').length;
        
        console.log(`✅ Passed: ${passed}/${results.length}`);
        console.log(`⚠️ Warnings: ${warnings}/${results.length}`);
        console.log(`❌ Failed: ${failed}/${results.length}\n`);
        
        results.forEach(result => {
            const icon = result.status === 'pass' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
            
            console.log(`${icon} ${result.file}`);
            console.log(`   📁 Exists: ${result.exists ? '✅' : '❌'}`);
            console.log(`   🌐 Loads: ${result.loads ? '✅' : '❌'} (${result.loadTime}ms)`);
            console.log(`   📝 Title: "${result.title}"`);
            console.log(`   🎨 CSS: ${result.hasCss ? '✅' : '❌'}`);
            console.log(`   ⚡ JavaScript: ${result.hasJs ? '✅' : '❌'}`);
            console.log(`   📱 Mobile Ready: ${result.mobileResponsive ? '✅' : '❌'}`);
            console.log(`   🔘 Interactive Elements: ${result.interactiveElements}`);
            if (result.consoleErrors.length > 0) {
                console.log(`   ❌ Console Errors: ${result.consoleErrors.length}`);
                result.consoleErrors.slice(0, 3).forEach(error => {
                    console.log(`      • ${error.substring(0, 100)}...`);
                });
            } else {
                console.log(`   ✅ No Console Errors`);
            }
            if (result.error) {
                console.log(`   ⚠️ Error: ${result.error}`);
            }
            console.log('');
        });

        // Create simple report
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: { passed, warnings, failed, total: results.length },
            results: results
        };

        await fs.writeFile('quick-test-results.json', JSON.stringify(reportData, null, 2));
        console.log('📄 Results saved to: quick-test-results.json\n');

        // Overall assessment
        if (failed === 0) {
            console.log('🎉 All HTML files are loading correctly!');
        } else if (passed > failed) {
            console.log('⚠️ Most files are working, but some need attention.');
        } else {
            console.log('❌ Several files need fixes before they can load properly.');
        }

    } catch (error) {
        console.error('❌ Test suite failed:', error);
        await browser.close();
        process.exit(1);
    }
}

runQuickTests().catch(console.error);