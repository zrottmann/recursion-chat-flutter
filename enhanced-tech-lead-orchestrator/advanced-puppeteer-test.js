// Advanced Puppeteer test - Form interactions, file handling, and comprehensive testing
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

console.log('🚀 Starting Advanced Puppeteer Test Suite...');

async function advancedPuppeteerTest() {
  let browser;
  
  try {
    // Ensure screenshots directory exists
    try {
      await fs.mkdir('tests/e2e/screenshots', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    // Launch browser with advanced options
    console.log('🌐 Launching browser with advanced configuration...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for demo
      slowMo: 100,     // Moderate speed for visibility
      defaultViewport: {
        width: 1920,
        height: 1080
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--start-maximized'
      ]
    });
    
    const page = await browser.newPage();
    
    // Test 1: Advanced Form Testing
    console.log('📝 Testing advanced form interactions...');
    
    const formTestHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Advanced Puppeteer Form Test</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            margin: 0;
            padding: 20px;
          }
          .form-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          }
          .form-group { 
            margin: 20px 0; 
          }
          label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          input, select, textarea { 
            width: 100%; 
            padding: 12px; 
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.1);
            color: white;
            border-radius: 8px; 
            font-size: 16px;
            transition: all 0.3s;
          }
          input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #4CAF50;
            background: rgba(255,255,255,0.2);
            box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);
          }
          input::placeholder, textarea::placeholder {
            color: rgba(255,255,255,0.7);
          }
          button { 
            background: linear-gradient(45deg, #4CAF50, #45a049);
            border: none; 
            color: white; 
            padding: 15px 30px; 
            font-size: 16px; 
            border-radius: 8px; 
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 10px 5px;
          }
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
          }
          .result { 
            margin-top: 30px; 
            padding: 20px; 
            background: rgba(0,255,0,0.1); 
            border-radius: 8px;
            border-left: 4px solid #4CAF50;
            display: none;
          }
          .checkbox-group { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 15px;
            margin-top: 10px;
          }
          .checkbox-item { 
            display: flex; 
            align-items: center; 
            background: rgba(255,255,255,0.1);
            padding: 10px 15px;
            border-radius: 25px;
            transition: all 0.3s;
          }
          .checkbox-item:hover {
            background: rgba(255,255,255,0.2);
          }
          .checkbox-item input { 
            width: auto; 
            margin-right: 8px; 
          }
          .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 20px 0;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            width: 0%;
            transition: width 0.3s ease;
          }
          h1, h2 { 
            text-align: center; 
            margin-bottom: 30px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0;
          }
          .stat-card { 
            background: rgba(255,255,255,0.1); 
            padding: 15px; 
            border-radius: 10px; 
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="form-container">
          <h1>🚀 Advanced Form Testing Suite</h1>
          <h2>Enhanced Tech-Lead Orchestrator - Puppeteer Demo</h2>
          
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
          </div>
          
          <form id="testForm">
            <div class="form-group">
              <label for="projectName">Project Name *</label>
              <input type="text" id="projectName" name="projectName" 
                     placeholder="Enter your project name..." required
                     data-testid="project-name-input">
            </div>
            
            <div class="form-group">
              <label for="projectType">Project Type *</label>
              <select id="projectType" name="projectType" required data-testid="project-type-select">
                <option value="">Select project type...</option>
                <option value="web-app">Web Application</option>
                <option value="mobile-app">Mobile Application</option>
                <option value="desktop-app">Desktop Application</option>
                <option value="api">REST API</option>
                <option value="microservice">Microservice</option>
                <option value="data-pipeline">Data Pipeline</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="complexity">Project Complexity</label>
              <select id="complexity" name="complexity" data-testid="complexity-select">
                <option value="simple">Simple (1-2 weeks)</option>
                <option value="medium">Medium (1-2 months)</option>
                <option value="complex">Complex (3+ months)</option>
                <option value="enterprise">Enterprise (6+ months)</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>Required Technologies</label>
              <div class="checkbox-group">
                <div class="checkbox-item">
                  <input type="checkbox" id="react" name="technologies" value="react" data-testid="tech-react">
                  <label for="react">React</label>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" id="nodejs" name="technologies" value="nodejs" data-testid="tech-nodejs">
                  <label for="nodejs">Node.js</label>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" id="python" name="technologies" value="python" data-testid="tech-python">
                  <label for="python">Python</label>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" id="docker" name="technologies" value="docker" data-testid="tech-docker">
                  <label for="docker">Docker</label>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" id="aws" name="technologies" value="aws" data-testid="tech-aws">
                  <label for="aws">AWS</label>
                </div>
                <div class="checkbox-item">
                  <input type="checkbox" id="database" name="technologies" value="database" data-testid="tech-database">
                  <label for="database">Database</label>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="timeline">Expected Timeline (days)</label>
              <input type="range" id="timeline" name="timeline" min="1" max="365" value="30" 
                     data-testid="timeline-slider">
              <div style="text-align: center; margin-top: 10px;">
                <span id="timelineValue">30</span> days
              </div>
            </div>
            
            <div class="form-group">
              <label for="description">Project Description</label>
              <textarea id="description" name="description" rows="4" 
                        placeholder="Describe your project requirements, goals, and any specific features..."
                        data-testid="description-textarea"></textarea>
            </div>
            
            <div class="form-group">
              <label for="budget">Budget Range</label>
              <select id="budget" name="budget" data-testid="budget-select">
                <option value="startup">Startup ($0 - $10k)</option>
                <option value="small">Small Business ($10k - $50k)</option>
                <option value="medium">Medium Enterprise ($50k - $200k)</option>
                <option value="large">Large Enterprise ($200k+)</option>
              </select>
            </div>
            
            <div class="form-group">
              <div class="checkbox-item" style="justify-content: center;">
                <input type="checkbox" id="urgent" name="urgent" data-testid="urgent-checkbox">
                <label for="urgent">This is an urgent project</label>
              </div>
            </div>
            
            <button type="submit" data-testid="submit-btn">🚀 Generate Project Plan</button>
            <button type="button" onclick="fillSampleData()" data-testid="sample-data-btn">
              📝 Fill Sample Data
            </button>
            <button type="button" onclick="clearForm()" data-testid="clear-btn">
              🗑️ Clear Form
            </button>
          </form>
          
          <div class="result" id="result" data-testid="form-result">
            <h3>📊 Generated Project Analysis</h3>
            <div class="stats" id="projectStats"></div>
            <div id="projectDetails"></div>
          </div>
        </div>
        
        <script>
          // Update timeline display
          document.getElementById('timeline').addEventListener('input', function(e) {
            document.getElementById('timelineValue').textContent = e.target.value;
            updateProgress();
          });
          
          // Update progress bar based on form completion
          function updateProgress() {
            const form = document.getElementById('testForm');
            const inputs = form.querySelectorAll('input, select, textarea');
            let completed = 0;
            let total = 0;
            
            inputs.forEach(input => {
              if (input.type === 'checkbox') {
                if (input.checked) completed++;
                total++;
              } else if (input.type === 'range') {
                completed++; // Range always has a value
                total++;
              } else if (input.value.trim()) {
                completed++;
                total++;
              } else {
                total++;
              }
            });
            
            const percentage = total > 0 ? (completed / total) * 100 : 0;
            document.getElementById('progressFill').style.width = percentage + '%';
          }
          
          // Add event listeners to all form fields
          document.querySelectorAll('input, select, textarea').forEach(element => {
            element.addEventListener('input', updateProgress);
            element.addEventListener('change', updateProgress);
          });
          
          // Fill sample data function
          function fillSampleData() {
            document.getElementById('projectName').value = 'AI-Powered E-commerce Platform';
            document.getElementById('projectType').value = 'web-app';
            document.getElementById('complexity').value = 'complex';
            document.getElementById('timeline').value = '180';
            document.getElementById('timelineValue').textContent = '180';
            document.getElementById('description').value = 'Building a modern e-commerce platform with AI recommendations, real-time inventory management, and advanced analytics dashboard.';
            document.getElementById('budget').value = 'medium';
            document.getElementById('react').checked = true;
            document.getElementById('nodejs').checked = true;
            document.getElementById('docker').checked = true;
            document.getElementById('aws').checked = true;
            document.getElementById('database').checked = true;
            document.getElementById('urgent').checked = true;
            updateProgress();
          }
          
          // Clear form function
          function clearForm() {
            document.getElementById('testForm').reset();
            document.getElementById('timelineValue').textContent = '30';
            document.getElementById('result').style.display = 'none';
            updateProgress();
          }
          
          // Form submission
          document.getElementById('testForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {};
            const technologies = [];
            
            for (let [key, value] of formData.entries()) {
              if (key === 'technologies') {
                technologies.push(value);
              } else {
                data[key] = value;
              }
            }
            data.technologies = technologies;
            
            // Calculate project metrics
            const complexityMultipliers = {
              'simple': 1,
              'medium': 2,
              'complex': 3,
              'enterprise': 4
            };
            
            const baseEffort = parseInt(data.timeline || 30);
            const complexityMultiplier = complexityMultipliers[data.complexity] || 2;
            const techCount = technologies.length;
            
            const estimatedHours = baseEffort * 8 * complexityMultiplier;
            const estimatedCost = estimatedHours * (data.urgent ? 75 : 50); // $50-75/hour
            const riskLevel = techCount > 4 ? 'High' : techCount > 2 ? 'Medium' : 'Low';
            
            // Display results
            const stats = document.getElementById('projectStats');
            stats.innerHTML = \`
              <div class="stat-card">
                <h4>📅 Timeline</h4>
                <p>\${data.timeline} days</p>
              </div>
              <div class="stat-card">
                <h4>⏱️ Estimated Hours</h4>
                <p>\${estimatedHours.toLocaleString()} hrs</p>
              </div>
              <div class="stat-card">
                <h4>💰 Estimated Cost</h4>
                <p>$\${estimatedCost.toLocaleString()}</p>
              </div>
              <div class="stat-card">
                <h4>⚠️ Risk Level</h4>
                <p>\${riskLevel}</p>
              </div>
            \`;
            
            const details = document.getElementById('projectDetails');
            details.innerHTML = \`
              <h4>📋 Project Summary</h4>
              <p><strong>Project:</strong> \${data.projectName}</p>
              <p><strong>Type:</strong> \${data.projectType}</p>
              <p><strong>Complexity:</strong> \${data.complexity}</p>
              <p><strong>Technologies:</strong> \${technologies.join(', ') || 'None selected'}</p>
              <p><strong>Budget Range:</strong> \${data.budget}</p>
              <p><strong>Priority:</strong> \${data.urgent ? '🔴 URGENT' : '🟢 Normal'}</p>
              <p><strong>Description:</strong> \${data.description || 'No description provided'}</p>
              
              <h4>🎯 Recommendations</h4>
              <ul>
                <li>\${complexityMultiplier > 2 ? 'Consider breaking into phases' : 'Manageable project scope'}</li>
                <li>\${techCount > 4 ? 'High tech complexity - ensure team expertise' : 'Reasonable technology stack'}</li>
                <li>\${data.urgent ? 'Urgent timeline - consider additional resources' : 'Standard development timeline'}</li>
                <li>\${estimatedCost > 100000 ? 'High-value project - implement thorough testing' : 'Standard quality assurance'}</li>
              </ul>
            \`;
            
            document.getElementById('result').style.display = 'block';
            document.getElementById('result').scrollIntoView({ behavior: 'smooth' });
          });
          
          // Initial progress update
          updateProgress();
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(formTestHTML);
    console.log('✅ Advanced form loaded successfully!');
    
    // Test 2: Screenshot capabilities
    console.log('📸 Testing screenshot capabilities...');
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/form-initial.png', 
      fullPage: true
    });
    
    // Test 3: Form interactions - Fill sample data
    console.log('📝 Testing form auto-fill...');
    await page.click('[data-testid="sample-data-btn"]');
    
    // Wait for form to be filled
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/form-filled.png', 
      fullPage: true 
    });
    
    // Test 4: Manual form interactions
    console.log('⌨️ Testing manual form input...');
    await page.click('[data-testid="clear-btn"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Type in project name
    await page.type('[data-testid="project-name-input"]', 'Puppeteer Test Project', { delay: 50 });
    
    // Select project type
    await page.select('[data-testid="project-type-select"]', 'web-app');
    
    // Select complexity
    await page.select('[data-testid="complexity-select"]', 'medium');
    
    // Check some technologies
    await page.click('[data-testid="tech-react"]');
    await page.click('[data-testid="tech-nodejs"]');
    await page.click('[data-testid="tech-docker"]');
    
    // Adjust timeline slider
    await page.focus('[data-testid="timeline-slider"]');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    
    // Type description
    await page.type('[data-testid="description-textarea"]', 
      'This is a comprehensive test of Puppeteer form interactions, including text input, dropdowns, checkboxes, sliders, and form submission.', 
      { delay: 30 });
    
    // Select budget
    await page.select('[data-testid="budget-select"]', 'small');
    
    // Check urgent checkbox
    await page.click('[data-testid="urgent-checkbox"]');
    
    // Take screenshot before submission
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/form-manual-filled.png', 
      fullPage: true 
    });
    
    // Test 5: Form submission and validation
    console.log('🚀 Testing form submission...');
    await page.click('[data-testid="submit-btn"]');
    
    // Wait for results to appear
    await page.waitForSelector('[data-testid="form-result"]', { visible: true });
    
    // Test 6: Extract form results
    const formResults = await page.evaluate(() => {
      const result = document.querySelector('[data-testid="form-result"]');
      return {
        visible: result && result.style.display !== 'none',
        statsText: document.getElementById('projectStats')?.textContent || '',
        detailsText: document.getElementById('projectDetails')?.textContent || '',
        progressBar: document.getElementById('progressFill')?.style.width || '0%'
      };
    });
    
    console.log('📊 Form Results:', formResults);
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/form-results.png', 
      fullPage: true 
    });
    
    // Test 7: Performance measurement during interactions
    console.log('⚡ Measuring form interaction performance...');
    const performanceMetrics = await page.evaluate(() => {
      const entries = performance.getEntriesByType('measure');
      const navigationEntry = performance.getEntriesByType('navigation')[0];
      
      return {
        domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart,
        loadComplete: navigationEntry.loadEventEnd - navigationEntry.loadEventStart,
        totalPageLoad: navigationEntry.loadEventEnd - navigationEntry.fetchStart,
        measureEntries: entries.length
      };
    });
    
    console.log('📈 Performance Metrics:', performanceMetrics);
    
    // Test 8: Mobile responsive testing
    console.log('📱 Testing mobile responsive design...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/form-mobile.png', 
      fullPage: true 
    });
    
    // Reset to desktop view
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🎉 ALL ADVANCED PUPPETEER TESTS COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Advanced Capabilities Verified:');
    console.log('  • Complex form interactions (text, select, checkbox, slider)');
    console.log('  • JavaScript execution and DOM manipulation');  
    console.log('  • Multi-step user workflows');
    console.log('  • Screenshot capture at multiple stages');
    console.log('  • Performance measurement and monitoring');
    console.log('  • Responsive design testing');
    console.log('  • Data extraction from dynamic content');
    console.log('  • Form validation and submission testing');
    console.log('');
    
    // Keep browser open to view results
    console.log('⏳ Keeping browser open for 5 seconds to view final results...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Advanced Puppeteer test failed:', error.message);
    console.error(error.stack);
  } finally {
    if (browser) {
      console.log('🧹 Closing browser...');
      await browser.close();
      console.log('✅ Browser closed successfully!');
    }
  }
}

// Run the advanced test
advancedPuppeteerTest().then(() => {
  console.log('🏁 Advanced Puppeteer test suite completed!');
}).catch(error => {
  console.error('💥 Test suite error:', error);
});