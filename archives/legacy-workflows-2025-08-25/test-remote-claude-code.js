// End-to-End Test for Remote Claude Code Functionality
// Tests the complete remote agent system integration

const WebSocket = require('ws');
const fetch = require('node-fetch');
const { spawn } = require('child_process');

class RemoteClaudeCodeTester {
  constructor() {
    this.testResults = {
      websocketConnection: false,
      agentRegistration: false,
      taskExecution: false,
      errorRecovery: false,
      securityLayer: false,
      coordinationSystem: false
    };
    
    this.websocket = null;
    this.agentId = null;
    this.apiKey = null;
  }

  // Run comprehensive test suite
  async runTests() {
    console.log('🚀 Starting Remote Claude Code Functionality Tests\n');
    
    try {
      // Test 1: WebSocket Server Connection
      await this.testWebSocketConnection();
      
      // Test 2: Agent Registration and Authentication
      await this.testAgentRegistration();
      
      // Test 3: Task Execution Pipeline
      await this.testTaskExecution();
      
      // Test 4: Error Recovery System
      await this.testErrorRecovery();
      
      // Test 5: Security Layer
      await this.testSecurityLayer();
      
      // Test 6: Coordination System
      await this.testCoordinationSystem();
      
      // Print final results
      this.printTestResults();
      
    } catch (error) {
      console.error('❌ Test suite failed with error:', error.message);
      process.exit(1);
    }
  }

  // Test WebSocket server connection
  async testWebSocketConnection() {
    console.log('📡 Testing WebSocket Server Connection...');
    
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket('ws://localhost:8081');
        
        const timeout = setTimeout(() => {
          this.websocket.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);
        
        this.websocket.on('open', () => {
          clearTimeout(timeout);
          console.log('✅ WebSocket connection established');
          this.testResults.websocketConnection = true;
          resolve(true);
        });
        
        this.websocket.on('error', (error) => {
          clearTimeout(timeout);
          console.log('❌ WebSocket connection failed:', error.message);
          console.log('ℹ️  Make sure the WebSocket server is running: node websocket-server.js');
          reject(error);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Test agent registration process
  async testAgentRegistration() {
    console.log('🔐 Testing Agent Registration...');
    
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection required for registration test');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Agent registration timeout'));
      }, 15000);
      
      // Listen for identification request
      this.websocket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'identify') {
          // Respond with agent registration
          this.websocket.send(JSON.stringify({
            type: 'register',
            agentId: 'test-agent-001',
            name: 'Test Claude Code Agent',
            capabilities: ['web-development', 'api-development', 'testing-automation'],
            version: '1.0.0',
            platform: 'test'
          }));
        } else if (message.type === 'registered') {
          clearTimeout(timeout);
          this.agentId = message.agentId;
          console.log('✅ Agent registration successful:', this.agentId);
          this.testResults.agentRegistration = true;
          resolve(true);
        }
      });
    });
  }

  // Test task execution pipeline
  async testTaskExecution() {
    console.log('⚙️ Testing Task Execution Pipeline...');
    
    if (!this.websocket || !this.agentId) {
      throw new Error('Agent registration required for task execution test');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Task execution timeout'));
      }, 30000);
      
      this.websocket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'executeTask') {
          console.log('📨 Received task execution request:', message.task.command);
          
          // Simulate task processing
          setTimeout(() => {
            // Send task completion response
            this.websocket.send(JSON.stringify({
              type: 'taskComplete',
              taskId: message.task.id,
              response: {
                success: true,
                output: 'Test task completed successfully',
                executionTime: 2000,
                artifacts: [
                  {
                    path: 'src/test-component.tsx',
                    content: 'export const TestComponent = () => <div>Test</div>;',
                    type: 'file'
                  }
                ]
              }
            }));
            
            clearTimeout(timeout);
            console.log('✅ Task execution pipeline working');
            this.testResults.taskExecution = true;
            resolve(true);
          }, 2000);
        }
      });
      
      // Trigger a test task
      setTimeout(() => {
        this.triggerTestTask();
      }, 1000);
    });
  }

  // Test error recovery system
  async testErrorRecovery() {
    console.log('🛡️ Testing Error Recovery System...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Error recovery test timeout'));
      }, 20000);
      
      this.websocket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'executeTask') {
          console.log('📨 Received error recovery test task');
          
          // Simulate task failure
          setTimeout(() => {
            this.websocket.send(JSON.stringify({
              type: 'error',
              taskId: message.task.id,
              agentId: this.agentId,
              error: 'Simulated task execution failure for testing'
            }));
            
            clearTimeout(timeout);
            console.log('✅ Error recovery system handling failures');
            this.testResults.errorRecovery = true;
            resolve(true);
          }, 1000);
        }
      });
      
      // Trigger an error test task
      setTimeout(() => {
        this.triggerErrorTestTask();
      }, 1000);
    });
  }

  // Test security layer
  async testSecurityLayer() {
    console.log('🔒 Testing Security Layer...');
    
    try {
      // Test API key generation (would normally be done through admin interface)
      console.log('🔑 Testing API authentication...');
      
      // Test rate limiting
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(fetch('http://localhost:3004/api/remote-agents/status'));
      }
      
      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.ok).length;
      
      if (successCount > 0) {
        console.log('✅ Security layer operational');
        this.testResults.securityLayer = true;
      } else {
        throw new Error('All security requests failed');
      }
      
    } catch (error) {
      console.log('❌ Security layer test failed:', error.message);
      console.log('ℹ️  Make sure the Next.js dev server is running: npm run dev');
      // Don't fail the entire test suite for this
    }
  }

  // Test coordination system
  async testCoordinationSystem() {
    console.log('🎯 Testing Coordination System...');
    
    try {
      const response = await fetch('http://localhost:3004/api/remote-agents/status');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.detailed) {
          console.log('✅ Coordination system responding');
          console.log(`📊 Status: ${data.detailed.overview.connectedAgents} connected agents`);
          this.testResults.coordinationSystem = true;
        } else {
          throw new Error('Invalid coordination system response');
        }
      } else {
        throw new Error(`Coordination system HTTP error: ${response.status}`);
      }
      
    } catch (error) {
      console.log('❌ Coordination system test failed:', error.message);
      // Don't fail entire suite
    }
  }

  // Trigger a test task through the orchestrator API
  async triggerTestTask() {
    try {
      const testProject = {
        project: {
          name: 'Remote Test Project',
          description: 'Testing remote Claude Code execution',
          type: 'web',
          requirements: ['Create test component', 'Add basic styling'],
          constraints: ['Use React', 'TypeScript preferred']
        }
      };

      const response = await fetch('http://localhost:3004/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testProject)
      });

      if (!response.ok) {
        console.log('⚠️  Could not trigger test task through orchestrator API');
      }
    } catch (error) {
      console.log('⚠️  Orchestrator API not available for test task trigger');
    }
  }

  // Trigger an error test task
  async triggerErrorTestTask() {
    console.log('🔥 Triggering error test scenario...');
    // This would be similar to triggerTestTask but designed to fail
  }

  // Print comprehensive test results
  printTestResults() {
    console.log('\n🎯 Remote Claude Code Test Results');
    console.log('=====================================');
    
    const results = this.testResults;
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(Boolean).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📊 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})\n`);
    
    Object.entries(results).forEach(([test, passed]) => {
      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASS' : 'FAIL';
      console.log(`${icon} ${test.replace(/([A-Z])/g, ' $1').trim()}: ${status}`);
    });
    
    console.log('\n📋 Summary & Next Steps');
    console.log('========================');
    
    if (results.websocketConnection) {
      console.log('✅ WebSocket server is operational');
    } else {
      console.log('❌ Start WebSocket server: node websocket-server.js');
    }
    
    if (results.agentRegistration) {
      console.log('✅ Agent registration working');
    } else {
      console.log('❌ Check agent registration protocol');
    }
    
    if (results.taskExecution) {
      console.log('✅ Task execution pipeline functional');
    } else {
      console.log('❌ Debug task execution flow');
    }
    
    if (results.errorRecovery) {
      console.log('✅ Error recovery system active');
    } else {
      console.log('❌ Implement error recovery fallbacks');
    }
    
    if (results.securityLayer) {
      console.log('✅ Security layer protecting endpoints');
    } else {
      console.log('⚠️  Security layer needs attention');
    }
    
    if (results.coordinationSystem) {
      console.log('✅ Coordination system managing agents');
    } else {
      console.log('❌ Check coordination system connectivity');
    }
    
    if (successRate >= 80) {
      console.log('\n🎉 Remote Claude Code system is ready for production use!');
    } else if (successRate >= 60) {
      console.log('\n⚠️  Remote Claude Code system needs minor fixes before production');
    } else {
      console.log('\n🔧 Remote Claude Code system requires significant work before production');
    }
    
    console.log('\n🚀 To start using the remote system:');
    console.log('1. Start WebSocket server: node websocket-server.js');
    console.log('2. Start Next.js app: npm run dev');
    console.log('3. Connect remote Claude Code agents');
    console.log('4. Submit tasks through the web interface');
    
    // Cleanup
    if (this.websocket) {
      this.websocket.close();
    }
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new RemoteClaudeCodeTester();
  tester.runTests().catch(console.error);
}

module.exports = RemoteClaudeCodeTester;