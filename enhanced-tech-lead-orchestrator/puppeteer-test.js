// Simple Puppeteer test to verify browser automation is working
import puppeteer from 'puppeteer';

console.log('🌐 Starting Puppeteer browser test...');

async function testPuppeteer() {
  let browser;
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for demo
      slowMo: 250,     // Slow down for visibility
      defaultViewport: {
        width: 1280,
        height: 720
      },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched successfully!');
    
    // Create new page
    console.log('📄 Creating new page...');
    const page = await browser.newPage();
    
    // Test 1: Navigate to a website
    console.log('🔗 Testing navigation to example.com...');
    await page.goto('https://example.com', { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    console.log(`📑 Page title: "${title}"`);
    
    // Test 2: Create and load custom HTML content
    console.log('🎨 Testing custom HTML content...');
    const customHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Puppeteer Test - Enhanced Tech-Lead Orchestrator</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
          }
          .status { 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
            text-align: center;
            font-size: 18px;
            font-weight: bold;
          }
          .success { background: rgba(76, 175, 80, 0.8); }
          .info { background: rgba(33, 150, 243, 0.8); }
          .warning { background: rgba(255, 152, 0, 0.8); }
          button {
            background: #4CAF50;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            font-size: 16px;
            margin: 10px 5px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
          }
          button:hover {
            background: #45a049;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
          }
          #output { 
            margin-top: 20px; 
            padding: 15px; 
            background: rgba(0,0,0,0.3); 
            border-radius: 5px;
            min-height: 50px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Enhanced Tech-Lead Orchestrator</h1>
          <h2>Puppeteer Browser Automation Test</h2>
          
          <div class="status success" data-testid="browser-status">
            ✅ Browser Automation: WORKING
          </div>
          
          <div class="status info" data-testid="puppeteer-version">
            🌐 Puppeteer Version: Active
          </div>
          
          <div class="status warning" data-testid="test-status">
            🧪 Test Status: Running...
          </div>
          
          <h3>Interactive Test Controls</h3>
          <button onclick="runTest()" data-testid="run-test-btn">Run Performance Test</button>
          <button onclick="changeColor()" data-testid="change-color-btn">Change Colors</button>
          <button onclick="addElement()" data-testid="add-element-btn">Add Element</button>
          
          <div id="output" data-testid="output-area">
            Click buttons above to test browser interaction...
          </div>
          
          <div class="status info">
            🎯 This page demonstrates Puppeteer can:
            <ul style="text-align: left; margin-top: 10px;">
              <li>Launch browsers programmatically</li>
              <li>Load custom HTML content</li>
              <li>Interact with page elements</li>
              <li>Execute JavaScript</li>
              <li>Take screenshots</li>
              <li>Measure performance</li>
            </ul>
          </div>
        </div>
        
        <script>
          let testCount = 0;
          
          function runTest() {
            testCount++;
            const output = document.getElementById('output');
            const startTime = performance.now();
            
            // Simulate some work
            for(let i = 0; i < 100000; i++) {
              Math.sqrt(i);
            }
            
            const endTime = performance.now();
            const duration = (endTime - startTime).toFixed(2);
            
            output.innerHTML = \`
              <strong>Performance Test #\${testCount} Results:</strong><br>
              ⏱️ Execution Time: \${duration}ms<br>
              🧮 Operations: 100,000 square roots<br>
              📊 Performance: \${duration < 10 ? 'Excellent' : duration < 50 ? 'Good' : 'Fair'}
            \`;
            
            document.querySelector('[data-testid="test-status"]').innerHTML = 
              '✅ Test Status: Completed Successfully';
          }
          
          function changeColor() {
            const colors = [
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            ];
            
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            document.body.style.background = randomColor;
            
            document.getElementById('output').innerHTML = 
              '🎨 Background color changed successfully!';
          }
          
          function addElement() {
            const container = document.querySelector('.container');
            const newElement = document.createElement('div');
            newElement.className = 'status success';
            newElement.innerHTML = \`🆕 Dynamic Element #\${Date.now()} Added!\`;
            container.appendChild(newElement);
            
            document.getElementById('output').innerHTML = 
              '➕ New element added to page!';
              
            // Auto-remove after 3 seconds
            setTimeout(() => {
              if (newElement.parentNode) {
                newElement.remove();
                document.getElementById('output').innerHTML += 
                  '<br>🗑️ Element auto-removed after 3 seconds';
              }
            }, 3000);
          }
          
          // Auto-run initial test
          setTimeout(() => {
            document.querySelector('[data-testid="test-status"]').innerHTML = 
              '🚀 Test Status: Ready for interaction!';
          }, 1000);
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(customHTML);
    console.log('✅ Custom HTML content loaded successfully!');
    
    // Test 3: Wait for and interact with elements
    console.log('🎯 Testing element interaction...');
    await page.waitForSelector('[data-testid="run-test-btn"]');
    
    // Take screenshot before interaction
    console.log('📸 Taking screenshot before interaction...');
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/puppeteer-test-before.png', 
      fullPage: true 
    });
    
    // Click the performance test button
    console.log('🖱️ Clicking performance test button...');
    await page.click('[data-testid="run-test-btn"]');
    
    // Wait for test to complete
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-testid="test-status"]');
      return status && status.textContent.includes('Completed Successfully');
    });
    
    console.log('✅ Performance test completed successfully!');
    
    // Test 4: Extract information from page
    const testResults = await page.evaluate(() => {
      const output = document.getElementById('output');
      const status = document.querySelector('[data-testid="test-status"]');
      return {
        outputText: output ? output.textContent : 'No output',
        statusText: status ? status.textContent : 'No status',
        timestamp: new Date().toISOString()
      };
    });
    
    console.log('📊 Test Results:', testResults);
    
    // Test 5: More interactions
    console.log('🎨 Testing color change...');
    await page.click('[data-testid="change-color-btn"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('➕ Testing element addition...');
    await page.click('[data-testid="add-element-btn"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/puppeteer-test-after.png', 
      fullPage: true 
    });
    
    // Test 6: Performance measurement
    console.log('⚡ Testing performance measurement...');
    const performanceMetrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: perfData ? perfData.loadEventEnd - perfData.loadEventStart : 0,
        domContentLoaded: perfData ? perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart : 0,
        totalTime: perfData ? perfData.loadEventEnd - perfData.fetchStart : 0
      };
    });
    
    console.log('📈 Performance Metrics:', performanceMetrics);
    
    // Wait a bit to see the result
    console.log('⏳ Keeping browser open for 3 seconds to view results...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🎉 ALL PUPPETEER TESTS PASSED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Verified Capabilities:');
    console.log('  • Browser launching and page creation');
    console.log('  • HTML content loading and rendering');
    console.log('  • Element selection and interaction');
    console.log('  • JavaScript execution and evaluation');
    console.log('  • Screenshot capture');
    console.log('  • Performance measurement');
    console.log('  • Dynamic content manipulation');
    console.log('');
    
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
  } finally {
    if (browser) {
      console.log('🧹 Closing browser...');
      await browser.close();
      console.log('✅ Browser closed successfully!');
    }
  }
}

// Run the test
testPuppeteer().then(() => {
  console.log('🏁 Puppeteer test completed!');
}).catch(error => {
  console.error('💥 Test runner error:', error);
});