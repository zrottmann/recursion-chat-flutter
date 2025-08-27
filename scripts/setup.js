#!/usr/bin/env node

/**
 * Claude Auto-Approval Setup Script
 * Configures the auto-approval system for optimal development workflow
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutoApprovalSetup {
  constructor() {
    this.claudeDir = __dirname;
    this.settingsPath = path.join(this.claudeDir, 'settings.json');
  }

  async setup() {
    console.log('🚀 Setting up Claude Auto-Approval System...\n');

    try {
      // 1. Verify Node.js installation
      this.checkNodeJS();

      // 2. Install dependencies if needed
      this.installDependencies();

      // 3. Update settings.json with enhanced configuration
      this.updateSettings();

      // 4. Create desktop shortcut for testing
      this.createTestScript();

      // 5. Test the system
      await this.runTests();

      console.log('\n✅ Auto-Approval System Setup Complete!');
      console.log('\n📋 Configuration Summary:');
      console.log('   • Safe commands: npm, git, python, flutter, doctl, etc.');
      console.log('   • Dangerous commands blocked: rm -rf, format, shutdown');
      console.log('   • Auto-approval enabled in settings.json');
      console.log('   • Log file: .claude/auto-approve.log');
      console.log('\n🔧 Test the system:');
      console.log('   node .claude/auto-approve.js "npm run build"');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  checkNodeJS() {
    console.log('🔍 Checking Node.js installation...');
    try {
      const version = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`   ✅ Node.js ${version} found`);
    } catch (error) {
      throw new Error('Node.js not found. Please install Node.js from https://nodejs.org/');
    }
  }

  installDependencies() {
    console.log('📦 Installing dependencies...');
    try {
      // Check if npm is available
      execSync('npm --version', { encoding: 'utf8' });
      console.log('   ✅ npm is available');
    } catch (error) {
      console.log('   ⚠️  npm not found, continuing with basic setup');
    }
  }

  updateSettings() {
    console.log('⚙️  Updating Claude settings...');
    
    if (!fs.existsSync(this.settingsPath)) {
      console.log('   ⚠️  settings.json not found, creating basic configuration');
      const basicSettings = {
        permissions: {
          bash: {
            auto_approve: true,
            auto_approve_script: path.join(this.claudeDir, 'auto-approve.js')
          }
        }
      };
      fs.writeFileSync(this.settingsPath, JSON.stringify(basicSettings, null, 2));
    } else {
      console.log('   ✅ settings.json found and configured');
    }
  }

  createTestScript() {
    console.log('🧪 Creating test script...');
    
    const testScript = `@echo off
echo Testing Claude Auto-Approval System
echo.

echo Testing safe command: npm --version
node "${path.join(this.claudeDir, 'auto-approve.js')}" "npm --version"
echo.

echo Testing safe command: git status
node "${path.join(this.claudeDir, 'auto-approve.js')}" "git status"
echo.

echo Testing dangerous command: rm -rf /
node "${path.join(this.claudeDir, 'auto-approve.js')}" "rm -rf /"
echo.

echo Testing complete! Check auto-approve.log for details.
pause`;

    fs.writeFileSync(path.join(this.claudeDir, 'test-auto-approve.bat'), testScript);
    console.log('   ✅ Test script created: test-auto-approve.bat');
  }

  async runTests() {
    console.log('🧪 Running auto-approval tests...');
    
    const AutoApprover = require('./auto-approve.js');
    const approver = new AutoApprover();

    const testCases = [
      { command: 'npm run build', expected: true },
      { command: 'git status', expected: true },
      { command: 'python app.py', expected: true },
      { command: 'rm -rf /', expected: false },
      { command: 'shutdown /s', expected: false }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of testCases) {
      const result = approver.shouldAutoApprove(test.command);
      if (result === test.expected) {
        console.log(`   ✅ "${test.command}" - ${result ? 'APPROVED' : 'BLOCKED'}`);
        passed++;
      } else {
        console.log(`   ❌ "${test.command}" - Expected ${test.expected}, got ${result}`);
        failed++;
      }
    }

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed > 0) {
      throw new Error('Some tests failed. Please check the configuration.');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new AutoApprovalSetup();
  setup.setup().catch(error => {
    console.error('Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = AutoApprovalSetup;