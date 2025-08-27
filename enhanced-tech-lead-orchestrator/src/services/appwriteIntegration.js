/**
 * Appwrite Functions Integration Layer
 * Connects orchestrator to working Appwrite functions
 * Enhanced with ULTRATHINK diagnostic logging
 */

import { diagnostics } from './diagnostics.js';

export class AppwriteIntegration {
  constructor() {
    this.endpoint = 'https://nyc.cloud.appwrite.io/v1';
    this.projectId = '68a4e3da0022f3e129d0';
    // For now, monitor via public endpoints - this is a known limitation
    this.apiKey = process.env.APPWRITE_API_KEY || null;
    this.functions = {
      'grok-api': 'grok-api',
      'github-cli': 'github-cli', 
      'claude-cli': 'claude-cli',
      'appwrite-cli': 'appwrite-cli',
      'orchestrator': 'orchestrator',
      'cli-executor': 'cli-executor',
      'real-deploy': 'real-deploy'
    };
  }

  async executeFunction(functionId, payload = {}) {
    const startTime = Date.now();
    
    try {
      diagnostics.info('APPWRITE', `🚀 Executing ${functionId}`, { payload, functionId });
      
      const headers = {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': this.projectId
      };
      
      // Add API key if available for authenticated requests
      if (this.apiKey) {
        headers['X-Appwrite-Key'] = this.apiKey;
      }
      
      const response = await fetch(
        `${this.endpoint}/functions/${functionId}/executions`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }
      );

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        diagnostics.error('APPWRITE', `Function ${functionId} HTTP error`, { 
          status: response.status, 
          statusText: response.statusText,
          responseTime,
          payload
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const execution = await response.json();
      diagnostics.success('APPWRITE', `${functionId} execution started`, { 
        executionId: execution.$id,
        responseTime 
      });
      
      // Wait for execution to complete with diagnostic monitoring
      const result = await diagnostics.monitorExecution(execution.$id, functionId);
      
      if (result.success) {
        diagnostics.success('APPWRITE', `${functionId} completed successfully`, { 
          executionTime: result.executionTime,
          attempts: result.attempts
        });
      } else {
        diagnostics.error('APPWRITE', `${functionId} execution failed`, {
          error: result.error,
          executionTime: result.executionTime,
          attempts: result.attempts
        });
      }
      
      return result;
      
    } catch (error) {
      diagnostics.error('APPWRITE', `Error executing ${functionId}`, { 
        error: error.message, 
        stack: error.stack,
        payload
      });
      throw error;
    }
  }


  // Specific function wrappers
  async callGrokAPI(prompt, context = {}) {
    return this.executeFunction('grok-api', { prompt, context });
  }

  // Enhanced full app development pipeline
  async createFullApp(userRequest, options = {}) {
    console.log(`🚀 Starting full app development pipeline for: "${userRequest}"`);
    
    const context = {
      execute_pipeline: true,
      create_repo: true,
      setup_appwrite: true,
      deploy_app: true,
      ...options
    };
    
    return this.executeFunction('grok-api', { 
      prompt: userRequest, 
      context 
    });
  }

  async executeGitHubCommand(command, options = {}) {
    return this.executeFunction('github-cli', { command, options });
  }

  async executeClaudeCommand(prompt, options = {}) {
    return this.executeFunction('claude-cli', { prompt, options });
  }

  async executeAppwriteCommand(command, options = {}) {
    return this.executeFunction('appwrite-cli', { command, options });
  }

  async orchestrateWorkflow(workflow, options = {}) {
    return this.executeFunction('orchestrator', { workflow, options });
  }

  async executeCLICommand(command, options = {}) {
    return this.executeFunction('cli-executor', { command, options });
  }

  async deployProject(config, options = {}) {
    return this.executeFunction('real-deploy', { config, options });
  }

  // Comprehensive health check using diagnostics
  async healthCheck() {
    diagnostics.info('APPWRITE', '🏥 Starting comprehensive health check...');
    
    const diagnosticResults = await diagnostics.runFullDiagnostics();
    
    return {
      ...diagnosticResults,
      diagnostic_report: diagnostics.generateReport()
    };
  }

  // Quick individual function test
  async testFunction(functionId, testPayload = { test: true }) {
    diagnostics.info('APPWRITE', `🧪 Testing individual function: ${functionId}`);
    
    try {
      const result = await this.executeFunction(functionId, testPayload);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const appwriteIntegration = new AppwriteIntegration();