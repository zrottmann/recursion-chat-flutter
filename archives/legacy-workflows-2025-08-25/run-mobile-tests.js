#!/usr/bin/env node

/**
 * Mobile Testing Suite Runner
 * Comprehensive mobile testing orchestrator for Slumlord ARPG
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class MobileTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      suites: [],
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        totalDuration: 0
      }
    };
    
    this.testSuites = [
      {
        name: 'Mobile Browser Tests',
        command: 'npx playwright test --config=mobile.config.js',
        timeout: 300000, // 5 minutes
        critical: true
      },
      {
        name: 'Mobile Performance Tests',
        command: 'node performance/mobile-performance.js',
        timeout: 600000, // 10 minutes
        critical: true
      },
      {
        name: 'Network Quality Tests',
        command: 'npx playwright test --config=network.config.js',
        timeout: 480000, // 8 minutes
        critical: false
      },
      {
        name: 'Mobile Load Tests',
        command: 'npx artillery run load-tests/mobile-multiplayer.yml',
        timeout: 900000, // 15 minutes
        critical: false
      }
    ];
  }

  async runAllTests() {
    console.log('🎮 Slumlord ARPG - Mobile Testing Suite');
    console.log('=====================================');
    console.log(`📅 Started: ${new Date().toLocaleString()}`);
    console.log(`🧪 Running ${this.testSuites.length} test suites\n`);

    const overallStart = Date.now();

    // Check prerequisites
    await this.checkPrerequisites();

    // Run each test suite
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    this.results.summary.totalDuration = Date.now() - overallStart;

    // Generate summary report
    await this.generateSummaryReport();
    this.displaySummary();
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check if node_modules exists
    try {
      await fs.access('node_modules');
      console.log('  ✅ Dependencies installed');
    } catch (error) {
      console.log('  ❌ Dependencies not found. Run: npm install');
      process.exit(1);
    }

    // Check if Playwright browsers are installed
    try {
      await this.runCommand('npx playwright --version', 10000);
      console.log('  ✅ Playwright available');
    } catch (error) {
      console.log('  ⚠️  Playwright not found. Run: npm run install:browsers');
    }

    // Check target URL accessibility
    const targetUrl = process.env.SLUMLORD_URL || 'https://slumlord.appwrite.network';
    console.log(`  🌐 Target URL: ${targetUrl}`);

    // Create test results directory
    await fs.mkdir('test-results', { recursive: true });
    console.log('  📁 Test results directory ready\n');
  }

  async runTestSuite(suite) {
    console.log(`🧪 Running: ${suite.name}`);
    console.log(`📋 Command: ${suite.command}`);
    
    const suiteStart = Date.now();
    let passed = false;
    let output = '';
    let error = '';

    try {
      const result = await this.runCommand(suite.command, suite.timeout);
      output = result.stdout;
      error = result.stderr;
      passed = result.exitCode === 0;
      
      console.log(passed ? '  ✅ PASSED' : '  ❌ FAILED');
      
    } catch (commandError) {
      error = commandError.message;
      console.log('  ❌ FAILED (timeout or error)');
    }

    const duration = Date.now() - suiteStart;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    console.log(`  ⏱️  Duration: ${minutes}m ${seconds}s\n`);

    // Record results
    this.results.suites.push({
      name: suite.name,
      command: suite.command,
      passed,
      duration,
      output: output.slice(-2000), // Keep last 2000 characters
      error: error.slice(-1000),    // Keep last 1000 characters
      critical: suite.critical,
      timestamp: new Date().toISOString()
    });

    this.results.summary.totalSuites++;
    if (passed) {
      this.results.summary.passedSuites++;
    } else {
      this.results.summary.failedSuites++;
      
      // Show error details for failed critical tests
      if (suite.critical && error) {
        console.log(`❌ Critical test failed: ${suite.name}`);
        console.log(`Error details: ${error.slice(-500)}\n`);
      }
    }
  }

  runCommand(command, timeout) {
    return new Promise((resolve, reject) => {
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      const child = spawn(cmd, args, {
        stdio: 'pipe',
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        // Show real-time output for long-running commands
        if (command.includes('performance') || command.includes('artillery')) {
          process.stdout.write('.');
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error(`Command timeout after ${timeout}ms: ${command}`));
      }, timeout);

      child.on('close', (exitCode) => {
        clearTimeout(timeoutId);
        resolve({
          stdout,
          stderr,
          exitCode
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
  }

  async generateSummaryReport() {
    const reportPath = path.join('test-results', 'mobile-testing-summary.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));

    // Generate HTML summary
    const htmlReport = this.generateHTMLSummary();
    const htmlPath = path.join('test-results', 'mobile-testing-summary.html');
    await fs.writeFile(htmlPath, htmlReport);
  }

  generateHTMLSummary() {
    const successRate = this.results.summary.totalSuites > 0 ? 
      (this.results.summary.passedSuites / this.results.summary.totalSuites * 100).toFixed(1) : 0;

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Slumlord ARPG - Mobile Testing Summary</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .suite { margin: 15px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #ccc; }
        .suite.passed { background: #d4edda; border-left-color: #28a745; }
        .suite.failed { background: #f8d7da; border-left-color: #dc3545; }
        .command { font-family: monospace; background: #e9ecef; padding: 8px; border-radius: 4px; margin: 8px 0; }
        .output { background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎮 Slumlord ARPG - Mobile Testing Summary</h1>
            <p>Generated: ${new Date(this.results.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.results.summary.totalSuites}</div>
                <div>Total Suites</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${this.results.summary.passedSuites}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${this.results.summary.failedSuites}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${successRate}%</div>
                <div>Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${Math.round(this.results.summary.totalDuration / 60000)}m</div>
                <div>Total Duration</div>
            </div>
        </div>

        <div class="suites">
            <h2>Test Suite Results</h2>
            ${this.results.suites.map(suite => `
                <div class="suite ${suite.passed ? 'passed' : 'failed'}">
                    <h3>${suite.passed ? '✅' : '❌'} ${suite.name} ${suite.critical ? '(Critical)' : ''}</h3>
                    <div class="command">${suite.command}</div>
                    <p><strong>Duration:</strong> ${Math.round(suite.duration / 1000)}s</p>
                    
                    ${suite.error ? `
                        <h4>Error Output:</h4>
                        <div class="output">${suite.error}</div>
                    ` : ''}
                    
                    ${suite.output && !suite.passed ? `
                        <h4>Command Output:</h4>
                        <div class="output">${suite.output}</div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  displaySummary() {
    const duration = this.results.summary.totalDuration;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    console.log('\n🎯 Mobile Testing Summary');
    console.log('=========================');
    console.log(`📊 Total Suites: ${this.results.summary.totalSuites}`);
    console.log(`✅ Passed: ${this.results.summary.passedSuites}`);
    console.log(`❌ Failed: ${this.results.summary.failedSuites}`);
    console.log(`📈 Success Rate: ${(this.results.summary.passedSuites / this.results.summary.totalSuites * 100).toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${minutes}m ${seconds}s`);
    
    console.log('\n📄 Reports Generated:');
    console.log('  📊 test-results/mobile-testing-summary.json');
    console.log('  🌐 test-results/mobile-testing-summary.html');
    
    const criticalFailures = this.results.suites.filter(s => !s.passed && s.critical);
    if (criticalFailures.length > 0) {
      console.log('\n🚨 Critical Test Failures:');
      criticalFailures.forEach(suite => {
        console.log(`  ❌ ${suite.name}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All critical tests passed!');
      process.exit(0);
    }
  }
}

// CLI interface
if (require.main === module) {
  const runner = new MobileTestRunner();
  
  // Handle command line arguments
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🎮 Slumlord ARPG - Mobile Testing Suite Runner

Usage: node run-mobile-tests.js [options]

Options:
  --help, -h              Show this help message
  
Environment Variables:
  SLUMLORD_URL           Target URL for testing (default: https://slumlord.appwrite.network)
  HEADED                 Run tests in headed mode for debugging
  
Examples:
  node run-mobile-tests.js                    # Run all tests
  HEADED=true node run-mobile-tests.js        # Run with visible browser
  SLUMLORD_URL=http://localhost:5173 node run-mobile-tests.js  # Test local dev
`);
    process.exit(0);
  }
  
  runner.runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = MobileTestRunner;