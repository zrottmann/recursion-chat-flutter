// Remote Agent Coordination System
// Manages distributed Claude Code agents with advanced task routing and monitoring

import { EventEmitter } from 'events';
import { claudeCodeAPI, ClaudeCodeTask, ClaudeCodeResponse, RemoteAgentStatus } from './claude-code-api';

export interface TaskExecutionPlan {
  id: string;
  tasks: ClaudeCodeTask[];
  dependencies: Map<string, string[]>;
  priority: 'high' | 'medium' | 'low';
  estimatedDuration: number;
  requiredCapabilities: string[];
  parallelizable: boolean;
}

export interface ExecutionResult {
  planId: string;
  success: boolean;
  results: Map<string, ClaudeCodeResponse>;
  errors: Map<string, Error>;
  executionTime: number;
  agentsUsed: string[];
}

export interface AgentCapability {
  name: string;
  description: string;
  requirements: string[];
}

export interface TaskRoutingStrategy {
  strategy: 'round-robin' | 'load-balanced' | 'capability-matched' | 'priority-weighted';
  parameters?: Record<string, any>;
}

export class RemoteAgentCoordinator extends EventEmitter {
  private executionPlans: Map<string, TaskExecutionPlan> = new Map();
  private activeExecutions: Map<string, ExecutionResult> = new Map();
  private agentCapabilities: Map<string, AgentCapability[]> = new Map();
  private routingStrategy: TaskRoutingStrategy = { strategy: 'capability-matched' };
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    super();
    this.initializeCapabilities();
    this.startPerformanceMonitoring();
  }

  // Initialize standard agent capabilities
  private initializeCapabilities() {
    const standardCapabilities: AgentCapability[] = [
      {
        name: 'web-development',
        description: 'Full-stack web application development',
        requirements: ['html', 'css', 'javascript', 'react', 'node.js']
      },
      {
        name: 'api-development',
        description: 'RESTful API and backend service development',
        requirements: ['node.js', 'express', 'database', 'authentication']
      },
      {
        name: 'database-design',
        description: 'Database schema design and migration scripts',
        requirements: ['sql', 'nosql', 'data-modeling']
      },
      {
        name: 'testing-automation',
        description: 'Unit testing, integration testing, and E2E testing',
        requirements: ['jest', 'playwright', 'cypress', 'vitest']
      },
      {
        name: 'devops-deployment',
        description: 'CI/CD, containerization, and cloud deployment',
        requirements: ['docker', 'github-actions', 'cloud-platforms']
      },
      {
        name: 'ui-ux-design',
        description: 'User interface and user experience design',
        requirements: ['design-systems', 'responsive-design', 'accessibility']
      }
    ];

    // Store as default capabilities
    this.agentCapabilities.set('default', standardCapabilities);
  }

  // Create execution plan from Grok analysis
  async createExecutionPlan(
    grokAnalysis: any, 
    projectContext: any
  ): Promise<TaskExecutionPlan> {
    const planId = this.generateId();
    
    // Convert Grok tasks to Claude Code tasks
    const tasks = await this.convertToClaudeCodeTasks(grokAnalysis.tasks, projectContext);
    
    // Build dependency graph
    const dependencies = this.buildDependencyGraph(tasks, grokAnalysis.tasks);
    
    // Determine required capabilities
    const requiredCapabilities = this.analyzeRequiredCapabilities(grokAnalysis);
    
    // Calculate estimated duration
    const estimatedDuration = this.calculateEstimatedDuration(tasks);
    
    // Check if tasks can be parallelized
    const parallelizable = this.canParallelize(dependencies);

    const plan: TaskExecutionPlan = {
      id: planId,
      tasks,
      dependencies,
      priority: projectContext.priority || 'medium',
      estimatedDuration,
      requiredCapabilities,
      parallelizable
    };

    this.executionPlans.set(planId, plan);
    
    this.emit('planCreated', plan);
    
    return plan;
  }

  // Execute task plan with remote agents
  async executePlan(planId: string): Promise<ExecutionResult> {
    const plan = this.executionPlans.get(planId);
    if (!plan) {
      throw new Error(`Execution plan ${planId} not found`);
    }

    const startTime = Date.now();
    const result: ExecutionResult = {
      planId,
      success: false,
      results: new Map(),
      errors: new Map(),
      executionTime: 0,
      agentsUsed: []
    };

    this.activeExecutions.set(planId, result);
    this.emit('executionStarted', { planId, plan });

    try {
      if (plan.parallelizable) {
        await this.executeParallel(plan, result);
      } else {
        await this.executeSequential(plan, result);
      }

      result.success = result.errors.size === 0;
      result.executionTime = Date.now() - startTime;

      this.emit('executionCompleted', result);
      
      return result;

    } catch (error) {
      result.errors.set('execution', error as Error);
      result.executionTime = Date.now() - startTime;
      
      this.emit('executionFailed', { planId, error });
      
      throw error;
    } finally {
      this.activeExecutions.delete(planId);
    }
  }

  // Execute tasks in parallel
  private async executeParallel(plan: TaskExecutionPlan, result: ExecutionResult) {
    const taskGroups = this.groupTasksByDependencies(plan.tasks, plan.dependencies);
    
    for (const taskGroup of taskGroups) {
      const promises = taskGroup.map(task => this.executeTaskWithAgent(task, result));
      
      try {
        await Promise.allSettled(promises);
        this.emit('taskGroupCompleted', { planId: plan.id, groupSize: taskGroup.length });
      } catch (error) {
        console.error('Error in parallel task group execution:', error);
      }
    }
  }

  // Execute tasks sequentially
  private async executeSequential(plan: TaskExecutionPlan, result: ExecutionResult) {
    const sortedTasks = this.topologicalSort(plan.tasks, plan.dependencies);
    
    for (const task of sortedTasks) {
      try {
        await this.executeTaskWithAgent(task, result);
        this.emit('taskCompleted', { planId: plan.id, taskId: task.id });
      } catch (error) {
        console.error(`Task ${task.id} failed:`, error);
        result.errors.set(task.id, error as Error);
        
        // Decide whether to continue or abort
        if (task.priority === 'high') {
          throw error; // Abort on high priority task failure
        }
      }
    }
  }

  // Execute individual task with best available agent
  private async executeTaskWithAgent(task: ClaudeCodeTask, result: ExecutionResult): Promise<void> {
    try {
      // Select best agent for this task
      const agent = await this.selectBestAgent(task);
      
      if (!agent) {
        // Fallback to local execution
        const response = await claudeCodeAPI.executeTask(task);
        result.results.set(task.id, response);
        result.agentsUsed.push('local');
        return;
      }

      // Execute with remote agent
      const response = await claudeCodeAPI.executeTask(task);
      result.results.set(task.id, response);
      result.agentsUsed.push(agent.id);
      
      // Update agent performance metrics
      this.updateAgentMetrics(agent.id, response);

    } catch (error) {
      result.errors.set(task.id, error as Error);
      throw error;
    }
  }

  // Select best agent for task based on routing strategy
  private async selectBestAgent(task: ClaudeCodeTask): Promise<RemoteAgentStatus | null> {
    const availableAgents = await claudeCodeAPI.getRemoteAgentStatus()
      .then(agents => agents.filter(agent => agent.status === 'connected'));

    if (availableAgents.length === 0) {
      return null;
    }

    switch (this.routingStrategy.strategy) {
      case 'capability-matched':
        return this.selectByCapabilities(availableAgents, task);
      
      case 'load-balanced':
        return this.selectByLoadBalance(availableAgents);
      
      case 'priority-weighted':
        return this.selectByPriority(availableAgents, task);
      
      case 'round-robin':
      default:
        return availableAgents[0]; // Simple round-robin
    }
  }

  // Select agent by capability matching
  private selectByCapabilities(agents: RemoteAgentStatus[], task: ClaudeCodeTask): RemoteAgentStatus | null {
    // Score agents based on capability match
    const scoredAgents = agents.map(agent => {
      let score = 0;
      
      // Check if agent capabilities match task requirements
      const taskCapabilities = this.inferTaskCapabilities(task);
      for (const cap of taskCapabilities) {
        if (agent.capabilities.includes(cap)) {
          score += 10;
        }
      }
      
      // Bonus for specialized agents
      if (taskCapabilities.length > 0 && 
          agent.capabilities.some(cap => taskCapabilities.includes(cap))) {
        score += 5;
      }
      
      return { agent, score };
    });

    // Return agent with highest score
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents.length > 0 ? scoredAgents[0].agent : null;
  }

  // Select agent by load balance
  private selectByLoadBalance(agents: RemoteAgentStatus[]): RemoteAgentStatus {
    // Simple implementation: return agent with no current task
    const idleAgents = agents.filter(agent => !agent.currentTask);
    return idleAgents.length > 0 ? idleAgents[0] : agents[0];
  }

  // Select agent by priority weighting
  private selectByPriority(agents: RemoteAgentStatus[], task: ClaudeCodeTask): RemoteAgentStatus {
    // For high priority tasks, prefer agents with better performance history
    if (task.priority === 'high') {
      const performantAgents = agents.filter(agent => {
        const metrics = this.performanceMetrics.get(agent.id);
        return metrics && metrics.successRate > 0.9;
      });
      
      if (performantAgents.length > 0) {
        return performantAgents[0];
      }
    }
    
    return agents[0];
  }

  // Convert Grok tasks to Claude Code tasks
  private async convertToClaudeCodeTasks(
    grokTasks: any[], 
    projectContext: any
  ): Promise<ClaudeCodeTask[]> {
    return grokTasks.map(grokTask => ({
      id: grokTask.id,
      command: this.buildClaudeCommand(grokTask, projectContext),
      cwd: projectContext.workingDirectory || process.cwd(),
      timeout: (grokTask.estimatedHours || 1) * 60 * 60 * 1000, // Convert hours to ms
      environment: {
        CLAUDE_PROJECT: projectContext.name,
        CLAUDE_TASK_TYPE: grokTask.type,
        ...projectContext.environment
      },
      priority: grokTask.priority || 'medium'
    }));
  }

  // Build Claude Code command for task
  private buildClaudeCommand(grokTask: any, projectContext: any): string {
    const basePrompt = `
Create a ${grokTask.type} solution for: ${grokTask.title}

Description: ${grokTask.description}

Requirements:
- Follow ${projectContext.type} best practices
- Implement proper error handling
- Include comprehensive documentation
- Ensure code is production-ready
- Add appropriate tests

Project Context:
- Name: ${projectContext.name}
- Type: ${projectContext.type}
- Framework: ${projectContext.framework || 'standard'}
    `.trim();

    // Return the constructed prompt as a string
    // In a real implementation, this would enhance the prompt with Claude API
    return basePrompt;
  }

  // Infer required capabilities from task
  private inferTaskCapabilities(task: ClaudeCodeTask): string[] {
    const capabilities = [];
    
    const command = task.command.toLowerCase();
    
    if (command.includes('react') || command.includes('frontend')) {
      capabilities.push('web-development', 'ui-ux-design');
    }
    
    if (command.includes('api') || command.includes('backend')) {
      capabilities.push('api-development');
    }
    
    if (command.includes('database') || command.includes('schema')) {
      capabilities.push('database-design');
    }
    
    if (command.includes('test') || command.includes('testing')) {
      capabilities.push('testing-automation');
    }
    
    if (command.includes('deploy') || command.includes('ci')) {
      capabilities.push('devops-deployment');
    }
    
    return capabilities;
  }

  // Build dependency graph from tasks
  private buildDependencyGraph(
    claudeTasks: ClaudeCodeTask[], 
    grokTasks: any[]
  ): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();
    
    // Map Grok dependencies to Claude task IDs
    for (const grokTask of grokTasks) {
      if (grokTask.dependencies && grokTask.dependencies.length > 0) {
        dependencies.set(grokTask.id, grokTask.dependencies);
      }
    }
    
    return dependencies;
  }

  // Check if tasks can be parallelized
  private canParallelize(dependencies: Map<string, string[]>): boolean {
    return dependencies.size === 0 || 
           Array.from(dependencies.values()).every(deps => deps.length === 0);
  }

  // Group tasks by dependency levels for parallel execution
  private groupTasksByDependencies(
    tasks: ClaudeCodeTask[], 
    dependencies: Map<string, string[]>
  ): ClaudeCodeTask[][] {
    const groups: ClaudeCodeTask[][] = [];
    const processed = new Set<string>();
    
    while (processed.size < tasks.length) {
      const currentGroup: ClaudeCodeTask[] = [];
      
      for (const task of tasks) {
        if (processed.has(task.id)) continue;
        
        const taskDeps = dependencies.get(task.id) || [];
        const depsResolved = taskDeps.every(dep => processed.has(dep));
        
        if (depsResolved) {
          currentGroup.push(task);
          processed.add(task.id);
        }
      }
      
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      } else {
        break; // Circular dependency or other issue
      }
    }
    
    return groups;
  }

  // Topological sort for sequential execution
  private topologicalSort(
    tasks: ClaudeCodeTask[], 
    dependencies: Map<string, string[]>
  ): ClaudeCodeTask[] {
    const sorted: ClaudeCodeTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (taskId: string) => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task ${taskId}`);
      }
      
      if (visited.has(taskId)) return;
      
      visiting.add(taskId);
      
      const deps = dependencies.get(taskId) || [];
      for (const dep of deps) {
        visit(dep);
      }
      
      visiting.delete(taskId);
      visited.add(taskId);
      
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        sorted.push(task);
      }
    };
    
    for (const task of tasks) {
      visit(task.id);
    }
    
    return sorted;
  }

  // Analyze required capabilities from Grok analysis
  private analyzeRequiredCapabilities(grokAnalysis: any): string[] {
    const capabilities = new Set<string>();
    
    for (const task of grokAnalysis.tasks) {
      switch (task.type) {
        case 'frontend':
          capabilities.add('web-development');
          capabilities.add('ui-ux-design');
          break;
        case 'backend':
          capabilities.add('api-development');
          break;
        case 'database':
          capabilities.add('database-design');
          break;
        case 'testing':
          capabilities.add('testing-automation');
          break;
        case 'devops':
          capabilities.add('devops-deployment');
          break;
      }
    }
    
    return Array.from(capabilities);
  }

  // Calculate estimated duration
  private calculateEstimatedDuration(tasks: ClaudeCodeTask[]): number {
    return tasks.reduce((total, task) => {
      return total + (task.timeout || 3600000); // Default 1 hour per task
    }, 0);
  }

  // Update agent performance metrics
  private updateAgentMetrics(agentId: string, response: ClaudeCodeResponse) {
    let metrics = this.performanceMetrics.get(agentId) || {
      totalTasks: 0,
      successfulTasks: 0,
      avgExecutionTime: 0,
      successRate: 0,
      lastUpdated: new Date()
    };

    metrics.totalTasks++;
    if (response.success) {
      metrics.successfulTasks++;
    }
    
    metrics.successRate = metrics.successfulTasks / metrics.totalTasks;
    metrics.avgExecutionTime = (metrics.avgExecutionTime + response.executionTime) / 2;
    metrics.lastUpdated = new Date();
    
    this.performanceMetrics.set(agentId, metrics);
  }

  // Start performance monitoring
  private startPerformanceMonitoring() {
    setInterval(() => {
      this.emit('performanceUpdate', {
        agents: Object.fromEntries(this.performanceMetrics),
        timestamp: new Date().toISOString()
      });
    }, 60000); // Update every minute
  }

  // Generate unique ID
  private generateId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set routing strategy
  setRoutingStrategy(strategy: TaskRoutingStrategy) {
    this.routingStrategy = strategy;
    this.emit('routingStrategyChanged', strategy);
  }

  // Get coordination statistics
  getCoordinationStats() {
    return {
      totalPlans: this.executionPlans.size,
      activePlans: this.activeExecutions.size,
      agentMetrics: Object.fromEntries(this.performanceMetrics),
      routingStrategy: this.routingStrategy,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const remoteAgentCoordinator = new RemoteAgentCoordinator();