/**
 * GitHub Agent Swarm with UltraThink Integration
 * Multi-Agent Architecture for GitHub Operations
 * Uses REST API instead of CLI for Appwrite compatibility
 */

// Agent Swarm Configuration
const AGENT_SWARM = {
  // Repository Management Agent
  REPO_AGENT: {
    id: 'repo-specialist',
    capabilities: ['create', 'fork', 'clone', 'delete', 'list', 'update'],
    expertise: 'Repository lifecycle management'
  },
  // Pull Request Agent
  PR_AGENT: {
    id: 'pr-specialist',
    capabilities: ['create', 'review', 'merge', 'comment', 'approve'],
    expertise: 'Pull request workflow automation'
  },
  // Issue Tracking Agent
  ISSUE_AGENT: {
    id: 'issue-specialist',
    capabilities: ['create', 'assign', 'label', 'close', 'comment'],
    expertise: 'Issue management and triage'
  },
  // Workflow Agent
  WORKFLOW_AGENT: {
    id: 'workflow-specialist',
    capabilities: ['trigger', 'monitor', 'cancel', 'retry'],
    expertise: 'GitHub Actions orchestration'
  },
  // Security Agent
  SECURITY_AGENT: {
    id: 'security-specialist',
    capabilities: ['scan', 'audit', 'dependabot', 'secrets'],
    expertise: 'Security and compliance'
  }
};

// UltraThink Reasoning Engine
class UltraThink {
  constructor() {
    this.reasoning = [];
    this.confidence = 0;
  }

  async analyze(command, context) {
    const analysis = {
      intent: this.detectIntent(command),
      complexity: this.assessComplexity(command),
      agents: this.selectAgents(command),
      strategy: this.formStrategy(command, context),
      risks: this.assessRisks(command),
      alternatives: this.generateAlternatives(command)
    };
    
    this.reasoning.push({
      timestamp: new Date().toISOString(),
      command,
      analysis
    });
    
    return analysis;
  }

  detectIntent(command) {
    const intents = {
      'create': /create|new|init/i,
      'read': /list|get|show|view|status/i,
      'update': /update|edit|modify|change/i,
      'delete': /delete|remove|destroy/i,
      'merge': /merge|pr|pull/i,
      'deploy': /deploy|release|publish/i
    };
    
    for (const [intent, pattern] of Object.entries(intents)) {
      if (pattern.test(command)) return intent;
    }
    return 'unknown';
  }

  assessComplexity(command) {
    const factors = {
      multiStep: command.includes('&&') || command.includes(';'),
      crossRepo: command.includes('/'),
      bulk: command.includes('all') || command.includes('bulk'),
      conditional: command.includes('if') || command.includes('when')
    };
    
    const score = Object.values(factors).filter(Boolean).length;
    return {
      score,
      level: score === 0 ? 'simple' : score <= 2 ? 'moderate' : 'complex',
      factors
    };
  }

  selectAgents(command) {
    const agents = [];
    
    if (/repo|repository/i.test(command)) agents.push(AGENT_SWARM.REPO_AGENT);
    if (/pr|pull|merge/i.test(command)) agents.push(AGENT_SWARM.PR_AGENT);
    if (/issue|bug|feature/i.test(command)) agents.push(AGENT_SWARM.ISSUE_AGENT);
    if (/workflow|action|ci|cd/i.test(command)) agents.push(AGENT_SWARM.WORKFLOW_AGENT);
    if (/security|secret|vulnerability/i.test(command)) agents.push(AGENT_SWARM.SECURITY_AGENT);
    
    if (agents.length === 0) agents.push(AGENT_SWARM.REPO_AGENT); // Default
    
    return agents;
  }

  formStrategy(command, context) {
    const complexity = this.assessComplexity(command);
    
    if (complexity.level === 'simple') {
      return { approach: 'direct', steps: 1, parallel: false };
    } else if (complexity.level === 'moderate') {
      return { approach: 'sequential', steps: 2-3, parallel: true };
    } else {
      return { approach: 'orchestrated', steps: '4+', parallel: true };
    }
  }

  assessRisks(command) {
    const risks = [];
    
    if (/delete|remove|destroy/i.test(command)) {
      risks.push({ level: 'high', type: 'data-loss', mitigation: 'backup-first' });
    }
    if (/force|f\s/i.test(command)) {
      risks.push({ level: 'medium', type: 'override', mitigation: 'confirm-action' });
    }
    if (/public/i.test(command)) {
      risks.push({ level: 'low', type: 'visibility', mitigation: 'privacy-check' });
    }
    
    return risks;
  }

  generateAlternatives(command) {
    const alternatives = [];
    
    if (command.includes('gh ')) {
      alternatives.push({
        original: command,
        api: command.replace(/gh\s+/, ''),
        reason: 'Using REST API instead of CLI'
      });
    }
    
    return alternatives;
  }
}

// GitHub API Client
class GitHubAPIClient {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
    this.headers = {
      'Authorization': token ? `token ${token}` : '',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: this.headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    try {
      // Add 30 second timeout protection
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      options.signal = controller.signal;
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `GitHub API error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      // Handle timeout errors specifically
      if (error.name === 'AbortError') {
        throw new Error('GitHub API request timed out. Please try again.');
      }
      throw error;
    }
  }

  // Repository operations
  async createRepo(name, options = {}) {
    return this.request('POST', '/user/repos', {
      name,
      description: options.description || '',
      private: options.private || false,
      auto_init: options.autoInit || true,
      ...options
    });
  }

  async listRepos(options = {}) {
    const params = new URLSearchParams({
      per_page: options.limit || 30,
      sort: options.sort || 'updated',
      direction: options.direction || 'desc'
    });
    return this.request('GET', `/user/repos?${params}`);
  }

  async getRepo(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}`);
  }

  async deleteRepo(owner, repo) {
    return this.request('DELETE', `/repos/${owner}/${repo}`);
  }

  // Pull Request operations
  async createPR(owner, repo, options) {
    return this.request('POST', `/repos/${owner}/${repo}/pulls`, options);
  }

  async listPRs(owner, repo, options = {}) {
    const params = new URLSearchParams(options);
    return this.request('GET', `/repos/${owner}/${repo}/pulls?${params}`);
  }

  async mergePR(owner, repo, number) {
    return this.request('PUT', `/repos/${owner}/${repo}/pulls/${number}/merge`);
  }

  // Issue operations
  async createIssue(owner, repo, options) {
    return this.request('POST', `/repos/${owner}/${repo}/issues`, options);
  }

  async listIssues(owner, repo, options = {}) {
    const params = new URLSearchParams(options);
    return this.request('GET', `/repos/${owner}/${repo}/issues?${params}`);
  }

  // Workflow operations
  async triggerWorkflow(owner, repo, workflowId, ref = 'main') {
    return this.request('POST', `/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`, {
      ref
    });
  }

  async listWorkflows(owner, repo) {
    return this.request('GET', `/repos/${owner}/${repo}/actions/workflows`);
  }
}

// Command Parser and Router
class CommandRouter {
  constructor(apiClient, ultraThink) {
    this.api = apiClient;
    this.ultraThink = ultraThink;
  }

  async route(command, context = {}) {
    // Analyze command with UltraThink
    const analysis = await this.ultraThink.analyze(command, context);
    
    // Parse command components
    const parsed = this.parseCommand(command);
    
    // Route to appropriate handler
    switch (parsed.action) {
      case 'repo':
        return this.handleRepoCommand(parsed, analysis);
      case 'pr':
        return this.handlePRCommand(parsed, analysis);
      case 'issue':
        return this.handleIssueCommand(parsed, analysis);
      case 'workflow':
        return this.handleWorkflowCommand(parsed, analysis);
      default:
        return this.handleGenericCommand(parsed, analysis);
    }
  }

  parseCommand(command) {
    // Remove 'gh' prefix if present
    const cleanCommand = command.replace(/^gh\s+/, '');
    const parts = cleanCommand.split(/\s+/);
    
    return {
      action: parts[0],
      subAction: parts[1],
      args: parts.slice(2),
      raw: command,
      clean: cleanCommand
    };
  }

  async handleRepoCommand(parsed, analysis) {
    const { subAction, args } = parsed;
    
    switch (subAction) {
      case 'create':
        const name = args[0];
        const options = this.parseArgs(args.slice(1));
        return await this.api.createRepo(name, options);
        
      case 'list':
        const listOptions = this.parseArgs(args);
        return await this.api.listRepos(listOptions);
        
      case 'delete':
        const [owner, repo] = args[0].split('/');
        return await this.api.deleteRepo(owner, repo);
        
      default:
        throw new Error(`Unknown repo command: ${subAction}`);
    }
  }

  async handlePRCommand(parsed, analysis) {
    const { subAction, args } = parsed;
    
    switch (subAction) {
      case 'create':
        const [owner, repo] = this.extractOwnerRepo(args);
        const options = this.parseArgs(args.slice(1));
        return await this.api.createPR(owner, repo, options);
        
      case 'list':
        const [listOwner, listRepo] = this.extractOwnerRepo(args);
        return await this.api.listPRs(listOwner, listRepo);
        
      case 'merge':
        const [mergeOwner, mergeRepo] = this.extractOwnerRepo(args);
        const prNumber = args.find(arg => /^\d+$/.test(arg));
        return await this.api.mergePR(mergeOwner, mergeRepo, prNumber);
        
      default:
        throw new Error(`Unknown PR command: ${subAction}`);
    }
  }

  async handleIssueCommand(parsed, analysis) {
    const { subAction, args } = parsed;
    
    switch (subAction) {
      case 'create':
        const [owner, repo] = this.extractOwnerRepo(args);
        const options = this.parseArgs(args.slice(1));
        return await this.api.createIssue(owner, repo, options);
        
      case 'list':
        const [listOwner, listRepo] = this.extractOwnerRepo(args);
        return await this.api.listIssues(listOwner, listRepo);
        
      default:
        throw new Error(`Unknown issue command: ${subAction}`);
    }
  }

  async handleWorkflowCommand(parsed, analysis) {
    const { subAction, args } = parsed;
    
    switch (subAction) {
      case 'run':
        const [owner, repo] = this.extractOwnerRepo(args);
        const workflowId = args.find(arg => arg.includes('.yml'));
        return await this.api.triggerWorkflow(owner, repo, workflowId);
        
      case 'list':
        const [listOwner, listRepo] = this.extractOwnerRepo(args);
        return await this.api.listWorkflows(listOwner, listRepo);
        
      default:
        throw new Error(`Unknown workflow command: ${subAction}`);
    }
  }

  async handleGenericCommand(parsed, analysis) {
    // Fallback to user info for unknown commands
    return await this.api.request('GET', '/user');
  }

  extractOwnerRepo(args) {
    const repoArg = args.find(arg => arg.includes('/'));
    if (repoArg) {
      return repoArg.split('/');
    }
    // Default to current user
    return ['', args[0]];
  }

  parseArgs(args) {
    const options = {};
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg.startsWith('--')) {
        const key = arg.slice(2);
        const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
        options[this.camelCase(key)] = value;
      }
    }
    
    return options;
  }

  camelCase(str) {
    return str.replace(/-([a-z])/g, g => g[1].toUpperCase());
  }
}

// Import DiagnosticLogger
import DiagnosticLogger from './diagnostics.js';

// Main Function Handler
export default async ({ req, res, log, error }) => {
  // Initialize diagnostic logger
  const diagnostics = new DiagnosticLogger();
  
  // Run initial diagnostics
  diagnostics.log('INIT', 'Function started', {
    requestId: req.headers?.['x-request-id'] || 'unknown',
    method: req.method,
    path: req.path
  });
  
  // Check environment on startup
  const envCheck = await diagnostics.checkEnvironment();
  
  // Initialize UltraThink
  const ultraThink = new UltraThink();
  
  try {
    // Parse request body
    let body;
    try {
      const bodyData = req.body || '{}';
      body = typeof bodyData === 'string' ? JSON.parse(bodyData) : bodyData;
    } catch (e) {
      return res.json({
        success: false,
        error: 'Invalid JSON in request body',
        agent: 'error-handler'
      }, 400);
    }
    
    const { command, token, context = {} } = body;
    
    if (!command) {
      return res.json({
        success: false,
        error: 'Missing command in request body',
        agent: 'validation-agent'
      }, 400);
    }
    
    // Get GitHub token from environment or request
    const githubToken = token || process.env.GITHUB_TOKEN;
    
    if (!githubToken) {
      diagnostics.log('AUTH_ERROR', 'No GitHub token found', {
        checkedEnv: 'GITHUB_TOKEN',
        tokenFromRequest: !!token,
        envVarsAvailable: Object.keys(process.env).filter(k => k.includes('GITHUB') || k.includes('TOKEN'))
      });
      
      log('Warning: No GitHub token provided');
      return res.json({
        success: false,
        error: 'GitHub token not configured. Add GITHUB_TOKEN to function environment variables.',
        suggestion: 'Get a token from https://github.com/settings/tokens',
        agent: 'auth-agent',
        diagnostics: diagnostics.generateReport()
      }, 401);
    }
    
    diagnostics.log('AUTH', 'GitHub token found', {
      tokenLength: githubToken.length,
      tokenPrefix: githubToken.substring(0, 4)
    });
    
    // Initialize GitHub API client
    const apiClient = new GitHubAPIClient(githubToken);
    
    // Initialize command router
    const router = new CommandRouter(apiClient, ultraThink);
    
    // Log with agent context
    log(`[AGENT-SWARM] Processing command: ${command}`);
    
    // Route and execute command
    const result = await router.route(command, context);
    
    // Get reasoning from UltraThink
    const reasoning = ultraThink.reasoning[ultraThink.reasoning.length - 1];
    
    // Success response with agent metadata
    return res.json({
      success: true,
      command,
      result,
      agents: reasoning.analysis.agents.map(a => a.id),
      reasoning: reasoning.analysis,
      ultraThink: {
        confidence: ultraThink.confidence,
        strategy: reasoning.analysis.strategy,
        risks: reasoning.analysis.risks
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    // Diagnose the error
    const errorDiagnosis = diagnostics.diagnoseError(err);
    
    diagnostics.log('ERROR', 'Function execution failed', {
      error: err.message,
      stack: err.stack,
      diagnosis: errorDiagnosis
    });
    
    error(`[AGENT-SWARM] Error: ${err.message}`);
    
    // Enhanced error response with diagnostics
    return res.json({
      success: false,
      command: body?.command,
      error: err.message,
      errorType: err.code || 'EXECUTION_ERROR',
      agent: 'error-recovery-agent',
      diagnosis: errorDiagnosis,
      suggestions: [
        'Check GitHub token permissions',
        'Verify repository exists',
        'Ensure correct command syntax'
      ],
      diagnostics: diagnostics.generateReport(),
      timestamp: new Date().toISOString()
    }, 500);
  }
};

// Export agent configuration for orchestrator
export const agentConfig = AGENT_SWARM;
export const capabilities = {
  ultraThink: true,
  agentSwarm: true,
  apiDriven: true,
  cliCompatible: false
};