import { chromium } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

async function testSingleFile(filePath) {
    const fileName = path.basename(filePath);
    const fullPath = path.resolve(filePath);
    
    console.log(`\n🧪 Testing: ${fileName}`);
    console.log(`📁 Path: ${filePath}`);
    
    let browser;
    try {
        // Check if file exists first
        await fs.access(fullPath);
        console.log(`✅ File exists`);

        // Start fresh browser for each file
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        const startTime = Date.now();
        
        // Load the page
        await page.goto(`file://${fullPath}`, { 
            waitUntil: 'domcontentloaded',
            timeout: 8000
        });
        
        const loadTime = Date.now() - startTime;
        console.log(`✅ Loaded in ${loadTime}ms`);

        // Basic checks
        const title = await page.title();
        console.log(`📝 Title: "${title}"`);

        const hasCSS = await page.$$eval('style, link[rel="stylesheet"]', els => els.length > 0);
        console.log(`🎨 Has CSS: ${hasCSS ? '✅' : '❌'}`);

        const hasJS = await page.$$eval('script', els => els.length > 0);
        console.log(`⚡ Has JavaScript: ${hasJS ? '✅' : '❌'}`);

        const hasViewport = await page.$('meta[name="viewport"]') !== null;
        console.log(`📱 Mobile viewport meta: ${hasViewport ? '✅' : '❌'}`);

        const interactiveCount = await page.$$eval(
            'button, a, input, [onclick], [role="button"]', 
            els => els.length
        );
        console.log(`🔘 Interactive elements: ${interactiveCount}`);

        // Test mobile responsiveness
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(500);
        console.log(`📱 Mobile test: Page resized to 375x667`);

        // Test desktop responsiveness  
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.waitForTimeout(500);
        console.log(`🖥️ Desktop test: Page resized to 1920x1080`);

        // Test button interaction if available
        const buttons = await page.$$('button');
        if (buttons.length > 0) {
            try {
                const firstButton = buttons[0];
                const buttonText = await firstButton.textContent();
                await firstButton.click();
                console.log(`🔘 Button test: Clicked "${buttonText?.trim() || 'unnamed button'}" - ✅`);
            } catch (err) {
                console.log(`🔘 Button test: Click failed - ❌ (${err.message})`);
            }
        } else {
            console.log(`🔘 Button test: No buttons found`);
        }

        // Console errors check
        if (consoleErrors.length > 0) {
            console.log(`❌ Console errors: ${consoleErrors.length}`);
            consoleErrors.slice(0, 2).forEach(error => {
                console.log(`   • ${error.substring(0, 100)}${error.length > 100 ? '...' : ''}`);
            });
        } else {
            console.log(`✅ No console errors`);
        }

        await page.close();
        await browser.close();

        return {
            file: fileName,
            success: true,
            loadTime,
            title,
            hasCSS,
            hasJS,
            hasViewport,
            interactiveCount,
            consoleErrors: consoleErrors.length
        };

    } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
        
        if (browser) {
            await browser.close();
        }
        
        return {
            file: fileName,
            success: false,
            error: error.message
        };
    }
}

// List of files to test
const filesToTest = [
    'examples/demo-operations-center.html',
    'examples/demo-operations-center-enhanced.html', 
    'examples/demo-operations-center-mobile-fixed.html',
    'index.html',
    'mobile-operations-center.html',
    'chat-index.html',
    'client-test.html',
    'grok-console-test.html'
];

async function runTests() {
    console.log('🚀 Starting individual HTML file tests...\n');
    
    const results = [];
    
    for (const filePath of filesToTest) {
        const result = await testSingleFile(filePath);
        results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n📊 FINAL SUMMARY');
    console.log('================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}\n`);
    
    if (successful.length > 0) {
        console.log('✅ WORKING FILES:');
        successful.forEach(result => {
            console.log(`   • ${result.file} - ${result.loadTime}ms, ${result.interactiveCount} interactive elements`);
        });
    }
    
    if (failed.length > 0) {
        console.log('\n❌ FAILED FILES:');
        failed.forEach(result => {
            console.log(`   • ${result.file} - ${result.error}`);
        });
    }

    // Save results
    await fs.writeFile('test-summary.json', JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed results saved to: test-summary.json`);
}

runTests().catch(console.error);