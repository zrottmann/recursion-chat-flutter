// Error Recovery System for Remote Claude Code Operations
// Handles errors, implements fallback mechanisms, and provides resilient operation

import { EventEmitter } from 'events';
import { claudeCodeAPI, ClaudeCodeTask, ClaudeCodeResponse } from './claude-code-api';
import { remoteAgentCoordinator } from './remote-agent-coordinator';

export interface ErrorContext {
  taskId: string;
  agentId?: string;
  operation: string;
  timestamp: Date;
  retryCount: number;
  errorType: ErrorType;
  originalError: Error;
  metadata?: Record<string, any>;
}

export type ErrorType = 
  | 'network_timeout'
  | 'agent_disconnected' 
  | 'authentication_failed'
  | 'rate_limit_exceeded'
  | 'claude_api_error'
  | 'task_execution_failed'
  | 'resource_unavailable'
  | 'invalid_response'
  | 'system_overload'
  | 'unknown_error';

export interface FallbackStrategy {
  name: string;
  description: string;
  canHandle: (error: ErrorContext) => boolean;
  execute: (error: ErrorContext, task: ClaudeCodeTask) => Promise<ClaudeCodeResponse>;
  priority: number;
  maxRetries: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
}

export class ErrorRecoverySystem extends EventEmitter {
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private errorHistory: ErrorContext[] = [];
  private retryConfig: RetryConfig;
  private circuitBreakerConfig: CircuitBreakerConfig;
  private healthChecks: Map<string, HealthCheck> = new Map();

  constructor() {
    super();
    
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: [
        'network_timeout',
        'agent_disconnected',
        'rate_limit_exceeded',
        'resource_unavailable',
        'system_overload'
      ]
    };

    this.circuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringWindow: 300000 // 5 minutes
    };

    this.initializeFallbackStrategies();
    this.startHealthMonitoring();
  }

  // Execute task with error recovery
  async executeWithRecovery(task: ClaudeCodeTask): Promise<ClaudeCodeResponse> {
    const maxRetries = this.retryConfig.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check circuit breaker
        if (this.isCircuitOpen(task.id)) {
          throw new Error('Circuit breaker is open for this operation');
        }

        // Try primary execution
        const response = await this.tryPrimaryExecution(task);
        
        // Success - reset circuit breaker
        this.recordSuccess(task.id);
        
        return response;

      } catch (error) {
        lastError = error as Error;
        
        const errorContext: ErrorContext = {
          taskId: task.id,
          operation: 'primary_execution',
          timestamp: new Date(),
          retryCount: attempt,
          errorType: this.classifyError(error as Error),
          originalError: error as Error,
          metadata: { attempt, taskCommand: task.command }
        };

        // Record error for circuit breaker
        this.recordFailure(task.id);
        
        // Log error
        this.logError(errorContext);

        // Try fallback strategies
        if (attempt === maxRetries) {
          const fallbackResponse = await this.tryFallbackStrategies(errorContext, task);
          if (fallbackResponse) {
            return fallbackResponse;
          }
        } else if (this.isRetryable(errorContext.errorType)) {
          // Wait before retry
          const delay = this.calculateRetryDelay(attempt);
          await this.sleep(delay);
          continue;
        } else {
          // Non-retryable error, try fallback immediately
          const fallbackResponse = await this.tryFallbackStrategies(errorContext, task);
          if (fallbackResponse) {
            return fallbackResponse;
          }
          break;
        }
      }
    }

    // All attempts failed
    throw new Error(`Task execution failed after ${maxRetries + 1} attempts: ${lastError?.message}`);
  }

  // Try primary execution (remote agents first)
  private async tryPrimaryExecution(task: ClaudeCodeTask): Promise<ClaudeCodeResponse> {
    // Check if remote agents are available
    const agentStatus = await claudeCodeAPI.getRemoteAgentStatus();
    const availableAgents = agentStatus.filter(agent => agent.status === 'connected').length;
    
    if (availableAgents > 0) {
      return await claudeCodeAPI.executeTask(task);
    } else {
      throw new Error('No remote agents available');
    }
  }

  // Try fallback strategies in order of priority
  private async tryFallbackStrategies(
    errorContext: ErrorContext, 
    task: ClaudeCodeTask
  ): Promise<ClaudeCodeResponse | null> {
    const applicableStrategies = Array.from(this.fallbackStrategies.values())
      .filter(strategy => strategy.canHandle(errorContext))
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of applicableStrategies) {
      try {
        console.log(`Trying fallback strategy: ${strategy.name}`);
        
        const response = await strategy.execute(errorContext, task);
        
        this.emit('fallbackSuccess', {
          strategy: strategy.name,
          taskId: task.id,
          originalError: errorContext.errorType
        });
        
        return response;

      } catch (fallbackError) {
        console.warn(`Fallback strategy ${strategy.name} failed:`, fallbackError);
        
        this.emit('fallbackFailed', {
          strategy: strategy.name,
          taskId: task.id,
          error: fallbackError
        });
      }
    }

    return null;
  }

  // Initialize built-in fallback strategies
  private initializeFallbackStrategies() {
    // Local execution fallback
    this.fallbackStrategies.set('local_execution', {
      name: 'local_execution',
      description: 'Execute task locally when remote agents are unavailable',
      priority: 100,
      maxRetries: 1,
      canHandle: (error) => [
        'agent_disconnected',
        'network_timeout',
        'resource_unavailable'
      ].includes(error.errorType),
      execute: async (error, task) => {
        console.log('Falling back to simulated execution');
        return await claudeCodeAPI.executeTask(task);
      }
    });

    // Simplified task fallback
    this.fallbackStrategies.set('simplified_task', {
      name: 'simplified_task',
      description: 'Simplify task requirements and retry',
      priority: 80,
      maxRetries: 1,
      canHandle: (error) => [
        'task_execution_failed',
        'claude_api_error',
        'system_overload'
      ].includes(error.errorType),
      execute: async (error, task) => {
        console.log('Simplifying task and retrying');
        
        const simplifiedTask: ClaudeCodeTask = {
          ...task,
          command: this.simplifyTaskCommand(task.command),
          timeout: Math.max(task.timeout || 60000, 60000), // Minimum 1 minute
          priority: 'low' // Lower priority for simplified tasks
        };
        
        return await claudeCodeAPI.executeTask(simplifiedTask);
      }
    });

    // Mock response fallback
    this.fallbackStrategies.set('mock_response', {
      name: 'mock_response',
      description: 'Generate mock response when all else fails',
      priority: 50,
      maxRetries: 1,
      canHandle: (error) => true, // Can handle any error as last resort
      execute: async (error, task) => {
        console.log('Generating mock response as last resort');
        
        return {
          taskId: task.id,
          success: false,
          output: this.generateMockOutput(task),
          error: `Mock response generated due to: ${error.errorType}`,
          executionTime: 1000,
          agentId: 'mock'
        };
      }
    });

    // Queue for later fallback
    this.fallbackStrategies.set('queue_for_later', {
      name: 'queue_for_later',
      description: 'Queue task for later execution when system recovers',
      priority: 60,
      maxRetries: 1,
      canHandle: (error) => [
        'system_overload',
        'rate_limit_exceeded',
        'resource_unavailable'
      ].includes(error.errorType),
      execute: async (error, task) => {
        console.log('Queueing task for later execution');
        
        // Add to queue with delay
        setTimeout(async () => {
          try {
            await this.executeWithRecovery(task);
          } catch (queueError) {
            console.error('Queued task execution failed:', queueError);
          }
        }, 60000); // Retry after 1 minute
        
        return {
          taskId: task.id,
          success: true,
          output: 'Task queued for later execution',
          executionTime: 100,
          agentId: 'queue'
        };
      }
    });
  }

  // Classify error type
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) {
      return 'network_timeout';
    } else if (message.includes('disconnected') || message.includes('connection')) {
      return 'agent_disconnected';
    } else if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'authentication_failed';
    } else if (message.includes('rate limit')) {
      return 'rate_limit_exceeded';
    } else if (message.includes('claude') || message.includes('api')) {
      return 'claude_api_error';
    } else if (message.includes('execution') || message.includes('command')) {
      return 'task_execution_failed';
    } else if (message.includes('resource') || message.includes('unavailable')) {
      return 'resource_unavailable';
    } else if (message.includes('response') || message.includes('invalid')) {
      return 'invalid_response';
    } else if (message.includes('overload') || message.includes('busy')) {
      return 'system_overload';
    } else {
      return 'unknown_error';
    }
  }

  // Check if error type is retryable
  private isRetryable(errorType: ErrorType): boolean {
    return this.retryConfig.retryableErrors.includes(errorType);
  }

  // Calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * 
                  Math.pow(this.retryConfig.backoffMultiplier, attempt);
    
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  // Sleep for specified duration
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Simplify task command for fallback
  private simplifyTaskCommand(command: string): string {
    // Remove complex flags and simplify prompt
    let simplified = command
      .replace(/--files\s+[^\s]+/g, '') // Remove file specifications
      .replace(/--mode\s+[^\s]+/g, '--mode create') // Simplify to create mode
      .replace(/--model\s+[^\s]+/g, '') // Remove model specification
      .replace(/complex|advanced|comprehensive/gi, 'simple') // Simplify language
      .replace(/production-ready|enterprise-grade/gi, 'basic'); // Lower expectations

    return simplified;
  }

  // Generate mock output for task
  private generateMockOutput(task: ClaudeCodeTask): string {
    return `# Mock Implementation
    
This is a mock implementation generated due to system failure.
The original task was: ${task.command}

Please review and implement manually when the system recovers.

## Task Details
- ID: ${task.id}
- Priority: ${task.priority}
- Timeout: ${task.timeout}ms

## Next Steps
1. Wait for system recovery
2. Re-submit the original task
3. Review and implement the actual solution
`;
  }

  // Circuit breaker implementation
  private isCircuitOpen(operationId: string): boolean {
    const state = this.circuitBreakers.get(operationId);
    if (!state) return false;

    const now = Date.now();
    
    if (state.state === 'open') {
      // Check if we should attempt to close
      if (now - state.lastFailureTime > this.circuitBreakerConfig.resetTimeout) {
        state.state = 'half-open';
        this.circuitBreakers.set(operationId, state);
        return false;
      }
      return true;
    }

    return false;
  }

  private recordSuccess(operationId: string) {
    const state = this.circuitBreakers.get(operationId);
    if (state) {
      state.consecutiveFailures = 0;
      state.state = 'closed';
      this.circuitBreakers.set(operationId, state);
    }
  }

  private recordFailure(operationId: string) {
    let state = this.circuitBreakers.get(operationId);
    if (!state) {
      state = {
        state: 'closed',
        consecutiveFailures: 0,
        lastFailureTime: 0
      };
    }

    state.consecutiveFailures++;
    state.lastFailureTime = Date.now();

    if (state.consecutiveFailures >= this.circuitBreakerConfig.failureThreshold) {
      state.state = 'open';
      
      this.emit('circuitBreakerOpened', {
        operationId,
        failures: state.consecutiveFailures
      });
    }

    this.circuitBreakers.set(operationId, state);
  }

  // Log error
  private logError(error: ErrorContext) {
    this.errorHistory.push(error);
    
    // Keep only last 1000 errors
    if (this.errorHistory.length > 1000) {
      this.errorHistory.shift();
    }

    this.emit('errorRecorded', error);
    
    console.error(`[ERROR RECOVERY] ${error.errorType}: ${error.originalError.message}`, {
      taskId: error.taskId,
      agentId: error.agentId,
      retryCount: error.retryCount,
      operation: error.operation
    });
  }

  // Start health monitoring
  private startHealthMonitoring() {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  // Perform health checks
  private async performHealthChecks() {
    const checks = [
      this.checkRemoteAgentHealth(),
      this.checkSystemResources(),
      this.checkCircuitBreakers()
    ];

    const results = await Promise.allSettled(checks);
    
    this.emit('healthCheckCompleted', {
      timestamp: new Date(),
      results: results.map((result, index) => ({
        check: ['remote_agents', 'system_resources', 'circuit_breakers'][index],
        status: result.status,
        value: result.status === 'fulfilled' ? result.value : result.reason
      }))
    });
  }

  private async checkRemoteAgentHealth(): Promise<any> {
    const agents = await claudeCodeAPI.getRemoteAgentStatus();
    const total = agents.length;
    const connected = agents.filter(a => a.status === 'connected').length;
    
    return {
      totalAgents: total,
      connectedAgents: connected,
      healthRatio: total > 0 ? connected / total : 0
    };
  }

  private async checkSystemResources(): Promise<any> {
    // Basic resource checks
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        utilization: memUsage.heapUsed / memUsage.heapTotal
      },
      cpu: cpuUsage,
      uptime: process.uptime()
    };
  }

  private async checkCircuitBreakers(): Promise<any> {
    const openCircuits = Array.from(this.circuitBreakers.entries())
      .filter(([_, state]) => state.state === 'open').length;
    
    return {
      totalCircuits: this.circuitBreakers.size,
      openCircuits,
      healthRatio: this.circuitBreakers.size > 0 ? 
        (this.circuitBreakers.size - openCircuits) / this.circuitBreakers.size : 1
    };
  }

  // Get error statistics
  getErrorStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    const recentErrors = this.errorHistory.filter(
      error => now - error.timestamp.getTime() < oneHour
    );

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.errorType] = (acc[error.errorType] || 0) + 1;
      return acc;
    }, {} as Record<ErrorType, number>);

    return {
      totalErrors: this.errorHistory.length,
      recentErrors: recentErrors.length,
      errorsByType,
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      availableFallbacks: this.fallbackStrategies.size,
      timestamp: new Date().toISOString()
    };
  }

  // Add custom fallback strategy
  addFallbackStrategy(strategy: FallbackStrategy) {
    this.fallbackStrategies.set(strategy.name, strategy);
    this.emit('fallbackStrategyAdded', strategy);
  }

  // Remove fallback strategy
  removeFallbackStrategy(name: string) {
    const removed = this.fallbackStrategies.delete(name);
    if (removed) {
      this.emit('fallbackStrategyRemoved', name);
    }
    return removed;
  }

  // Update retry configuration
  updateRetryConfig(config: Partial<RetryConfig>) {
    this.retryConfig = { ...this.retryConfig, ...config };
    this.emit('retryConfigUpdated', this.retryConfig);
  }

  // Update circuit breaker configuration
  updateCircuitBreakerConfig(config: Partial<CircuitBreakerConfig>) {
    this.circuitBreakerConfig = { ...this.circuitBreakerConfig, ...config };
    this.emit('circuitBreakerConfigUpdated', this.circuitBreakerConfig);
  }
}

// Circuit breaker state interface
interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  consecutiveFailures: number;
  lastFailureTime: number;
}

// Health check interface
interface HealthCheck {
  name: string;
  lastCheck: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: any;
}

// Export singleton instance
export const errorRecoverySystem = new ErrorRecoverySystem();